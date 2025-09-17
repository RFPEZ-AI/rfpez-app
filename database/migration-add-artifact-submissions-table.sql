-- Migration: Add artifact_submissions table for tracking form submissions
-- Date: 2025-01-20
-- Description: Creates table to track when users submit forms created by AI agents

-- Create artifact_submissions table for tracking form submissions
CREATE TABLE IF NOT EXISTS public.artifact_submissions (
  id SERIAL PRIMARY KEY,
  artifact_id TEXT NOT NULL REFERENCES public.form_artifacts(id) ON DELETE CASCADE,
  session_id TEXT, -- Optional session tracking
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_data JSONB NOT NULL DEFAULT '{}'::jsonb, -- The actual form data submitted
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'processed', 'error')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_artifact_id ON public.artifact_submissions(artifact_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_session_id ON public.artifact_submissions(session_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_user_id ON public.artifact_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_artifact_submissions_created_at ON public.artifact_submissions(created_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.artifact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for artifact_submissions
-- Allow users to see their own submissions
CREATE POLICY "Users can view their own artifact submissions" ON public.artifact_submissions
  FOR SELECT
  USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- Allow users to insert their own submissions
CREATE POLICY "Users can insert their own artifact submissions" ON public.artifact_submissions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- Allow users to update their own submissions
CREATE POLICY "Users can update their own artifact submissions" ON public.artifact_submissions
  FOR UPDATE
  USING ((select auth.uid()) = user_id OR user_id IS NULL)
  WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);

-- Allow users to delete their own submissions
CREATE POLICY "Users can delete their own artifact submissions" ON public.artifact_submissions
  FOR DELETE
  USING ((select auth.uid()) = user_id OR user_id IS NULL);

-- Add a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_artifact_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_artifact_submissions_updated_at
  BEFORE UPDATE ON public.artifact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_submissions_updated_at();