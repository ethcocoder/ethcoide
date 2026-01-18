"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
const electron_1 = require("electron");
const file_service_1 = require("../services/file-service");
const project_service_1 = require("../services/project-service");
const gemini_client_1 = require("../ai/gemini-client");
const key_storage_1 = require("../services/key-storage");
// Initialize services
const fileService = new file_service_1.FileSystemService();
const projectService = new project_service_1.ProjectService();
const aiService = new gemini_client_1.AIService();
const keyStorageService = new key_storage_1.KeyStorageService();
function registerIPCHandlers() {
    // File operations
    electron_1.ipcMain.handle('file-operation', async (event, operation) => {
        try {
            console.log('IPC: Received file operation:', operation);
            switch (operation.type) {
                case 'read':
                    const content = await fileService.readFile(operation.filePath);
                    console.log('IPC: File read successful, length:', content.length);
                    return content;
                case 'stat':
                    const stats = await fileService.stat(operation.filePath);
                    console.log('IPC: File stat successful:', stats);
                    return stats;
                case 'exists':
                    return await fileService.exists(operation.filePath);
                case 'write':
                    if (!operation.content) {
                        throw new Error('Content is required for write operation');
                    }
                    return await fileService.writeFile(operation.filePath, operation.content);
                case 'create':
                    return await fileService.createFile(operation.filePath, operation.content || '');
                case 'createDirectory':
                    return await fileService.createDirectory(operation.filePath);
                case 'delete':
                    return await fileService.deleteFile(operation.filePath);
                case 'deleteDirectory':
                    return await fileService.deleteDirectory(operation.filePath, operation.recursive || false);
                case 'rename':
                    if (!operation.newPath) {
                        throw new Error('New path is required for rename operation');
                    }
                    return await fileService.rename(operation.filePath, operation.newPath);
                case 'copy':
                    if (!operation.newPath) {
                        throw new Error('Target path is required for copy operation');
                    }
                    return await fileService.copyFile(operation.filePath, operation.newPath);
                case 'readDirectory':
                    return await fileService.readDirectory(operation.filePath);
                case 'watch':
                    return await fileService.watchDirectory(operation.filePath);
                case 'stopWatching':
                    return await fileService.stopWatching(operation.filePath);
                case 'getAbsolutePath':
                    return fileService.getAbsolutePath(operation.filePath);
                case 'getRelativePath':
                    if (!operation.newPath) {
                        throw new Error('Target path is required for getRelativePath operation');
                    }
                    return fileService.getRelativePath(operation.filePath, operation.newPath);
                case 'joinPath':
                    if (!operation.paths) {
                        throw new Error('Paths array is required for joinPath operation');
                    }
                    return fileService.joinPath(...operation.paths);
                case 'getDirname':
                    return fileService.getDirname(operation.filePath);
                case 'getBasename':
                    return fileService.getBasename(operation.filePath, operation.extension);
                case 'getExtension':
                    return fileService.getExtension(operation.filePath);
                default:
                    throw new Error(`Unknown file operation: ${operation.type}`);
            }
        }
        catch (error) {
            console.error('IPC: File operation error:', error);
            throw error;
        }
    });
    // AI operations
    electron_1.ipcMain.handle('ai-request', async (event, request) => {
        try {
            switch (request.type) {
                case 'completion':
                    return await aiService.generateCompletion(request.payload);
                case 'edit':
                    const { instruction, code } = request.payload;
                    return await aiService.editCode(instruction, code);
                case 'explain':
                    return await aiService.explainCode(request.payload.code);
                case 'chat':
                    const { message, context } = request.payload;
                    return await aiService.chatWithAI(message, context);
                default:
                    throw new Error(`Unknown AI request type: ${request.type}`);
            }
        }
        catch (error) {
            console.error('AI request error:', error);
            throw error;
        }
    });
    // Project operations
    electron_1.ipcMain.handle('project-operation', async (event, operation) => {
        try {
            console.log('IPC: Received project operation:', operation);
            switch (operation.type) {
                case 'load':
                    if (!operation.rootPath) {
                        throw new Error('Root path is required for load operation');
                    }
                    const project = await projectService.loadProject(operation.rootPath);
                    console.log('IPC: Project loaded successfully:', project.summary);
                    return project;
                case 'create':
                    if (!operation.rootPath) {
                        throw new Error('Root path is required for create operation');
                    }
                    return await projectService.createProject(operation.rootPath, operation.template);
                case 'refresh':
                    return await projectService.refreshProject();
                default:
                    throw new Error(`Unknown project operation: ${operation.type}`);
            }
        }
        catch (error) {
            console.error('IPC: Project operation error:', error);
            throw error;
        }
    });
    // Key storage operations
    electron_1.ipcMain.handle('key-storage-operation', async (event, operation) => {
        try {
            console.log('IPC: Received key storage operation:', operation.type);
            switch (operation.type) {
                case 'setApiKey':
                    if (!operation.keyName || !operation.apiKey) {
                        throw new Error('Key name and API key are required for setApiKey operation');
                    }
                    await keyStorageService.setApiKey(operation.keyName, operation.apiKey);
                    console.log('IPC: API key stored successfully');
                    return { success: true };
                case 'getApiKey':
                    if (!operation.keyName) {
                        throw new Error('Key name is required for getApiKey operation');
                    }
                    const apiKey = await keyStorageService.getApiKey(operation.keyName);
                    console.log('IPC: API key retrieved:', apiKey ? 'found' : 'not found');
                    return { apiKey };
                case 'deleteApiKey':
                    if (!operation.keyName) {
                        throw new Error('Key name is required for deleteApiKey operation');
                    }
                    const deleted = await keyStorageService.deleteApiKey(operation.keyName);
                    console.log('IPC: API key deletion result:', deleted);
                    return { deleted };
                case 'listApiKeys':
                    const keyNames = await keyStorageService.listApiKeys();
                    console.log('IPC: Listed API keys, count:', keyNames.length);
                    return { keyNames };
                case 'hasApiKey':
                    if (!operation.keyName) {
                        throw new Error('Key name is required for hasApiKey operation');
                    }
                    const exists = await keyStorageService.hasApiKey(operation.keyName);
                    console.log('IPC: API key exists check:', exists);
                    return { exists };
                case 'updateApiKey':
                    if (!operation.keyName || !operation.apiKey) {
                        throw new Error('Key name and API key are required for updateApiKey operation');
                    }
                    await keyStorageService.updateApiKey(operation.keyName, operation.apiKey);
                    console.log('IPC: API key updated successfully');
                    return { success: true };
                case 'clearAllApiKeys':
                    await keyStorageService.clearAllApiKeys();
                    console.log('IPC: All API keys cleared successfully');
                    return { success: true };
                default:
                    throw new Error(`Unknown key storage operation: ${operation.type}`);
            }
        }
        catch (error) {
            console.error('IPC: Key storage operation error:', error);
            throw error;
        }
    });
    // System dialogs
    electron_1.ipcMain.handle('show-open-dialog', async (event, options) => {
        try {
            const result = await electron_1.dialog.showOpenDialog(options);
            return result;
        }
        catch (error) {
            console.error('Open dialog error:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('show-save-dialog', async (event, options) => {
        try {
            const result = await electron_1.dialog.showSaveDialog(options);
            return result;
        }
        catch (error) {
            console.error('Save dialog error:', error);
            throw error;
        }
    });
    electron_1.ipcMain.handle('show-message-box', async (event, options) => {
        try {
            const result = await electron_1.dialog.showMessageBox(options);
            return result;
        }
        catch (error) {
            console.error('Message box error:', error);
            throw error;
        }
    });
    console.log('IPC handlers registered successfully');
}
//# sourceMappingURL=ipc-handlers.js.map