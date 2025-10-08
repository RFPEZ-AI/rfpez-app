# Bid View Singleton Pattern

**Date:** October 8, 2025  
**Status:** ✅ IMPLEMENTED

## Overview

The bid view system has been updated to follow a **singleton pattern per RFP**, ensuring that only one bid view artifact exists for each RFP at any given time.

## Design Change

### Previous Design
- **Multiple instances**: Each request to view bids created a new artifact with a timestamped ID
- **ID format**: `bid-view-{rfpId}-{timestamp}`
- **Result**: Multiple duplicate bid views for the same RFP cluttered the artifact list

### New Design
- **Single instance per RFP**: One reusable bid view artifact per RFP
- **ID format**: `bid-view-{rfpId}` (deterministic, no timestamp)
- **Result**: Clean artifact list with one bid view per RFP

## Implementation Details

### 1. Deterministic ID Generation

```typescript
// Old approach (timestamp-based)
const bidViewId = `bid-view-${currentRfp.id}-${Date.now()}`;

// New approach (deterministic)
const bidViewId = `bid-view-${currentRfp.id}`;
```

### 2. Reuse Existing Artifact

**File:** `src/pages/Home.tsx` - `handleViewBids()`

```typescript
// Check if a bid view already exists for this RFP
const existingBidView = artifacts.find(a => a.id === bidViewId);

if (existingBidView) {
  // Reuse existing artifact
  console.log('Reusing existing bid view artifact:', existingBidView.id);
  bidViewArtifact = {
    ...existingBidView,
    name: `Bids for ${currentRfp.name}`, // Update name if RFP renamed
    content: currentRfp.name
  };
  
  // Update in state if name changed
  setArtifacts((prev: Artifact[]) => 
    prev.map(a => a.id === bidViewId ? bidViewArtifact : a)
  );
} else {
  // Create new bid view artifact only if none exists
  console.log('Creating new bid view artifact:', bidViewId);
  bidViewArtifact = {
    id: bidViewId,
    name: `Bids for ${currentRfp.name}`,
    type: 'bid_view',
    size: '0 KB',
    content: currentRfp.name,
    rfpId: currentRfp.id,
    role: 'buyer'
  };
  
  setArtifacts((prev: Artifact[]) => [...prev, bidViewArtifact]);
}
```

### 3. Dynamic Content Loading

**File:** `src/components/BidView.tsx`

The `BidView` component loads fresh bid data from the database on every render:

```typescript
useEffect(() => {
  const loadBids = async () => {
    // Load bids from database using edge function
    const { data: functionResponse, error: bidsError } = 
      await supabase.functions.invoke('get-rfp-bids', {
        body: { rfp_id: currentRfpId }
      });
    
    // Update local state with fresh data
    setBids(bidsData);
  };
  
  loadBids();
}, [currentRfpId]); // Reloads when RFP changes
```

### 4. Service Layer Update

**File:** `src/services/artifactService.ts` - `createBidViewArtifact()`

```typescript
static createBidViewArtifact(currentRfp: RFP): Artifact {
  const bidViewArtifact: Artifact = {
    id: `bid-view-${currentRfp.id}`, // Deterministic ID without timestamp
    name: `Bids for ${currentRfp.name}`,
    type: 'bid_view',
    size: '0 KB',
    content: currentRfp.name,
    rfpId: currentRfp.id,
    role: 'buyer'
  };

  return bidViewArtifact;
}
```

## Benefits

### 1. Prevents Artifact Clutter
- No duplicate bid views for the same RFP
- Cleaner artifact panel
- Easier navigation

### 2. Consistent User Experience
- Same artifact instance across multiple views
- Predictable behavior
- Reduced confusion

### 3. Dynamic Data
- Fresh bid data loaded on each view
- Automatically reflects new submissions
- No stale data issues

### 4. Better Performance
- Reduced memory footprint
- Fewer artifact instances to manage
- Faster artifact lookups

