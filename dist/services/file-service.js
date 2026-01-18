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
        this.eventCallbacks = new Map();
    }
    /**
     * Read file content as string
     */
    async readFile(filePath) {
        try {
            console.log(`FileSystemService: Reading file ${filePath}`);
            // Check if file exists and is readable
            await this.checkFileAccess(filePath, fs.constants.R_OK);
            const content = await fs.readFile(filePath, 'utf-8');
            console.log(`FileSystemService: Successfully read file ${filePath}, length: ${content.length}`);
            return content;
        }
        catch (error) {
            console.error(`FileSystemService: Error reading file ${filePath}:`, error);
            throw new Error(`Failed to read file: ${filePath} - ${error.message}`);
        }
    }
    /**
     * Write content to file
     */
    async writeFile(filePath, content) {
        try {
            console.log(`FileSystemService: Writing file ${filePath}`);
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            // Create backup if file exists
            const backupPath = await this.createBackup(filePath);
            try {
                await fs.writeFile(filePath, content, 'utf-8');
                console.log(`FileSystemService: Successfully wrote file ${filePath}`);
                // Remove backup on success
                if (backupPath) {
                    await this.deleteFile(backupPath).catch(() => { }); // Ignore backup deletion errors
                }
            }
            catch (writeError) {
                // Restore backup on failure
                if (backupPath) {
                    await this.restoreBackup(backupPath, filePath);
                }
                throw writeError;
            }
        }
        catch (error) {
            console.error(`FileSystemService: Error writing file ${filePath}:`, error);
            throw new Error(`Failed to write file: ${filePath} - ${error.message}`);
        }
    }
    /**
     * Get file or directory statistics
     */
    async stat(filePath) {
        try {
            console.log(`FileSystemService: Getting stats for ${filePath}`);
            const stats = await fs.stat(filePath);
            // Check permissions
            const permissions = {
                readable: await this.checkAccess(filePath, fs.constants.R_OK),
                writable: await this.checkAccess(filePath, fs.constants.W_OK),
                executable: await this.checkAccess(filePath, fs.constants.X_OK)
            };
            return {
                isDirectory: stats.isDirectory(),
                isFile: stats.isFile(),
                size: stats.size,
                lastModified: stats.mtime,
                permissions
            };
        }
        catch (error) {
            console.error(`FileSystemService: Error getting stats for ${filePath}:`, error);
            throw new Error(`Failed to get file stats: ${filePath} - ${error.message}`);
        }
    }
    /**
     * Check if file or directory exists
     */
    async exists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Create a new file
     */
    async createFile(filePath, content = '') {
        try {
            console.log(`FileSystemService: Creating file ${filePath}`);
            // Check if file already exists
            if (await this.exists(filePath)) {
                throw new Error(`File already exists: ${filePath}`);
            }
            // Ensure directory exists
            const dir = path.dirname(filePath);
            await fs.mkdir(dir, { recursive: true });
            await fs.writeFile(filePath, content, 'utf-8');
            console.log(`FileSystemService: Successfully created file ${filePath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error creating file ${filePath}:`, error);
            throw new Error(`Failed to create file: ${filePath} - ${error.message}`);
        }
    }
    /**
     * Create a new directory
     */
    async createDirectory(dirPath) {
        try {
            console.log(`FileSystemService: Creating directory ${dirPath}`);
            if (await this.exists(dirPath)) {
                throw new Error(`Directory already exists: ${dirPath}`);
            }
            await fs.mkdir(dirPath, { recursive: true });
            console.log(`FileSystemService: Successfully created directory ${dirPath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error creating directory ${dirPath}:`, error);
            throw new Error(`Failed to create directory: ${dirPath} - ${error.message}`);
        }
    }
    /**
     * Delete a file
     */
    async deleteFile(filePath) {
        try {
            console.log(`FileSystemService: Deleting file ${filePath}`);
            // Check if file exists
            if (!(await this.exists(filePath))) {
                throw new Error(`File does not exist: ${filePath}`);
            }
            // Check if it's actually a file
            const stats = await this.stat(filePath);
            if (!stats.isFile) {
                throw new Error(`Path is not a file: ${filePath}`);
            }
            await fs.unlink(filePath);
            console.log(`FileSystemService: Successfully deleted file ${filePath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error deleting file ${filePath}:`, error);
            throw new Error(`Failed to delete file: ${filePath} - ${error.message}`);
        }
    }
    /**
     * Delete a directory (recursively)
     */
    async deleteDirectory(dirPath, recursive = false) {
        try {
            console.log(`FileSystemService: Deleting directory ${dirPath}`);
            // Check if directory exists
            if (!(await this.exists(dirPath))) {
                throw new Error(`Directory does not exist: ${dirPath}`);
            }
            // Check if it's actually a directory
            const stats = await this.stat(dirPath);
            if (!stats.isDirectory) {
                throw new Error(`Path is not a directory: ${dirPath}`);
            }
            if (recursive) {
                await fs.rm(dirPath, { recursive: true, force: true });
            }
            else {
                await fs.rmdir(dirPath);
            }
            console.log(`FileSystemService: Successfully deleted directory ${dirPath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error deleting directory ${dirPath}:`, error);
            throw new Error(`Failed to delete directory: ${dirPath} - ${error.message}`);
        }
    }
    /**
     * Rename/move a file or directory
     */
    async rename(oldPath, newPath) {
        try {
            console.log(`FileSystemService: Renaming ${oldPath} to ${newPath}`);
            // Check if source exists
            if (!(await this.exists(oldPath))) {
                throw new Error(`Source does not exist: ${oldPath}`);
            }
            // Check if target already exists
            if (await this.exists(newPath)) {
                throw new Error(`Target already exists: ${newPath}`);
            }
            // Ensure target directory exists
            const dir = path.dirname(newPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.rename(oldPath, newPath);
            console.log(`FileSystemService: Successfully renamed ${oldPath} to ${newPath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error renaming ${oldPath} to ${newPath}:`, error);
            throw new Error(`Failed to rename: ${oldPath} -> ${newPath} - ${error.message}`);
        }
    }
    /**
     * Copy a file
     */
    async copyFile(sourcePath, targetPath) {
        try {
            console.log(`FileSystemService: Copying ${sourcePath} to ${targetPath}`);
            // Check if source exists and is a file
            const sourceStats = await this.stat(sourcePath);
            if (!sourceStats.isFile) {
                throw new Error(`Source is not a file: ${sourcePath}`);
            }
            // Check if target already exists
            if (await this.exists(targetPath)) {
                throw new Error(`Target already exists: ${targetPath}`);
            }
            // Ensure target directory exists
            const dir = path.dirname(targetPath);
            await fs.mkdir(dir, { recursive: true });
            await fs.copyFile(sourcePath, targetPath);
            console.log(`FileSystemService: Successfully copied ${sourcePath} to ${targetPath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error copying ${sourcePath} to ${targetPath}:`, error);
            throw new Error(`Failed to copy file: ${sourcePath} -> ${targetPath} - ${error.message}`);
        }
    }
    /**
     * List directory contents
     */
    async readDirectory(dirPath) {
        try {
            console.log(`FileSystemService: Reading directory ${dirPath}`);
            // Check if directory exists and is readable
            const stats = await this.stat(dirPath);
            if (!stats.isDirectory) {
                throw new Error(`Path is not a directory: ${dirPath}`);
            }
            const entries = await fs.readdir(dirPath);
            const result = [];
            for (const entry of entries) {
                const entryPath = path.join(dirPath, entry);
                try {
                    const entryStats = await this.stat(entryPath);
                    result.push({
                        name: entry,
                        path: entryPath,
                        isDirectory: entryStats.isDirectory,
                        isFile: entryStats.isFile,
                        size: entryStats.size,
                        lastModified: entryStats.lastModified
                    });
                }
                catch (error) {
                    console.warn(`FileSystemService: Could not stat ${entryPath}:`, error);
                    // Skip entries that can't be accessed
                }
            }
            // Sort: directories first, then files, both alphabetically
            result.sort((a, b) => {
                if (a.isDirectory && !b.isDirectory)
                    return -1;
                if (!a.isDirectory && b.isDirectory)
                    return 1;
                return a.name.localeCompare(b.name);
            });
            console.log(`FileSystemService: Successfully read directory ${dirPath}, ${result.length} entries`);
            return result;
        }
        catch (error) {
            console.error(`FileSystemService: Error reading directory ${dirPath}:`, error);
            throw new Error(`Failed to read directory: ${dirPath} - ${error.message}`);
        }
    }
    /**
     * Watch directory for changes
     */
    async watchDirectory(dirPath, callback) {
        try {
            console.log(`FileSystemService: Starting to watch directory ${dirPath}`);
            // Stop existing watcher if any
            if (this.watchers.has(dirPath)) {
                await this.stopWatching(dirPath);
            }
            // Store callback
            if (callback) {
                this.eventCallbacks.set(dirPath, callback);
            }
            // Create new watcher
            const watcher = (0, chokidar_1.watch)(dirPath, {
                ignored: /(^|[\/\\])\../, // ignore dotfiles
                persistent: true,
                ignoreInitial: true,
                depth: 10 // Limit recursion depth
            });
            watcher
                .on('add', (filePath) => {
                console.log(`File added: ${filePath}`);
                this.emitWatchEvent(dirPath, { type: 'add', path: filePath });
            })
                .on('change', (filePath) => {
                console.log(`File changed: ${filePath}`);
                this.emitWatchEvent(dirPath, { type: 'change', path: filePath });
            })
                .on('unlink', (filePath) => {
                console.log(`File removed: ${filePath}`);
                this.emitWatchEvent(dirPath, { type: 'unlink', path: filePath });
            })
                .on('addDir', (dirPath) => {
                console.log(`Directory added: ${dirPath}`);
                this.emitWatchEvent(dirPath, { type: 'addDir', path: dirPath });
            })
                .on('unlinkDir', (dirPath) => {
                console.log(`Directory removed: ${dirPath}`);
                this.emitWatchEvent(dirPath, { type: 'unlinkDir', path: dirPath });
            })
                .on('error', (error) => {
                console.error('File watcher error:', error);
            });
            this.watchers.set(dirPath, watcher);
            console.log(`FileSystemService: Successfully started watching ${dirPath}`);
        }
        catch (error) {
            console.error(`FileSystemService: Error watching directory ${dirPath}:`, error);
            throw new Error(`Failed to watch directory: ${dirPath} - ${error.message}`);
        }
    }
    /**
     * Stop watching a directory
     */
    async stopWatching(dirPath) {
        const watcher = this.watchers.get(dirPath);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(dirPath);
            this.eventCallbacks.delete(dirPath);
            console.log(`FileSystemService: Stopped watching ${dirPath}`);
        }
    }
    /**
     * Stop all watchers
     */
    async stopAllWatchers() {
        console.log(`FileSystemService: Stopping all watchers`);
        for (const [dirPath, watcher] of this.watchers) {
            await watcher.close();
        }
        this.watchers.clear();
        this.eventCallbacks.clear();
    }
    /**
     * Get absolute path
     */
    getAbsolutePath(filePath) {
        return path.resolve(filePath);
    }
    /**
     * Get relative path
     */
    getRelativePath(from, to) {
        return path.relative(from, to);
    }
    /**
     * Join paths
     */
    joinPath(...paths) {
        return path.join(...paths);
    }
    /**
     * Get directory name
     */
    getDirname(filePath) {
        return path.dirname(filePath);
    }
    /**
     * Get base name
     */
    getBasename(filePath, ext) {
        return path.basename(filePath, ext);
    }
    /**
     * Get file extension
     */
    getExtension(filePath) {
        return path.extname(filePath);
    }
    /**
     * Private helper methods
     */
    async checkAccess(filePath, mode) {
        try {
            await fs.access(filePath, mode);
            return true;
        }
        catch {
            return false;
        }
    }
    async checkFileAccess(filePath, mode) {
        try {
            await fs.access(filePath, mode);
        }
        catch (error) {
            throw new Error(`File access denied: ${filePath}`);
        }
    }
    async createBackup(filePath) {
        if (!(await this.exists(filePath))) {
            return null;
        }
        const backupPath = `${filePath}.backup.${Date.now()}`;
        try {
            await fs.copyFile(filePath, backupPath);
            return backupPath;
        }
        catch (error) {
            console.warn(`FileSystemService: Could not create backup for ${filePath}:`, error);
            return null;
        }
    }
    async restoreBackup(backupPath, originalPath) {
        try {
            await fs.copyFile(backupPath, originalPath);
            await fs.unlink(backupPath);
        }
        catch (error) {
            console.error(`FileSystemService: Could not restore backup ${backupPath}:`, error);
        }
    }
    emitWatchEvent(dirPath, event) {
        const callback = this.eventCallbacks.get(dirPath);
        if (callback) {
            callback(event);
        }
    }
}
exports.FileSystemService = FileSystemService;
//# sourceMappingURL=file-service.js.map