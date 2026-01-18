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
exports.FileSystemService = void 0;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const chokidar_1 = require("chokidar");
class FileSystemService {
    constructor() {
        this.watchers = new Map();
    }
    async readFile(filePath) {
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            return content;
        }
        catch (error) {
            console.error(`Error reading file ${filePath}:`, error);
            throw new Error(`Failed to read file: ${filePath}`);
        }
    }
    async writeFile(filePath, content) {
        try {
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
        }
        catch (error) {
            console.error(`Error writing file ${filePath}:`, error);
            throw new Error(`Failed to write file: ${filePath}`);
        }
    }
    async createFile(filePath) {
        try {
            // Check if file already exists
            try {
                await fs.access(filePath);
                throw new Error(`File already exists: ${filePath}`);
            }
            catch (error) {
                // File doesn't exist, proceed with creation
            }
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, '', 'utf-8');
        }
        catch (error) {
            console.error(`Error creating file ${filePath}:`, error);
            throw new Error(`Failed to create file: ${filePath}`);
        }
    }
    async deleteFile(filePath) {
        try {
            await fs.unlink(filePath);
        }
        catch (error) {
            console.error(`Error deleting file ${filePath}:`, error);
            throw new Error(`Failed to delete file: ${filePath}`);
        }
    }
    async renameFile(oldPath, newPath) {
        try {
            // Ensure target directory exists
            const dir = path.dirname(newPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.rename(oldPath, newPath);
        }
        catch (error) {
            console.error(`Error renaming file from ${oldPath} to ${newPath}:`, error);
            throw new Error(`Failed to rename file: ${oldPath} -> ${newPath}`);
        }
    }
    async watchDirectory(dirPath) {
        try {
            // Stop existing watcher if any
            if (this.watchers.has(dirPath)) {
                await this.watchers.get(dirPath)?.close();
            }
            // Create new watcher
            const watcher = (0, chokidar_1.watch)(dirPath, {
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                persistent: true,
                ignoreInitial: true
            });
            watcher
                .on('add', (filePath) => {
                console.log(`File added: ${filePath}`);
                // TODO: Emit to renderer process
            })
                .on('change', (filePath) => {
                console.log(`File changed: ${filePath}`);
                // TODO: Emit to renderer process
            })
                .on('unlink', (filePath) => {
                console.log(`File removed: ${filePath}`);
                // TODO: Emit to renderer process
            })
                .on('error', (error) => {
                console.error('File watcher error:', error);
            });
            this.watchers.set(dirPath, watcher);
        }
        catch (error) {
            console.error(`Error watching directory ${dirPath}:`, error);
            throw new Error(`Failed to watch directory: ${dirPath}`);
        }
    }
    async stopWatching(dirPath) {
        const watcher = this.watchers.get(dirPath);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(dirPath);
        }
    }
    async stopAllWatchers() {
        for (const [dirPath, watcher] of this.watchers) {
            await watcher.close();
        }
        this.watchers.clear();
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=file-service.js.map