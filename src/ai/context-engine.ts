import * as path from 'path';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';
import { FileSystemService } from '../services/file-service';
import { ProjectService } from '../services/project-service';
import { ProjectContext, FileInfo, CodeContext } from '../types/ipc-messages';

/**
 * Configuration for context collection
 */
export interface ContextConfig {
  maxFiles: number;
  maxLinesPerFile: number;
  maxTotalTokens: number;
  includeImports: boolean;
  excludePatterns: string[];
  enableCaching: boolean;
  cacheDirectory: string;
  cacheMaxAge: number; // in milliseconds
  cacheCleanupInterval: number; // in milliseconds
}

/**
 * Context collection result
 */
export interface ContextCollection {
  files: ContextFile[];
  totalLines: number;
  estimatedTokens: number;
  summary: string;
  truncated: boolean;
}

/**
 * File with context information
 */
export interface ContextFile {
  path: string;
  name: string;
  extension: string;
  content: string;
  lines: number;
  estimatedTokens: number;
  relevanceScore: number;
  truncated: boolean;
  summary?: string;
}

/**
 * Import detection result
 */
export interface ImportInfo {
  filePath: string;
  importedFrom: string;
  importType: 'relative' | 'absolute' | 'package';
  line: number;
}

/**
 * Cache entry for context summaries
 */
export interface CacheEntry {
  key: string;
  filePath: string;
  lastModified: number;
  fileSize: number;
  summary: string;
  estimatedTokens: number;
  createdAt: number;
  accessedAt: number;
}

/**
 * Cache performance metrics
 */
export interface CacheMetrics {
  hits: number;
  misses: number;
  evictions: number;
  totalEntries: number;
  cacheSize: number; // in bytes
  hitRate: number;
}

/**
 * Context Engine with Hard Limits
 * 
 * This engine provides deterministic context collection for AI requests
 * with strict limits to prevent token overflow and ensure consistent behavior.
 */
export class ContextEngine {
  private static readonly DEFAULT_CONFIG: ContextConfig = {
    maxFiles: 5,
    maxLinesPerFile: 200,
    maxTotalTokens: 8000, // Conservative estimate for Gemini context window
    includeImports: true,
    excludePatterns: [
      'node_modules/**',
      'dist/**',
      'build/**',
      'coverage/**',
      '.git/**',
      '*.min.js',
      '*.bundle.js',
      '*.map',
      '*.log',
      'package-lock.json',
      'yarn.lock'
    ],
    enableCaching: true,
    cacheDirectory: '.context-cache',
    cacheMaxAge: 24 * 60 * 60 * 1000, // 24 hours
    cacheCleanupInterval: 60 * 60 * 1000 // 1 hour
  };

