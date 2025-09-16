// Copyright Mark Skiba, 2025 All rights reserved

// Response caching system for Claude API calls

interface CacheEntry {
  key: string;
  response: unknown;
  timestamp: number;
  expiresAt: number;
  agentId: string;
  contextHash: string;
}

interface CacheOptions {
  ttlMs?: number;
  skipCache?: boolean;
  includeAgent?: boolean;
  includeContext?: boolean;
}

export class ClaudeResponseCache {
  private static cache = new Map<string, CacheEntry>();
  private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_CACHE_SIZE = 100;

  /**
   * Generate cache key for a request
   */
  static generateCacheKey(
    userMessage: string,
    agentId: string,
    contextHash: string,
    includeAgent = true,
    includeContext = true
  ): string {
    const messageHash = this.hashString(userMessage.toLowerCase().trim());
    const parts = [messageHash];
    
    if (includeAgent) parts.push(agentId);
    if (includeContext) parts.push(contextHash);
    
    return parts.join('|');
  }

  /**
   * Get cached response if available and valid
   */
  static getCachedResponse(
    userMessage: string,
    agentId: string,
    contextHash: string,
    options: CacheOptions = {}
  ): unknown | null {
    
    if (options.skipCache) return null;

    const key = this.generateCacheKey(
      userMessage, 
      agentId, 
      contextHash,
      options.includeAgent,
      options.includeContext
    );

    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    console.log('📦 Cache hit for:', userMessage.substring(0, 50) + '...');
    return entry.response;
  }

  /**
   * Cache a response
   */
  static cacheResponse(
    userMessage: string,
    agentId: string,
    contextHash: string,
    response: unknown,
    options: CacheOptions = {}
  ): void {
    
    if (options.skipCache) return;

    const key = this.generateCacheKey(
      userMessage, 
      agentId, 
      contextHash,
      options.includeAgent,
      options.includeContext
    );

    const ttl = options.ttlMs || this.DEFAULT_TTL;
    const now = Date.now();

    const entry: CacheEntry = {
      key,
      response,
      timestamp: now,
      expiresAt: now + ttl,
      agentId,
      contextHash
    };

    // Ensure cache doesn't grow too large
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    console.log('💾 Cached response for:', userMessage.substring(0, 50) + '...');
  }

  /**
   * Check if a message should be cached
   */
  static shouldCache(userMessage: string, agentId: string): boolean {
    const message = userMessage.toLowerCase().trim();

    // Don't cache unique/timestamped messages
    if (message.includes('timestamp') || 
        message.includes(new Date().toDateString().toLowerCase()) ||
        message.includes('session')) {
      return false;
    }

    // Don't cache very short messages
    if (message.length < 10) {
      return false;
    }

    // Don't cache form submissions with dynamic data
    if (message.includes('submitted') && message.includes('form')) {
      return false;
    }

    // Cache information requests and static queries
    if (message.includes('what') || 
        message.includes('how') || 
        message.includes('explain') ||
        message.includes('help') ||
        message.includes('describe')) {
      return true;
    }

    return false;
  }

  /**
   * Generate context hash from RFP and user context
   */
  static generateContextHash(
    currentRfp: { id: number; name: string } | null,
    userProfile: { id?: string; role?: string } | null
  ): string {
    const contextParts = [
      currentRfp?.id?.toString() || 'no-rfp',
      currentRfp?.name?.substring(0, 20) || '',
      userProfile?.role || 'anonymous'
    ];

    return this.hashString(contextParts.join('|'));
  }

  /**
   * Simple hash function for strings
   */
  private static hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Remove oldest cache entries
   */
  private static evictOldest(): void {
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Clear expired entries
   */
  static clearExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`🧹 Cleared ${expiredKeys.length} expired cache entries`);
    }
  }

  /**
   * Clear all cache entries
   */
  static clearAll(): void {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }

  /**
   * Get cache statistics
   */
  static getStats() {
    const now = Date.now();
    const entries = Array.from(this.cache.values());
    
    return {
      totalEntries: entries.length,
      validEntries: entries.filter(e => now <= e.expiresAt).length,
      expiredEntries: entries.filter(e => now > e.expiresAt).length,
      oldestEntry: entries.length > 0 ? Math.min(...entries.map(e => e.timestamp)) : null,
      newestEntry: entries.length > 0 ? Math.max(...entries.map(e => e.timestamp)) : null,
      cacheSize: this.cache.size
    };
  }
}