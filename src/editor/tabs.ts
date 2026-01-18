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

export class TabManager {
  private tabs: Tab[] = [];
  private activeTabId: string | null = null;
  private tabsContainer: HTMLElement | null = null;
  private onTabChange?: (tab: Tab | null) => void;
  private onTabClose?: (tab: Tab) => void;

  constructor() {
    this.initializeTabContainer();
    this.setupKeyboardShortcuts();
  }

  /**
   * Initialize tab container and scroll buttons
   */
  private initializeTabContainer(): void {
    this.tabsContainer = document.getElementById('tabsContainer');
    this.updateScrollButtons();
  }

  /**
   * Set callback for tab change events
   */
  setOnTabChange(callback: (tab: Tab | null) => void): void {
    this.onTabChange = callback;
  }

  /**
   * Set callback for tab close events
   */
  setOnTabClose(callback: (tab: Tab) => void): void {
    this.onTabClose = callback;
  }

  /**
   * Add a new tab
   */
  addTab(filePath: string, fileName: string, content: string): Tab {
    // Check if tab already exists
    const existingTab = this.tabs.find(tab => tab.filePath === filePath);
    if (existingTab) {
      this.switchToTab(existingTab.id);
      return existingTab;
    }

    // Create new tab
    const tab: Tab = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      filePath,
      fileName,
      content,
      isDirty: false,
      language: this.getLanguageFromFileName(fileName)
    };

    this.tabs.push(tab);
    this.createTabElement(tab);
    this.switchToTab(tab.id);
    this.updateScrollButtons();

