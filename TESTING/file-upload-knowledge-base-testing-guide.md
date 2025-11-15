# File Upload & Knowledge Base Testing Guide

**Date:** November 12, 2025  
**Feature:** File upload to user knowledge base with vector embeddings and semantic search

## ✅ Pre-Test Verification (COMPLETED)

### Database Migrations
- ✅ Migration `20251112235324_add_file_support_to_account_memories.sql` applied
- ✅ Migration `20251113000000_create_match_account_memories_function.sql` applied
- ✅ Database columns verified: `file_name`, `file_type`, `file_size_bytes`, `mime_type`, `original_file_path`
- ✅ Vector search function `match_account_memories` created
- ✅ Indexes verified: `idx_account_memories_file_name`, `idx_account_memories_file_type`, `idx_account_memories_embedding` (hnsw)

### Edge Function Status
- ✅ `generate-embedding` function deployed (Version 9, Updated: 2025-10-22)
- ✅ Expected input: `{ text: string }`
- ✅ Expected output: `{ embedding: number[] }` (1024 dimensions, Voyage AI voyage-2 model)

### UI Components Status
- ✅ `PromptComponent.tsx` - Paperclip icon unhidden, file upload UI complete
- ✅ `FileKnowledgeManager.tsx` - File management modal created
- ✅ `MainMenu.tsx` - "Knowledge Base Files" menu item added
- ✅ `Home.tsx` - Modal integration and state management

### Services Status
- ✅ `FileProcessingService` - Upload, validation, async embedding generation
- ✅ `KnowledgeRetrievalService` - Semantic search, file management, CRUD operations
- ✅ `useMessageHandling` hook - Knowledge retrieval integration before Claude API calls

---

## 🧪 Test Plan

### Test 1: Text File Upload (.txt, .md)

**Objective:** Verify text file upload, content extraction, and embedding generation

**Steps:**
1. Open app at http://localhost:3100
2. Log in with test account: `mskiba@esphere.com` / `thisisatest`
3. Create a new session
4. Click the paperclip icon in the message input area
5. Select a `.txt` or `.md` file (< 5MB)
6. Observe upload process

**Expected Results:**
- ✅ File selection dialog opens with correct file type filters
- ✅ After selection, file chip appears below input with file name
- ✅ Loading spinner shows during upload
- ✅ Toast notification: "File uploaded successfully! Embedding will be generated shortly."
- ✅ File chip remains visible after upload completes

**Database Verification:**
```sql
-- Check file was inserted with correct metadata
SELECT 
  id, 
  file_name, 
  file_type, 
  file_size_bytes, 
  mime_type,
  LEFT(content, 100) as content_preview,
  CASE 
    WHEN embedding IS NULL THEN 'Pending'
    WHEN array_length(embedding::real[], 1) = 1024 THEN 'Valid (1024 dims)'
    ELSE 'Invalid dimensions'
  END as embedding_status,
  created_at
FROM account_memories
WHERE memory_type = 'knowledge'
  AND file_name IS NOT NULL
ORDER BY created_at DESC
LIMIT 5;
```

**Browser Console Checks:**
- Look for: `[FileProcessingService] Uploading file: {name}`
- Look for: `[FileProcessingService] File uploaded successfully`
- Look for: `[FileProcessingService] Starting async embedding generation`
- Check for any errors in red

---

### Test 2: Image Upload (.jpg, .png, .gif, .webp)

**Objective:** Verify image upload, base64 conversion, size validation

**Steps:**
1. Click paperclip icon
2. Select an image file (< 5MB)
3. Try to upload an image > 5MB (should fail validation)

**Expected Results:**
- ✅ Image files under 5MB upload successfully
- ✅ Content stored as base64 data URL (starts with `data:image/`)
- ✅ File size validation rejects files > 5MB
- ✅ Error toast for oversized files: "Image files must be under 5MB"

**Database Verification:**
```sql
-- Check image stored with base64 content
SELECT 
  file_name,
  file_type,
  mime_type,
  file_size_bytes,
  LEFT(content, 50) as base64_preview,
  CASE 
    WHEN content LIKE 'data:image/%' THEN 'Valid base64'
    ELSE 'Invalid format'
  END as content_format
FROM account_memories
WHERE file_type = 'image'
ORDER BY created_at DESC
LIMIT 3;
```

---

### Test 3: Document Upload (.pdf, .docx, .xlsx)

**Objective:** Verify document upload with proper size limits

**Steps:**
1. Upload a PDF file (< 10MB)
2. Upload a DOCX or XLSX file (< 10MB) if supported
3. Try to upload a document > 10MB (should fail)

