"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationShell = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const menu_1 = require("./menu");
const ipc_handlers_1 = require("./ipc-handlers");
class ApplicationShell {
    constructor() {
        this.mainWindow = null;
    }
    async initialize() {
        // Handle app ready event
        electron_1.app.whenReady().then(() => {
            this.createWindow();
            (0, menu_1.setupMenus)();
            (0, ipc_handlers_1.registerIPCHandlers)();
            // macOS specific: re-create window when dock icon is clicked
            electron_1.app.on('activate', () => {
                if (electron_1.BrowserWindow.getAllWindows().length === 0) {
                    this.createWindow();
                }
            });
        });
        // Handle app events
        this.handleAppEvents();
    }
    createWindow() {
        // Create the browser window
        this.mainWindow = new electron_1.BrowserWindow({
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
        }
        else {
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
    handleAppEvents() {
        // Quit when all windows are closed (except on macOS)
        electron_1.app.on('window-all-closed', () => {
            if (process.platform !== 'darwin') {
                this.shutdown();
            }
        });
        // Handle before quit for cleanup
        electron_1.app.on('before-quit', async (event) => {
            event.preventDefault();
            await this.shutdown();
            electron_1.app.exit(0);
        });
    }
    async shutdown() {
        // Clean up resources
        console.log('Shutting down application...');
        // Save application state
        // TODO: Implement state persistence
        // Close all windows
        electron_1.BrowserWindow.getAllWindows().forEach(window => {
            window.close();
        });
        // Clean up IPC handlers
        electron_1.ipcMain.removeAllListeners();
        console.log('Application shutdown complete');
    }
    getMainWindow() {
        return this.mainWindow;
    }
}
exports.ApplicationShell = ApplicationShell;
// Initialize application
const appShell = new ApplicationShell();
appShell.initialize().catch(console.error);
//# sourceMappingURL=main.js.map