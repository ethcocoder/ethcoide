import { ProjectContext } from '../types/ipc-messages';
export declare class ProjectService {
    private currentProject;
    loadProject(rootPath: string): Promise<ProjectContext>;
    createProject(rootPath: string, template?: string): Promise<ProjectContext>;
    refreshProject(): Promise<ProjectContext>;
    getCurrentProject(): ProjectContext | null;
    private scanProjectFiles;
    private scanDirectory;
    private shouldIgnoreFile;
    private detectDependencies;
    private applyProjectTemplate;
    private createJavaScriptTemplate;
    private createTypeScriptTemplate;
    private createPythonTemplate;
}
//# sourceMappingURL=project-service.d.ts.map