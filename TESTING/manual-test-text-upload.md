# Manual Test Execution: Text File Upload

## Test 3: Text File Upload - Step by Step Guide

### Current Status
- ✅ Migrations applied
- ✅ Database ready
- ✅ Dev server running at http://localhost:3100
- ✅ Test files ready in `TESTING/test-files/`

### Manual Test Steps

#### Step 1: Ensure You're Logged In
1. Open http://localhost:3100 in your browser
2. If not logged in, use credentials:
   - Email: `mskiba@esphere.com`
   - Password: `thisisatest`

#### Step 2: Open Browser Console
1. Press **F12** to open Developer Tools
2. Click **Console** tab
3. Keep this open to monitor upload logs

#### Step 3: Create New Session or Use Existing
- You can use the existing "Travel Management Company RFP" session
- OR click the "+" button to create a new session

#### Step 4: Locate the Paperclip Icon
1. Scroll to the bottom of the page
2. Find the message input area (shows "chat here...")
3. Look for the **paperclip icon (📎)** on the LEFT side of the input
4. It should be visible (no longer hidden)

#### Step 5: Click Paperclip and Upload Test File
1. Click the paperclip icon
2. File selection dialog should open
3. Navigate to: `C:\Dev\RFPEZ.AI\rfpez-app\TESTING\test-files\`
4. Select: **product-specs.txt**
5. Click "Open"

### Expected Immediate Results

#### Visual Feedback:
- ✅ Loading spinner appears briefly
- ✅ File chip displays below input showing "product-specs.txt"
- ✅ Toast notification: "File uploaded successfully! Embedding will be generated shortly."
- ✅ Chip shows file name with an "X" to remove

#### Console Logs (Check F12 Console):
Look for these log messages in sequence:

```
[FileProcessingService] Uploading file: product-specs.txt
[FileProcessingService] Validating file...
[FileProcessingService] Processing file content...
[FileProcessingService] File uploaded successfully
[FileProcessingService] Starting async embedding generation
```

### Step 6: Verify Database Upload

Open a new terminal and run:

```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  file_type,
  file_size_bytes,
  mime_type,
  LEFT(content, 100) as content_preview,
  CASE 
    WHEN embedding IS NULL THEN 'Pending'
    ELSE 'Generated (' || array_length(embedding::real[], 1) || ' dims)'
  END as embedding_status,
  created_at
FROM account_memories
WHERE file_name = 'product-specs.txt'
ORDER BY created_at DESC
LIMIT 1;
"
```

**Expected Output:**
```
file_name          | product-specs.txt
file_type          | text
file_size_bytes    | ~1800 (approximate)
mime_type          | text/plain
content_preview    | Product Specifications: ACME SmartWidget Pro...
embedding_status   | Pending (initially)
created_at         | [current timestamp]
```

### Step 7: Wait for Embedding Generation

**Wait 10-15 seconds**, then run the database query again:

```bash
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT 
  file_name,
  CASE 
    WHEN embedding IS NULL THEN 'Pending'
    ELSE 'Generated (' || array_length(embedding::real[], 1) || ' dims)'
  END as embedding_status
FROM account_memories
WHERE file_name = 'product-specs.txt'
ORDER BY created_at DESC
LIMIT 1;
"
```

**Expected Output:**
```
file_name          | product-specs.txt
embedding_status   | Generated (1024 dims)
```

### Step 8: Test Knowledge Retrieval

1. In the message input, type:
   ```
   What are the key features of the ACME SmartWidget Pro?
   ```

2. Press **Enter** or click send button

3. **Watch the console** for these logs:
   ```
   [KnowledgeRetrievalService] Searching knowledge base with query: "What are the key features..."
   [KnowledgeRetrievalService] Found 1 relevant files
   [useMessageHandling] Appending knowledge context to message
   ```

4. **Verify Claude's Response** mentions:
   - Quad-core processor at 3.2 GHz
   - 16GB RAM
   - WiFi 6E connectivity
   - Security features (biometric authentication, TPM 2.0)
   - Battery backup: up to 8 hours

### Troubleshooting

#### Issue: Paperclip icon not visible
**Solution:** Check that you're on the Home page with an active session. The paperclip should be to the left of the "chat here..." input field.

#### Issue: File upload fails
**Check:**
1. Browser console for error messages
2. Network tab (F12 → Network) for failed API calls
3. Verify migrations applied: `supabase migration list`

#### Issue: Toast notification doesn't appear
**Check:**
1. Look at top of screen for toast
2. Check console for JavaScript errors
3. Verify IonToast component is rendering

#### Issue: No embedding generated after 30 seconds
**Check:**
1. Edge function logs: `supabase functions logs generate-embedding --follow`
2. Verify edge function deployed: `supabase functions list`
3. Check database for embedding: run Step 7 query

#### Issue: Claude doesn't use file content
**Check:**
1. Verify embedding exists (Step 7)
2. Check console logs for knowledge retrieval
3. Try asking a more specific question about file content
4. Verify accountId matches between upload and session

### Success Criteria ✅

- [ ] Paperclip icon is visible and clickable
- [ ] File selection dialog opens
- [ ] File chip appears after selection
- [ ] Toast notification shows success message
- [ ] Console logs show upload sequence
- [ ] Database record created with file metadata
- [ ] Embedding generated (1024 dimensions)
- [ ] Knowledge retrieval finds the file
- [ ] Claude's response uses file content

### If All Tests Pass

Mark todo item #3 as complete and proceed to:
- Test 4: Image Upload
- Test 6: Knowledge Retrieval Integration (full workflow)
- Test 7: File Knowledge Manager UI

### Record Your Results

Create a test report:

```
Date: November 12, 2025
Tester: [Your Name]
Test: Text File Upload

Results:
- File upload UI: ⬜ Pass / ⬜ Fail
- Toast notification: ⬜ Pass / ⬜ Fail  
- Database storage: ⬜ Pass / ⬜ Fail
- Embedding generation: ⬜ Pass / ⬜ Fail
- Knowledge retrieval: ⬜ Pass / ⬜ Fail

Issues Found:
[List any issues]

Notes:
[Add observations]
```

---

## Quick Reference Commands

```bash
# Check recent uploads
./TESTING/verify-file-upload.sh

# View edge function logs
supabase functions logs generate-embedding --follow

# Check specific file
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT * FROM account_memories WHERE file_name = 'product-specs.txt';"

# Count knowledge files
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT COUNT(*) FROM account_memories 
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL;"
```
