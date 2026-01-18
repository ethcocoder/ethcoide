// Base IPC message interface
export interface IPCMessage {
  type: string;
  payload: any;
}

// File operation types
export interface FileOperation {
  type: 'read' | 'write' | 'create' | 'createDirectory' | 'delete' | 'deleteDirectory' | 
        'rename' | 'copy' | 'watch' | 'stopWatching' | 'stat' | 'exists' | 'readDirectory' |
        'getAbsolutePath' | 'getRelativePath' | 'joinPath' | 'getDirname' | 'getBasename' | 'getExtension';
  filePath: string;
  content?: string;
  newPath?: string;
  paths?: string[];
  extension?: string;
  recursive?: boolean;
}

// AI request types
export interface AIRequest {
  type: 'completion' | 'edit' | 'explain' | 'chat';
  payload: any;
  context?: CodeContext;
}

// Project operation types
export interface ProjectOperation {
  type: 'load' | 'create' | 'refresh';
  rootPath?: string;
  template?: string;
}

// Key storage operation types
export interface KeyStorageOperation {
  type: 'setApiKey' | 'getApiKey' | 'deleteApiKey' | 'listApiKeys' | 'hasApiKey' | 'updateApiKey' | 'clearAllApiKeys';
  keyName?: string;
  apiKey?: string;
}

// Code context for AI operations
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

// Response types
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