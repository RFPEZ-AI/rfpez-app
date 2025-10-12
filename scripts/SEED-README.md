# Database Seeding Scripts

## Overview
These scripts populate your local Supabase database with test data for RFPEZ.AI development.

## Quick Start

### Windows
```bash
scripts\seed-local-data.bat
```

### Linux/Mac
```bash
scripts/seed-local-data.sh
```

## What Gets Seeded

### RFPs (3 total)
1. **LED Lighting Procurement** (ID: 1)
   - Status: draft
   - 2 artifacts: buyer questionnaire + supplier bid form
   
2. **Office Furniture Replacement** (ID: 2)
   - Status: draft
   - 1 artifact: supplier bid form
   
3. **IT Services Contract** (ID: 3)
   - Status: gathering_requirements
   - 1 artifact: supplier bid form

### Artifacts (4 total)
- Form artifacts with JSON schemas
- Linked to RFPs via rfp_artifacts junction table
- Include default values and submit actions

## Prerequisites

1. **Supabase Running**: Start Supabase first
   ```bash
   supabase start
   ```

2. **User Profile**: Login to the app first to create your user profile
   - Open http://localhost:3100
   - Login with your Supabase auth credentials
   - This automatically creates your user_profiles record

## Usage Workflow

### Step 1: Seed the Database
```bash
# Windows
scripts\seed-local-data.bat

# Linux/Mac
scripts/seed-local-data.sh
```

### Step 2: Use the Application
1. Open http://localhost:3100
2. Login (if not already)
3. Create a new session (or use existing)
4. Set current RFP to "LED Lighting Procurement"
5. Open artifact dropdown - should show 2 artifacts
6. Check browser console for debug logs

## Verification

### Check RFPs and Artifact Counts
```sql
SELECT r.id, r.name, COUNT(ra.artifact_id) as artifact_count
FROM rfps r
LEFT JOIN rfp_artifacts ra ON r.id = ra.rfp_id
GROUP BY r.id, r.name;
```

### Test Fixed RPC Function
```sql
SELECT artifact_id, artifact_name, artifact_role, 
       created_at IS NOT NULL as has_created_at
FROM get_rfp_artifacts(1);
```

### View All Artifacts
```sql
SELECT id, name, artifact_role, created_at
FROM artifacts
ORDER BY created_at DESC;
```

## Data Structure

### Artifacts Table
- `id`: Unique text identifier (e.g., 'led-bulb-specs-001')
- `name`: Display name
- `artifact_role`: 'bid_form' | 'buyer_questionnaire' | 'request_document' | 'template'
- `schema`: JSON Schema for form structure
- `ui_schema`: UI customization (widgets, help text)
- `default_values`: Pre-filled form data
- `submit_action`: Action to take on form submit
- `created_at`: Timestamp (critical for dropdown display)

### RFP_Artifacts Junction Table
- `rfp_id`: Links to RFPs table
- `artifact_id`: Links to artifacts table
- `role`: 'buyer' | 'supplier' | 'evaluator'

## Troubleshooting

### "Supabase database container is not running"
**Solution**: Start Supabase first
```bash
supabase start
```

### Blank Artifact Dropdown After Seeding
**Checklist**:
1. ✅ Did you login to create user profile?
2. ✅ Did you set current RFP context?
3. ✅ Check browser console for debug logs
4. ✅ Verify data with SQL queries above

### Data Already Exists
The script will TRUNCATE tables before inserting, so running it multiple times is safe (but will delete any manual test data).

## Files

- `seed-test-data.sql` - Main SQL seed script
- `seed-local-data.sh` - Linux/Mac wrapper script
- `seed-local-data.bat` - Windows wrapper script
- `SEED-README.md` - This file

## Related Documentation

- [Database Reset Incident](../DOCUMENTATION/database-reset-incident-2025-10-11.md)
- [Deployment Guide](../DOCUMENTATION/DEPLOYMENT-GUIDE.md)
- [Agents Documentation](../DOCUMENTATION/AGENTS.md)

## Notes

- **User Profiles**: Not seeded because they require Supabase auth
- **Sessions**: Not seeded because they require user_profiles
- **Messages**: Created automatically when using the app
- **Data Preservation**: The script preserves database schema while replacing data

## Recovery Scenario

If you accidentally run `supabase db reset` (which you should never do), use this seeding script to quickly restore test data structure.

## Future Enhancements

- [ ] Add bid_items seeding
- [ ] Add bid_submissions seeding
- [ ] Add evaluation criteria seeding
- [ ] Create multiple user profiles with different roles
- [ ] Seed complete workflow states (draft → published → awarded)