### 5. Maintainability
- Simple, predictable artifact lifecycle
- Easier to debug
- Clear ownership (one view per RFP)

## User Workflow

### Viewing Bids Multiple Times

**Scenario:** User views bids for an RFP, navigates away, then views bids again

**Behavior:**
1. First view: Creates bid view artifact `bid-view-123`
2. Navigate away: Artifact remains in artifact list
3. Second view: Reuses artifact `bid-view-123`, loads fresh data
4. Result: Same artifact instance, but with updated bid list

### Multiple RFPs

**Scenario:** User works with multiple RFPs

**Behavior:**
1. View bids for RFP #123: Creates `bid-view-123`
2. View bids for RFP #456: Creates `bid-view-456`
3. Switch back to RFP #123: Reuses `bid-view-123`
4. Result: One bid view per RFP, no duplicates

## Testing Considerations

### Manual Testing
1. Create an RFP and submit multiple bids
2. Click "View Bids" button
3. Note the artifact ID in the artifact panel
4. Navigate to another artifact
5. Click "View Bids" again
6. Verify the artifact ID is the same (no new artifact created)
7. Submit a new bid
8. View bids again and verify the new bid appears

### Automated Testing
```typescript
test('should reuse existing bid view artifact', () => {
  const rfp = { id: 123, name: 'Test RFP' };
  const artifacts: Artifact[] = [];
  
  // First view
  const bidView1 = handleViewBids(rfp, artifacts);
  expect(bidView1.id).toBe('bid-view-123');
  
  // Second view
  const bidView2 = handleViewBids(rfp, [bidView1]);
  expect(bidView2.id).toBe('bid-view-123'); // Same ID
  expect(bidView2).toBe(bidView1); // Same instance reference
});
```

## Documentation Updates

### Files Updated
1. **ARTIFACT-FUNCTIONS.md**: Added "Bid View Artifacts" section documenting the singleton pattern
2. **BID_SUBMISSION_IMPLEMENTATION_SUMMARY.md**: Added "Bid View Design Pattern" section
3. **BID-VIEW-SINGLETON-PATTERN.md**: This comprehensive documentation

## Migration Notes

### Backward Compatibility
- **Existing bid views**: Old timestamped bid views (`bid-view-123-1234567890`) will remain in the artifact list
- **No breaking changes**: New bid views use deterministic IDs, but old ones continue to work
- **Cleanup**: Users can manually delete old duplicate bid views if desired
- **Automatic cleanup**: Consider adding a migration script to remove duplicate bid views in the future

### Future Enhancements
1. **Automatic cleanup**: Script to find and remove old timestamped bid views
2. **View state persistence**: Remember scroll position and filters when reusing bid views
3. **Real-time updates**: WebSocket integration for live bid updates
4. **Bid comparison**: Side-by-side comparison of multiple bids

## Technical Notes

### Why Not Database-Backed?
The bid view artifact is **ephemeral** (not stored in database) because:
- It's purely a UI construct for viewing data
- Data is always loaded fresh from the `bids` table
- No state needs to be persisted
- Simpler lifecycle management

### Relationship to BidView Component
- **Artifact**: Metadata container (`id`, `name`, `type`, `rfpId`)
- **Component**: Renders the actual bid list using `rfpId`
- **Data flow**: Artifact → Component → Database → Display

## Related Files

- `src/pages/Home.tsx` - Main bid view handler
- `src/services/artifactService.ts` - Bid view artifact creation
- `src/components/BidView.tsx` - Bid view UI component
- `database/bid-submission-schema-enhancement.sql` - Bid database schema
- `DOCUMENTATION/ARTIFACT-FUNCTIONS.md` - Artifact system documentation
- `BID_SUBMISSION_IMPLEMENTATION_SUMMARY.md` - Bid submission overview

## Summary

The bid view singleton pattern ensures a clean, predictable user experience while maintaining data freshness through dynamic loading. This design change eliminates artifact clutter and provides a more maintainable codebase.
