// Copyright Mark Skiba, 2025 All rights reserved

// Base class for function handlers with common functionality
import { supabase } from '../supabaseClient';
import { logger } from '../utils/logger';
import { AppErrorHandler, ErrorType } from '../utils/errorHandler';

export abstract class BaseFunctionHandler {
  protected async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw AppErrorHandler.createError(
        ErrorType.AUTHENTICATION,
        'User not authenticated',
        'Please sign in to continue.',
        { retryable: false }
      );
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    
    if (!profile?.id) {
      throw AppErrorHandler.createError(
        ErrorType.DATABASE,
        'User profile not found',
        'User profile error. Please contact support.',
        { retryable: false }
      );
    }
    
    return profile.id;
  }

  protected async executeQuery<T>(
    operation: () => Promise<{ data: T; error: unknown }>,
    errorMessage: string,
    context?: Record<string, unknown>
  ): Promise<T> {
    try {
      const { data, error } = await operation();
      
      if (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown database error';
        logger.error(`Database error: ${errorMessage}`, error as Error, context);
        throw AppErrorHandler.createError(
          ErrorType.DATABASE,
          `${errorMessage}: ${errorMsg}`,
          'Database error. Please try again.',
          { retryable: true, context }
        );
      }
      
      return data;
    } catch (error) {
      if (error && typeof error === 'object' && 'type' in error) {
        throw error; // Re-throw AppErrors
      }
      
      logger.error(`Unexpected error in ${errorMessage}`, error as Error, context);
      throw AppErrorHandler.createError(
        ErrorType.DATABASE,
        `${errorMessage}: ${(error as Error).message}`,
        'An unexpected error occurred. Please try again.',
        { retryable: true, context }
      );
    }
  }

  protected validateRequiredParams(params: Record<string, unknown>, required: string[]): void {
    const missing = required.filter(param => !params[param]);
    if (missing.length > 0) {
      throw AppErrorHandler.createError(
        ErrorType.VALIDATION,
        `Missing required parameters: ${missing.join(', ')}`,
        'Invalid request. Please check your input.',
        { retryable: false, context: { missing, provided: Object.keys(params) } }
      );
    }
  }

  // Template method for function execution
  protected async executeFunction<T>(
    functionName: string,
    params: Record<string, unknown>,
    userId: string,
    handler: (params: Record<string, unknown>, userId: string) => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      logger.info(`Executing function: ${functionName}`, {
        component: 'BaseFunctionHandler',
        function: functionName,
        userId,
        params: this.sanitizeParams(params)
      });

      const result = await handler(params, userId);
      const executionTime = Date.now() - startTime;

      logger.info(`Function executed successfully: ${functionName}`, {
        component: 'BaseFunctionHandler',
        function: functionName,
        executionTime,
        resultSize: JSON.stringify(result).length
      });

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      
      logger.error(`Function execution failed: ${functionName}`, error as Error, {
        component: 'BaseFunctionHandler',
        function: functionName,
        executionTime,
        userId
      });

      throw error;
    }
  }

  private sanitizeParams(params: Record<string, unknown>): Record<string, unknown> {
    // Remove sensitive data from logs
    const sanitized = { ...params };
    if (sanitized.password) sanitized.password = '[REDACTED]';
    if (sanitized.api_key) sanitized.api_key = '[REDACTED]';
    return sanitized;
  }
}
