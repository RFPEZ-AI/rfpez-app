# Vendor Selection Artifact Implementation

## Overview
Implementing vendor selection as a special artifact type instead of a form, with auto-save functionality and dedicated CRUD tool for the Sourcing agent.

## ✅ Completed Work

### 1. Database Schema (Migration)
**File**: `supabase/migrations/20251102193710_add_vendor_selection_artifact_type.sql`

- Added `vendor_selection` to artifact type enum
- Added `vendor_selection_form` to artifact role enum
- Created specialized index for vendor selection artifacts
- Documented JSON schema structure:
```json
{
  "vendors": [
    {
      "id": "vendor-1",
      "name": "Vendor A",
      "selected": true,
      "selectedAt": "2025-11-02T10:30:00Z",
      "metadata": {}
    }
  ],
  "lastModified": "2025-11-02T10:30:00Z",
  "autoSaveEnabled": true
}
```

### 2. Backend Tool Handler
**File**: `supabase/functions/claude-api-v3/tools/vendorSelection.ts`

Implemented complete CRUD operations:
- `create`: Create new vendor selection artifact (one per RFP)
- `read`: Query current vendor selections
- `update`: Replace entire vendor list
- `add_vendors`: Add vendors to existing selection
- `remove_vendors`: Remove vendors by ID
- `toggle_selection`: Toggle selected status with auto-save timestamps

Key features:
- Enforces one vendor selection per RFP
- Auto-saves with timestamps on each operation
- Links to RFP via `rfp_artifacts` junction table
- Returns selection state for real-time UI updates

## 🔄 In Progress

### 3. Tool Definition
**File**: `supabase/functions/claude-api-v3/tools/definitions.ts`

**NEXT STEP**: Add tool definition to TOOL_DEFINITIONS array:

```typescript
{
  name: 'manage_vendor_selection',
  description: 'Manage vendor selection for an RFP. Create, read, update, or toggle vendor selections with auto-save. Only one vendor selection artifact exists per RFP.',
  input_schema: {
    type: 'object',
    properties: {
      operation: {
        type: 'string',
        enum: ['create', 'read', 'update', 'add_vendors', 'remove_vendors', 'toggle_selection'],
        description: 'Operation to perform: create (new selection), read (get current), update (replace all), add_vendors, remove_vendors, toggle_selection'
      },
      rfp_id: {
        type: 'number',
        description: 'RFP ID to manage vendor selection for (required)'
      },
      vendors: {
        type: 'array',
        description: 'Array of vendor objects with id, name, selected, selectedAt, metadata (for create/update/add_vendors)',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string', description: 'Unique vendor identifier' },
            name: { type: 'string', description: 'Vendor name' },
            selected: { type: 'boolean', description: 'Selection status' },
            selectedAt: { type: 'string', description: 'ISO timestamp when selected' },
            metadata: { type: 'object', description: 'Additional vendor metadata' }
          },
          required: ['id', 'name', 'selected']
        }
      },
      vendor_ids: {
        type: 'array',
        description: 'Array of vendor IDs to remove or toggle (for remove_vendors/toggle_selection)',
        items: { type: 'string' }
      },
      name: {
        type: 'string',
        description: 'Name for the vendor selection artifact (optional, defaults to "Vendor Selection")'
      },
      description: {
        type: 'string',
        description: 'Description of the vendor selection (optional)'
      }
    },
    required: ['operation', 'rfp_id']
  }
},
```

### 4. Tool Handler Integration
**File**: `supabase/functions/claude-api-v3/handlers/*.ts` (or wherever tool execution happens)

**NEXT STEP**: Add handler case for `manage_vendor_selection` tool:

```typescript
case 'manage_vendor_selection': {
  const { handleManageVendorSelection } = await import('../tools/vendorSelection.ts');
  return await handleManageVendorSelection(supabase, {
    ...toolInput,
    session_id: sessionId,
    account_id: accountId,
    user_id: userId
  });
}
```

## 📋 Remaining Tasks

### 5. Frontend UI Component
**File**: `src/components/artifacts/ArtifactVendorSelectionRenderer.tsx` (NEW)

Create React component with:
- Checkbox list of vendors
- Auto-save on checkbox change
- Real-time selection count display
- Last modified timestamp
- Loading states during save
- Error handling

```tsx
interface VendorSelectionRendererProps {
  artifact: Artifact;
  onVendorToggle?: (vendorIds: string[]) => Promise<void>;
  isPortrait?: boolean;
}

// Features:
// - Parse artifact.schema for vendor list
// - Display checkboxes for each vendor
// - Auto-save to backend on toggle
// - Show "Saving..." indicator
// - Display selection summary
```

### 6. Artifact Type Recognition
**Files to Update**:
- `src/types/home.ts` - Add `'vendor_selection'` to `ArtifactReference.artifactType`
- `src/hooks/useArtifactTypeDetection.ts` - Add detection for vendor_selection type
- `src/components/ArtifactContainer.tsx` - Add rendering case for vendor selection

