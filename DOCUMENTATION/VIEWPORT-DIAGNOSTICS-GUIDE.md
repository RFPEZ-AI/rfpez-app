# Portrait Mode Layout Issue - Diagnostic Guide

## Issue Description
Tester on dev.rfpez.ai is seeing portrait mode layout (artifacts at bottom) even though Chrome window has landscape aspect ratio.

## Root Cause Analysis

The orientation detection in `ArtifactContainer.tsx` uses this logic:
```typescript
const [isPortrait, setIsPortrait] = useState<boolean>(window.innerHeight > window.innerWidth);
```

This can be incorrectly triggered by several factors:

### Potential Causes

1. **Browser Zoom**
   - When browser zoom is set >100%, the innerWidth/innerHeight values change
   - Example: At 150% zoom, a 1920x1080 window might report as ~1280x720 internally
   - If height calculations exceed width due to zoom, portrait mode triggers

2. **Browser DevTools Open**
   - DevTools docked to bottom can reduce available innerHeight
   - Can make innerHeight > innerWidth even in landscape window

3. **Browser UI Elements**
   - Address bar, bookmarks bar, tabs can reduce innerHeight
   - On smaller screens or with multiple toolbars, this can tip the balance

4. **Visual Viewport vs Layout Viewport**
   - Mobile browsers and PWAs have concept of visual vs layout viewport
   - Visual viewport can be zoomed/panned independently
   - Our detection uses layout viewport (window.innerWidth/Height)

5. **Display Scaling (Windows)**
   - Windows display scaling (125%, 150%, 200%) affects reported dimensions
   - Combined with browser zoom, can cause unexpected results

6. **Sidebar/Extensions**
   - Browser sidebars (bookmarks, extensions) can reduce innerWidth
   - May not be obvious but affects the calculation

## Diagnostic Solution

Added `ViewportDiagnostics` component to Debug page that shows:

### Key Metrics Displayed
- **Orientation Detection**: Current calculated orientation
- **Aspect Ratio**: Width/Height ratio (>1 = landscape, <1 = portrait)
- **Window Size**: innerWidth x innerHeight
- **Screen Size**: Physical screen dimensions
- **Visual Viewport**: Actual visible viewport with scale
- **Estimated Zoom**: Browser zoom level
- **Device Pixel Ratio**: Screen density
- **Ionic Platforms**: Detected platform(s)
- **Media Query Orientation**: CSS media query result
- **User Agent**: Browser identification string

### Issue Detection
Component automatically highlights mismatches:
- ⚠️ **Red Alert**: Landscape window (aspect >1) detected as portrait
- ⚠️ **Orange Alert**: Portrait window detected as landscape
- ✅ **Green Check**: Orientation detection is correct

## How to Use with Remote Testers

### For Testers

1. **Access Diagnostics**
   - Navigate to: `https://dev.rfpez.ai/debug`
   - Scroll to top - "Viewport Diagnostics" card

2. **Copy Diagnostics**
   - Click "Copy All Diagnostics" button
   - Paste into email/Slack/GitHub issue

3. **Screenshot**
   - Take screenshot showing:
     - Full browser window with dev.rfpez.ai visible
     - Viewport Diagnostics card expanded
     - Current layout issue (artifacts at bottom)

### For Developers

When you receive diagnostics, look for:

1. **Aspect Ratio vs Orientation Mismatch**
   ```json
   {
     "aspectRatio": 1.78,  // Clearly landscape
     "orientation": "portrait",  // But detected as portrait
     "windowHeight": 1080,
     "windowWidth": 1920
   }
   ```

2. **Zoom Issues**
   ```json
   {
     "zoom": 150,  // Browser zoomed to 150%
     "devicePixelRatio": 1.5,
     "visualViewportScale": 1.5
   }
   ```

3. **Viewport Discrepancies**
   ```json
   {
     "innerWidth": 1920,
     "innerHeight": 1080,
     "visualViewportWidth": 1280,  // Different due to zoom
     "visualViewportHeight": 720
   }
   ```

## Solutions & Workarounds

### Immediate Workarounds (for testers)

1. **Reset Browser Zoom**
   - Press `Ctrl+0` (Windows) or `Cmd+0` (Mac)
   - Or use browser menu → Zoom → Reset

2. **Close DevTools**
   - Press `F12` to toggle DevTools off
   - Check if layout returns to normal

