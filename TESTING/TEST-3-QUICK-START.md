# Test 3: Text File Upload - Ready to Execute

## ✅ Pre-Test Status: All Systems Ready

### Environment
- ✅ Database migrations applied
- ✅ `generate-embedding` edge function deployed (v9)
- ✅ Dev server running on http://localhost:3100
- ✅ Supabase local running on port 54321
- ✅ Test files available in `TESTING/test-files/`

### UI Components Verified
- ✅ Paperclip button is VISIBLE (not hidden)
- ✅ Button has `data-testid="attach-file-button"`
- ✅ File upload functionality implemented
- ✅ Toast notifications configured

## 🎯 How to Execute Test

### Quick Start (5 minutes)

1. **Open App**
   ```
   URL: http://localhost:3100
   Login: mskiba@esphere.com / thisisatest
   ```

2. **Open Browser Console**
   - Press F12
   - Click "Console" tab
   - Keep open to monitor logs

3. **Upload Test File**
   - Look for paperclip icon (📎) left of message input
   - Click paperclip
   - Select: `TESTING/test-files/product-specs.txt`
   - Observe: file chip appears, toast notification

4. **Verify Upload**
   ```bash
   # Run in terminal
   ./TESTING/verify-file-upload.sh
   ```

5. **Test Knowledge Retrieval** (wait 15 seconds first)
   - Type: "What are the key features of the ACME SmartWidget Pro?"
   - Send message
   - Verify Claude mentions: quad-core processor, WiFi 6E, security features

## 📋 Detailed Instructions

See: `TESTING/manual-test-text-upload.md`

Complete step-by-step guide with:
- Screenshots of expected UI
- Console log examples
- Database verification queries
- Troubleshooting steps
- Success criteria checklist

## 🔍 What to Look For

### Immediate Feedback (< 1 second)
- File chip appears below input
- Toast: "File uploaded successfully! Embedding will be generated shortly."
- Console log: `[FileProcessingService] Uploading file: product-specs.txt`

### Database Storage (< 2 seconds)
- Run: `./TESTING/verify-file-upload.sh`
- Verify file record exists with metadata
- Embedding status initially shows "Pending"

### Embedding Generation (10-15 seconds)
- Run verification script again
- Embedding status changes to "Generated (1024 dims)"
- Console may show embedding generation logs

### Knowledge Retrieval (< 3 seconds)
- Send question about file content
- Console: `[KnowledgeRetrievalService] Searching knowledge base`
- Console: `[useMessageHandling] Appending knowledge context`
- Claude response references file content

## ✅ Success Criteria

**Must Pass All:**
- [ ] Paperclip icon visible and clickable
- [ ] File selection dialog opens with correct filters
- [ ] File chip displays with filename
- [ ] Toast notification appears
- [ ] Database record created (verify with script)
- [ ] Embedding generated (1024 dimensions)
- [ ] Knowledge retrieval finds file
- [ ] Claude uses file content in response

## 🐛 Common Issues

### Issue: Can't find paperclip icon
**Solution:** Make sure you're on the Home page with an active session. Scroll to bottom of page. Icon is left of "chat here..." input.

### Issue: Upload fails with error
**Check:** 
- Browser console for error details
- Verify file is under 5MB
- Ensure file type is supported (.txt, .md)

### Issue: No embedding after 30 seconds
**Check:**
```bash
# View edge function logs
supabase functions logs generate-embedding --follow

# In another terminal, upload file again and watch logs
```

### Issue: Claude doesn't use file
**Check:**
1. Verify embedding exists: `./TESTING/verify-file-upload.sh`
2. Check console for knowledge retrieval logs
3. Try more specific question about file content
4. Verify you're asking in same session that uploaded file

## 📊 Test Report Template

After testing, document results:

```
===========================================
Test 3: Text File Upload
Date: November 12, 2025
Tester: [Your Name]
===========================================

FILE UPLOAD UI:
[ ] Pass  [ ] Fail  [ ] Partial
Notes: 

TOAST NOTIFICATIONS:
[ ] Pass  [ ] Fail  [ ] Partial
Notes: 

DATABASE STORAGE:
[ ] Pass  [ ] Fail  [ ] Partial
Notes: 

EMBEDDING GENERATION:
[ ] Pass  [ ] Fail  [ ] Partial
Notes: 

KNOWLEDGE RETRIEVAL:
[ ] Pass  [ ] Fail  [ ] Partial
Notes: 

OVERALL RESULT:
[ ] All tests passed - Ready for next test
[ ] Partial pass - Issues found but feature works
[ ] Failed - Blocking issues require fixes

ISSUES FOUND:
1. 
2. 

RECOMMENDATIONS:
1. 
2. 
```

## 🚀 Next Steps

After Test 3 passes:
- [ ] Mark todo item #3 complete
- [ ] Proceed to Test 4: Image Upload
- [ ] Test 6: Full knowledge retrieval workflow
- [ ] Test 7: File Knowledge Manager UI

## 📞 Need Help?

**Quick Commands:**
```bash
# Check upload status
./TESTING/verify-file-upload.sh

# View edge function logs
supabase functions logs generate-embedding

# Check database directly
docker exec supabase_db_rfpez-app-local psql -U postgres -d postgres -c "
SELECT file_name, LEFT(content, 50), 
       CASE WHEN embedding IS NULL THEN 'Pending' ELSE 'Generated' END 
FROM account_memories 
WHERE file_name IS NOT NULL 
ORDER BY created_at DESC LIMIT 3;"
```

**Documentation:**
- Full guide: `TESTING/manual-test-text-upload.md`
- Test plan: `TESTING/file-upload-knowledge-base-testing-guide.md`
- README: `TESTING/README.md`

---

**You're all set! The paperclip is ready, the database is ready, the test files are ready. Just follow the Quick Start above and you'll complete Test 3 in 5 minutes.** 🎯
