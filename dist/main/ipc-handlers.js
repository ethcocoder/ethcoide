"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
const electron_1 = require("electron");
const file_service_1 = require("../services/file-service");
const project_service_1 = require("../services/project-service");
const gemini_client_1 = require("../ai/gemini-client");
// Initialize services
const fileService = new file_service_1.FileSystemService();
const projectService = new project_service_1.ProjectService();
const aiService = new gemini_client_1.AIService();
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
                case 'write':
                    if (!operation.content) {
                        throw new Error('Content is required for write operation');
                    }
                    return await fileService.writeFile(operation.filePath, operation.content);
                case 'create':
                    return await fileService.createFile(operation.filePath);
                case 'delete':
                    return await fileService.deleteFile(operation.filePath);
                case 'rename':
                    if (!operation.newPath) {
                        throw new Error('New path is required for rename operation');
                    }
                    return await fileService.renameFile(operation.filePath, operation.newPath);
                case 'watch':
                    return await fileService.watchDirectory(operation.filePath);
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