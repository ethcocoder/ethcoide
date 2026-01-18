import { MonacoEditorManager } from './monaco-setup';
export interface Tab {
    id: string;
    filePath: string;
    fileName: string;
    isDirty: boolean;
    isActive: boolean;
    language: string;
    content?: string;
}
export declare class TabManager {
    private tabs;
    private activeTabId;
    private editorManager;
    private tabBarElement;
    constructor(editorManager: MonacoEditorManager, tabBarElement: HTMLElement);
    /**
     * Open a file in a new tab or switch to existing tab
     */
    openFile(filePath: string): Promise<Tab>;
    /**
     * Close a tab
     */
    closeTab(tabId: string): boolean;
    /**
     * Switch to a specific tab
     */
    switchTab(tabId: string): void;
    /**
     * Get active tab
     */
    getActiveTab(): Tab | null;
    /**
     * Get all tabs
     */
    getAllTabs(): Tab[];
    /**
     * Mark tab as dirty (has unsaved changes)
     */
    markTabDirty(tabId: string, isDirty: boolean): void;
    /**
     * Save current tab
     */
    saveActiveTab(): Promise<boolean>;
    /**
     * Save tab as new file
     */
    saveActiveTabAs(): Promise<boolean>;
    /**
     * Create tab element in the UI
     */
    private createTabElement;
    /**
     * Update tab element in the UI
     */
    private updateTabElement;
    /**
     * Remove tab element from the UI
     */
    private removeTabElement;
    /**
     * Find tab by file path
     */
    private findTabByPath;
    /**
     * Generate unique tab ID
     */
    private generateTabId;
    /**
     * Extract file name from path
     */
    private extractFileName;
    /**
     * Get file icon based on extension
     */
    private getFileIcon;
    /**
     * Setup event listeners
     */
    private setupEventListeners;
    /**
     * Switch to next tab
     */
    private switchToNextTab;
    /**
     * Show welcome screen
     */
    private showWelcomeScreen;
    /**
     * Hide welcome screen
     */
    private hideWelcomeScreen;
}
//# sourceMappingURL=tabs.d.ts.map