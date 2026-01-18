"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Validation functions for IPC messages
function validateIPCMessage(message) {
    return message &&
        typeof message.type === 'string' &&
        message.payload !== undefined;
}
function validateFileOperation(operation) {
    return operation &&
        typeof operation.type === 'string' &&
        ['read', 'write', 'create', 'delete', 'rename', 'watch'].includes(operation.type);
}
function validateAIRequest(request) {
    return request &&
        typeof request.type === 'string' &&
        ['completion', 'edit', 'explain', 'chat'].includes(request.type);
}
function validateProjectOperation(operation) {
    return operation &&
        typeof operation.type === 'string' &&
        ['load', 'create', 'refresh'].includes(operation.type);
}
// Secure API exposed to renderer
const electronAPI = {
    // File operations
    fileOperations: {
        async readFile(filePath) {
            const operation = { type: 'read', filePath };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        },
        async writeFile(filePath, content) {
            const operation = { type: 'write', filePath, content };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        },
        async createFile(filePath) {
            const operation = { type: 'create', filePath };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        },
        async deleteFile(filePath) {
            const operation = { type: 'delete', filePath };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        },
        async renameFile(oldPath, newPath) {
            const operation = { type: 'rename', filePath: oldPath, newPath };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        },
        async watchDirectory(dirPath) {
            const operation = { type: 'watch', filePath: dirPath };
            if (!validateFileOperation(operation)) {
                throw new Error('Invalid file operation');
            }
            return electron_1.ipcRenderer.invoke('file-operation', operation);
        }
    },
    // AI operations
    aiOperations: {
        async generateCompletion(context) {
            const request = { type: 'completion', payload: context };
            if (!validateAIRequest(request)) {
                throw new Error('Invalid AI request');
            }
            return electron_1.ipcRenderer.invoke('ai-request', request);
        },
        async editCode(instruction, code) {
            const request = { type: 'edit', payload: { instruction, code } };
            if (!validateAIRequest(request)) {
                throw new Error('Invalid AI request');
            }
            return electron_1.ipcRenderer.invoke('ai-request', request);
        },
        async explainCode(code) {
            const request = { type: 'explain', payload: { code } };
            if (!validateAIRequest(request)) {
                throw new Error('Invalid AI request');
            }
            return electron_1.ipcRenderer.invoke('ai-request', request);
        },
        async chatWithAI(message, context) {
            const request = { type: 'chat', payload: { message, context } };
            if (!validateAIRequest(request)) {
                throw new Error('Invalid AI request');
            }
            return electron_1.ipcRenderer.invoke('ai-request', request);
        }
    },
    // Project operations
    projectOperations: {
        async loadProject(rootPath) {
            const operation = { type: 'load', rootPath };
            if (!validateProjectOperation(operation)) {
                throw new Error('Invalid project operation');
            }
            return electron_1.ipcRenderer.invoke('project-operation', operation);
        },
        async createProject(rootPath, template) {
            const operation = { type: 'create', rootPath, template };
            if (!validateProjectOperation(operation)) {
                throw new Error('Invalid project operation');
            }
            return electron_1.ipcRenderer.invoke('project-operation', operation);
        },
        async refreshProject() {
            const operation = { type: 'refresh' };
            if (!validateProjectOperation(operation)) {
                throw new Error('Invalid project operation');
            }
            return electron_1.ipcRenderer.invoke('project-operation', operation);
        }
    },
    // System operations
    system: {
        async showOpenDialog(options) {
            return electron_1.ipcRenderer.invoke('show-open-dialog', options);
        },
        async showSaveDialog(options) {
            return electron_1.ipcRenderer.invoke('show-save-dialog', options);
        },
        async showMessageBox(options) {
            return electron_1.ipcRenderer.invoke('show-message-box', options);
        }
    },
    // Event listeners
    events: {
        onFileChanged(callback) {
            electron_1.ipcRenderer.on('file-changed', (_, filePath) => callback(filePath));
        },
        onProjectChanged(callback) {
            electron_1.ipcRenderer.on('project-changed', (_, projectData) => callback(projectData));
        },
        removeAllListeners() {
            electron_1.ipcRenderer.removeAllListeners('file-changed');
            electron_1.ipcRenderer.removeAllListeners('project-changed');
        }
    }
};
// Expose API to renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map