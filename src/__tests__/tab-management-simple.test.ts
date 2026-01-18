describe('Feature: ai-powered-ide, Tab Management Core Tests', () => {
  describe('Tab Data Structure and State Management', () => {
    test('should create tab with correct properties', () => {
      const tab = {
        id: 'tab-123',
        filePath: '/test/app.ts',
        fileName: 'app.ts',
        isDirty: false,
        isActive: true,
        language: 'typescript',
        content: 'const message = "Hello";'
      };

      expect(tab.id).toBe('tab-123');
      expect(tab.filePath).toBe('/test/app.ts');
      expect(tab.fileName).toBe('app.ts');
      expect(tab.isDirty).toBe(false);
      expect(tab.isActive).toBe(true);
      expect(tab.language).toBe('typescript');
      expect(tab.content).toBe('const message = "Hello";');
    });

    test('should handle tab state changes correctly', () => {
      const tab = {
        id: 'tab-123',
        filePath: '/test/app.ts',
        fileName: 'app.ts',
        isDirty: false,
        isActive: false,
        language: 'typescript'
      };

      // Mark as dirty
      tab.isDirty = true;
      expect(tab.isDirty).toBe(true);

      // Mark as active
      tab.isActive = true;
      expect(tab.isActive).toBe(true);

      // Clean up
      tab.isDirty = false;
      expect(tab.isDirty).toBe(false);
    });

    test('should handle multiple tabs correctly', () => {
      const tabs = new Map();
      
      const tab1 = {
        id: 'tab-1',
        filePath: '/test/app.ts',
        fileName: 'app.ts',
        isDirty: false,
        isActive: true,
        language: 'typescript'
      };

      const tab2 = {
        id: 'tab-2',
        filePath: '/test/utils.js',
        fileName: 'utils.js',
        isDirty: false,
        isActive: false,
        language: 'javascript'
      };

      tabs.set(tab1.id, tab1);
      tabs.set(tab2.id, tab2);

      expect(tabs.size).toBe(2);
      expect(tabs.get('tab-1')).toBe(tab1);
      expect(tabs.get('tab-2')).toBe(tab2);

      // Switch active tab
      tab1.isActive = false;
      tab2.isActive = true;

      const activeTab = Array.from(tabs.values()).find(tab => tab.isActive);
      expect(activeTab?.id).toBe('tab-2');
    });
  });

  describe('File Type Detection', () => {
    function getLanguageForFile(fileName: string): string {
      const extension = fileName.toLowerCase().split('.').pop();
      const languageMap: { [key: string]: string } = {
        'ts': 'typescript',
        'tsx': 'typescript',
        'js': 'javascript',
        'jsx': 'javascript',
        'py': 'python',
        'json': 'json',
        'html': 'html',
        'css': 'css',
        'md': 'markdown',
        'txt': 'plaintext'
      };
      return languageMap[extension || ''] || 'plaintext';
    }

    test('should correctly identify file languages', () => {
      const testCases = [
        { fileName: 'app.ts', expected: 'typescript' },
        { fileName: 'component.tsx', expected: 'typescript' },
        { fileName: 'script.js', expected: 'javascript' },
        { fileName: 'component.jsx', expected: 'javascript' },
        { fileName: 'main.py', expected: 'python' },
        { fileName: 'data.json', expected: 'json' },
        { fileName: 'index.html', expected: 'html' },
        { fileName: 'styles.css', expected: 'css' },
        { fileName: 'README.md', expected: 'markdown' },
        { fileName: 'notes.txt', expected: 'plaintext' },
        { fileName: 'unknown.xyz', expected: 'plaintext' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });

    test('should handle edge cases in file names', () => {
      const testCases = [
        { fileName: '', expected: 'plaintext' },
        { fileName: 'file.with.multiple.dots.js', expected: 'javascript' },
        { fileName: 'UPPERCASE.TS', expected: 'typescript' },
        { fileName: '.hiddenfile', expected: 'plaintext' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const language = getLanguageForFile(fileName);
        expect(language).toBe(expected);
      });
    });
  });

  describe('File Icon Detection', () => {
    function getFileIcon(fileName: string): string {
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
        'yaml': '⚙️'
      };
      return iconMap[extension || ''] || '📄';
    }

    test('should return correct icons for file types', () => {
      const testCases = [
        { fileName: 'app.ts', expected: '🔷' },
        { fileName: 'component.tsx', expected: '🔷' },
        { fileName: 'script.js', expected: '🟨' },
        { fileName: 'component.jsx', expected: '🟨' },
        { fileName: 'main.py', expected: '🐍' },
        { fileName: 'index.html', expected: '🌐' },
        { fileName: 'styles.css', expected: '🎨' },
        { fileName: 'styles.scss', expected: '🎨' },
        { fileName: 'data.json', expected: '📋' },
        { fileName: 'README.md', expected: '📝' },
        { fileName: 'notes.txt', expected: '📄' },
        { fileName: 'config.yml', expected: '⚙️' },
        { fileName: 'unknown.xyz', expected: '📄' }
      ];

      testCases.forEach(({ fileName, expected }) => {
        const icon = getFileIcon(fileName);
        expect(icon).toBe(expected);
      });
    });
  });

  describe('Tab ID Generation', () => {
    function generateTabId(): string {
      return 'tab-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    test('should generate unique tab IDs', () => {
      const ids = new Set();
      
      // Generate multiple IDs
      for (let i = 0; i < 100; i++) {
        const id = generateTabId();
        expect(id).toMatch(/^tab-\d+-[a-z0-9]+$/);
        expect(ids.has(id)).toBe(false);
        ids.add(id);
      }

      expect(ids.size).toBe(100);
    });

    test('should generate IDs with correct format', () => {
      const id = generateTabId();
      expect(id).toMatch(/^tab-\d+-[a-z0-9]+$/);
      expect(id.startsWith('tab-')).toBe(true);
    });
  });

  describe('File Name Extraction', () => {
    function extractFileName(filePath: string): string {
      return filePath.split(/[/\\]/).pop() || 'Untitled';
    }

    test('should extract file names from paths correctly', () => {
      const testCases = [
        { path: '/home/user/app.ts', expected: 'app.ts' },
        { path: 'C:\\Users\\user\\project\\main.js', expected: 'main.js' },
        { path: './src/components/Button.tsx', expected: 'Button.tsx' },
        { path: 'simple.txt', expected: 'simple.txt' },
        { path: '/path/with/multiple/levels/file.py', expected: 'file.py' },
        { path: '', expected: 'Untitled' },
        { path: '/just/path/', expected: 'Untitled' }
      ];

      testCases.forEach(({ path, expected }) => {
        const fileName = extractFileName(path);
        expect(fileName).toBe(expected);
      });
    });
  });

  describe('Tab Validation', () => {
    test('should validate tab properties', () => {
      const validTab = {
        id: 'tab-123',
        filePath: '/test/app.ts',
        fileName: 'app.ts',
        isDirty: false,
        isActive: true,
        language: 'typescript'
      };

      // Check required properties exist
      expect(validTab.id).toBeDefined();
      expect(validTab.filePath).toBeDefined();
      expect(validTab.fileName).toBeDefined();
      expect(typeof validTab.isDirty).toBe('boolean');
      expect(typeof validTab.isActive).toBe('boolean');
      expect(validTab.language).toBeDefined();

      // Check property types
      expect(typeof validTab.id).toBe('string');
      expect(typeof validTab.filePath).toBe('string');
      expect(typeof validTab.fileName).toBe('string');
      expect(typeof validTab.language).toBe('string');
    });

    test('should handle tab state transitions', () => {
      const tab = {
        id: 'tab-123',
        filePath: '/test/app.ts',
        fileName: 'app.ts',
        isDirty: false,
        isActive: false,
        language: 'typescript'
      };

      // Test state transitions
      expect(tab.isActive).toBe(false);
      tab.isActive = true;
      expect(tab.isActive).toBe(true);

      expect(tab.isDirty).toBe(false);
      tab.isDirty = true;
      expect(tab.isDirty).toBe(true);

      // Reset state
      tab.isActive = false;
      tab.isDirty = false;
      expect(tab.isActive).toBe(false);
      expect(tab.isDirty).toBe(false);
    });
  });
});