export interface FileStats {
    isDirectory: boolean;
    isFile: boolean;
    size: number;
    lastModified: Date;
    permissions: {
        readable: boolean;
        writable: boolean;
        executable: boolean;
    };
}
export interface DirectoryEntry {
    name: string;
    path: string;
    isDirectory: boolean;
    isFile: boolean;
    size: number;
    lastModified: Date;
}
export interface FileWatchEvent {
    type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
    path: string;
    stats?: FileStats;
}
export declare class FileSystemService {
    private watchers;
    private eventCallbacks;
    /**
     * Read file content as string
     */
    readFile(filePath: string): Promise<string>;
    /**
     * Write content to file
     */
    writeFile(filePath: string, content: string): Promise<void>;
    /**
     * Get file or directory statistics
     */
    stat(filePath: string): Promise<FileStats>;
    /**
     * Check if file or directory exists
     */
    exists(filePath: string): Promise<boolean>;
    /**
     * Create a new file
     */
    createFile(filePath: string, content?: string): Promise<void>;
    /**
     * Create a new directory
     */
    createDirectory(dirPath: string): Promise<void>;
    /**
     * Delete a file
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * Delete a directory (recursively)
     */
    deleteDirectory(dirPath: string, recursive?: boolean): Promise<void>;
    /**
     * Rename/move a file or directory
     */
    rename(oldPath: string, newPath: string): Promise<void>;
    /**
     * Copy a file
     */
    copyFile(sourcePath: string, targetPath: string): Promise<void>;
    /**
     * List directory contents
     */
    readDirectory(dirPath: string): Promise<DirectoryEntry[]>;
    /**
     * Watch directory for changes
     */
    watchDirectory(dirPath: string, callback?: (event: FileWatchEvent) => void): Promise<void>;
    /**
     * Stop watching a directory
     */
    stopWatching(dirPath: string): Promise<void>;
    /**
     * Stop all watchers
     */
    stopAllWatchers(): Promise<void>;
    /**
     * Get absolute path
     */
    getAbsolutePath(filePath: string): string;
    /**
     * Get relative path
     */
    getRelativePath(from: string, to: string): string;
    /**
     * Join paths
     */
    joinPath(...paths: string[]): string;
    /**
     * Get directory name
     */
    getDirname(filePath: string): string;
    /**
     * Get base name
     */
    getBasename(filePath: string, ext?: string): string;
    /**
     * Get file extension
     */
    getExtension(filePath: string): string;
    /**
     * Private helper methods
     */
    private checkAccess;
    private checkFileAccess;
    private createBackup;
    private restoreBackup;
    private emitWatchEvent;
}
//# sourceMappingURL=file-service.d.ts.map