// Copyright Mark Skiba, 2025 All rights reserved

import { useState, useCallback } from 'react';
import { APIError, categorizeError } from '../components/APIErrorHandler';

interface UseAPIErrorHandlerReturn {
  error: APIError | null;
  showError: (error: Error | any) => void;
  clearError: () => void;
  retryFunction: (() => void) | null;
  setRetryFunction: (fn: (() => void) | null) => void;
}

export const useAPIErrorHandler = (): UseAPIErrorHandlerReturn => {
  const [error, setError] = useState<APIError | null>(null);
  const [retryFunction, setRetryFunction] = useState<(() => void) | null>(null);

  const showError = useCallback((errorInput: Error | any) => {
    const categorizedError = categorizeError(errorInput);
    setError(categorizedError);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setRetryFunction(null);
  }, []);

  const handleSetRetryFunction = useCallback((fn: (() => void) | null) => {
    setRetryFunction(() => fn); // Wrap in function to store correctly
  }, []);

  return {
    error,
    showError,
    clearError,
    retryFunction,
    setRetryFunction: handleSetRetryFunction
  };
};

export default useAPIErrorHandler;
