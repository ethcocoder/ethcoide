/**
 * Property-based tests for Context Engine Token Management
 * Property 15: Context Collection and Token Management
 * Validates: Requirements 6.1, 6.2
 */

import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ContextEngine, ContextConfig } from '../ai/context-engine';
import { FileSystemService } from '../services/file-service';
import { ProjectService } from '../services/project-service';
import { ProjectContext, FileInfo } from '../types/ipc-messages';

// Test directory for context operations
const TEST_DIR = path.join(__dirname, '../../test-files');

describe('Context Engine Token Management - Property Tests', () => {
  let contextEngine: ContextEngine;
  let fileService: FileSystemService;
  let projectService: ProjectService;

  beforeAll(async () => {
    fileService = new FileSystemService();
    projectService = new ProjectService();
    
    // Ensure test directory exists
    try {
      await fs.mkdir(TEST_DIR, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  });

  afterAll(async () => {
    // Clean up test directory
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
    } catch (error) {
      console.warn('Could not clean up test directory:', error);
    }
    
    // Stop all watchers
    await fileService.stopAllWatchers();
  });

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      await fs.mkdir(TEST_DIR, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
    
    // Stop all watchers to prevent interference
    await fileService.stopAllWatchers();
    
    // Create context engine with default config
    contextEngine = new ContextEngine(fileService, projectService);
  });

  describe('Property 15: Context Collection and Token Management', () => {
    test('should never exceed maximum file limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 10 }), // maxFiles
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              content: fc.string({ maxLength: 500 }),
              extension: fc.constantFrom('.ts', '.js', '.py', '.java', '.cpp')
            }),
            { minLength: 5, maxLength: 20 }
          ),
          async (maxFiles, fileSpecs) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `token-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            // Update context engine config
            contextEngine.updateConfig({ maxFiles });
            
            // Create test files
            const createdFiles: string[] = [];
            for (let i = 0; i < fileSpecs.length; i++) {
              const spec = fileSpecs[i];
              const fileName = `${spec.name}-${i}${spec.extension}`;
              const filePath = path.join(testProjectDir, fileName);
              
              await fs.writeFile(filePath, spec.content);
              createdFiles.push(filePath);
            }
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context using the first file as current file
            if (createdFiles.length > 0) {
              const contextCollection = await contextEngine.collectContext(createdFiles[0]);
              
              // Should never exceed maxFiles limit
              expect(contextCollection.files.length).toBeLessThanOrEqual(maxFiles);
              
              // Should always include at least the current file (if it exists and is valid)
              expect(contextCollection.files.length).toBeGreaterThan(0);
              
              // First file should be the current file
              const currentFileRelativePath = path.relative(testProjectDir, createdFiles[0]).replace(/\\/g, '/');
              expect(contextCollection.files[0].path).toBe(currentFileRelativePath);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should never exceed maximum lines per file limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 10, max: 100 }), // maxLinesPerFile
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              lineCount: fc.integer({ min: 50, max: 300 }),
              extension: fc.constantFrom('.ts', '.js', '.py')
            }),
            { minLength: 1, maxLength: 5 }
          ),
          async (maxLinesPerFile, fileSpecs) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `lines-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            // Update context engine config
            contextEngine.updateConfig({ maxLinesPerFile });
            
            // Create test files with specific line counts
            const createdFiles: string[] = [];
            for (let i = 0; i < fileSpecs.length; i++) {
              const spec = fileSpecs[i];
              const fileName = `${spec.name}-${i}${spec.extension}`;
              const filePath = path.join(testProjectDir, fileName);
              
              // Generate content with exact line count
              const lines = Array.from({ length: spec.lineCount }, (_, lineIndex) => 
                `// Line ${lineIndex + 1} in ${fileName}`
              );
              const content = lines.join('\n');
              
              await fs.writeFile(filePath, content);
              createdFiles.push(filePath);
            }
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context using the first file as current file
            if (createdFiles.length > 0) {
              const contextCollection = await contextEngine.collectContext(createdFiles[0]);
              
              // Each file should not exceed maxLinesPerFile limit
              contextCollection.files.forEach(contextFile => {
                expect(contextFile.lines).toBeLessThanOrEqual(maxLinesPerFile);
                
                // If file was truncated, it should be marked as such
                if (contextFile.truncated) {
                  expect(contextFile.lines).toBe(maxLinesPerFile);
                  expect(contextFile.content).toContain('// ... (file truncated)');
                }
              });
            }
          }
        ),
        { numRuns: 25 }
      );
    });

    test('should respect total token limit', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1000, max: 5000 }), // maxTotalTokens
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              contentLength: fc.integer({ min: 100, max: 2000 }),
              extension: fc.constantFrom('.ts', '.js', '.py')
            }),
            { minLength: 3, maxLength: 10 }
          ),
          async (maxTotalTokens, fileSpecs) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `tokens-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            // Update context engine config
            contextEngine.updateConfig({ 
              maxTotalTokens,
              maxFiles: 10, // Allow more files to test token limiting
              maxLinesPerFile: 500 // Allow more lines to test token limiting
            });
            
            // Create test files with specific content lengths
            const createdFiles: string[] = [];
            for (let i = 0; i < fileSpecs.length; i++) {
              const spec = fileSpecs[i];
              const fileName = `${spec.name}-${i}${spec.extension}`;
              const filePath = path.join(testProjectDir, fileName);
              
              // Generate content with specific length
              const content = 'a'.repeat(spec.contentLength);
              
              await fs.writeFile(filePath, content);
              createdFiles.push(filePath);
            }
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context using the first file as current file
            if (createdFiles.length > 0) {
              const contextCollection = await contextEngine.collectContext(createdFiles[0]);
              
              // Total estimated tokens should not exceed limit
              expect(contextCollection.estimatedTokens).toBeLessThanOrEqual(maxTotalTokens);
              
              // Should have at least one file (the current file)
              expect(contextCollection.files.length).toBeGreaterThan(0);
              
              // If truncated, it should be marked as such
              if (contextCollection.truncated) {
                // When truncated, we should be close to the token limit
                expect(contextCollection.estimatedTokens).toBeGreaterThan(maxTotalTokens * 0.5);
              }
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should maintain consistent token estimation', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 10, maxLength: 1000 }),
          async (content) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `estimation-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            const fileName = 'test-file.ts';
            const filePath = path.join(testProjectDir, fileName);
            
            await fs.writeFile(filePath, content);
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context multiple times
            const contextCollection1 = await contextEngine.collectContext(filePath);
            const contextCollection2 = await contextEngine.collectContext(filePath);
            
            // Token estimation should be consistent
            expect(contextCollection1.estimatedTokens).toBe(contextCollection2.estimatedTokens);
            
            // Token estimation should be reasonable (roughly 1 token per 4 characters)
            const expectedTokens = Math.ceil(content.length / 4);
            const actualTokens = contextCollection1.files[0].estimatedTokens;
            
            // Allow some variance in token estimation (±50%)
            expect(actualTokens).toBeGreaterThan(expectedTokens * 0.5);
            expect(actualTokens).toBeLessThan(expectedTokens * 1.5);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should enforce exclusion patterns consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              shouldExclude: fc.boolean(),
              content: fc.string({ maxLength: 200 })
            }),
            { minLength: 2, maxLength: 8 }
          ),
          async (fileSpecs) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `exclusion-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            // Create node_modules directory (should be excluded)
            const nodeModulesDir = path.join(testProjectDir, 'node_modules');
            await fs.mkdir(nodeModulesDir, { recursive: true });
            
            const createdFiles: Array<{path: string; shouldExclude: boolean}> = [];
            let currentFilePath: string | null = null;
            
            for (let i = 0; i < fileSpecs.length; i++) {
              const spec = fileSpecs[i];
              let fileName: string;
              let filePath: string;
              
              if (spec.shouldExclude) {
                // Create files that should be excluded
                const excludeType = i % 4;
                switch (excludeType) {
                  case 0:
                    fileName = `${spec.name}.min.js`; // Minified file
                    filePath = path.join(testProjectDir, fileName);
                    break;
                  case 1:
                    fileName = `${spec.name}.js`;
                    filePath = path.join(nodeModulesDir, fileName); // In node_modules
                    break;
                  case 2:
                    fileName = `${spec.name}.log`; // Log file
                    filePath = path.join(testProjectDir, fileName);
                    break;
                  default:
                    fileName = `${spec.name}.map`; // Source map
                    filePath = path.join(testProjectDir, fileName);
                }
              } else {
                // Create files that should be included
                fileName = `${spec.name}.ts`;
                filePath = path.join(testProjectDir, fileName);
                
                // Use first non-excluded file as current file
                if (!currentFilePath) {
                  currentFilePath = filePath;
                }
              }
              
              await fs.writeFile(filePath, spec.content);
              createdFiles.push({ path: filePath, shouldExclude: spec.shouldExclude });
            }
            
            // If no non-excluded files, create one
            if (!currentFilePath) {
              currentFilePath = path.join(testProjectDir, 'main.ts');
              await fs.writeFile(currentFilePath, 'console.log("main");');
            }
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context
            const contextCollection = await contextEngine.collectContext(currentFilePath);
            
            // Check that excluded files are not included
            const includedPaths = contextCollection.files.map(f => path.join(testProjectDir, f.path));
            
            createdFiles.forEach(({ path: filePath, shouldExclude }) => {
              if (shouldExclude) {
                expect(includedPaths).not.toContain(filePath);
              }
            });
            
            // Should have at least the current file
            expect(contextCollection.files.length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should prioritize current file and imports correctly', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              hasImport: fc.boolean(),
              content: fc.string({ maxLength: 300 })
            }),
            { minLength: 2, maxLength: 6 }
          ),
          async (fileSpecs) => {
            // Create unique test directory
            const testProjectDir = path.join(TEST_DIR, `priority-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fs.mkdir(testProjectDir, { recursive: true });
            
            const createdFiles: string[] = [];
            let mainFilePath: string | null = null;
            let importedFilePath: string | null = null;
            
            // Create files
            for (let i = 0; i < fileSpecs.length; i++) {
              const spec = fileSpecs[i];
              const fileName = `${spec.name}-${i}.ts`;
              const filePath = path.join(testProjectDir, fileName);
              
              let content = spec.content;
              
              if (i === 0) {
                // First file is the main file
                mainFilePath = filePath;
                
                // Add import to second file if it exists and hasImport is true
                if (fileSpecs.length > 1 && spec.hasImport) {
                  const importFileName = `${fileSpecs[1].name}-1`;
                  content = `import { something } from './${importFileName}';\n${content}`;
                  importedFilePath = path.join(testProjectDir, `${importFileName}.ts`);
                }
              }
              
              await fs.writeFile(filePath, content);
              createdFiles.push(filePath);
            }
            
            if (!mainFilePath) return; // Skip if no files created
            
            // Load project
            await projectService.loadProject(testProjectDir);
            
            // Collect context using main file
            const contextCollection = await contextEngine.collectContext(mainFilePath);
            
            // Should have at least one file
            expect(contextCollection.files.length).toBeGreaterThan(0);
            
            // First file should be the current file
            const mainFileRelativePath = path.relative(testProjectDir, mainFilePath).replace(/\\/g, '/');
            expect(contextCollection.files[0].path).toBe(mainFileRelativePath);
            
            // If there was an import and the imported file exists, it should be included
            if (importedFilePath && contextCollection.files.length > 1) {
              const importedFileRelativePath = path.relative(testProjectDir, importedFilePath).replace(/\\/g, '/');
              const includedPaths = contextCollection.files.map(f => f.path);
              expect(includedPaths).toContain(importedFileRelativePath);
            }
          }
        ),
        { numRuns: 25 }
      );
    });

    test('should handle edge cases in token management', async () => {
      // Test with empty files
      const testProjectDir = path.join(TEST_DIR, `edge-test-${Date.now()}`);
      await fs.mkdir(testProjectDir, { recursive: true });
      
      // Create empty file
      const emptyFilePath = path.join(testProjectDir, 'empty.ts');
      await fs.writeFile(emptyFilePath, '');
      
      // Create very small file
      const smallFilePath = path.join(testProjectDir, 'small.ts');
      await fs.writeFile(smallFilePath, 'a');
      
      // Load project
      await projectService.loadProject(testProjectDir);
      
      // Test with empty file
      const emptyContext = await contextEngine.collectContext(emptyFilePath);
      expect(emptyContext.files.length).toBeGreaterThan(0);
      expect(emptyContext.files[0].lines).toBe(1); // Empty file still has 1 line
      expect(emptyContext.estimatedTokens).toBeGreaterThanOrEqual(0);
      
      // Test with small file
      const smallContext = await contextEngine.collectContext(smallFilePath);
      expect(smallContext.files.length).toBeGreaterThan(0);
      expect(smallContext.estimatedTokens).toBeGreaterThan(0);
    });

    test('should maintain configuration consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            maxFiles: fc.integer({ min: 1, max: 10 }),
            maxLinesPerFile: fc.integer({ min: 10, max: 200 }),
            maxTotalTokens: fc.integer({ min: 500, max: 5000 }),
            includeImports: fc.boolean()
          }),
          async (config) => {
            // Update configuration
            contextEngine.updateConfig(config);
            
            // Get configuration back
            const retrievedConfig = contextEngine.getConfig();
            
            // Configuration should match what was set
            expect(retrievedConfig.maxFiles).toBe(config.maxFiles);
            expect(retrievedConfig.maxLinesPerFile).toBe(config.maxLinesPerFile);
            expect(retrievedConfig.maxTotalTokens).toBe(config.maxTotalTokens);
            expect(retrievedConfig.includeImports).toBe(config.includeImports);
            
            // Should maintain other default values
            expect(retrievedConfig.excludePatterns).toBeDefined();
            expect(Array.isArray(retrievedConfig.excludePatterns)).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle non-existent current file gracefully', async () => {
      const testProjectDir = path.join(TEST_DIR, `nonexistent-test-${Date.now()}`);
      await fs.mkdir(testProjectDir, { recursive: true });
      
      // Load empty project
      await projectService.loadProject(testProjectDir);
      
      const nonExistentPath = path.join(testProjectDir, 'does-not-exist.ts');
      
      // Should handle gracefully
      await expect(contextEngine.collectContext(nonExistentPath)).rejects.toThrow();
    });

    test('should handle project with no files', async () => {
      const testProjectDir = path.join(TEST_DIR, `empty-project-test-${Date.now()}`);
      await fs.mkdir(testProjectDir, { recursive: true });
      
      // Load empty project
      await projectService.loadProject(testProjectDir);
      
      // Create a single file to use as current file
      const singleFilePath = path.join(testProjectDir, 'only.ts');
      await fs.writeFile(singleFilePath, 'console.log("only file");');
      
      const contextCollection = await contextEngine.collectContext(singleFilePath);
      
      expect(contextCollection.files.length).toBe(1);
      expect(contextCollection.files[0].path).toBe('only.ts');
    });

    test('should handle very restrictive limits', async () => {
      const testProjectDir = path.join(TEST_DIR, `restrictive-test-${Date.now()}`);
      await fs.mkdir(testProjectDir, { recursive: true });
      
      // Create test file
      const testFilePath = path.join(testProjectDir, 'test.ts');
      await fs.writeFile(testFilePath, 'console.log("test");\nconsole.log("more");');
      
      // Load project
      await projectService.loadProject(testProjectDir);
      
      // Set very restrictive limits
      contextEngine.updateConfig({
        maxFiles: 1,
        maxLinesPerFile: 1,
        maxTotalTokens: 10
      });
      
      const contextCollection = await contextEngine.collectContext(testFilePath);
      
      // Should still include at least the current file (possibly truncated)
      expect(contextCollection.files.length).toBe(1);
      expect(contextCollection.files[0].lines).toBeLessThanOrEqual(1);
      expect(contextCollection.estimatedTokens).toBeLessThanOrEqual(10);
    });
  });
});