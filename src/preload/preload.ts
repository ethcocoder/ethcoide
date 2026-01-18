import { contextBridge, ipcRenderer } from 'electron';
import { IPCMessage, FileOperation, AIRequest, ProjectOperation, KeyStorageOperation } from '../types/ipc-messages';

// Validation functions for IPC messages
function validateIPCMessage(message: any): message is IPCMessage {
  return message && 
         typeof message.type === 'string' && 
         message.payload !== undefined;
}

function validateFileOperation(operation: any): operation is FileOperation {
  return operation && 
         typeof operation.type === 'string' && 
         ['read', 'write', 'create', 'createDirectory', 'delete', 'deleteDirectory', 
          'rename', 'copy', 'watch', 'stopWatching', 'stat', 'exists', 'readDirectory',
          'getAbsolutePath', 'getRelativePath', 'joinPath', 'getDirname', 'getBasename', 'getExtension'].includes(operation.type);
}

function validateAIRequest(request: any): request is AIRequest {
  return request && 
         typeof request.type === 'string' && 
         ['completion', 'edit', 'explain', 'chat'].includes(request.type);
}

function validateProjectOperation(operation: any): operation is ProjectOperation {
  return operation && 
         typeof operation.type === 'string' && 
         ['load', 'create', 'refresh'].includes(operation.type);
}

function validateKeyStorageOperation(operation: any): operation is KeyStorageOperation {
  return operation && 
         typeof operation.type === 'string' && 
         ['setApiKey', 'getApiKey', 'deleteApiKey', 'listApiKeys', 'hasApiKey', 'updateApiKey', 'clearAllApiKeys'].includes(operation.type);
}

