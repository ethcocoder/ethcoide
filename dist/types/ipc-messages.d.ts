export interface IPCMessage {
    type: string;
    payload: any;
}
export interface FileOperation {
    type: 'read' | 'write' | 'create' | 'delete' | 'rename' | 'watch';
    filePath: string;
    content?: string;
    newPath?: string;
}
export interface AIRequest {
    type: 'completion' | 'edit' | 'explain' | 'chat';
    payload: any;
    context?: CodeContext;
}
export interface ProjectOperation {
    type: 'load' | 'create' | 'refresh';
    rootPath?: string;
    template?: string;
}
export interface CodeContext {
    currentFile: string;
    selectedText?: string;
    cursorPosition: Position;
    surroundingCode: string;
    projectContext?: ProjectContext;
}
export interface Position {
    line: number;
    column: number;
}
export interface ProjectContext {
    rootPath: string;
    files: FileInfo[];
    dependencies: Dependency[];
    summary: string;
    tokenCount: number;
}
export interface FileInfo {
    path: string;
    name: string;
    extension: string;
    size: number;
    lastModified: Date;
    content?: string;
}
export interface Dependency {
    name: string;
    version: string;
    type: 'production' | 'development';
}
export interface CompletionResult {
    suggestions: string[];
    confidence: number;
}
export interface EditResult {
    modifiedCode: string;
    explanation: string;
    changes: CodeChange[];
}
export interface CodeChange {
    startLine: number;
    endLine: number;
    oldText: string;
    newText: string;
}
export interface ExplanationResult {
    explanation: string;
    concepts: string[];
    complexity: 'low' | 'medium' | 'high';
}
export interface ChatResponse {
    message: string;
    suggestions?: string[];
    codeExamples?: string[];
}
//# sourceMappingURL=ipc-messages.d.ts.map