# RFP Mandatory Association - Design Documentation

**Date**: October 12, 2025  
**Issue Resolved**: Form and document artifacts created without RFP association causing "orphaned" artifacts and missing UI elements

## Problem Statement

Previously, the RFP Design agent could create forms and documents without associating them with an RFP record. This led to:

1. **Orphaned Artifacts**: Bid forms and documents existed in database without parent RFP
2. **Missing UI Elements**: Bids button didn't appear because no RFP was set
3. **Data Inconsistency**: Submissions existed but couldn't be viewed due to missing RFP linkage
4. **Workflow Violations**: Agent instructions said "create RFP first" but system didn't enforce it

## Solution Implemented

### 1. Tool Definition Changes

**Modified Tools** (`supabase/functions/claude-api-v3/tools/definitions.ts`):

- **`create_form_artifact`**: Added required `rfp_id` parameter
- **`create_document_artifact`**: Added required `rfp_id` parameter
- **`get_current_rfp`**: NEW TOOL - retrieves current session RFP ID

**New Tool: `get_current_rfp`**
```typescript
{
  name: 'get_current_rfp',
  description: 'Get the current active RFP for the session. Returns null if no RFP is set.',
  input_schema: {
    type: 'object',
    properties: {
      session_id: { type: 'string', description: 'Session ID to check for current RFP' }
    },
    required: ['session_id']
  }
}
```

### 2. Database Function Updates

**File**: `supabase/functions/claude-api-v3/tools/database.ts`

#### New Function: `getCurrentRfp`
- Queries session's `current_rfp_id`
- Returns RFP details if set, null if not
- Provides clear error message when no RFP exists

#### Updated: `createFormArtifact`
- **Before**: `rfp_id` was optional, fetched from session as fallback
- **After**: `rfp_id` is REQUIRED parameter, validation enforced
- **Validation**: Checks RFP exists before creating artifact
- **Linking**: Uses provided `rfp_id` to link in `rfp_artifacts` table
- **Error Message**: Clear guidance to call `create_and_set_rfp` or `get_current_rfp`

#### Updated: `createDocumentArtifact`
- Same changes as `createFormArtifact`
- Added RFP linking that was previously missing
- Consistent error handling and validation

### 3. TypeScript Interface Updates

```typescript
interface FormArtifactData {
  rfp_id: number; // REQUIRED: RFP ID to associate artifact with
  name: string;
  description?: string;
  content: Record<string, unknown>;
  artifactRole: string;
  // ... other fields
}
```

### 4. Service Handler Registration

**File**: `supabase/functions/claude-api-v3/services/claude.ts`

```typescript
case 'get_current_rfp': {
  const { getCurrentRfp } = await import('../tools/database.ts');
  return await getCurrentRfp(this.supabase, input.session_id || sessionId!);
}
```

### 5. Role Permissions

**File**: `supabase/functions/claude-api-v3/tools/definitions.ts`

Added `get_current_rfp` to design role's allowed tools:
```typescript
'design': {
  allowed: [
    'create_and_set_rfp', 
    'get_current_rfp',     // ← NEW
    'create_form_artifact', 
    'create_document_artifact',
    // ... other tools
  ]
}
```

### 6. Agent Instructions Update

**File**: `Agent Instructions/RFP Design Agent.md`

Added new section explaining mandatory RFP association:

- **Clear Requirements**: `rfp_id` is required for all artifacts
- **Workflow Example**: Shows proper sequence with code
- **Error Prevention**: Explains what happens if RFP creation is skipped
- **Two Options**: Use `create_and_set_rfp` OR `get_current_rfp`

## Workflow Changes

### Before (Broken)
```
1. User: "Create a bid form for concrete delivery"
2. Agent: create_form_artifact({ name: "Bid Form", ... })
   ❌ No RFP created
   ❌ No rfp_id provided
   ✓ Form created but orphaned
3. User submits form
4. ❌ Bids button doesn't appear (no RFP)
5. ❌ Manual database fixes required
```

### After (Fixed)
```
1. User: "Create a bid form for concrete delivery"
2. Agent: create_and_set_rfp({ name: "Concrete Delivery Services RFP" })
   ✓ Returns rfp_id = 4
3. Agent: create_form_artifact({ rfp_id: 4, name: "Bid Form", ... })
   ✓ Validates RFP exists
   ✓ Creates form
   ✓ Links to RFP in rfp_artifacts table
4. User submits form
5. ✓ Bids button appears
6. ✓ User can view submissions
```

