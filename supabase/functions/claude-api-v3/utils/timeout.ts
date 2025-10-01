// Copyright Mark Skiba, 2025 All rights reserved
// Database timeout utilities for Claude API v3

// Database timeout utility - wraps database operations with timeout
export function withDatabaseTimeout<T>(operation: Promise<T>, timeoutMs: number = 25000): Promise<T> {
  return Promise.race([
    operation,
    new Promise<T>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Database operation timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    })
  ]);
}

// Database operation wrapper with automatic timeout
export function dbQuery<T>(queryOperation: () => Promise<T>, operationName: string = 'Unknown'): Promise<T> {
  console.log(`🔍 DB QUERY START: ${operationName} at ${new Date().toISOString()}`);
  
  return withDatabaseTimeout(queryOperation(), 25000)
    .then(result => {
      console.log(`✅ DB QUERY SUCCESS: ${operationName} at ${new Date().toISOString()}`);
      return result;
    })
    .catch(error => {
      console.error(`❌ DB QUERY ERROR: ${operationName} at ${new Date().toISOString()}:`, error);
      throw error;
    });
}