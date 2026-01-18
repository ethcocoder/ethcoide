/**
 * Property-based tests for File System Operations
 * Property 6: File System Operation Consistency
 * Validates: Requirements 3.1, 3.3, 3.5
 */

import * as fc from 'fast-check';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileSystemService } from '../services/file-service';

// Test directory for file operations
const TEST_DIR = path.join(__dirname, '../../test-files');

describe('File System Operations - Property Tests', () => {
  let fileService: FileSystemService;

  beforeAll(async () => {
    fileService = new FileSystemService();
    
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
  });

  describe('Property 6: File System Operation Consistency', () => {
    test('should maintain file content consistency after write and read operations', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ maxLength: 1000 }),
          async (fileName, content) => {
            const filePath = path.join(TEST_DIR, `${fileName}.txt`);
            
            // Write content to file
            await fileService.writeFile(filePath, content);
            
            // Read content back
            const readContent = await fileService.readFile(filePath);
            
            // Content should be identical
            expect(readContent).toBe(content);
            
            // File should exist
            const exists = await fileService.exists(filePath);
            expect(exists).toBe(true);
            
            // File stats should be consistent
            const stats = await fileService.stat(filePath);
            expect(stats.isFile).toBe(true);
            expect(stats.isDirectory).toBe(false);
            expect(stats.size).toBe(Buffer.byteLength(content, 'utf8'));
          }
        ),
        { numRuns: 50 }
      );
    });

    test('should maintain directory structure consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 1, maxLength: 5 }),
          async (pathSegments) => {
            const dirPath = path.join(TEST_DIR, ...pathSegments);
            
            // Create directory
            await fileService.createDirectory(dirPath);
            
            // Directory should exist
            const exists = await fileService.exists(dirPath);
            expect(exists).toBe(true);
            
            // Directory stats should be consistent
            const stats = await fileService.stat(dirPath);
            expect(stats.isDirectory).toBe(true);
            expect(stats.isFile).toBe(false);
            
            // Parent directories should also exist
            let currentPath = TEST_DIR;
            for (const segment of pathSegments) {
              currentPath = path.join(currentPath, segment);
              const segmentExists = await fileService.exists(currentPath);
              expect(segmentExists).toBe(true);
            }
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain file operations idempotency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ maxLength: 500 }),
          async (fileName, content) => {
            // Add unique timestamp to prevent conflicts between test runs
            const uniqueFileName = `${fileName}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            const filePath = path.join(TEST_DIR, `${uniqueFileName}.txt`);
            
            // Ensure file doesn't exist before test
            const initialExists = await fileService.exists(filePath);
            expect(initialExists).toBe(false);
            
            // Create file for the first time
            await fileService.createFile(filePath, content);
            
            // File should exist after first creation
            let exists = await fileService.exists(filePath);
            expect(exists).toBe(true);
            
            // Second creation should fail (file already exists)
            await expect(fileService.createFile(filePath, content)).rejects.toThrow();
            
            // File should still exist and have correct content
            exists = await fileService.exists(filePath);
            expect(exists).toBe(true);
            
            const readContent = await fileService.readFile(filePath);
            expect(readContent).toBe(content);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain rename operation consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ maxLength: 500 }),
          async (oldName, newName, content) => {
            // Skip if names are the same
            if (oldName === newName) return;
            
            // Add unique identifiers to prevent conflicts
            const timestamp = Date.now();
            const uniqueOldName = `${oldName}-${timestamp}`;
            const uniqueNewName = `${newName}-${timestamp}-new`;
            
            const oldPath = path.join(TEST_DIR, `${uniqueOldName}.txt`);
            const newPath = path.join(TEST_DIR, `${uniqueNewName}.txt`);
            
            // Create original file
            await fileService.createFile(oldPath, content);
            
            // Verify original file exists
            let oldExists = await fileService.exists(oldPath);
            expect(oldExists).toBe(true);
            
            // Rename file
            await fileService.rename(oldPath, newPath);
            
            // Original file should not exist
            oldExists = await fileService.exists(oldPath);
            expect(oldExists).toBe(false);
            
            // New file should exist with same content
            const newExists = await fileService.exists(newPath);
            expect(newExists).toBe(true);
            
            const readContent = await fileService.readFile(newPath);
            expect(readContent).toBe(content);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain copy operation consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ maxLength: 500 }),
          async (sourceName, targetName, content) => {
            // Skip if names are the same
            if (sourceName === targetName) return;
            
            // Add unique identifiers to prevent conflicts
            const timestamp = Date.now();
            const uniqueSourceName = `${sourceName}-${timestamp}-src`;
            const uniqueTargetName = `${targetName}-${timestamp}-tgt`;
            
            const sourcePath = path.join(TEST_DIR, `${uniqueSourceName}.txt`);
            const targetPath = path.join(TEST_DIR, `${uniqueTargetName}.txt`);
            
            // Create source file
            await fileService.createFile(sourcePath, content);
            
            // Copy file
            await fileService.copyFile(sourcePath, targetPath);
            
            // Both files should exist
            const sourceExists = await fileService.exists(sourcePath);
            const targetExists = await fileService.exists(targetPath);
            expect(sourceExists).toBe(true);
            expect(targetExists).toBe(true);
            
            // Both files should have same content
            const sourceContent = await fileService.readFile(sourcePath);
            const targetContent = await fileService.readFile(targetPath);
            expect(sourceContent).toBe(content);
            expect(targetContent).toBe(content);
            expect(sourceContent).toBe(targetContent);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain delete operation consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ maxLength: 500 }),
          async (fileName, content) => {
            const filePath = path.join(TEST_DIR, `${fileName}.txt`);
            
            // Create file
            await fileService.createFile(filePath, content);
            
            // Verify file exists
            let exists = await fileService.exists(filePath);
            expect(exists).toBe(true);
            
            // Delete file
            await fileService.deleteFile(filePath);
            
            // File should not exist
            exists = await fileService.exists(filePath);
            expect(exists).toBe(false);
            
            // Second delete should fail
            await expect(fileService.deleteFile(filePath)).rejects.toThrow();
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain path utility consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)), { minLength: 1, maxLength: 3 }),
          async (pathSegments) => {
            const joinedPath = fileService.joinPath(...pathSegments);
            
            // Joined path should contain all segments
            pathSegments.forEach(segment => {
              expect(joinedPath).toContain(segment);
            });
            
            // Basename should be the last segment
            const basename = fileService.getBasename(joinedPath);
            expect(basename).toBe(pathSegments[pathSegments.length - 1]);
            
            // Dirname should be different from the full path (unless it's a single segment)
            const dirname = fileService.getDirname(joinedPath);
            if (pathSegments.length > 1) {
              expect(dirname).not.toBe(joinedPath);
              // Dirname should not end with the last segment (unless the last segment appears earlier)
              const lastSegment = pathSegments[pathSegments.length - 1];
              const dirnameBasename = fileService.getBasename(dirname);
              if (pathSegments.slice(0, -1).indexOf(lastSegment) === -1) {
                expect(dirnameBasename).not.toBe(lastSegment);
              }
            }
            
            // Absolute path should be absolute
            const absolutePath = fileService.getAbsolutePath(joinedPath);
            expect(path.isAbsolute(absolutePath)).toBe(true);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain directory listing consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.record({
              name: fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
              content: fc.string({ maxLength: 100 }),
              isDirectory: fc.boolean()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          async (entries) => {
            // Use a unique subdirectory name for each test run
            const testSubDir = path.join(TEST_DIR, `listing-test-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
            await fileService.createDirectory(testSubDir);
            
            // Create entries with unique names to avoid conflicts
            const createdEntries: Array<{name: string; content: string; isDirectory: boolean}> = [];
            for (let i = 0; i < entries.length; i++) {
              const entry = entries[i];
              const uniqueName = `${entry.name}-${i}`;
              const entryPath = path.join(testSubDir, entry.isDirectory ? uniqueName : `${uniqueName}.txt`);
              
              if (entry.isDirectory) {
                await fileService.createDirectory(entryPath);
              } else {
                await fileService.createFile(entryPath, entry.content);
              }
              
              createdEntries.push({
                name: entry.isDirectory ? uniqueName : `${uniqueName}.txt`,
                content: entry.content,
                isDirectory: entry.isDirectory
              });
            }
            
            // Read directory
            const dirEntries = await fileService.readDirectory(testSubDir);
            
            // Should have correct number of entries
            expect(dirEntries.length).toBe(createdEntries.length);
            
            // Each entry should have correct properties
            dirEntries.forEach(dirEntry => {
              expect(dirEntry.name).toBeTruthy();
              expect(dirEntry.path).toBeTruthy();
              expect(typeof dirEntry.isDirectory).toBe('boolean');
              expect(typeof dirEntry.isFile).toBe('boolean');
              expect(dirEntry.isDirectory).not.toBe(dirEntry.isFile); // Mutually exclusive
            });
            
            // Directories should come before files (sorted)
            let foundFile = false;
            dirEntries.forEach(entry => {
              if (entry.isFile) {
                foundFile = true;
              } else if (foundFile) {
                // Found directory after file - should not happen
                expect(false).toBe(true);
              }
            });
          }
        ),
        { numRuns: 20 }
      );
    });

    test('should handle file extension operations consistently', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 10 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)),
          async (baseName, extension) => {
            const fileName = `${baseName}.${extension}`;
            const filePath = path.join(TEST_DIR, fileName);
            
            // Create file
            await fileService.createFile(filePath, 'test content');
            
            // Extension should match
            const fileExtension = fileService.getExtension(filePath);
            expect(fileExtension).toBe(`.${extension}`);
            
            // Basename without extension should match
            const baseNameWithoutExt = fileService.getBasename(filePath, `.${extension}`);
            expect(baseNameWithoutExt).toBe(baseName);
            
            // Basename with extension should match full filename
            const baseNameWithExt = fileService.getBasename(filePath);
            expect(baseNameWithExt).toBe(fileName);
          }
        ),
        { numRuns: 30 }
      );
    });

    test('should maintain error handling consistency', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 1, maxLength: 30 }).filter(s => /^[a-zA-Z0-9_-]+$/.test(s)),
          async (fileName) => {
            const filePath = path.join(TEST_DIR, `${fileName}.txt`);
            
            // Reading non-existent file should throw
            await expect(fileService.readFile(filePath)).rejects.toThrow();
            
            // Deleting non-existent file should throw
            await expect(fileService.deleteFile(filePath)).rejects.toThrow();
            
            // Getting stats for non-existent file should throw
            await expect(fileService.stat(filePath)).rejects.toThrow();
            
            // Exists should return false for non-existent file
            const exists = await fileService.exists(filePath);
            expect(exists).toBe(false);
          }
        ),
        { numRuns: 30 }
      );
    });
  });

  describe('Edge Cases and Error Conditions', () => {
    test('should handle empty content correctly', async () => {
      const filePath = path.join(TEST_DIR, 'empty.txt');
      
      await fileService.createFile(filePath, '');
      
      const content = await fileService.readFile(filePath);
      expect(content).toBe('');
      
      const stats = await fileService.stat(filePath);
      expect(stats.size).toBe(0);
    });

    test('should handle special characters in file names', async () => {
      const specialNames = ['file with spaces.txt', 'file-with-dashes.txt', 'file_with_underscores.txt'];
      
      for (const fileName of specialNames) {
        const filePath = path.join(TEST_DIR, fileName);
        const content = `Content for ${fileName}`;
        
        await fileService.createFile(filePath, content);
        
        const exists = await fileService.exists(filePath);
        expect(exists).toBe(true);
        
        const readContent = await fileService.readFile(filePath);
        expect(readContent).toBe(content);
      }
    });

    test('should handle nested directory creation', async () => {
      const nestedPath = path.join(TEST_DIR, 'level1', 'level2', 'level3');
      
      await fileService.createDirectory(nestedPath);
      
      const exists = await fileService.exists(nestedPath);
      expect(exists).toBe(true);
      
      const stats = await fileService.stat(nestedPath);
      expect(stats.isDirectory).toBe(true);
    });

    test('should handle concurrent file operations', async () => {
      const promises: Promise<void>[] = [];
      
      // Create multiple files concurrently
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(TEST_DIR, `concurrent-${i}.txt`);
        const content = `Content ${i}`;
        promises.push(fileService.createFile(filePath, content));
      }
      
      await Promise.all(promises);
      
      // Verify all files were created
      for (let i = 0; i < 10; i++) {
        const filePath = path.join(TEST_DIR, `concurrent-${i}.txt`);
        const exists = await fileService.exists(filePath);
        expect(exists).toBe(true);
        
        const content = await fileService.readFile(filePath);
        expect(content).toBe(`Content ${i}`);
      }
    });
  });
});