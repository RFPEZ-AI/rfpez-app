


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."generate_bid_submission_token"("rfp_id_param" integer, "supplier_id_param" integer DEFAULT NULL::integer, "expires_hours" integer DEFAULT 72) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  token_data JSONB;
  encoded_token TEXT;
BEGIN
  -- Create token payload
  token_data := jsonb_build_object(
    'rfp_id', rfp_id_param,
    'supplier_id', supplier_id_param,
    'exp', extract(epoch from (now() + make_interval(hours => expires_hours))),
    'iat', extract(epoch from now()),
    'type', 'bid_submission'
  );
  
  -- In a real implementation, this would be signed with a secret
  -- For now, we'll just base64 encode it (NOT SECURE - just for demo)
  encoded_token := encode(token_data::text::bytea, 'base64');
  
  RETURN encoded_token;
END;
$$;


ALTER FUNCTION "public"."generate_bid_submission_token"("rfp_id_param" integer, "supplier_id_param" integer, "expires_hours" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_bid_response"("bid_id_param" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    result JSONB;
BEGIN
  -- Try new schema first - get submission data from linked artifact
  SELECT s.submission_data INTO result
  FROM public.bids b
  JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id
  WHERE b.id = bid_id_param;
  
  IF result IS NOT NULL THEN
    RETURN result;
  END IF;
  
  -- Fallback to legacy schema
  SELECT response INTO result
  FROM public.bids 
  WHERE id = bid_id_param;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_bid_response"("bid_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_latest_submission"("artifact_id_param" "text", "session_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT submission_data INTO result
  FROM public.artifact_submissions
  WHERE artifact_id = artifact_id_param
  AND (session_id_param IS NULL OR session_id = session_id_param)
  ORDER BY submitted_at DESC
  LIMIT 1;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_latest_submission"("artifact_id_param" "text", "session_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_rfp_artifacts"("rfp_id_param" integer) RETURNS TABLE("artifact_id" "text", "artifact_name" "text", "artifact_type" "text", "artifact_role" "text", "schema" "jsonb", "ui_schema" "jsonb", "form_data" "jsonb", "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as artifact_id,
    a.name as artifact_name,
    a.type as artifact_type,
    ra.role as artifact_role,
    a.schema,
    a.ui_schema,
    a.form_data,
    a.created_at
  FROM public.artifacts a
  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id
  WHERE ra.rfp_id = rfp_id_param
  AND a.status = 'active'
  ORDER BY ra.role, a.created_at;
END;
$$;


ALTER FUNCTION "public"."get_rfp_artifacts"("rfp_id_param" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_session_active_agent"("session_uuid" "uuid") RETURNS TABLE("agent_id" "uuid", "agent_name" "text", "agent_instructions" "text", "agent_initial_prompt" "text", "agent_avatar_url" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as agent_id,
    a.name as agent_name,
    a.instructions as agent_instructions,
    a.initial_prompt as agent_initial_prompt,
    a.avatar_url as agent_avatar_url
  FROM public.agents a
  INNER JOIN public.session_agents sa ON a.id = sa.agent_id
  WHERE sa.session_id = session_uuid 
    AND sa.is_active = true
    AND a.is_active = true
  ORDER BY sa.started_at DESC
  LIMIT 1;
END;
$$;


ALTER FUNCTION "public"."get_session_active_agent"("session_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_sessions_with_stats"("user_uuid" "uuid") RETURNS TABLE("id" "uuid", "title" "text", "description" "text", "created_at" timestamp with time zone, "updated_at" timestamp with time zone, "message_count" bigint, "last_message" "text", "last_message_at" timestamp with time zone, "artifact_count" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.title,
    s.description,
    s.created_at,
    s.updated_at,
    COALESCE(msg_stats.message_count, 0) as message_count,
    msg_stats.last_message,
    msg_stats.last_message_at,
    COALESCE(art_stats.artifact_count, 0) as artifact_count
  FROM public.sessions s
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as message_count,
      MAX(content) as last_message,
      MAX(created_at) as last_message_at
    FROM public.messages 
    WHERE role = 'user'
    GROUP BY session_id
  ) msg_stats ON s.id = msg_stats.session_id
  LEFT JOIN (
    SELECT 
      session_id,
      COUNT(*) as artifact_count
    FROM public.artifacts
    GROUP BY session_id
  ) art_stats ON s.id = art_stats.session_id
  WHERE s.user_id = user_uuid AND s.is_archived = FALSE
  ORDER BY s.updated_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_sessions_with_stats"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  current_agent_id UUID;
BEGIN
  -- Get the current agent from the user's current session
  SELECT s.current_agent_id INTO current_agent_id
  FROM public.user_profiles up
  JOIN public.sessions s ON up.current_session_id = s.id
  WHERE up.supabase_user_id = user_uuid;
  
  RETURN current_agent_id;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") IS 'Gets the user''s current agent ID via their current session';



CREATE OR REPLACE FUNCTION "public"."get_user_current_session"("user_uuid" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    session_id_var uuid;
    profile_id_var uuid;
BEGIN
    -- First get the user profile ID from the Supabase auth user ID
    SELECT id INTO profile_id_var
    FROM user_profiles 
    WHERE supabase_user_id = user_uuid;
    
    -- If no profile found, return null
    IF profile_id_var IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Try to get the current_session_id from user_profiles using the profile ID
    SELECT current_session_id INTO session_id_var
    FROM user_profiles 
    WHERE id = profile_id_var;
    
    -- If current_session_id is not null and the session exists, return it
    IF session_id_var IS NOT NULL THEN
        IF EXISTS (SELECT 1 FROM sessions WHERE id = session_id_var AND user_id = profile_id_var) THEN
            RETURN session_id_var;
        END IF;
    END IF;
    
    -- Otherwise, get the most recent session for this user (using profile ID)
    SELECT id INTO session_id_var
    FROM sessions 
    WHERE user_id = profile_id_var 
    ORDER BY updated_at DESC, created_at DESC 
    LIMIT 1;
    
    -- Update the user profile with this session ID
    IF session_id_var IS NOT NULL THEN
        UPDATE user_profiles 
        SET current_session_id = session_id_var 
        WHERE id = profile_id_var;
    END IF;
    
    RETURN session_id_var;
END;
$$;


ALTER FUNCTION "public"."get_user_current_session"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_users_by_role"("role_filter" "text" DEFAULT NULL::"text") RETURNS TABLE("id" "uuid", "supabase_user_id" "uuid", "email" "text", "full_name" "text", "avatar_url" "text", "role" "text", "last_login" timestamp with time zone, "created_at" timestamp with time zone, "updated_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  IF role_filter IS NULL THEN
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    ORDER BY u.created_at DESC;
  ELSE
    RETURN QUERY 
    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at 
    FROM public.user_profiles u
    WHERE u.role = role_filter
    ORDER BY u.created_at DESC;
  END IF;
END;
$$;


ALTER FUNCTION "public"."get_users_by_role"("role_filter" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Find the user profile ID from the supabase user ID
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;
    RETURN FALSE;
  END IF;
  
  -- Update the user profile with current session only
  UPDATE public.user_profiles 
  SET 
    current_session_id = COALESCE(session_uuid, current_session_id),
    updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user context: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid" DEFAULT NULL::"uuid", "agent_uuid" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Find the user profile ID from the supabase user ID
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  IF user_profile_id IS NULL THEN
    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;
    RETURN FALSE;
  END IF;
  
  -- Update the user profile with current session and/or agent
  UPDATE public.user_profiles 
  SET 
    current_session_id = COALESCE(session_uuid, current_session_id),
    current_agent_id = COALESCE(agent_uuid, current_agent_id),
    updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating user context: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid", "agent_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_user_current_session"("user_uuid" "uuid", "session_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get the user profile ID from supabase_user_id
  SELECT id INTO user_profile_id 
  FROM public.user_profiles 
  WHERE supabase_user_id = user_uuid;
  
  IF user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Update the current session
  UPDATE public.user_profiles 
  SET current_session_id = session_uuid,
      updated_at = NOW()
  WHERE id = user_profile_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."set_user_current_session"("user_uuid" "uuid", "session_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."switch_session_agent"("session_uuid" "uuid", "new_agent_uuid" "uuid", "user_uuid" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
DECLARE
  session_user_id UUID;
BEGIN
  -- Verify the session belongs to the user
  SELECT user_id INTO session_user_id 
  FROM public.sessions 
  WHERE id = session_uuid;
  
  IF session_user_id != user_uuid THEN
    RETURN FALSE;
  END IF;
  
  -- Deactivate current agent
  UPDATE public.session_agents 
  SET is_active = false, ended_at = NOW()
  WHERE session_id = session_uuid AND is_active = true;
  
  -- Add new active agent
  INSERT INTO public.session_agents (session_id, agent_id, is_active)
  VALUES (session_uuid, new_agent_uuid, true);
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION "public"."switch_session_agent"("session_uuid" "uuid", "new_agent_uuid" "uuid", "user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_artifact_submissions_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_artifact_submissions_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_session_context_with_agent"("session_uuid" "uuid", "rfp_id_param" integer DEFAULT NULL::integer, "artifact_id_param" "uuid" DEFAULT NULL::"uuid", "agent_id_param" "uuid" DEFAULT NULL::"uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  UPDATE public.sessions 
  SET 
    current_rfp_id = COALESCE(rfp_id_param, current_rfp_id),
    current_artifact_id = COALESCE(artifact_id_param, current_artifact_id),
    current_agent_id = COALESCE(agent_id_param, current_agent_id),
    updated_at = NOW()
  WHERE id = session_uuid;
  
  RETURN FOUND;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error updating session context: %', SQLERRM;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION "public"."update_session_context_with_agent"("session_uuid" "uuid", "rfp_id_param" integer, "artifact_id_param" "uuid", "agent_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_form_spec"("spec" "jsonb") RETURNS boolean
    LANGUAGE "plpgsql"
    SET "search_path" TO ''
    AS $$
BEGIN
  -- Basic validation that form_spec has required structure
  RETURN (
    spec IS NULL OR (
      jsonb_typeof(spec) = 'object' AND
      spec ? 'version' AND
      spec ? 'schema' AND
      jsonb_typeof(spec->'schema') = 'object'
    )
  );
END;
$$;


ALTER FUNCTION "public"."validate_form_spec"("spec" "jsonb") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "instructions" "text" NOT NULL,
    "initial_prompt" "text" NOT NULL,
    "avatar_url" "text",
    "is_active" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "is_default" boolean DEFAULT false,
    "is_restricted" boolean DEFAULT false,
    "is_free" boolean DEFAULT false,
    "role" "text"
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."agents"."role" IS 'Functional role of the agent (e.g., sales, design, support, assistant, audit, billing, etc.)';



CREATE TABLE IF NOT EXISTS "public"."artifact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "artifact_id" "text",
    "session_id" "uuid",
    "user_id" "uuid",
    "submission_data" "jsonb" NOT NULL,
    "form_version" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "ip_address" "inet",
    "user_agent" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."artifact_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."artifacts" (
    "id" "text" NOT NULL,
    "user_id" "uuid",
    "session_id" "uuid",
    "message_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "type" "text" DEFAULT 'form'::"text" NOT NULL,
    "file_type" "text",
    "file_size" bigint,
    "storage_path" "text",
    "mime_type" "text",
    "schema" "jsonb",
    "ui_schema" "jsonb" DEFAULT '{}'::"jsonb",
    "default_values" "jsonb" DEFAULT '{}'::"jsonb",
    "submit_action" "jsonb" DEFAULT '{"type": "save_session"}'::"jsonb",
    "is_template" boolean DEFAULT false,
    "template_category" "text",
    "template_tags" "text"[],
    "artifact_role" "text" NOT NULL,
    "status" "text" DEFAULT 'active'::"text",
    "processing_status" "text" DEFAULT 'completed'::"text",
    "processed_content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "artifacts_new_artifact_role_check" CHECK (("artifact_role" = ANY (ARRAY['buyer_questionnaire'::"text", 'bid_form'::"text", 'request_document'::"text", 'template'::"text"]))),
    CONSTRAINT "artifacts_new_processing_status_check" CHECK (("processing_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'completed'::"text", 'failed'::"text"]))),
    CONSTRAINT "artifacts_new_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'deleted'::"text"]))),
    CONSTRAINT "artifacts_new_type_check" CHECK (("type" = ANY (ARRAY['form'::"text", 'document'::"text", 'image'::"text", 'pdf'::"text", 'template'::"text", 'other'::"text"])))
);


ALTER TABLE "public"."artifacts" OWNER TO "postgres";


COMMENT ON COLUMN "public"."artifacts"."default_values" IS 'Default/pre-filled form values for form artifacts';



CREATE TABLE IF NOT EXISTS "public"."bids" (
    "id" integer NOT NULL,
    "rfp_id" integer,
    "agent_id" integer NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "response" "jsonb" DEFAULT '{}'::"jsonb",
    "artifact_submission_id" "uuid",
    "supplier_id" integer
);


ALTER TABLE "public"."bids" OWNER TO "postgres";


COMMENT ON COLUMN "public"."bids"."response" IS 'Vendor response data captured from the form_spec form';



COMMENT ON COLUMN "public"."bids"."supplier_id" IS 'Foreign key reference to supplier_profiles table - identifies which supplier submitted this bid';



CREATE SEQUENCE IF NOT EXISTS "public"."bid_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."bid_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."bid_id_seq" OWNED BY "public"."bids"."id";



CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "message_order" integer DEFAULT 0 NOT NULL,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "ai_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "agent_id" "uuid",
    "agent_name" "text",
    CONSTRAINT "messages_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'assistant'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfp_artifacts" (
    "rfp_id" integer NOT NULL,
    "artifact_id" "text" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "rfp_artifacts_new_role_check" CHECK (("role" = ANY (ARRAY['buyer'::"text", 'supplier'::"text", 'evaluator'::"text"])))
);


ALTER TABLE "public"."rfp_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."rfps" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "due_date" "date",
    "description" "text" DEFAULT ''::"text",
    "is_template" boolean DEFAULT false,
    "is_public" boolean DEFAULT false,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "specification" "text" DEFAULT ''::"text",
    "status" "text" DEFAULT 'draft'::"text",
    "completion_percentage" integer DEFAULT 0,
    CONSTRAINT "rfps_completion_percentage_check" CHECK ((("completion_percentage" >= 0) AND ("completion_percentage" <= 100))),
    CONSTRAINT "rfps_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'gathering_requirements'::"text", 'generating_forms'::"text", 'collecting_responses'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."rfps" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."rfp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."rfp_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."rfp_id_seq" OWNED BY "public"."rfps"."id";



CREATE TABLE IF NOT EXISTS "public"."session_agents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "uuid" NOT NULL,
    "agent_id" "uuid",
    "started_at" timestamp with time zone DEFAULT "now"(),
    "ended_at" timestamp with time zone,
    "is_active" boolean DEFAULT true
);


ALTER TABLE "public"."session_agents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."session_artifacts" (
    "session_id" "uuid" NOT NULL,
    "artifact_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."session_artifacts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "title" "text" DEFAULT 'New Session'::"text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "session_metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "current_agent_id" "uuid",
    "current_rfp_id" integer,
    "current_artifact_id" "text"
);


ALTER TABLE "public"."sessions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."sessions"."current_agent_id" IS 'Reference to the agent being used in this session';



COMMENT ON COLUMN "public"."sessions"."current_rfp_id" IS 'Reference to the current RFP being worked on in this session';



COMMENT ON COLUMN "public"."sessions"."current_artifact_id" IS 'Reference to the current artifact being worked on in this session';



CREATE TABLE IF NOT EXISTS "public"."supplier_profiles" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "email" "text",
    "phone" "text",
    "rfpez_account_id" integer
);


ALTER TABLE "public"."supplier_profiles" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."supplier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."supplier_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."supplier_id_seq" OWNED BY "public"."supplier_profiles"."id";



CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text",
    "full_name" "text",
    "avatar_url" "text",
    "last_login" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "supabase_user_id" "uuid" NOT NULL,
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "current_session_id" "uuid",
    "current_rfp_id" integer,
    CONSTRAINT "user_profiles_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'developer'::"text", 'administrator'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


COMMENT ON COLUMN "public"."user_profiles"."role" IS 'User role in ascending order of access: user, developer, administrator';



COMMENT ON COLUMN "public"."user_profiles"."current_session_id" IS 'Reference to the user''s currently active session (agent context derived from session)';



ALTER TABLE ONLY "public"."bids" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."bid_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."rfps" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."rfp_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."supplier_profiles" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."supplier_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artifact_submissions"
    ADD CONSTRAINT "artifact_submissions_new_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_new_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bid_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."rfp_artifacts"
    ADD CONSTRAINT "rfp_artifacts_new_pkey" PRIMARY KEY ("rfp_id", "artifact_id", "role");



ALTER TABLE ONLY "public"."rfps"
    ADD CONSTRAINT "rfp_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_agents"
    ADD CONSTRAINT "session_agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."session_artifacts"
    ADD CONSTRAINT "session_artifacts_pkey" PRIMARY KEY ("session_id", "artifact_id");



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."supplier_profiles"
    ADD CONSTRAINT "supplier_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_agents_access" ON "public"."agents" USING "btree" ("is_active", "is_restricted", "sort_order");



CREATE INDEX "idx_agents_active" ON "public"."agents" USING "btree" ("is_active", "sort_order");



CREATE INDEX "idx_agents_default" ON "public"."agents" USING "btree" ("is_default") WHERE ("is_default" = true);



CREATE INDEX "idx_agents_free" ON "public"."agents" USING "btree" ("is_free");



CREATE INDEX "idx_agents_restricted" ON "public"."agents" USING "btree" ("is_restricted");



CREATE INDEX "idx_agents_role" ON "public"."agents" USING "btree" ("role");



CREATE INDEX "idx_artifact_submissions_new_artifact_id" ON "public"."artifact_submissions" USING "btree" ("artifact_id");



CREATE INDEX "idx_artifact_submissions_new_session_id" ON "public"."artifact_submissions" USING "btree" ("session_id");



CREATE INDEX "idx_artifact_submissions_new_submitted_at" ON "public"."artifact_submissions" USING "btree" ("submitted_at");



CREATE INDEX "idx_artifact_submissions_new_user_id" ON "public"."artifact_submissions" USING "btree" ("user_id");



CREATE INDEX "idx_artifacts_new_artifact_role" ON "public"."artifacts" USING "btree" ("artifact_role");



CREATE INDEX "idx_artifacts_new_created_at" ON "public"."artifacts" USING "btree" ("created_at");



CREATE INDEX "idx_artifacts_new_session_id" ON "public"."artifacts" USING "btree" ("session_id");



CREATE INDEX "idx_artifacts_new_status" ON "public"."artifacts" USING "btree" ("status");



CREATE INDEX "idx_artifacts_new_template" ON "public"."artifacts" USING "btree" ("is_template") WHERE ("is_template" = true);



CREATE INDEX "idx_artifacts_new_type" ON "public"."artifacts" USING "btree" ("type");



CREATE INDEX "idx_artifacts_new_user_id" ON "public"."artifacts" USING "btree" ("user_id");



CREATE INDEX "idx_bid_response" ON "public"."bids" USING "gin" ("response");



CREATE INDEX "idx_bids_artifact_submission_id" ON "public"."bids" USING "btree" ("artifact_submission_id");



CREATE INDEX "idx_bids_supplier_id" ON "public"."bids" USING "btree" ("supplier_id");



CREATE INDEX "idx_messages_agent_id" ON "public"."messages" USING "btree" ("agent_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_messages_order" ON "public"."messages" USING "btree" ("session_id", "message_order");



CREATE INDEX "idx_messages_session_id" ON "public"."messages" USING "btree" ("session_id");



CREATE INDEX "idx_messages_user_id" ON "public"."messages" USING "btree" ("user_id");



CREATE INDEX "idx_rfp_artifacts_new_artifact_id" ON "public"."rfp_artifacts" USING "btree" ("artifact_id");



CREATE INDEX "idx_rfp_artifacts_new_rfp_id" ON "public"."rfp_artifacts" USING "btree" ("rfp_id");



CREATE INDEX "idx_rfp_artifacts_new_role" ON "public"."rfp_artifacts" USING "btree" ("role");



CREATE INDEX "idx_rfps_completion" ON "public"."rfps" USING "btree" ("completion_percentage");



CREATE INDEX "idx_rfps_status" ON "public"."rfps" USING "btree" ("status");



CREATE INDEX "idx_session_agents_active" ON "public"."session_agents" USING "btree" ("session_id", "is_active");



CREATE INDEX "idx_session_agents_agent_id" ON "public"."session_agents" USING "btree" ("agent_id");



CREATE INDEX "idx_session_agents_session_id" ON "public"."session_agents" USING "btree" ("session_id");



CREATE INDEX "idx_sessions_created_at" ON "public"."sessions" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_sessions_current_agent_id" ON "public"."sessions" USING "btree" ("current_agent_id");



CREATE INDEX "idx_sessions_current_artifact_id" ON "public"."sessions" USING "btree" ("current_artifact_id");



CREATE INDEX "idx_sessions_current_rfp_id" ON "public"."sessions" USING "btree" ("current_rfp_id");



CREATE INDEX "idx_sessions_user_id" ON "public"."sessions" USING "btree" ("user_id");



CREATE INDEX "idx_user_profiles_current_session_id" ON "public"."user_profiles" USING "btree" ("current_session_id");



CREATE INDEX "idx_user_profiles_role" ON "public"."user_profiles" USING "btree" ("role");



CREATE UNIQUE INDEX "idx_user_profiles_supabase_user_id" ON "public"."user_profiles" USING "btree" ("supabase_user_id") WHERE ("supabase_user_id" IS NOT NULL);



CREATE OR REPLACE TRIGGER "update_agents_updated_at" BEFORE UPDATE ON "public"."agents" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_artifacts_new_updated_at" BEFORE UPDATE ON "public"."artifacts" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_sessions_updated_at" BEFORE UPDATE ON "public"."sessions" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."artifact_submissions"
    ADD CONSTRAINT "artifact_submissions_new_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifact_submissions"
    ADD CONSTRAINT "artifact_submissions_new_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifact_submissions"
    ADD CONSTRAINT "artifact_submissions_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_new_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_new_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."artifacts"
    ADD CONSTRAINT "artifacts_new_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_artifact_submission_id_fkey" FOREIGN KEY ("artifact_submission_id") REFERENCES "public"."artifact_submissions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bids"
    ADD CONSTRAINT "bids_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."supplier_profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfp_artifacts"
    ADD CONSTRAINT "rfp_artifacts_new_artifact_id_fkey" FOREIGN KEY ("artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."rfp_artifacts"
    ADD CONSTRAINT "rfp_artifacts_new_rfp_id_fkey" FOREIGN KEY ("rfp_id") REFERENCES "public"."rfps"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."session_agents"
    ADD CONSTRAINT "session_agents_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."session_agents"
    ADD CONSTRAINT "session_agents_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_current_agent_id_fkey" FOREIGN KEY ("current_agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_current_artifact_id_fkey" FOREIGN KEY ("current_artifact_id") REFERENCES "public"."artifacts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_current_rfp_id_fkey" FOREIGN KEY ("current_rfp_id") REFERENCES "public"."rfps"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."sessions"
    ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."user_profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_current_session_id_fkey" FOREIGN KEY ("current_session_id") REFERENCES "public"."sessions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_supabase_user_id_fkey" FOREIGN KEY ("supabase_user_id") REFERENCES "auth"."users"("id");



CREATE POLICY "Allow authenticated users to create RFPs" ON "public"."rfps" FOR INSERT TO "authenticated" WITH CHECK (true);



CREATE POLICY "Allow authenticated users to delete agents" ON "public"."agents" FOR DELETE USING (true);



CREATE POLICY "Allow authenticated users to insert agents" ON "public"."agents" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update RFPs" ON "public"."rfps" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to update agents" ON "public"."agents" FOR UPDATE USING (true) WITH CHECK (true);



CREATE POLICY "Allow authenticated users to view RFPs" ON "public"."rfps" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Allow public bid submissions" ON "public"."bids" FOR INSERT TO "anon", "authenticated" WITH CHECK (true);



CREATE POLICY "Allow public supplier viewing" ON "public"."supplier_profiles" FOR SELECT USING (true);



CREATE POLICY "Allow updating bids" ON "public"."bids" FOR UPDATE TO "authenticated" USING (true) WITH CHECK (true);



CREATE POLICY "Allow viewing bids" ON "public"."bids" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Anyone can view active agents" ON "public"."agents" FOR SELECT USING (("is_active" = true));



CREATE POLICY "Authenticated users can manage RFP artifacts" ON "public"."rfp_artifacts" USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "RFP artifacts are publicly readable" ON "public"."rfp_artifacts" FOR SELECT USING (true);



CREATE POLICY "Users can create session artifacts in own sessions" ON "public"."session_artifacts" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "user_profiles"."supabase_user_id"
   FROM ("public"."user_profiles"
     JOIN "public"."sessions" ON (("sessions"."user_id" = "user_profiles"."id")))
  WHERE ("sessions"."id" = "session_artifacts"."session_id"))));



CREATE POLICY "Users can create their own artifacts" ON "public"."artifacts" FOR INSERT WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Users can create their own submissions" ON "public"."artifact_submissions" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own profile" ON "public"."user_profiles" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") = "supabase_user_id"));



CREATE POLICY "Users can delete session artifacts from own sessions" ON "public"."session_artifacts" FOR DELETE USING (("auth"."uid"() IN ( SELECT "user_profiles"."supabase_user_id"
   FROM ("public"."user_profiles"
     JOIN "public"."sessions" ON (("sessions"."user_id" = "user_profiles"."id")))
  WHERE ("sessions"."id" = "session_artifacts"."session_id"))));



CREATE POLICY "Users can delete their own artifacts" ON "public"."artifacts" FOR DELETE USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") = "supabase_user_id"));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") = "supabase_user_id"));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") = "supabase_user_id"));



CREATE POLICY "Users can update their own artifacts" ON "public"."artifacts" FOR UPDATE USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL))) WITH CHECK ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL)));