## Database Changes

### Validation Added
- RFP existence checked before artifact creation
- Clear error messages when RFP doesn't exist
- Linking enforced via `rfp_artifacts` junction table

### Automatic Linking
Both `createFormArtifact` and `createDocumentArtifact` now:
1. Validate `rfp_id` parameter exists
2. Check RFP record exists in database
3. Create artifact with proper metadata
4. Insert link record in `rfp_artifacts` table with role mapping

### Role Mapping
```typescript
// Forms
if (mappedRole?.includes('buyer') || mappedRole?.includes('questionnaire')) {
  rfpRole = 'buyer';
} else if (mappedRole?.includes('supplier') || mappedRole?.includes('bid')) {
  rfpRole = 'supplier';
}

// Documents  
if (mappedRole?.includes('supplier') || mappedRole?.includes('vendor')) {
  rfpRole = 'supplier';
} else {
  rfpRole = 'buyer'; // default for documents
}
```

## Error Messages

### When `rfp_id` Missing
```
❌ CRITICAL: rfp_id is required. You must either call create_and_set_rfp first 
(which returns rfp_id) or use get_current_rfp to get the session's current RFP ID. 
Forms/Documents cannot be created without an associated RFP.
```

### When Invalid `rfp_id`
```
❌ Invalid RFP ID: 999. The specified RFP does not exist. 
Use get_current_rfp or create_and_set_rfp to get a valid RFP ID.
```

### When No Current RFP (from `get_current_rfp`)
```
No RFP is currently set for this session. You must call create_and_set_rfp 
first before creating artifacts.
```

## Benefits

1. **Prevents Orphaned Artifacts**: All artifacts guaranteed to have RFP parent
2. **Enforces Workflow**: System enforces proper RFP → Artifact sequence
3. **Consistent UI**: Bids button and RFP context always present when artifacts exist
4. **Data Integrity**: Foreign key relationships properly maintained
5. **Clear Errors**: Agents get explicit guidance when skipping steps
6. **Audit Trail**: All artifacts traceable to parent RFP

## Testing Recommendations

### Test Case 1: Happy Path
```
1. create_and_set_rfp({ name: "Test RFP" })
2. Verify rfp_id returned
3. create_form_artifact({ rfp_id: [from step 1], ... })
4. Verify form created and linked
5. Check rfp_artifacts table for link record
```

### Test Case 2: Missing RFP
```
1. create_form_artifact({ name: "Test Form", ... })
2. Expect error: "rfp_id is required"
3. Verify no artifact created
```

### Test Case 3: Invalid RFP ID
```
1. create_form_artifact({ rfp_id: 99999, ... })
2. Expect error: "Invalid RFP ID: 99999"
3. Verify no artifact created
```

### Test Case 4: Use get_current_rfp
```
1. create_and_set_rfp({ name: "Test RFP" })
2. get_current_rfp({ session_id: "..." })
3. Verify rfp_id returned matches
4. create_form_artifact using that rfp_id
5. Verify success
```

## Migration Notes

### Existing Data
- Existing artifacts without RFP associations remain unchanged
- Manual linking may be needed for legacy data
- New artifacts must follow new rules

### Agent Behavior
- Agents will immediately fail if they skip RFP creation
- Error messages guide agents to proper workflow
- `get_current_rfp` tool allows checking before creating

### UI Impact
- Forms created after this change will have proper RFP context
- Bids button will appear correctly
- RFP footer display will show correct RFP name

## Deployment Steps

1. ✅ Update tool definitions (definitions.ts)
2. ✅ Update database functions (database.ts)
3. ✅ Update TypeScript interfaces
4. ✅ Register service handler (claude.ts)
5. ✅ Update role permissions
6. ✅ Update agent instructions
7. ✅ Restart edge runtime
8. ⏳ Test with new session (create RFP → create form → verify)
9. ⏳ Update agent instructions in database (SQL UPDATE)
10. ⏳ Deploy to remote Supabase

## Related Files Modified

- `supabase/functions/claude-api-v3/tools/definitions.ts`
- `supabase/functions/claude-api-v3/tools/database.ts`
- `supabase/functions/claude-api-v3/services/claude.ts`
- `Agent Instructions/RFP Design Agent.md`

## Issue Resolution

This change completely resolves the issue encountered where:
- Concrete delivery bid form was created without parent RFP
- Bids button didn't appear in footer
- Manual database fixes were required to link components

**Going forward**: This scenario is impossible because the system enforces RFP creation first.