  private fileService: FileSystemService;
  private projectService: ProjectService;
  private config: ContextConfig;
  private cache: Map<string, CacheEntry> = new Map();
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalEntries: 0,
    cacheSize: 0,
    hitRate: 0
  };
  private cleanupTimer: NodeJS.Timeout | null = null;

  constructor(
    fileService: FileSystemService,
    projectService: ProjectService,
    config: Partial<ContextConfig> = {}
  ) {
    this.fileService = fileService;
    this.projectService = projectService;
    this.config = { ...ContextEngine.DEFAULT_CONFIG, ...config };
    
    // Initialize caching
    if (this.config.enableCaching) {
      this.initializeCache();
    }
  }

  /**
   * Collect context for AI request with deterministic file selection
   */
  async collectContext(
    currentFilePath: string,
    selectedText?: string,
    cursorLine?: number
  ): Promise<ContextCollection> {
    console.log(`ContextEngine: Collecting context for ${currentFilePath}`);
    
    const project = this.projectService.getCurrentProject();
    if (!project) {
      throw new Error('No project loaded');
    }

    const contextFiles: ContextFile[] = [];
    let totalLines = 0;
    let estimatedTokens = 0;
    let truncated = false;

    try {
      // Step 1: Always include current file (highest priority)
      const currentFile = await this.loadContextFile(currentFilePath, project.rootPath);
      if (currentFile) {
        contextFiles.push(currentFile);
        totalLines += currentFile.lines;
        estimatedTokens += currentFile.estimatedTokens;
        console.log(`ContextEngine: Added current file ${currentFile.name} (${currentFile.lines} lines)`);
      }

      // Step 2: Find and include imports if enabled
      if (this.config.includeImports && currentFile) {
        const imports = await this.findImports(currentFile, project.rootPath);
        console.log(`ContextEngine: Found ${imports.length} imports`);
        
        for (const importInfo of imports) {
          if (contextFiles.length >= this.config.maxFiles) {
            truncated = true;
            break;
          }

          const importFile = await this.loadContextFile(importInfo.filePath, project.rootPath);
          if (importFile && !this.isDuplicate(importFile, contextFiles)) {
            // Check if adding this file would exceed limits
            if (totalLines + importFile.lines > this.config.maxLinesPerFile * this.config.maxFiles ||
                estimatedTokens + importFile.estimatedTokens > this.config.maxTotalTokens) {
              truncated = true;
              break;
            }

            contextFiles.push(importFile);
            totalLines += importFile.lines;
            estimatedTokens += importFile.estimatedTokens;
            console.log(`ContextEngine: Added import ${importFile.name} (${importFile.lines} lines)`);
          }
        }
      }

      // Step 3: Add related files based on relevance scoring
      if (contextFiles.length < this.config.maxFiles) {
        const relatedFiles = await this.findRelatedFiles(currentFilePath, project);
        console.log(`ContextEngine: Found ${relatedFiles.length} related files`);
        
        for (const fileInfo of relatedFiles) {
          if (contextFiles.length >= this.config.maxFiles) {
            truncated = true;
            break;
          }

          const relatedFile = await this.loadContextFile(
            path.join(project.rootPath, fileInfo.path), 
            project.rootPath
          );
          
          if (relatedFile && !this.isDuplicate(relatedFile, contextFiles)) {
            // Check limits
            if (totalLines + relatedFile.lines > this.config.maxLinesPerFile * this.config.maxFiles ||
                estimatedTokens + relatedFile.estimatedTokens > this.config.maxTotalTokens) {
              truncated = true;
              break;
            }

            contextFiles.push(relatedFile);
            totalLines += relatedFile.lines;
            estimatedTokens += relatedFile.estimatedTokens;
            console.log(`ContextEngine: Added related file ${relatedFile.name} (${relatedFile.lines} lines)`);
          }
        }
      }

      // Step 4: Generate summary
      const summary = this.generateContextSummary(contextFiles, truncated);

      const result: ContextCollection = {
        files: contextFiles,
        totalLines,
        estimatedTokens,
        summary,
        truncated
      };

      console.log(`ContextEngine: Context collection complete - ${contextFiles.length} files, ${totalLines} lines, ~${estimatedTokens} tokens`);
      return result;

    } catch (error) {
      console.error('ContextEngine: Error collecting context:', error);
      throw new Error(`Failed to collect context: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load a file and create context file with limits
   */
  private async loadContextFile(filePath: string, rootPath: string): Promise<ContextFile | null> {
    try {
      // Check if file should be excluded
      const relativePath = path.relative(rootPath, filePath);
      if (this.shouldExcludeFile(relativePath)) {
        console.log(`ContextEngine: Excluding file ${relativePath} (matches exclude pattern)`);
        return null;
      }

      // Check if file exists
      if (!(await this.fileService.exists(filePath))) {
        console.log(`ContextEngine: File does not exist: ${filePath}`);
        return null;
      }

      // Read file content
      const content = await this.fileService.readFile(filePath);
      const lines = content.split('\n');
      const totalLines = lines.length;
      
      // Apply line limit
      let finalContent = content;
      let truncated = false;
      
      if (totalLines > this.config.maxLinesPerFile) {
        const truncatedLines = lines.slice(0, this.config.maxLinesPerFile);
        finalContent = truncatedLines.join('\n') + '\n\n// ... (file truncated)';
        truncated = true;
        console.log(`ContextEngine: Truncated ${path.basename(filePath)} from ${totalLines} to ${this.config.maxLinesPerFile} lines`);
      }

      // Estimate tokens (rough approximation: 1 token ≈ 4 characters)
      const estimatedTokens = Math.ceil(finalContent.length / 4);

      // Calculate relevance score (basic implementation)
      const relevanceScore = this.calculateRelevanceScore(filePath, finalContent);

      const contextFile: ContextFile = {
        path: relativePath.replace(/\\/g, '/'), // Normalize path separators
        name: path.basename(filePath),
        extension: path.extname(filePath),
        content: finalContent,
        lines: truncated ? this.config.maxLinesPerFile : totalLines,
        estimatedTokens,
        relevanceScore,
        truncated,
        summary: truncated ? await this.generateFileSummary(filePath, finalContent) : undefined
      };

      return contextFile;

    } catch (error) {
      console.error(`ContextEngine: Error loading file ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Find imports in a file
   */
  private async findImports(contextFile: ContextFile, rootPath: string): Promise<ImportInfo[]> {
    const imports: ImportInfo[] = [];
    const lines = contextFile.content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // JavaScript/TypeScript imports
      const jsImportMatch = line.match(/^import\s+.*?\s+from\s+['"]([^'"]+)['"]/);
      const jsRequireMatch = line.match(/require\(['"]([^'"]+)['"]\)/);
      
      // Python imports
      const pyImportMatch = line.match(/^from\s+([^\s]+)\s+import|^import\s+([^\s,]+)/);

      let importPath: string | null = null;
      
      if (jsImportMatch) {
        importPath = jsImportMatch[1];
      } else if (jsRequireMatch) {
        importPath = jsRequireMatch[1];
      } else if (pyImportMatch) {
        importPath = pyImportMatch[1] || pyImportMatch[2];
        // Convert Python module path to file path
        if (importPath && !importPath.startsWith('.')) {
          importPath = importPath.replace(/\./g, '/') + '.py';
        }
      }

      if (importPath) {
        const resolvedPath = await this.resolveImportPath(importPath, contextFile.path, rootPath);
        if (resolvedPath) {
          imports.push({
            filePath: resolvedPath,
            importedFrom: importPath,
            importType: importPath.startsWith('.') ? 'relative' : 
                       importPath.startsWith('/') ? 'absolute' : 'package',
            line: i + 1
          });
        }
      }
    }

    return imports;
  }

  /**
   * Resolve import path to actual file path
   */
  private async resolveImportPath(importPath: string, currentFilePath: string, rootPath: string): Promise<string | null> {
    try {
      if (importPath.startsWith('.')) {
        // Relative import
        const currentDir = path.dirname(path.join(rootPath, currentFilePath));
        const resolvedPath = path.resolve(currentDir, importPath);
        
        // Try different extensions
        const extensions = ['.ts', '.js', '.tsx', '.jsx', '.py'];
        for (const ext of extensions) {
          const pathWithExt = resolvedPath + ext;
          if (await this.fileService.exists(pathWithExt)) {
            return pathWithExt;
          }
        }
        
        // Try index files
        for (const ext of extensions) {
          const indexPath = path.join(resolvedPath, 'index' + ext);
          if (await this.fileService.exists(indexPath)) {
            return indexPath;
          }
        }
      } else if (!importPath.includes('/') || importPath.startsWith('@')) {
        // Package import - skip for now as we don't include node_modules
        return null;
      } else {
        // Absolute import from project root
        const absolutePath = path.join(rootPath, importPath);
        if (await this.fileService.exists(absolutePath)) {
          return absolutePath;
        }
      }
    } catch (error) {
      console.error(`ContextEngine: Error resolving import ${importPath}:`, error);
    }
    
    return null;
  }

  /**
   * Find related files based on relevance scoring
   */
  private async findRelatedFiles(currentFilePath: string, project: ProjectContext): Promise<FileInfo[]> {
    const currentFileName = path.basename(currentFilePath, path.extname(currentFilePath));
    const currentDir = path.dirname(currentFilePath);
    
    // Score files based on relevance
    const scoredFiles = project.files
      .filter(file => {
        const fullPath = path.join(project.rootPath, file.path);
        return fullPath !== currentFilePath && !this.shouldExcludeFile(file.path);
      })
      .map(file => ({
        ...file,
        score: this.calculateFileRelevanceScore(file, currentFileName, currentDir)
      }))
      .sort((a, b) => b.score - a.score);

    return scoredFiles.slice(0, this.config.maxFiles - 1); // Reserve one slot for current file
  }

  /**
   * Calculate relevance score for file content
   */
  private calculateRelevanceScore(filePath: string, content: string): number {
    let score = 0;
    
    // Base score by file type
    const ext = path.extname(filePath).toLowerCase();
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs'];
    if (codeExtensions.includes(ext)) {
      score += 10;
    }
    
    // Boost for smaller files (easier to process)
    const lines = content.split('\n').length;
    if (lines < 50) score += 5;
    else if (lines < 100) score += 3;
    else if (lines < 200) score += 1;
    
    // Boost for files with exports/classes/functions
    if (content.includes('export ') || content.includes('class ') || content.includes('function ')) {
      score += 5;
    }
    
    return score;
  }

  /**
   * Calculate file relevance score based on relationship to current file
   */
  private calculateFileRelevanceScore(file: FileInfo, currentFileName: string, currentDir: string): number {
    let score = 0;
    
    // Same directory bonus
    if (path.dirname(file.path) === currentDir.replace(/\\/g, '/')) {
      score += 20;
    }
    
    // Similar name bonus
    const fileName = path.basename(file.path, path.extname(file.path));
    if (fileName.includes(currentFileName) || currentFileName.includes(fileName)) {
      score += 15;
    }
    
    // Same extension bonus
    const currentExt = path.extname(currentDir);
    if (file.extension === currentExt) {
      score += 10;
    }
    
    // Test file bonus if current is implementation (or vice versa)
    if ((fileName.includes('test') || fileName.includes('spec')) && 
        !currentFileName.includes('test') && !currentFileName.includes('spec')) {
      score += 8;
    }
    
    // Smaller files are easier to include
    if (file.size < 5000) score += 5;
    else if (file.size < 10000) score += 3;
    
    return score;
  }

  /**
   * Check if file should be excluded based on patterns
   */
  private shouldExcludeFile(filePath: string): boolean {
    const normalizedPath = filePath.replace(/\\/g, '/');
    
    return this.config.excludePatterns.some(pattern => {
      // Convert glob pattern to regex
      const regexPattern = pattern
        .replace(/\*\*/g, '.*')
        .replace(/\*/g, '[^/]*')
        .replace(/\?/g, '[^/]');
      
      const regex = new RegExp(regexPattern);
      return regex.test(normalizedPath);
    });
  }

  /**
   * Check if context file is already in the collection
   */
  private isDuplicate(contextFile: ContextFile, existingFiles: ContextFile[]): boolean {
    return existingFiles.some(existing => existing.path === contextFile.path);
  }

  /**
   * Generate summary for file content
   */
  private async generateFileSummary(filePath: string, content: string): Promise<string> {
    // Check cache first
    const cachedSummary = await this.getCachedSummary(filePath);
    if (cachedSummary) {
      return cachedSummary;
    }
    
    // Generate new summary
    const lines = content.split('\n');
    const firstLines = lines.slice(0, 5).join('\n');
    const lastLines = lines.slice(-3).join('\n');
    
    const summary = `File summary (first 5 lines):\n${firstLines}\n\n... (content truncated) ...\n\n(last 3 lines):\n${lastLines}`;
    
    // Cache the summary
    const estimatedTokens = Math.ceil(summary.length / 4);
    await this.cacheSummary(filePath, summary, estimatedTokens);
    
    return summary;
  }

  /**
   * Generate context collection summary
   */
  private generateContextSummary(contextFiles: ContextFile[], truncated: boolean): string {
    const fileList = contextFiles.map(f => `${f.name} (${f.lines} lines)`).join(', ');
    const totalLines = contextFiles.reduce((sum, f) => sum + f.lines, 0);
    const totalTokens = contextFiles.reduce((sum, f) => sum + f.estimatedTokens, 0);
    
    let summary = `Context includes ${contextFiles.length} files: ${fileList}. `;
    summary += `Total: ${totalLines} lines, ~${totalTokens} tokens.`;
    
    if (truncated) {
      summary += ' Some files or content were truncated due to size limits.';
    }
    
    return summary;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ContextConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    // Handle caching configuration changes
    if (oldConfig.enableCaching !== this.config.enableCaching) {
      if (this.config.enableCaching) {
        this.initializeCache();
      } else {
        this.stopCleanupTimer();
        this.cache.clear();
      }
    }
    
    // Restart cleanup timer if interval changed
    if (oldConfig.cacheCleanupInterval !== this.config.cacheCleanupInterval && this.config.enableCaching) {
      this.startCleanupTimer();
    }
    
    console.log('ContextEngine: Configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ContextConfig {
    return { ...this.config };
  }

  /**
   * Get cache metrics
   */
  getCacheMetrics(): CacheMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    this.cache.clear();
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalEntries: 0,
      cacheSize: 0,
      hitRate: 0
    };

    if (this.config.enableCaching) {
      try {
        const project = this.projectService.getCurrentProject();
        if (project) {
          const cacheDir = path.join(project.rootPath, this.config.cacheDirectory);
          if (await this.fileService.exists(cacheDir)) {
            const entries = await this.fileService.readDirectory(cacheDir);
            for (const entry of entries) {
              if (entry.isFile && entry.name.endsWith('.json')) {
                await this.fileService.deleteFile(entry.path);
              }
            }
          }
        }
      } catch (error) {
        console.error('ContextEngine: Error clearing cache directory:', error);
      }
    }

    console.log('ContextEngine: Cache cleared');
  }

  /**
   * Initialize cache system
   */
  private async initializeCache(): Promise<void> {
    try {
      await this.loadCacheFromDisk();
      this.startCleanupTimer();
      console.log('ContextEngine: Cache initialized');
    } catch (error) {
      console.error('ContextEngine: Error initializing cache:', error);
    }
  }

  /**
   * Load cache from disk
   */
  private async loadCacheFromDisk(): Promise<void> {
    const project = this.projectService.getCurrentProject();
    if (!project) return;

    const cacheDir = path.join(project.rootPath, this.config.cacheDirectory);
    
    try {
      if (!(await this.fileService.exists(cacheDir))) {
        return;
      }

      const entries = await this.fileService.readDirectory(cacheDir);
      
      for (const entry of entries) {
        if (entry.isFile && entry.name.endsWith('.json')) {
          try {
            const content = await this.fileService.readFile(entry.path);
            const cacheEntry: CacheEntry = JSON.parse(content);
            
            // Validate cache entry
            if (this.isCacheEntryValid(cacheEntry)) {
              this.cache.set(cacheEntry.key, cacheEntry);
            } else {
              // Remove invalid cache file
              await this.fileService.deleteFile(entry.path);
            }
          } catch (error) {
            console.warn(`ContextEngine: Error loading cache entry ${entry.name}:`, error);
            // Remove corrupted cache file
            try {
              await this.fileService.deleteFile(entry.path);
            } catch (deleteError) {
              console.warn(`ContextEngine: Error deleting corrupted cache file ${entry.name}:`, deleteError);
            }
          }
        }
      }

      console.log(`ContextEngine: Loaded ${this.cache.size} cache entries from disk`);
    } catch (error) {
      console.error('ContextEngine: Error loading cache from disk:', error);
    }
  }

  /**
   * Save cache entry to disk
   */
  private async saveCacheEntryToDisk(entry: CacheEntry): Promise<void> {
    const project = this.projectService.getCurrentProject();
    if (!project) return;

    const cacheDir = path.join(project.rootPath, this.config.cacheDirectory);
    
    try {
      // Ensure cache directory exists
      if (!(await this.fileService.exists(cacheDir))) {
        await this.fileService.createDirectory(cacheDir);
      }

      const fileName = `${entry.key}.json`;
      const filePath = path.join(cacheDir, fileName);
      
      await this.fileService.writeFile(filePath, JSON.stringify(entry, null, 2));
    } catch (error) {
      console.error(`ContextEngine: Error saving cache entry ${entry.key}:`, error);
    }
  }

  /**
   * Remove cache entry from disk
   */
  private async removeCacheEntryFromDisk(key: string): Promise<void> {
    const project = this.projectService.getCurrentProject();
    if (!project) return;

    const cacheDir = path.join(project.rootPath, this.config.cacheDirectory);
    const fileName = `${key}.json`;
    const filePath = path.join(cacheDir, fileName);
    
    try {
      if (await this.fileService.exists(filePath)) {
        await this.fileService.deleteFile(filePath);
      }
    } catch (error) {
      console.error(`ContextEngine: Error removing cache entry ${key}:`, error);
    }
  }

  /**
   * Generate cache key for file
   */
  private generateCacheKey(filePath: string, lastModified: number, fileSize: number): string {
    const data = `${filePath}:${lastModified}:${fileSize}`;
    return crypto.createHash('md5').update(data).digest('hex');
  }

  /**
   * Get cached summary for file
   */
  private async getCachedSummary(filePath: string): Promise<string | null> {
    if (!this.config.enableCaching) return null;

    try {
      const stats = await this.fileService.stat(filePath);
      const key = this.generateCacheKey(filePath, stats.lastModified.getTime(), stats.size);
      
      const entry = this.cache.get(key);
      if (entry) {
        // Update access time
        entry.accessedAt = Date.now();
        this.cache.set(key, entry);
        
        // Save updated entry to disk
        await this.saveCacheEntryToDisk(entry);
        
        this.metrics.hits++;
        console.log(`ContextEngine: Cache hit for ${path.basename(filePath)}`);
        return entry.summary;
      }
      
      this.metrics.misses++;
      return null;
    } catch (error) {
      console.error(`ContextEngine: Error getting cached summary for ${filePath}:`, error);
      return null;
    }
  }

  /**
   * Cache file summary
   */
  private async cacheSummary(filePath: string, summary: string, estimatedTokens: number): Promise<void> {
    if (!this.config.enableCaching) return;

    try {
      const stats = await this.fileService.stat(filePath);
      const key = this.generateCacheKey(filePath, stats.lastModified.getTime(), stats.size);
      
      const entry: CacheEntry = {
        key,
        filePath,
        lastModified: stats.lastModified.getTime(),
        fileSize: stats.size,
        summary,
        estimatedTokens,
        createdAt: Date.now(),
        accessedAt: Date.now()
      };
      
      this.cache.set(key, entry);
      await this.saveCacheEntryToDisk(entry);
      
      console.log(`ContextEngine: Cached summary for ${path.basename(filePath)}`);
    } catch (error) {
      console.error(`ContextEngine: Error caching summary for ${filePath}:`, error);
    }
  }

  /**
   * Validate cache entry
   */
  private isCacheEntryValid(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = now - entry.createdAt;
    
    // Check if entry is too old
    if (age > this.config.cacheMaxAge) {
      return false;
    }
    
    // Check if entry has required fields
    if (!entry.key || !entry.filePath || !entry.summary) {
      return false;
    }
    
    return true;
  }

  /**
   * Start cleanup timer
   */
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleEntries();
    }, this.config.cacheCleanupInterval);
  }

  /**
   * Stop cleanup timer
   */
  private stopCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Clean up stale cache entries
   */
  private async cleanupStaleEntries(): Promise<void> {
    const now = Date.now();
    const keysToRemove: string[] = [];
    
    for (const [key, entry] of this.cache) {
      const age = now - entry.createdAt;
      
      if (age > this.config.cacheMaxAge) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.cache.delete(key);
      await this.removeCacheEntryFromDisk(key);
      this.metrics.evictions++;
    }
    
    if (keysToRemove.length > 0) {
      console.log(`ContextEngine: Cleaned up ${keysToRemove.length} stale cache entries`);
    }
  }

  /**
   * Update cache metrics
   */
  private updateMetrics(): void {
    this.metrics.totalEntries = this.cache.size;
    this.metrics.cacheSize = Array.from(this.cache.values())
      .reduce((total, entry) => total + entry.summary.length, 0);
    
    const totalRequests = this.metrics.hits + this.metrics.misses;
    this.metrics.hitRate = totalRequests > 0 ? this.metrics.hits / totalRequests : 0;
  }

  /**
   * Invalidate cache for file
   */
  async invalidateCache(filePath: string): Promise<void> {
    if (!this.config.enableCaching) return;

    const keysToRemove: string[] = [];
    
    for (const [key, entry] of this.cache) {
      if (entry.filePath === filePath) {
        keysToRemove.push(key);
      }
    }
    
    for (const key of keysToRemove) {
      this.cache.delete(key);
      await this.removeCacheEntryFromDisk(key);
    }
    
    if (keysToRemove.length > 0) {
      console.log(`ContextEngine: Invalidated cache for ${path.basename(filePath)}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    this.stopCleanupTimer();
    console.log('ContextEngine: Cleanup completed');
  }
}