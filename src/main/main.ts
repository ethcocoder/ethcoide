import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { setupMenus } from './menu';
import { registerIPCHandlers } from './ipc-handlers';

class ApplicationShell {
  private mainWindow: BrowserWindow | null = null;

  async initialize(): Promise<void> {
    // Handle app ready event
    app.whenReady().then(() => {
      this.createWindow();
      setupMenus();
      registerIPCHandlers();

      // macOS specific: re-create window when dock icon is clicked
      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          this.createWindow();
        }
      });
    });

    // Handle app events
    this.handleAppEvents();
  }

  createWindow(): BrowserWindow {
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js')
      },
      titleBarStyle: 'default',
      show: false // Don't show until ready
    });

    // Load the renderer
    const isDev = process.env.NODE_ENV === 'development';
    if (isDev) {
      this.mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));
      this.mainWindow.webContents.openDevTools();
    } else {
      this.mainWindow.loadFile(path.join(__dirname, '../../src/renderer/index.html'));
    }

    // Show window when ready to prevent visual flash
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null;
    });

    return this.mainWindow;
  }

  private handleAppEvents(): void {
    // Quit when all windows are closed (except on macOS)
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        this.shutdown();
      }
    });

    // Handle before quit for cleanup
    app.on('before-quit', async (event) => {
      event.preventDefault();
      await this.shutdown();
      app.exit(0);
    });
  }

  async shutdown(): Promise<void> {
    // Clean up resources
    console.log('Shutting down application...');
    
    // Save application state
    // TODO: Implement state persistence
    
    // Close all windows
    BrowserWindow.getAllWindows().forEach(window => {
      window.close();
    });
    
    // Clean up IPC handlers
    ipcMain.removeAllListeners();
    
    console.log('Application shutdown complete');
  }

  getMainWindow(): BrowserWindow | null {
    return this.mainWindow;
  }
}

// Initialize application
const appShell = new ApplicationShell();
appShell.initialize().catch(console.error);

// Export for testing
export { ApplicationShell };