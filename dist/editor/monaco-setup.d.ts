import * as monaco from 'monaco-editor';
export declare class MonacoEditorManager {
    private editor;
    private currentModel;
    private models;
    /**
     * Initialize Monaco Editor with TypeScript configuration
     */
    initializeMonaco(): Promise<void>;
    /**
     * Create Monaco Editor instance
     */
    createEditor(container: HTMLElement): monaco.editor.IStandaloneCodeEditor;
    /**
     * Setup language support for common file types
     */
    setupLanguageSupport(): void;
    /**
     * Get appropriate language for file extension
     */
    getLanguageForFile(fileName: string): string;
    /**
     * Load file content into editor
     */
    loadFile(filePath: string, content: string): void;
    /**
     * Get current editor content
     */
    getCurrentContent(): string;
    /**
     * Check if current file has unsaved changes
     */
    isDirty(): boolean;
    /**
     * Set editor content
     */
    setContent(content: string): void;
    /**
     * Get current cursor position
     */
    getCursorPosition(): monaco.Position | null;
    /**
     * Get selected text
     */
    getSelectedText(): string;
    /**
     * Insert text at cursor position
     */
    insertText(text: string): void;
    /**
     * Replace selected text
     */
    replaceSelectedText(text: string): void;
    /**
     * Setup editor event handlers
     */
    private setupEditorEvents;
    /**
     * Add common type definitions
     */
    private addCommonTypeDefinitions;
    /**
     * Dispose of editor and clean up resources
     */
    dispose(): void;
    /**
     * Get editor instance
     */
    getEditor(): monaco.editor.IStandaloneCodeEditor | null;
}
//# sourceMappingURL=monaco-setup.d.ts.map