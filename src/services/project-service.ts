import * as path from 'path';
import * as fs from 'fs/promises';
import { ProjectContext, FileInfo } from '../types/ipc-messages';

export class ProjectService {
  private currentProject: ProjectContext | null = null;

  async loadProject(rootPath: string): Promise<ProjectContext> {
    try {
      // Validate that the path exists and is a directory
      const stats = await fs.stat(rootPath);
      if (!stats.isDirectory()) {
        throw new Error(`Path is not a directory: ${rootPath}`);
      }

      // Create project context
      const project: ProjectContext = {
        rootPath,
        files: [],
        dependencies: [],
        summary: '',
        tokenCount: 0
      };

      // Load project files (basic implementation)
      project.files = await this.scanProjectFiles(rootPath);
      
      // TODO: Detect dependencies from package.json, requirements.txt, etc.
      project.dependencies = await this.detectDependencies(rootPath);
      
      // TODO: Generate project summary
      project.summary = `Project loaded from ${rootPath} with ${project.files.length} files`;
      
      this.currentProject = project;
      return project;
    } catch (error) {
      console.error(`Error loading project ${rootPath}:`, error);
      throw new Error(`Failed to load project: ${rootPath}`);
    }
  }

  async createProject(rootPath: string, template?: string): Promise<ProjectContext> {
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(rootPath, { recursive: true });

      // TODO: Apply project template if specified
      if (template) {
        await this.applyProjectTemplate(rootPath, template);
      }

      // Load the newly created project
      return await this.loadProject(rootPath);
    } catch (error) {
      console.error(`Error creating project ${rootPath}:`, error);
      throw new Error(`Failed to create project: ${rootPath}`);
    }
  }

  async refreshProject(): Promise<ProjectContext> {
    if (!this.currentProject) {
      throw new Error('No project currently loaded');
    }

    return await this.loadProject(this.currentProject.rootPath);
  }

  getCurrentProject(): ProjectContext | null {
    return this.currentProject;
  }

  private async scanProjectFiles(rootPath: string, maxDepth: number = 3): Promise<FileInfo[]> {
    const files: FileInfo[] = [];
    
    try {
      await this.scanDirectory(rootPath, rootPath, files, 0, maxDepth);
    } catch (error) {
      console.error('Error scanning project files:', error);
    }
    
    return files;
  }

  private async scanDirectory(
    dirPath: string, 
    rootPath: string, 
    files: FileInfo[], 
    currentDepth: number, 
    maxDepth: number
  ): Promise<void> {
    if (currentDepth >= maxDepth) return;

    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        const relativePath = path.relative(rootPath, fullPath);
        
        // Skip hidden files and common ignore patterns
        if (this.shouldIgnoreFile(entry.name, relativePath)) {
          continue;
        }

        if (entry.isFile()) {
          const stats = await fs.stat(fullPath);
          const fileInfo: FileInfo = {
            path: relativePath,
            name: entry.name,
            extension: path.extname(entry.name),
            size: stats.size,
            lastModified: stats.mtime
          };
          files.push(fileInfo);
        } else if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, rootPath, files, currentDepth + 1, maxDepth);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  private shouldIgnoreFile(fileName: string, relativePath: string): boolean {
    // Common ignore patterns
    const ignorePatterns = [
      /^\./, // Hidden files
      /node_modules/,
      /\.git/,
      /dist/,
      /build/,
      /coverage/,
      /\.nyc_output/,
      /\.vscode/,
      /\.idea/,
      /\.DS_Store/,
      /Thumbs\.db/
    ];

    return ignorePatterns.some(pattern => 
      pattern.test(fileName) || pattern.test(relativePath)
    );
  }

  private async detectDependencies(rootPath: string): Promise<any[]> {
    const dependencies: any[] = [];
    
    try {
      // Check for package.json (Node.js)
      const packageJsonPath = path.join(rootPath, 'package.json');
      try {
        const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));
        if (packageJson.dependencies) {
          Object.entries(packageJson.dependencies).forEach(([name, version]) => {
            dependencies.push({ name, version, type: 'production' });
          });
        }
        if (packageJson.devDependencies) {
          Object.entries(packageJson.devDependencies).forEach(([name, version]) => {
            dependencies.push({ name, version, type: 'development' });
          });
        }
      } catch (error) {
        // package.json doesn't exist or is invalid
      }

      // TODO: Add support for other dependency files
      // - requirements.txt (Python)
      // - Cargo.toml (Rust)
      // - go.mod (Go)
      // - etc.
      
    } catch (error) {
      console.error('Error detecting dependencies:', error);
    }
    
    return dependencies;
  }

  private async applyProjectTemplate(rootPath: string, template: string): Promise<void> {
    // TODO: Implement project template application
    console.log(`Applying template ${template} to ${rootPath}`);
    
    // For now, just create a basic structure
    switch (template) {
      case 'javascript':
        await this.createJavaScriptTemplate(rootPath);
        break;
      case 'typescript':
        await this.createTypeScriptTemplate(rootPath);
        break;
      case 'python':
        await this.createPythonTemplate(rootPath);
        break;
      default:
        console.log(`Unknown template: ${template}`);
    }
  }

  private async createJavaScriptTemplate(rootPath: string): Promise<void> {
    const packageJson = {
      name: path.basename(rootPath),
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: {
        start: 'node index.js',
        test: 'echo "Error: no test specified" && exit 1'
      },
      keywords: [],
      author: '',
      license: 'ISC'
    };

    await fs.writeFile(
      path.join(rootPath, 'package.json'), 
      JSON.stringify(packageJson, null, 2)
    );
    
    await fs.writeFile(
      path.join(rootPath, 'index.js'), 
      'console.log("Hello, World!");'
    );
  }

  private async createTypeScriptTemplate(rootPath: string): Promise<void> {
    // Similar to JavaScript but with TypeScript configuration
    await this.createJavaScriptTemplate(rootPath);
    
    const tsConfig = {
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        outDir: './dist',
        rootDir: './src',
        strict: true,
        esModuleInterop: true
      }
    };

    await fs.writeFile(
      path.join(rootPath, 'tsconfig.json'), 
      JSON.stringify(tsConfig, null, 2)
    );
    
    await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(rootPath, 'src', 'index.ts'), 
      'console.log("Hello, TypeScript!");'
    );
  }

  private async createPythonTemplate(rootPath: string): Promise<void> {
    await fs.writeFile(
      path.join(rootPath, 'main.py'), 
      'print("Hello, Python!")'
    );
    
    await fs.writeFile(
      path.join(rootPath, 'requirements.txt'), 
      '# Add your dependencies here'
    );
  }
}