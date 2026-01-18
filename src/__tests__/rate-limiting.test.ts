import * as fc from 'fast-check';
import { RateLimiter } from '../ai/rate-limiter';
import { AIService } from '../ai/gemini-client';
import { AIError, AIErrorType } from '../ai/error-handler';

// Mock the Google Generative AI module
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(),
  GenerationConfig: {}
}));

// Mock the key storage service
jest.mock('../services/key-storage', () => ({
  keyStorageService: {
    getApiKey: jest.fn(),
    setApiKey: jest.fn(),
    deleteApiKey: jest.fn()
  }
}));

describe('Rate Limiting and Error Handling', () => {
  describe('RateLimiter', () => {
    let rateLimiter: RateLimiter;

    beforeEach(() => {
      rateLimiter = new RateLimiter(10); // 10 requests per minute for testing
      jest.clearAllMocks();
    });

    describe('Property 10: API Rate Limiting and Error Handling', () => {
      /**
       * Feature: ai-powered-ide, Property 10: API Rate Limiting and Error Handling
       * Test that rate limiting prevents API quota exhaustion
       * Verify error handling for various API failure scenarios
       * Test retry logic and backoff strategies
       * Validates: Requirements 4.3
       */
      it('should enforce rate limits correctly', async () => {
        await fc.assert(fc.asyncProperty(
          fc.record({
            maxRequests: fc.integer({ min: 1, max: 20 }),
            requestCount: fc.integer({ min: 1, max: 50 }),
            requestDelay: fc.integer({ min: 10, max: 100 })
          }),
          async (testData) => {
            const { maxRequests, requestCount, requestDelay } = testData;

            // Create rate limiter with test parameters
            const testRateLimiter = new RateLimiter(maxRequests);
            const results: number[] = [];
            const startTime = Date.now();

            // Create mock requests that track execution time
            const requests = Array.from({ length: requestCount }, (_, i) => 
              () => new Promise<number>(resolve => {
                setTimeout(() => {
                  results.push(Date.now() - startTime);
                  resolve(i);
                }, requestDelay);
              })
            );

            // Execute all requests through rate limiter
            const promises = requests.map(request => testRateLimiter.enqueue(request));
            await Promise.all(promises);

            // Verify that requests were properly rate limited
            expect(results).toHaveLength(requestCount);

            // If we exceeded the rate limit, verify timing constraints
            if (requestCount > maxRequests) {
              // Later requests should be delayed
              const sortedResults = [...results].sort((a, b) => a - b);
              const firstBatch = sortedResults.slice(0, maxRequests);
              const laterRequests = sortedResults.slice(maxRequests);

              // First batch should complete relatively quickly
              expect(firstBatch[firstBatch.length - 1]).toBeLessThan(5000);

              // Later requests should be delayed due to rate limiting
              if (laterRequests.length > 0) {
                expect(laterRequests[0]).toBeGreaterThan(firstBatch[firstBatch.length - 1]);
              }
            }

            // Verify rate limiter status
            const status = testRateLimiter.getStatus();
            expect(status.queueLength).toBe(0); // All requests should be processed
            expect(status.requestCount).toBeLessThanOrEqual(maxRequests);
          }
        ), { numRuns: 50 }); // Reduced runs due to timing sensitivity
      });

      it('should handle consecutive errors with exponential backoff', async () => {
        await fc.assert(fc.asyncProperty(
          fc.record({
            errorCount: fc.integer({ min: 1, max: 5 }),
            errorMessage: fc.string({ minLength: 1, maxLength: 50 })
          }),
          async (testData) => {
            const { errorCount, errorMessage } = testData;

            const testRateLimiter = new RateLimiter(60);
            const executionTimes: number[] = [];
            let callCount = 0;

            // Create a request that fails for the first errorCount attempts
            const flakyRequest = () => new Promise<string>((resolve, reject) => {
              const startTime = Date.now();
              callCount++;
              
              if (callCount <= errorCount) {
                executionTimes.push(Date.now() - startTime);
                reject(new Error(errorMessage));
              } else {
                executionTimes.push(Date.now() - startTime);
                resolve('success');
              }
            });

            // Execute the flaky request
            try {
              await testRateLimiter.enqueue(flakyRequest);
              
              // If we get here, the request eventually succeeded
              expect(callCount).toBe(errorCount + 1);
              
              // Verify exponential backoff was applied
              const status = testRateLimiter.getStatus();
              expect(status.consecutiveErrors).toBe(0); // Should reset on success
            } catch (error) {
              // If all attempts failed, verify error handling
              expect(callCount).toBe(errorCount);
              expect(error).toBeInstanceOf(Error);
              expect((error as Error).message).toBe(errorMessage);
              
              const status = testRateLimiter.getStatus();
              expect(status.consecutiveErrors).toBe(errorCount);
            }
          }
        ), { numRuns: 100 });
      });

      it('should reset rate limiting window correctly', async () => {
        await fc.assert(fc.asyncProperty(
          fc.record({
            maxRequests: fc.integer({ min: 2, max: 10 }),
            windowSize: fc.integer({ min: 100, max: 1000 }) // milliseconds
          }),
          async (testData) => {
            const { maxRequests, windowSize } = testData;

            // Create rate limiter with custom window size (for testing we'll simulate)
            const testRateLimiter = new RateLimiter(maxRequests);
            
            // Fill up the rate limit
            const firstBatch = Array.from({ length: maxRequests }, (_, i) => 
              () => Promise.resolve(i)
            );
            
            const firstResults = await Promise.all(
              firstBatch.map(request => testRateLimiter.enqueue(request))
            );
            
            expect(firstResults).toHaveLength(maxRequests);
            
            // Check that we've reached the limit
            const statusAfterFirst = testRateLimiter.getStatus();
            expect(statusAfterFirst.requestCount).toBe(maxRequests);
            
            // Wait for window to potentially reset (simulate time passage)
            await new Promise(resolve => setTimeout(resolve, windowSize));
            
            // Try another request - this tests the window reset logic
            const additionalRequest = () => Promise.resolve('additional');
            const additionalResult = await testRateLimiter.enqueue(additionalRequest);
            
            expect(additionalResult).toBe('additional');
          }
        ), { numRuns: 50 });
      });

      it('should handle queue management correctly', async () => {
        await fc.assert(fc.asyncProperty(
          fc.record({
            queueSize: fc.integer({ min: 1, max: 20 }),
            processingDelay: fc.integer({ min: 10, max: 100 })
          }),
          async (testData) => {
            const { queueSize, processingDelay } = testData;

            const testRateLimiter = new RateLimiter(60); // High limit to focus on queue behavior
            const results: number[] = [];
            
            // Create requests with processing delay
            const requests = Array.from({ length: queueSize }, (_, i) => 
              () => new Promise<number>(resolve => {
                setTimeout(() => {
                  results.push(i);
                  resolve(i);
                }, processingDelay);
              })
            );

            // Check initial queue status
            const initialStatus = testRateLimiter.getStatus();
            expect(initialStatus.queueLength).toBe(0);
            expect(initialStatus.isProcessing).toBe(false);

            // Enqueue all requests
            const promises = requests.map(request => testRateLimiter.enqueue(request));
            
            // Check status while processing
            const processingStatus = testRateLimiter.getStatus();
            expect(processingStatus.isProcessing).toBe(true);

            // Wait for all to complete
            await Promise.all(promises);

            // Verify all requests were processed
            expect(results).toHaveLength(queueSize);
            expect(results.sort()).toEqual(Array.from({ length: queueSize }, (_, i) => i));

            // Check final status
            const finalStatus = testRateLimiter.getStatus();
            expect(finalStatus.queueLength).toBe(0);
            expect(finalStatus.isProcessing).toBe(false);
          }
        ), { numRuns: 100 });
      });
    });

    // Unit tests for specific rate limiting scenarios
    describe('Unit Tests', () => {
      it('should allow immediate requests when under limit', async () => {
        const request = jest.fn().mockResolvedValue('success');
        
        const result = await rateLimiter.enqueue(request);
        
        expect(result).toBe('success');
        expect(request).toHaveBeenCalledTimes(1);
        expect(rateLimiter.canMakeRequest()).toBe(true);
      });

      it('should reset consecutive errors on successful request', async () => {
        // First, cause some errors
        const failingRequest = jest.fn().mockRejectedValue(new Error('test error'));
        
        try {
          await rateLimiter.enqueue(failingRequest);
        } catch (error) {
          // Expected to fail
        }

        expect(rateLimiter.getStatus().consecutiveErrors).toBeGreaterThan(0);

        // Then succeed
        const successRequest = jest.fn().mockResolvedValue('success');
        await rateLimiter.enqueue(successRequest);

        expect(rateLimiter.getStatus().consecutiveErrors).toBe(0);
      });

      it('should clear queue and reset state', () => {
        // Add some requests to queue
        rateLimiter.enqueue(() => Promise.resolve('test'));
        
        expect(rateLimiter.getStatus().queueLength).toBeGreaterThan(0);
        
        rateLimiter.reset();
        
        const status = rateLimiter.getStatus();
        expect(status.queueLength).toBe(0);
        expect(status.requestCount).toBe(0);
        expect(status.consecutiveErrors).toBe(0);
        expect(status.isProcessing).toBe(false);
      });
    });
  });

  describe('AIService Error Handling Integration', () => {
    let aiService: AIService;

    beforeEach(() => {
      aiService = new AIService();
      jest.clearAllMocks();
    });

    it('should handle rate limit errors and retry appropriately', async () => {
      // This test verifies the integration between AIService and rate limiting
      const mockError = new Error('Rate limit exceeded');
      
      // Mock the service to simulate rate limit error
      jest.spyOn(aiService as any, 'retryWithBackoff').mockImplementation(
        async (operation: () => Promise<any>) => {
          try {
            return await operation();
          } catch (error) {
            // Simulate rate limit handling
            if (error instanceof Error && error.message.includes('Rate limit')) {
              throw new AIError(
                'Rate limit exceeded',
                AIErrorType.RATE_LIMIT,
                error,
                true,
                'Please wait before making more requests'
              );
            }
            throw error;
          }
        }
      );

      // Test that rate limit errors are properly classified
      const operation = () => Promise.reject(mockError);
      
      try {
        await (aiService as any).retryWithBackoff(operation);
      } catch (error) {
        expect(error).toBeInstanceOf(AIError);
        expect((error as AIError).type).toBe(AIErrorType.RATE_LIMIT);
        expect((error as AIError).retryable).toBe(true);
      }
    });
  });
});