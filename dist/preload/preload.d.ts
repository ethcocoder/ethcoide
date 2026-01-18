declare const electronAPI: {
    fileOperations: {
        readFile(filePath: string): Promise<string>;
        writeFile(filePath: string, content: string): Promise<void>;
        createFile(filePath: string, content?: string): Promise<void>;
        createDirectory(dirPath: string): Promise<void>;
        deleteFile(filePath: string): Promise<void>;
        deleteDirectory(dirPath: string, recursive?: boolean): Promise<void>;
        rename(oldPath: string, newPath: string): Promise<void>;
        copyFile(sourcePath: string, targetPath: string): Promise<void>;
        readDirectory(dirPath: string): Promise<any[]>;
        exists(filePath: string): Promise<boolean>;
        watchDirectory(dirPath: string): Promise<void>;
        stopWatching(dirPath: string): Promise<void>;
        stat(filePath: string): Promise<any>;
        getAbsolutePath(filePath: string): Promise<string>;
        getRelativePath(from: string, to: string): Promise<string>;
        joinPath(...paths: string[]): Promise<string>;
        getDirname(filePath: string): Promise<string>;
        getBasename(filePath: string, ext?: string): Promise<string>;
        getExtension(filePath: string): Promise<string>;
    };
    aiOperations: {
        generateCompletion(context: any): Promise<any>;
        editCode(instruction: string, code: string): Promise<any>;
        explainCode(code: string): Promise<any>;
        chatWithAI(message: string, context: any): Promise<any>;
    };
    projectOperations: {
        loadProject(rootPath: string): Promise<any>;
        createProject(rootPath: string, template?: string): Promise<any>;
        refreshProject(): Promise<any>;
    };
    keyStorage: {
        setApiKey(keyName: string, apiKey: string): Promise<{
            success: boolean;
        }>;
        getApiKey(keyName: string): Promise<{
            apiKey: string | null;
        }>;
        deleteApiKey(keyName: string): Promise<{
            deleted: boolean;
        }>;
        listApiKeys(): Promise<{
            keyNames: string[];
        }>;
        hasApiKey(keyName: string): Promise<{
            exists: boolean;
        }>;
        updateApiKey(keyName: string, apiKey: string): Promise<{
            success: boolean;
        }>;
        clearAllApiKeys(): Promise<{
            success: boolean;
        }>;
    };
    system: {
        showOpenDialog(options: any): Promise<any>;
        showSaveDialog(options: any): Promise<any>;
        showMessageBox(options: any): Promise<any>;
    };
    events: {
        onFileChanged(callback: (filePath: string) => void): void;
        onProjectChanged(callback: (projectData: any) => void): void;
        removeAllListeners(): void;
    };
};
export type ElectronAPI = typeof electronAPI;
export {};
//# sourceMappingURL=preload.d.ts.map