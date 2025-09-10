// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonAlert, IonToast } from '@ionic/react';

export interface APIError {
  message: string;
  type: 'rate_limit' | 'network' | 'auth' | 'quota' | 'server' | 'unknown';
  retryable: boolean;
  suggestion?: string;
}

interface APIErrorHandlerProps {
  error: APIError | null;
  onDismiss: () => void;
  onRetry?: () => void;
  showAsAlert?: boolean; // Show as alert dialog vs toast
}

const APIErrorHandler: React.FC<APIErrorHandlerProps> = ({ 
  error, 
  onDismiss, 
  onRetry, 
  showAsAlert = false 
}) => {
  if (!error) return null;

  const getErrorDetails = (error: APIError) => {
    switch (error.type) {
      case 'rate_limit':
        return {
          header: 'Rate Limit Reached',
          icon: '⏰',
          color: 'warning' as const,
          suggestion: error.suggestion || 'Please wait a moment before trying again. The API is temporarily busy.'
        };
      case 'network':
        return {
          header: 'Connection Issue',
          icon: '🌐',
          color: 'danger' as const,
          suggestion: error.suggestion || 'Please check your internet connection and try again.'
        };
      case 'auth':
        return {
          header: 'Authentication Error',
          icon: '🔐',
          color: 'danger' as const,
          suggestion: error.suggestion || 'There seems to be an issue with your API credentials.'
        };
      case 'quota':
        return {
          header: 'Usage Limit Exceeded',
          icon: '📊',
          color: 'warning' as const,
          suggestion: error.suggestion || 'Your API usage quota has been exceeded. Please check your account.'
        };
      case 'server':
        return {
          header: 'Service Temporarily Unavailable',
          icon: '⚠️',
          color: 'medium' as const,
          suggestion: error.suggestion || 'The API service is temporarily unavailable. Please try again in a few moments.'
        };
      default:
        return {
          header: 'Unexpected Error',
          icon: '❌',
          color: 'danger' as const,
          suggestion: error.suggestion || 'An unexpected error occurred. Please try again.'
        };
    }
  };

  const errorDetails = getErrorDetails(error);

  if (showAsAlert) {
    return (
      <IonAlert
        isOpen={true}
        onDidDismiss={onDismiss}
        header={errorDetails.header}
        message={`${error.message}\n\n${errorDetails.suggestion}`}
        buttons={[
          {
            text: 'OK',
            handler: onDismiss
          },
          ...(error.retryable && onRetry ? [{
            text: 'Retry',
            handler: onRetry
          }] : [])
        ]}
      />
    );
  }

  return (
    <IonToast
      isOpen={true}
      onDidDismiss={onDismiss}
      message={`${errorDetails.icon} ${error.message}`}
      duration={error.retryable ? 5000 : 3000}
      color={errorDetails.color}
      position="top"
      buttons={error.retryable && onRetry ? [
        {
          text: 'Retry',
          handler: onRetry
        },
        {
          text: 'Dismiss',
          role: 'cancel',
          handler: onDismiss
        }
      ] : [
        {
          text: 'Dismiss',
          role: 'cancel',
          handler: onDismiss
        }
      ]}
    />
  );
};

/**
 * Utility function to categorize errors
 */
export const categorizeError = (error: Error | any): APIError => {
  const message = error.message || error.toString();
  const messageLower = message.toLowerCase();

  if (messageLower.includes('rate limit') || messageLower.includes('too many requests')) {
    return {
      message,
      type: 'rate_limit',
      retryable: true,
      suggestion: 'The API is receiving too many requests. Please wait a moment before trying again.'
    };
  }

  if (messageLower.includes('network') || messageLower.includes('timeout') || messageLower.includes('connection')) {
    return {
      message,
      type: 'network',
      retryable: true,
      suggestion: 'Please check your internet connection and try again.'
    };
  }

  if (messageLower.includes('authentication') || messageLower.includes('api key') || messageLower.includes('unauthorized')) {
    return {
      message,
      type: 'auth',
      retryable: false,
      suggestion: 'Please check your API configuration in the settings.'
    };
  }

  if (messageLower.includes('quota') || messageLower.includes('usage') || messageLower.includes('billing')) {
    return {
      message,
      type: 'quota',
      retryable: false,
      suggestion: 'Please check your account billing or upgrade your plan.'
    };
  }

  if (messageLower.includes('temporarily unavailable') || messageLower.includes('service unavailable') || error.status >= 500) {
    return {
      message,
      type: 'server',
      retryable: true,
      suggestion: 'The service is temporarily unavailable. Please try again in a few moments.'
    };
  }

  return {
    message,
    type: 'unknown',
    retryable: true,
    suggestion: 'An unexpected error occurred. Please try again.'
  };
};

export default APIErrorHandler;
