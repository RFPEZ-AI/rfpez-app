// Centralized error handling system
import { logger } from './logger';

export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION', 
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  API = 'API',
  DATABASE = 'DATABASE',
  UNKNOWN = 'UNKNOWN'
}

export interface AppError {
  type: ErrorType;
  message: string;
  userMessage: string;
  code?: string;
  context?: Record<string, any>;
  retryable?: boolean;
}

export class AppErrorHandler {
  static createError(
    type: ErrorType,
    message: string,
    userMessage: string,
    options?: {
      code?: string;
      context?: Record<string, any>;
      retryable?: boolean;
    }
  ): AppError {
    return {
      type,
      message,
      userMessage,
      code: options?.code,
      context: options?.context,
      retryable: options?.retryable ?? false
    };
  }

  static handleError(error: Error | AppError, context?: Record<string, any>): AppError {
    // If it's already an AppError, just log and return
    if ('type' in error) {
      logger.error(`AppError: ${error.message}`, undefined, { ...error.context, ...context });
      return error;
    }

    // Convert generic Error to AppError
    const appError = this.convertToAppError(error);
    logger.error(`Error: ${appError.message}`, error, { ...appError.context, ...context });
    return appError;
  }

  private static convertToAppError(error: Error): AppError {
    // Claude API errors
    if (error.message.includes('API key')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        error.message,
        'Invalid API configuration. Please contact support.',
        { retryable: false }
      );
    }

    if (error.message.includes('rate limit')) {
      return this.createError(
        ErrorType.API,
        error.message,
        'Service is temporarily busy. Please try again in a moment.',
        { retryable: true }
      );
    }

    // Supabase/Auth errors
    if (error.message.includes('not authenticated') || error.message.includes('unauthorized')) {
      return this.createError(
        ErrorType.AUTHENTICATION,
        error.message,
        'Please sign in to continue.',
        { retryable: false }
      );
    }

    // Network errors
    if (error.message.includes('fetch') || error.message.includes('network')) {
      return this.createError(
        ErrorType.NETWORK,
        error.message,
        'Connection error. Please check your internet connection.',
        { retryable: true }
      );
    }

    // Default fallback
    return this.createError(
      ErrorType.UNKNOWN,
      error.message,
      'An unexpected error occurred. Please try again.',
      { retryable: true }
    );
  }
}

// Hook for React components to handle errors consistently
export function useErrorHandler() {
  return {
    handleError: (error: Error | AppError, context?: Record<string, any>) => {
      const appError = AppErrorHandler.handleError(error, context);
      
      // Could integrate with toast notifications, error boundaries, etc.
      return appError;
    }
  };
}
