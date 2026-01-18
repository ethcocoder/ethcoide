/**
 * Tab Management System for AI-Powered IDE
 * Handles file tabs, switching, closing, and state tracking
 */
export interface Tab {
    id: string;
    filePath: string;
    fileName: string;
    content: string;
    isDirty: boolean;
    language?: string;
}
export declare class TabManager {
    private tabs;
    private activeTabId;
    private tabsContainer;
    private onTabChange?;
    private onTabClose?;
    constructor();
    /**
     * Initialize tab container and scroll buttons
     */
    private initializeTabContainer;
    /**
     * Set callback for tab change events
     */
    setOnTabChange(callback: (tab: Tab | null) => void): void;
    /**
     * Set callback for tab close events
     */
    setOnTabClose(callback: (tab: Tab) => void): void;
    /**
     * Add a new tab
     */
    addTab(filePath: string, fileName: string, content: string): Tab;
    /**
     * Remove a tab
     */
    removeTab(tabId: string): void;
    /**
     * Switch to a specific tab
     */
    switchToTab(tabId: string): void;
    /**
     * Get the currently active tab
     */
    getActiveTab(): Tab | null;
    /**
     * Get all tabs
     */
    getAllTabs(): Tab[];
    /**
     * Update tab content
     */
    updateTabContent(tabId: string, content: string, isDirty?: boolean): void;
    /**
     * Mark tab as saved (not dirty)
     */
    markTabAsSaved(tabId: string): void;
    /**
     * Close all tabs
     */
    closeAllTabs(): void;
    /**
     * Close all tabs except the specified one
     */
    closeOtherTabs(keepTabId: string): void;
    /**
     * Create DOM element for tab
     */
    private createTabElement;
    /**
     * Update tab title to show dirty state
     */
    private updateTabTitle;
    /**
     * Get file icon based on file extension
     */
    private getFileIcon;
    /**
     * Get language from file name
     */
    private getLanguageFromFileName;
    /**
     * Scroll to show the specified tab
     */
    private scrollToTab;
    /**
     * Update scroll button states
     */
    private updateScrollButtons;
    /**
     * Scroll tabs left or right
     */
    scrollTabs(direction: 'left' | 'right'): void;
    /**
     * Setup keyboard shortcuts for tab management
     */
    private setupKeyboardShortcuts;
    /**
     * Switch to next tab
     */
    private switchToNextTab;
    /**
     * Switch to previous tab
     */
    private switchToPreviousTab;
}
export declare const tabManager: TabManager;
//# sourceMappingURL=tabs.d.ts.map