**Expected Results:**
- ✅ PDF files upload successfully (text extraction may be placeholder)
- ✅ File size validation enforces 10MB limit for documents
- ✅ Error toast for oversized documents: "Document files must be under 10MB"

**Notes:**
- PDF text extraction requires pdf.js library (may not be implemented yet)
- DOCX/XLSX require mammoth.js or similar (may show placeholder content)

---

### Test 4: Knowledge Retrieval Integration

**Objective:** Verify uploaded files are retrieved and used in Claude responses

**Test Scenario:**
1. Upload a text file with specific content (e.g., "Product X has features A, B, and C")
2. Wait 5-10 seconds for embedding generation to complete
3. Send a message: "What features does Product X have?"
4. Check browser console for knowledge retrieval logs
5. Verify Claude's response references the uploaded content

**Expected Results:**
- ✅ Console log: `[KnowledgeRetrievalService] Searching knowledge base with query: "What features does Product X have?"`
- ✅ Console log shows retrieved files with similarity scores
- ✅ Console log: `[useMessageHandling] Appending knowledge context to message`
- ✅ Enhanced message includes section like:
  ```
  Relevant knowledge from your files:
  1. From "product-specs.txt" (85% relevant):
     Product X has features A, B, and C
  ```
- ✅ Claude's response correctly references the file content

**Database Verification:**
```sql
-- Verify file has embedding generated
SELECT 
  file_name,
  CASE 
    WHEN embedding IS NULL THEN 'No embedding'
    WHEN array_length(embedding::real[], 1) = 1024 THEN 'Valid'
    ELSE 'Invalid dimensions'
  END as embedding_status
FROM account_memories
WHERE file_name LIKE '%product%'
LIMIT 1;

-- Test semantic search function directly
SELECT 
  file_name,
  LEFT(content, 100) as preview,
  similarity
FROM match_account_memories(
  query_embedding := (SELECT embedding FROM account_memories WHERE file_name LIKE '%product%' LIMIT 1),
  match_threshold := 0.5,
  match_count := 5,
  filter_account_id := (SELECT account_id FROM sessions WHERE id = 'current-session-id')
);
```

---

### Test 5: File Knowledge Manager UI

**Objective:** Test file management interface

