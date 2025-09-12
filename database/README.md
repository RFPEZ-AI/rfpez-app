# RFPEZ.AI Supabase Setup Guide

This guide will help you set up the Supabase database for storing RFPEZ.AI session history.

## � **IMPORTANT: Authentication Fixes Applied**

**Before running any database setup**, note that authentication fixes have been applied (September 2025):
- Fixed duplicate RLS policy conflicts
- Resolved PKCE authentication flow issues  
- Standardized user_profiles table policies

**For authentication troubleshooting**, see: `../AUTHENTICATION_FIXES.md`

## �📋 Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Project Created**: Create a new Supabase project
3. **Environment Variables**: Your `.env` should have:
   ```
   REACT_APP_SUPABASE_URL=your_supabase_url
   REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

## 🔧 **Quick Setup (Recommended)**

1. **Run Main Schema**: Copy and paste `schema.sql` in Supabase SQL Editor
2. **Apply RLS Fixes**: Run `fix-user-profiles-rls-policies.sql` (if needed)
3. **Verify Setup**: Check that authentication works without console errors

## 🗄️ Database Schema

### Tables Overview

1. **`user_profiles`** - Extended user information
2. **`sessions`** - Chat sessions
3. **`messages`** - Individual messages in sessions
4. **`artifacts`** - Files and documents
5. **`session_artifacts`** - Junction table for session-artifact relationships

### Schema Diagram
```
auth.users (Supabase built-in)
    ↓
user_profiles
    ↓
sessions ←→ session_artifacts ←→ artifacts
    ↓              ↓
messages ←---------┘
```

## 🛠️ Setup Steps

### Step 1: Run the Schema Script

1. **Open Supabase Dashboard**: Go to your project dashboard
2. **Navigate to SQL Editor**: Click on "SQL Editor" in the sidebar
3. **Create New Query**: Click "New Query"
4. **Copy and Paste**: Copy the entire content from `database/schema.sql` and paste it
5. **Run**: Click "Run" to execute the script

### Step 2: Apply RLS Policy Fixes (If Needed)

**⚠️ Only run this if you encounter authentication issues:**

1. **Check for Errors**: If you see "policy already exists" errors or authentication fails
2. **Run Fix Script**: Copy and paste `database/fix-user-profiles-rls-policies.sql` 
3. **Execute**: Click "Run" to clean up conflicting policies
4. **Verify**: Check that login works without console errors

### Step 3: Set Up Storage for Artifacts

1. **Navigate to Storage**: Click on "Storage" in the sidebar
2. **Create Bucket**: Click "Create bucket"
3. **Bucket Name**: Enter `artifacts`
4. **Public**: Set to `false` (private bucket)
5. **Create**: Click "Create bucket"

### Step 3: Configure Storage Policies

Add these policies to the `artifacts` storage bucket:

```sql
-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload artifacts" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'artifacts' AND auth.role() = 'authenticated');

-- Allow users to view their own artifacts
CREATE POLICY "Users can view own artifacts" ON storage.objects
FOR SELECT USING (bucket_id = 'artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own artifacts
CREATE POLICY "Users can delete own artifacts" ON storage.objects
FOR DELETE USING (bucket_id = 'artifacts' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### Step 4: Enable Authentication

1. **Navigate to Authentication**: Click on "Authentication" in the sidebar
2. **Configure Providers**: Enable the providers you want (Google, GitHub, etc.)
3. **Auth0 Integration**: If using Auth0, configure the integration:
   - Add your Auth0 domain to allowed domains
   - Set up the Auth0 provider in Supabase

## 🔧 Database Functions

The schema includes a helpful function:

### `get_sessions_with_stats(user_uuid)`
Returns sessions with message count, last message, and artifact count:

```sql
SELECT * FROM get_sessions_with_stats('user-uuid-here');
```

## 🔒 Row Level Security (RLS)

All tables have RLS enabled with policies that ensure:

- Users can only access their own data
- Proper cascade deletion when sessions are deleted
- Secure access to associated messages and artifacts

## 📊 Table Structures

### Sessions Table
```sql
sessions (
  id UUID PRIMARY KEY,
  user_id UUID (references auth.users),
  title TEXT,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  is_archived BOOLEAN,
  session_metadata JSONB
)
```

### Messages Table
```sql
messages (
  id UUID PRIMARY KEY,
  session_id UUID (references sessions),
  content TEXT,
  role TEXT ('user'|'assistant'|'system'),
  created_at TIMESTAMP,
  message_order INTEGER,
  metadata JSONB,
  ai_metadata JSONB
)
```

### Artifacts Table
```sql
artifacts (
  id UUID PRIMARY KEY,
  session_id UUID (references sessions),
  message_id UUID (references messages, optional),
  name TEXT,
  file_type TEXT,
  file_size BIGINT,
  storage_path TEXT,
  mime_type TEXT,
  created_at TIMESTAMP,
  metadata JSONB,
  processed_content TEXT,
  processing_status TEXT
)
```

## 🧪 Testing the Setup

After running the schema, test with these queries:

```sql
-- Test user profile creation
INSERT INTO user_profiles (id, email, full_name) 
VALUES (auth.uid(), 'test@example.com', 'Test User');

-- Test session creation
INSERT INTO sessions (user_id, title) 
VALUES (auth.uid(), 'Test Session');

-- Check if everything is working
SELECT * FROM get_sessions_with_stats(auth.uid());
```

## 🔄 Integration with React App

The TypeScript types and database service are already created:

- **Types**: `src/types/database.ts`
- **Service**: `src/services/database.ts`

Use the DatabaseService class in your React components:

```typescript
import { DatabaseService } from '../services/database';

// Create a new session
const session = await DatabaseService.createSession('My RFP Session');

// Add a message
const message = await DatabaseService.addMessage(
  session.id, 
  'Hello RFPEZ.AI!', 
  'user'
);

// Upload an artifact
const storagePath = await DatabaseService.uploadFile(file, session.id);
const artifact = await DatabaseService.addArtifact(
  session.id,
  message.id,
  file.name,
  file.type,
  file.size,
  storagePath,
  file.type
);
```

## 🚀 Next Steps

1. **Run the schema script** in Supabase SQL Editor
2. **Set up the storage bucket** for artifacts
3. **Configure authentication** providers
4. **Test the database functions** with sample data
5. **Integrate with your React app** using the provided service layer

Your RFPEZ.AI app will now be able to persist all session history, messages, and artifacts in Supabase!
