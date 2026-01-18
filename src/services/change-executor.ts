/**
 * Change Executor - Critical Architecture Component
 * Manages AI-generated code changes with preview, approval, and rollback functionality
 */

export interface CodeChange {
  id: string;
  startLine: number;
  endLine: number;
  oldText: string;
  newText: string;
  description: string;
  timestamp: Date;
}

export interface ChangePreview {
  id: string;
  filePath: string;
  originalContent: string;
  modifiedContent: string;
  changes: CodeChange[];
  summary: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ChangeHistory {
  id: string;
  filePath: string;
  changes: CodeChange[];
  appliedAt: Date;
  appliedBy: 'ai' | 'user';
  canUndo: boolean;
  previousContent: string;
}

export enum ChangeStatus {
  PENDING = 'pending',
  PREVIEWING = 'previewing',
  APPROVED = 'approved',
  APPLIED = 'applied',
  REJECTED = 'rejected',
  ROLLED_BACK = 'rolled_back'
}

export class ChangeExecutor {
  private changeHistory: Map<string, ChangeHistory[]> = new Map();
  private pendingChanges: Map<string, ChangePreview> = new Map();
  private maxHistorySize = 50; // Maximum number of changes to keep in history per file

  /**
   * Create a preview of proposed changes without applying them
   */
  createPreview(
    filePath: string,
    originalContent: string,
    modifiedContent: string,
    description: string
  ): ChangePreview {
    const changes = this.calculateChanges(originalContent, modifiedContent);
    const riskLevel = this.assessRiskLevel(changes, originalContent);
    
    const preview: ChangePreview = {
      id: this.generateId(),
      filePath,
      originalContent,
      modifiedContent,
      changes,
      summary: this.generateSummary(changes, description),
      riskLevel
    };

    this.pendingChanges.set(preview.id, preview);
    return preview;
  }