**Steps:**
1. Click menu button (three dots) in header
2. Select "Knowledge Base Files"
3. Verify file listing shows all uploaded files
4. Test search functionality:
   - Type filename in search bar
   - Type content keyword in search bar
   - Verify 300ms debounce (fast typing doesn't trigger immediate search)
5. Test file type filters:
   - Click "Text" chip to filter text files
   - Click "Image" chip to filter images
   - Click same chip again to clear filter
6. Test pull-to-refresh:
   - Pull down on file list
   - Release to trigger refresh
7. Test delete:
   - Click trash icon on a file
   - Verify confirmation dialog appears
   - Confirm deletion
   - Verify file removed from list
   - Check database to confirm deletion
8. Test re-embed:
   - Click refresh icon on a file
   - Verify embedding regeneration triggered
   - Check console for embedding API call

**Expected Results:**
- ✅ Modal opens smoothly
- ✅ Files display with name, type, upload date, MIME type, content preview (200 chars)
- ✅ Search filters files by name and content
- ✅ File type chips show correct counts (e.g., "Text (3)", "Image (2)")
- ✅ Pull-to-refresh reloads file list
- ✅ Delete shows confirmation, removes file, updates UI optimistically
- ✅ Re-embed triggers embedding regeneration
- ✅ Empty state shows when no files exist: "No files uploaded yet"

**Console Checks:**
- Look for: `[FileKnowledgeManager] Loading files for account: {accountId}`
- Look for: `[KnowledgeRetrievalService] Fetching files with limit/offset`
- Look for: `[KnowledgeRetrievalService] Deleting file: {id}`
- Look for: `[KnowledgeRetrievalService] Regenerating embedding for: {id}`

---

### Test 6: Error Handling & Edge Cases

**Objective:** Verify proper error handling for various failure scenarios

**Test Cases:**

#### 6.1 Unsupported File Type
- Try to upload `.exe`, `.zip`, or other unsupported type
- **Expected:** Error toast: "Unsupported file type. Please upload..."

#### 6.2 Empty File
- Create empty file (0 bytes)
- **Expected:** Error toast or graceful handling

#### 6.3 Special Characters in Filename
- Upload file named: `test (copy) [1].txt`
- **Expected:** Uploads successfully, filename stored correctly

#### 6.4 Network Error During Upload
- Simulate network failure (disconnect WiFi mid-upload)
- **Expected:** Error toast: "Error uploading file: [error message]"

#### 6.5 Concurrent Uploads
- Upload 3 files simultaneously
- **Expected:** All files upload successfully, no race conditions

#### 6.6 Embedding Generation Failure
- Check edge function logs if embedding generation fails
- **Expected:** File stored without embedding, error logged, graceful degradation

#### 6.7 File Without Account ID
- Attempt upload without being logged in or in session
- **Expected:** Error: "Account ID is required"

---

### Test 7: Database State & Performance

**Objective:** Verify database integrity and query performance

**Database Checks:**

```sql
-- 1. Verify all file columns populated correctly
SELECT 
  COUNT(*) as total_files,
  COUNT(file_name) as has_filename,
  COUNT(file_type) as has_filetype,
  COUNT(file_size_bytes) as has_size,
  COUNT(mime_type) as has_mimetype,
  COUNT(embedding) as has_embedding,
  AVG(file_size_bytes) as avg_file_size
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL;

-- 2. Check embedding dimensions
SELECT 
  file_name,
  array_length(embedding::real[], 1) as embedding_dimensions
FROM account_memories
WHERE embedding IS NOT NULL
LIMIT 5;

-- 3. Verify indexes are being used
EXPLAIN ANALYZE
SELECT * FROM account_memories
WHERE file_type = 'text' AND account_id = 'test-account-id';

-- 4. Test vector search performance
EXPLAIN ANALYZE
SELECT * FROM match_account_memories(
  query_embedding := (SELECT embedding FROM account_memories LIMIT 1),
  match_threshold := 0.7,
  match_count := 5,
  filter_account_id := 'test-account-id'
);

-- 5. Check file type distribution
SELECT 
  file_type,
  COUNT(*) as count,
  SUM(file_size_bytes) as total_bytes,
  AVG(file_size_bytes) as avg_bytes
FROM account_memories
WHERE memory_type = 'knowledge'
GROUP BY file_type
ORDER BY count DESC;
```

**Expected Results:**
- ✅ All file metadata columns populated
- ✅ Embeddings are 1024 dimensions
- ✅ Indexes used in query plans (check for "Index Scan" not "Seq Scan")
- ✅ Vector search completes in < 100ms for small datasets
- ✅ File type distribution matches uploaded files

---

## 📊 Test Results Template

### Summary
- **Date Tested:** [Date]
- **Tester:** [Name]
- **Environment:** Local Development (http://localhost:3100)
- **Database:** Local Supabase (port 54321)

### Results

| Test Case | Status | Notes |
|-----------|--------|-------|
| Text File Upload | ⬜ Pass / ⬜ Fail | |
| Image Upload | ⬜ Pass / ⬜ Fail | |
| Document Upload | ⬜ Pass / ⬜ Fail | |
| Knowledge Retrieval | ⬜ Pass / ⬜ Fail | |
| File Manager UI - List | ⬜ Pass / ⬜ Fail | |
| File Manager UI - Search | ⬜ Pass / ⬜ Fail | |
| File Manager UI - Filters | ⬜ Pass / ⬜ Fail | |
| File Manager UI - Delete | ⬜ Pass / ⬜ Fail | |
| File Manager UI - Re-embed | ⬜ Pass / ⬜ Fail | |
| Error Handling - Unsupported Type | ⬜ Pass / ⬜ Fail | |
| Error Handling - Size Limit | ⬜ Pass / ⬜ Fail | |
| Error Handling - Network Error | ⬜ Pass / ⬜ Fail | |
| Database State | ⬜ Pass / ⬜ Fail | |
| Performance | ⬜ Pass / ⬜ Fail | |

### Issues Found

1. **Issue:** [Description]
   - **Severity:** High / Medium / Low
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Screenshots/Logs:** [Attach if applicable]

### Recommendations

- [ ] [Recommendation 1]
- [ ] [Recommendation 2]

---

## 🐛 Known Limitations

1. **PDF Text Extraction:** May not be fully implemented (requires pdf.js library integration)
2. **DOCX/XLSX Processing:** May show placeholder content (requires document parsing libraries)
3. **Embedding Generation:** Asynchronous - may take 5-10 seconds for large files
4. **Vector Search:** Requires at least one file with embedding to test match_account_memories function

---

## 📝 Next Steps After Testing

1. **If all tests pass:**
   - Deploy migrations to remote: `supabase db push`
   - Deploy edge functions if updated: `supabase functions deploy generate-embedding`
   - Create production testing plan
   - Update user documentation

2. **If issues found:**
   - Document in GitHub Issues
   - Prioritize by severity
   - Create fix branches
   - Re-test after fixes

3. **Future Enhancements:**
   - Add OCR for images with text
   - Implement full PDF text extraction
   - Add batch file upload
   - Add file preview in modal
   - Add embedding regeneration for all files
   - Add export/import functionality
