# Beta Test Configuration

## Overview

The beta test configuration system allows you to control access levels during development and testing phases. When beta test mode is enabled, all authenticated users are automatically granted full access to premium features, bypassing the billing system.

## Configuration

### Environment Variable

Add this to your `.env.local` file:

```bash
# Beta Test Configuration
# When true, all authenticated users are assumed to have billing setup
REACT_APP_BETA_TEST=true
```

### Configuration Module

The centralized configuration is located at `src/config/betaConfig.ts` and provides these functions:

#### `isBetaTestMode(): boolean`
Check if beta test mode is currently enabled.

```typescript
import { isBetaTestMode } from '../config/betaConfig';

if (isBetaTestMode()) {
  console.log('Running in beta test mode');
}
```

#### `hasFullAccess(isAuthenticated: boolean, hasBillingSetup?: boolean): boolean`
Determine if a user should have full account access.

```typescript
import { hasFullAccess } from '../config/betaConfig';

const canAccessPremiumFeatures = hasFullAccess(isAuthenticated);
```

**Logic:**
- Anonymous users: Always `false`
- Beta test mode ON: All authenticated users get `true`
- Beta test mode OFF: Returns the `hasBillingSetup` parameter value

#### `getUserAccessLevel(isAuthenticated: boolean, hasBillingSetup?: boolean): string`
Get user access level for logging/display purposes.

```typescript
import { getUserAccessLevel } from '../config/betaConfig';

const level = getUserAccessLevel(isAuthenticated);
// Returns: 'anonymous' | 'basic' | 'premium'
```

## Usage Examples

### In React Components

```typescript
import { hasFullAccess } from '../config/betaConfig';

const MyComponent: React.FC = () => {
  const { isAuthenticated } = useSupabase();
  
  return (
    <AgentSelector
      hasProperAccountSetup={hasFullAccess(isAuthenticated)}
      isAuthenticated={isAuthenticated}
      // ... other props
    />
  );
};
```

### In Services

```typescript
import { hasFullAccess, getUserAccessLevel } from '../config/betaConfig';

class MyService {
  async getAccessibleFeatures(userId: string) {
    const isAuthenticated = userId !== 'anonymous';
    const hasAccess = hasFullAccess(isAuthenticated);
    const accessLevel = getUserAccessLevel(isAuthenticated);
    
    console.log(`User ${userId} has ${accessLevel} access`);
    
    return await fetchFeatures(hasAccess);
  }
}
```

## Access Level Matrix

| User Type | Beta Test OFF | Beta Test ON |
|-----------|---------------|--------------|
| Anonymous | Limited access | Limited access |
| Authenticated (no billing) | Basic access | **Premium access** |
| Authenticated (with billing) | Premium access | Premium access |

## Agent Access Rules

With beta test mode enabled:

- **Public agents** (is_restricted=false, is_free=true): Available to everyone including anonymous users
- **Free agents** (is_restricted=true, is_free=true): Available to authenticated users
- **Premium agents** (is_restricted=true, is_free=false): Available to authenticated users (normally requires billing)

## Migration Path

When billing system is implemented:

1. Set `REACT_APP_BETA_TEST=false` in production
2. Update the `hasFullAccess()` function to check actual billing status:

```typescript
export const hasFullAccess = (
  isAuthenticated: boolean,
  hasBillingSetup: boolean = false
): boolean => {
  if (!isAuthenticated) {
    return false;
  }
  
  if (isBetaTestMode()) {
    return true; // Keep beta test mode for development
  }
  
  // Production: Check actual billing status
  return hasBillingSetup;
};
```

3. Pass actual billing status from your billing service:

```typescript
const { hasBillingSetup } = await BillingService.checkUserBilling(userId);
const canAccess = hasFullAccess(isAuthenticated, hasBillingSetup);
```

## Files Modified

- **Configuration**: `src/config/betaConfig.ts` (new)
- **Environment**: `.env.local` (REACT_APP_BETA_TEST added)
- **Frontend**: `src/pages/Home.tsx` (uses `hasFullAccess()`)
- **Backend**: `src/services/claudeAPIFunctions.ts` (uses `hasFullAccess()` and `getUserAccessLevel()`)

## Testing

### Enable Beta Mode
```bash
# In .env.local
REACT_APP_BETA_TEST=true
```
Result: All authenticated users can access premium agents (TMC Tender, etc.)

### Disable Beta Mode
```bash
# In .env.local
REACT_APP_BETA_TEST=false
```
Result: Premium agents locked until billing system implemented

## Notes

- **Anonymous users** always have limited access regardless of beta test mode
- **Beta test mode** is recommended during development and testing
- **Production** should eventually set `REACT_APP_BETA_TEST=false` and implement actual billing checks
- The configuration is centralized in one module for easy maintenance
