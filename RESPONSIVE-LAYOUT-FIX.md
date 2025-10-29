# Responsive Layout Fix - Intermediate State Issue

## Problem
The application was experiencing an intermediate layout state during window resizing, particularly when transitioning between landscape and portrait modes. The layout would flicker or show a mixed state that was neither clearly mobile nor desktop.

## Root Cause
The `useIsMobile` hook in `src/utils/useMediaQuery.ts` was using a single threshold (768px) with a simple comparison:
```typescript
const isMobileViewport = window.innerWidth <= 768;
```

This caused the layout to rapidly switch between mobile and desktop modes during resize operations, especially in the 700-850px range.

## Solution: Hysteresis
Implemented a hysteresis approach with two thresholds:
- **Mobile Threshold: 768px** - Switch TO mobile layout when width falls below this
- **Desktop Threshold: 900px** - Switch TO desktop layout when width rises above this
- **Sticky Zone: 768-900px** - Maintains current layout state

### Visual Representation
```
                       STICKY ZONE
                    ┌──────────────┐
                    │              │
0px ───────────────768px────────900px───────────→ ∞
     MOBILE         │   HYBRID    │    DESKTOP
     (forced)       │   (sticky)  │   (forced)
                    │              │
                    └──────────────┘
```

### How It Works
1. **Viewport < 768px**: Always mobile layout (forced)
2. **Viewport 768px - 900px**: Maintains current layout (sticky zone)
   - If was mobile → stays mobile
   - If was desktop → stays desktop
3. **Viewport > 900px**: Always desktop layout (forced)

### Behavior During Resize
```
Scenario 1: Starting from narrow (mobile)
500px → 700px → 800px → 850px → 950px
 ┃       ┃       ┃       ┃       ┃
 📱      📱      📱      📱      🖥️
Mobile stays until 900px exceeded

Scenario 2: Starting from wide (desktop)
1200px → 1000px → 850px → 800px → 700px
  ┃       ┃        ┃       ┃       ┃
  🖥️      🖥️       🖥️      🖥️      📱
Desktop stays until 768px breached
```

### Additional Improvements
- Increased debounce delay from 100ms to 150ms for smoother transitions
- Physical mobile devices (detected by Ionic/user agent) always use mobile layout
- Proper cleanup of timeout in useEffect

## Benefits
- ✅ Eliminates intermediate layout states
- ✅ Prevents layout flickering during resize
- ✅ Smoother user experience
- ✅ Clearer distinction between mobile and desktop modes
- ✅ Maintains responsive behavior without visual disruption

## Testing
To test the fix:
1. Open the application in a browser
2. Open DevTools and enable device simulation
3. Resize the viewport slowly from narrow to wide
4. Observe that layout switches cleanly at thresholds without intermediate states
5. Check console logs for "🔍 Mobile detection" messages showing threshold behavior

## Files Modified
- `src/utils/useMediaQuery.ts` - Updated `useIsMobile` hook with hysteresis logic
- `src/components/ArtifactContainer.tsx` - Updated portrait detection to use consistent 768px threshold

## Additional Fix: Consistent Portrait Detection

### Problem Discovered (October 29, 2025)
After implementing hysteresis, a second issue emerged: `ArtifactContainer.tsx` used aspect ratio-based portrait detection while `HomeContent.tsx` used the `useIsMobile` hook (768px width threshold). This caused layout mismatches at intermediate viewport sizes (e.g., 1280x800):
- `useIsMobile` = false (desktop mode, 1280 > 768)
- `isPortrait` = true (aspect ratio-based)
- **Result**: Artifact window had limited width in desktop layout

### Solution
Synchronized both detection systems to use the same 768px width threshold:

**ArtifactContainer.tsx - Before:**
```typescript
const [isPortrait, setIsPortrait] = useState<boolean>(() => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  if (aspectRatio < 0.9) return true;
  if (aspectRatio > 1.1) return false;
  return mediaQuery; // Fallback to orientation media query
});
```

**ArtifactContainer.tsx - After:**
```typescript
const [isPortrait, setIsPortrait] = useState<boolean>(() => {
  return window.innerWidth <= 768; // Same threshold as useIsMobile
});
```

Now both systems stay synchronized across all viewport sizes.

## Critical Fix: Ionic Platform Detection Override

### Problem Discovered (October 29, 2025 - Continued)
After the portrait detection fix, the issue persisted. Investigation revealed:
- VS Code Simple Browser was detected as `plt-android plt-tablet` by Ionic
- `isPlatform('android')` returned `true`
- `useIsMobile` forced mobile layout regardless of 1280px viewport width
- **Result**: SessionHistory hidden, artifact window positioned at left edge (x=0)

### Root Cause
The original logic had:
```typescript
if (ionicMobileDetection || isMobileUserAgent) {
  setIsMobileDevice(true);  // Force mobile mode
  return;  // Skip viewport width check
}
```

This meant **any** Ionic mobile/tablet detection always forced mobile layout, even at 1280px width.

### Solution
Updated `useIsMobile` to respect viewport width even when Ionic detects mobile/tablet:

```typescript
// Get viewport width first
const width = window.innerWidth;

// If Ionic/UA detects mobile, still use viewport width thresholds
if (ionicMobileDetection || isMobileUserAgent) {
  // Apply hysteresis to viewport width (not forced mobile)
  setIsMobileDevice(prevIsMobile => {
    if (prevIsMobile) {
      return width <= DESKTOP_THRESHOLD;  // 900px
    }
    return width <= MOBILE_THRESHOLD;  // 768px
  });
  return;
}
```

### Result
- Tablets in landscape (1280x800) now use desktop layout
- VS Code Simple Browser works correctly
- DevTools device emulation respects viewport width
- Physical mobile devices at wide resolutions (tablets) get appropriate layout

## Date
October 29, 2025
