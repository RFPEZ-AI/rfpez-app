# File Upload & Knowledge Base Testing

This directory contains comprehensive testing resources for the file upload and knowledge base feature.

## 📁 Directory Structure

```
TESTING/
├── file-upload-knowledge-base-testing-guide.md  # Comprehensive testing guide
├── run-upload-tests.sh                          # Pre-flight check script
├── verify-file-upload.sh                        # Database verification script
└── test-files/                                  # Sample files for testing
    ├── product-specs.txt                        # Product specifications
    ├── remote-work-policy.md                    # Company policy document
    └── meeting-notes.txt                        # Meeting notes
```

## 🚀 Quick Start

### 1. Run Pre-flight Checks

Before starting manual testing, verify everything is set up:

```bash
./TESTING/run-upload-tests.sh
```

This checks:
- ✅ Supabase is running
- ✅ Dev server is accessible
- ✅ Database migrations applied
- ✅ Vector search function exists
- ✅ Current knowledge base status

### 2. Manual Testing

1. Open app: http://localhost:3100
2. Log in: `mskiba@esphere.com` / `thisisatest`
3. Create new session
4. Click paperclip icon 📎
5. Upload test file from `test-files/`
6. Open browser console (F12) to see logs
7. Wait 10 seconds for embedding generation
8. Ask question about file content
9. Verify Claude's response uses the file

**Example test flow:**
```
Upload: product-specs.txt
Wait: 10 seconds
Ask: "What are the key features of the SmartWidget Pro?"
Expect: Claude mentions quad-core processor, WiFi 6E, security features, etc.
```

### 3. Verify Database State

After uploading files, check database:

```bash
./TESTING/verify-file-upload.sh
```

This verifies:
- ✅ File metadata populated
- ✅ Embeddings are 1024 dimensions
- ✅ File type distribution
- ✅ Indexes exist
- ✅ Vector search function works
- ✅ Embedding generation statistics

## 📋 Testing Guide

See `file-upload-knowledge-base-testing-guide.md` for:
- Complete test plan (7 test suites)
- Expected results for each test
- Database verification queries
- Error handling scenarios
- Performance benchmarks
- Issue reporting template

## 🧪 Test Files

### product-specs.txt
- **Use case:** Product information retrieval
- **Test questions:**
  - "What are the key features of the SmartWidget Pro?"
  - "What is the price of this product?"
  - "What warranty is included?"

### remote-work-policy.md
- **Use case:** Policy and compliance queries
- **Test questions:**
  - "What are the eligibility requirements for remote work?"
  - "How much can I be reimbursed for internet costs?"
  - "What security requirements must I follow when working remotely?"

### meeting-notes.txt
- **Use case:** Meeting context and action items
- **Test questions:**
  - "When is the product launch date?"
  - "What are the marketing campaign details?"
  - "What action items were assigned to Mike?"

## 🔍 Console Log Monitoring

Watch for these logs in browser console during testing:

### File Upload
```
[FileProcessingService] Uploading file: product-specs.txt
[FileProcessingService] File uploaded successfully
[FileProcessingService] Starting async embedding generation
```

### Knowledge Retrieval
```
[KnowledgeRetrievalService] Searching knowledge base with query: "..."
[KnowledgeRetrievalService] Found 3 relevant files
[useMessageHandling] Appending knowledge context to message
```

### File Manager
```
[FileKnowledgeManager] Loading files for account: abc-123
[KnowledgeRetrievalService] Fetching files with limit/offset
[KnowledgeRetrievalService] Deleting file: xyz-789
```

## 📊 Database Queries

### Check uploaded files
```sql
SELECT file_name, file_type, file_size_bytes, 
       CASE WHEN embedding IS NULL THEN 'Pending' ELSE 'Generated' END as status
FROM account_memories
WHERE memory_type = 'knowledge' AND file_name IS NOT NULL
ORDER BY created_at DESC;
```

### Test vector search
```sql
SELECT file_name, LEFT(content, 100), similarity
FROM match_account_memories(
  query_embedding := (SELECT embedding FROM account_memories LIMIT 1),
  match_threshold := 0.7,
  match_count := 5
);
```

### Check embedding dimensions
```sql
SELECT file_name, array_length(embedding::real[], 1) as dimensions
FROM account_memories
WHERE embedding IS NOT NULL
LIMIT 5;
```

## ✅ Test Checklist

### Core Functionality
- [ ] Text file upload (.txt, .md)
- [ ] Image upload (.jpg, .png, .gif, .webp)
- [ ] Document upload (.pdf, .docx, .xlsx)
- [ ] File size validation (5MB for images, 10MB for docs)
- [ ] Unsupported file type rejection
- [ ] File chip display after upload
- [ ] Toast notifications

### Knowledge Retrieval
- [ ] Semantic search triggers on message send
- [ ] Knowledge context appended to message
- [ ] Claude response uses file content
- [ ] Multiple files ranked by relevance
- [ ] Similarity threshold filtering (default 0.7)

### File Management UI
- [ ] File listing shows all uploads
- [ ] Search by filename works
- [ ] Search by content works
- [ ] File type filters work
- [ ] Pull-to-refresh reloads data
- [ ] Delete removes file with confirmation
- [ ] Re-embed regenerates embedding
- [ ] Empty state displays correctly

### Database & Performance
- [ ] All file metadata columns populated
- [ ] Embeddings are 1024 dimensions
- [ ] Indexes used in queries
- [ ] Vector search completes < 100ms
- [ ] No orphaned files (embedding = NULL after 1 min)

## 🐛 Known Issues

Track issues in: `TESTING/issues.md` (create if needed)

## 📝 Next Steps

After successful testing:

1. **Local Environment**
   - ✅ All tests passing locally
   - Document any issues found
   - Create fix branches if needed

2. **Deployment**
   - Deploy migrations: `supabase db push`
   - Verify edge function: `generate-embedding` is deployed
   - Test against remote database
   - Monitor edge function logs

3. **Documentation**
   - Update user documentation
   - Create video walkthrough
   - Add to feature changelog

## 💡 Tips

- **Wait for embeddings:** Give 10-15 seconds after upload before testing retrieval
- **Check console:** Browser console shows detailed logs for debugging
- **Use test files:** The provided test files have rich content for semantic search
- **Database first:** Always verify database state before blaming UI
- **Network tab:** Monitor API calls in browser DevTools Network tab

## 🆘 Troubleshooting

### File upload fails
1. Check browser console for errors
2. Verify accountId is set (console log)
3. Check Supabase is running: `supabase status`
4. Verify migrations applied: `supabase migration list`

### No embedding generated
1. Wait 15-30 seconds (async process)
2. Check edge function logs: `supabase functions logs generate-embedding`
3. Verify edge function deployed: `supabase functions list`
4. Check database: `SELECT * FROM account_memories WHERE file_name = 'yourfile.txt'`

### Knowledge not retrieved
1. Verify embedding exists in database
2. Check similarity threshold (default 0.7)
3. Try lower threshold in code (0.5 for testing)
4. Verify accountId matches between upload and session
5. Check console logs for search results

### File Manager not showing files
1. Verify logged in with correct account
2. Check accountId prop passed to component
3. Check RLS policies allow read access
4. Look for API errors in Network tab

## 📞 Support

For issues or questions:
- Create GitHub issue with test results
- Include browser console logs
- Attach database query results
- Provide steps to reproduce
