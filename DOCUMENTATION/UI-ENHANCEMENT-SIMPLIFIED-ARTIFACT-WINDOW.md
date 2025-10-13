# UI Enhancement: Simplified Artifact Window with Smart Auto-Show/Hide

**Date:** October 13, 2025  
**Issue:** Artifact window had redundant controls (header button + expander button) and needed smarter visibility management

## Changes Implemented

### 1. **Removed Expander/Collapse Functionality**
The artifact window is now always expanded when visible, eliminating the need for the collapse/expand button within the window itself.

**Files Modified:**
- `src/hooks/useArtifactWindowState.ts`
  - Removed `isCollapsed` from `ArtifactWindowState`
  - Removed `collapseWindow()`, `expandWindow()`, `toggleCollapse()` from `ArtifactWindowActions`
  - Simplified state management to just `isOpen` and `selectedArtifactId`

- `src/components/ArtifactContainer.tsx`
  - Removed collapse button and chevron icons from header
  - Always shows full content (no collapsed state)
  - Simplified header to just show fullscreen button and artifact dropdown
  - Removed `isCollapsed` and `onToggleCollapse` props

- `src/types/home.ts`
  - Removed `isCollapsed?: boolean` and `onToggleCollapse?: () => void` from `SingletonArtifactWindowProps`

- `src/pages/Home.tsx`
  - Removed all `expandWindow()` calls (no longer needed)
  - Removed `isCollapsed` and `toggleCollapse` prop passing

### 2. **Enhanced Header Toggle Button with 3 Visual States**

The artifact window toggle button in the header now has 3 distinct visual states:

**State 1: Hidden + No Artifacts**
- Color: Light gray (`var(--ion-color-light)`)
- Opacity: 0.5 (dimmed)
- Cursor: Default (disabled look)
- Button: Disabled
- Tooltip: "No artifacts"

**State 2: Hidden + Has Artifacts**
- Color: Primary (`var(--ion-color-primary)`)
- Opacity: 1 (full)
- Badge: Orange/Warning color with pulse animation
- Tooltip: "Show N artifact(s)"
- **Purpose:** Draws attention to available artifacts

**State 3: Window Shown**
- Color: Primary (`var(--ion-color-primary)`)
- Opacity: 1 (full)
- Badge: Green/Success color (no animation)
- Tooltip: "Hide artifacts"
- **Purpose:** Indicates active state

**Visual Enhancements:**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
```
- Badge pulses when window is hidden but artifacts exist
- Badge color changes from warning (orange) to success (green) when window opens

**File Modified:**
- `src/components/HomeHeader.tsx` (lines 239-278)

### 3. **Smart Auto-Show/Hide Behavior**

The artifact window now automatically manages its visibility based on artifact availability:

**Auto-Hide Logic:**
- Window automatically hides when NO artifacts exist in the session
- Prevents showing empty artifact panel
- Cleaner UI when user hasn't created any artifacts yet

**Auto-Show Logic:**
- Window automatically shows when:
  1. An artifact appears in a session message (created by agent)
  2. User clicks on an artifact card in the message stream
  3. Session is loaded and has existing artifacts

**Implementation:**
```typescript
// Auto-show if artifacts exist
if (sessionArtifacts && sessionArtifacts.length > 0) {
  if (!artifactWindowState.isOpen) {
    artifactWindowState.openWindow();
  }
}

// Auto-hide if no artifacts exist
if (!sessionArtifacts || sessionArtifacts.length === 0) {
  if (artifactWindowState.isOpen) {
    artifactWindowState.closeWindow();
  }
}
```

**Files Modified:**
- `src/pages/Home.tsx` (lines 342-352)

### 4. **Space Optimization**

**Before:**
- Header: Toggle button + Expander button (44px header height)
- Expander button took up ~40px when collapsed
- Redundant controls for same functionality

**After:**
- Header: Just fullscreen button + artifact dropdown (44px header height)
- No wasted space on expander
- Single toggle button in main header controls visibility
- More room for actual artifact content

## User Experience Improvements

### **Clearer Visual Feedback**
1. **Disabled State:** When no artifacts exist, button is clearly disabled (grayed out)
2. **Attention State:** When artifacts exist but window is hidden, badge pulses to draw attention
3. **Active State:** When window is open, badge shows success color (green) confirming visibility

### **Reduced Clicks**
- Before: User might click expander thinking it's the only way to show/hide
- After: Single button in header controls everything, no confusion

### **Automatic Behavior**
- No need to manually show window when creating first artifact
- No need to manually hide window when switching to empty session
- System intelligently manages visibility based on content

### **Mobile-Friendly**
- Portrait mode still supports drag-to-resize
- No wasted vertical space on collapse button
- Header remains touch-friendly with single toggle in main toolbar

## Testing Verification

### **Before Changes:**
- ❌ Two buttons to control same window (confusing UX)
- ❌ Window could be shown but collapsed (wasted space)
- ❌ Button didn't indicate if artifacts existed
- ❌ Had to manually show window even when artifacts appeared

### **After Changes:**
- ✅ Single button in header controls window visibility
- ✅ Window always fully shown when visible (no collapse state)
- ✅ Button clearly shows 3 states: disabled/empty, has-artifacts, shown
- ✅ Window auto-shows when artifacts created
- ✅ Window auto-hides when session has no artifacts
- ✅ Badge pulses when artifacts exist but window hidden (attention-grabbing)
- ✅ Badge turns green when window open (confirmation feedback)

## Technical Details

### **State Management Simplification**
**Before:**
```typescript
interface ArtifactWindowState {
  isOpen: boolean;
  isCollapsed: boolean;  // ❌ Removed
  selectedArtifactId: string | null;
}
```

**After:**
```typescript
interface ArtifactWindowState {
  isOpen: boolean;
  selectedArtifactId: string | null;
}
```

### **Props Cleanup**
**Before:**
```typescript
interface SingletonArtifactWindowProps {
  isCollapsed?: boolean;           // ❌ Removed
  onToggleCollapse?: () => void;  // ❌ Removed
  // ... other props
}
```

**After:**
```typescript
interface SingletonArtifactWindowProps {
  // Cleaner interface - collapse props removed
  // ... other props
}
```

### **CSS Animations Added**
```css
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.8; }
}
```
- Applied to badge when window is hidden but artifacts exist
- Provides subtle attention-grabbing effect
- Automatically stops when window opens

## Related Files

### **Core Changes:**
- `src/hooks/useArtifactWindowState.ts` - State management simplification
- `src/components/ArtifactContainer.tsx` - Removed expander, always expanded
- `src/components/HomeHeader.tsx` - Enhanced button with 3 visual states
- `src/pages/Home.tsx` - Auto-show/hide logic
- `src/types/home.ts` - Interface cleanup

### **Visual Design:**
- Button colors: Light gray → Primary → Primary with green badge
- Badge colors: Orange (warning) → Green (success)
- Badge animation: Pulse when attention needed
- Cursor states: Default (disabled) → Pointer (active)

## Key Takeaways

1. **Simplify Controls:** One button > Two buttons for same functionality
2. **Visual Hierarchy:** Use color, animation, and state to communicate status
3. **Smart Defaults:** Auto-show/hide based on content availability
4. **Accessibility:** Clear disabled states, tooltips, and visual feedback
5. **Space Efficiency:** Remove redundant UI elements to maximize content area

---

**Status:** ✅ Implemented and ready for testing
