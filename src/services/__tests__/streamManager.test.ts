// Copyright Mark Skiba, 2025 All rights reserved

import { streamManager } from '../claudeAPIProxy';

describe('Stream Manager Tests', () => {
  beforeEach(() => {
    // Clean up any existing streams
    streamManager.abortAllStreams();
  });

  afterEach(() => {
    streamManager.abortAllStreams();
  });

  describe('Stream Management', () => {
    it('should track active streams correctly', () => {
      expect(streamManager.getActiveStreamCount()).toBe(0);
      
      const stream1 = streamManager.createManagedStream('test-1');
      expect(streamManager.getActiveStreamCount()).toBe(1);
      expect(stream1).toBeInstanceOf(AbortController);
      
      const stream2 = streamManager.createManagedStream('test-2');
      expect(streamManager.getActiveStreamCount()).toBe(2);
      
      streamManager.abortStream('test-1');
      expect(streamManager.getActiveStreamCount()).toBe(1);
      
      streamManager.abortAllStreams();
      expect(streamManager.getActiveStreamCount()).toBe(0);
    });

    it('should abort individual streams correctly', () => {
      const stream1 = streamManager.createManagedStream('test-1');
      const stream2 = streamManager.createManagedStream('test-2');
      
      expect(streamManager.getActiveStreamCount()).toBe(2);
      
      const aborted = streamManager.abortStream('test-1');
      expect(aborted).toBe(true);
      expect(streamManager.getActiveStreamCount()).toBe(1);
      
      // Try to abort non-existent stream
      const notFound = streamManager.abortStream('non-existent');
      expect(notFound).toBe(false);
      expect(streamManager.getActiveStreamCount()).toBe(1);
    });

    it('should abort all streams correctly', () => {
      streamManager.createManagedStream('test-1');
      streamManager.createManagedStream('test-2');
      streamManager.createManagedStream('test-3');
      
      expect(streamManager.getActiveStreamCount()).toBe(3);
      
      streamManager.abortAllStreams();
      expect(streamManager.getActiveStreamCount()).toBe(0);
    });

    it('should provide streaming health metrics', () => {
      const health = streamManager.getStreamingHealthMetrics();
      
      expect(health).toHaveProperty('activeStreams');
      expect(health).toHaveProperty('maxConcurrentStreams');
      expect(health).toHaveProperty('streamIds');
      expect(health).toHaveProperty('healthStatus');
      expect(health).toHaveProperty('lastCleanup');
      
      expect(typeof health.activeStreams).toBe('number');
      expect(typeof health.maxConcurrentStreams).toBe('number');
      expect(Array.isArray(health.streamIds)).toBe(true);
      expect(['healthy', 'overloaded'].includes(health.healthStatus)).toBe(true);
    });

    it('should replace existing streams with same ID', () => {
      const stream1 = streamManager.createManagedStream('test-1');
      expect(streamManager.getActiveStreamCount()).toBe(1);
      
      // Create another stream with same ID - should replace the first one
      const stream2 = streamManager.createManagedStream('test-1');
      expect(streamManager.getActiveStreamCount()).toBe(1);
      
      // The streams should be different instances
      expect(stream1).not.toBe(stream2);
    });

    it('should handle health status based on stream count', () => {
      // Test healthy status
      streamManager.createManagedStream('test-health-1');
      let health = streamManager.getStreamingHealthMetrics();
      expect(health.healthStatus).toBe('healthy');
      
      // Clean slate for overload test
      streamManager.abortAllStreams();
      
      // Test overloaded status (create 12 streams - reaches 80% of maxPoolSize 15)
      // At 80% threshold, connection reuse kicks in so we get exactly 12 connections
      for (let i = 0; i < 12; i++) {
        streamManager.createManagedStream(`overload-test-${i}`);
      }
      
      health = streamManager.getStreamingHealthMetrics();
      expect(health.healthStatus).toBe('overloaded');
      expect(health.activeStreams).toBe(12);
    });
  });

  describe('Retry Logic', () => {
    it('should retry operations with exponential backoff', async () => {
      let attempts = 0;
      const testOperation = () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve('success');
      };

      const result = await streamManager.retryWithBackoff(testOperation, 'test operation');
      
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should not retry aborted operations', async () => {
      let attempts = 0;
      const testOperation = () => {
        attempts++;
        const error = new Error('Operation aborted');
        error.name = 'AbortError';
        throw error;
      };

      await expect(
        streamManager.retryWithBackoff(testOperation, 'aborted operation')
      ).rejects.toThrow('Operation aborted');
      
      expect(attempts).toBe(1); // Should not retry
    });

    it('should fail after maximum retry attempts', async () => {
      let attempts = 0;
      const testOperation = () => {
        attempts++;
        throw new Error('Persistent failure');
      };

      await expect(
        streamManager.retryWithBackoff(testOperation, 'failing operation')
      ).rejects.toThrow('Persistent failure');
      
      expect(attempts).toBe(3); // Should attempt 3 times
    });
  });

  describe('Stream Lifecycle', () => {
    it('should handle stream timeout and cleanup', (done) => {
      const stream = streamManager.createManagedStream('timeout-test');
      expect(streamManager.getActiveStreamCount()).toBe(1);
      
      // Check that stream is still active immediately
      expect(stream.signal.aborted).toBe(false);
      
      // For testing, we'll verify the stream exists and can be manually cleaned up
      setTimeout(() => {
        streamManager.abortStream('timeout-test');
        expect(streamManager.getActiveStreamCount()).toBe(0);
        done();
      }, 100);
    });

    it('should provide correct stream IDs in health metrics', () => {
      streamManager.createManagedStream('stream-a');
      streamManager.createManagedStream('stream-b');
      streamManager.createManagedStream('stream-c');
      
      const health = streamManager.getStreamingHealthMetrics();
      
      expect(health.streamIds).toContain('stream-a');
      expect(health.streamIds).toContain('stream-b');
      expect(health.streamIds).toContain('stream-c');
      expect(health.streamIds.length).toBe(3);
    });
  });

  describe('AbortController Integration', () => {
    it('should create proper AbortController instances', () => {
      const stream = streamManager.createManagedStream('controller-test');
      
      expect(stream).toBeInstanceOf(AbortController);
      expect(stream.signal).toBeDefined();
      expect(stream.signal.aborted).toBe(false);
      
      stream.abort();
      expect(stream.signal.aborted).toBe(true);
    });

    it('should handle signal abort events', (done) => {
      const stream = streamManager.createManagedStream('abort-test');
      
      stream.signal.addEventListener('abort', () => {
        expect(stream.signal.aborted).toBe(true);
        done();
      });
      
      stream.abort();
    });
  });
});