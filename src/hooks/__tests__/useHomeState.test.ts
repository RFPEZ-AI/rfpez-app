// Copyright Mark Skiba, 2025 All rights reserved

import { renderHook, act } from '@testing-library/react';
import { useHomeState } from '../useHomeState';

describe('useHomeState', () => {
  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => useHomeState('test-user', false));

    expect(result.current.isLoading).toBe(false);
    expect(result.current.selectedSessionId).toBeUndefined();
    expect(result.current.currentSessionId).toBeUndefined();
  });

  it('should update isLoading state', () => {
    const { result } = renderHook(() => useHomeState('test-user', false));

    act(() => {
      result.current.setIsLoading(true);
    });

    expect(result.current.isLoading).toBe(true);

    act(() => {
      result.current.setIsLoading(false);
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should update selectedSessionId state', () => {
    const { result } = renderHook(() => useHomeState('test-user', false));
    const testSessionId = 'test-session-123';

    act(() => {
      result.current.setSelectedSessionId(testSessionId);
    });

    expect(result.current.selectedSessionId).toBe(testSessionId);
  });

  it('should update currentSessionId state', () => {
    const { result } = renderHook(() => useHomeState('test-user', false));
    const testSessionId = 'current-session-456';

    act(() => {
      result.current.setCurrentSessionId(testSessionId);
    });

    expect(result.current.currentSessionId).toBe(testSessionId);
  });

  it('should handle multiple state updates correctly', () => {
    const { result } = renderHook(() => useHomeState());

    act(() => {
      result.current.setIsLoading(true);
      result.current.setSelectedSessionId('selected-123');
      result.current.setCurrentSessionId('current-456');
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.selectedSessionId).toBe('selected-123');
    expect(result.current.currentSessionId).toBe('current-456');
  });
});
