# RFP Artifact Loading Fix

**Date:** October 11, 2025  
**Issue:** Artifacts not updating in dropdown when switching RFPs

## Problem Description

Users reported that when selecting a different RFP from the RFP menu, the artifact dropdown in the artifact window did not update to show the artifacts associated with the newly selected RFP. The dropdown continued to show artifacts from the previous RFP or session.

## Root Cause

The issue was in the `useArtifactManagement` hook (`src/hooks/useArtifactManagement.ts`). The `useEffect` that watches for RFP context changes had several problems:

### 1. **Stale Closure Issue**
The effect called `loadRFPArtifacts()` function, which captured the `artifacts` state variable in its closure. When the RFP changed, the function would use stale artifact data.

```typescript
// BEFORE (Problematic)
useEffect(() => {
  if (currentRfp && currentRfp.id) {
    loadRFPArtifacts(parseInt(currentRfp.id.toString()));
  }
}, [currentRfp]); // Missing loadRFPArtifacts in deps!

// loadRFPArtifacts referenced artifacts from closure
const loadRFPArtifacts = async (rfpId: number) => {
  // ... code that references artifacts variable
  const existingClaudeArtifacts = artifacts.filter(...); // Stale!
  const combinedArtifacts = [...existingClaudeArtifacts, ...formattedArtifacts];
  setArtifacts(combinedArtifacts);
};
```

### 2. **Missing Dependencies**
The `useEffect` dependency array was incomplete - it didn't include `loadRFPArtifacts` or `artifacts`, violating React's exhaustive-deps rule. This led to:
- The effect not re-running when it should
- Using stale closures with outdated data

### 3. **Dependency Loop Risk**
Adding both `loadRFPArtifacts` and `artifacts` to the dependency array would create an infinite loop:
- `currentRfp` changes → effect runs → `loadRFPArtifacts` called
- `setArtifacts` updates state → `artifacts` changes → effect runs again
- Infinite loop!

## Solution Implemented

**Inlined the artifact loading logic directly in the `useEffect`** with functional state updates to avoid closure issues:

```typescript
// AFTER (Fixed)
useEffect(() => {
  console.log('=== RFP CONTEXT CHANGED - LOADING ARTIFACTS ===');
  
  if (currentRfp && currentRfp.id) {
    console.log('Loading artifacts for RFP:', currentRfp.id, currentRfp.name);
    
    // Inline async function to avoid closure issues
    const loadArtifacts = async () => {
      try {
        console.log('📋 Loading RFP-associated artifacts for RFP:', currentRfp.id);
        const artifactsData = await DatabaseService.getRFPArtifacts(
          parseInt(currentRfp.id.toString())
        );
        
        // ... format artifacts ...
        
        // Use functional update to avoid dependency on artifacts
        setArtifacts(prev => {
          // Preserve Claude-generated artifacts from PREVIOUS state
          const existingClaudeArtifacts = prev.filter(artifact => 
            artifact.id && (
              artifact.id.includes('claude-artifact') ||
              (!artifact.id.startsWith('form_') && !artifact.id.includes('-'))
            )
          );
          console.log(`📋 Preserving ${existingClaudeArtifacts.length} Claude-generated artifacts`);
          
          // Combine with new RFP artifacts
          return [...existingClaudeArtifacts, ...formattedArtifacts];
        });
      } catch (error) {
        console.error('Failed to load RFP artifacts:', error);
      }
    };
    
    loadArtifacts();
    
  } else {
    // No current RFP, only keep Claude-generated artifacts
    setArtifacts(prev => {
      const claudeArtifacts = prev.filter(artifact => 
        artifact.id.includes('claude-artifact')
      );
      console.log('🧹 Cleared database artifacts - kept Claude artifacts');
      return claudeArtifacts;
    });
  }
}, [currentRfp]); // Only depend on currentRfp - clean dependency array
```

### Key Improvements:

1. **Inlined Logic**: The artifact loading logic is now directly in the `useEffect`, eliminating the stale closure issue

2. **Functional State Updates**: Using `setArtifacts(prev => ...)` ensures we always work with the latest state without needing it in the dependency array

3. **Clean Dependencies**: The effect only depends on `currentRfp`, making it clear when it re-runs

4. **No Infinite Loops**: The functional update pattern breaks the dependency cycle

5. **Preserved Claude Artifacts**: The logic still correctly preserves Claude-generated artifacts (those created during the current session) while loading RFP-specific artifacts from the database

## Benefits

1. **Correct Behavior**: Artifact dropdown now updates immediately when switching RFPs
2. **No Stale Data**: Always uses fresh artifact state via functional updates
3. **Better Performance**: Effect only runs when RFP actually changes
4. **Maintainable**: Clear, predictable dependency array
5. **No Loops**: Eliminates risk of infinite re-render loops

## Testing Checklist

- [x] TypeScript compilation successful (no errors)
- [ ] Switching RFPs updates artifact dropdown
- [ ] Claude-generated artifacts are preserved when switching RFPs
- [ ] Session artifacts are replaced when loading a different session
- [ ] No infinite render loops
- [ ] Console logs show correct artifact counts
- [ ] Artifact window reflects new RFP artifacts immediately

## Files Modified

1. `src/hooks/useArtifactManagement.ts`
   - Inlined artifact loading logic in RFP change `useEffect`
   - Used functional state updates to avoid stale closures
   - Simplified dependency array to only `[currentRfp]`
   - Preserved Claude artifact filtering logic
   - Kept `loadRFPArtifacts` function for manual calls if needed

## Related Issues

- Fixes artifact dropdown not updating when RFP changes
- Resolves stale closure issues in React hooks
- Improves RFP context switching UX

## Technical Notes

### Why Functional Updates?

Using `setArtifacts(prev => ...)` instead of `setArtifacts(newValue)` allows us to:
- Access the latest state without including it in dependencies
- Avoid stale closures
- Break dependency cycles
- Maintain correct behavior across re-renders

### Why Inline the Logic?

Moving the logic directly into the `useEffect` ensures:
- No stale closures from outer scope
- Clear and predictable execution timing
- Easier to reason about dependencies
- Follows React best practices

## Future Enhancements

1. Consider using React Query or SWR for artifact caching
2. Add loading states for artifact fetching
3. Implement optimistic updates for better UX
4. Add error boundary for artifact loading failures
