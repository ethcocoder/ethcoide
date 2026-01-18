"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonacoEditorManager = void 0;
const monaco = __importStar(require("monaco-editor"));
// Monaco Editor configuration and setup
class MonacoEditorManager {
    constructor() {
        this.editor = null;
        this.currentModel = null;
        this.models = new Map();
    }
    /**
     * Initialize Monaco Editor with TypeScript configuration
     */
    async initializeMonaco() {
        // Configure Monaco Editor worker
        self.MonacoEnvironment = {
            getWorkerUrl: function (moduleId, label) {
                if (label === 'json') {
                    return './vs/language/json/json.worker.js';
                }
                if (label === 'css' || label === 'scss' || label === 'less') {
                    return './vs/language/css/css.worker.js';
                }
                if (label === 'html' || label === 'handlebars' || label === 'razor') {
                    return './vs/language/html/html.worker.js';
                }
                if (label === 'typescript' || label === 'javascript') {
                    return './vs/language/typescript/ts.worker.js';
                }
                return './vs/editor/editor.worker.js';
            }
        };
        // Configure TypeScript compiler options
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            target: monaco.languages.typescript.ScriptTarget.ES2020,
            allowNonTsExtensions: true,
            moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
            module: monaco.languages.typescript.ModuleKind.CommonJS,
            noEmit: true,
            esModuleInterop: true,
            jsx: monaco.languages.typescript.JsxEmit.React,
            reactNamespace: 'React',
            allowJs: true,
            typeRoots: ['node_modules/@types']
        });
        // Configure JavaScript/TypeScript diagnostics
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            noSemanticValidation: false,
            noSyntaxValidation: false,
            onlyVisible: false
        });
        // Add common type definitions
        this.addCommonTypeDefinitions();
        console.log('Monaco Editor initialized successfully');
    }
    /**
     * Create Monaco Editor instance
     */
    createEditor(container) {
        if (this.editor) {
            this.editor.dispose();
        }
        this.editor = monaco.editor.create(container, {
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
        // Setup editor event handlers
        this.setupEditorEvents();
        return this.editor;
    }
    /**
     * Setup language support for common file types
     */
    setupLanguageSupport() {
        // Register additional languages if needed
        const languages = [
            { id: 'typescript', extensions: ['.ts', '.tsx'] },
            { id: 'javascript', extensions: ['.js', '.jsx'] },
            { id: 'python', extensions: ['.py'] },
            { id: 'json', extensions: ['.json'] },
            { id: 'html', extensions: ['.html', '.htm'] },
            { id: 'css', extensions: ['.css'] },
            { id: 'scss', extensions: ['.scss'] },
            { id: 'markdown', extensions: ['.md'] },
            { id: 'yaml', extensions: ['.yml', '.yaml'] },
            { id: 'xml', extensions: ['.xml'] }
        ];
        // Configure syntax highlighting themes
        monaco.editor.defineTheme('ai-ide-dark', {
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
        monaco.editor.setTheme('ai-ide-dark');
    }
    /**
     * Get appropriate language for file extension
     */
    getLanguageForFile(fileName) {
        const extension = fileName.toLowerCase().split('.').pop();
        const languageMap = {
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
     * Load file content into editor
     */
    loadFile(filePath, content) {
        if (!this.editor) {
            throw new Error('Editor not initialized');
        }
        const language = this.getLanguageForFile(filePath);
        // Create or get existing model
        let model = this.models.get(filePath);
        if (!model) {
            model = monaco.editor.createModel(content, language, monaco.Uri.file(filePath));
            this.models.set(filePath, model);
        }
        else {
            model.setValue(content);
        }
        // Set the model to the editor
        this.editor.setModel(model);
        this.currentModel = model;
        // Focus the editor
        this.editor.focus();
    }
    /**
     * Get current editor content
     */
    getCurrentContent() {
        if (!this.editor || !this.currentModel) {
            return '';
        }
        return this.currentModel.getValue();
    }
    /**
     * Check if current file has unsaved changes
     */
    isDirty() {
        if (!this.currentModel) {
            return false;
        }
        return this.currentModel.isDisposed() ? false : this.currentModel.getAlternativeVersionId() !== this.currentModel.getVersionId();
    }
    /**
     * Set editor content
     */
    setContent(content) {
        if (!this.editor || !this.currentModel) {
            return;
        }
        this.currentModel.setValue(content);
    }
    /**
     * Get current cursor position
     */
    getCursorPosition() {
        if (!this.editor) {
            return null;
        }
        return this.editor.getPosition();
    }
    /**
     * Get selected text
     */
    getSelectedText() {
        if (!this.editor) {
            return '';
        }
        const selection = this.editor.getSelection();
        if (!selection || !this.currentModel) {
            return '';
        }
        return this.currentModel.getValueInRange(selection);
    }
    /**
     * Insert text at cursor position
     */
    insertText(text) {
        if (!this.editor) {
            return;
        }
        const position = this.editor.getPosition();
        if (!position) {
            return;
        }
        this.editor.executeEdits('ai-completion', [{
                range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
                text: text
            }]);
    }
    /**
     * Replace selected text
     */
    replaceSelectedText(text) {
        if (!this.editor) {
            return;
        }
        const selection = this.editor.getSelection();
        if (!selection) {
            return;
        }
        this.editor.executeEdits('ai-edit', [{
                range: selection,
                text: text
            }]);
    }
    /**
     * Setup editor event handlers
     */
    setupEditorEvents() {
        if (!this.editor) {
            return;
        }
        // Content change events
        this.editor.onDidChangeModelContent((e) => {
            // Emit content change event
            window.dispatchEvent(new CustomEvent('editor-content-changed', {
                detail: {
                    content: this.getCurrentContent(),
                    changes: e.changes
                }
            }));
        });
        // Cursor position change events
        this.editor.onDidChangeCursorPosition((e) => {
            window.dispatchEvent(new CustomEvent('editor-cursor-changed', {
                detail: {
                    position: e.position,
                    reason: e.reason
                }
            }));
        });
        // Selection change events
        this.editor.onDidChangeCursorSelection((e) => {
            window.dispatchEvent(new CustomEvent('editor-selection-changed', {
                detail: {
                    selection: e.selection,
                    selectedText: this.getSelectedText()
                }
            }));
        });
        // Focus events
        this.editor.onDidFocusEditorText(() => {
            window.dispatchEvent(new CustomEvent('editor-focused'));
        });
        this.editor.onDidBlurEditorText(() => {
            window.dispatchEvent(new CustomEvent('editor-blurred'));
        });
    }
    /**
     * Add common type definitions
     */
    addCommonTypeDefinitions() {
        // Add Node.js types
        const nodeTypes = `
      declare module 'fs' {
        export function readFileSync(path: string, encoding?: string): string | Buffer;
        export function writeFileSync(path: string, data: string | Buffer): void;
        // Add more as needed
      }
      
      declare module 'path' {
        export function join(...paths: string[]): string;
        export function resolve(...paths: string[]): string;
        export function dirname(path: string): string;
        export function basename(path: string, ext?: string): string;
        export function extname(path: string): string;
      }
    `;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(nodeTypes, 'file:///node_modules/@types/node/index.d.ts');
        // Add React types if needed
        const reactTypes = `
      declare namespace React {
        interface Component<P = {}, S = {}> {}
        interface FunctionComponent<P = {}> {
          (props: P): JSX.Element | null;
        }
        type FC<P = {}> = FunctionComponent<P>;
      }
      
      declare namespace JSX {
        interface Element {}
        interface IntrinsicElements {
          [elemName: string]: any;
        }
      }
    `;
        monaco.languages.typescript.typescriptDefaults.addExtraLib(reactTypes, 'file:///node_modules/@types/react/index.d.ts');
    }
    /**
     * Dispose of editor and clean up resources
     */
    dispose() {
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }
        // Dispose all models
        this.models.forEach(model => model.dispose());
        this.models.clear();
        this.currentModel = null;
    }
    /**
     * Get editor instance
     */
    getEditor() {
        return this.editor;
    }
}
exports.MonacoEditorManager = MonacoEditorManager;
//# sourceMappingURL=monaco-setup.js.map