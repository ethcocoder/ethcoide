declare const electronAPI: {
    fileOperations: {
        readFile(filePath: string): Promise<string>;
        writeFile(filePath: string, content: string): Promise<void>;
        createFile(filePath: string): Promise<void>;
        deleteFile(filePath: string): Promise<void>;
        renameFile(oldPath: string, newPath: string): Promise<void>;
        watchDirectory(dirPath: string): Promise<void>;
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