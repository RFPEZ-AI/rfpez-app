-- Fix sessions_update_optimized policy to include WITH CHECK clause
-- This prevents 409 Conflict errors when updating sessions

-- Drop the existing policy
DROP POLICY IF EXISTS "sessions_update_optimized" ON "public"."sessions";

-- Recreate with both USING and WITH CHECK clauses
CREATE POLICY "sessions_update_optimized" 
ON "public"."sessions" 
FOR UPDATE 
USING (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.supabase_user_id
    FROM public.user_profiles
    WHERE user_profiles.id = sessions.user_id
  )
)
WITH CHECK (
  (SELECT auth.uid()) IN (
    SELECT user_profiles.supabase_user_id
    FROM public.user_profiles
    WHERE user_profiles.id = sessions.user_id
  )
);

-- Also fix artifact_submissions policy to allow authenticated users
-- The current policy only allows if user_id = auth.uid(), but we need to allow NULL user_id for anonymous
DROP POLICY IF EXISTS "Users can create their own submissions" ON "public"."artifact_submissions";

CREATE POLICY "Users can create submissions" 
ON "public"."artifact_submissions" 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() OR user_id IS NULL
);

-- Fix view policy for artifact_submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON "public"."artifact_submissions";

CREATE POLICY "Users can view submissions" 
ON "public"."artifact_submissions" 
FOR SELECT 
USING (
  user_id = auth.uid() OR user_id IS NULL
);

COMMENT ON POLICY "sessions_update_optimized" ON "public"."sessions" IS 
'Allows users to update their own sessions. Includes WITH CHECK to prevent 409 conflicts.';

COMMENT ON POLICY "Users can create submissions" ON "public"."artifact_submissions" IS 
'Allows authenticated users to create submissions for themselves, or anonymous submissions with NULL user_id.';

COMMENT ON POLICY "Users can view submissions" ON "public"."artifact_submissions" IS 
'Allows users to view their own submissions and anonymous submissions.';
