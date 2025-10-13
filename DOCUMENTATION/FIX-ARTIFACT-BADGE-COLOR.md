# Fix: Artifact Toggle Badge Color Not Showing Green

**Date:** October 13, 2025  
**Issue:** Badge on artifact window toggle button showing white instead of green when window is open

## Problem

After hard refresh, the badge on the artifact window toggle button in the header was appearing white instead of the intended green color when the artifact window was open. This was likely caused by CSS variable resolution issues with Ionic components.

## Root Cause

The badge was using CSS variables for background color:
```tsx
backgroundColor: artifactWindowOpen ? 'var(--ion-color-success)' : 'var(--ion-color-warning)'
```

In some cases (especially after hard refresh), these CSS variables might not be properly resolved before the component renders, resulting in a white/default background.

## Solution

Replaced CSS variables with explicit hex color values that match Ionic's default theme:

**Before:**
```tsx
backgroundColor: artifactWindowOpen ? 'var(--ion-color-success)' : 'var(--ion-color-warning)'
```

**After:**
```tsx
backgroundColor: artifactWindowOpen ? '#2dd36f' : '#ffc409' // Green when open, Orange when hidden
```

### Color Values Used:
- **Green (#2dd36f)**: Ionic success color - shown when artifact window is open
- **Orange (#ffc409)**: Ionic warning color - shown when window is hidden but artifacts exist

## Files Modified

- `src/components/HomeHeader.tsx` (line 273)

## Visual States

The badge now correctly shows:

1. **🟢 Green Badge** - Artifact window is **open** (no animation)
   - Color: `#2dd36f`
   - State: Active/visible window

2. **🟠 Orange Badge (pulsing)** - Artifact window is **hidden** but artifacts exist
   - Color: `#ffc409`
   - Animation: Pulse effect to draw attention
   - State: Hidden window with available content

3. **No Badge** - No artifacts exist
   - Button is grayed out and disabled
   - State: Empty/no content available

## Testing Verification

- ✅ Hard refresh shows correct green badge when window is open
- ✅ Badge correctly switches between green (open) and orange (hidden)
- ✅ Badge animation works (pulses when hidden with artifacts)
- ✅ Colors are consistent across page loads and refreshes

---

**Status:** ✅ Fixed - Badge colors now reliably display