CREATE POLICY "Users can view session artifacts from own sessions" ON "public"."session_artifacts" FOR SELECT USING (("auth"."uid"() IN ( SELECT "user_profiles"."supabase_user_id"
   FROM ("public"."user_profiles"
     JOIN "public"."sessions" ON (("sessions"."user_id" = "user_profiles"."id")))
  WHERE ("sessions"."id" = "session_artifacts"."session_id"))));



CREATE POLICY "Users can view their own artifacts and public artifacts" ON "public"."artifacts" FOR SELECT USING ((("user_id" = "auth"."uid"()) OR ("user_id" IS NULL) OR (("status" = 'active'::"text") AND ("is_template" = true))));



CREATE POLICY "Users can view their own submissions" ON "public"."artifact_submissions" FOR SELECT USING (("user_id" = "auth"."uid"()));



ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artifact_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."bids" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_delete_optimized" ON "public"."messages" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "messages"."session_id"))));



CREATE POLICY "messages_insert_optimized" ON "public"."messages" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "messages"."session_id"))));



CREATE POLICY "messages_select_optimized" ON "public"."messages" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "messages"."session_id"))));



CREATE POLICY "messages_update_optimized" ON "public"."messages" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "messages"."session_id"))));



ALTER TABLE "public"."rfp_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."rfps" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."session_agents" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "session_agents_delete_optimized" ON "public"."session_agents" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "session_agents"."session_id"))));



