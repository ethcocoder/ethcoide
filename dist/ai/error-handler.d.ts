/**
 * Error handling utilities for AI API operations
 */
export declare enum AIErrorType {
    AUTHENTICATION = "authentication",
    RATE_LIMIT = "rate_limit",
    QUOTA_EXCEEDED = "quota_exceeded",
    NETWORK = "network",
    TIMEOUT = "timeout",
    INVALID_REQUEST = "invalid_request",
    SERVER_ERROR = "server_error",
    UNKNOWN = "unknown"
}
export declare class AIError extends Error {
    readonly type: AIErrorType;
    readonly originalError?: Error | undefined;
    readonly retryable: boolean;
    readonly suggestedAction?: string | undefined;
    constructor(message: string, type: AIErrorType, originalError?: Error | undefined, retryable?: boolean, suggestedAction?: string | undefined);
}
export declare class AIErrorHandler {
    /**
     * Classify and wrap an error from the AI API
     */
    static handleError(error: any): AIError;
    /**
     * Get user-friendly error message with suggested actions
     */
    static getUserFriendlyMessage(error: AIError): string;
    /**
     * Check if an error should trigger offline mode
     */
    static shouldEnableOfflineMode(error: AIError): boolean;
    /**
     * Get retry delay based on error type
     */
    static getRetryDelay(error: AIError, attemptNumber: number): number;
}
//# sourceMappingURL=error-handler.d.ts.map