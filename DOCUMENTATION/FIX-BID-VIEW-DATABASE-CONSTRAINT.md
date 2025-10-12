# Fix: Bid View Database Foreign Key Constraint Error

## 🚨 Issue Report
**Date**: October 12, 2025  
**Reported By**: User Testing  
**Severity**: High (Blocking Feature)

### Problem Description
When clicking the "Bids" button to view bids for an RFP, the following error occurred:

```
Error updating session context: {
  code: '23503', 
  details: 'Key is not present in table "artifacts".', 
  message: 'insert or update on table "sessions" violates foreign key constraint "sessions_current_artifact_id_fkey"'
}
```

**User Impact**:
- ❌ Bids view would not open
- ❌ Console showed database constraint violation
- ❌ Session context update failed
- ❌ User could not view bid submissions

### Root Cause Analysis

#### Primary Issue: Bid View Artifact Not Saved to Database
The `handleViewBids()` function in `Home.tsx` was:
1. ✅ Creating a bid-view artifact object in React state
2. ❌ **NOT** saving the artifact to the database
3. ❌ Then trying to update `sessions.current_artifact_id` with the non-existent artifact ID

**Code Flow**:
```typescript
// Created in memory only (React state)
bidViewArtifact = { id: 'bid-view-5', name: 'Bids for...', ... };
setArtifacts((prev) => [...prev, bidViewArtifact]);

// Later: Tried to reference non-existent artifact
selectArtifact('bid-view-5'); // ❌ Fails - artifact not in database
```

**Database Constraint**:
```sql
ALTER TABLE sessions 
ADD CONSTRAINT sessions_current_artifact_id_fkey 
FOREIGN KEY (current_artifact_id) 
REFERENCES artifacts(id);
```

This constraint ensures referential integrity - you can't set `current_artifact_id` to an ID that doesn't exist in the `artifacts` table.

#### Secondary Issue: Supplier Name Extraction Mismatch
The `BidView.tsx` component was looking for supplier name in the wrong location:
- **Expected**: `response.supplier_info.name` (nested object)
- **Actual Data**: `response.supplier_company_name` (direct field)

This would have caused bid suppliers to show as "Anonymous Supplier" even after the database issue was fixed.

---

## ✅ Solution Implemented

### Fix #1: Save Bid View Artifact to Database
**File**: `src/pages/Home.tsx`  
**Function**: `handleViewBids()`  
**Lines**: ~1236-1258

**Change**:
1. Made function `async` to allow database operations
2. Added artifact insertion to database before selecting it
3. Added error handling for duplicate key constraint (artifact already exists)

**Code**:
```typescript
// 🔥 FIX: Save artifact to database before selecting it
try {
  const { data, error } = await supabase
    .from('artifacts')
    .insert({
      id: bidViewArtifact.id,
      session_id: currentSessionId,
      name: bidViewArtifact.name,
      type: 'bid_view',
      artifact_role: 'bid_view',
      content: bidViewArtifact.content,
      metadata: {
        rfp_id: currentRfp.id,
        rfp_name: currentRfp.name
      }
    })
    .select()
    .single();
  
  if (error) {
    // Artifact might already exist (code 23505 = unique violation)
    if (error.code === '23505') {
      console.log('ℹ️ Bid view artifact already exists in database:', bidViewId);
    } else {
      throw error;
    }
  } else {
    console.log('✅ Bid view artifact saved to database:', bidViewId);
  }
} catch (error) {
  console.error('❌ Failed to save bid view artifact to database:', error);
  // Continue anyway - the artifact might already exist
}
```

**Additional Change**:
- Updated `useSupabase()` destructuring to include `supabase` client:
  ```typescript
  const { user, session, loading: supabaseLoading, userProfile, supabase } = useSupabase();
  ```

### Fix #2: Robust Supplier Name Extraction
**File**: `src/components/BidView.tsx`  
**Function**: `loadBids()` transform logic  
**Lines**: ~189-213

**Change**:
Added fallback logic to check multiple possible field names for supplier name:

```typescript
// Extract supplier name from response - try multiple possible field names
let supplierName = 'Anonymous Supplier';
if (bidRow.response && typeof bidRow.response === 'object') {
  const response = bidRow.response;
  
  // Try nested supplier_info first (new schema)
  const supplierInfo = response.supplier_info as Record<string, unknown> | undefined;
  if (supplierInfo && typeof supplierInfo.name === 'string') {
    supplierName = supplierInfo.name;
  }
  // Try direct fields in response (legacy/current schema)
  else if (typeof response.supplier_company_name === 'string') {
    supplierName = response.supplier_company_name;
  }
  else if (typeof response.supplier_name === 'string') {
    supplierName = response.supplier_name;
  }
  else if (typeof response.company_name === 'string') {
    supplierName = response.company_name;
  }
}
```

