// Copyright Mark Skiba, 2025 All rights reserved

// API retry utility for handling rate limits and transient errors

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number; // Base delay in milliseconds
  maxDelay?: number; // Maximum delay in milliseconds
  backoffFactor?: number; // Exponential backoff multiplier
  retryableStatusCodes?: number[];
  onRetry?: (attempt: number, error: unknown) => void;
}

interface RateLimitInfo {
  remaining: number;
  resetTime: number; // Unix timestamp
  limit: number;
}

export class APIRetryHandler {
  private static rateLimitInfo: RateLimitInfo | null = null;
  private static requestQueue: Array<() => Promise<unknown>> = [];
  private static isProcessingQueue = false;

  /**
   * Execute an API call with retry logic and rate limit handling
   */
  static async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryableStatusCodes = [429, 500, 502, 503, 504],
      onRetry
    } = options;

    // Check rate limit before making the call
    if (this.rateLimitInfo && this.rateLimitInfo.remaining <= 0) {
      const waitTime = Math.max(0, this.rateLimitInfo.resetTime - Date.now());
      if (waitTime > 0) {
        console.log(`⏰ Rate limit reached. Waiting ${Math.ceil(waitTime / 1000)}s before retry...`);
        await this.delay(waitTime);
      }
    }

    let lastError: unknown;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const result = await apiCall();
        
        // Reset rate limit info on successful call
        this.rateLimitInfo = null;
        
        return result;
      } catch (error: unknown) {
        lastError = error;

        // Extract rate limit information from error
        this.extractRateLimitInfo(error);

        // Check if error is retryable
        const isRetryable = this.isRetryableError(error, retryableStatusCodes);
        
        if (!isRetryable || attempt >= maxRetries) {
          console.error(`❌ API call failed after ${attempt + 1} attempts:`, error);
          throw this.enhanceError(error);
        }

        // Calculate delay with exponential backoff
        const delay = this.calculateDelay(attempt, baseDelay, maxDelay, backoffFactor, error);
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        const statusCode = typeof error === 'object' && error !== null && 'status' in error 
          ? (error as { status: number }).status 
          : undefined;
        
        console.warn(`⚠️ API call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delay}ms...`, {
          error: errorMessage,
          statusCode
        });

        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await this.delay(delay);
      }
    }

    throw lastError;
  }

  /**
   * Queue API calls to respect rate limits
   */
  static async queueRequest<T>(apiCall: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          const result = await this.executeWithRetry(apiCall);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });

      this.processQueue();
    });
  }

  private static async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error('Queued request failed:', error);
        }

        // Add small delay between requests to avoid hitting rate limits
        await this.delay(100);
      }
    }

    this.isProcessingQueue = false;
  }

  private static extractRateLimitInfo(error: unknown): void {
    const hasStatus = typeof error === 'object' && error !== null && 'status' in error;
    const status = hasStatus ? (error as { status: number }).status : 0;
    const hasMessage = error instanceof Error;
    const message = hasMessage ? error.message : '';
    
    if (status === 429 || message.includes('rate limit')) {
      // Try to extract rate limit info from headers if available
      const hasHeaders = typeof error === 'object' && error !== null && 'headers' in error;
      const headers = hasHeaders ? (error as { headers: Record<string, unknown> }).headers : {};
      
      this.rateLimitInfo = {
        remaining: 0,
        resetTime: Date.now() + 60000, // Default to 1 minute if no reset time available
        limit: typeof headers['x-ratelimit-limit'] === 'string' 
          ? parseInt(headers['x-ratelimit-limit']) || 0 
          : 0
      };

      // Extract reset time if available
      const resetTimeHeader = headers['x-ratelimit-reset'];
      if (typeof resetTimeHeader === 'string') {
        this.rateLimitInfo.resetTime = parseInt(resetTimeHeader) * 1000; // Convert to milliseconds
      }

      console.log('📊 Rate limit info extracted:', this.rateLimitInfo);
    }
  }

  private static isRetryableError(error: unknown, retryableStatusCodes: number[]): boolean {
    // Check status code
    const hasStatus = typeof error === 'object' && error !== null && 'status' in error;
    const status = hasStatus ? (error as { status: number }).status : 0;
    if (status && retryableStatusCodes.includes(status)) {
      return true;
    }

    // Check error message for rate limiting
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('rate limit') || message.includes('too many requests')) {
      return true;
    }

    // Check for overloaded errors (should be retryable with longer delays)
    if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
      return true;
    }

    // Check for structured overloaded errors
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = (error as { error: { type?: string; message?: string } }).error;
      if (apiError && typeof apiError === 'object' && 'type' in apiError && apiError.type === 'overloaded_error') {
        return true;
      }
    }

    // Check for network errors
    if (message.includes('network') || message.includes('timeout') || message.includes('connection')) {
      return true;
    }

    return false;
  }

  private static calculateDelay(
    attempt: number,
    baseDelay: number,
    maxDelay: number,
    backoffFactor: number,
    error: unknown
  ): number {
    // For rate limit errors, use a longer delay
    const hasStatus = typeof error === 'object' && error !== null && 'status' in error;
    const status = hasStatus ? (error as { status: number }).status : 0;
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    
    if (status === 429 || message.includes('rate limit')) {
      const rateLimitDelay = this.rateLimitInfo?.resetTime 
        ? Math.max(0, this.rateLimitInfo.resetTime - Date.now())
        : 60000; // Default to 1 minute

      return Math.min(rateLimitDelay, maxDelay);
    }

    // For overloaded errors, use longer delays to avoid making the problem worse
    if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
      // Progressive delays for overload: 5s, 15s, 30s
      const overloadDelays = [5000, 15000, 30000];
      const delayIndex = Math.min(attempt, overloadDelays.length - 1);
      return overloadDelays[delayIndex];
    }

    // Check for structured overloaded errors
    if (error && typeof error === 'object' && 'error' in error) {
      const apiError = (error as { error: { type?: string; message?: string } }).error;
      if (apiError && typeof apiError === 'object' && 'type' in apiError && apiError.type === 'overloaded_error') {
        const overloadDelays = [5000, 15000, 30000];
        const delayIndex = Math.min(attempt, overloadDelays.length - 1);
        return overloadDelays[delayIndex];
      }
    }

    // Standard exponential backoff
    const delay = baseDelay * Math.pow(backoffFactor, attempt);
    
    // Add jitter to avoid thundering herd
    const jitter = Math.random() * 0.1 * delay;
    
    return Math.min(delay + jitter, maxDelay);
  }

  private static enhanceError(error: unknown): Error {
    if (error instanceof Error) {
      // Check if it's a rate limit error and enhance the message
      const hasStatus = typeof error === 'object' && error !== null && 'status' in error;
      const status = hasStatus ? (error as { status: number }).status : 0;
      const message = error.message.toLowerCase();
      
      if (status === 429) {
        const waitTime = this.rateLimitInfo?.resetTime 
          ? Math.ceil((this.rateLimitInfo.resetTime - Date.now()) / 1000)
          : 60;

        return new Error(
          `Rate limit exceeded. Please wait ${waitTime} seconds before trying again. ` +
          `Consider reducing the frequency of API calls or implementing request queuing.`
        );
      }

      if (message.includes('rate limit')) {
        return new Error(
          'Rate limit exceeded. The API is receiving too many requests. ' +
          'Please wait a moment before trying again.'
        );
      }

      // Check for overloaded errors
      if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
        return new Error(
          'Claude API is currently experiencing high demand and is overloaded. ' +
          'The system is automatically retrying with longer delays. Please be patient.'
        );
      }

      return error;
    }
    
    // Convert unknown error to Error instance
    return new Error(String(error));
  }

  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current rate limit status
   */
  static getRateLimitStatus(): RateLimitInfo | null {
    return this.rateLimitInfo;
  }

  /**
   * Reset rate limit info (useful for testing or manual reset)
   */
  static resetRateLimitInfo(): void {
    this.rateLimitInfo = null;
  }
}