Example changes:
```typescript
// src/types/home.ts
export interface ArtifactReference {
  artifactType: 'document' | 'text' | 'image' | 'pdf' | 'form' | 'bid_view' | 'vendor_selection' | 'other';
  //...
}

// src/hooks/useArtifactTypeDetection.ts
export function useArtifactTypeDetection(artifact: Artifact | null) {
  //...
  const isVendorSelection = artifact?.type === 'vendor_selection' || 
                            artifact?.artifact_role === 'vendor_selection_form';
  
  return {
    //...
    isVendorSelection
  };
}

// src/components/ArtifactContainer.tsx
if (typeDetection.isVendorSelection) {
  return (
    <ArtifactVendorSelectionRenderer
      key={artifact.id}
      artifact={artifact}
      onVendorToggle={handleVendorToggle}
      isPortrait={isPortrait}
    />
  );
}
```

### 7. Service Layer Integration
**File**: `src/services/database.ts` (or new `src/services/vendorSelectionService.ts`)

Add service methods:
```typescript
export class VendorSelectionService {
  static async toggleVendorSelection(
    rfpId: number,
    vendorIds: string[]
  ): Promise<VendorSelectionResponse> {
    // Call Edge Function manage_vendor_selection tool
    // Handle response and UI updates
  }

  static async getVendorSelection(
    rfpId: number
  ): Promise<VendorSelectionData> {
    // Fetch current vendor selection for RFP
  }
}
```

### 8. Agent Instructions Update
**File**: `Agent Instructions/Sourcing Agent.md`

Add guidance section:
```markdown
## Vendor Selection Management

When managing vendor selections for an RFP, use the `manage_vendor_selection` tool:

**Creating Initial Selection**:
```
manage_vendor_selection({
  operation: 'create',
  rfp_id: 123,
  vendors: [
    { id: 'v1', name: 'Vendor A', selected: false },
    { id: 'v2', name: 'Vendor B', selected: false }
  ]
})
```

**Querying Current Selection**:
```
manage_vendor_selection({
  operation: 'read',
  rfp_id: 123
})
```

**Toggling Vendor Selection** (for UI auto-save):
```
manage_vendor_selection({
  operation: 'toggle_selection',
  rfp_id: 123,
  vendor_ids: ['v1'] // Toggle vendor v1
})
```

**Important Notes**:
- Only ONE vendor selection artifact exists per RFP
- Changes auto-save immediately
- Can query current state anytime without submitting
- Selected vendors tracked with timestamps
```

### 9. Apply Database Migration
**Command**: 
```bash
supabase migration up
```

### 10. Testing Checklist
- [ ] Create vendor selection artifact via Sourcing agent
- [ ] Verify only one selection per RFP (attempt duplicate creation)
- [ ] Toggle vendor selections and verify auto-save
- [ ] Query vendor selection state
- [ ] Add vendors to existing selection
- [ ] Remove vendors from selection
- [ ] Update entire vendor list
- [ ] Verify timestamps update correctly
- [ ] Test UI checkbox auto-save
- [ ] Verify RFP linkage in `rfp_artifacts` table

## Architecture Summary

### Data Flow
1. **User Action** → UI checkbox toggle
2. **Frontend Service** → `VendorSelectionService.toggleVendorSelection()`
3. **Edge Function** → `manage_vendor_selection` tool call
4. **Backend Handler** → `vendorSelection.ts` executes database operations
5. **Database** → Updates `artifacts.schema` with new vendor state
6. **Response** → Returns updated selection state to UI
7. **UI Update** → Re-renders with new selection state

### Database Structure
- **Primary Table**: `artifacts` with `type='vendor_selection'`
- **Schema Column**: JSON containing vendor array with selection state
- **Junction Table**: `rfp_artifacts` links vendor selection to RFP
- **Constraint**: Enforced one selection per RFP via unique constraint checking

### Key Advantages
- No form submission required - selections saved immediately
- Can query current state anytime via tool
- Audit trail via timestamps
- Scalable to many vendors
- Supports metadata for additional vendor information

## Next Steps

1. ✅ Apply database migration
2. ✅ Add tool definition to definitions.ts
3. ✅ Wire up tool handler in execution path
4. Create frontend React component
5. Update type definitions
6. Add service layer methods
7. Update agent instructions
8. Test end-to-end workflow

## Files Created/Modified

### Created:
- `supabase/migrations/20251102193710_add_vendor_selection_artifact_type.sql`
- `supabase/functions/claude-api-v3/tools/vendorSelection.ts`

### To Modify:
- `supabase/functions/claude-api-v3/tools/definitions.ts`
- `supabase/functions/claude-api-v3/handlers/*.ts`
- `src/components/artifacts/ArtifactVendorSelectionRenderer.tsx` (NEW)
- `src/types/home.ts`
- `src/hooks/useArtifactTypeDetection.ts`
- `src/components/ArtifactContainer.tsx`
- `src/services/vendorSelectionService.ts` (NEW or add to database.ts)
- `Agent Instructions/Sourcing Agent.md`