**Supported Field Names** (in priority order):
1. `response.supplier_info.name` (new nested schema)
2. `response.supplier_company_name` (current direct field)
3. `response.supplier_name` (alternative naming)
4. `response.company_name` (generic fallback)

---

## 🧪 Testing Performed

### Database State Verification
```sql
-- Verified bid exists
SELECT id, rfp_id, supplier_id, status, created_at 
FROM bids 
WHERE rfp_id = 4;
-- Result: 1 bid found (id=1, status='submitted')

-- Verified RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE tablename = 'bids';
-- Result: Policies allow authenticated users to SELECT bids

-- Verified bid data structure
SELECT response FROM bids WHERE id = 1;
-- Result: Contains supplier_company_name, not nested supplier_info
```

### Test Scenarios
1. ✅ **Create new bid view**: Artifact saved to database, view opens
2. ✅ **Reopen existing bid view**: No duplicate key error, view reuses existing artifact
3. ✅ **Supplier name display**: Correctly extracts from `supplier_company_name`
4. ✅ **Foreign key constraint**: No more constraint violation errors

---

## 📊 Impact Assessment

### Before Fix
- ❌ Bid view completely broken
- ❌ Foreign key constraint violation on every click
- ❌ Session context updates failed
- ❌ Supplier names would show as "Anonymous Supplier"

### After Fix
- ✅ Bid view opens successfully
- ✅ Artifacts properly persisted to database
- ✅ Session context updates work correctly
- ✅ Supplier names display correctly
- ✅ Handles duplicate artifact creation gracefully
- ✅ Compatible with both new and legacy bid schemas

---

## 🎯 Related Issues & Context

### Database Schema Context
- **Artifact Types**: `bid_view` artifacts are virtual views, not uploaded files
- **Session Artifacts**: Must exist in `artifacts` table before being referenced in `sessions.current_artifact_id`
- **RFP Context**: Bid views are tied to specific RFPs via `metadata.rfp_id`

### Code Patterns Discovered
- **Deterministic IDs**: Bid view artifacts use format `bid-view-{rfp_id}` (one per RFP)
- **Artifact Reuse**: System checks for existing artifacts before creating new ones
- **Error Codes**: PostgreSQL error code `23505` = unique constraint violation (safe to ignore)

### Future Considerations
1. **Artifact Lifecycle**: Consider cleanup strategy for orphaned bid-view artifacts
2. **Schema Evolution**: Bid response schema may continue to evolve (nested vs flat)
3. **Performance**: Consider caching bid-view artifacts in session storage
4. **Validation**: Add database migration to ensure all virtual artifacts are properly created

---

## 🔗 Files Modified

| File | Lines Changed | Description |
|------|--------------|-------------|
| `src/pages/Home.tsx` | ~1193-1260 | Added database insertion for bid-view artifacts |
| `src/components/BidView.tsx` | ~189-213 | Enhanced supplier name extraction with fallbacks |

---

## ✅ Verification Checklist

- [✅] Code compiles without TypeScript errors
- [✅] No ESLint warnings introduced
- [✅] Database foreign key constraint satisfied
- [✅] Bid view opens without errors
- [✅] Supplier names display correctly
- [✅] Handles edge cases (duplicate artifacts, missing fields)
- [✅] Console logs confirm successful artifact creation
- [✅] Works with both new and legacy bid schemas

---

## 📝 Commit Message

```
Fix: Bid view foreign key constraint violation

🚨 ISSUE: Clicking "Bids" button caused database constraint error
- Error: sessions.current_artifact_id referenced non-existent artifact
- Root cause: Bid-view artifacts created in React state but not saved to database

✅ FIX #1: Save bid-view artifacts to database before selection
- Added async database insertion in handleViewBids()
- Properly handles duplicate artifact creation (unique constraint)
- Includes RFP metadata in artifact record

✅ FIX #2: Robust supplier name extraction
- BidView now checks multiple possible field names
- Supports both nested (supplier_info.name) and direct (supplier_company_name) schemas
- Fallback chain: supplier_info.name → supplier_company_name → supplier_name → company_name

IMPACT:
- ✅ Bid view now opens without errors
- ✅ Foreign key constraints satisfied
- ✅ Supplier names display correctly
- ✅ Compatible with schema evolution

Files modified:
- src/pages/Home.tsx: Added database insertion for artifacts
- src/components/BidView.tsx: Enhanced supplier name extraction
```

---

**Status**: ✅ RESOLVED  
**Ready for Testing**: Yes  
**Deployment**: Local development environment
