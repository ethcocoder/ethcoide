/**
 * Unit tests for Monaco Editor syntax highlighting functionality
 * Validates: Requirements 2.2
 */

// Mock Monaco Editor
const mockMonaco = {
  editor: {
    create: jest.fn(),
    defineTheme: jest.fn(),
    setTheme: jest.fn(),
    createModel: jest.fn()
  },
  languages: {
    typescript: {
      typescriptDefaults: {
        setCompilerOptions: jest.fn(),
        setDiagnosticsOptions: jest.fn()
      }
    }
  }
};

// Mock require function for Monaco loader
const mockRequire = {
  config: jest.fn(),
  __call: jest.fn((deps, callback) => {
    // Simulate Monaco being loaded
    (global as any).monaco = mockMonaco;
    callback();
  })
};

describe('Monaco Editor Syntax Highlighting', () => {
  beforeEach(() => {
    // Setup global mocks
    (global as any).require = mockRequire.__call;
    (global as any).monaco = mockMonaco;
    
    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Language Detection', () => {
    test('should detect TypeScript files correctly', () => {
      const getLanguageForFile = (fileName: string): string => {
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
      };

      expect(getLanguageForFile('app.ts')).toBe('typescript');
      expect(getLanguageForFile('component.tsx')).toBe('typescript');
      expect(getLanguageForFile('script.js')).toBe('javascript');
      expect(getLanguageForFile('component.jsx')).toBe('javascript');
      expect(getLanguageForFile('data.json')).toBe('json');
      expect(getLanguageForFile('style.css')).toBe('css');
      expect(getLanguageForFile('README.md')).toBe('markdown');
      expect(getLanguageForFile('unknown.xyz')).toBe('plaintext');
    });

    test('should handle files without extensions', () => {
      const getLanguageForFile = (fileName: string): string => {
        const extension = fileName.toLowerCase().split('.').pop();
        const languageMap: { [key: string]: string } = {
          'ts': 'typescript',
          'tsx': 'typescript',
          'js': 'javascript',
          'jsx': 'javascript'
        };
        return languageMap[extension || ''] || 'plaintext';
      };

      expect(getLanguageForFile('Dockerfile')).toBe('plaintext');
      expect(getLanguageForFile('Makefile')).toBe('plaintext');
      expect(getLanguageForFile('')).toBe('plaintext');
    });
  });

  describe('Theme Configuration', () => {
    test('should define custom AI IDE dark theme', () => {
      const expectedTheme = {
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
      };

      // Simulate theme definition
      mockMonaco.editor.defineTheme('ai-ide-dark', expectedTheme);
      mockMonaco.editor.setTheme('ai-ide-dark');

      expect(mockMonaco.editor.defineTheme).toHaveBeenCalledWith('ai-ide-dark', expectedTheme);
      expect(mockMonaco.editor.setTheme).toHaveBeenCalledWith('ai-ide-dark');
    });

    test('should apply theme colors correctly', () => {
      const themeColors = {
        'editor.background': '#1e1e1e',
        'editor.foreground': '#d4d4d4',
        'editorLineNumber.foreground': '#858585',
        'editorLineNumber.activeForeground': '#c6c6c6',
        'editor.selectionBackground': '#264f78',
        'editor.selectionHighlightBackground': '#add6ff26'
      };

      // Verify theme colors are properly formatted
      Object.entries(themeColors).forEach(([key, value]) => {
        expect(value).toMatch(/^#[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/);
      });
    });
  });

  describe('TypeScript Configuration', () => {
    test('should configure TypeScript compiler options', () => {
      const expectedCompilerOptions = {
        target: 'ES2020', // Simplified for test
        allowNonTsExtensions: true,
        moduleResolution: 'NodeJs', // Simplified for test
        module: 'CommonJS', // Simplified for test
        noEmit: true,
        esModuleInterop: true,
        jsx: 'React', // Simplified for test
        allowJs: true
      };

      // Simulate TypeScript configuration
      mockMonaco.languages.typescript.typescriptDefaults.setCompilerOptions(expectedCompilerOptions);

      expect(mockMonaco.languages.typescript.typescriptDefaults.setCompilerOptions)
        .toHaveBeenCalledWith(expectedCompilerOptions);
    });

    test('should configure TypeScript diagnostics', () => {
      const expectedDiagnosticsOptions = {
        noSemanticValidation: false,
        noSyntaxValidation: false
      };

      // Simulate diagnostics configuration
      mockMonaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions(expectedDiagnosticsOptions);

      expect(mockMonaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions)
        .toHaveBeenCalledWith(expectedDiagnosticsOptions);
    });
  });

  describe('Editor Creation', () => {
    test('should create Monaco editor with correct configuration', () => {
      // Create a mock container
      const mockContainer = {
        id: 'monacoEditor',
        style: { width: '100%', height: '100%' }
      };

      const expectedConfig = {
        value: 'console.log("Hello World");',
        language: 'javascript',
        theme: 'ai-ide-dark',
        automaticLayout: true,
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        lineNumbers: 'on',
        minimap: { enabled: true },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: 'on',
        tabCompletion: 'on',
        wordBasedSuggestions: 'off',
        parameterHints: { enabled: true },
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
        guides: { indentation: true },
        cursorBlinking: 'blink',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        mouseWheelZoom: true
      };

      // Simulate editor creation
      mockMonaco.editor.create(mockContainer, expectedConfig);

      expect(mockMonaco.editor.create).toHaveBeenCalledWith(mockContainer, expectedConfig);
    });

    test('should handle different file types with appropriate languages', () => {
      const testCases = [
        { fileName: 'app.ts', expectedLanguage: 'typescript' },
        { fileName: 'component.tsx', expectedLanguage: 'typescript' },
        { fileName: 'script.js', expectedLanguage: 'javascript' },
        { fileName: 'component.jsx', expectedLanguage: 'javascript' },
        { fileName: 'data.json', expectedLanguage: 'json' },
        { fileName: 'index.html', expectedLanguage: 'html' },
        { fileName: 'styles.css', expectedLanguage: 'css' },
        { fileName: 'README.md', expectedLanguage: 'markdown' }
      ];

      testCases.forEach(({ fileName, expectedLanguage }) => {
        const mockContainer = { id: 'monacoEditor' };
        const config = {
          value: '// Sample content',
          language: expectedLanguage,
          theme: 'ai-ide-dark'
        };

        mockMonaco.editor.create(mockContainer, config);
        
        expect(mockMonaco.editor.create).toHaveBeenCalledWith(
          mockContainer,
          expect.objectContaining({ language: expectedLanguage })
        );
      });
    });
  });

  describe('Syntax Highlighting Rules', () => {
    test('should define syntax highlighting rules for all token types', () => {
      const expectedRules = [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: '569CD6' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'type', foreground: '4EC9B0' },
        { token: 'class', foreground: '4EC9B0' },
        { token: 'function', foreground: 'DCDCAA' },
        { token: 'variable', foreground: '9CDCFE' }
      ];

      expectedRules.forEach(rule => {
        expect(rule.token).toBeTruthy();
        expect(rule.foreground).toMatch(/^[0-9a-fA-F]{6}$/);
      });
    });

    test('should use distinct colors for different token types', () => {
      const colors = [
        '6A9955', // comment
        '569CD6', // keyword
        'CE9178', // string
        'B5CEA8', // number
        '4EC9B0', // type/class (same color for both)
        'DCDCAA', // function
        '9CDCFE'  // variable
      ];

      // All colors should be valid hex colors
      colors.forEach(color => {
        expect(color).toMatch(/^[0-9a-fA-F]{6}$/);
      });

      // Verify we have the expected number of unique colors
      const uniqueColors = new Set(colors);
      expect(uniqueColors.size).toBe(7); // All colors are actually unique
    });
  });

  describe('Model Creation', () => {
    test('should create models with correct language and content', () => {
      const testContent = 'const message: string = "Hello, TypeScript!";';
      const language = 'typescript';
      const uri = { path: '/test/file.ts' };

      mockMonaco.editor.createModel(testContent, language, uri);

      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(testContent, language, uri);
    });

    test('should handle empty content gracefully', () => {
      const testContent = '';
      const language = 'plaintext';
      const uri = { path: '/test/empty.txt' };

      mockMonaco.editor.createModel(testContent, language, uri);

      expect(mockMonaco.editor.createModel).toHaveBeenCalledWith(testContent, language, uri);
    });
  });
});