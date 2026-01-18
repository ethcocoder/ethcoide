"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
/**
 * Rate limiter for API requests with queue management and exponential backoff
 */
class RateLimiter {
    constructor(maxRequestsPerMinute = 60) {
        this.queue = [];
        this.processing = false;
        this.requestCount = 0;
        this.windowStart = Date.now();
        this.windowSizeMs = 60 * 1000; // 1 minute
        this.baseDelayMs = 1000; // 1 second
        this.maxDelayMs = 30 * 1000; // 30 seconds
        this.consecutiveErrors = 0;
        this.maxRequestsPerMinute = maxRequestsPerMinute;
    }
    /**
     * Add a request to the rate-limited queue
     */
    async enqueue(requestFn) {
        return new Promise((resolve, reject) => {
            this.queue.push(async () => {
                try {
                    const result = await requestFn();
                    this.consecutiveErrors = 0; // Reset error count on success
                    resolve(result);
                }
                catch (error) {
                    this.consecutiveErrors++;
                    reject(error);
                }
            });
            this.processQueue();
        });
    }
    async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.queue.length > 0) {
            // Check if we need to reset the rate limiting window
            const now = Date.now();
            if (now - this.windowStart >= this.windowSizeMs) {
                this.requestCount = 0;
                this.windowStart = now;
            }
            // Check if we've exceeded the rate limit
            if (this.requestCount >= this.maxRequestsPerMinute) {
                const waitTime = this.windowSizeMs - (now - this.windowStart);
                console.log(`Rate limit reached. Waiting ${waitTime}ms before next request.`);
                await this.delay(waitTime);
                this.requestCount = 0;
                this.windowStart = Date.now();
            }
            // Apply exponential backoff if there have been consecutive errors
            if (this.consecutiveErrors > 0) {
                const backoffDelay = Math.min(this.baseDelayMs * Math.pow(2, this.consecutiveErrors - 1), this.maxDelayMs);
                console.log(`Applying exponential backoff: ${backoffDelay}ms (${this.consecutiveErrors} consecutive errors)`);
                await this.delay(backoffDelay);
            }
            const request = this.queue.shift();
            if (request) {
                this.requestCount++;
                await request();
            }
        }
        this.processing = false;
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    /**
     * Get current rate limiter status
     */
    getStatus() {
        const now = Date.now();
        const windowTimeRemaining = Math.max(0, this.windowSizeMs - (now - this.windowStart));
        return {
            queueLength: this.queue.length,
            requestCount: this.requestCount,
            windowTimeRemaining,
            consecutiveErrors: this.consecutiveErrors,
            isProcessing: this.processing
        };
    }
    /**
     * Clear the queue and reset state
     */
    reset() {
        this.queue = [];
        this.processing = false;
        this.requestCount = 0;
        this.windowStart = Date.now();
        this.consecutiveErrors = 0;
    }
    /**
     * Check if a request can be made immediately
     */
    canMakeRequest() {
        const now = Date.now();
        // Reset window if needed
        if (now - this.windowStart >= this.windowSizeMs) {
            return true;
        }
        return this.requestCount < this.maxRequestsPerMinute;
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map