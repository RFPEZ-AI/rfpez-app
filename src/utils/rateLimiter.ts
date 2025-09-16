// Copyright Mark Skiba, 2025 All rights reserved

// Rate limiter for Claude API calls to prevent hitting rate limits

export class RateLimiter {
  private static requestTimes: number[] = [];
  private static readonly MAX_REQUESTS_PER_MINUTE = 50; // Conservative limit
  private static readonly TIME_WINDOW = 60000; // 1 minute

  /**
   * Check if we can make a request without hitting rate limits
   */
  static canMakeRequest(): boolean {
    const now = Date.now();
    
    // Remove requests older than the time window
    this.requestTimes = this.requestTimes.filter(time => now - time < this.TIME_WINDOW);
    
    // Check if we're under the limit
    return this.requestTimes.length < this.MAX_REQUESTS_PER_MINUTE;
  }

  /**
   * Record a request timestamp
   */
  static recordRequest(): void {
    this.requestTimes.push(Date.now());
  }

  /**
   * Get time until next request is allowed (in milliseconds)
   */
  static getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) {
      return 0;
    }

    const now = Date.now();
    const oldestRequest = Math.min(...this.requestTimes);
    return this.TIME_WINDOW - (now - oldestRequest);
  }

  /**
   * Wait if necessary before making a request
   */
  static async waitIfNeeded(): Promise<void> {
    const waitTime = this.getTimeUntilNextRequest();
    if (waitTime > 0) {
      console.log(`⏰ Rate limiter: Waiting ${Math.ceil(waitTime / 1000)}s before next request...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  /**
   * Get current rate limit status
   */
  static getStatus(): { 
    requestsInWindow: number; 
    maxRequests: number; 
    timeUntilReset: number;
    canMakeRequest: boolean;
  } {
    const now = Date.now();
    this.requestTimes = this.requestTimes.filter(time => now - time < this.TIME_WINDOW);
    
    const oldestRequest = this.requestTimes.length > 0 ? Math.min(...this.requestTimes) : now;
    
    return {
      requestsInWindow: this.requestTimes.length,
      maxRequests: this.MAX_REQUESTS_PER_MINUTE,
      timeUntilReset: Math.max(0, this.TIME_WINDOW - (now - oldestRequest)),
      canMakeRequest: this.canMakeRequest()
    };
  }
}