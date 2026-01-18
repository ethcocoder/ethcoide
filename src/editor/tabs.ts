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

export class TabManager {
  private tabs: Map<string, Tab> = new Map();
  private activeTabId: string | null = null;
  private editorManager: MonacoEditorManager;
  private tabBarElement: HTMLElement;

  constructor(editorManager: MonacoEditorManager, tabBarElement: HTMLElement) {
    this.editorManager = editorManager;
    this.tabBarElement = tabBarElement;
    this.setupEventListeners();
  }

  /**
   * Open a file in a new tab or switch to existing tab
   */
  async openFile(filePath: string): Promise<Tab> {
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
      const tab: Tab = {
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
    } catch (error) {
      console.error('Failed to open file:', error);
      throw error;
    }
  }

  /**
   * Close a tab
   */
  closeTab(tabId: string): boolean {
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
      } else {
        // No tabs left, show welcome screen
        this.showWelcomeScreen();
      }
    }

    return true;
  }

  /**
   * Switch to a specific tab
   */
  switchTab(tabId: string): void {
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
  getActiveTab(): Tab | null {
    if (!this.activeTabId) {
      return null;
    }
    return this.tabs.get(this.activeTabId) || null;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): Tab[] {
    return Array.from(this.tabs.values());
  }

  /**
   * Mark tab as dirty (has unsaved changes)
   */
  markTabDirty(tabId: string, isDirty: boolean): void {
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
  async saveActiveTab(): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to save file:', error);
      return false;
    }
  }

  /**
   * Save tab as new file
   */
  async saveActiveTabAs(): Promise<boolean> {
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
    } catch (error) {
      console.error('Failed to save file as:', error);
      return false;
    }
  }

  /**
   * Create tab element in the UI
   */
  private createTabElement(tab: Tab): void {
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
      if (!(e.target as HTMLElement).classList.contains('tab-close')) {
        this.switchTab(tab.id);
      }
    });

    const closeButton = tabElement.querySelector('.tab-close') as HTMLElement;
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.closeTab(tab.id);
    });

    this.tabBarElement.appendChild(tabElement);
  }

  /**
   * Update tab element in the UI
   */
  private updateTabElement(tab: Tab): void {
    const tabElement = this.tabBarElement.querySelector(`[data-tab-id="${tab.id}"]`) as HTMLElement;
    if (!tabElement) {
      return;
    }

    // Update active state
    if (tab.isActive) {
      tabElement.classList.add('active');
    } else {
      tabElement.classList.remove('active');
    }

    // Update dirty indicator
    const dirtyIndicator = tabElement.querySelector('.tab-dirty-indicator') as HTMLElement;
    if (dirtyIndicator) {
      dirtyIndicator.style.display = tab.isDirty ? 'inline' : 'none';
    }

    // Update tab name
    const tabName = tabElement.querySelector('.tab-name') as HTMLElement;
    if (tabName) {
      tabName.textContent = tab.fileName;
    }

    // Update icon
    const tabIcon = tabElement.querySelector('.tab-icon') as HTMLElement;
    if (tabIcon) {
      tabIcon.textContent = this.getFileIcon(tab.fileName);
    }
  }

  /**
   * Remove tab element from the UI
   */
  private removeTabElement(tabId: string): void {
    const tabElement = this.tabBarElement.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }
  }

  /**
   * Find tab by file path
   */
  private findTabByPath(filePath: string): Tab | undefined {
    return Array.from(this.tabs.values()).find(tab => tab.filePath === filePath);
  }

  /**
   * Generate unique tab ID
   */
  private generateTabId(): string {
    return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Extract file name from path
   */
  private extractFileName(filePath: string): string {
    return filePath.split(/[/\\]/).pop() || 'Untitled';
  }

  /**
   * Get file icon based on extension
   */
  private getFileIcon(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const iconMap: { [key: string]: string } = {
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
  private setupEventListeners(): void {
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
  private switchToNextTab(): void {
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
  private showWelcomeScreen(): void {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
      welcomeScreen.style.display = 'flex';
    }
  }

  /**
   * Hide welcome screen
   */
  private hideWelcomeScreen(): void {
    const welcomeScreen = document.getElementById('welcomeScreen');
    if (welcomeScreen) {
      welcomeScreen.style.display = 'none';
    }
  }
}