# Artifact Window Toggle Visibility Fix

**Date:** October 11, 2025  
**Issue:** Artifact window toggle button not visible in new session state

## Problem Description

Users reported that the artifact window toggle button was not visible when starting a new session, even when there were artifacts available for the current RFP. This created a usability issue where users couldn't access existing artifacts.

## Root Cause

The artifact window toggle button in `HomeHeader.tsx` had several issues:

1. **Optional Props**: The `onToggleArtifactWindow` prop was marked as optional (`?:`), leading to conditional rendering
2. **Conditional Rendering**: The button was wrapped in a condition `{onToggleArtifactWindow && (...)}`, hiding it when the prop was undefined
3. **Missing Props**: The `artifactWindowOpen` and `onToggleArtifactWindow` props were not being passed from `Home.tsx` to `HomeHeader`
4. **No Visual Feedback**: Users had no indication of how many artifacts were available

## Solution Implemented

### 1. Made Props Required in HomeHeader.tsx

Changed the interface to make artifact window props required:

```typescript
// Before
artifactWindowOpen?: boolean;
onToggleArtifactWindow?: () => void;

// After
artifactWindowOpen: boolean;
onToggleArtifactWindow: () => void;
artifactCount?: number; // Added to show artifact availability
```

### 2. Removed Conditional Rendering

The button is now always rendered, regardless of prop state:

```typescript
// Before
{onToggleArtifactWindow && (
  <IonButton ... />
)}

// After
<IonButton ... />
```

### 3. Added Artifact Count Badge

Added a visual badge showing the number of available artifacts:

```typescript
{artifactCount > 0 && (
  <span style={{
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    backgroundColor: 'var(--ion-color-primary)',
    color: 'white',
    borderRadius: '10px',
    padding: '2px 6px',
    fontSize: '10px',
    fontWeight: 'bold',
    minWidth: '18px',
    height: '18px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
  }}>
    {artifactCount > 99 ? '99+' : artifactCount}
  </span>
)}
```

### 4. Connected Props in Home.tsx

Added the missing props to the `HomeHeader` component:

```typescript
<HomeHeader
  // ... other props
  artifactWindowOpen={artifactWindowState.isOpen}
  onToggleArtifactWindow={artifactWindowState.toggleWindow}
  artifactCount={artifacts.length}
/>
```

## Benefits

1. **Always Accessible**: The artifact toggle button is now always visible, ensuring users can always access artifacts
2. **Visual Feedback**: The badge shows at a glance how many artifacts are available for the current RFP
3. **Consistent UX**: Users always know where to find artifacts, regardless of session state
4. **Better Discoverability**: The badge draws attention when artifacts exist, improving feature discovery

## Testing Checklist

- [x] TypeScript compilation successful (no errors)
- [ ] Artifact toggle button visible in new session
- [ ] Badge displays correct artifact count
- [ ] Badge hidden when no artifacts exist
- [ ] Toggle functionality works correctly
- [ ] Badge updates when artifacts are added/removed
- [ ] Mobile responsive behavior maintained
- [ ] Test with MCP browser automation

## Files Modified

1. `src/components/HomeHeader.tsx`
   - Made `artifactWindowOpen` and `onToggleArtifactWindow` required props
   - Added `artifactCount` optional prop
   - Removed conditional rendering of toggle button
   - Added artifact count badge

2. `src/pages/Home.tsx`
   - Added `artifactWindowOpen` prop to HomeHeader
   - Added `onToggleArtifactWindow` prop to HomeHeader
   - Added `artifactCount` prop to HomeHeader (set to `artifacts.length`)

## Related Issues

- Improves UX for RFP artifact management
- Addresses user feedback about hidden artifact access
- Enhances discoverability of artifact features

## Future Enhancements

1. Add animation to badge when artifact count changes
2. Show different badge colors based on artifact types
3. Add tooltip showing artifact names on hover
4. Consider adding keyboard shortcut for toggle (e.g., Ctrl+Shift+A)
