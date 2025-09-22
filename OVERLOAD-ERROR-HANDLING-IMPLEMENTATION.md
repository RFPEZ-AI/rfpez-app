# Claude API Overloaded Error Handling Implementation

## Overview
Enhanced the RFPEZ.AI application to properly handle "overloaded_error" responses from the Claude API during both streaming and non-streaming operations.

## Problem Addressed
The user encountered console errors during streaming tests:
```
Claude API Error: APIError: overloaded_error
```

This was happening when the Claude API servers were experiencing high demand, but the application wasn't providing user-friendly error messages or appropriate retry behavior.

## Changes Implemented

### 1. Enhanced ClaudeService Error Handling (`src/services/claudeService.ts`)

#### Added string-based detection:
```typescript
// Check for overloaded_error specifically
if (error.message.includes('overloaded_error')) {
  throw new Error('Claude API is currently overloaded. Please wait a moment and try again.');
}
```

#### Added structured error response handling:
```typescript
// Check for structured error responses from Claude API
if (error && typeof error === 'object' && 'error' in error) {
  const apiError = (error as { error: any }).error;
  if (apiError && typeof apiError === 'object' && 'type' in apiError) {
    if (apiError.type === 'overloaded_error') {
      throw new Error('Claude API is currently experiencing high demand. Please wait a moment and try again.');
    }
  }
}
```

### 2. Enhanced APIErrorHandler Type System (`src/components/APIErrorHandler.tsx`)

#### Added new error type:
```typescript
export interface APIError {
  message: string;
  type: 'rate_limit' | 'network' | 'auth' | 'quota' | 'server' | 'overloaded' | 'unknown';
  retryable: boolean;
  suggestion?: string;
}
```

#### Added overloaded error UI details:
```typescript
case 'overloaded':
  return {
    header: 'Service Overloaded',
    icon: '🚫',
    color: 'warning' as const,
    suggestion: error.suggestion || 'The API is currently experiencing high demand. Please wait a moment and try again.'
  };
```

#### Enhanced error categorization:
```typescript
if (messageLower.includes('overloaded') || messageLower.includes('overloaded_error') || messageLower.includes('high demand')) {
  return {
    message,
    type: 'overloaded',
    retryable: true,
    suggestion: 'The Claude API is currently experiencing high demand. Please wait a moment and try again.'
  };
}
```

### 3. Enhanced APIRetryHandler (`src/utils/apiRetry.ts`)

#### Made overloaded errors retryable:
```typescript
// Check for overloaded errors (should be retryable with longer delays)
if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
  return true;
}

// Check for structured overloaded errors
if (error && typeof error === 'object' && 'error' in error) {
  const apiError = (error as { error: any }).error;
  if (apiError && typeof apiError === 'object' && 'type' in apiError && apiError.type === 'overloaded_error') {
    return true;
  }
}
```

#### Added specialized retry delays:
```typescript
// For overloaded errors, use longer delays to avoid making the problem worse
if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
  // Progressive delays for overload: 5s, 15s, 30s
  const overloadDelays = [5000, 15000, 30000];
  const delayIndex = Math.min(attempt, overloadDelays.length - 1);
  return overloadDelays[delayIndex];
}
```

#### Enhanced error messaging:
```typescript
// Check for overloaded errors
if (message.includes('overloaded') || message.includes('overloaded_error') || message.includes('high demand')) {
  return new Error(
    'Claude API is currently experiencing high demand and is overloaded. ' +
    'The system is automatically retrying with longer delays. Please be patient.'
  );
}
```

## Benefits

### 1. User Experience
- **Clear Error Messages**: Users now see friendly messages instead of raw API errors
- **Visual Feedback**: Toast notifications with appropriate icons and colors
- **Retry Guidance**: Clear indication that the system is retrying automatically

### 2. System Resilience
- **Intelligent Retry Logic**: Longer delays for overload scenarios (5s, 15s, 30s) prevent overwhelming the API
- **Structured Error Detection**: Handles both string-based and JSON-structured error responses
- **Graceful Degradation**: System continues working even when API is under stress

### 3. Developer Experience
- **Comprehensive Error Types**: New TypeScript types for better error handling
- **Consistent Error Handling**: Same logic works for both streaming and non-streaming requests
- **Debugging Support**: Detailed console logging for troubleshooting

## Retry Strategy for Overload Errors

| Attempt | Delay | Rationale |
|---------|--------|-----------|
| 1st | 5 seconds | Quick retry in case it was a momentary spike |
| 2nd | 15 seconds | Allow time for load to decrease |
| 3rd+ | 30 seconds | Conservative retry to avoid contributing to overload |

This strategy is more aggressive than standard exponential backoff for overload scenarios because:
- It avoids contributing to the overload problem
- It provides reasonable wait times for users
- It caps at 30 seconds to prevent excessive delays

## Testing

Created comprehensive test suites to verify:
- ✅ String-based overload error detection
- ✅ Structured API error detection  
- ✅ Error categorization accuracy
- ✅ Retry delay patterns
- ✅ TypeScript compilation
- ✅ User message quality

## Compatibility

- **Streaming Responses**: Works with the new streaming implementation
- **Non-Streaming Responses**: Works with traditional request/response pattern
- **Existing Error Types**: All existing error handling continues to work
- **TypeScript**: Full type safety maintained

## Future Enhancements

1. **Telemetry**: Could add metrics to track overload frequency
2. **Adaptive Delays**: Could adjust retry delays based on server response headers
3. **Circuit Breaker**: Could implement circuit breaker pattern for extreme overload scenarios
4. **User Notification**: Could add system-wide notifications for extended outages

## Files Modified

1. `src/services/claudeService.ts` - Core API service with error detection
2. `src/components/APIErrorHandler.tsx` - Error categorization and UI
3. `src/utils/apiRetry.ts` - Retry logic and delay calculation
4. `temp/test-*.js` - Test files (can be removed after verification)

## Impact

- **Zero Breaking Changes**: All existing functionality preserved
- **Improved Reliability**: Better handling of API overload scenarios
- **Enhanced UX**: Users get clear feedback and automatic recovery
- **Maintainable**: Clean TypeScript implementation with proper types