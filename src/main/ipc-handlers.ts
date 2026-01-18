import { ipcMain, dialog, IpcMainInvokeEvent } from 'electron';
import { FileOperation, AIRequest, ProjectOperation } from '../types/ipc-messages';
import { FileSystemService } from '../services/file-service';
import { ProjectService } from '../services/project-service';
import { AIService } from '../ai/gemini-client';

// Initialize services
const fileService = new FileSystemService();
const projectService = new ProjectService();
const aiService = new AIService();

export function registerIPCHandlers(): void {
  // File operations
  ipcMain.handle('file-operation', async (event: IpcMainInvokeEvent, operation: FileOperation) => {
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
    } catch (error) {
      console.error('IPC: File operation error:', error);
      throw error;
    }
  });

  // AI operations
  ipcMain.handle('ai-request', async (event: IpcMainInvokeEvent, request: AIRequest) => {
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
    } catch (error) {
      console.error('AI request error:', error);
      throw error;
    }
  });

  // Project operations
  ipcMain.handle('project-operation', async (event: IpcMainInvokeEvent, operation: ProjectOperation) => {
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
    } catch (error) {
      console.error('IPC: Project operation error:', error);
      throw error;
    }
  });

  // System dialogs
  ipcMain.handle('show-open-dialog', async (event: IpcMainInvokeEvent, options: any) => {
    try {
      const result = await dialog.showOpenDialog(options);
      return result;
    } catch (error) {
      console.error('Open dialog error:', error);
      throw error;
    }
  });

  ipcMain.handle('show-save-dialog', async (event: IpcMainInvokeEvent, options: any) => {
    try {
      const result = await dialog.showSaveDialog(options);
      return result;
    } catch (error) {
      console.error('Save dialog error:', error);
      throw error;
    }
  });

  ipcMain.handle('show-message-box', async (event: IpcMainInvokeEvent, options: any) => {
    try {
      const result = await dialog.showMessageBox(options);
      return result;
    } catch (error) {
      console.error('Message box error:', error);
      throw error;
    }
  });

  console.log('IPC handlers registered successfully');
}