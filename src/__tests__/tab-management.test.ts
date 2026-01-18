/**
 * Unit tests for Tab Management System
 * Validates: Requirements 2.3, 2.4
 */

import { TabManager, Tab } from '../editor/tabs';

// Mock DOM elements
const mockTabsContainer = {
  appendChild: jest.fn(),
  scrollLeft: 0,
  scrollWidth: 1000,
  clientWidth: 500,
  getBoundingClientRect: () => ({ left: 0, right: 500 })
};

const mockTabElement = {
  classList: {
    add: jest.fn(),
    remove: jest.fn(),
    toggle: jest.fn()
  },
  querySelector: jest.fn(),
  remove: jest.fn(),
  getBoundingClientRect: () => ({ left: 100, right: 200 }),
  onclick: null
};

const mockScrollButton = {
  disabled: false
};

// Mock document methods
const mockDocument = {
  getElementById: jest.fn((id: string) => {
    if (id === 'tabsContainer') return mockTabsContainer;
    if (id === 'tabScrollLeft' || id === 'tabScrollRight') return mockScrollButton;
    return null;
  }),
  querySelector: jest.fn(() => mockTabElement),
  querySelectorAll: jest.fn(() => [mockTabElement]),
  addEventListener: jest.fn(),
  createElement: jest.fn(() => ({
    className: '',
    setAttribute: jest.fn(),
    onclick: null,
    innerHTML: ''
  }))
};

// Setup global mocks
(global as any).document = mockDocument;

