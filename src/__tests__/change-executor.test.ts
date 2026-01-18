import * as fc from 'fast-check';
import { ChangeExecutor, ChangePreview, ChangeHistory } from '../services/change-executor';

describe('ChangeExecutor', () => {
  let changeExecutor: ChangeExecutor;
  let mockWriteFile: jest.Mock;

  beforeEach(() => {
    changeExecutor = new ChangeExecutor();
    mockWriteFile = jest.fn().mockResolvedValue(undefined);
    jest.clearAllMocks();
  });

  describe('Property 20: AI Change Undo/Redo', () => {
    /**
     * Feature: ai-powered-ide, Property 20: AI Change Undo/Redo
     * Test that all AI changes can be undone without data loss
     * Verify redo functionality maintains change integrity
     * Test undo/redo with multiple sequential changes
     * Validates: Requirements 7.3
     */
    it('should allow undoing any applied change without data loss', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.ts`),
          originalContent: fc.string({ minLength: 10, maxLength: 200 }),
          modifiedContent: fc.string({ minLength: 10, maxLength: 200 }),
          description: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async (testData) => {
          const { filePath, originalContent, modifiedContent, description } = testData;

          // Ensure contents are different
          if (originalContent === modifiedContent) return;

          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          // Create and apply a change
          const preview = changeExecutor.createPreview(
            filePath,
            originalContent,
            modifiedContent,
            description
          );

          expect(preview.originalContent).toBe(originalContent);
          expect(preview.modifiedContent).toBe(modifiedContent);

          // Apply the change
          const historyEntry = await changeExecutor.applyChanges(preview.id, mockWriteFile);

          // Verify the change was applied
          expect(mockWriteFile).toHaveBeenCalledWith(filePath, modifiedContent);
          expect(historyEntry.canUndo).toBe(true);
          expect(historyEntry.previousContent).toBe(originalContent);

          // Undo the change
          const undoResult = await changeExecutor.undoLastChange(filePath, mockWriteFile);

          // Verify undo was successful
          expect(undoResult).toBe(true);
          expect(mockWriteFile).toHaveBeenCalledWith(filePath, originalContent);

          // Verify history reflects the undo
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history.length).toBe(2); // Original change + undo entry
          expect(history[0].canUndo).toBe(false); // Original change can no longer be undone
          expect(history[1].canUndo).toBe(false); // Undo entry itself cannot be undone
        }
      ), { numRuns: 100 });
    });

    it('should maintain change integrity across multiple sequential changes', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.js`),
          changes: fc.array(
            fc.record({
              content: fc.string({ minLength: 5, maxLength: 100 }),
              description: fc.string({ minLength: 1, maxLength: 50 })
            }),
            { minLength: 2, maxLength: 5 }
          )
        }),
        async (testData) => {
          const { filePath, changes } = testData;

          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          let currentContent = 'initial content';
          const appliedChanges: ChangeHistory[] = [];

          // Apply multiple sequential changes
          for (let i = 0; i < changes.length; i++) {
            const change = changes[i];
            const newContent = currentContent + '\n' + change.content;

            const preview = changeExecutor.createPreview(
              filePath,
              currentContent,
              newContent,
              change.description
            );

            const historyEntry = await changeExecutor.applyChanges(preview.id, mockWriteFile);
            appliedChanges.push(historyEntry);

            // Verify the change was applied correctly
            expect(mockWriteFile).toHaveBeenCalledWith(filePath, newContent);
            expect(historyEntry.previousContent).toBe(currentContent);

            currentContent = newContent;
          }

          // Verify all changes are in history
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history.length).toBe(changes.length);

          // Undo all changes in reverse order
          for (let i = changes.length - 1; i >= 0; i--) {
            const undoResult = await changeExecutor.undoLastChange(filePath, mockWriteFile);
            expect(undoResult).toBe(true);

            // Verify the correct content was restored
            const expectedContent = i === 0 ? 'initial content' : 
              'initial content' + changes.slice(0, i).map(c => '\n' + c.content).join('');
            
            expect(mockWriteFile).toHaveBeenCalledWith(filePath, expectedContent);
          }

          // Verify final history state
          const finalHistory = changeExecutor.getChangeHistory(filePath);
          expect(finalHistory.length).toBe(changes.length * 2); // Original changes + undo entries
        }
      ), { numRuns: 50 }); // Reduced runs due to complexity
    });

    it('should handle undo operations correctly when no changes exist', async () => {
      await fc.assert(fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.py`),
        async (filePath) => {
          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          // Try to undo when no changes exist
          const undoResult = await changeExecutor.undoLastChange(filePath, mockWriteFile);

          // Should return false indicating no changes to undo
          expect(undoResult).toBe(false);
          expect(mockWriteFile).not.toHaveBeenCalled();

          // History should be empty
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history.length).toBe(0);
        }
      ), { numRuns: 100 });
    });

    it('should prevent undoing changes that have already been undone', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.cpp`),
          originalContent: fc.string({ minLength: 5, maxLength: 100 }),
          modifiedContent: fc.string({ minLength: 5, maxLength: 100 })
        }),
        async (testData) => {
          const { filePath, originalContent, modifiedContent } = testData;

          // Ensure contents are different
          if (originalContent === modifiedContent) return;

          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          // Apply a change
          const preview = changeExecutor.createPreview(
            filePath,
            originalContent,
            modifiedContent,
            'test change'
          );

          await changeExecutor.applyChanges(preview.id, mockWriteFile);

          // Undo the change
          const firstUndo = await changeExecutor.undoLastChange(filePath, mockWriteFile);
          expect(firstUndo).toBe(true);

          // Try to undo again - should return false
          const secondUndo = await changeExecutor.undoLastChange(filePath, mockWriteFile);
          expect(secondUndo).toBe(false);

          // Verify history state
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history.length).toBe(2); // Original change + undo entry
          expect(history[0].canUndo).toBe(false);
          expect(history[1].canUndo).toBe(false);
        }
      ), { numRuns: 100 });
    });

    it('should maintain data integrity during change preview and application', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 50 }).map(s => `test/${s}.ts`),
          originalContent: fc.string({ minLength: 1, maxLength: 500 }),
          modifiedContent: fc.string({ minLength: 1, maxLength: 500 }),
          description: fc.string({ minLength: 1, maxLength: 200 })
        }),
        async (testData) => {
          const { filePath, originalContent, modifiedContent, description } = testData;

          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          // Create preview
          const preview = changeExecutor.createPreview(
            filePath,
            originalContent,
            modifiedContent,
            description
          );

          // Verify preview data integrity
          expect(preview.filePath).toBe(filePath);
          expect(preview.originalContent).toBe(originalContent);
          expect(preview.modifiedContent).toBe(modifiedContent);
          expect(preview.summary).toContain(description);
          expect(preview.changes.length).toBeGreaterThan(0);

          // Verify preview is pending
          const pendingChanges = changeExecutor.getPendingChanges();
          expect(pendingChanges).toContainEqual(preview);

          // Apply changes
          const historyEntry = await changeExecutor.applyChanges(preview.id, mockWriteFile);

          // Verify application data integrity
          expect(historyEntry.filePath).toBe(filePath);
          expect(historyEntry.previousContent).toBe(originalContent);
          expect(historyEntry.canUndo).toBe(true);
          expect(mockWriteFile).toHaveBeenCalledWith(filePath, modifiedContent);

          // Verify preview is no longer pending
          const pendingAfterApply = changeExecutor.getPendingChanges();
          expect(pendingAfterApply).not.toContainEqual(preview);

          // Verify history contains the change
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history).toContainEqual(historyEntry);
        }
      ), { numRuns: 100 });
    });

    it('should handle change rejection correctly', async () => {
      await fc.assert(fc.asyncProperty(
        fc.record({
          filePath: fc.string({ minLength: 1, maxLength: 50 }).map(s => `${s}.java`),
          originalContent: fc.string({ minLength: 1, maxLength: 200 }),
          modifiedContent: fc.string({ minLength: 1, maxLength: 200 })
        }),
        async (testData) => {
          const { filePath, originalContent, modifiedContent } = testData;

          // Clear mock calls before each test run
          mockWriteFile.mockClear();

          // Create preview
          const preview = changeExecutor.createPreview(
            filePath,
            originalContent,
            modifiedContent,
            'test change'
          );

          // Verify preview exists
          expect(changeExecutor.getPendingChange(preview.id)).toBe(preview);

          // Reject the change
          changeExecutor.rejectChanges(preview.id);

          // Verify preview is removed
          expect(changeExecutor.getPendingChange(preview.id)).toBeUndefined();

          // Verify no file operations occurred
          expect(mockWriteFile).not.toHaveBeenCalled();

          // Verify no history was created
          const history = changeExecutor.getChangeHistory(filePath);
          expect(history.length).toBe(0);
        }
      ), { numRuns: 100 });
    });
  });

  // Unit tests for specific scenarios
  describe('Unit Tests', () => {
    it('should generate meaningful diff display', () => {
      const originalContent = 'line 1\nline 2\nline 3';
      const modifiedContent = 'line 1\nmodified line 2\nline 3\nnew line 4';

      const preview = changeExecutor.createPreview(
        'test.txt',
        originalContent,
        modifiedContent,
        'test modification'
      );

      const diff = changeExecutor.generateDiff(preview);

      expect(diff).toContain('--- test.txt (original)');
      expect(diff).toContain('+++ test.txt (modified)');
      expect(diff).toContain('-line 2');
      expect(diff).toContain('+modified line 2');
      expect(diff).toContain('+new line 4');
    });

    it('should assess risk levels correctly', () => {
      // Low risk - small change
      const lowRiskPreview = changeExecutor.createPreview(
        'test.js',
        'console.log("hello");',
        'console.log("hello world");',
        'minor change'
      );
      expect(lowRiskPreview.riskLevel).toBe('low');

      // High risk - structural change
      const highRiskPreview = changeExecutor.createPreview(
        'test.js',
        'function test() { return 1; }',
        'class Test { method() { return 1; } }',
        'structural change'
      );
      expect(highRiskPreview.riskLevel).toBe('high');
    });

    it('should provide accurate statistics', async () => {
      const preview1 = changeExecutor.createPreview('file1.js', 'old', 'new', 'change 1');
      const preview2 = changeExecutor.createPreview('file2.js', 'old', 'new', 'change 2');

      await changeExecutor.applyChanges(preview1.id, mockWriteFile);

      const stats = changeExecutor.getStatistics();
      expect(stats.totalFiles).toBe(1);
      expect(stats.totalChanges).toBe(1);
      expect(stats.pendingChanges).toBe(1); // preview2 is still pending
    });

    it('should handle write file callback errors', async () => {
      const failingWriteFile = jest.fn().mockRejectedValue(new Error('Write failed'));

      const preview = changeExecutor.createPreview(
        'test.js',
        'old content',
        'new content',
        'test change'
      );

      await expect(changeExecutor.applyChanges(preview.id, failingWriteFile))
        .rejects.toThrow('Failed to apply changes: Write failed');

      // Verify preview is still pending after failure
      expect(changeExecutor.getPendingChange(preview.id)).toBe(preview);
    });

    it('should clear pending changes correctly', () => {
      changeExecutor.createPreview('file1.js', 'old', 'new', 'change 1');
      changeExecutor.createPreview('file2.js', 'old', 'new', 'change 2');

      expect(changeExecutor.getPendingChanges().length).toBe(2);

      changeExecutor.clearPendingChanges();

      expect(changeExecutor.getPendingChanges().length).toBe(0);
    });
  });
});