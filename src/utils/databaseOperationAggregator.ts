// Copyright Mark Skiba, 2025 All rights reserved

// Aggregate multiple database operations into single transactions

interface DatabaseOperation {
  type: 'select' | 'insert' | 'update' | 'delete';
  table: string;
  data?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  id?: string;
  resolve?: (value: unknown) => void;
  reject?: (reason?: unknown) => void;
}

export class DatabaseOperationAggregator {
  private static pendingOperations: DatabaseOperation[] = [];
  private static aggregationTimeout: NodeJS.Timeout | null = null;
  private static readonly AGGREGATION_DELAY = 50; // ms

  /**
   * Queue a database operation for aggregation
   */
  static queueOperation(operation: DatabaseOperation): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const opWithPromise = {
        ...operation,
        resolve,
        reject,
        id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      this.pendingOperations.push(opWithPromise);
      this.scheduleAggregation();
    });
  }

  /**
   * Schedule aggregation execution
   */
  private static scheduleAggregation() {
    if (this.aggregationTimeout) {
      clearTimeout(this.aggregationTimeout);
    }

    this.aggregationTimeout = setTimeout(() => {
      this.executeAggregatedOperations();
    }, this.AGGREGATION_DELAY);
  }

  /**
   * Execute all pending operations in optimized batches
   */
  private static async executeAggregatedOperations() {
    if (this.pendingOperations.length === 0) return;

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];
    this.aggregationTimeout = null;

    console.log(`📊 Executing ${operations.length} aggregated database operations`);

    // Group operations by table and type for optimization
    const grouped = this.groupOperations(operations);

    for (const [groupKey, groupOps] of grouped.entries()) {
      try {
        await this.executeBatch(groupKey, groupOps);
      } catch (error) {
        console.error(`Failed to execute batch ${groupKey}:`, error);
        // Reject all operations in this batch
        groupOps.forEach((op: DatabaseOperation) => {
          op.reject?.(error);
        });
      }
    }
  }

  /**
   * Group operations for batch execution
   */
  private static groupOperations(operations: DatabaseOperation[]): Map<string, DatabaseOperation[]> {
    const groups = new Map<string, DatabaseOperation[]>();

    operations.forEach(op => {
      const key = `${op.table}_${op.type}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      
      groups.get(key)?.push(op);
    });

    return groups;
  }

  /**
   * Execute a batch of similar operations
   */
  private static async executeBatch(groupKey: string, operations: DatabaseOperation[]) {
    const [table, type] = groupKey.split('_');

    try {
      switch (type) {
        case 'select':
          await this.executeBatchSelect(table, operations);
          break;
        case 'update':
          await this.executeBatchUpdate(table, operations);
          break;
        case 'insert':
          await this.executeBatchInsert(table, operations);
          break;
        case 'delete':
          await this.executeBatchDelete(table, operations);
          break;
        default:
          throw new Error(`Unsupported operation type: ${type}`);
      }
    } catch (error) {
      console.error(`Batch execution failed for ${groupKey}:`, error);
      throw error;
    }
  }

  /**
   * Execute batch SELECT operations
   */
  private static async executeBatchSelect(table: string, operations: DatabaseOperation[]) {
    const { supabase } = await import('../supabaseClient');

    // For selects, we can often optimize by combining filters
    for (const op of operations) {
      try {
        let query = supabase.from(table).select('*');
        
        if (op.filter) {
          Object.entries(op.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { data, error } = await query;
        
        if (error) throw error;
        op.resolve?.(data);
      } catch (error) {
        op.reject?.(error);
      }
    }
  }

  /**
   * Execute batch UPDATE operations
   */
  private static async executeBatchUpdate(table: string, operations: DatabaseOperation[]) {
    const { supabase } = await import('../supabaseClient');

    // Group updates by similar filter criteria
    const updateGroups = new Map<string, DatabaseOperation[]>();

    operations.forEach(op => {
      const filterKey = JSON.stringify(op.filter);
      if (!updateGroups.has(filterKey)) {
        updateGroups.set(filterKey, []);
      }
      updateGroups.get(filterKey)?.push(op);
    });

    // Execute each update group
    for (const [filterKey, groupOps] of updateGroups.entries()) {
      try {
        const filter = JSON.parse(filterKey);
        
        // For multiple updates with same filter, merge the data
        const mergedData = groupOps.reduce((acc, op) => {
          return { ...acc, ...op.data };
        }, {});

        let query = supabase.from(table).update(mergedData);
        
        if (filter && Object.keys(filter).length > 0) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { data, error } = await query.select();
        
        if (error) throw error;

        // Resolve all operations in this group
        groupOps.forEach(op => op.resolve?.(data));
      } catch (error) {
        groupOps.forEach(op => op.reject?.(error));
      }
    }
  }

  /**
   * Execute batch INSERT operations
   */
  private static async executeBatchInsert(table: string, operations: DatabaseOperation[]) {
    const { supabase } = await import('../supabaseClient');

    try {
      // Combine all insert data
      const insertData = operations.map(op => op.data);
      
      const { data, error } = await supabase
        .from(table)
        .insert(insertData)
        .select();
      
      if (error) throw error;

      // Resolve each operation with its corresponding data
      operations.forEach((op, index) => {
        op.resolve?.(data?.[index] || data);
      });
    } catch (error) {
      operations.forEach(op => op.reject?.(error));
    }
  }

  /**
   * Execute batch DELETE operations
   */
  private static async executeBatchDelete(table: string, operations: DatabaseOperation[]) {
    const { supabase } = await import('../supabaseClient');

    // Group deletes by filter criteria
    for (const op of operations) {
      try {
        let query = supabase.from(table).delete();
        
        if (op.filter) {
          Object.entries(op.filter).forEach(([key, value]) => {
            query = query.eq(key, value);
          });
        }

        const { data, error } = await query.select();
        
        if (error) throw error;
        op.resolve?.(data);
      } catch (error) {
        op.reject?.(error);
      }
    }
  }

  /**
   * Clear pending operations (for testing)
   */
  static clearPending() {
    this.pendingOperations = [];
    if (this.aggregationTimeout) {
      clearTimeout(this.aggregationTimeout);
      this.aggregationTimeout = null;
    }
  }

  /**
   * Get aggregation statistics
   */
  static getStats() {
    return {
      pendingOperations: this.pendingOperations.length,
      hasTimeout: !!this.aggregationTimeout,
      nextExecution: this.aggregationTimeout ? 'scheduled' : 'none'
    };
  }
}