    return tab;
  }

  /**
   * Remove a tab
   */
  removeTab(tabId: string): void {
    const tabIndex = this.tabs.findIndex(tab => tab.id === tabId);
    if (tabIndex === -1) return;

    const tab = this.tabs[tabIndex];
    
    // Call close callback
    if (this.onTabClose) {
      this.onTabClose(tab);
    }

    // Remove from array
    this.tabs.splice(tabIndex, 1);

    // Remove DOM element
    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.remove();
    }

    // Handle active tab change
    if (this.activeTabId === tabId) {
      if (this.tabs.length > 0) {
        // Switch to adjacent tab
        const newActiveIndex = Math.max(0, tabIndex - 1);
        this.switchToTab(this.tabs[newActiveIndex].id);
      } else {
        // No tabs left
        this.activeTabId = null;
        if (this.onTabChange) {
          this.onTabChange(null);
        }
      }
    }

    this.updateScrollButtons();
  }

  /**
   * Switch to a specific tab
   */
  switchToTab(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    // Update active state in DOM
    document.querySelectorAll('.tab').forEach(tabEl => {
      tabEl.classList.remove('active');
    });

    const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
    if (tabElement) {
      tabElement.classList.add('active');
      this.scrollToTab(tabElement as HTMLElement);
    }

    this.activeTabId = tabId;

    // Call change callback
    if (this.onTabChange) {
      this.onTabChange(tab);
    }
  }

  /**
   * Get the currently active tab
   */
  getActiveTab(): Tab | null {
    if (!this.activeTabId) return null;
    return this.tabs.find(tab => tab.id === this.activeTabId) || null;
  }

  /**
   * Get all tabs
   */
  getAllTabs(): Tab[] {
    return [...this.tabs];
  }

  /**
   * Update tab content
   */
  updateTabContent(tabId: string, content: string, isDirty: boolean = true): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.content = content;
    tab.isDirty = isDirty;

    this.updateTabTitle(tab);
  }

  /**
   * Mark tab as saved (not dirty)
   */
  markTabAsSaved(tabId: string): void {
    const tab = this.tabs.find(t => t.id === tabId);
    if (!tab) return;

    tab.isDirty = false;
    this.updateTabTitle(tab);
  }

  /**
   * Close all tabs
   */
  closeAllTabs(): void {
    const tabIds = this.tabs.map(tab => tab.id);
    tabIds.forEach(id => this.removeTab(id));
  }

  /**
   * Close all tabs except the specified one
   */
  closeOtherTabs(keepTabId: string): void {
    const tabIds = this.tabs.filter(tab => tab.id !== keepTabId).map(tab => tab.id);
    tabIds.forEach(id => this.removeTab(id));
  }

  /**
   * Create DOM element for tab
   */
  private createTabElement(tab: Tab): void {
    if (!this.tabsContainer) return;

    const tabElement = document.createElement('div');
    tabElement.className = 'tab';
    tabElement.setAttribute('data-tab-id', tab.id);
    tabElement.onclick = () => this.switchToTab(tab.id);

    const fileIcon = this.getFileIcon(tab.fileName);
    
    tabElement.innerHTML = `
      <span class="tab-icon">${fileIcon}</span>
      <span class="tab-title">${tab.fileName}</span>
      <span class="tab-close" onclick="event.stopPropagation(); tabManager.removeTab('${tab.id}')">&times;</span>
    `;

    this.tabsContainer.appendChild(tabElement);
  }

  /**
   * Update tab title to show dirty state
   */
  private updateTabTitle(tab: Tab): void {
    const tabElement = document.querySelector(`[data-tab-id="${tab.id}"]`);
    if (!tabElement) return;

    const titleElement = tabElement.querySelector('.tab-title');
    if (titleElement) {
      titleElement.textContent = tab.isDirty ? `${tab.fileName} •` : tab.fileName;
    }
  }

  /**
   * Get file icon based on file extension
   */
  private getFileIcon(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const iconMap: { [key: string]: string } = {
      'ts': '📘',
      'tsx': '⚛️',
      'js': '📜',
      'jsx': '⚛️',
      'json': '📋',
      'html': '🌐',
      'css': '🎨',
      'scss': '🎨',
      'md': '📝',
      'py': '🐍',
      'java': '☕',
      'cpp': '⚙️',
      'c': '⚙️',
      'php': '🐘',
      'rb': '💎',
      'go': '🐹',
      'rs': '🦀',
      'xml': '📄',
      'yml': '⚙️',
      'yaml': '⚙️'
    };

    return iconMap[extension || ''] || '📄';
  }

  /**
   * Get language from file name
   */
  private getLanguageFromFileName(fileName: string): string {
    const extension = fileName.toLowerCase().split('.').pop();
    
    const languageMap: { [key: string]: string } = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'json': 'json',
      'html': 'html',
      'htm': 'html',
      'css': 'css',
      'scss': 'scss',
      'less': 'less',
      'md': 'markdown',
      'yml': 'yaml',
      'yaml': 'yaml',
      'xml': 'xml',
      'txt': 'plaintext'
    };

    return languageMap[extension || ''] || 'plaintext';
  }

  /**
   * Scroll to show the specified tab
   */
  private scrollToTab(tabElement: HTMLElement): void {
    if (!this.tabsContainer) return;

    const containerRect = this.tabsContainer.getBoundingClientRect();
    const tabRect = tabElement.getBoundingClientRect();

    if (tabRect.left < containerRect.left) {
      // Tab is to the left of visible area
      this.tabsContainer.scrollLeft -= (containerRect.left - tabRect.left + 20);
    } else if (tabRect.right > containerRect.right) {
      // Tab is to the right of visible area
      this.tabsContainer.scrollLeft += (tabRect.right - containerRect.right + 20);
    }
  }

  /**
   * Update scroll button states
   */
  private updateScrollButtons(): void {
    if (!this.tabsContainer) return;

    const leftButton = document.getElementById('tabScrollLeft') as HTMLButtonElement;
    const rightButton = document.getElementById('tabScrollRight') as HTMLButtonElement;

    if (leftButton && rightButton) {
      const canScrollLeft = this.tabsContainer.scrollLeft > 0;
      const canScrollRight = this.tabsContainer.scrollLeft < 
        (this.tabsContainer.scrollWidth - this.tabsContainer.clientWidth);

      leftButton.disabled = !canScrollLeft;
      rightButton.disabled = !canScrollRight;

      // Update container classes for fade effects
      const container = document.querySelector('.tab-scroll-container');
      if (container) {
        container.classList.toggle('can-scroll-left', canScrollLeft);
        container.classList.toggle('can-scroll-right', canScrollRight);
      }
    }
  }

  /**
   * Scroll tabs left or right
   */
  scrollTabs(direction: 'left' | 'right'): void {
    if (!this.tabsContainer) return;

    const scrollAmount = 200;
    
    if (direction === 'left') {
      this.tabsContainer.scrollLeft -= scrollAmount;
    } else {
      this.tabsContainer.scrollLeft += scrollAmount;
    }

    // Update scroll buttons after scrolling
    setTimeout(() => this.updateScrollButtons(), 100);
  }

  /**
   * Setup keyboard shortcuts for tab management
   */
  private setupKeyboardShortcuts(): void {
    document.addEventListener('keydown', (e) => {
      // Ctrl+W - Close current tab
      if (e.ctrlKey && e.key === 'w') {
        e.preventDefault();
        if (this.activeTabId) {
          this.removeTab(this.activeTabId);
        }
      }

      // Ctrl+Tab - Switch to next tab
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        this.switchToNextTab();
      }

      // Ctrl+Shift+Tab - Switch to previous tab
      if (e.ctrlKey && e.shiftKey && e.key === 'Tab') {
        e.preventDefault();
        this.switchToPreviousTab();
      }

      // Ctrl+1-9 - Switch to tab by index
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < this.tabs.length) {
          this.switchToTab(this.tabs[index].id);
        }
      }
    });
  }

  /**
   * Switch to next tab
   */
  private switchToNextTab(): void {
    if (this.tabs.length <= 1) return;

    const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
    const nextIndex = (currentIndex + 1) % this.tabs.length;
    this.switchToTab(this.tabs[nextIndex].id);
  }

  /**
   * Switch to previous tab
   */
  private switchToPreviousTab(): void {
    if (this.tabs.length <= 1) return;

    const currentIndex = this.tabs.findIndex(tab => tab.id === this.activeTabId);
    const prevIndex = currentIndex === 0 ? this.tabs.length - 1 : currentIndex - 1;
    this.switchToTab(this.tabs[prevIndex].id);
  }
}

// Global tab manager instance
export const tabManager = new TabManager();