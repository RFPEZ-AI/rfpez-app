-- Migration: Add form_artifacts table for storing generated forms
-- Date: 2025-09-09
-- Description: Creates a separate table for form artifacts to avoid conflicts with file artifacts

-- Create form_artifacts table for storing generated forms
CREATE TABLE IF NOT EXISTS public.form_artifacts (
  id TEXT PRIMARY KEY, -- Using TEXT to match the generated IDs like 'form_1725123456789_abc123def'
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'form',
  title TEXT NOT NULL,
  description TEXT,
  schema JSONB NOT NULL, -- JSON Schema for the form
  ui_schema JSONB DEFAULT '{}'::jsonb, -- UI Schema for form rendering
  data JSONB DEFAULT '{}'::jsonb, -- Default form data
  submit_action JSONB DEFAULT '{"type": "save_session"}'::jsonb, -- Action to take on form submission
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deleted')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_artifacts_user_id ON public.form_artifacts(user_id);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_type ON public.form_artifacts(type);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_status ON public.form_artifacts(status);
CREATE INDEX IF NOT EXISTS idx_form_artifacts_created_at ON public.form_artifacts(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.form_artifacts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_artifacts
-- Allow users to see their own form artifacts
CREATE POLICY "Users can view their own form artifacts" ON public.form_artifacts
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to insert their own form artifacts
CREATE POLICY "Users can insert their own form artifacts" ON public.form_artifacts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to update their own form artifacts
CREATE POLICY "Users can update their own form artifacts" ON public.form_artifacts
  FOR UPDATE
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Allow users to delete their own form artifacts
CREATE POLICY "Users can delete their own form artifacts" ON public.form_artifacts
  FOR DELETE
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Grant necessary permissions
GRANT ALL ON public.form_artifacts TO authenticated;
GRANT SELECT ON public.form_artifacts TO anon;
