/**
 * Rate limiter for API requests with queue management and exponential backoff
 */
export class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private requestCount = 0;
  private windowStart = Date.now();
  private readonly maxRequestsPerMinute: number;
  private readonly windowSizeMs = 60 * 1000; // 1 minute
  private readonly baseDelayMs = 1000; // 1 second
  private readonly maxDelayMs = 30 * 1000; // 30 seconds
  private consecutiveErrors = 0;

  constructor(maxRequestsPerMinute: number = 60) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
  }

  /**
   * Add a request to the rate-limited queue
   */
  async enqueue<T>(requestFn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await requestFn();
          this.consecutiveErrors = 0; // Reset error count on success
          resolve(result);
        } catch (error) {
          this.consecutiveErrors++;
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private async processQueue(): Promise<void> {
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
        const backoffDelay = Math.min(
          this.baseDelayMs * Math.pow(2, this.consecutiveErrors - 1),
          this.maxDelayMs
        );
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limiter status
   */
  getStatus(): {
    queueLength: number;
    requestCount: number;
    windowTimeRemaining: number;
    consecutiveErrors: number;
    isProcessing: boolean;
  } {
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
  reset(): void {
    this.queue = [];
    this.processing = false;
    this.requestCount = 0;
    this.windowStart = Date.now();
    this.consecutiveErrors = 0;
  }

  /**
   * Check if a request can be made immediately
   */
  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Reset window if needed
    if (now - this.windowStart >= this.windowSizeMs) {
      return true;
    }

    return this.requestCount < this.maxRequestsPerMinute;
  }
}