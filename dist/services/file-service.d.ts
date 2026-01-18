export declare class FileSystemService {
    private watchers;
    readFile(filePath: string): Promise<string>;
    writeFile(filePath: string, content: string): Promise<void>;
    createFile(filePath: string): Promise<void>;
    deleteFile(filePath: string): Promise<void>;
    renameFile(oldPath: string, newPath: string): Promise<void>;
    watchDirectory(dirPath: string): Promise<void>;
    stopWatching(dirPath: string): Promise<void>;
    stopAllWatchers(): Promise<void>;
}
//# sourceMappingURL=file-service.d.ts.map