  /**
   * Apply approved changes to the file
   */
  async applyChanges(
    previewId: string,
    writeFileCallback: (filePath: string, content: string) => Promise<void>
  ): Promise<ChangeHistory> {
    const preview = this.pendingChanges.get(previewId);
    if (!preview) {
      throw new Error(`Preview with ID ${previewId} not found`);
    }

    // Validate changes before applying
    this.validateChanges(preview);

    // Create history entry before applying
    const historyEntry: ChangeHistory = {
      id: this.generateId(),
      filePath: preview.filePath,
      changes: preview.changes,
      appliedAt: new Date(),
      appliedBy: 'ai',
      canUndo: true,
      previousContent: preview.originalContent
    };

    try {
      // Apply the changes
      await writeFileCallback(preview.filePath, preview.modifiedContent);

      // Add to history
      this.addToHistory(preview.filePath, historyEntry);

      // Remove from pending
      this.pendingChanges.delete(previewId);

      return historyEntry;
    } catch (error) {
      throw new Error(`Failed to apply changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reject pending changes
   */
  rejectChanges(previewId: string): void {
    const preview = this.pendingChanges.get(previewId);
    if (!preview) {
      throw new Error(`Preview with ID ${previewId} not found`);
    }

    this.pendingChanges.delete(previewId);
  }

  /**
   * Undo the last applied change for a file
   */
  async undoLastChange(
    filePath: string,
    writeFileCallback: (filePath: string, content: string) => Promise<void>
  ): Promise<boolean> {
    const history = this.changeHistory.get(filePath);
    if (!history || history.length === 0) {
      return false;
    }

    const lastChange = history[history.length - 1];
    if (!lastChange.canUndo) {
      throw new Error('Last change cannot be undone');
    }

    try {
      // Restore previous content
      await writeFileCallback(filePath, lastChange.previousContent);

      // Mark as rolled back
      lastChange.canUndo = false;
      
      // Create rollback history entry
      const rollbackEntry: ChangeHistory = {
        id: this.generateId(),
        filePath,
        changes: [],
        appliedAt: new Date(),
        appliedBy: 'user',
        canUndo: false,
        previousContent: lastChange.previousContent
      };

      history.push(rollbackEntry);
      return true;
    } catch (error) {
      throw new Error(`Failed to undo changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get change history for a file
   */
  getChangeHistory(filePath: string): ChangeHistory[] {
    return this.changeHistory.get(filePath) || [];
  }

  /**
   * Get all pending changes
   */
  getPendingChanges(): ChangePreview[] {
    return Array.from(this.pendingChanges.values());
  }

  /**
   * Get a specific pending change
   */
  getPendingChange(previewId: string): ChangePreview | undefined {
    return this.pendingChanges.get(previewId);
  }

  /**
   * Clear all pending changes
   */
  clearPendingChanges(): void {
    this.pendingChanges.clear();
  }

  /**
   * Generate diff display for preview
   */
  generateDiff(preview: ChangePreview): string {
    const lines = [];
    lines.push(`--- ${preview.filePath} (original)`);
    lines.push(`+++ ${preview.filePath} (modified)`);
    lines.push('');

    for (const change of preview.changes) {
      lines.push(`@@ -${change.startLine},${change.endLine - change.startLine + 1} +${change.startLine},${change.newText.split('\n').length} @@`);
      
      // Show removed lines
      if (change.oldText) {
        const oldLines = change.oldText.split('\n');
        oldLines.forEach(line => lines.push(`-${line}`));
      }

      // Show added lines
      if (change.newText) {
        const newLines = change.newText.split('\n');
        newLines.forEach(line => lines.push(`+${line}`));
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Validate that changes are safe to apply
   */
  private validateChanges(preview: ChangePreview): void {
    // Check for syntax errors (basic validation)
    if (preview.riskLevel === 'high') {
      // Additional validation for high-risk changes
      const hasStructuralChanges = preview.changes.some(change => 
        change.oldText.includes('class ') || 
        change.oldText.includes('function ') ||
        change.oldText.includes('interface ') ||
        change.newText.includes('class ') || 
        change.newText.includes('function ') ||
        change.newText.includes('interface ')
      );

      if (hasStructuralChanges) {
        console.warn('High-risk structural changes detected. Manual review recommended.');
      }
    }

    // Check for potential issues
    const hasDeletedCode = preview.changes.some(change => 
      change.oldText.length > change.newText.length * 2
    );

    if (hasDeletedCode) {
      console.warn('Significant code deletion detected. Verify this is intentional.');
    }
  }

  /**
   * Calculate individual changes between original and modified content
   */
  private calculateChanges(originalContent: string, modifiedContent: string): CodeChange[] {
    const originalLines = originalContent.split('\n');
    const modifiedLines = modifiedContent.split('\n');
    const changes: CodeChange[] = [];

    // Simple diff algorithm - can be enhanced with more sophisticated diff
    let originalIndex = 0;
    let modifiedIndex = 0;

    while (originalIndex < originalLines.length || modifiedIndex < modifiedLines.length) {
      if (originalIndex >= originalLines.length) {
        // Lines added at the end
        const addedLines = modifiedLines.slice(modifiedIndex);
        changes.push({
          id: this.generateId(),
          startLine: originalIndex + 1,
          endLine: originalIndex + 1,
          oldText: '',
          newText: addedLines.join('\n'),
          description: `Added ${addedLines.length} line(s)`,
          timestamp: new Date()
        });
        break;
      }

      if (modifiedIndex >= modifiedLines.length) {
        // Lines removed at the end
        const removedLines = originalLines.slice(originalIndex);
        changes.push({
          id: this.generateId(),
          startLine: originalIndex + 1,
          endLine: originalLines.length,
          oldText: removedLines.join('\n'),
          newText: '',
          description: `Removed ${removedLines.length} line(s)`,
          timestamp: new Date()
        });
        break;
      }

      if (originalLines[originalIndex] !== modifiedLines[modifiedIndex]) {
        // Find the extent of the change
        let changeEndOriginal = originalIndex;
        let changeEndModified = modifiedIndex;

        // Look ahead to find where lines match again
        let found = false;
        for (let i = 1; i <= Math.min(10, originalLines.length - originalIndex, modifiedLines.length - modifiedIndex); i++) {
          if (originalLines[originalIndex + i] === modifiedLines[modifiedIndex + i]) {
            changeEndOriginal = originalIndex + i - 1;
            changeEndModified = modifiedIndex + i - 1;
            found = true;
            break;
          }
        }

        if (!found) {
          changeEndOriginal = Math.min(originalIndex + 5, originalLines.length - 1);
          changeEndModified = Math.min(modifiedIndex + 5, modifiedLines.length - 1);
        }

        const oldText = originalLines.slice(originalIndex, changeEndOriginal + 1).join('\n');
        const newText = modifiedLines.slice(modifiedIndex, changeEndModified + 1).join('\n');

        changes.push({
          id: this.generateId(),
          startLine: originalIndex + 1,
          endLine: changeEndOriginal + 1,
          oldText,
          newText,
          description: this.describeChange(oldText, newText),
          timestamp: new Date()
        });

        originalIndex = changeEndOriginal + 1;
        modifiedIndex = changeEndModified + 1;
      } else {
        originalIndex++;
        modifiedIndex++;
      }
    }

    return changes;
  }

  /**
   * Assess the risk level of proposed changes
   */
  private assessRiskLevel(changes: CodeChange[], originalContent: string): 'low' | 'medium' | 'high' {
    const totalChangedLines = changes.reduce((sum, change) => 
      sum + Math.max(change.oldText.split('\n').length, change.newText.split('\n').length), 0
    );
    
    const originalLineCount = originalContent.split('\n').length;
    const changePercentage = totalChangedLines / originalLineCount;

    // Check for structural changes
    const hasStructuralChanges = changes.some(change => 
      change.oldText.includes('class ') || change.oldText.includes('function ') ||
      change.newText.includes('class ') || change.newText.includes('function ')
    );

    // Check for deletions
    const hasSignificantDeletions = changes.some(change => 
      change.oldText.length > 100 && change.newText.length < change.oldText.length / 2
    );

    if (changePercentage > 0.5 || hasStructuralChanges || hasSignificantDeletions) {
      return 'high';
    } else if (changePercentage > 0.2 || totalChangedLines > 20) {
      return 'medium';
    } else {
      return 'low';
    }
  }

  /**
   * Generate a human-readable summary of changes
   */
  private generateSummary(changes: CodeChange[], description: string): string {
    const totalChanges = changes.length;
    const addedLines = changes.reduce((sum, change) => 
      sum + (change.newText ? change.newText.split('\n').length : 0), 0
    );
    const removedLines = changes.reduce((sum, change) => 
      sum + (change.oldText ? change.oldText.split('\n').length : 0), 0
    );

    let summary = `${totalChanges} change(s): `;
    
    if (addedLines > 0 && removedLines > 0) {
      summary += `${addedLines} lines added, ${removedLines} lines removed`;
    } else if (addedLines > 0) {
      summary += `${addedLines} lines added`;
    } else if (removedLines > 0) {
      summary += `${removedLines} lines removed`;
    } else {
      summary += 'content modified';
    }

    if (description) {
      summary += ` - ${description}`;
    }

    return summary;
  }

  /**
   * Describe a specific change
   */
  private describeChange(oldText: string, newText: string): string {
    if (!oldText && newText) {
      return 'Added content';
    } else if (oldText && !newText) {
      return 'Removed content';
    } else {
      return 'Modified content';
    }
  }

  /**
   * Add change to history with size management
   */
  private addToHistory(filePath: string, historyEntry: ChangeHistory): void {
    if (!this.changeHistory.has(filePath)) {
      this.changeHistory.set(filePath, []);
    }

    const history = this.changeHistory.get(filePath)!;
    history.push(historyEntry);

    // Maintain history size limit
    if (history.length > this.maxHistorySize) {
      history.splice(0, history.length - this.maxHistorySize);
    }
  }

  /**
   * Generate unique ID for changes and previews
   */
  private generateId(): string {
    return `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics about changes
   */
  getStatistics(): {
    totalFiles: number;
    totalChanges: number;
    pendingChanges: number;
    averageChangesPerFile: number;
  } {
    const totalFiles = this.changeHistory.size;
    const totalChanges = Array.from(this.changeHistory.values())
      .reduce((sum, history) => sum + history.length, 0);
    const pendingChanges = this.pendingChanges.size;
    const averageChangesPerFile = totalFiles > 0 ? totalChanges / totalFiles : 0;

    return {
      totalFiles,
      totalChanges,
      pendingChanges,
      averageChangesPerFile
    };
  }

  /**
   * Clear history for a specific file
   */
  clearFileHistory(filePath: string): void {
    this.changeHistory.delete(filePath);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.changeHistory.clear();
  }
}

// Export singleton instance
export const changeExecutor = new ChangeExecutor();