3. **Maximize Browser Window**
   - F11 for fullscreen
   - Or maximize window normally

4. **Try Different Browser**
   - Test in Chrome, Firefox, Edge
   - Report which browsers work/don't work

### Code-Level Solutions

#### Option 1: Use Aspect Ratio Instead (Recommended)
```typescript
// More reliable - uses aspect ratio instead of raw dimensions
const [isPortrait, setIsPortrait] = useState<boolean>(
  window.innerWidth / window.innerHeight < 1
);
```

#### Option 2: Add Tolerance Threshold
```typescript
// Add 10% threshold to avoid edge cases
const PORTRAIT_THRESHOLD = 0.95; // Less than 0.95 = portrait
const [isPortrait, setIsPortrait] = useState<boolean>(
  (window.innerWidth / window.innerHeight) < PORTRAIT_THRESHOLD
);
```

#### Option 3: Use Media Query + Aspect Ratio
```typescript
const [isPortrait, setIsPortrait] = useState<boolean>(() => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const mediaQuery = window.matchMedia('(orientation: portrait)').matches;
  // Combine both methods for reliability
  return mediaQuery || aspectRatio < 1;
});
```

#### Option 4: Use Visual Viewport
```typescript
const [isPortrait, setIsPortrait] = useState<boolean>(() => {
  const viewport = window.visualViewport || window;
  return viewport.height > viewport.width;
});
```

## Recommended Fix

Implement **Option 3** (Media Query + Aspect Ratio) for best reliability:

```typescript
// In ArtifactContainer.tsx, replace line 27:
const [isPortrait, setIsPortrait] = useState<boolean>(() => {
  const aspectRatio = window.innerWidth / window.innerHeight;
  const mediaQuery = window.matchMedia('(orientation: portrait)').matches;
  
  // Use aspect ratio as primary, media query as secondary
  // Aspect ratio < 1 is definitely portrait
  // If aspect ratio is close to 1 (0.9-1.1), use media query
  if (aspectRatio < 0.9) return true;   // Clearly portrait
  if (aspectRatio > 1.1) return false;  // Clearly landscape
  return mediaQuery;  // Use media query for edge cases
});

// And update the resize handler:
useEffect(() => {
  const handleResize = () => {
    const aspectRatio = window.innerWidth / window.innerHeight;
    const mediaQuery = window.matchMedia('(orientation: portrait)').matches;
    
    if (aspectRatio < 0.9) setIsPortrait(true);
    else if (aspectRatio > 1.1) setIsPortrait(false);
    else setIsPortrait(mediaQuery);
  };

  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);
  
  return () => {
    window.removeEventListener('resize', handleResize);
    window.removeEventListener('orientationchange', handleResize);
  };
}, []);
```

## Testing Checklist

After implementing fix, test these scenarios:

- [ ] Normal landscape browser (1920x1080, no zoom)
- [ ] Normal portrait browser (1080x1920, tablet rotated)
- [ ] Browser zoom at 125%, 150%, 175%, 200%
- [ ] DevTools open (docked bottom, docked right)
- [ ] Windows display scaling at 125%, 150%
- [ ] Narrow desktop window (< 768px width)
- [ ] Mobile browser (actual mobile device)
- [ ] PWA mode (installed as app)
- [ ] Browser with sidebars/extensions visible
- [ ] Fullscreen mode (F11)

## Deployment Plan

1. **Deploy Diagnostics Component** (Already done)
   - Push to dev.rfpez.ai immediately
   - Have tester capture diagnostics

2. **Analyze Root Cause**
   - Review diagnostic data from tester
   - Identify specific trigger

3. **Implement Fix**
   - Apply recommended solution
   - Test locally with same conditions

4. **Deploy Fix**
   - Push to dev.rfpez.ai
   - Have tester verify fix

5. **Monitor**
   - Check for similar reports from other users
   - Add to test automation suite

## Additional Notes

### Browser Compatibility
- Chrome/Edge: Excellent support for visualViewport
- Firefox: Good support, may have subtle differences
- Safari: Limited visualViewport support, use fallbacks

### Mobile Considerations
- Mobile browsers always use portrait/landscape correctly
- Issue primarily affects desktop browsers
- PWA mode on desktop may behave differently

### Future Enhancements
- Add orientation lock option for users
- Remember user's preferred layout mode
- Add manual toggle for artifact panel position
- Improve responsive breakpoints for edge cases