describe('TabManager', () => {
  let tabManager: TabManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new TabManager instance
    tabManager = new TabManager();
  });

  describe('Tab Creation and Management', () => {
    test('should create a new tab with correct properties', () => {
      const filePath = '/test/file.ts';
      const fileName = 'file.ts';
      const content = 'console.log("test");';

      const tab = tabManager.addTab(filePath, fileName, content);

      expect(tab).toMatchObject({
        filePath,
        fileName,
        content,
        isDirty: false,
        language: 'typescript'
      });
      expect(tab.id).toBeTruthy();
    });

    test('should not create duplicate tabs for same file path', () => {
      const filePath = '/test/file.ts';
      const fileName = 'file.ts';
      const content = 'console.log("test");';

      const tab1 = tabManager.addTab(filePath, fileName, content);
      const tab2 = tabManager.addTab(filePath, fileName, content);

      expect(tab1.id).toBe(tab2.id);
      expect(tabManager.getAllTabs()).toHaveLength(1);
    });

    test('should handle multiple different tabs', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      const tab3 = tabManager.addTab('/test/file3.json', 'file3.json', '{}');

      const allTabs = tabManager.getAllTabs();
      expect(allTabs).toHaveLength(3);
      expect(allTabs[0].fileName).toBe('file1.ts');
      expect(allTabs[1].fileName).toBe('file2.js');
      expect(allTabs[2].fileName).toBe('file3.json');
    });
  });

  describe('Tab Switching', () => {
    test('should switch to active tab correctly', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');

      tabManager.switchToTab(tab1.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);

      tabManager.switchToTab(tab2.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab2.id);
    });

    test('should handle switching to non-existent tab gracefully', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      
      tabManager.switchToTab('non-existent-id');
      
      // Should still have the original active tab
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
    });

    test('should call onTabChange callback when switching tabs', () => {
      const onTabChange = jest.fn();
      tabManager.setOnTabChange(onTabChange);

      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');

      tabManager.switchToTab(tab1.id);
      expect(onTabChange).toHaveBeenCalledWith(tab1);

      tabManager.switchToTab(tab2.id);
      expect(onTabChange).toHaveBeenCalledWith(tab2);
    });
  });

  describe('Tab Closing', () => {
    test('should remove tab correctly', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');

      expect(tabManager.getAllTabs()).toHaveLength(2);

      tabManager.removeTab(tab1.id);

      expect(tabManager.getAllTabs()).toHaveLength(1);
      expect(tabManager.getAllTabs()[0].id).toBe(tab2.id);
    });

    test('should switch to adjacent tab when closing active tab', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      const tab3 = tabManager.addTab('/test/file3.json', 'file3.json', '{}');

      // Make tab2 active
      tabManager.switchToTab(tab2.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab2.id);

      // Close tab2, should switch to tab1 (previous)
      tabManager.removeTab(tab2.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
    });

    test('should call onTabClose callback when closing tab', () => {
      const onTabClose = jest.fn();
      tabManager.setOnTabClose(onTabClose);

      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      
      tabManager.removeTab(tab1.id);
      
      expect(onTabClose).toHaveBeenCalledWith(tab1);
    });

    test('should handle closing non-existent tab gracefully', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      
      expect(() => {
        tabManager.removeTab('non-existent-id');
      }).not.toThrow();
      
      expect(tabManager.getAllTabs()).toHaveLength(1);
    });

    test('should call onTabChange with null when all tabs are closed', () => {
      const onTabChange = jest.fn();
      tabManager.setOnTabChange(onTabChange);

      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      
      tabManager.removeTab(tab1.id);
      
      expect(onTabChange).toHaveBeenCalledWith(null);
      expect(tabManager.getActiveTab()).toBeNull();
    });
  });

  describe('Tab Content Management', () => {
    test('should update tab content and mark as dirty', () => {
      const tab = tabManager.addTab('/test/file.ts', 'file.ts', 'original content');
      
      expect(tab.isDirty).toBe(false);
      
      tabManager.updateTabContent(tab.id, 'modified content', true);
      
      const updatedTab = tabManager.getActiveTab();
      expect(updatedTab?.content).toBe('modified content');
      expect(updatedTab?.isDirty).toBe(true);
    });

    test('should mark tab as saved', () => {
      const tab = tabManager.addTab('/test/file.ts', 'file.ts', 'content');
      
      tabManager.updateTabContent(tab.id, 'modified content', true);
      expect(tabManager.getActiveTab()?.isDirty).toBe(true);
      
      tabManager.markTabAsSaved(tab.id);
      expect(tabManager.getActiveTab()?.isDirty).toBe(false);
    });

    test('should handle updating non-existent tab gracefully', () => {
      expect(() => {
        tabManager.updateTabContent('non-existent-id', 'content');
      }).not.toThrow();
    });
  });

  describe('Language Detection', () => {
    test('should detect correct language for different file types', () => {
      const testCases = [
        { fileName: 'app.ts', expectedLanguage: 'typescript' },
        { fileName: 'component.tsx', expectedLanguage: 'typescript' },
        { fileName: 'script.js', expectedLanguage: 'javascript' },
        { fileName: 'component.jsx', expectedLanguage: 'javascript' },
        { fileName: 'data.json', expectedLanguage: 'json' },
        { fileName: 'index.html', expectedLanguage: 'html' },
        { fileName: 'styles.css', expectedLanguage: 'css' },
        { fileName: 'README.md', expectedLanguage: 'markdown' },
        { fileName: 'config.yml', expectedLanguage: 'yaml' },
        { fileName: 'unknown.xyz', expectedLanguage: 'plaintext' }
      ];

      testCases.forEach(({ fileName, expectedLanguage }) => {
        const tab = tabManager.addTab(`/test/${fileName}`, fileName, 'content');
        expect(tab.language).toBe(expectedLanguage);
        
        // Clean up for next test
        tabManager.removeTab(tab.id);
      });
    });
  });

  describe('Bulk Operations', () => {
    test('should close all tabs', () => {
      tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      tabManager.addTab('/test/file3.json', 'file3.json', '{}');

      expect(tabManager.getAllTabs()).toHaveLength(3);

      tabManager.closeAllTabs();

      expect(tabManager.getAllTabs()).toHaveLength(0);
      expect(tabManager.getActiveTab()).toBeNull();
    });

    test('should close other tabs except specified one', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      const tab3 = tabManager.addTab('/test/file3.json', 'file3.json', '{}');

      expect(tabManager.getAllTabs()).toHaveLength(3);

      tabManager.closeOtherTabs(tab2.id);

      expect(tabManager.getAllTabs()).toHaveLength(1);
      expect(tabManager.getAllTabs()[0].id).toBe(tab2.id);
    });
  });

  describe('Tab State Tracking', () => {
    test('should track active tab state correctly', () => {
      expect(tabManager.getActiveTab()).toBeNull();

      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);

      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      expect(tabManager.getActiveTab()?.id).toBe(tab2.id);

      tabManager.switchToTab(tab1.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
    });

    test('should maintain tab order', () => {
      const tab1 = tabManager.addTab('/test/file1.ts', 'file1.ts', 'content1');
      const tab2 = tabManager.addTab('/test/file2.js', 'file2.js', 'content2');
      const tab3 = tabManager.addTab('/test/file3.json', 'file3.json', '{}');

      const allTabs = tabManager.getAllTabs();
      expect(allTabs[0].id).toBe(tab1.id);
      expect(allTabs[1].id).toBe(tab2.id);
      expect(allTabs[2].id).toBe(tab3.id);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing DOM elements gracefully', () => {
      // Mock getElementById to return null
      mockDocument.getElementById.mockReturnValue(null);
      
      const newTabManager = new TabManager();
      
      expect(() => {
        newTabManager.addTab('/test/file.ts', 'file.ts', 'content');
      }).not.toThrow();
    });

    test('should handle scroll operations with missing container', () => {
      mockDocument.getElementById.mockReturnValue(null);
      
      const newTabManager = new TabManager();
      
      expect(() => {
        newTabManager.scrollTabs('left');
        newTabManager.scrollTabs('right');
      }).not.toThrow();
    });
  });
});