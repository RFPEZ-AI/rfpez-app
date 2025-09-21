-- Migration to add current RFP and artifact context to sessions
-- This allows sessions to remember the current RFP and artifact context
-- Run this in your Supabase SQL Editor

-- Add current_rfp_id and current_artifact_id to sessions table
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS current_rfp_id INTEGER REFERENCES public.rfps(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS current_artifact_id UUID REFERENCES public.artifacts(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sessions_current_rfp_id ON public.sessions(current_rfp_id);
CREATE INDEX IF NOT EXISTS idx_sessions_current_artifact_id ON public.sessions(current_artifact_id);

-- Update the updated_at timestamp when these fields change
CREATE OR REPLACE FUNCTION update_session_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS update_sessions_updated_at ON public.sessions;
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_updated_at();

-- Add comment to document the new fields
COMMENT ON COLUMN public.sessions.current_rfp_id IS 'Reference to the current RFP being worked on in this session';
COMMENT ON COLUMN public.sessions.current_artifact_id IS 'Reference to the current artifact being worked on in this session';