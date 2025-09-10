# Fix form_artifacts Table Missing Error

## Problem
You're seeing this console error:
```
HEAD https://jxlutaztoukwbbgtoulc.supabase.co/rest/v1/form_artifacts?select=count%28*%29 400 (Bad Request)
❌ Form artifacts table check failed: {message: ''}
```

This happens because the `form_artifacts` table doesn't exist in your Supabase database yet.

## Solution

### Option 1: Apply Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `migration-add-form-artifacts-table.sql`
4. Click **Run** to execute the migration

### Option 2: Apply Migration via CLI (if available)

```bash
# If you have Supabase CLI installed and configured
npx supabase db push
```

### Option 3: Manual Table Creation

If you prefer to create the table manually, run this SQL in your Supabase SQL Editor:

```sql
-- Create form_artifacts table for storing generated forms
CREATE TABLE IF NOT EXISTS public.form_artifacts (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'form',
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL,
  ui_schema JSONB DEFAULT '{}'::jsonb,
  data JSONB DEFAULT '{}'::jsonb,
  submit_action JSONB DEFAULT '{"type": "save_session"}'::jsonb,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_form_artifacts_user_id ON public.form_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_type ON public.form_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_status ON public.form_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_created_at ON public.form_artifacts(created_at);

-- Enable RLS
ALTER TABLE public.form_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own form artifacts" ON public.form_artifacts
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own form artifacts" ON public.form_artifacts
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own form artifacts" ON public.form_artifacts
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can delete their own form artifacts" ON public.form_artifacts
  FOR DELETE USING (auth.uid() = user_id OR user_id IS NULL);
```

## After Migration

Once you've applied the migration, refresh your browser and the error should be gone. The application will now be able to store and retrieve form artifacts properly.

## What This Table Does

The `form_artifacts` table stores dynamically generated forms (like questionnaires) that can be displayed in the artifact window. This is separate from file artifacts and allows for interactive form experiences within the application.
