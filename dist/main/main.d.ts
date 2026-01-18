import { BrowserWindow } from 'electron';
declare class ApplicationShell {
    private mainWindow;
    initialize(): Promise<void>;
    createWindow(): BrowserWindow;
    private handleAppEvents;
    shutdown(): Promise<void>;
    getMainWindow(): BrowserWindow | null;
}
export { ApplicationShell };
//# sourceMappingURL=main.d.ts.map