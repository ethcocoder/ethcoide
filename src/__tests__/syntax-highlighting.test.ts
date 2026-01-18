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

// Get the mocked monaco
const mockMonaco = require('monaco-editor');

// Mock global monaco
(global as any).monaco = mockMonaco;
(global as any).self = {
  MonacoEnvironment: {}
};

describe('Feature: ai-powered-ide, Syntax Highlighting Tests', () => {
  let editorManager: MonacoEditorManager;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    jest.clearAllMocks();
    editorManager = new MonacoEditorManager();
    mockContainer = document.createElement('div');
    
    // Mock editor instance
    const mockEditor = {
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
    
    mockMonaco.editor.create.mockReturnValue(mockEditor);
    
    const mockModel = {
      getValue: jest.fn().mockReturnValue(''),
      setValue: jest.fn(),
      getAlternativeVersionId: jest.fn().mockReturnValue(1),
      getVersionId: jest.fn().mockReturnValue(1),
      isDisposed: jest.fn().mockReturnValue(false),
      dispose: jest.fn()
    };
    
    mockMonaco.editor.createModel.mockReturnValue(mockModel);
    mockMonaco.Uri.file.mockReturnValue('file://test.ts');
  });

  afterEach(() => {
    if (editorManager) {
      editorManager.dispose();
    }
  });

  describe('Language Detection and Syntax Highlighting', () => {
    test('should correctly identify TypeScript files', () => {
      const testCases = [
        { fileName: 'app.ts', expected: 'typescript' },
        { fileName: 'component.tsx', expected: 'typescript' },
        { fileName: 'App.TS', expected: 'typescript' },
        { fileName: 'Component.TSX', expected: 'typescript' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });

    test('should correctly identify JavaScript files', () => {
      const testCases = [
        { fileName: 'app.js', expected: 'javascript' },
        { fileName: 'component.jsx', expected: 'javascript' },
        { fileName: 'App.JS', expected: 'javascript' },
        { fileName: 'Component.JSX', expected: 'javascript' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });

    test('should correctly identify Python files', () => {
      const testCases = [
        { fileName: 'main.py', expected: 'python' },
        { fileName: 'script.PY', expected: 'python' },
        { fileName: 'test_module.py', expected: 'python' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });

    test('should correctly identify web files', () => {
      const testCases = [
        { fileName: 'index.html', expected: 'html' },
        { fileName: 'styles.css', expected: 'css' },
        { fileName: 'styles.scss', expected: 'scss' },
        { fileName: 'config.json', expected: 'json' },
        { fileName: 'README.md', expected: 'markdown' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });

    test('should default to plaintext for unknown file types', () => {
      const testCases = [
        'unknown.xyz',
        'file.unknown',
        'noextension',
        'file.',
        '.hiddenfile'
      ];

      testCases.forEach(fileName => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe('plaintext');
      });
    });

    test('should handle edge cases in file names', () => {
      const testCases = [
        { fileName: '', expected: 'plaintext' },
        { fileName: '.', expected: 'plaintext' },
        { fileName: '..', expected: 'plaintext' },
        { fileName: 'file.with.multiple.dots.js', expected: 'javascript' },
        { fileName: 'UPPERCASE.TS', expected: 'typescript' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = editorManager.getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });
  });

  describe('Theme Configuration', () => {
    test('should define custom AI IDE dark theme', async () => {
      await editorManager.initializeMonaco();
      editorManager.setupLanguageSupport();

      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith('ai-ide-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A9955' },
          { token: 'keyword', foreground: '569CD6' },
          { token: 'string', foreground: 'CE9178' },
          { token: 'number', foreground: 'B5CEA8' },
          { token: 'type', foreground: '4EC9B0' },
          { token: 'class', foreground: '4EC9B0' },
          { token: 'function', foreground: 'DCDCAA' },
          { token: 'variable', foreground: '9CDCFE' }
        ],
        colors: {
          'editor.background': '#1e1e1e',
          'editor.foreground': '#d4d4d4',
          'editorLineNumber.foreground': '#858585',
          'editorLineNumber.activeForeground': '#c6c6c6',
          'editor.selectionBackground': '#264f78',
          'editor.selectionHighlightBackground': '#add6ff26'
        }
      });

      expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('ai-ide-dark');
    });

    test('should apply theme after setup', async () => {
      await editorManager.initializeMonaco();
      editorManager.setupLanguageSupport();

      expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('ai-ide-dark');
    });
  });

  describe('Editor Configuration', () => {
    test('should create editor with proper syntax highlighting configuration', async () => {
      await editorManager.initializeMonaco();
      const editor = editorManager.createEditor(mockContainer);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(mockContainer, {
        value: '',
        language: 'typescript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        lineNumbers: 'on',
        roundedSelection: false,
        scrollBeyondLastLine: false,
        readOnly: false,
        minimap: {
          enabled: true
        },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: 'off',
        parameterHints: {
          enabled: true
        },
        quickSuggestions: {
          other: true,
          comments: false,
          strings: false
        },
        folding: true,
        foldingStrategy: 'indentation',
        showFoldingControls: 'mouseover',
        matchBrackets: 'always',
        autoIndent: 'full',
        formatOnPaste: true,
        formatOnType: true,
        renderWhitespace: 'selection',
        renderControlCharacters: false,
        guides: {
          indentation: true
        },
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true
      });

      expect(editor).toBeDefined();
    });

    test('should configure TypeScript compiler options for syntax highlighting', async () => {
      await editorManager.initializeMonaco();

      expect((mockMonaco.languages.typescript as any).typescriptDefaults.setCompilerOptions)
        .toHaveBeenCalledWith({
          target: 'ES2020',
          allowNonTsExtensions: true,
          moduleResolution: 'NodeJs',
          module: 'CommonJS',
          noEmit: true,
          esModuleInterop: true,
          jsx: 'React',
          reactNamespace: 'React',
          allowJs: true,
          typeRoots: ['node_modules/@types']
        });
    });

    test('should configure diagnostics for syntax validation', async () => {
      await editorManager.initializeMonaco();

      expect((mockMonaco.languages.typescript as any).typescriptDefaults.setDiagnosticsOptions)
        .toHaveBeenCalledWith({
          noSemanticValidation: false,
          noSyntaxValidation: false,
          onlyVisible: false
        });
    });
  });

  describe('File Loading with Syntax Highlighting', () => {
    test('should load TypeScript file with correct language', async () => {
      await editorManager.initializeMonaco();
      editorManager.createEditor(mockContainer);

      const filePath = '/test/app.ts';
      const content = 'const message: string = "Hello, World!";';

      editorManager.loadFile(filePath, content);

      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(
        content,
        'typescript',
        'file://test.ts'
      );
    });

    test('should load JavaScript file with correct language', async () => {
      await editorManager.initializeMonaco();
      editorManager.createEditor(mockContainer);

      const filePath = '/test/app.js';
      const content = 'const message = "Hello, World!";';

      editorManager.loadFile(filePath, content);

      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(
        content,
        'javascript',
        'file://test.ts'
      );
    });

    test('should load Python file with correct language', async () => {
      await editorManager.initializeMonaco();
      editorManager.createEditor(mockContainer);

      const filePath = '/test/main.py';
      const content = 'print("Hello, World!")';

      editorManager.loadFile(filePath, content);

      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(
        content,
        'python',
        'file://test.ts'
      );
    });

    test('should reuse existing model for same file', async () => {
      await editorManager.initializeMonaco();
      editorManager.createEditor(mockContainer);

      const filePath = '/test/app.ts';
      const content1 = 'const message = "Hello";';
      const content2 = 'const message = "World";';

      // Load file first time
      editorManager.loadFile(filePath, content1);
      expect(mockMonaco.editor.createModel).toHaveBeenCalledTimes(1);

      // Load same file again with different content
      editorManager.loadFile(filePath, content2);
      expect(mockMonaco.editor.createModel).toHaveBeenCalledTimes(1); // Should not create new model

      // Should call setValue on existing model
      const mockModel = mockMonaco.editor.createModel.mock.results[0].value;
      expect(mockModel.setValue).toHaveBeenCalledWith(content2);
    });
  });

  describe('Color Scheme Validation', () => {
    test('should use appropriate colors for different token types', async () => {
      await editorManager.initializeMonaco();
      editorManager.setupLanguageSupport();

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const themeConfig = themeCall[1];

      // Verify color scheme for syntax highlighting
      const rules = themeConfig.rules;
      const colorMap = rules.reduce((map: any, rule: any) => {
        map[rule.token] = rule.foreground;
        return map;
      }, {});

      expect(colorMap.comment).toBe('6A9955'); // Green for comments
      expect(colorMap.keyword).toBe('569CD6'); // Blue for keywords
      expect(colorMap.string).toBe('CE9178'); // Orange for strings
      expect(colorMap.number).toBe('B5CEA8'); // Light green for numbers
      expect(colorMap.type).toBe('4EC9B0'); // Cyan for types
      expect(colorMap.function).toBe('DCDCAA'); // Yellow for functions
      expect(colorMap.variable).toBe('9CDCFE'); // Light blue for variables
    });

    test('should use appropriate background and foreground colors', async () => {
      await editorManager.initializeMonaco();
      editorManager.setupLanguageSupport();

      const themeCall = mockMonaco.editor.defineTheme.mock.calls[0];
      const themeConfig = themeCall[1];

      expect(themeConfig.colors['editor.background']).toBe('#1e1e1e');
      expect(themeConfig.colors['editor.foreground']).toBe('#d4d4d4');
      expect(themeConfig.colors['editorLineNumber.foreground']).toBe('#858585');
      expect(themeConfig.colors['editor.selectionBackground']).toBe('#264f78');
    });
  });
});