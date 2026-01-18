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
exports.ProjectService = void 0;
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
class ProjectService {
    constructor() {
        this.currentProject = null;
    }
    async loadProject(rootPath) {
        try {
            // Validate that the path exists and is a directory
            const stats = await fs.stat(rootPath);
            if (!stats.isDirectory()) {
                throw new Error(`Path is not a directory: ${rootPath}`);
            }
            // Create project context
            const project = {
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
        }
        catch (error) {
            console.error(`Error loading project ${rootPath}:`, error);
            throw new Error(`Failed to load project: ${rootPath}`);
        }
    }
    async createProject(rootPath, template) {
        try {
            // Create directory if it doesn't exist
            await fs.mkdir(rootPath, { recursive: true });
            // TODO: Apply project template if specified
            if (template) {
                await this.applyProjectTemplate(rootPath, template);
            }
            // Load the newly created project
            return await this.loadProject(rootPath);
        }
        catch (error) {
            console.error(`Error creating project ${rootPath}:`, error);
            throw new Error(`Failed to create project: ${rootPath}`);
        }
    }
    async refreshProject() {
        if (!this.currentProject) {
            throw new Error('No project currently loaded');
        }
        return await this.loadProject(this.currentProject.rootPath);
    }
    getCurrentProject() {
        return this.currentProject;
    }
    async scanProjectFiles(rootPath, maxDepth = 3) {
        const files = [];
        try {
            await this.scanDirectory(rootPath, rootPath, files, 0, maxDepth);
        }
        catch (error) {
            console.error('Error scanning project files:', error);
        }
        return files;
    }
    async scanDirectory(dirPath, rootPath, files, currentDepth, maxDepth) {
        if (currentDepth >= maxDepth)
            return;
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
                    const fileInfo = {
                        path: relativePath,
                        name: entry.name,
                        extension: path.extname(entry.name),
                        size: stats.size,
                        lastModified: stats.mtime
                    };
                    files.push(fileInfo);
                }
                else if (entry.isDirectory()) {
                    await this.scanDirectory(fullPath, rootPath, files, currentDepth + 1, maxDepth);
                }
            }
        }
        catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }
    }
    shouldIgnoreFile(fileName, relativePath) {
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
        return ignorePatterns.some(pattern => pattern.test(fileName) || pattern.test(relativePath));
    }
    async detectDependencies(rootPath) {
        const dependencies = [];
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
            }
            catch (error) {
                // package.json doesn't exist or is invalid
            }
            // TODO: Add support for other dependency files
            // - requirements.txt (Python)
            // - Cargo.toml (Rust)
            // - go.mod (Go)
            // - etc.
        }
        catch (error) {
            console.error('Error detecting dependencies:', error);
        }
        return dependencies;
    }
    async applyProjectTemplate(rootPath, template) {
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
    async createJavaScriptTemplate(rootPath) {
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
        await fs.writeFile(path.join(rootPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        await fs.writeFile(path.join(rootPath, 'index.js'), 'console.log("Hello, World!");');
    }
    async createTypeScriptTemplate(rootPath) {
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
        await fs.writeFile(path.join(rootPath, 'tsconfig.json'), JSON.stringify(tsConfig, null, 2));
        await fs.mkdir(path.join(rootPath, 'src'), { recursive: true });
        await fs.writeFile(path.join(rootPath, 'src', 'index.ts'), 'console.log("Hello, TypeScript!");');
    }
    async createPythonTemplate(rootPath) {
        await fs.writeFile(path.join(rootPath, 'main.py'), 'print("Hello, Python!")');
        await fs.writeFile(path.join(rootPath, 'requirements.txt'), '# Add your dependencies here');
    }
}
exports.ProjectService = ProjectService;
//# sourceMappingURL=project-service.js.map