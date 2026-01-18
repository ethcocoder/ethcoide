/**
 * Error handling utilities for AI API operations
 */

export enum AIErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK = 'network',
  TIMEOUT = 'timeout',
  INVALID_REQUEST = 'invalid_request',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown'
}

export class AIError extends Error {
  constructor(
    message: string,
    public readonly type: AIErrorType,
    public readonly originalError?: Error,
    public readonly retryable: boolean = false,
    public readonly suggestedAction?: string
  ) {
    super(message);
    this.name = 'AIError';
  }
}

export class AIErrorHandler {
  /**
   * Classify and wrap an error from the AI API
   */
  static handleError(error: any): AIError {
    const errorMessage = error?.message?.toLowerCase() || '';
    const errorCode = error?.code || error?.status;

    // Authentication errors
    if (errorMessage.includes('api key') || 
        errorMessage.includes('authentication') ||
        errorMessage.includes('unauthorized') ||
        errorCode === 401) {
      return new AIError(
        'Invalid or missing API key. Please check your Gemini API key configuration.',
        AIErrorType.AUTHENTICATION,
        error,
        false,
        'Please verify your API key in the settings and ensure it has the necessary permissions.'
      );
    }

    // Rate limiting errors
    if (errorMessage.includes('rate limit') ||
        errorMessage.includes('too many requests') ||
        errorCode === 429) {
      return new AIError(
        'Rate limit exceeded. Please wait before making more requests.',
        AIErrorType.RATE_LIMIT,
        error,
        true,
        'The request will be automatically retried. Consider reducing the frequency of API calls.'
      );
    }

    // Quota exceeded errors
    if (errorMessage.includes('quota') ||
        errorMessage.includes('billing') ||
        errorMessage.includes('limit exceeded')) {
      return new AIError(
        'API quota exceeded. Please check your billing and usage limits.',
        AIErrorType.QUOTA_EXCEEDED,
        error,
        false,
        'Check your Google Cloud Console for billing information and increase your quota if needed.'
      );
    }

    // Network errors
    if (errorMessage.includes('network') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('fetch') ||
        errorCode === 'NETWORK_ERROR') {
      return new AIError(
        'Network error occurred. Please check your internet connection.',
        AIErrorType.NETWORK,
        error,
        true,
        'Check your internet connection and try again. The request will be automatically retried.'
      );
    }

    // Timeout errors
    if (errorMessage.includes('timeout') ||
        errorMessage.includes('timed out') ||
        errorCode === 'TIMEOUT') {
      return new AIError(
        'Request timed out. The AI service may be experiencing high load.',
        AIErrorType.TIMEOUT,
        error,
        true,
        'The request will be automatically retried. If the problem persists, try again later.'
      );
    }

    // Invalid request errors
    if (errorMessage.includes('invalid') ||
        errorMessage.includes('bad request') ||
        errorCode === 400) {
      return new AIError(
        'Invalid request format or parameters.',
        AIErrorType.INVALID_REQUEST,
        error,
        false,
        'Please check the request parameters and try again with valid input.'
      );
    }

    // Server errors
    if (errorCode >= 500 && errorCode < 600 ||
        errorMessage.includes('server error') ||
        errorMessage.includes('internal error')) {
      return new AIError(
        'AI service is temporarily unavailable. Please try again later.',
        AIErrorType.SERVER_ERROR,
        error,
        true,
        'The AI service is experiencing issues. The request will be automatically retried.'
      );
    }

    // Unknown errors
    return new AIError(
      `Unexpected error occurred: ${error?.message || 'Unknown error'}`,
      AIErrorType.UNKNOWN,
      error,
      false,
      'Please try again. If the problem persists, check your API configuration.'
    );
  }

  /**
   * Get user-friendly error message with suggested actions
   */
  static getUserFriendlyMessage(error: AIError): string {
    let message = error.message;
    
    if (error.suggestedAction) {
      message += `\n\nSuggested action: ${error.suggestedAction}`;
    }

    if (error.retryable) {
      message += '\n\nThis request will be automatically retried.';
    }

    return message;
  }

  /**
   * Check if an error should trigger offline mode
   */
  static shouldEnableOfflineMode(error: AIError): boolean {
    return error.type === AIErrorType.NETWORK ||
           error.type === AIErrorType.AUTHENTICATION ||
           error.type === AIErrorType.QUOTA_EXCEEDED;
  }

  /**
   * Get retry delay based on error type
   */
  static getRetryDelay(error: AIError, attemptNumber: number): number {
    const baseDelay = 1000; // 1 second
    const maxDelay = 30000; // 30 seconds

    switch (error.type) {
      case AIErrorType.RATE_LIMIT:
        // Longer delay for rate limit errors
        return Math.min(baseDelay * Math.pow(2, attemptNumber) * 2, maxDelay);
      
      case AIErrorType.SERVER_ERROR:
      case AIErrorType.TIMEOUT:
        // Standard exponential backoff
        return Math.min(baseDelay * Math.pow(2, attemptNumber), maxDelay);
      
      case AIErrorType.NETWORK:
        // Shorter delay for network errors
        return Math.min(baseDelay * attemptNumber, maxDelay / 2);
      
      default:
        return baseDelay;
    }
  }
}