// Copyright Mark Skiba, 2025 All rights reserved

// Batch execution system for Claude API function calls

interface BatchedFunction {
  name: string;
  parameters: Record<string, unknown>;
  id: string;
}

interface PromiseHandlers {
  resolve: (value: unknown) => void;
  reject: (reason?: unknown) => void;
}

export class FunctionBatchExecutor {
  private static batchQueue: BatchedFunction[] = [];
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static readonly BATCH_DELAY = 100; // ms
  private static readonly MAX_BATCH_SIZE = 5;
  private static promiseHandlers = new Map<string, PromiseHandlers>();

  /**
   * Add a function to the batch queue
   */
  static queueFunction(name: string, parameters: Record<string, unknown>): Promise<unknown> {
    const id = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return new Promise((resolve, reject) => {
      this.batchQueue.push({
        name,
        parameters,
        id
      });

      // Store resolve/reject for this specific function
      this.promiseHandlers.set(id, { resolve, reject });

      this.scheduleBatchExecution();
    });
  }

  /**
   * Schedule batch execution with debouncing
   */
  private static scheduleBatchExecution() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.BATCH_DELAY);

    // Force execution if batch is at max size
    if (this.batchQueue.length >= this.MAX_BATCH_SIZE) {
      clearTimeout(this.batchTimeout);
      this.executeBatch();
    }
  }

  /**
   * Execute all functions in the current batch
   */
  private static async executeBatch() {
    if (this.batchQueue.length === 0) return;

    const currentBatch = [...this.batchQueue];
    this.batchQueue = [];
    this.batchTimeout = null;

    console.log(`📦 Executing batch of ${currentBatch.length} functions:`, 
      currentBatch.map(f => f.name));

    try {
      // Execute all functions in parallel
      const results = await Promise.allSettled(
        currentBatch.map(async (func) => {
          try {
            const { claudeAPIHandler } = await import('../services/claudeAPIFunctions');
            const result = await claudeAPIHandler.executeFunction(func.name, func.parameters);
            return { id: func.id, success: true, result };
          } catch (error) {
            return { 
              id: func.id, 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error' 
            };
          }
        })
      );

      // Resolve/reject individual promises
      results.forEach((result, index) => {
        const func = currentBatch[index];
        const handlers = this.promiseHandlers.get(func.id);

        if (result.status === 'fulfilled') {
          const funcResult = result.value;
          if (funcResult.success) {
            handlers?.resolve(funcResult.result);
          } else {
            handlers?.reject(new Error(funcResult.error));
          }
        } else {
          handlers?.reject(result.reason);
        }

        // Cleanup
        this.promiseHandlers.delete(func.id);
      });

    } catch (error) {
      // Reject all functions in batch
      currentBatch.forEach(func => {
        const handlers = this.promiseHandlers.get(func.id);
        handlers?.reject(error);
        this.promiseHandlers.delete(func.id);
      });
    }
  }

  /**
   * Check if a function should be batched (vs executed immediately)
   */
  static shouldBatch(functionName: string): boolean {
    const batchableFunctions = [
      'supabase_select',
      'supabase_update',
      'validate_form_data',
      'store_message',
      'get_form_submission'
    ];

    return batchableFunctions.includes(functionName);
  }

  /**
   * Clear the batch queue (for testing or reset)
   */
  static clearQueue() {
    this.batchQueue = [];
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }
  }
}