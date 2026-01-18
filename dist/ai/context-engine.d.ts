import { FileSystemService } from '../services/file-service';
import { ProjectService } from '../services/project-service';
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
    cacheMaxAge: number;
    cacheCleanupInterval: number;
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
    cacheSize: number;
    hitRate: number;
}
/**
 * Context Engine with Hard Limits
 *
 * This engine provides deterministic context collection for AI requests
 * with strict limits to prevent token overflow and ensure consistent behavior.
 */
export declare class ContextEngine {
    private static readonly DEFAULT_CONFIG;
    private fileService;
    private projectService;
    private config;
    private cache;
    private metrics;
    private cleanupTimer;
    constructor(fileService: FileSystemService, projectService: ProjectService, config?: Partial<ContextConfig>);
    /**
     * Collect context for AI request with deterministic file selection
     */
    collectContext(currentFilePath: string, selectedText?: string, cursorLine?: number): Promise<ContextCollection>;
    /**
     * Load a file and create context file with limits
     */
    private loadContextFile;
    /**
     * Find imports in a file
     */
    private findImports;
    /**
     * Resolve import path to actual file path
     */
    private resolveImportPath;
    /**
     * Find related files based on relevance scoring
     */
    private findRelatedFiles;
    /**
     * Calculate relevance score for file content
     */
    private calculateRelevanceScore;
    /**
     * Calculate file relevance score based on relationship to current file
     */
    private calculateFileRelevanceScore;
    /**
     * Check if file should be excluded based on patterns
     */
    private shouldExcludeFile;
    /**
     * Check if context file is already in the collection
     */
    private isDuplicate;
    /**
     * Generate summary for file content
     */
    private generateFileSummary;
    /**
     * Generate context collection summary
     */
    private generateContextSummary;
    /**
     * Update configuration
     */
    updateConfig(newConfig: Partial<ContextConfig>): void;
    /**
     * Get current configuration
     */
    getConfig(): ContextConfig;
    /**
     * Get cache metrics
     */
    getCacheMetrics(): CacheMetrics;
    /**
     * Clear cache
     */
    clearCache(): Promise<void>;
    /**
     * Initialize cache system
     */
    private initializeCache;
    /**
     * Load cache from disk
     */
    private loadCacheFromDisk;
    /**
     * Save cache entry to disk
     */
    private saveCacheEntryToDisk;
    /**
     * Remove cache entry from disk
     */
    private removeCacheEntryFromDisk;
    /**
     * Generate cache key for file
     */
    private generateCacheKey;
    /**
     * Get cached summary for file
     */
    private getCachedSummary;
    /**
     * Cache file summary
     */
    private cacheSummary;
    /**
     * Validate cache entry
     */
    private isCacheEntryValid;
    /**
     * Start cleanup timer
     */
    private startCleanupTimer;
    /**
     * Stop cleanup timer
     */
    private stopCleanupTimer;
    /**
     * Clean up stale cache entries
     */
    private cleanupStaleEntries;
    /**
     * Update cache metrics
     */
    private updateMetrics;
    /**
     * Invalidate cache for file
     */
    invalidateCache(filePath: string): Promise<void>;
    /**
     * Cleanup resources
     */
    cleanup(): Promise<void>;
}
//# sourceMappingURL=context-engine.d.ts.map