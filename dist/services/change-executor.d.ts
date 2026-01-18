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
export declare enum ChangeStatus {
    PENDING = "pending",
    PREVIEWING = "previewing",
    APPROVED = "approved",
    APPLIED = "applied",
    REJECTED = "rejected",
    ROLLED_BACK = "rolled_back"
}
export declare class ChangeExecutor {
    private changeHistory;
    private pendingChanges;
    private maxHistorySize;
    /**
     * Create a preview of proposed changes without applying them
     */
    createPreview(filePath: string, originalContent: string, modifiedContent: string, description: string): ChangePreview;
    /**
     * Apply approved changes to the file
     */
    applyChanges(previewId: string, writeFileCallback: (filePath: string, content: string) => Promise<void>): Promise<ChangeHistory>;
    /**
     * Reject pending changes
     */
    rejectChanges(previewId: string): void;
    /**
     * Undo the last applied change for a file
     */
    undoLastChange(filePath: string, writeFileCallback: (filePath: string, content: string) => Promise<void>): Promise<boolean>;
    /**
     * Get change history for a file
     */
    getChangeHistory(filePath: string): ChangeHistory[];
    /**
     * Get all pending changes
     */
    getPendingChanges(): ChangePreview[];
    /**
     * Get a specific pending change
     */
    getPendingChange(previewId: string): ChangePreview | undefined;
    /**
     * Clear all pending changes
     */
    clearPendingChanges(): void;
    /**
     * Generate diff display for preview
     */
    generateDiff(preview: ChangePreview): string;
    /**
     * Validate that changes are safe to apply
     */
    private validateChanges;
    /**
     * Calculate individual changes between original and modified content
     */
    private calculateChanges;
    /**
     * Assess the risk level of proposed changes
     */
    private assessRiskLevel;
    /**
     * Generate a human-readable summary of changes
     */
    private generateSummary;
    /**
     * Describe a specific change
     */
    private describeChange;
    /**
     * Add change to history with size management
     */
    private addToHistory;
    /**
     * Generate unique ID for changes and previews
     */
    private generateId;
    /**
     * Get statistics about changes
     */
    getStatistics(): {
        totalFiles: number;
        totalChanges: number;
        pendingChanges: number;
        averageChangesPerFile: number;
    };
    /**
     * Clear history for a specific file
     */
    clearFileHistory(filePath: string): void;
    /**
     * Clear all history
     */
    clearAllHistory(): void;
}
export declare const changeExecutor: ChangeExecutor;
//# sourceMappingURL=change-executor.d.ts.map