CREATE POLICY "session_agents_insert_optimized" ON "public"."session_agents" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "session_agents"."session_id"))));



CREATE POLICY "session_agents_select_optimized" ON "public"."session_agents" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "session_agents"."session_id"))));



CREATE POLICY "session_agents_update_optimized" ON "public"."session_agents" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "up"."supabase_user_id"
   FROM ("public"."user_profiles" "up"
     JOIN "public"."sessions" "s" ON (("up"."id" = "s"."user_id")))
  WHERE ("s"."id" = "session_agents"."session_id"))));



ALTER TABLE "public"."session_artifacts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "sessions_delete_optimized" ON "public"."sessions" FOR DELETE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "user_profiles"."supabase_user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "sessions"."user_id"))));



CREATE POLICY "sessions_insert_optimized" ON "public"."sessions" FOR INSERT WITH CHECK ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "user_profiles"."supabase_user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "sessions"."user_id"))));



CREATE POLICY "sessions_select_optimized" ON "public"."sessions" FOR SELECT USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "user_profiles"."supabase_user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "sessions"."user_id"))));



CREATE POLICY "sessions_update_optimized" ON "public"."sessions" FOR UPDATE USING ((( SELECT "auth"."uid"() AS "uid") IN ( SELECT "user_profiles"."supabase_user_id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."id" = "sessions"."user_id"))));



ALTER TABLE "public"."supplier_profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





























































































































































































GRANT ALL ON FUNCTION "public"."generate_bid_submission_token"("rfp_id_param" integer, "supplier_id_param" integer, "expires_hours" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."generate_bid_submission_token"("rfp_id_param" integer, "supplier_id_param" integer, "expires_hours" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_bid_submission_token"("rfp_id_param" integer, "supplier_id_param" integer, "expires_hours" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_bid_response"("bid_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_bid_response"("bid_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_bid_response"("bid_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_latest_submission"("artifact_id_param" "text", "session_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_latest_submission"("artifact_id_param" "text", "session_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_latest_submission"("artifact_id_param" "text", "session_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_rfp_artifacts"("rfp_id_param" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_rfp_artifacts"("rfp_id_param" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_rfp_artifacts"("rfp_id_param" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_session_active_agent"("session_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_session_active_agent"("session_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_session_active_agent"("session_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_sessions_with_stats"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_sessions_with_stats"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_sessions_with_stats"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_current_agent"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_current_session"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_current_session"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_current_session"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_filter" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_filter" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_users_by_role"("role_filter" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid", "agent_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid", "agent_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_current_context"("user_uuid" "uuid", "session_uuid" "uuid", "agent_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_user_current_session"("user_uuid" "uuid", "session_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_user_current_session"("user_uuid" "uuid", "session_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_user_current_session"("user_uuid" "uuid", "session_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."switch_session_agent"("session_uuid" "uuid", "new_agent_uuid" "uuid", "user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."switch_session_agent"("session_uuid" "uuid", "new_agent_uuid" "uuid", "user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."switch_session_agent"("session_uuid" "uuid", "new_agent_uuid" "uuid", "user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_artifact_submissions_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_artifact_submissions_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_artifact_submissions_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_session_context_with_agent"("session_uuid" "uuid", "rfp_id_param" integer, "artifact_id_param" "uuid", "agent_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_session_context_with_agent"("session_uuid" "uuid", "rfp_id_param" integer, "artifact_id_param" "uuid", "agent_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_session_context_with_agent"("session_uuid" "uuid", "rfp_id_param" integer, "artifact_id_param" "uuid", "agent_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_form_spec"("spec" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."validate_form_spec"("spec" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_form_spec"("spec" "jsonb") TO "service_role";
























GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."artifact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."artifact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."artifact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."artifacts" TO "anon";
GRANT ALL ON TABLE "public"."artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."bids" TO "anon";
GRANT ALL ON TABLE "public"."bids" TO "authenticated";
GRANT ALL ON TABLE "public"."bids" TO "service_role";



GRANT ALL ON SEQUENCE "public"."bid_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."bid_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."bid_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."rfp_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."rfp_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."rfp_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."rfps" TO "anon";
GRANT ALL ON TABLE "public"."rfps" TO "authenticated";
GRANT ALL ON TABLE "public"."rfps" TO "service_role";



GRANT ALL ON SEQUENCE "public"."rfp_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."rfp_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."rfp_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."session_agents" TO "anon";
GRANT ALL ON TABLE "public"."session_agents" TO "authenticated";
GRANT ALL ON TABLE "public"."session_agents" TO "service_role";



GRANT ALL ON TABLE "public"."session_artifacts" TO "anon";
GRANT ALL ON TABLE "public"."session_artifacts" TO "authenticated";
GRANT ALL ON TABLE "public"."session_artifacts" TO "service_role";



GRANT ALL ON TABLE "public"."sessions" TO "anon";
GRANT ALL ON TABLE "public"."sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."sessions" TO "service_role";



GRANT ALL ON TABLE "public"."supplier_profiles" TO "anon";
GRANT ALL ON TABLE "public"."supplier_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."supplier_profiles" TO "service_role";



GRANT ALL ON SEQUENCE "public"."supplier_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."supplier_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."supplier_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" GRANT ALL ON TABLES TO "authenticated";




























RESET ALL;

