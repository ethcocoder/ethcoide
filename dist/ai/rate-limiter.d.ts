/**
 * Rate limiter for API requests with queue management and exponential backoff
 */
export declare class RateLimiter {
    private queue;
    private processing;
    private requestCount;
    private windowStart;
    private readonly maxRequestsPerMinute;
    private readonly windowSizeMs;
    private readonly baseDelayMs;
    private readonly maxDelayMs;
    private consecutiveErrors;
    constructor(maxRequestsPerMinute?: number);
    /**
     * Add a request to the rate-limited queue
     */
    enqueue<T>(requestFn: () => Promise<T>): Promise<T>;
    private processQueue;
    private delay;
    /**
     * Get current rate limiter status
     */
    getStatus(): {
        queueLength: number;
        requestCount: number;
        windowTimeRemaining: number;
        consecutiveErrors: number;
        isProcessing: boolean;
    };
    /**
     * Clear the queue and reset state
     */
    reset(): void;
    /**
     * Check if a request can be made immediately
     */
    canMakeRequest(): boolean;
}
//# sourceMappingURL=rate-limiter.d.ts.map