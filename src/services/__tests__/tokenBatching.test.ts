// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-non-null-assertion */
import { streamManager } from '../claudeAPIProxy';

// Mock console methods for cleaner test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  
  // Clean up any existing batches
  streamManager.cleanupBatches();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  
  // Clean up batches after each test
  streamManager.cleanupBatches();
});

describe('Token Batching', () => {
  const testStreamId = 'test-stream-123';

  describe('Basic Batching', () => {
    it('should accumulate tokens in a batch', () => {
      streamManager.addTokenToBatch(testStreamId, 'Hello', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, ' world', { tokenCount: 2 });
      
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
      expect(stats[testStreamId].tokenCount).toBe(2);
      expect(stats[testStreamId].length).toBe(11); // "Hello world".length
    });

    it('should flush batch when minimum size is reached', () => {
      // Add tokens below minimum flush size
      streamManager.addTokenToBatch(testStreamId, 'A', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, 'B', { tokenCount: 2 });
      streamManager.addTokenToBatch(testStreamId, 'C', { tokenCount: 3 });
      streamManager.addTokenToBatch(testStreamId, 'D', { tokenCount: 4 });
      
      // Should not flush yet (minFlushSize is 5)
      const beforeFlush = streamManager.getBatchedTokens(testStreamId);
      expect(beforeFlush).toBeNull();
      
      // Add one more token to reach minimum
      streamManager.addTokenToBatch(testStreamId, 'E', { tokenCount: 5 });
      
      // Should flush now
      const afterFlush = streamManager.getBatchedTokens(testStreamId);
      expect(afterFlush).not.toBeNull();
      expect(afterFlush!.tokens).toEqual(['A', 'B', 'C', 'D', 'E']);
    });

    it('should flush batch when maximum size is reached', () => {
      // Add tokens up to max batch size (50)
      for (let i = 0; i < 50; i++) {
        streamManager.addTokenToBatch(testStreamId, `T${i}`, { tokenCount: i + 1 });
      }
      
      // Should have flushed automatically due to max size
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeUndefined(); // Batch should be flushed and removed
    });
  });

  describe('Priority Keywords', () => {
    it('should flush immediately on priority keywords', () => {
      streamManager.addTokenToBatch(testStreamId, 'Processing', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, 'data', { tokenCount: 2 });
      
      // Should not flush yet
      let stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
      
      // Add priority keyword - should trigger immediate flush
      streamManager.addTokenToBatch(testStreamId, 'ERROR occurred', { tokenCount: 3 });
      
      // Batch should be flushed and removed
      stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeUndefined();
    });

    it('should handle multiple priority keywords', () => {
      const priorityKeywords = ['ERROR', 'URGENT', 'COMPLETE', 'FAILED', 'SUCCESS'];
      
      for (const keyword of priorityKeywords) {
        const streamId = `test-${keyword}`;
        streamManager.addTokenToBatch(streamId, 'Some', { tokenCount: 1 });
        streamManager.addTokenToBatch(streamId, keyword, { tokenCount: 2 });
        
        // Should flush immediately
        const stats = streamManager.getBatchStatistics();
        expect(stats[streamId]).toBeUndefined();
      }
    });
  });

  describe('Timing Control', () => {
    it('should flush batch after timeout interval', async () => {
      // Update config for faster testing
      streamManager.updateBatchConfig({ flushIntervalMs: 50 });
      
      streamManager.addTokenToBatch(testStreamId, 'Hello', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, ' world', { tokenCount: 2 });
      
      // Should not flush immediately (below minFlushSize)
      let stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
      
      // Wait for timeout
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should be flushed by timer
      stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeUndefined();
    });

    it('should reset timer when new tokens are added', async () => {
      streamManager.updateBatchConfig({ flushIntervalMs: 100 });
      
      streamManager.addTokenToBatch(testStreamId, 'A', { tokenCount: 1 });
      
      // Wait partially through interval
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Add another token (should reset timer)
      streamManager.addTokenToBatch(testStreamId, 'B', { tokenCount: 2 });
      
      // Wait the original interval time (should not flush yet)
      await new Promise(resolve => setTimeout(resolve, 60));
      
      // Should still be in batch (timer was reset)
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
    });
  });

  describe('Force Flush', () => {
    it('should force flush batch regardless of size', () => {
      streamManager.addTokenToBatch(testStreamId, 'A', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, 'B', { tokenCount: 2 });
      
      // Force flush even though below minimum
      const result = streamManager.getBatchedTokens(testStreamId, true);
      expect(result).not.toBeNull();
      expect(result!.tokens).toEqual(['A', 'B']);
      
      // Batch should be removed
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeUndefined();
    });

    it('should return null for non-existent batch', () => {
      const result = streamManager.getBatchedTokens('non-existent', true);
      expect(result).toBeNull();
    });
  });

  describe('Batch Configuration', () => {
    it('should update batch configuration', () => {
      const newConfig = {
        maxBatchSize: 100,
        flushIntervalMs: 200,
        minFlushSize: 10,
      };
      
      streamManager.updateBatchConfig(newConfig);
      
      // Test that new config is applied
      for (let i = 0; i < 99; i++) {
        streamManager.addTokenToBatch(testStreamId, `T${i}`, { tokenCount: i + 1 });
      }
      
      // Should not flush yet (maxBatchSize is now 100)
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
      expect(stats[testStreamId].tokenCount).toBe(99);
    });
  });

  describe('Batch Statistics', () => {
    it('should provide accurate batch statistics', () => {
      Date.now(); // Time tracking for test metrics
      
      streamManager.addTokenToBatch(testStreamId, 'Hello', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, ' world!', { tokenCount: 2 });
      
      const stats = streamManager.getBatchStatistics();
      const batchStats = stats[testStreamId];
      
      expect(batchStats).toBeDefined();
      expect(batchStats.tokenCount).toBe(2);
      expect(batchStats.length).toBe(12); // "Hello world!".length
      expect(batchStats.age).toBeGreaterThanOrEqual(0);
      expect(batchStats.age).toBeLessThan(100); // Should be very recent
    });

    it('should handle multiple concurrent batches', () => {
      const streamIds = ['stream1', 'stream2', 'stream3'];
      
      streamIds.forEach((streamId, index) => {
        for (let i = 0; i < index + 2; i++) {
          streamManager.addTokenToBatch(streamId, `token${i}`, { tokenCount: i + 1 });
        }
      });
      
      const stats = streamManager.getBatchStatistics();
      
      expect(Object.keys(stats)).toHaveLength(3);
      expect(stats['stream1'].tokenCount).toBe(2);
      expect(stats['stream2'].tokenCount).toBe(3);
      expect(stats['stream3'].tokenCount).toBe(4);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup specific stream batch', () => {
      streamManager.addTokenToBatch(testStreamId, 'Hello', { tokenCount: 1 });
      streamManager.addTokenToBatch('other-stream', 'World', { tokenCount: 1 });
      
      let stats = streamManager.getBatchStatistics();
      expect(Object.keys(stats)).toHaveLength(2);
      
      streamManager.cleanupBatches(testStreamId);
      
      stats = streamManager.getBatchStatistics();
      expect(Object.keys(stats)).toHaveLength(1);
      expect(stats['other-stream']).toBeDefined();
      expect(stats[testStreamId]).toBeUndefined();
    });

    it('should cleanup all batches', () => {
      streamManager.addTokenToBatch('stream1', 'Hello', { tokenCount: 1 });
      streamManager.addTokenToBatch('stream2', 'World', { tokenCount: 1 });
      streamManager.addTokenToBatch('stream3', 'Test', { tokenCount: 1 });
      
      let stats = streamManager.getBatchStatistics();
      expect(Object.keys(stats)).toHaveLength(3);
      
      streamManager.cleanupBatches();
      
      stats = streamManager.getBatchStatistics();
      expect(Object.keys(stats)).toHaveLength(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tokens', () => {
      streamManager.addTokenToBatch(testStreamId, '', { tokenCount: 1 });
      streamManager.addTokenToBatch(testStreamId, '', { tokenCount: 2 });
      
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId]).toBeDefined();
      expect(stats[testStreamId].tokenCount).toBe(2);
      expect(stats[testStreamId].length).toBe(0);
    });

    it('should handle very long tokens', () => {
      const longToken = 'A'.repeat(10000);
      streamManager.addTokenToBatch(testStreamId, longToken, { tokenCount: 1 });
      
      const stats = streamManager.getBatchStatistics();
      expect(stats[testStreamId].length).toBe(10000);
    });

    it('should handle rapid token addition', () => {
      // Add many tokens quickly
      for (let i = 0; i < 1000; i++) {
        streamManager.addTokenToBatch(testStreamId, `T${i}`, { tokenCount: i + 1 });
      }
      
      // Should have been automatically flushed multiple times
      const stats = streamManager.getBatchStatistics();
      // Some tokens might still be in batch, but not all 1000
      const remainingTokens = stats[testStreamId]?.tokenCount || 0;
      expect(remainingTokens).toBeLessThan(100);
    });

    it('should handle concurrent stream operations', () => {
      const streamIds = Array.from({ length: 10 }, (_, i) => `concurrent-stream-${i}`);
      
      // Add tokens to multiple streams concurrently
      streamIds.forEach(streamId => {
        for (let i = 0; i < 20; i++) {
          streamManager.addTokenToBatch(streamId, `token-${i}`, { tokenCount: i + 1 });
        }
      });
      
      const stats = streamManager.getBatchStatistics();
      
      // Some batches might have been flushed, but system should remain stable
      expect(Object.keys(stats).length).toBeLessThanOrEqual(10);
      
      // Clean up all streams
      streamIds.forEach(streamId => streamManager.cleanupBatches(streamId));
    });
  });
});

describe('Integration with Streaming', () => {
  it('should integrate properly with batch statistics tracking', () => {
    const integrationStreamId = 'integration-test-stream';
    
    // Test that batch statistics work with realistic streaming scenario
    const chunks = [
      'The', ' quick', ' brown', ' fox', ' jumps',
      ' over', ' the', ' lazy', ' dog', '.'
    ];
    
    chunks.forEach((chunk, index) => {
      streamManager.addTokenToBatch(integrationStreamId, chunk, {
        tokenCount: index + 1,
        timestamp: Date.now(),
      });
    });
    
    // Force flush to get all tokens
    const result = streamManager.getBatchedTokens(integrationStreamId, true);
    expect(result).not.toBeNull();
    expect(result!.tokens.join('')).toBe('The quick brown fox jumps over the lazy dog.');
    expect(result!.metadata).toHaveLength(10);
  });
});