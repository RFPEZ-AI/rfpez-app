-- Migration: Add form save functionality
-- Date: 2025-10-07
-- Description: Add support for saving form data without full submission

-- Add save-related columns to artifacts table if they don't exist
ALTER TABLE public.artifacts 
ADD COLUMN IF NOT EXISTS last_saved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS save_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}';

-- Create index for better performance on save operations
CREATE INDEX IF NOT EXISTS idx_artifacts_last_saved_at ON public.artifacts(last_saved_at);
CREATE INDEX IF NOT EXISTS idx_artifacts_draft_data ON public.artifacts USING gin(draft_data);

-- Add a function to save form data (draft mode)
CREATE OR REPLACE FUNCTION public.save_form_data(
  artifact_id_param TEXT,
  form_data_param JSONB,
  user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
  -- Update the artifact with draft data and save timestamp
  UPDATE public.artifacts 
  SET 
    draft_data = form_data_param,
    default_values = form_data_param, -- Also update default_values for backward compatibility
    last_saved_at = NOW(),
    save_count = COALESCE(save_count, 0) + 1,
    updated_at = NOW()
  WHERE id = artifact_id_param;
  
  -- Return true if row was updated
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error saving form data: %', SQLERRM;
    RETURN FALSE;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to get form data (including draft data)
CREATE OR REPLACE FUNCTION public.get_form_data(
  artifact_id_param TEXT
) RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Try draft_data first, fallback to default_values
  SELECT COALESCE(draft_data, default_values, '{}') INTO result
  FROM public.artifacts 
  WHERE id = artifact_id_param AND status = 'active';
  
  RETURN COALESCE(result, '{}');
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}';
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policies for the new functionality
-- Note: Existing RLS on artifacts table will cover the new columns

-- Create a view for form save statistics
CREATE OR REPLACE VIEW public.form_save_stats AS
SELECT 
  id as artifact_id,
  name as form_name,
  save_count,
  last_saved_at,
  CASE 
    WHEN draft_data IS NOT NULL AND draft_data != '{}' THEN 'has_draft'
    WHEN default_values IS NOT NULL AND default_values != '{}' THEN 'has_data'
    ELSE 'empty'
  END as data_status,
  created_at,
  updated_at
FROM public.artifacts 
WHERE type = 'form' AND status = 'active';

-- Add trigger to automatically update updated_at when draft_data changes
CREATE OR REPLACE FUNCTION update_artifact_save_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.draft_data IS DISTINCT FROM NEW.draft_data THEN
    NEW.updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_artifact_save_timestamp ON public.artifacts;
CREATE TRIGGER trigger_artifact_save_timestamp
  BEFORE UPDATE ON public.artifacts
  FOR EACH ROW
  EXECUTE FUNCTION update_artifact_save_timestamp();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.save_form_data TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_form_data TO authenticated;
GRANT SELECT ON public.form_save_stats TO authenticated;