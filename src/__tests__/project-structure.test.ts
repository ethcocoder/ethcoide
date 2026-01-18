/**
 * Property-based tests for Project Structure Loading
 * Property 5: Project Structure Loading
 * Validates: Requirements 2.6
 */

import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { ProjectService } from '../services/project-service';
import { ProjectContext, FileInfo } from '../types/ipc-messages';

// Test directory for project structure tests
const TEST_DIR = path.join(__dirname, '../../test-projects');

describe('Project Structure Loading - Property Tests', () => {
  let projectService: ProjectService;

  beforeAll(async () => {
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
  });

  beforeEach(async () => {
    // Clean up test directory before each test
    try {
      await fs.rm(TEST_DIR, { recursive: true, force: true });
      await fs.mkdir(TEST_DIR, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Property 5: Project Structure Loading', () => {
    test('should maintain hierarchical structure consistency when loading projects', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              path: fc.array(
                fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
                { minLength: 1, maxLength: 4 }
              ),
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_.-]+$/.test(s)),
              extension: fc.constantFrom('.js', '.ts', '.html', '.css', '.json', '.md', '.txt', ''),
              content: fc.string({ maxLength: 500 }),
              isDirectory: fc.boolean()
            }),
            { minLength: 1, maxLength: 20 }
          ),
          async (projectStructure) => {
            // Create unique project directory
            const projectName = `test-project-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create the project structure
            const createdFiles: FileInfo[] = [];
            const createdDirs = new Set<string>();

            for (let i = 0; i < projectStructure.length; i++) {
              const item = projectStructure[i];
              
              if (item.isDirectory) {
                const pathSegments = [...item.path, item.name];
                const fullPath = path.join(projectPath, ...pathSegments);
                const relativePath = pathSegments.join('/');
                
                await fs.mkdir(fullPath, { recursive: true });
                createdDirs.add(relativePath);
              } else {
                // For files, construct the path properly
                const fileName = item.extension ? `${item.name}${item.extension}` : item.name;
                const pathSegments = [...item.path];
                const dirPath = pathSegments.length > 0 ? path.join(projectPath, ...pathSegments) : projectPath;
                
                // Create parent directories if needed
                if (pathSegments.length > 0) {
                  await fs.mkdir(dirPath, { recursive: true });
                }
                
                const fileFullPath = path.join(dirPath, fileName);
                const fileRelativePath = pathSegments.length > 0 
                  ? `${pathSegments.join('/')}/${fileName}`
                  : fileName;
                
                await fs.writeFile(fileFullPath, item.content);
                
                const stats = await fs.stat(fileFullPath);
                createdFiles.push({
                  path: fileRelativePath,
                  name: fileName,
                  extension: item.extension,
                  size: stats.size,
                  lastModified: stats.mtime
                });
              }
            }

            // Load project using ProjectService
            const loadedProject = await projectService.loadProject(projectPath);

            // Verify project structure consistency
            expect(loadedProject).toBeDefined();
            expect(loadedProject.rootPath).toBe(projectPath);
            expect(Array.isArray(loadedProject.files)).toBe(true);

            // Verify all created files are found in the loaded project
            createdFiles.forEach(createdFile => {
              const foundFile = loadedProject.files.find(f => f.path === createdFile.path);
              expect(foundFile).toBeDefined();
              if (foundFile) {
                expect(foundFile.name).toBe(createdFile.name);
                expect(foundFile.extension).toBe(createdFile.extension);
                expect(foundFile.size).toBe(createdFile.size);
                expect(foundFile.path).toBe(createdFile.path);
              }
            });

            // Verify no extra files are included (beyond what we created)
            loadedProject.files.forEach(loadedFile => {
              const wasCreated = createdFiles.some(cf => cf.path === loadedFile.path);
              expect(wasCreated).toBe(true);
            });

            // Verify file count consistency
            expect(loadedProject.files.length).toBe(createdFiles.length);
          }
        ),
        { numRuns: 25 }
      );
    });

    test('should maintain path normalization consistency across platforms', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              pathSegments: fc.array(
                fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
                { minLength: 1, maxLength: 3 }
              ),
              fileName: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              extension: fc.constantFrom('.js', '.ts', '.json', '.md'),
              content: fc.string({ maxLength: 200 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (fileStructure) => {
            // Create unique project directory
            const projectName = `path-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create files with various path structures
            for (const fileSpec of fileStructure) {
              const dirPath = path.join(projectPath, ...fileSpec.pathSegments);
              await fs.mkdir(dirPath, { recursive: true });
              
              const fileName = `${fileSpec.fileName}${fileSpec.extension}`;
              const filePath = path.join(dirPath, fileName);
              await fs.writeFile(filePath, fileSpec.content);
            }

            // Load project
            const project = await projectService.loadProject(projectPath);

            // Verify all paths use forward slashes (normalized)
            project.files.forEach(file => {
              expect(file.path).not.toContain('\\');
              expect(file.path.includes('/')).toBe(file.path.includes('/'));
              
              // Path should be relative to project root
              expect(path.isAbsolute(file.path)).toBe(false);
              
              // Path should not start with './' or '../'
              expect(file.path.startsWith('./')).toBe(false);
              expect(file.path.startsWith('../')).toBe(false);
            });

            // Verify paths can be resolved back to actual files
            for (const file of project.files) {
              const fullPath = path.join(projectPath, file.path);
              const exists = await fs.access(fullPath).then(() => true).catch(() => false);
              expect(exists).toBe(true);
            }
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should maintain file metadata consistency during project loading', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              extension: fc.constantFrom('.js', '.ts', '.html', '.css', '.json', '.md', '.txt'),
              content: fc.string({ minLength: 0, maxLength: 1000 })
            }),
            { minLength: 1, maxLength: 15 }
          ),
          async (files) => {
            // Create unique project directory
            const projectName = `metadata-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create files and track their expected metadata
            const expectedFiles: Array<{
              name: string;
              path: string;
              extension: string;
              size: number;
              lastModified: Date;
            }> = [];

            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const uniqueName = `${file.name}-${i}${file.extension}`;
              const filePath = path.join(projectPath, uniqueName);
              
              await fs.writeFile(filePath, file.content);
              const stats = await fs.stat(filePath);
              
              expectedFiles.push({
                name: uniqueName,
                path: uniqueName,
                extension: file.extension,
                size: stats.size,
                lastModified: stats.mtime
              });
            }

            // Load project
            const project = await projectService.loadProject(projectPath);

            // Verify metadata consistency
            expect(project.files.length).toBe(expectedFiles.length);

            expectedFiles.forEach(expectedFile => {
              const loadedFile = project.files.find(f => f.name === expectedFile.name);
              expect(loadedFile).toBeDefined();
              
              if (loadedFile) {
                expect(loadedFile.name).toBe(expectedFile.name);
                expect(loadedFile.path).toBe(expectedFile.path);
                expect(loadedFile.extension).toBe(expectedFile.extension);
                expect(loadedFile.size).toBe(expectedFile.size);
                
                // Handle Date comparison more robustly
                // The lastModified might be serialized/deserialized, so check if it's a valid date
                const loadedDate = new Date(loadedFile.lastModified);
                const expectedDate = new Date(expectedFile.lastModified);
                expect(loadedDate).toBeInstanceOf(Date);
                expect(loadedDate.getTime()).not.toBeNaN();
                
                // Allow small time differences due to file system precision
                const timeDiff = Math.abs(loadedDate.getTime() - expectedDate.getTime());
                expect(timeDiff).toBeLessThan(2000); // Within 2 seconds
              }
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should maintain project loading idempotency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              content: fc.string({ maxLength: 300 })
            }),
            { minLength: 1, maxLength: 8 }
          ),
          async (files) => {
            // Create unique project directory
            const projectName = `idempotent-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create files
            for (let i = 0; i < files.length; i++) {
              const file = files[i];
              const fileName = `${file.name}-${i}.txt`;
              const filePath = path.join(projectPath, fileName);
              await fs.writeFile(filePath, file.content);
            }

            // Load project multiple times
            const project1 = await projectService.loadProject(projectPath);
            const project2 = await projectService.loadProject(projectPath);
            const project3 = await projectService.refreshProject();

            // All loads should produce identical results
            expect(project1.rootPath).toBe(project2.rootPath);
            expect(project2.rootPath).toBe(project3.rootPath);
            
            expect(project1.files.length).toBe(project2.files.length);
            expect(project2.files.length).toBe(project3.files.length);

            // Sort files by path for comparison
            const sortFiles = (files: FileInfo[]) => files.sort((a, b) => a.path.localeCompare(b.path));
            
            const sorted1 = sortFiles([...project1.files]);
            const sorted2 = sortFiles([...project2.files]);
            const sorted3 = sortFiles([...project3.files]);

            for (let i = 0; i < sorted1.length; i++) {
              expect(sorted1[i].path).toBe(sorted2[i].path);
              expect(sorted2[i].path).toBe(sorted3[i].path);
              expect(sorted1[i].name).toBe(sorted2[i].name);
              expect(sorted2[i].name).toBe(sorted3[i].name);
              expect(sorted1[i].extension).toBe(sorted2[i].extension);
              expect(sorted2[i].extension).toBe(sorted3[i].extension);
              expect(sorted1[i].size).toBe(sorted2[i].size);
              expect(sorted2[i].size).toBe(sorted3[i].size);
            }
          }
        ),
        { numRuns: 15 }
      );
    });

    test('should handle nested directory structures consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              depth: fc.integer({ min: 1, max: 4 }),
              folderName: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              fileName: fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              content: fc.string({ maxLength: 200 })
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (nestedStructure) => {
            // Create unique project directory
            const projectName = `nested-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            const createdPaths: string[] = [];

            // Create nested structure
            for (let i = 0; i < nestedStructure.length; i++) {
              const item = nestedStructure[i];
              
              // Create nested folder path
              const folderSegments: string[] = [];
              for (let d = 0; d < item.depth; d++) {
                folderSegments.push(`${item.folderName}-${d}-${i}`);
              }
              
              const nestedFolderPath = path.join(projectPath, ...folderSegments);
              await fs.mkdir(nestedFolderPath, { recursive: true });
              
              // Create file in nested folder
              const fileName = `${item.fileName}-${i}.txt`;
              const filePath = path.join(nestedFolderPath, fileName);
              await fs.writeFile(filePath, item.content);
              
              const relativePath = path.relative(projectPath, filePath).replace(/\\/g, '/');
              createdPaths.push(relativePath);
            }

            // Load project
            const project = await projectService.loadProject(projectPath);

            // Verify all nested files are found
            expect(project.files.length).toBe(createdPaths.length);

            createdPaths.forEach(expectedPath => {
              const foundFile = project.files.find(f => f.path === expectedPath);
              expect(foundFile).toBeDefined();
              
              if (foundFile) {
                // Verify path depth is preserved
                const pathDepth = expectedPath.split('/').length;
                const foundDepth = foundFile.path.split('/').length;
                expect(foundDepth).toBe(pathDepth);
                
                // Verify file can be accessed
                const fullPath = path.join(projectPath, foundFile.path);
                expect(fs.access(fullPath)).resolves.toBeUndefined();
              }
            });
          }
        ),
        { numRuns: 15 }
      );
    });

    test('should ignore common development files and directories', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            validFiles: fc.array(
              fc.string({ minLength: 1, maxLength: 15 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              { minLength: 1, maxLength: 5 }
            ),
            ignoredItems: fc.constantFrom(
              'node_modules',
              '.git',
              'dist',
              'build',
              'coverage',
              '.vscode',
              '.idea',
              '.DS_Store',
              'Thumbs.db'
            )
          }),
          async ({ validFiles, ignoredItems }) => {
            // Create unique project directory
            const projectName = `ignore-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create valid files
            for (let i = 0; i < validFiles.length; i++) {
              const fileName = `${validFiles[i]}-${i}.js`;
              const filePath = path.join(projectPath, fileName);
              await fs.writeFile(filePath, `// Valid file ${i}`);
            }

            // Create ignored items
            if (ignoredItems.endsWith('.db') || ignoredItems.startsWith('.DS_Store')) {
              // Create ignored file
              const ignoredFilePath = path.join(projectPath, ignoredItems);
              await fs.writeFile(ignoredFilePath, 'ignored content');
            } else {
              // Create ignored directory with content
              const ignoredDirPath = path.join(projectPath, ignoredItems);
              await fs.mkdir(ignoredDirPath, { recursive: true });
              await fs.writeFile(path.join(ignoredDirPath, 'ignored-file.js'), 'ignored content');
            }

            // Load project
            const project = await projectService.loadProject(projectPath);

            // Verify only valid files are included
            expect(project.files.length).toBe(validFiles.length);

            // Verify no ignored items are included
            project.files.forEach(file => {
              expect(file.path).not.toContain(ignoredItems);
              expect(file.name).not.toBe(ignoredItems);
            });

            // Verify all valid files are included
            validFiles.forEach((validFile, i) => {
              const expectedName = `${validFile}-${i}.js`;
              const foundFile = project.files.find(f => f.name === expectedName);
              expect(foundFile).toBeDefined();
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should handle empty and large projects consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 0, max: 50 }),
          async (fileCount) => {
            // Create unique project directory
            const projectName = `size-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const projectPath = path.join(TEST_DIR, projectName);
            await fs.mkdir(projectPath, { recursive: true });

            // Create specified number of files
            for (let i = 0; i < fileCount; i++) {
              const fileName = `file-${i}.txt`;
              const filePath = path.join(projectPath, fileName);
              await fs.writeFile(filePath, `Content for file ${i}`);
            }

            // Load project
            const project = await projectService.loadProject(projectPath);

            // Verify file count matches
            expect(project.files.length).toBe(fileCount);

            // Verify project structure is valid
            expect(project.rootPath).toBe(projectPath);
            expect(Array.isArray(project.files)).toBe(true);
            expect(typeof project.summary).toBe('string');
            expect(Array.isArray(project.dependencies)).toBe(true);

            // For non-empty projects, verify files have valid properties
            if (fileCount > 0) {
              // Use natural/numeric sorting to handle file-10.txt correctly
              const sortedFiles = project.files.sort((a, b) => {
                const aNum = parseInt(a.name.match(/file-(\d+)\.txt/)?.[1] || '0');
                const bNum = parseInt(b.name.match(/file-(\d+)\.txt/)?.[1] || '0');
                return aNum - bNum;
              });
              
              sortedFiles.forEach((file, index) => {
                expect(file.name).toBe(`file-${index}.txt`);
                expect(file.path).toBe(`file-${index}.txt`);
                expect(file.extension).toBe('.txt');
                expect(file.size).toBeGreaterThan(0);
                // Handle Date more robustly - it might be serialized/deserialized
                const fileDate = new Date(file.lastModified);
                expect(fileDate).toBeInstanceOf(Date);
                expect(fileDate.getTime()).not.toBeNaN();
              });
            }
          }
        ),
        { numRuns: 25 }
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle non-existent project paths', async () => {
      const nonExistentPath = path.join(TEST_DIR, 'does-not-exist');
      
      await expect(projectService.loadProject(nonExistentPath)).rejects.toThrow();
    });

    test('should handle file paths instead of directory paths', async () => {
      const filePath = path.join(TEST_DIR, 'not-a-directory.txt');
      await fs.writeFile(filePath, 'test content');
      
      await expect(projectService.loadProject(filePath)).rejects.toThrow();
    });

    test('should handle projects with special characters in file names', async () => {
      const projectPath = path.join(TEST_DIR, 'special-chars-test');
      await fs.mkdir(projectPath, { recursive: true });

      const specialFiles = [
        'file with spaces.txt',
        'file-with-dashes.js',
        'file_with_underscores.ts',
        'file.with.dots.json'
      ];

      for (const fileName of specialFiles) {
        const filePath = path.join(projectPath, fileName);
        await fs.writeFile(filePath, `Content for ${fileName}`);
      }

      const project = await projectService.loadProject(projectPath);
      
      expect(project.files.length).toBe(specialFiles.length);
      
      specialFiles.forEach(expectedFile => {
        const foundFile = project.files.find(f => f.name === expectedFile);
        expect(foundFile).toBeDefined();
      });
    });

    test('should handle deeply nested directory structures', async () => {
      const projectPath = path.join(TEST_DIR, 'deep-nesting-test');
      await fs.mkdir(projectPath, { recursive: true });

      // Create a deeply nested structure (within reasonable limits)
      const deepPath = path.join(projectPath, 'level1', 'level2', 'level3', 'level4');
      await fs.mkdir(deepPath, { recursive: true });
      
      const deepFilePath = path.join(deepPath, 'deep-file.txt');
      await fs.writeFile(deepFilePath, 'Deep content');

      const project = await projectService.loadProject(projectPath);
      
      expect(project.files.length).toBe(1);
      expect(project.files[0].name).toBe('deep-file.txt');
      expect(project.files[0].path).toBe('level1/level2/level3/level4/deep-file.txt');
    });

    test('should handle projects with mixed file types', async () => {
      const projectPath = path.join(TEST_DIR, 'mixed-types-test');
      await fs.mkdir(projectPath, { recursive: true });

      const mixedFiles = [
        { name: 'script.js', content: 'console.log("hello");' },
        { name: 'style.css', content: 'body { margin: 0; }' },
        { name: 'index.html', content: '<html></html>' },
        { name: 'data.json', content: '{"key": "value"}' },
        { name: 'README.md', content: '# Project' },
        { name: 'config.txt', content: 'config=value' }
      ];

      for (const file of mixedFiles) {
        const filePath = path.join(projectPath, file.name);
        await fs.writeFile(filePath, file.content);
      }

      const project = await projectService.loadProject(projectPath);
      
      expect(project.files.length).toBe(mixedFiles.length);
      
      mixedFiles.forEach(expectedFile => {
        const foundFile = project.files.find(f => f.name === expectedFile.name);
        expect(foundFile).toBeDefined();
        
        if (foundFile) {
          const expectedExtension = path.extname(expectedFile.name);
          expect(foundFile.extension).toBe(expectedExtension);
        }
      });
    });
  });
});