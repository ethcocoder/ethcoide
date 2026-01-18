// Mock Monaco Editor before importing
jest.mock('monaco-editor', () => ({
  editor: {
    create: jest.fn(),
    createModel: jest.fn(),
    defineTheme: jest.fn(),
    setTheme: jest.fn()
  },
  languages: {
    typescript: {
      typescriptDefaults: {
        setCompilerOptions: jest.fn(),
        setDiagnosticsOptions: jest.fn(),
        addExtraLib: jest.fn()
      },
      ScriptTarget: { ES2020: 'ES2020' },
      ModuleResolutionKind: { NodeJs: 'NodeJs' },
      ModuleKind: { CommonJS: 'CommonJS' },
      JsxEmit: { React: 'React' }
    }
  },
  Uri: {
    file: jest.fn()
  },
  Range: jest.fn(),
  Position: jest.fn()
}));

import { MonacoEditorManager } from '../editor/monaco-setup';
import { TabManager } from '../editor/tabs';

// Get the mocked monaco
const mockMonaco = require('monaco-editor');

describe('Feature: ai-powered-ide, Tab Management Tests', () => {
  let editorManager: MonacoEditorManager;
  let tabManager: TabManager;
  let mockTabBar: HTMLElement;
  let mockEditor: any;
  let mockModel: any;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Setup DOM elements
    mockTabBar = document.createElement('div');
    mockTabBar.id = 'tabBar';
    document.body.appendChild(mockTabBar);
    
    // Create welcome screen element
    const welcomeScreen = document.createElement('div');
    welcomeScreen.id = 'welcomeScreen';
    welcomeScreen.style.display = 'flex';
    document.body.appendChild(welcomeScreen);
    
    // Create monaco editor container
    const monacoEditor = document.createElement('div');
    monacoEditor.id = 'monacoEditor';
    monacoEditor.style.display = 'none';
    document.body.appendChild(monacoEditor);
    
    // Mock editor instance
    mockEditor = {
      onDidChangeModelContent: jest.fn(),
      onDidChangeCursorPosition: jest.fn(),
      onDidChangeCursorSelection: jest.fn(),
      onDidFocusEditorText: jest.fn(),
      onDidBlurEditorText: jest.fn(),
      setModel: jest.fn(),
      focus: jest.fn(),
      getPosition: jest.fn(),
      getSelection: jest.fn(),
      executeEdits: jest.fn(),
      dispose: jest.fn()
    };
    
    mockModel = {
      getValue: jest.fn().mockReturnValue('test content'),
      setValue: jest.fn(),
      getAlternativeVersionId: jest.fn().mockReturnValue(1),
      getVersionId: jest.fn().mockReturnValue(1),
      isDisposed: jest.fn().mockReturnValue(false),
      dispose: jest.fn()
    };
    
    mockMonaco.editor.create.mockReturnValue(mockEditor);
    mockMonaco.editor.createModel.mockReturnValue(mockModel);
    mockMonaco.Uri.file.mockReturnValue('file://test.ts');
    
    // Mock window.electronAPI
    (window as any).electronAPI = {
      fileOperations: {
        readFile: jest.fn().mockResolvedValue('test file content'),
        writeFile: jest.fn().mockResolvedValue(undefined)
      },
      system: {
        showSaveDialog: jest.fn().mockResolvedValue({
          canceled: false,
          filePath: '/test/saved-file.ts'
        })
      }
    };
    
    // Initialize managers
    editorManager = new MonacoEditorManager();
    await editorManager.initializeMonaco();
    
    // Create editor with mock container
    const mockContainer = document.createElement('div');
    editorManager.createEditor(mockContainer);
    
    tabManager = new TabManager(editorManager, mockTabBar);
  });

  afterEach(() => {
    // Clean up DOM
    document.body.innerHTML = '';
    
    if (editorManager) {
      editorManager.dispose();
    }
  });

  describe('Tab Creation and Management', () => {
    test('should open a new file in a tab', async () => {
      const filePath = '/test/app.ts';
      
      const tab = await tabManager.openFile(filePath);
      
      expect(tab).toBeDefined();
      expect(tab.filePath).toBe(filePath);
      expect(tab.fileName).toBe('app.ts');
      expect(tab.language).toBe('typescript');
      expect(tab.isDirty).toBe(false);
      expect(tab.isActive).toBe(true);
      
      // Should create tab element in DOM
      const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab.id}"]`);
      expect(tabElement).toBeTruthy();
      
      // Should read file content
      expect(window.electronAPI.fileOperations.readFile).toHaveBeenCalledWith(filePath);
    });

    test('should reuse existing tab when opening same file', async () => {
      const filePath = '/test/app.ts';
      
      // Open file first time
      const tab1 = await tabManager.openFile(filePath);
      
      // Open same file again
      const tab2 = await tabManager.openFile(filePath);
      
      expect(tab1.id).toBe(tab2.id);
      expect(window.electronAPI.fileOperations.readFile).toHaveBeenCalledTimes(1);
    });

    test('should create multiple tabs for different files', async () => {
      const file1 = '/test/app.ts';
      const file2 = '/test/utils.js';
      
      const tab1 = await tabManager.openFile(file1);
      const tab2 = await tabManager.openFile(file2);
      
      expect(tab1.id).not.toBe(tab2.id);
      expect(tab1.isActive).toBe(false);
      expect(tab2.isActive).toBe(true);
      
      const allTabs = tabManager.getAllTabs();
      expect(allTabs).toHaveLength(2);
    });

    test('should switch between tabs correctly', async () => {
      const file1 = '/test/app.ts';
      const file2 = '/test/utils.js';
      
      const tab1 = await tabManager.openFile(file1);
      const tab2 = await tabManager.openFile(file2);
      
      // Switch back to first tab
      tabManager.switchTab(tab1.id);
      
      expect(tab1.isActive).toBe(true);
      expect(tab2.isActive).toBe(false);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
    });

    test('should close tabs correctly', async () => {
      const file1 = '/test/app.ts';
      const file2 = '/test/utils.js';
      
      const tab1 = await tabManager.openFile(file1);
      const tab2 = await tabManager.openFile(file2);
      
      // Close second tab
      const closed = tabManager.closeTab(tab2.id);
      
      expect(closed).toBe(true);
      expect(tabManager.getAllTabs()).toHaveLength(1);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
      
      // Tab element should be removed from DOM
      const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab2.id}"]`);
      expect(tabElement).toBeFalsy();
    });

    test('should show welcome screen when all tabs are closed', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      // Welcome screen should be hidden
      const welcomeScreen = document.getElementById('welcomeScreen');
      expect(welcomeScreen?.style.display).toBe('none');
      
      // Close the tab
      tabManager.closeTab(tab.id);
      
      // Welcome screen should be shown
      expect(welcomeScreen?.style.display).toBe('flex');
    });
  });

  describe('Tab State Management', () => {
    test('should mark tab as dirty when content changes', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      expect(tab.isDirty).toBe(false);
      
      // Simulate content change
      mockModel.getAlternativeVersionId.mockReturnValue(2);
      window.dispatchEvent(new CustomEvent('editor-content-changed'));
      
      expect(tab.isDirty).toBe(true);
      
      // Check dirty indicator in DOM
      const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab.id}"]`);
      const dirtyIndicator = tabElement?.querySelector('.tab-dirty-indicator') as HTMLElement;
      expect(dirtyIndicator?.style.display).toBe('inline');
    });

    test('should save active tab correctly', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      // Mark as dirty
      tab.isDirty = true;
      
      const saved = await tabManager.saveActiveTab();
      
      expect(saved).toBe(true);
      expect(window.electronAPI.fileOperations.writeFile).toHaveBeenCalledWith(
        filePath,
        'test content'
      );
      expect(tab.isDirty).toBe(false);
    });

    test('should save tab as new file correctly', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      const saved = await tabManager.saveActiveTabAs();
      
      expect(saved).toBe(true);
      expect(window.electronAPI.system.showSaveDialog).toHaveBeenCalled();
      expect(window.electronAPI.fileOperations.writeFile).toHaveBeenCalledWith(
        '/test/saved-file.ts',
        'test content'
      );
      
      // Tab should be updated with new file path
      expect(tab.filePath).toBe('/test/saved-file.ts');
      expect(tab.fileName).toBe('saved-file.ts');
    });

    test('should prevent closing dirty tab without confirmation', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      // Mark as dirty
      tab.isDirty = true;
      
      // Mock confirm to return false (don't close)
      global.confirm = jest.fn().mockReturnValue(false);
      
      const closed = tabManager.closeTab(tab.id);
      
      expect(closed).toBe(false);
      expect(tabManager.getAllTabs()).toHaveLength(1);
      expect(global.confirm).toHaveBeenCalledWith(
        'File "app.ts" has unsaved changes. Close anyway?'
      );
    });

    test('should close dirty tab with confirmation', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      // Mark as dirty
      tab.isDirty = true;
      
      // Mock confirm to return true (close anyway)
      global.confirm = jest.fn().mockReturnValue(true);
      
      const closed = tabManager.closeTab(tab.id);
      
      expect(closed).toBe(true);
      expect(tabManager.getAllTabs()).toHaveLength(0);
    });
  });

  describe('File Icon Detection', () => {
    test('should display correct icons for different file types', async () => {
      const testFiles = [
        { path: '/test/app.ts', expectedIcon: '🔷' },
        { path: '/test/script.js', expectedIcon: '🟨' },
        { path: '/test/main.py', expectedIcon: '🐍' },
        { path: '/test/index.html', expectedIcon: '🌐' },
        { path: '/test/styles.css', expectedIcon: '🎨' },
        { path: '/test/data.json', expectedIcon: '📋' },
        { path: '/test/README.md', expectedIcon: '📝' },
        { path: '/test/unknown.xyz', expectedIcon: '📄' }
      ];

      for (const { path, expectedIcon } of testFiles) {
        const tab = await tabManager.openFile(path);
        const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab.id}"]`);
        const iconElement = tabElement?.querySelector('.tab-icon');
        
        expect(iconElement?.textContent).toBe(expectedIcon);
        
        // Clean up for next iteration
        tabManager.closeTab(tab.id);
      }
    });
  });

  describe('Tab UI Elements', () => {
    test('should create proper tab DOM structure', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab.id}"]`);
      expect(tabElement).toBeTruthy();
      expect(tabElement?.classList.contains('tab')).toBe(true);
      
      // Check tab components
      const icon = tabElement?.querySelector('.tab-icon');
      const name = tabElement?.querySelector('.tab-name');
      const dirtyIndicator = tabElement?.querySelector('.tab-dirty-indicator');
      const closeButton = tabElement?.querySelector('.tab-close');
      
      expect(icon).toBeTruthy();
      expect(name?.textContent).toBe('app.ts');
      expect(dirtyIndicator).toBeTruthy();
      expect(closeButton?.textContent).toBe('×');
    });

    test('should handle tab click events', async () => {
      const file1 = '/test/app.ts';
      const file2 = '/test/utils.js';
      
      const tab1 = await tabManager.openFile(file1);
      const tab2 = await tabManager.openFile(file2);
      
      // Click on first tab
      const tab1Element = mockTabBar.querySelector(`[data-tab-id="${tab1.id}"]`) as HTMLElement;
      tab1Element.click();
      
      expect(tab1.isActive).toBe(true);
      expect(tab2.isActive).toBe(false);
    });

    test('should handle close button click events', async () => {
      const filePath = '/test/app.ts';
      const tab = await tabManager.openFile(filePath);
      
      const tabElement = mockTabBar.querySelector(`[data-tab-id="${tab.id}"]`);
      const closeButton = tabElement?.querySelector('.tab-close') as HTMLElement;
      
      closeButton.click();
      
      expect(tabManager.getAllTabs()).toHaveLength(0);
    });
  });

  describe('Active Tab Management', () => {
    test('should return correct active tab', async () => {
      const file1 = '/test/app.ts';
      const file2 = '/test/utils.js';
      
      const tab1 = await tabManager.openFile(file1);
      const tab2 = await tabManager.openFile(file2);
      
      expect(tabManager.getActiveTab()?.id).toBe(tab2.id);
      
      tabManager.switchTab(tab1.id);
      expect(tabManager.getActiveTab()?.id).toBe(tab1.id);
    });

    test('should return null when no tabs are open', () => {
      expect(tabManager.getActiveTab()).toBeNull();
    });

    test('should hide/show welcome screen correctly', async () => {
      const welcomeScreen = document.getElementById('welcomeScreen');
      const monacoEditor = document.getElementById('monacoEditor');
      
      // Initially welcome screen should be visible
      expect(welcomeScreen?.style.display).toBe('flex');
      expect(monacoEditor?.style.display).toBe('none');
      
      // Open a file
      await tabManager.openFile('/test/app.ts');
      
      // Welcome screen should be hidden, editor visible
      expect(welcomeScreen?.style.display).toBe('none');
      expect(monacoEditor?.style.display).toBe('block');
    });
  });
});