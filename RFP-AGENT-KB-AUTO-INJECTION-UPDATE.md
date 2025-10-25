# RFP Agent Knowledge Base - Auto-Injection Update

## Summary
The RFP Design Agent knowledge base contains **extensive outdated references** to manual `rfp_id` parameter passing in tool calls. These need to be updated to reflect the new **automatic RFP injection system** implemented in the Edge Function.

## Changes Required

### 1. Tool Parameter References - Remove `rfp_id`

**Affected Tools:**
- `create_form_artifact` - NO LONGER accepts `rfp_id` parameter
- `create_document_artifact` - NO LONGER accepts `rfp_id` parameter  
- `submit_bid` - NO LONGER accepts `rfp_id` parameter
- `get_rfp_bids` - NO LONGER accepts `rfp_id` parameter

**Old Pattern (OUTDATED):**
```javascript
await create_form_artifact({
  session_id: "uuid",
  rfp_id: rfp.rfp_id,  // ❌ REMOVE - auto-injected now
  title: "Form Title",
  form_schema: { ... }
});
```

**New Pattern (CORRECT):**
```javascript
await create_form_artifact({
  session_id: "uuid",
  // rfp_id is automatically injected from session's current_rfp_id
  title: "Form Title",
  form_schema: { ... }
});
```

### 2. Workflow Updates - Remove Manual RFP ID Tracking

**OLD Workflow (Phase 3):**
1. ❌ "Verify RFP Context - Call get_current_rfp to retrieve rfp_id if needed"
2. ❌ "All artifacts MUST use this rfp_id parameter"

**NEW Workflow (Phase 3):**
1. ✅ "Verify RFP Context - Ensure current RFP is set in session"
2. ✅ "All artifacts automatically use session's current RFP"

### 3. Error Handling Updates

**OLD Error Messages (OUTDATED):**
- ❌ "Error: 'rfp_id is required' - Call create_and_set_rfp FIRST, then use returned rfp_id"
- ❌ "Bids appear in wrong RFP - Wrong rfp_id used - ALWAYS call get_current_rfp() first"

**NEW Error Messages (CORRECT):**
- ✅ "No current RFP set - Call create_and_set_rfp to establish RFP context first"
- ✅ "Artifacts attributed to wrong RFP - Use set_current_rfp to switch RFP context before creating artifacts"

### 4. Demo Bid Workflow - Simplified

**OLD Pattern (OVERLY COMPLEX):**
```javascript
// ❌ Step 1: Get RFP ID manually
const currentRfp = await get_current_rfp();
const rfpId = currentRfp.id;

// ❌ Step 2: Pass rfp_id explicitly
await submit_bid({
  rfp_id: rfpId,  // REMOVE - auto-injected now
  supplier_name: "Example Co",
  bid_price: 10000,
  delivery_days: 14
});
```

**NEW Pattern (STREAMLINED):**
```javascript
// ✅ Just ensure RFP context exists, then submit
// rfp_id is automatically injected from session
await submit_bid({
  supplier_name: "Example Co",
  bid_price: 10000,
  delivery_days: 14
});
```

### 5. Phase 5-6 Workflow - Remove rfp_id References

**OLD (Line 149):**
```javascript
// ❌ Step 2: Generate Bid Submission URL
generate_rfp_bid_url({ rfp_id: current_rfp_id })
```

**NEW:**
```javascript
// ✅ Step 2: Generate Bid Submission URL (auto-uses current RFP)
generate_rfp_bid_url()  // No parameters needed
```

### 6. Critical Rules to Update

**REMOVE These Rules:**
- ❌ "NEVER hardcode rfp_id values"
- ❌ "ALWAYS call get_current_rfp() before submitting ANY bids"
- ❌ "ALWAYS use the returned RFP ID in submit_bid calls"

**ADD These Rules:**
- ✅ "Tools automatically use session's current RFP - no manual tracking needed"
- ✅ "Ensure current RFP is set before creating artifacts (system validates automatically)"
- ✅ "To switch RFP context, use set_current_rfp tool"

### 7. Code Examples to Update

**Lines 439-456 - Demo Bid Examples:**
```javascript
// OLD (REMOVE rfp_id):
submit_bid({
  rfp_id: 69,  // ❌ REMOVE
  supplier_name: "EcoLite Solutions",
  bid_price: 8500,
  delivery_days: 14
})

// NEW (AUTO-INJECTION):
submit_bid({
  supplier_name: "EcoLite Solutions",
  bid_price: 8500,
  delivery_days: 14
})
```

**Line 931 - get_rfp_bids Example:**
```javascript
// OLD:
const bids = await get_rfp_bids({ rfp_id: rfpId });  // ❌ REMOVE rfp_id

// NEW:
const bids = await get_rfp_bids();  // ✅ Auto-uses current RFP
```

## Files to Update

1. **Agent Instructions/RFP Design Agent-knowledge-base.md**
   - Multiple sections reference manual rfp_id tracking
   - Lines: 29, 38, 44, 63, 149, 408, 418, 440, 448, 456, 520, 522, 613, 626, 690, 823, 834, 874, 882, 905, 913, 921, 931

2. **Agent Instructions/RFP Design Agent.md**
   - Main instruction file references rfp_id parameters
   - Lines: 60, 96, 104, 138, 186, 187

## Benefits of Auto-Injection System

### What Changed:
- **Before**: LLM manually tracked and passed `rfp_id` to every tool call
- **After**: Edge function automatically injects `rfp_id` from session context

### Why This Matters:
1. **Eliminates Attribution Errors**: Artifacts can't be assigned to wrong RFP
2. **Simpler for LLM**: No manual parameter tracking across conversation
3. **Better UX**: Session-level RFP context managed server-side
4. **Automatic Recovery**: Clear error messages guide LLM to create RFP first

## Implementation Strategy

### Option 1: Generate SQL Migration (RECOMMENDED)
Use the CLI tool to generate migration from updated markdown:
```bash
node scripts/md-to-sql-migration.js "Agent Instructions/RFP Design Agent-knowledge-base.md"
```

### Option 2: Manual SQL Update
Update the knowledge base entries directly via SQL:
```sql
-- Update specific knowledge entries that reference rfp_id parameters
UPDATE account_memories 
SET content = '[UPDATED_CONTENT_HERE]',
    updated_at = NOW()
WHERE memory_type = 'knowledge'
  AND metadata->>'knowledge_id' IN (
    'rfp-design-phase3-workflow',
    'rfp-design-phase5-6-workflow',
    'rfp-design-demo-bid-workflow',
    'rfp-design-error-troubleshooting'
  );
```

## Verification Checklist

After updating:
- [ ] All references to manual `rfp_id` parameters removed
- [ ] Tool examples show parameter-free calls
- [ ] Error messages reference session context, not parameter passing
- [ ] Workflow steps simplified to remove RFP ID retrieval
- [ ] Demo bid examples updated to exclude `rfp_id`
- [ ] Phase 5-6 workflow updated for `generate_rfp_bid_url()`
- [ ] Agent instructions align with Edge Function implementation

## Next Steps

1. **Update Markdown Files**: Edit both knowledge base and main instructions
2. **Generate Migration**: Use CLI tool to create SQL migration
3. **Apply Locally**: Test with `supabase migration up`
4. **Deploy**: Push to master for GitHub Actions deployment

---

**Date**: October 25, 2025  
**Related**: AUTOMATIC-RFP-ATTRIBUTION-FIX.md
