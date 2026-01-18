"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabManager = void 0;
class TabManager {
    constructor(editorManager, tabBarElement) {
        this.tabs = new Map();
        this.activeTabId = null;
        this.editorManager = editorManager;
        this.tabBarElement = tabBarElement;
        this.setupEventListeners();
    }
    /**
     * Open a file in a new tab or switch to existing tab
     */
    async openFile(filePath) {
        // Check if file is already open
        const existingTab = this.findTabByPath(filePath);
        if (existingTab) {
            this.switchTab(existingTab.id);
            return existingTab;
        }
        try {
            // Read file content via IPC
            const content = await window.electronAPI.fileOperations.readFile(filePath);
            // Create new tab
            const tab = {
                id: this.generateTabId(),
                filePath: filePath,
                fileName: this.extractFileName(filePath),
                isDirty: false,
                isActive: false,
                language: this.editorManager.getLanguageForFile(filePath),
                content: content
            };
            // Add tab to collection
            this.tabs.set(tab.id, tab);
            // Create tab element in UI
            this.createTabElement(tab);
            // Switch to the new tab
            this.switchTab(tab.id);
            return tab;
        }
        catch (error) {
            console.error('Failed to open file:', error);
            throw error;
        }
    }
    /**
     * Close a tab
     */
    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return false;
        }
        // Check if tab has unsaved changes
        if (tab.isDirty) {
            const shouldClose = confirm(`File "${tab.fileName}" has unsaved changes. Close anyway?`);
            if (!shouldClose) {
                return false;
            }
        }
        // Remove tab from collection
        this.tabs.delete(tabId);
        // Remove tab element from UI
        this.removeTabElement(tabId);
        // If this was the active tab, switch to another tab
        if (this.activeTabId === tabId) {
            this.activeTabId = null;
            // Switch to the last remaining tab
            const remainingTabs = Array.from(this.tabs.values());
            if (remainingTabs.length > 0) {
                this.switchTab(remainingTabs[remainingTabs.length - 1].id);
            }
            else {
                // No tabs left, show welcome screen
                this.showWelcomeScreen();
            }
        }
        return true;
    }
    /**
     * Switch to a specific tab
     */
    switchTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return;
        }
        // Update active states
        if (this.activeTabId) {
            const previousTab = this.tabs.get(this.activeTabId);
            if (previousTab) {
                previousTab.isActive = false;
                this.updateTabElement(previousTab);
            }
        }
        tab.isActive = true;
        this.activeTabId = tabId;
        // Update UI
        this.updateTabElement(tab);
        this.hideWelcomeScreen();
        // Load content in editor
        if (tab.content !== undefined) {
            this.editorManager.loadFile(tab.filePath, tab.content);
        }
        // Emit tab switch event
        window.dispatchEvent(new CustomEvent('tab-switched', {
            detail: { tab }
        }));
    }
    /**
     * Get active tab
     */
    getActiveTab() {
        if (!this.activeTabId) {
            return null;
        }
        return this.tabs.get(this.activeTabId) || null;
    }
    /**
     * Get all tabs
     */
    getAllTabs() {
        return Array.from(this.tabs.values());
    }
    /**
     * Mark tab as dirty (has unsaved changes)
     */
    markTabDirty(tabId, isDirty) {
        const tab = this.tabs.get(tabId);
        if (!tab) {
            return;
        }
        tab.isDirty = isDirty;
        this.updateTabElement(tab);
    }
    /**
     * Save current tab
     */
    async saveActiveTab() {
        const activeTab = this.getActiveTab();
        if (!activeTab) {
            return false;
        }
        try {
            const content = this.editorManager.getCurrentContent();
            await window.electronAPI.fileOperations.writeFile(activeTab.filePath, content);
            // Update tab content and mark as clean
            activeTab.content = content;
            this.markTabDirty(activeTab.id, false);
            return true;
        }
        catch (error) {
            console.error('Failed to save file:', error);
            return false;
        }
    }
    /**
     * Save tab as new file
     */
    async saveActiveTabAs() {
        const activeTab = this.getActiveTab();
        if (!activeTab) {
            return false;
        }
        try {
            const result = await window.electronAPI.system.showSaveDialog({
                defaultPath: activeTab.fileName,
                filters: [
                    { name: 'All Files', extensions: ['*'] },
                    { name: 'JavaScript', extensions: ['js', 'jsx'] },
                    { name: 'TypeScript', extensions: ['ts', 'tsx'] },
                    { name: 'Python', extensions: ['py'] },
                    { name: 'Text Files', extensions: ['txt', 'md'] }
                ]
            });
            if (result.canceled || !result.filePath) {
                return false;
            }
            const content = this.editorManager.getCurrentContent();
            await window.electronAPI.fileOperations.writeFile(result.filePath, content);
            // Update tab with new file path
            activeTab.filePath = result.filePath;
            activeTab.fileName = this.extractFileName(result.filePath);
            activeTab.content = content;
            activeTab.language = this.editorManager.getLanguageForFile(result.filePath);
            this.markTabDirty(activeTab.id, false);
            // Update tab element
            this.updateTabElement(activeTab);
            return true;
        }
        catch (error) {
            console.error('Failed to save file as:', error);
            return false;
        }
    }
    /**
     * Create tab element in the UI
     */
    createTabElement(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tab.id;
        tabElement.innerHTML = `
      <span class="tab-icon">${this.getFileIcon(tab.fileName)}</span>
      <span class="tab-name">${tab.fileName}</span>
      <span class="tab-dirty-indicator" style="display: none;">●</span>
      <span class="tab-close" title="Close">×</span>
    `;
        // Add event listeners
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('tab-close')) {
                this.switchTab(tab.id);
            }
        });
        const closeButton = tabElement.querySelector('.tab-close');
        closeButton.addEventListener('click', (e) => {
            e.stopPropagation();
            this.closeTab(tab.id);
        });
        this.tabBarElement.appendChild(tabElement);
    }
    /**
     * Update tab element in the UI
     */
    updateTabElement(tab) {
        const tabElement = this.tabBarElement.querySelector(`[data-tab-id="${tab.id}"]`);
        if (!tabElement) {
            return;
        }
        // Update active state
        if (tab.isActive) {
            tabElement.classList.add('active');
        }
        else {
            tabElement.classList.remove('active');
        }
        // Update dirty indicator
        const dirtyIndicator = tabElement.querySelector('.tab-dirty-indicator');
        if (dirtyIndicator) {
            dirtyIndicator.style.display = tab.isDirty ? 'inline' : 'none';
        }
        // Update tab name
        const tabName = tabElement.querySelector('.tab-name');
        if (tabName) {
            tabName.textContent = tab.fileName;
        }
        // Update icon
        const tabIcon = tabElement.querySelector('.tab-icon');
        if (tabIcon) {
            tabIcon.textContent = this.getFileIcon(tab.fileName);
        }
    }
    /**
     * Remove tab element from the UI
     */
    removeTabElement(tabId) {
        const tabElement = this.tabBarElement.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }
    }
    /**
     * Find tab by file path
     */
    findTabByPath(filePath) {
        return Array.from(this.tabs.values()).find(tab => tab.filePath === filePath);
    }
    /**
     * Generate unique tab ID
     */
    generateTabId() {
        return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
    /**
     * Extract file name from path
     */
    extractFileName(filePath) {
        return filePath.split(/[/\\]/).pop() || 'Untitled';
    }
    /**
     * Get file icon based on extension
     */
    getFileIcon(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        const iconMap = {
            'js': '🟨',
            'jsx': '🟨',
            'ts': '🔷',
            'tsx': '🔷',
            'py': '🐍',
            'html': '🌐',
            'css': '🎨',
            'scss': '🎨',
            'json': '📋',
            'md': '📝',
            'txt': '📄',
            'yml': '⚙️',
            'yaml': '⚙️',
            'xml': '📄'
        };
        return iconMap[extension || ''] || '📄';
    }
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for editor content changes to mark tabs as dirty
        window.addEventListener('editor-content-changed', () => {
            const activeTab = this.getActiveTab();
            if (activeTab) {
                const isDirty = this.editorManager.isDirty();
                this.markTabDirty(activeTab.id, isDirty);
            }
        });
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl+W or Cmd+W to close tab
            if ((e.ctrlKey || e.metaKey) && e.key === 'w') {
                e.preventDefault();
                const activeTab = this.getActiveTab();
                if (activeTab) {
                    this.closeTab(activeTab.id);
                }
            }
            // Ctrl+S or Cmd+S to save
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveActiveTab();
            }
            // Ctrl+Shift+S or Cmd+Shift+S to save as
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveActiveTabAs();
            }
            // Ctrl+Tab to switch between tabs
            if (e.ctrlKey && e.key === 'Tab') {
                e.preventDefault();
                this.switchToNextTab();
            }
        });
    }
    /**
     * Switch to next tab
     */
    switchToNextTab() {
        const tabs = this.getAllTabs();
        if (tabs.length <= 1) {
            return;
        }
        const currentIndex = tabs.findIndex(tab => tab.id === this.activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        this.switchTab(tabs[nextIndex].id);
    }
    /**
     * Show welcome screen
     */
    showWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'flex';
        }
    }
    /**
     * Hide welcome screen
     */
    hideWelcomeScreen() {
        const welcomeScreen = document.getElementById('welcomeScreen');
        if (welcomeScreen) {
            welcomeScreen.style.display = 'none';
        }
    }
}
exports.TabManager = TabManager;
//# sourceMappingURL=tabs.js.map