// Secure API exposed to renderer
const electronAPI = {
  // File operations
  fileOperations: {
    async readFile(filePath: string): Promise<string> {
      const operation: FileOperation = { type: 'read', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async writeFile(filePath: string, content: string): Promise<void> {
      const operation: FileOperation = { type: 'write', filePath, content };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async createFile(filePath: string, content?: string): Promise<void> {
      const operation: FileOperation = { type: 'create', filePath, content };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async createDirectory(dirPath: string): Promise<void> {
      const operation: FileOperation = { type: 'createDirectory', filePath: dirPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async deleteFile(filePath: string): Promise<void> {
      const operation: FileOperation = { type: 'delete', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async deleteDirectory(dirPath: string, recursive?: boolean): Promise<void> {
      const operation: FileOperation = { type: 'deleteDirectory', filePath: dirPath, recursive };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async rename(oldPath: string, newPath: string): Promise<void> {
      const operation: FileOperation = { type: 'rename', filePath: oldPath, newPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async copyFile(sourcePath: string, targetPath: string): Promise<void> {
      const operation: FileOperation = { type: 'copy', filePath: sourcePath, newPath: targetPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async readDirectory(dirPath: string): Promise<any[]> {
      const operation: FileOperation = { type: 'readDirectory', filePath: dirPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async exists(filePath: string): Promise<boolean> {
      const operation: FileOperation = { type: 'exists', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async watchDirectory(dirPath: string): Promise<void> {
      const operation: FileOperation = { type: 'watch', filePath: dirPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async stopWatching(dirPath: string): Promise<void> {
      const operation: FileOperation = { type: 'stopWatching', filePath: dirPath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async stat(filePath: string): Promise<any> {
      const operation: FileOperation = { type: 'stat', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    // Path utilities
    async getAbsolutePath(filePath: string): Promise<string> {
      const operation: FileOperation = { type: 'getAbsolutePath', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async getRelativePath(from: string, to: string): Promise<string> {
      const operation: FileOperation = { type: 'getRelativePath', filePath: from, newPath: to };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async joinPath(...paths: string[]): Promise<string> {
      const operation: FileOperation = { type: 'joinPath', filePath: '', paths };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async getDirname(filePath: string): Promise<string> {
      const operation: FileOperation = { type: 'getDirname', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async getBasename(filePath: string, ext?: string): Promise<string> {
      const operation: FileOperation = { type: 'getBasename', filePath, extension: ext };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    },

    async getExtension(filePath: string): Promise<string> {
      const operation: FileOperation = { type: 'getExtension', filePath };
      if (!validateFileOperation(operation)) {
        throw new Error('Invalid file operation');
      }
      return ipcRenderer.invoke('file-operation', operation);
    }
  },

  // AI operations
  aiOperations: {
    async generateCompletion(context: any): Promise<any> {
      const request: AIRequest = { type: 'completion', payload: context };
      if (!validateAIRequest(request)) {
        throw new Error('Invalid AI request');
      }
      return ipcRenderer.invoke('ai-request', request);
    },

    async editCode(instruction: string, code: string): Promise<any> {
      const request: AIRequest = { type: 'edit', payload: { instruction, code } };
      if (!validateAIRequest(request)) {
        throw new Error('Invalid AI request');
      }
      return ipcRenderer.invoke('ai-request', request);
    },

    async explainCode(code: string): Promise<any> {
      const request: AIRequest = { type: 'explain', payload: { code } };
      if (!validateAIRequest(request)) {
        throw new Error('Invalid AI request');
      }
      return ipcRenderer.invoke('ai-request', request);
    },

    async chatWithAI(message: string, context: any): Promise<any> {
      const request: AIRequest = { type: 'chat', payload: { message, context } };
      if (!validateAIRequest(request)) {
        throw new Error('Invalid AI request');
      }
      return ipcRenderer.invoke('ai-request', request);
    }
  },

  // Project operations
  projectOperations: {
    async loadProject(rootPath: string): Promise<any> {
      const operation: ProjectOperation = { type: 'load', rootPath };
      if (!validateProjectOperation(operation)) {
        throw new Error('Invalid project operation');
      }
      return ipcRenderer.invoke('project-operation', operation);
    },

    async createProject(rootPath: string, template?: string): Promise<any> {
      const operation: ProjectOperation = { type: 'create', rootPath, template };
      if (!validateProjectOperation(operation)) {
        throw new Error('Invalid project operation');
      }
      return ipcRenderer.invoke('project-operation', operation);
    },

    async refreshProject(): Promise<any> {
      const operation: ProjectOperation = { type: 'refresh' };
      if (!validateProjectOperation(operation)) {
        throw new Error('Invalid project operation');
      }
      return ipcRenderer.invoke('project-operation', operation);
    }
  },

  // Key storage operations
  keyStorage: {
    async setApiKey(keyName: string, apiKey: string): Promise<{ success: boolean }> {
      const operation: KeyStorageOperation = { type: 'setApiKey', keyName, apiKey };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async getApiKey(keyName: string): Promise<{ apiKey: string | null }> {
      const operation: KeyStorageOperation = { type: 'getApiKey', keyName };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async deleteApiKey(keyName: string): Promise<{ deleted: boolean }> {
      const operation: KeyStorageOperation = { type: 'deleteApiKey', keyName };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async listApiKeys(): Promise<{ keyNames: string[] }> {
      const operation: KeyStorageOperation = { type: 'listApiKeys' };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async hasApiKey(keyName: string): Promise<{ exists: boolean }> {
      const operation: KeyStorageOperation = { type: 'hasApiKey', keyName };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async updateApiKey(keyName: string, apiKey: string): Promise<{ success: boolean }> {
      const operation: KeyStorageOperation = { type: 'updateApiKey', keyName, apiKey };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    },

    async clearAllApiKeys(): Promise<{ success: boolean }> {
      const operation: KeyStorageOperation = { type: 'clearAllApiKeys' };
      if (!validateKeyStorageOperation(operation)) {
        throw new Error('Invalid key storage operation');
      }
      return ipcRenderer.invoke('key-storage-operation', operation);
    }
  },

  // System operations
  system: {
    async showOpenDialog(options: any): Promise<any> {
      return ipcRenderer.invoke('show-open-dialog', options);
    },

    async showSaveDialog(options: any): Promise<any> {
      return ipcRenderer.invoke('show-save-dialog', options);
    },

    async showMessageBox(options: any): Promise<any> {
      return ipcRenderer.invoke('show-message-box', options);
    }
  },

  // Event listeners
  events: {
    onFileChanged(callback: (filePath: string) => void): void {
      ipcRenderer.on('file-changed', (_, filePath) => callback(filePath));
    },

    onProjectChanged(callback: (projectData: any) => void): void {
      ipcRenderer.on('project-changed', (_, projectData) => callback(projectData));
    },

    removeAllListeners(): void {
      ipcRenderer.removeAllListeners('file-changed');
      ipcRenderer.removeAllListeners('project-changed');
    }
  }
};

// Expose API to renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for renderer
export type ElectronAPI = typeof electronAPI;