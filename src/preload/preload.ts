import { contextBridge, ipcRenderer } from 'electron';
import { IPCMessage, FileOperation, AIRequest, ProjectOperation } from '../types/ipc-messages';

// Validation functions for IPC messages
function validateIPCMessage(message: any): message is IPCMessage {
  return message && 
         typeof message.type === 'string' && 
         message.payload !== undefined;
}

function validateFileOperation(operation: any): operation is FileOperation {
  return operation && 
         typeof operation.type === 'string' && 
         ['read', 'write', 'create', 'delete', 'rename', 'watch'].includes(operation.type);
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

    async createFile(filePath: string): Promise<void> {
      const operation: FileOperation = { type: 'create', filePath };
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

    async renameFile(oldPath: string, newPath: string): Promise<void> {
      const operation: FileOperation = { type: 'rename', filePath: oldPath, newPath };
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