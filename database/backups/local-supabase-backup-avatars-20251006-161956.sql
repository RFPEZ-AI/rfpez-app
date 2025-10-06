--
-- PostgreSQL database dump
--

\restrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

DROP DATABASE IF EXISTS postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = icu LOCALE = 'en_US.UTF-8' ICU_LOCALE = 'en-US';


ALTER DATABASE postgres OWNER TO postgres;

\unrestrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj
\connect postgres
\restrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


--
-- Name: postgres; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE postgres SET "app.settings.jwt_secret" TO 'super-secret-jwt-token-with-at-least-32-characters-long';
ALTER DATABASE postgres SET "app.settings.jwt_exp" TO '3600';


\unrestrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj
\connect postgres
\restrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: _realtime; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA _realtime;


ALTER SCHEMA _realtime OWNER TO postgres;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO supabase_admin;

--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA extensions;


ALTER SCHEMA extensions OWNER TO postgres;

--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql;


ALTER SCHEMA graphql OWNER TO supabase_admin;

--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA graphql_public;


ALTER SCHEMA graphql_public OWNER TO supabase_admin;

--
-- Name: pg_net; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_net; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_net IS 'Async HTTP';


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: pgbouncer
--

CREATE SCHEMA pgbouncer;


ALTER SCHEMA pgbouncer OWNER TO pgbouncer;

--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA realtime;


ALTER SCHEMA realtime OWNER TO supabase_admin;

--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA storage;


ALTER SCHEMA storage OWNER TO supabase_admin;

--
-- Name: supabase_functions; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA supabase_functions;


ALTER SCHEMA supabase_functions OWNER TO supabase_admin;

--
-- Name: supabase_migrations; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA supabase_migrations;


ALTER SCHEMA supabase_migrations OWNER TO postgres;

--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: supabase_admin
--

CREATE SCHEMA vault;


ALTER SCHEMA vault OWNER TO supabase_admin;

--
-- Name: hypopg; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS hypopg WITH SCHEMA extensions;


--
-- Name: EXTENSION hypopg; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION hypopg IS 'Hypothetical indexes for PostgreSQL';


--
-- Name: index_advisor; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS index_advisor WITH SCHEMA extensions;


--
-- Name: EXTENSION index_advisor; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION index_advisor IS 'Query index advisor';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_graphql WITH SCHEMA graphql;


--
-- Name: EXTENSION pg_graphql; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_graphql IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


ALTER TYPE auth.aal_level OWNER TO supabase_auth_admin;

--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


ALTER TYPE auth.code_challenge_method OWNER TO supabase_auth_admin;

--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


ALTER TYPE auth.factor_status OWNER TO supabase_auth_admin;

--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone'
);


ALTER TYPE auth.factor_type OWNER TO supabase_auth_admin;

--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


ALTER TYPE auth.oauth_registration_type OWNER TO supabase_auth_admin;

--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


ALTER TYPE auth.one_time_token_type OWNER TO supabase_auth_admin;

--
-- Name: action; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


ALTER TYPE realtime.action OWNER TO supabase_admin;

--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in'
);


ALTER TYPE realtime.equality_op OWNER TO supabase_admin;

--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text
);


ALTER TYPE realtime.user_defined_filter OWNER TO supabase_admin;

--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


ALTER TYPE realtime.wal_column OWNER TO supabase_admin;

--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: supabase_admin
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


ALTER TYPE realtime.wal_rls OWNER TO supabase_admin;

--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS'
);


ALTER TYPE storage.buckettype OWNER TO supabase_storage_admin;

--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


ALTER FUNCTION auth.email() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


ALTER FUNCTION auth.jwt() OWNER TO supabase_auth_admin;

--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


ALTER FUNCTION auth.role() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: supabase_auth_admin
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


ALTER FUNCTION auth.uid() OWNER TO supabase_auth_admin;

--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_cron_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
DECLARE
    func_is_graphql_resolve bool;
BEGIN
    func_is_graphql_resolve = (
        SELECT n.proname = 'resolve'
        FROM pg_event_trigger_ddl_commands() AS ev
        LEFT JOIN pg_catalog.pg_proc AS n
        ON ev.objid = n.oid
    );

    IF func_is_graphql_resolve
    THEN
        -- Update public wrapper to pass all arguments through to the pg_graphql resolve func
        DROP FUNCTION IF EXISTS graphql_public.graphql;
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language sql
        as $$
            select graphql.resolve(
                query := query,
                variables := coalesce(variables, '{}'),
                "operationName" := "operationName",
                extensions := extensions
            );
        $$;

        -- This hook executes when `graphql.resolve` is created. That is not necessarily the last
        -- function in the extension so we need to grant permissions on existing entities AND
        -- update default permissions to any others that are created after `graphql.resolve`
        grant usage on schema graphql to postgres, anon, authenticated, service_role;
        grant select on all tables in schema graphql to postgres, anon, authenticated, service_role;
        grant execute on all functions in schema graphql to postgres, anon, authenticated, service_role;
        grant all on all sequences in schema graphql to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on tables to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on functions to postgres, anon, authenticated, service_role;
        alter default privileges in schema graphql grant all on sequences to postgres, anon, authenticated, service_role;

        -- Allow postgres role to allow granting usage on graphql and graphql_public schemas to custom roles
        grant usage on schema graphql_public to postgres with grant option;
        grant usage on schema graphql to postgres with grant option;
    END IF;

END;
$_$;


ALTER FUNCTION extensions.grant_pg_graphql_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

    ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
    ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

    REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
    REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

    GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
  END IF;
END;
$$;


ALTER FUNCTION extensions.grant_pg_net_access() OWNER TO supabase_admin;

--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_ddl_watch() OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


ALTER FUNCTION extensions.pgrst_drop_watch() OWNER TO supabase_admin;

--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: supabase_admin
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


ALTER FUNCTION extensions.set_graphql_placeholder() OWNER TO supabase_admin;

--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: supabase_admin
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: supabase_admin
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
begin
    raise debug 'PgBouncer auth request: %', p_usename;

    return query
    select 
        rolname::text, 
        case when rolvaliduntil < now() 
            then null 
            else rolpassword::text 
        end 
    from pg_authid 
    where rolname=$1 and rolcanlogin;
end;
$_$;


ALTER FUNCTION pgbouncer.get_auth(p_usename text) OWNER TO supabase_admin;

--
-- Name: generate_bid_submission_token(integer, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer DEFAULT NULL::integer, expires_hours integer DEFAULT 72) RETURNS text
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
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


ALTER FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer, expires_hours integer) OWNER TO postgres;

--
-- Name: get_bid_response(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_bid_response(bid_id_param integer) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_bid_response(bid_id_param integer) OWNER TO postgres;

--
-- Name: get_latest_submission(text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid DEFAULT NULL::uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid) OWNER TO postgres;

--
-- Name: get_rfp_artifacts(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_rfp_artifacts(rfp_id_param integer) RETURNS TABLE(artifact_id text, artifact_name text, artifact_type text, artifact_role text, schema jsonb, ui_schema jsonb, form_data jsonb, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_rfp_artifacts(rfp_id_param integer) OWNER TO postgres;

--
-- Name: get_session_active_agent(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_session_active_agent(session_uuid uuid) RETURNS TABLE(agent_id uuid, agent_name text, agent_instructions text, agent_initial_prompt text, agent_avatar_url text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
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


ALTER FUNCTION public.get_session_active_agent(session_uuid uuid) OWNER TO postgres;

--
-- Name: get_sessions_with_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_sessions_with_stats(user_uuid uuid) RETURNS TABLE(id uuid, title text, description text, created_at timestamp with time zone, updated_at timestamp with time zone, message_count bigint, last_message text, last_message_at timestamp with time zone, artifact_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
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


ALTER FUNCTION public.get_sessions_with_stats(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_user_current_agent(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_current_agent(user_uuid uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_user_current_agent(user_uuid uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_current_agent(user_uuid uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_current_agent(user_uuid uuid) IS 'Gets the user''s current agent ID via their current session';


--
-- Name: get_user_current_session(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_current_session(user_uuid uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_user_current_session(user_uuid uuid) OWNER TO postgres;

--
-- Name: get_users_by_role(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_users_by_role(role_filter text DEFAULT NULL::text) RETURNS TABLE(id uuid, supabase_user_id uuid, email text, full_name text, avatar_url text, role text, last_login timestamp with time zone, created_at timestamp with time zone, updated_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
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


ALTER FUNCTION public.get_users_by_role(role_filter text) OWNER TO postgres;

--
-- Name: set_user_current_context(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid) OWNER TO postgres;

--
-- Name: set_user_current_context(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid, agent_uuid uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid, agent_uuid uuid) OWNER TO postgres;

--
-- Name: set_user_current_session(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid) OWNER TO postgres;

--
-- Name: switch_session_agent(uuid, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
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


ALTER FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid) OWNER TO postgres;

--
-- Name: update_artifact_submissions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_artifact_submissions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_artifact_submissions_updated_at() OWNER TO postgres;

--
-- Name: update_session_context_with_agent(uuid, integer, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer DEFAULT NULL::integer, artifact_id_param uuid DEFAULT NULL::uuid, agent_id_param uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer, artifact_id_param uuid, agent_id_param uuid) OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: validate_form_spec(jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.validate_form_spec(spec jsonb) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO ''
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


ALTER FUNCTION public.validate_form_spec(spec jsonb) OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_;

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
    declare
      res jsonb;
    begin
      execute format('select to_jsonb(%L::'|| type_::text || ')', val)  into res;
      return res;
    end
    $$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;


ALTER FUNCTION realtime.quote_wal2json(entity regclass) OWNER TO supabase_admin;

--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  BEGIN
    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    -- Attempt to insert the message
    INSERT INTO realtime.messages (payload, event, topic, private, extension)
    VALUES (payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      -- Capture and notify the error
      RAISE WARNING 'ErrorSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


ALTER FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) OWNER TO supabase_admin;

--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
    /*
    Validates that the user defined filters for a subscription:
    - refer to valid columns that the claimed role may access
    - values are coercable to the correct column type
    */
    declare
        col_names text[] = coalesce(
                array_agg(c.column_name order by c.ordinal_position),
                '{}'::text[]
            )
            from
                information_schema.columns c
            where
                format('%I.%I', c.table_schema, c.table_name)::regclass = new.entity
                and pg_catalog.has_column_privilege(
                    (new.claims ->> 'role'),
                    format('%I.%I', c.table_schema, c.table_name)::regclass,
                    c.column_name,
                    'SELECT'
                );
        filter realtime.user_defined_filter;
        col_type regtype;

        in_val jsonb;
    begin
        for filter in select * from unnest(new.filters) loop
            -- Filtered column is valid
            if not filter.column_name = any(col_names) then
                raise exception 'invalid column for filter %', filter.column_name;
            end if;

            -- Type is sanitized and safe for string interpolation
            col_type = (
                select atttypid::regtype
                from pg_catalog.pg_attribute
                where attrelid = new.entity
                      and attname = filter.column_name
            );
            if col_type is null then
                raise exception 'failed to lookup type for column %', filter.column_name;
            end if;

            -- Set maximum number of entries for in filter
            if filter.op = 'in'::realtime.equality_op then
                in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
                if coalesce(jsonb_array_length(in_val), 0) > 100 then
                    raise exception 'too many values for `in` filter. Maximum 100';
                end if;
            else
                -- raises an exception if value is not coercable to type
                perform realtime.cast(filter.value, col_type);
            end if;

        end loop;

        -- Apply consistent order to filters so the unique constraint on
        -- (subscription_id, entity, filters) can't be tricked by a different filter order
        new.filters = coalesce(
            array_agg(f order by f.column_name, f.op, f.value),
            '{}'
        ) from unnest(new.filters) f;

        return new;
    end;
    $$;


ALTER FUNCTION realtime.subscription_check_filters() OWNER TO supabase_admin;

--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


ALTER FUNCTION realtime.to_regrole(role_name text) OWNER TO supabase_admin;

--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


ALTER FUNCTION realtime.topic() OWNER TO supabase_realtime_admin;

--
-- Name: add_prefixes(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.add_prefixes(_bucket_id text, _name text) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    prefixes text[];
BEGIN
    prefixes := "storage"."get_prefixes"("_name");

    IF array_length(prefixes, 1) > 0 THEN
        INSERT INTO storage.prefixes (name, bucket_id)
        SELECT UNNEST(prefixes) as name, "_bucket_id" ON CONFLICT DO NOTHING;
    END IF;
END;
$$;


ALTER FUNCTION storage.add_prefixes(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


ALTER FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix(text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix(_bucket_id text, _name text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- Check if we can delete the prefix
    IF EXISTS(
        SELECT FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name") + 1
          AND "prefixes"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    )
    OR EXISTS(
        SELECT FROM "storage"."objects"
        WHERE "objects"."bucket_id" = "_bucket_id"
          AND "storage"."get_level"("objects"."name") = "storage"."get_level"("_name") + 1
          AND "objects"."name" COLLATE "C" LIKE "_name" || '/%'
        LIMIT 1
    ) THEN
    -- There are sub-objects, skip deletion
    RETURN false;
    ELSE
        DELETE FROM "storage"."prefixes"
        WHERE "prefixes"."bucket_id" = "_bucket_id"
          AND level = "storage"."get_level"("_name")
          AND "prefixes"."name" = "_name";
        RETURN true;
    END IF;
END;
$$;


ALTER FUNCTION storage.delete_prefix(_bucket_id text, _name text) OWNER TO supabase_storage_admin;

--
-- Name: delete_prefix_hierarchy_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.delete_prefix_hierarchy_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    prefix text;
BEGIN
    prefix := "storage"."get_prefix"(OLD."name");

    IF coalesce(prefix, '') != '' THEN
        PERFORM "storage"."delete_prefix"(OLD."bucket_id", prefix);
    END IF;

    RETURN OLD;
END;
$$;


ALTER FUNCTION storage.delete_prefix_hierarchy_trigger() OWNER TO supabase_storage_admin;

--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


ALTER FUNCTION storage.enforce_bucket_name_length() OWNER TO supabase_storage_admin;

--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    SELECT _parts[array_length(_parts,1)] INTO _filename;
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


ALTER FUNCTION storage.extension(name text) OWNER TO supabase_storage_admin;

--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql
    AS $$
DECLARE
_parts text[];
BEGIN
	select string_to_array(name, '/') into _parts;
	return _parts[array_length(_parts,1)];
END
$$;


ALTER FUNCTION storage.filename(name text) OWNER TO supabase_storage_admin;

--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


ALTER FUNCTION storage.foldername(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_level(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_level(name text) RETURNS integer
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
SELECT array_length(string_to_array("name", '/'), 1);
$$;


ALTER FUNCTION storage.get_level(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefix(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefix(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $_$
SELECT
    CASE WHEN strpos("name", '/') > 0 THEN
             regexp_replace("name", '[\/]{1}[^\/]+\/?$', '')
         ELSE
             ''
        END;
$_$;


ALTER FUNCTION storage.get_prefix(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_prefixes(text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_prefixes(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE STRICT
    AS $$
DECLARE
    parts text[];
    prefixes text[];
    prefix text;
BEGIN
    -- Split the name into parts by '/'
    parts := string_to_array("name", '/');
    prefixes := '{}';

    -- Construct the prefixes, stopping one level below the last part
    FOR i IN 1..array_length(parts, 1) - 1 LOOP
            prefix := array_to_string(parts[1:i], '/');
            prefixes := array_append(prefixes, prefix);
    END LOOP;

    RETURN prefixes;
END;
$$;


ALTER FUNCTION storage.get_prefixes(name text) OWNER TO supabase_storage_admin;

--
-- Name: get_size_by_bucket(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.get_size_by_bucket() RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    return query
        select sum((metadata->>'size')::bigint) as size, obj.bucket_id
        from "storage".objects as obj
        group by obj.bucket_id;
END
$$;


ALTER FUNCTION storage.get_size_by_bucket() OWNER TO supabase_storage_admin;

--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(key COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                        substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1)))
                    ELSE
                        key
                END AS key, id, created_at
            FROM
                storage.s3_multipart_uploads
            WHERE
                bucket_id = $5 AND
                key ILIKE $1 || ''%'' AND
                CASE
                    WHEN $4 != '''' AND $6 = '''' THEN
                        CASE
                            WHEN position($2 IN substring(key from length($1) + 1)) > 0 THEN
                                substring(key from 1 for length($1) + position($2 IN substring(key from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                key COLLATE "C" > $4
                            END
                    ELSE
                        true
                END AND
                CASE
                    WHEN $6 != '''' THEN
                        id COLLATE "C" > $6
                    ELSE
                        true
                    END
            ORDER BY
                key COLLATE "C" ASC, created_at ASC) as e order by key COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_key_token, bucket_id, next_upload_token;
END;
$_$;


ALTER FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, next_key_token text, next_upload_token text) OWNER TO supabase_storage_admin;

--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone)
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN QUERY EXECUTE
        'SELECT DISTINCT ON(name COLLATE "C") * from (
            SELECT
                CASE
                    WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                        substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1)))
                    ELSE
                        name
                END AS name, id, metadata, updated_at
            FROM
                storage.objects
            WHERE
                bucket_id = $5 AND
                name ILIKE $1 || ''%'' AND
                CASE
                    WHEN $6 != '''' THEN
                    name COLLATE "C" > $6
                ELSE true END
                AND CASE
                    WHEN $4 != '''' THEN
                        CASE
                            WHEN position($2 IN substring(name from length($1) + 1)) > 0 THEN
                                substring(name from 1 for length($1) + position($2 IN substring(name from length($1) + 1))) COLLATE "C" > $4
                            ELSE
                                name COLLATE "C" > $4
                            END
                    ELSE
                        true
                END
            ORDER BY
                name COLLATE "C" ASC) as e order by name COLLATE "C" LIMIT $3'
        USING prefix_param, delimiter_param, max_keys, next_token, bucket_id, start_after;
END;
$_$;


ALTER FUNCTION storage.list_objects_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer, start_after text, next_token text) OWNER TO supabase_storage_admin;

--
-- Name: objects_insert_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_insert_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    NEW.level := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_insert_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: objects_update_prefix_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.objects_update_prefix_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    old_prefixes TEXT[];
BEGIN
    -- Ensure this is an update operation and the name has changed
    IF TG_OP = 'UPDATE' AND (NEW."name" <> OLD."name" OR NEW."bucket_id" <> OLD."bucket_id") THEN
        -- Retrieve old prefixes
        old_prefixes := "storage"."get_prefixes"(OLD."name");

        -- Remove old prefixes that are only used by this object
        WITH all_prefixes as (
            SELECT unnest(old_prefixes) as prefix
        ),
        can_delete_prefixes as (
             SELECT prefix
             FROM all_prefixes
             WHERE NOT EXISTS (
                 SELECT 1 FROM "storage"."objects"
                 WHERE "bucket_id" = OLD."bucket_id"
                   AND "name" <> OLD."name"
                   AND "name" LIKE (prefix || '%')
             )
         )
        DELETE FROM "storage"."prefixes" WHERE name IN (SELECT prefix FROM can_delete_prefixes);

        -- Add new prefixes
        PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    END IF;
    -- Set the new level
    NEW."level" := "storage"."get_level"(NEW."name");

    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.objects_update_prefix_trigger() OWNER TO supabase_storage_admin;

--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


ALTER FUNCTION storage.operation() OWNER TO supabase_storage_admin;

--
-- Name: prefixes_insert_trigger(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.prefixes_insert_trigger() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    PERFORM "storage"."add_prefixes"(NEW."bucket_id", NEW."name");
    RETURN NEW;
END;
$$;


ALTER FUNCTION storage.prefixes_insert_trigger() OWNER TO supabase_storage_admin;

--
-- Name: search(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
declare
    can_bypass_rls BOOLEAN;
begin
    SELECT rolbypassrls
    INTO can_bypass_rls
    FROM pg_roles
    WHERE rolname = coalesce(nullif(current_setting('role', true), 'none'), current_user);

    IF can_bypass_rls THEN
        RETURN QUERY SELECT * FROM storage.search_v1_optimised(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    ELSE
        RETURN QUERY SELECT * FROM storage.search_legacy_v1(prefix, bucketname, limits, levels, offsets, search, sortcolumn, sortorder);
    END IF;
end;
$$;


ALTER FUNCTION storage.search(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_legacy_v1(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select path_tokens[$1] as folder
           from storage.objects
             where objects.name ilike $2 || $3 || ''%''
               and bucket_id = $4
               and array_length(objects.path_tokens, 1) <> $1
           group by folder
           order by folder ' || v_sort_order || '
     )
     (select folder as "name",
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[$1] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where objects.name ilike $2 || $3 || ''%''
       and bucket_id = $4
       and array_length(objects.path_tokens, 1) = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_legacy_v1(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v1_optimised(text, text, integer, integer, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
declare
    v_order_by text;
    v_sort_order text;
begin
    case
        when sortcolumn = 'name' then
            v_order_by = 'name';
        when sortcolumn = 'updated_at' then
            v_order_by = 'updated_at';
        when sortcolumn = 'created_at' then
            v_order_by = 'created_at';
        when sortcolumn = 'last_accessed_at' then
            v_order_by = 'last_accessed_at';
        else
            v_order_by = 'name';
        end case;

    case
        when sortorder = 'asc' then
            v_sort_order = 'asc';
        when sortorder = 'desc' then
            v_sort_order = 'desc';
        else
            v_sort_order = 'asc';
        end case;

    v_order_by = v_order_by || ' ' || v_sort_order;

    return query execute
        'with folders as (
           select (string_to_array(name, ''/''))[level] as name
           from storage.prefixes
             where lower(prefixes.name) like lower($2 || $3) || ''%''
               and bucket_id = $4
               and level = $1
           order by name ' || v_sort_order || '
     )
     (select name,
            null as id,
            null as updated_at,
            null as created_at,
            null as last_accessed_at,
            null as metadata from folders)
     union all
     (select path_tokens[level] as "name",
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata
     from storage.objects
     where lower(objects.name) like lower($2 || $3) || ''%''
       and bucket_id = $4
       and level = $1
     order by ' || v_order_by || ')
     limit $5
     offset $6' using levels, prefix, search, bucketname, limits, offsets;
end;
$_$;


ALTER FUNCTION storage.search_v1_optimised(prefix text, bucketname text, limits integer, levels integer, offsets integer, search text, sortcolumn text, sortorder text) OWNER TO supabase_storage_admin;

--
-- Name: search_v2(text, text, integer, integer, text); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, metadata jsonb)
    LANGUAGE plpgsql STABLE
    AS $_$
BEGIN
    RETURN query EXECUTE
        $sql$
        SELECT * FROM (
            (
                SELECT
                    split_part(name, '/', $4) AS key,
                    name || '/' AS name,
                    NULL::uuid AS id,
                    NULL::timestamptz AS updated_at,
                    NULL::timestamptz AS created_at,
                    NULL::jsonb AS metadata
                FROM storage.prefixes
                WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
                ORDER BY prefixes.name COLLATE "C" LIMIT $3
            )
            UNION ALL
            (SELECT split_part(name, '/', $4) AS key,
                name,
                id,
                updated_at,
                created_at,
                metadata
            FROM storage.objects
            WHERE name COLLATE "C" LIKE $1 || '%'
                AND bucket_id = $2
                AND level = $4
                AND name COLLATE "C" > $5
            ORDER BY name COLLATE "C" LIMIT $3)
        ) obj
        ORDER BY name COLLATE "C" LIMIT $3;
        $sql$
        USING prefix, bucket_name, limits, levels, start_after;
END;
$_$;


ALTER FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer, levels integer, start_after text) OWNER TO supabase_storage_admin;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: supabase_storage_admin
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


ALTER FUNCTION storage.update_updated_at_column() OWNER TO supabase_storage_admin;

--
-- Name: http_request(); Type: FUNCTION; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE FUNCTION supabase_functions.http_request() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'supabase_functions'
    AS $$
  DECLARE
    request_id bigint;
    payload jsonb;
    url text := TG_ARGV[0]::text;
    method text := TG_ARGV[1]::text;
    headers jsonb DEFAULT '{}'::jsonb;
    params jsonb DEFAULT '{}'::jsonb;
    timeout_ms integer DEFAULT 1000;
  BEGIN
    IF url IS NULL OR url = 'null' THEN
      RAISE EXCEPTION 'url argument is missing';
    END IF;

    IF method IS NULL OR method = 'null' THEN
      RAISE EXCEPTION 'method argument is missing';
    END IF;

    IF TG_ARGV[2] IS NULL OR TG_ARGV[2] = 'null' THEN
      headers = '{"Content-Type": "application/json"}'::jsonb;
    ELSE
      headers = TG_ARGV[2]::jsonb;
    END IF;

    IF TG_ARGV[3] IS NULL OR TG_ARGV[3] = 'null' THEN
      params = '{}'::jsonb;
    ELSE
      params = TG_ARGV[3]::jsonb;
    END IF;

    IF TG_ARGV[4] IS NULL OR TG_ARGV[4] = 'null' THEN
      timeout_ms = 1000;
    ELSE
      timeout_ms = TG_ARGV[4]::integer;
    END IF;

    CASE
      WHEN method = 'GET' THEN
        SELECT http_get INTO request_id FROM net.http_get(
          url,
          params,
          headers,
          timeout_ms
        );
      WHEN method = 'POST' THEN
        payload = jsonb_build_object(
          'old_record', OLD,
          'record', NEW,
          'type', TG_OP,
          'table', TG_TABLE_NAME,
          'schema', TG_TABLE_SCHEMA
        );

        SELECT http_post INTO request_id FROM net.http_post(
          url,
          payload,
          params,
          headers,
          timeout_ms
        );
      ELSE
        RAISE EXCEPTION 'method argument % is invalid', method;
    END CASE;

    INSERT INTO supabase_functions.hooks
      (hook_table_id, hook_name, request_id)
    VALUES
      (TG_RELID, TG_NAME, request_id);

    RETURN NEW;
  END
$$;


ALTER FUNCTION supabase_functions.http_request() OWNER TO supabase_functions_admin;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: extensions; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE _realtime.extensions (
    id uuid NOT NULL,
    type text,
    settings jsonb,
    tenant_external_id text,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL
);


ALTER TABLE _realtime.extensions OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE _realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE _realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: tenants; Type: TABLE; Schema: _realtime; Owner: supabase_admin
--

CREATE TABLE _realtime.tenants (
    id uuid NOT NULL,
    name text,
    external_id text,
    jwt_secret text,
    max_concurrent_users integer DEFAULT 200 NOT NULL,
    inserted_at timestamp(0) without time zone NOT NULL,
    updated_at timestamp(0) without time zone NOT NULL,
    max_events_per_second integer DEFAULT 100 NOT NULL,
    postgres_cdc_default text DEFAULT 'postgres_cdc_rls'::text,
    max_bytes_per_second integer DEFAULT 100000 NOT NULL,
    max_channels_per_client integer DEFAULT 100 NOT NULL,
    max_joins_per_second integer DEFAULT 500 NOT NULL,
    suspend boolean DEFAULT false,
    jwt_jwks jsonb,
    notify_private_alpha boolean DEFAULT false,
    private_only boolean DEFAULT false NOT NULL,
    migrations_ran integer DEFAULT 0,
    broadcast_adapter character varying(255) DEFAULT 'gen_rpc'::character varying,
    max_presence_events_per_second integer DEFAULT 10000,
    max_payload_size_in_kb integer DEFAULT 3000
);


ALTER TABLE _realtime.tenants OWNER TO supabase_admin;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


ALTER TABLE auth.audit_log_entries OWNER TO supabase_auth_admin;

--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text NOT NULL,
    code_challenge_method auth.code_challenge_method NOT NULL,
    code_challenge text NOT NULL,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone
);


ALTER TABLE auth.flow_state OWNER TO supabase_auth_admin;

--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.flow_state IS 'stores metadata for pkce logins';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE auth.identities OWNER TO supabase_auth_admin;

--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


ALTER TABLE auth.instances OWNER TO supabase_auth_admin;

--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


ALTER TABLE auth.mfa_amr_claims OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


ALTER TABLE auth.mfa_challenges OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid
);


ALTER TABLE auth.mfa_factors OWNER TO supabase_auth_admin;

--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_id text NOT NULL,
    client_secret_hash text NOT NULL,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048))
);


ALTER TABLE auth.oauth_clients OWNER TO supabase_auth_admin;

--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


ALTER TABLE auth.one_time_tokens OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


ALTER TABLE auth.refresh_tokens OWNER TO supabase_auth_admin;

--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: supabase_auth_admin
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE auth.refresh_tokens_id_seq OWNER TO supabase_auth_admin;

--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: supabase_auth_admin
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


ALTER TABLE auth.saml_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


ALTER TABLE auth.saml_relay_states OWNER TO supabase_auth_admin;

--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


ALTER TABLE auth.schema_migrations OWNER TO supabase_auth_admin;

--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text
);


ALTER TABLE auth.sessions OWNER TO supabase_auth_admin;

--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


ALTER TABLE auth.sso_domains OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


ALTER TABLE auth.sso_providers OWNER TO supabase_auth_admin;

--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: supabase_auth_admin
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


ALTER TABLE auth.users OWNER TO supabase_auth_admin;

--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    instructions text NOT NULL,
    initial_prompt text NOT NULL,
    avatar_url text,
    is_active boolean DEFAULT true,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb,
    is_default boolean DEFAULT false,
    is_restricted boolean DEFAULT false,
    is_free boolean DEFAULT false,
    role text
);


ALTER TABLE public.agents OWNER TO postgres;

--
-- Name: COLUMN agents.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.agents.role IS 'Functional role of the agent (e.g., sales, design, support, assistant, audit, billing, etc.)';


--
-- Name: artifact_submissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artifact_submissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    artifact_id text,
    session_id uuid,
    user_id uuid,
    submission_data jsonb NOT NULL,
    form_version text,
    submitted_at timestamp with time zone DEFAULT now(),
    ip_address inet,
    user_agent text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.artifact_submissions OWNER TO postgres;

--
-- Name: artifacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artifacts (
    id text NOT NULL,
    user_id uuid,
    session_id uuid,
    message_id uuid,
    name text NOT NULL,
    description text,
    type text DEFAULT 'form'::text NOT NULL,
    file_type text,
    file_size bigint,
    storage_path text,
    mime_type text,
    schema jsonb,
    ui_schema jsonb DEFAULT '{}'::jsonb,
    default_values jsonb DEFAULT '{}'::jsonb,
    submit_action jsonb DEFAULT '{"type": "save_session"}'::jsonb,
    is_template boolean DEFAULT false,
    template_category text,
    template_tags text[],
    artifact_role text NOT NULL,
    status text DEFAULT 'active'::text,
    processing_status text DEFAULT 'completed'::text,
    processed_content text,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT artifacts_new_artifact_role_check CHECK ((artifact_role = ANY (ARRAY['buyer_questionnaire'::text, 'bid_form'::text, 'request_document'::text, 'template'::text]))),
    CONSTRAINT artifacts_new_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text]))),
    CONSTRAINT artifacts_new_status_check CHECK ((status = ANY (ARRAY['active'::text, 'inactive'::text, 'deleted'::text]))),
    CONSTRAINT artifacts_new_type_check CHECK ((type = ANY (ARRAY['form'::text, 'document'::text, 'image'::text, 'pdf'::text, 'template'::text, 'other'::text])))
);


ALTER TABLE public.artifacts OWNER TO postgres;

--
-- Name: COLUMN artifacts.default_values; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.artifacts.default_values IS 'Default/pre-filled form values for form artifacts';


--
-- Name: bids; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bids (
    id integer NOT NULL,
    rfp_id integer,
    agent_id integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    response jsonb DEFAULT '{}'::jsonb,
    artifact_submission_id uuid,
    supplier_id integer
);


ALTER TABLE public.bids OWNER TO postgres;

--
-- Name: COLUMN bids.response; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bids.response IS 'Vendor response data captured from the form_spec form';


--
-- Name: COLUMN bids.supplier_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.bids.supplier_id IS 'Foreign key reference to supplier_profiles table - identifies which supplier submitted this bid';


--
-- Name: bid_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bid_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bid_id_seq OWNER TO postgres;

--
-- Name: bid_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bid_id_seq OWNED BY public.bids.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    user_id uuid NOT NULL,
    content text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    message_order integer DEFAULT 0 NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    ai_metadata jsonb DEFAULT '{}'::jsonb,
    agent_id uuid,
    agent_name text,
    CONSTRAINT messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: rfp_artifacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfp_artifacts (
    rfp_id integer NOT NULL,
    artifact_id text NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT rfp_artifacts_new_role_check CHECK ((role = ANY (ARRAY['buyer'::text, 'supplier'::text, 'evaluator'::text])))
);


ALTER TABLE public.rfp_artifacts OWNER TO postgres;

--
-- Name: rfps; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.rfps (
    id integer NOT NULL,
    name text NOT NULL,
    due_date date,
    description text DEFAULT ''::text,
    is_template boolean DEFAULT false,
    is_public boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    specification text DEFAULT ''::text,
    status text DEFAULT 'draft'::text,
    completion_percentage integer DEFAULT 0,
    CONSTRAINT rfps_completion_percentage_check CHECK (((completion_percentage >= 0) AND (completion_percentage <= 100))),
    CONSTRAINT rfps_status_check CHECK ((status = ANY (ARRAY['draft'::text, 'gathering_requirements'::text, 'generating_forms'::text, 'collecting_responses'::text, 'completed'::text])))
);


ALTER TABLE public.rfps OWNER TO postgres;

--
-- Name: rfp_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.rfp_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.rfp_id_seq OWNER TO postgres;

--
-- Name: rfp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.rfp_id_seq OWNED BY public.rfps.id;


--
-- Name: session_agents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_agents (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid NOT NULL,
    agent_id uuid,
    started_at timestamp with time zone DEFAULT now(),
    ended_at timestamp with time zone,
    is_active boolean DEFAULT true
);


ALTER TABLE public.session_agents OWNER TO postgres;

--
-- Name: session_artifacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.session_artifacts (
    session_id uuid NOT NULL,
    artifact_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.session_artifacts OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    title text DEFAULT 'New Session'::text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    is_archived boolean DEFAULT false,
    session_metadata jsonb DEFAULT '{}'::jsonb,
    current_agent_id uuid,
    current_rfp_id integer,
    current_artifact_id text
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: COLUMN sessions.current_agent_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sessions.current_agent_id IS 'Reference to the agent being used in this session';


--
-- Name: COLUMN sessions.current_rfp_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sessions.current_rfp_id IS 'Reference to the current RFP being worked on in this session';


--
-- Name: COLUMN sessions.current_artifact_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.sessions.current_artifact_id IS 'Reference to the current artifact being worked on in this session';


--
-- Name: supplier_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.supplier_profiles (
    id integer NOT NULL,
    name text NOT NULL,
    description text,
    email text,
    phone text,
    rfpez_account_id integer
);


ALTER TABLE public.supplier_profiles OWNER TO postgres;

--
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.supplier_id_seq OWNER TO postgres;

--
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier_profiles.id;


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_profiles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text,
    full_name text,
    avatar_url text,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    supabase_user_id uuid NOT NULL,
    role text DEFAULT 'user'::text NOT NULL,
    current_session_id uuid,
    current_rfp_id integer,
    CONSTRAINT user_profiles_role_check CHECK ((role = ANY (ARRAY['user'::text, 'developer'::text, 'administrator'::text])))
);


ALTER TABLE public.user_profiles OWNER TO postgres;

--
-- Name: COLUMN user_profiles.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.role IS 'User role in ascending order of access: user, developer, administrator';


--
-- Name: COLUMN user_profiles.current_session_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.user_profiles.current_session_id IS 'Reference to the user''s currently active session (agent context derived from session)';


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
)
PARTITION BY RANGE (inserted_at);


ALTER TABLE realtime.messages OWNER TO supabase_realtime_admin;

--
-- Name: messages_2025_10_05; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_10_05 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_10_05 OWNER TO supabase_admin;

--
-- Name: messages_2025_10_06; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_10_06 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_10_06 OWNER TO supabase_admin;

--
-- Name: messages_2025_10_07; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_10_07 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_10_07 OWNER TO supabase_admin;

--
-- Name: messages_2025_10_08; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_10_08 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_10_08 OWNER TO supabase_admin;

--
-- Name: messages_2025_10_09; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.messages_2025_10_09 (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    inserted_at timestamp without time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


ALTER TABLE realtime.messages_2025_10_09 OWNER TO supabase_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


ALTER TABLE realtime.schema_migrations OWNER TO supabase_admin;

--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: supabase_admin
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


ALTER TABLE realtime.subscription OWNER TO supabase_admin;

--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL
);


ALTER TABLE storage.buckets OWNER TO supabase_storage_admin;

--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.buckets_analytics (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.buckets_analytics OWNER TO supabase_storage_admin;

--
-- Name: iceberg_namespaces; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.iceberg_namespaces (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.iceberg_namespaces OWNER TO supabase_storage_admin;

--
-- Name: iceberg_tables; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.iceberg_tables (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    namespace_id uuid NOT NULL,
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    location text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.iceberg_tables OWNER TO supabase_storage_admin;

--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE storage.migrations OWNER TO supabase_storage_admin;

--
-- Name: objects; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    level integer
);


ALTER TABLE storage.objects OWNER TO supabase_storage_admin;

--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: supabase_storage_admin
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: prefixes; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.prefixes (
    bucket_id text NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    level integer GENERATED ALWAYS AS (storage.get_level(name)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE storage.prefixes OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb
);


ALTER TABLE storage.s3_multipart_uploads OWNER TO supabase_storage_admin;

--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: supabase_storage_admin
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE storage.s3_multipart_uploads_parts OWNER TO supabase_storage_admin;

--
-- Name: hooks; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE supabase_functions.hooks (
    id bigint NOT NULL,
    hook_table_id integer NOT NULL,
    hook_name text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    request_id bigint
);


ALTER TABLE supabase_functions.hooks OWNER TO supabase_functions_admin;

--
-- Name: TABLE hooks; Type: COMMENT; Schema: supabase_functions; Owner: supabase_functions_admin
--

COMMENT ON TABLE supabase_functions.hooks IS 'Supabase Functions Hooks: Audit trail for triggered hooks.';


--
-- Name: hooks_id_seq; Type: SEQUENCE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE SEQUENCE supabase_functions.hooks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE supabase_functions.hooks_id_seq OWNER TO supabase_functions_admin;

--
-- Name: hooks_id_seq; Type: SEQUENCE OWNED BY; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER SEQUENCE supabase_functions.hooks_id_seq OWNED BY supabase_functions.hooks.id;


--
-- Name: migrations; Type: TABLE; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE TABLE supabase_functions.migrations (
    version text NOT NULL,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE supabase_functions.migrations OWNER TO supabase_functions_admin;

--
-- Name: schema_migrations; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.schema_migrations (
    version text NOT NULL,
    statements text[],
    name text
);


ALTER TABLE supabase_migrations.schema_migrations OWNER TO postgres;

--
-- Name: seed_files; Type: TABLE; Schema: supabase_migrations; Owner: postgres
--

CREATE TABLE supabase_migrations.seed_files (
    path text NOT NULL,
    hash text NOT NULL
);


ALTER TABLE supabase_migrations.seed_files OWNER TO postgres;

--
-- Name: messages_2025_10_05; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_05 FOR VALUES FROM ('2025-10-05 00:00:00') TO ('2025-10-06 00:00:00');


--
-- Name: messages_2025_10_06; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_06 FOR VALUES FROM ('2025-10-06 00:00:00') TO ('2025-10-07 00:00:00');


--
-- Name: messages_2025_10_07; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_07 FOR VALUES FROM ('2025-10-07 00:00:00') TO ('2025-10-08 00:00:00');


--
-- Name: messages_2025_10_08; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_08 FOR VALUES FROM ('2025-10-08 00:00:00') TO ('2025-10-09 00:00:00');


--
-- Name: messages_2025_10_09; Type: TABLE ATTACH; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages ATTACH PARTITION realtime.messages_2025_10_09 FOR VALUES FROM ('2025-10-09 00:00:00') TO ('2025-10-10 00:00:00');


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: bids id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids ALTER COLUMN id SET DEFAULT nextval('public.bid_id_seq'::regclass);


--
-- Name: rfps id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps ALTER COLUMN id SET DEFAULT nextval('public.rfp_id_seq'::regclass);


--
-- Name: supplier_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_profiles ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- Name: hooks id; Type: DEFAULT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY supabase_functions.hooks ALTER COLUMN id SET DEFAULT nextval('supabase_functions.hooks_id_seq'::regclass);


--
-- Data for Name: extensions; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY _realtime.extensions (id, type, settings, tenant_external_id, inserted_at, updated_at) FROM stdin;
1a06ff18-141c-4229-9720-b2dbb32fba52	postgres_cdc_rls	{"region": "us-east-1", "db_host": "ff5uRhdqeWBCvsw9ZN8l3i0XN5+WK8VDs1Gzmkl9gMo=", "db_name": "sWBpZNdjggEPTQVlI52Zfw==", "db_port": "+enMDFi1J/3IrrquHHwUmA==", "db_user": "uxbEq/zz8DXVD53TOI1zmw==", "slot_name": "supabase_realtime_replication_slot", "db_password": "sWBpZNdjggEPTQVlI52Zfw==", "publication": "supabase_realtime", "ssl_enforced": false, "poll_interval_ms": 100, "poll_max_changes": 100, "poll_max_record_bytes": 1048576}	realtime-dev	2025-10-06 23:19:30	2025-10-06 23:19:30
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY _realtime.schema_migrations (version, inserted_at) FROM stdin;
20210706140551	2025-10-06 23:18:33
20220329161857	2025-10-06 23:18:33
20220410212326	2025-10-06 23:18:33
20220506102948	2025-10-06 23:18:33
20220527210857	2025-10-06 23:18:33
20220815211129	2025-10-06 23:18:33
20220815215024	2025-10-06 23:18:33
20220818141501	2025-10-06 23:18:33
20221018173709	2025-10-06 23:18:33
20221102172703	2025-10-06 23:18:33
20221223010058	2025-10-06 23:18:34
20230110180046	2025-10-06 23:18:34
20230810220907	2025-10-06 23:18:34
20230810220924	2025-10-06 23:18:34
20231024094642	2025-10-06 23:18:34
20240306114423	2025-10-06 23:18:34
20240418082835	2025-10-06 23:18:34
20240625211759	2025-10-06 23:18:34
20240704172020	2025-10-06 23:18:34
20240902173232	2025-10-06 23:18:34
20241106103258	2025-10-06 23:18:34
20250424203323	2025-10-06 23:18:34
20250613072131	2025-10-06 23:18:34
20250711044927	2025-10-06 23:18:34
20250811121559	2025-10-06 23:18:34
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: _realtime; Owner: supabase_admin
--

COPY _realtime.tenants (id, name, external_id, jwt_secret, max_concurrent_users, inserted_at, updated_at, max_events_per_second, postgres_cdc_default, max_bytes_per_second, max_channels_per_client, max_joins_per_second, suspend, jwt_jwks, notify_private_alpha, private_only, migrations_ran, broadcast_adapter, max_presence_events_per_second, max_payload_size_in_kb) FROM stdin;
393196cc-03f4-4d84-b9b4-660420065359	realtime-dev	realtime-dev	iNjicxc4+llvc9wovDvqymwfnj9teWMlyOIbJ8Fh6j2WNU8CIJ2ZgjR6MUIKqSmeDmvpsKLsZ9jgXJmQPpwL8w==	200	2025-10-06 23:19:30	2025-10-06 23:19:30	100	postgres_cdc_rls	100000	100	100	f	{"keys": [{"k": "c3VwZXItc2VjcmV0LWp3dC10b2tlbi13aXRoLWF0LWxlYXN0LTMyLWNoYXJhY3RlcnMtbG9uZw", "kty": "oct"}]}	f	f	64	gen_rpc	10000	3000
\.


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.oauth_clients (id, client_id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\N	00000000-0000-0000-0000-000000000001	\N	authenticated	anonymous@rfpez.ai	anonymous	2025-10-06 23:19:21.071296+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"provider": "anonymous"}	{"name": "Anonymous User"}	f	2025-10-06 23:19:21.071296+00	2025-10-06 23:19:21.071296+00	\N	\N			\N		0	\N		\N	f	\N	f
\N	ab0ff5c2-177a-4589-97f1-95ed9b77a00f	\N	authenticated	test@local.dev	$2a$10$test.hash.here	2025-10-06 23:19:21.071296+00	\N	\N	\N	\N	\N	\N	\N	\N	\N	{"provider": "email", "providers": ["email"]}	{"full_name": "Test User"}	f	2025-10-06 23:19:21.071296+00	2025-10-06 23:19:21.071296+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.agents (id, name, description, instructions, initial_prompt, avatar_url, is_active, sort_order, created_at, updated_at, metadata, is_default, is_restricted, is_free, role) FROM stdin;
4fe117af-da1d-410c-bcf4-929012d8a673	Solutions	Sales agent for EZRFP.APP to help with product questions and competitive sourcing	## Name: Solutions\r\n**Database ID**: `e9fd3332-dcd1-42c1-a466-d80ec51647ad`\r\n**Role**: `sales`\r\n**Avatar URL**: `/assets/avatars/solutions-agent.svg`\r\n\r\n## Description:\r\nSales agent for EZRFP.APP to help with product questions and competitive sourcing\r\n\r\n## Initial Prompt:\r\nHi, I'm your EZ RFP AI agent. I'm here to see if I can help you. Are you looking to competitively source a product?\r\n\r\n## Instructions:\r\nYou are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs. Be helpful, professional, and focus on understanding their requirements.\r\n\r\n## 🤖 AVAILABLE AGENTS & SWITCHING:\r\n**When users ask about available agents or want to switch agents:**\r\n1. **ALWAYS** use the `get_available_agents` function to show current agents\r\n2. **Available agents typically include:**\r\n   - **Solutions** - Sales and product questions (that's me!)\r\n   - **RFP Design** - Create RFPs, forms, and procurement documents\r\n   - **Technical Support** - Technical assistance and troubleshooting\r\n   - **Other specialized agents** based on your needs\r\n3. **To switch agents:** Use `switch_agent` with the agent name (e.g., "RFP Design")\r\n4. **Make switching easy:** Always mention available agents in your responses and suggest appropriate agents for user needs\r\n\r\n**� CRITICAL WORKFLOW RULE - READ THIS FIRST!**\r\n**WHEN USERS EXPRESS ANY PROCUREMENT NEEDS, YOU MUST IMMEDIATELY SWITCH TO RFP DESIGN**\r\n\r\n**MANDATORY PROCUREMENT TRIGGERS - If user message contains ANY of these patterns, IMMEDIATELY call `switch_agent`:**\r\n- "I need to source [anything]" → Call `switch_agent` to "RFP Design"\r\n- "I need to procure [anything]" → Call `switch_agent` to "RFP Design" \r\n- "I need to buy [anything]" → Call `switch_agent` to "RFP Design"\r\n- "Create an RFP for [anything]" → Call `switch_agent` to "RFP Design"\r\n- "I need an RFP for [anything]" → Call `switch_agent` to "RFP Design"\r\n- "I want to create an RFP" → Call `switch_agent` to "RFP Design"\r\n- "Help me create an RFP" → Call `switch_agent` to "RFP Design"\r\n- "I need to find suppliers for [anything]" → Call `switch_agent` to "RFP Design"\r\n- "I'm looking to source [anything]" → Call `switch_agent` to "RFP Design"\r\n- "We need to source [anything]" → Call `switch_agent` to "RFP Design"\r\n- "Create a questionnaire" → Call `switch_agent` to "RFP Design"\r\n- "Create a buyer questionnaire" → Call `switch_agent` to "RFP Design"\r\n- "Generate a questionnaire" → Call `switch_agent` to "RFP Design"\r\n- "I need a questionnaire for [anything]" → Call `switch_agent` to "RFP Design"\r\n- "Create a form for [anything]" → Call `switch_agent` to "RFP Design"\r\n- "Generate a form" → Call `switch_agent` to "RFP Design"\r\n\r\n**EXAMPLES OF IMMEDIATE SWITCHES REQUIRED:**\r\n- "I need to source acetone" → `switch_agent` to "RFP Design" \r\n- "I need to source floor tiles" → `switch_agent` to "RFP Design"\r\n- "I need to procure office supplies" → `switch_agent` to "RFP Design"\r\n- "I need to buy concrete" → `switch_agent` to "RFP Design"\r\n- "We need to source asphalt" → `switch_agent` to "RFP Design"\r\n- "I'm looking to source lumber" → `switch_agent` to "RFP Design"\r\n- "Create a buyer questionnaire for LED desk lamps" → `switch_agent` to "RFP Design"\r\n- "Generate a questionnaire to capture requirements" → `switch_agent` to "RFP Design"\r\n- "I need a form to collect buyer information" → `switch_agent` to "RFP Design"\r\n\r\n**CRITICAL RULES:**\r\n- **YOU CANNOT CREATE RFPs DIRECTLY** - You have NO ACCESS to RFP creation tools\r\n- **YOU CANNOT CREATE FORMS/QUESTIONNAIRES** - You have NO ACCESS to form creation tools\r\n- **NO PROCUREMENT ASSISTANCE** - You cannot "help create RFPs" or "help create questionnaires" - only switch to RFP Design\r\n- **IMMEDIATE SWITCH** - Do not engage in procurement discussion, switch immediately\r\n- **Include user's original request** in the `user_input` parameter when switching\r\n- **DO NOT SAY "I'll help you create"** - Say "I'll switch you to our RFP Design agent"\r\n\r\n**🚨 ABSOLUTELY NEVER DO THESE THINGS:**\r\n- **NEVER call `create_and_set_rfp`** - This tool is BLOCKED for you\r\n- **NEVER call `create_form_artifact`** - This tool is BLOCKED for you\r\n- **NEVER attempt to create RFPs yourself** - You MUST switch agents\r\n- **NEVER say "I'll create" anything procurement-related** - Only say "I'll switch you"\r\n\r\n**�🔐 AUTHENTICATION REQUIREMENTS:**\r\n**BEFORE SWITCHING AGENTS OR HANDLING PROCUREMENT REQUESTS:**\r\n- **Check User Status**: Look at the USER CONTEXT in your system prompt\r\n- **If "User Status: ANONYMOUS (not logged in)":**\r\n  - DO NOT call `switch_agent`\r\n  - DO NOT attempt any procurement assistance\r\n  - INFORM USER they must log in first\r\n  - DIRECT them to click the LOGIN button\r\n  - EXPLAIN that RFP creation and agent switching require authentication\r\n- **If "User Status: AUTHENTICATED":**\r\n  - Proceed with normal agent switching workflow\r\n  - Call `switch_agent` as instructed below\r\n\r\n**YOUR ONLY ALLOWED RESPONSE TO PROCUREMENT REQUESTS:**\r\n1. **First**: Check authentication status in USER CONTEXT\r\n2. **If not authenticated**: Instruct user to log in first\r\n3. **If authenticated**: Call `switch_agent` with agent_name: "RFP Design"\r\n4. Include the user's full request in the `user_input` parameter\r\n5. Say: "I'll switch you to our RFP Design agent who specializes in [specific task]"\r\n\r\n**CRITICAL: When users ask about available agents, which agents exist, or want to see a list of agents, you MUST use the `get_available_agents` function to retrieve the current list from the database. Do not provide agent information from memory - always query the database for the most up-to-date agent list.**	Hi, I'm your EZ RFP AI agent. I'm here to see if I can help you. Are you looking to competitively source a product?	/assets/avatars/solutions-agent.svg	t	0	2025-10-06 23:19:20.896732+00	2025-10-06 23:19:20.896732+00	{}	t	f	f	sales
8c5f11cb-1395-4d67-821b-89dd58f0c8dc	RFP Design	Creates comprehensive RFP packages by gathering buyer requirements, generating interactive questionnaires, and producing request documents	## Name: RFP Design\r\n**Database ID**: `8c5f11cb-1395-4d67-821b-89dd58f0c8dc`\r\n**Role**: `design`\r\n**Avatar URL**: `/assets/avatars/rfp-designer.svg`\r\n\r\n## Description:\r\nCreates comprehensive RFP packages by gathering buyer requirements, generating interactive questionnaires, and producing request documents. Generates "request" content (rfps.request field) sent to suppliers to solicit bids.\r\n\r\n## Initial Prompt:\r\nHello! I'm your RFP Design specialist. I'll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire.\r\n\r\nWhat type of product or service are you looking to procure? I'll generate a tailored questionnaire to capture all necessary details for your RFP.\r\n\r\n## 🚨 CRITICAL USER COMMUNICATION RULES:\r\n- **NEVER show code, schemas, or technical syntax to users**\r\n- **ALWAYS communicate in natural, professional language**\r\n- **Users should only see forms and friendly explanations**\r\n- **Keep all technical implementation completely hidden**\r\n\r\n## 🎯 CRITICAL SAMPLE DATA RULE:\r\n**When users request "sample data", "test data", "fill out form", or mention "sample":**\r\n1. **ALWAYS** call `update_form_data` after creating forms\r\n2. **IDENTIFY** the correct form artifact to populate\r\n3. **USE** realistic business values (Green Valley farms, Mountain View companies, etc.)\r\n4. **POPULATE** ALL required fields and most optional fields with appropriate sample data\r\n\r\n## 🔍 AGENT QUERY HANDLING & SWITCHING:\r\n**MANDATORY**: When users ask about available agents ("what agents are available?", "which agents do you have?", "show me available agents", "list all agents", "tell me about your agents"), you MUST use the `get_available_agents` function to retrieve the current agent list from the database. Never rely on static information - always query the database for the most current agent information.\r\n\r\n## 🤖 AVAILABLE AGENTS CONTEXT:\r\n**Always inform users about available agents and easy switching:**\r\n1. **Available agents typically include:**\r\n   - **RFP Design** - Create RFPs, forms, and procurement documents (that's me!)\r\n   - **Solutions** - Sales and product questions\r\n   - **Technical Support** - Technical assistance and troubleshooting\r\n   - **Other specialized agents** based on your needs\r\n2. **To switch agents:** Simply say "switch me to [Agent Name]" or "I want to talk to Solutions agent"\r\n3. **Proactive suggestions:** When users have non-procurement questions, suggest switching to the appropriate agent\r\n4. **Make it natural:** Include agent switching options in your responses when relevant\r\n\r\n## 🔥 CRITICAL RFP CREATION RULE - READ THIS FIRST!\r\n**INTELLIGENTLY RECOGNIZE PROCUREMENT NEEDS → CALL `create_and_set_rfp`**\r\n- When users express procurement needs, sourcing requirements, or buying intentions - create RFP records\r\n- Use context and conversation flow to determine when RFP creation is appropriate\r\n- ALWAYS call `create_and_set_rfp` BEFORE any other RFP-related actions\r\n- Consider the full conversation context, not just specific keywords\r\n- **CRITICAL**: This function automatically determines the current session - NO session_id parameter is needed\r\n\r\n## 🚨 CRITICAL FUNCTION CALL RULES:\r\n- **ALWAYS include form_schema parameter when calling create_form_artifact**\r\n- **NEVER call create_form_artifact with only title and description**\r\n- **The form_schema parameter is MANDATORY and must be a complete JSON Schema object**\r\n- **Function calls missing form_schema will fail with an error - you MUST retry with the complete schema**\r\n\r\n## 📋 COMPREHENSIVE WORKFLOW STEPS:\r\n\r\n### 1. Initial RFP Creation\r\n**For ANY procurement request:**\r\n1. **Immediately call `create_and_set_rfp`** with appropriate name and description\r\n2. Confirm RFP creation to the user: "I've created your RFP: [Name]"\r\n3. Proceed to questionnaire generation\r\n\r\n### 2. Questionnaire Generation & Form Creation\r\n1. **Generate comprehensive questionnaire** covering all relevant procurement aspects\r\n2. **Call `create_form_artifact`** with complete JSON Schema (MANDATORY form_schema parameter)\r\n3. **Present the form** to the user for completion\r\n4. **Offer sample data** if users want to see how the form works\r\n\r\n### 3. Form Data Collection & Processing\r\n1. **Monitor form submissions** via artifact system\r\n2. **Extract form data** when submitted by users\r\n3. **Process responses** into structured requirement format\r\n4. **Update RFP context** with gathered information\r\n\r\n### 4. Request Document Generation\r\n1. **Generate comprehensive request** based on form responses\r\n2. **Include all requirement details** from questionnaire responses\r\n3. **Structure request** for supplier clarity and response effectiveness\r\n4. **Present final request** to user for review\r\n\r\n## 🎯 QUESTIONNAIRE DESIGN PRINCIPLES:\r\n- **Always include basic information**: Company details, contact information, project overview\r\n- **Gather technical specifications**: Detailed product/service requirements, standards, certifications\r\n- **Include business requirements**: Quantities, timelines, delivery requirements, budget considerations\r\n- **Add evaluation criteria**: How proposals will be assessed, important factors\r\n- **Request supplier information**: Company background, certifications, references, financial stability\r\n\r\n## 📝 FORM SCHEMA BEST PRACTICES:\r\n- **Use appropriate field types**: text, number, date, select, checkbox, textarea\r\n- **Include clear labels and descriptions** for all fields\r\n- **Mark required fields** appropriately\r\n- **Group related fields** logically\r\n- **Provide helpful placeholders** and examples\r\n- **Include validation patterns** where appropriate\r\n\r\n## 🔧 TECHNICAL IMPLEMENTATION NOTES:\r\n- **Form schemas must be valid JSON Schema objects** with type, properties, and required fields\r\n- **Always include title and description** at the schema root level\r\n- **Use enum values for dropdown selections** where appropriate\r\n- **Include format specifications** for emails, dates, URLs\r\n- **Add pattern validation** for structured data like phone numbers\r\n\r\n## 🎬 USER EXPERIENCE GUIDELINES:\r\n- **Always explain what you're doing**: "I'm creating your RFP now...", "Let me generate a questionnaire..."\r\n- **Confirm major actions**: "Your RFP has been created", "I've generated your questionnaire"\r\n- **Guide users through the process**: "Please fill out this form to capture your requirements"\r\n- **Offer assistance**: "I can populate this with sample data if you'd like to see how it works"\r\n- **Be proactive**: Suggest next steps and additional considerations\r\n\r\n## 🚀 ADVANCED FEATURES:\r\n- **Context awareness**: Reference current RFP when available, build upon existing content\r\n- **Intelligent questionnaire customization**: Adapt questions based on product/service type\r\n- **Comprehensive requirement capture**: Technical, business, legal, and evaluation criteria\r\n- **Professional request generation**: Create supplier-ready RFP documents\r\n- **Form validation and data processing**: Ensure complete and accurate requirement capture	Hello! I'm your RFP Design specialist. I'll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire. What type of product or service are you looking to procure?	/assets/avatars/rfp-designer.svg	t	1	2025-10-06 23:19:20.896732+00	2025-10-06 23:19:20.896732+00	{}	f	f	t	design
f47ac10b-58cc-4372-a567-0e02b2c3d479	Support	Technical assistance agent for platform usage and troubleshooting	You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions. Provide clear, step-by-step guidance and escalate complex issues when needed.	Hello! I'm the technical support agent. I'm here to help you with any technical questions or issues you might have with the platform. How can I assist you today?	/assets/avatars/support-agent.svg	t	2	2025-10-06 23:19:20.896732+00	2025-10-06 23:19:20.896732+00	{}	f	f	t	support
\.


--
-- Data for Name: artifact_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artifact_submissions (id, artifact_id, session_id, user_id, submission_data, form_version, submitted_at, ip_address, user_agent, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: artifacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artifacts (id, user_id, session_id, message_id, name, description, type, file_type, file_size, storage_path, mime_type, schema, ui_schema, default_values, submit_action, is_template, template_category, template_tags, artifact_role, status, processing_status, processed_content, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bids; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bids (id, rfp_id, agent_id, created_at, updated_at, response, artifact_submission_id, supplier_id) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, session_id, user_id, content, role, created_at, message_order, metadata, ai_metadata, agent_id, agent_name) FROM stdin;
\.


--
-- Data for Name: rfp_artifacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfp_artifacts (rfp_id, artifact_id, role, created_at) FROM stdin;
\.


--
-- Data for Name: rfps; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.rfps (id, name, due_date, description, is_template, is_public, created_at, updated_at, specification, status, completion_percentage) FROM stdin;
\.


--
-- Data for Name: session_agents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_agents (id, session_id, agent_id, started_at, ended_at, is_active) FROM stdin;
\.


--
-- Data for Name: session_artifacts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.session_artifacts (session_id, artifact_id, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, title, description, created_at, updated_at, is_archived, session_metadata, current_agent_id, current_rfp_id, current_artifact_id) FROM stdin;
\.


--
-- Data for Name: supplier_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.supplier_profiles (id, name, description, email, phone, rfpez_account_id) FROM stdin;
\.


--
-- Data for Name: user_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_profiles (id, email, full_name, avatar_url, last_login, created_at, updated_at, supabase_user_id, role, current_session_id, current_rfp_id) FROM stdin;
00000000-0000-0000-0000-000000000001	anonymous@rfpez.ai	Anonymous User	\N	\N	2025-10-06 23:19:21.071296+00	2025-10-06 23:19:21.071296+00	00000000-0000-0000-0000-000000000001	user	\N	\N
c4031ba6-f0c4-461f-b1a8-c168069d295f	test@local.dev	Test User	\N	\N	2025-10-06 23:19:21.071296+00	2025-10-06 23:19:21.071296+00	ab0ff5c2-177a-4589-97f1-95ed9b77a00f	user	\N	\N
\.


--
-- Data for Name: messages_2025_10_05; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_10_05 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_06; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_10_06 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_07; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_10_07 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_08; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_10_08 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: messages_2025_10_09; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.messages_2025_10_09 (topic, extension, payload, event, private, updated_at, inserted_at, id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2025-10-06 23:18:36
20211116045059	2025-10-06 23:18:36
20211116050929	2025-10-06 23:18:36
20211116051442	2025-10-06 23:18:37
20211116212300	2025-10-06 23:18:37
20211116213355	2025-10-06 23:18:37
20211116213934	2025-10-06 23:18:37
20211116214523	2025-10-06 23:18:37
20211122062447	2025-10-06 23:18:37
20211124070109	2025-10-06 23:18:37
20211202204204	2025-10-06 23:18:37
20211202204605	2025-10-06 23:18:37
20211210212804	2025-10-06 23:18:37
20211228014915	2025-10-06 23:18:37
20220107221237	2025-10-06 23:18:37
20220228202821	2025-10-06 23:18:37
20220312004840	2025-10-06 23:18:37
20220603231003	2025-10-06 23:18:38
20220603232444	2025-10-06 23:18:38
20220615214548	2025-10-06 23:18:38
20220712093339	2025-10-06 23:18:39
20220908172859	2025-10-06 23:18:39
20220916233421	2025-10-06 23:18:39
20230119133233	2025-10-06 23:18:39
20230128025114	2025-10-06 23:18:39
20230128025212	2025-10-06 23:18:39
20230227211149	2025-10-06 23:18:40
20230228184745	2025-10-06 23:18:40
20230308225145	2025-10-06 23:18:40
20230328144023	2025-10-06 23:18:40
20231018144023	2025-10-06 23:18:40
20231204144023	2025-10-06 23:18:41
20231204144024	2025-10-06 23:18:41
20231204144025	2025-10-06 23:18:41
20240108234812	2025-10-06 23:18:41
20240109165339	2025-10-06 23:18:41
20240227174441	2025-10-06 23:18:42
20240311171622	2025-10-06 23:18:42
20240321100241	2025-10-06 23:18:42
20240401105812	2025-10-06 23:18:42
20240418121054	2025-10-06 23:18:42
20240523004032	2025-10-06 23:18:42
20240618124746	2025-10-06 23:18:42
20240801235015	2025-10-06 23:18:43
20240805133720	2025-10-06 23:18:43
20240827160934	2025-10-06 23:18:43
20240919163303	2025-10-06 23:18:43
20240919163305	2025-10-06 23:18:43
20241019105805	2025-10-06 23:18:43
20241030150047	2025-10-06 23:18:44
20241108114728	2025-10-06 23:18:44
20241121104152	2025-10-06 23:18:44
20241130184212	2025-10-06 23:18:44
20241220035512	2025-10-06 23:18:44
20241220123912	2025-10-06 23:18:44
20241224161212	2025-10-06 23:18:44
20250107150512	2025-10-06 23:18:44
20250110162412	2025-10-06 23:18:44
20250123174212	2025-10-06 23:18:44
20250128220012	2025-10-06 23:18:45
20250506224012	2025-10-06 23:18:45
20250523164012	2025-10-06 23:18:45
20250714121412	2025-10-06 23:18:45
20250905041441	2025-10-06 23:18:45
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: supabase_admin
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type) FROM stdin;
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.buckets_analytics (id, type, format, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.iceberg_namespaces (id, bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.iceberg_tables (id, namespace_id, bucket_id, name, location, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2025-10-06 23:18:59.209162
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2025-10-06 23:18:59.2601
2	storage-schema	5c7968fd083fcea04050c1b7f6253c9771b99011	2025-10-06 23:18:59.29541
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2025-10-06 23:18:59.350864
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2025-10-06 23:18:59.382895
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2025-10-06 23:18:59.417473
6	change-column-name-in-get-size	f93f62afdf6613ee5e7e815b30d02dc990201044	2025-10-06 23:18:59.459978
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2025-10-06 23:18:59.494324
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2025-10-06 23:18:59.526797
9	fix-search-function	3a0af29f42e35a4d101c259ed955b67e1bee6825	2025-10-06 23:18:59.56068
10	search-files-search-function	68dc14822daad0ffac3746a502234f486182ef6e	2025-10-06 23:18:59.593637
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2025-10-06 23:18:59.617114
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2025-10-06 23:18:59.651141
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2025-10-06 23:18:59.68376
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2025-10-06 23:18:59.717588
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2025-10-06 23:18:59.750617
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2025-10-06 23:18:59.784698
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2025-10-06 23:18:59.816929
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2025-10-06 23:18:59.851068
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2025-10-06 23:18:59.883441
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2025-10-06 23:18:59.917755
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2025-10-06 23:18:59.950144
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2025-10-06 23:18:59.984782
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2025-10-06 23:19:00.017058
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2025-10-06 23:19:00.074563
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2025-10-06 23:19:00.105437
26	objects-prefixes	ef3f7871121cdc47a65308e6702519e853422ae2	2025-10-06 23:19:00.141015
27	search-v2	33b8f2a7ae53105f028e13e9fcda9dc4f356b4a2	2025-10-06 23:19:00.171991
28	object-bucket-name-sorting	ba85ec41b62c6a30a3f136788227ee47f311c436	2025-10-06 23:19:00.315158
29	create-prefixes	a7b1a22c0dc3ab630e3055bfec7ce7d2045c5b7b	2025-10-06 23:19:00.460733
30	update-object-levels	6c6f6cc9430d570f26284a24cf7b210599032db7	2025-10-06 23:19:00.676053
31	objects-level-index	33f1fef7ec7fea08bb892222f4f0f5d79bab5eb8	2025-10-06 23:19:00.793492
32	backward-compatible-index-on-objects	2d51eeb437a96868b36fcdfb1ddefdf13bef1647	2025-10-06 23:19:00.9628
33	backward-compatible-index-on-prefixes	fe473390e1b8c407434c0e470655945b110507bf	2025-10-06 23:19:01.084897
34	optimize-search-function-v1	82b0e469a00e8ebce495e29bfa70a0797f7ebd2c	2025-10-06 23:19:01.114928
35	add-insert-trigger-prefixes	63bb9fd05deb3dc5e9fa66c83e82b152f0caf589	2025-10-06 23:19:01.14059
36	optimise-existing-functions	81cf92eb0c36612865a18016a38496c530443899	2025-10-06 23:19:01.193615
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2025-10-06 23:19:01.229371
38	iceberg-catalog-flag-on-buckets	19a8bd89d5dfa69af7f222a46c726b7c41e462c5	2025-10-06 23:19:01.259112
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, level) FROM stdin;
\.


--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.prefixes (bucket_id, name, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY supabase_functions.hooks (id, hook_table_id, hook_name, created_at, request_id) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY supabase_functions.migrations (version, inserted_at) FROM stdin;
initial	2025-10-06 23:18:24.888447+00
20210809183423_update_grants	2025-10-06 23:18:24.888447+00
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.schema_migrations (version, statements, name) FROM stdin;
20251001212124	{"SET statement_timeout = 0","SET lock_timeout = 0","SET idle_in_transaction_session_timeout = 0","SET client_encoding = 'UTF8'","SET standard_conforming_strings = on","SELECT pg_catalog.set_config('search_path', '', false)","SET check_function_bodies = false","SET xmloption = content","SET client_min_messages = warning","SET row_security = off","COMMENT ON SCHEMA \\"public\\" IS 'standard public schema'","CREATE EXTENSION IF NOT EXISTS \\"hypopg\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"index_advisor\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"pg_graphql\\" WITH SCHEMA \\"graphql\\"","CREATE EXTENSION IF NOT EXISTS \\"pg_stat_statements\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"pgcrypto\\" WITH SCHEMA \\"extensions\\"","CREATE EXTENSION IF NOT EXISTS \\"supabase_vault\\" WITH SCHEMA \\"vault\\"","CREATE EXTENSION IF NOT EXISTS \\"uuid-ossp\\" WITH SCHEMA \\"extensions\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"generate_bid_submission_token\\"(\\"rfp_id_param\\" integer, \\"supplier_id_param\\" integer DEFAULT NULL::integer, \\"expires_hours\\" integer DEFAULT 72) RETURNS \\"text\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nDECLARE\r\n  token_data JSONB;\r\n  encoded_token TEXT;\r\nBEGIN\r\n  -- Create token payload\r\n  token_data := jsonb_build_object(\r\n    'rfp_id', rfp_id_param,\r\n    'supplier_id', supplier_id_param,\r\n    'exp', extract(epoch from (now() + make_interval(hours => expires_hours))),\r\n    'iat', extract(epoch from now()),\r\n    'type', 'bid_submission'\r\n  );\r\n  \r\n  -- In a real implementation, this would be signed with a secret\r\n  -- For now, we'll just base64 encode it (NOT SECURE - just for demo)\r\n  encoded_token := encode(token_data::text::bytea, 'base64');\r\n  \r\n  RETURN encoded_token;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"generate_bid_submission_token\\"(\\"rfp_id_param\\" integer, \\"supplier_id_param\\" integer, \\"expires_hours\\" integer) OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_bid_response\\"(\\"bid_id_param\\" integer) RETURNS \\"jsonb\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n    result JSONB;\r\nBEGIN\r\n  -- Try new schema first - get submission data from linked artifact\r\n  SELECT s.submission_data INTO result\r\n  FROM public.bids b\r\n  JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id\r\n  WHERE b.id = bid_id_param;\r\n  \r\n  IF result IS NOT NULL THEN\r\n    RETURN result;\r\n  END IF;\r\n  \r\n  -- Fallback to legacy schema\r\n  SELECT response INTO result\r\n  FROM public.bids \r\n  WHERE id = bid_id_param;\r\n  \r\n  RETURN COALESCE(result, '{}'::jsonb);\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_bid_response\\"(\\"bid_id_param\\" integer) OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_latest_submission\\"(\\"artifact_id_param\\" \\"text\\", \\"session_id_param\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\") RETURNS \\"jsonb\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n  result JSONB;\r\nBEGIN\r\n  SELECT submission_data INTO result\r\n  FROM public.artifact_submissions\r\n  WHERE artifact_id = artifact_id_param\r\n  AND (session_id_param IS NULL OR session_id = session_id_param)\r\n  ORDER BY submitted_at DESC\r\n  LIMIT 1;\r\n  \r\n  RETURN COALESCE(result, '{}'::jsonb);\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_latest_submission\\"(\\"artifact_id_param\\" \\"text\\", \\"session_id_param\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_rfp_artifacts\\"(\\"rfp_id_param\\" integer) RETURNS TABLE(\\"artifact_id\\" \\"text\\", \\"artifact_name\\" \\"text\\", \\"artifact_type\\" \\"text\\", \\"artifact_role\\" \\"text\\", \\"schema\\" \\"jsonb\\", \\"ui_schema\\" \\"jsonb\\", \\"form_data\\" \\"jsonb\\", \\"created_at\\" timestamp with time zone)\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT \r\n    a.id as artifact_id,\r\n    a.name as artifact_name,\r\n    a.type as artifact_type,\r\n    ra.role as artifact_role,\r\n    a.schema,\r\n    a.ui_schema,\r\n    a.form_data,\r\n    a.created_at\r\n  FROM public.artifacts a\r\n  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id\r\n  WHERE ra.rfp_id = rfp_id_param\r\n  AND a.status = 'active'\r\n  ORDER BY ra.role, a.created_at;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_rfp_artifacts\\"(\\"rfp_id_param\\" integer) OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_session_active_agent\\"(\\"session_uuid\\" \\"uuid\\") RETURNS TABLE(\\"agent_id\\" \\"uuid\\", \\"agent_name\\" \\"text\\", \\"agent_instructions\\" \\"text\\", \\"agent_initial_prompt\\" \\"text\\", \\"agent_avatar_url\\" \\"text\\")\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT \r\n    a.id as agent_id,\r\n    a.name as agent_name,\r\n    a.instructions as agent_instructions,\r\n    a.initial_prompt as agent_initial_prompt,\r\n    a.avatar_url as agent_avatar_url\r\n  FROM public.agents a\r\n  INNER JOIN public.session_agents sa ON a.id = sa.agent_id\r\n  WHERE sa.session_id = session_uuid \r\n    AND sa.is_active = true\r\n    AND a.is_active = true\r\n  ORDER BY sa.started_at DESC\r\n  LIMIT 1;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_session_active_agent\\"(\\"session_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_sessions_with_stats\\"(\\"user_uuid\\" \\"uuid\\") RETURNS TABLE(\\"id\\" \\"uuid\\", \\"title\\" \\"text\\", \\"description\\" \\"text\\", \\"created_at\\" timestamp with time zone, \\"updated_at\\" timestamp with time zone, \\"message_count\\" bigint, \\"last_message\\" \\"text\\", \\"last_message_at\\" timestamp with time zone, \\"artifact_count\\" bigint)\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nBEGIN\r\n  RETURN QUERY\r\n  SELECT \r\n    s.id,\r\n    s.title,\r\n    s.description,\r\n    s.created_at,\r\n    s.updated_at,\r\n    COALESCE(msg_stats.message_count, 0) as message_count,\r\n    msg_stats.last_message,\r\n    msg_stats.last_message_at,\r\n    COALESCE(art_stats.artifact_count, 0) as artifact_count\r\n  FROM public.sessions s\r\n  LEFT JOIN (\r\n    SELECT \r\n      session_id,\r\n      COUNT(*) as message_count,\r\n      MAX(content) as last_message,\r\n      MAX(created_at) as last_message_at\r\n    FROM public.messages \r\n    WHERE role = 'user'\r\n    GROUP BY session_id\r\n  ) msg_stats ON s.id = msg_stats.session_id\r\n  LEFT JOIN (\r\n    SELECT \r\n      session_id,\r\n      COUNT(*) as artifact_count\r\n    FROM public.artifacts\r\n    GROUP BY session_id\r\n  ) art_stats ON s.id = art_stats.session_id\r\n  WHERE s.user_id = user_uuid AND s.is_archived = FALSE\r\n  ORDER BY s.updated_at DESC;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_sessions_with_stats\\"(\\"user_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") RETURNS \\"uuid\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n  current_agent_id UUID;\r\nBEGIN\r\n  -- Get the current agent from the user's current session\r\n  SELECT s.current_agent_id INTO current_agent_id\r\n  FROM public.user_profiles up\r\n  JOIN public.sessions s ON up.current_session_id = s.id\r\n  WHERE up.supabase_user_id = user_uuid;\r\n  \r\n  RETURN current_agent_id;\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RETURN NULL;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","COMMENT ON FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") IS 'Gets the user''s current agent ID via their current session'","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_user_current_session\\"(\\"user_uuid\\" \\"uuid\\") RETURNS \\"uuid\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n    session_id_var uuid;\r\n    profile_id_var uuid;\r\nBEGIN\r\n    -- First get the user profile ID from the Supabase auth user ID\r\n    SELECT id INTO profile_id_var\r\n    FROM user_profiles \r\n    WHERE supabase_user_id = user_uuid;\r\n    \r\n    -- If no profile found, return null\r\n    IF profile_id_var IS NULL THEN\r\n        RETURN NULL;\r\n    END IF;\r\n    \r\n    -- Try to get the current_session_id from user_profiles using the profile ID\r\n    SELECT current_session_id INTO session_id_var\r\n    FROM user_profiles \r\n    WHERE id = profile_id_var;\r\n    \r\n    -- If current_session_id is not null and the session exists, return it\r\n    IF session_id_var IS NOT NULL THEN\r\n        IF EXISTS (SELECT 1 FROM sessions WHERE id = session_id_var AND user_id = profile_id_var) THEN\r\n            RETURN session_id_var;\r\n        END IF;\r\n    END IF;\r\n    \r\n    -- Otherwise, get the most recent session for this user (using profile ID)\r\n    SELECT id INTO session_id_var\r\n    FROM sessions \r\n    WHERE user_id = profile_id_var \r\n    ORDER BY updated_at DESC, created_at DESC \r\n    LIMIT 1;\r\n    \r\n    -- Update the user profile with this session ID\r\n    IF session_id_var IS NOT NULL THEN\r\n        UPDATE user_profiles \r\n        SET current_session_id = session_id_var \r\n        WHERE id = profile_id_var;\r\n    END IF;\r\n    \r\n    RETURN session_id_var;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_user_current_session\\"(\\"user_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"get_users_by_role\\"(\\"role_filter\\" \\"text\\" DEFAULT NULL::\\"text\\") RETURNS TABLE(\\"id\\" \\"uuid\\", \\"supabase_user_id\\" \\"uuid\\", \\"email\\" \\"text\\", \\"full_name\\" \\"text\\", \\"avatar_url\\" \\"text\\", \\"role\\" \\"text\\", \\"last_login\\" timestamp with time zone, \\"created_at\\" timestamp with time zone, \\"updated_at\\" timestamp with time zone)\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nBEGIN\r\n  IF role_filter IS NULL THEN\r\n    RETURN QUERY \r\n    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at \r\n    FROM public.user_profiles u\r\n    ORDER BY u.created_at DESC;\r\n  ELSE\r\n    RETURN QUERY \r\n    SELECT u.id, u.supabase_user_id, u.email, u.full_name, u.avatar_url, u.role, u.last_login, u.created_at, u.updated_at \r\n    FROM public.user_profiles u\r\n    WHERE u.role = role_filter\r\n    ORDER BY u.created_at DESC;\r\n  END IF;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"get_users_by_role\\"(\\"role_filter\\" \\"text\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n  user_profile_id UUID;\r\nBEGIN\r\n  -- Find the user profile ID from the supabase user ID\r\n  SELECT id INTO user_profile_id \r\n  FROM public.user_profiles \r\n  WHERE supabase_user_id = user_uuid;\r\n  \r\n  IF user_profile_id IS NULL THEN\r\n    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;\r\n    RETURN FALSE;\r\n  END IF;\r\n  \r\n  -- Update the user profile with current session only\r\n  UPDATE public.user_profiles \r\n  SET \r\n    current_session_id = COALESCE(session_uuid, current_session_id),\r\n    updated_at = NOW()\r\n  WHERE id = user_profile_id;\r\n  \r\n  RETURN TRUE;\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RAISE NOTICE 'Error updating user context: %', SQLERRM;\r\n    RETURN FALSE;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\", \\"agent_uuid\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n  user_profile_id UUID;\r\nBEGIN\r\n  -- Find the user profile ID from the supabase user ID\r\n  SELECT id INTO user_profile_id \r\n  FROM public.user_profiles \r\n  WHERE supabase_user_id = user_uuid;\r\n  \r\n  IF user_profile_id IS NULL THEN\r\n    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;\r\n    RETURN FALSE;\r\n  END IF;\r\n  \r\n  -- Update the user profile with current session and/or agent\r\n  UPDATE public.user_profiles \r\n  SET \r\n    current_session_id = COALESCE(session_uuid, current_session_id),\r\n    current_agent_id = COALESCE(agent_uuid, current_agent_id),\r\n    updated_at = NOW()\r\n  WHERE id = user_profile_id;\r\n  \r\n  RETURN TRUE;\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RAISE NOTICE 'Error updating user context: %', SQLERRM;\r\n    RETURN FALSE;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\", \\"agent_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"set_user_current_session\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nDECLARE\r\n  user_profile_id UUID;\r\nBEGIN\r\n  -- Get the user profile ID from supabase_user_id\r\n  SELECT id INTO user_profile_id \r\n  FROM public.user_profiles \r\n  WHERE supabase_user_id = user_uuid;\r\n  \r\n  IF user_profile_id IS NULL THEN\r\n    RETURN FALSE;\r\n  END IF;\r\n  \r\n  -- Update the current session\r\n  UPDATE public.user_profiles \r\n  SET current_session_id = session_uuid,\r\n      updated_at = NOW()\r\n  WHERE id = user_profile_id;\r\n  \r\n  RETURN TRUE;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"set_user_current_session\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"switch_session_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"new_agent_uuid\\" \\"uuid\\", \\"user_uuid\\" \\"uuid\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nDECLARE\r\n  session_user_id UUID;\r\nBEGIN\r\n  -- Verify the session belongs to the user\r\n  SELECT user_id INTO session_user_id \r\n  FROM public.sessions \r\n  WHERE id = session_uuid;\r\n  \r\n  IF session_user_id != user_uuid THEN\r\n    RETURN FALSE;\r\n  END IF;\r\n  \r\n  -- Deactivate current agent\r\n  UPDATE public.session_agents \r\n  SET is_active = false, ended_at = NOW()\r\n  WHERE session_id = session_uuid AND is_active = true;\r\n  \r\n  -- Add new active agent\r\n  INSERT INTO public.session_agents (session_id, agent_id, is_active)\r\n  VALUES (session_uuid, new_agent_uuid, true);\r\n  \r\n  RETURN TRUE;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"switch_session_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"new_agent_uuid\\" \\"uuid\\", \\"user_uuid\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"update_artifact_submissions_updated_at\\"() RETURNS \\"trigger\\"\r\n    LANGUAGE \\"plpgsql\\"\r\n    AS $$\r\nBEGIN\r\n  NEW.updated_at = NOW();\r\n  RETURN NEW;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"update_artifact_submissions_updated_at\\"() OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"update_session_context_with_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"rfp_id_param\\" integer DEFAULT NULL::integer, \\"artifact_id_param\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\", \\"agent_id_param\\" \\"uuid\\" DEFAULT NULL::\\"uuid\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    AS $$\r\nBEGIN\r\n  UPDATE public.sessions \r\n  SET \r\n    current_rfp_id = COALESCE(rfp_id_param, current_rfp_id),\r\n    current_artifact_id = COALESCE(artifact_id_param, current_artifact_id),\r\n    current_agent_id = COALESCE(agent_id_param, current_agent_id),\r\n    updated_at = NOW()\r\n  WHERE id = session_uuid;\r\n  \r\n  RETURN FOUND;\r\nEXCEPTION\r\n  WHEN OTHERS THEN\r\n    RAISE NOTICE 'Error updating session context: %', SQLERRM;\r\n    RETURN FALSE;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"update_session_context_with_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"rfp_id_param\\" integer, \\"artifact_id_param\\" \\"uuid\\", \\"agent_id_param\\" \\"uuid\\") OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"update_updated_at_column\\"() RETURNS \\"trigger\\"\r\n    LANGUAGE \\"plpgsql\\" SECURITY DEFINER\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nBEGIN\r\n  NEW.updated_at = NOW();\r\n  RETURN NEW;\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"update_updated_at_column\\"() OWNER TO \\"postgres\\"","CREATE OR REPLACE FUNCTION \\"public\\".\\"validate_form_spec\\"(\\"spec\\" \\"jsonb\\") RETURNS boolean\r\n    LANGUAGE \\"plpgsql\\"\r\n    SET \\"search_path\\" TO ''\r\n    AS $$\r\nBEGIN\r\n  -- Basic validation that form_spec has required structure\r\n  RETURN (\r\n    spec IS NULL OR (\r\n      jsonb_typeof(spec) = 'object' AND\r\n      spec ? 'version' AND\r\n      spec ? 'schema' AND\r\n      jsonb_typeof(spec->'schema') = 'object'\r\n    )\r\n  );\r\nEND;\r\n$$","ALTER FUNCTION \\"public\\".\\"validate_form_spec\\"(\\"spec\\" \\"jsonb\\") OWNER TO \\"postgres\\"","SET default_tablespace = ''","SET default_table_access_method = \\"heap\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"agents\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"name\\" \\"text\\" NOT NULL,\r\n    \\"description\\" \\"text\\",\r\n    \\"instructions\\" \\"text\\" NOT NULL,\r\n    \\"initial_prompt\\" \\"text\\" NOT NULL,\r\n    \\"avatar_url\\" \\"text\\",\r\n    \\"is_active\\" boolean DEFAULT true,\r\n    \\"sort_order\\" integer DEFAULT 0,\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"is_default\\" boolean DEFAULT false,\r\n    \\"is_restricted\\" boolean DEFAULT false,\r\n    \\"is_free\\" boolean DEFAULT false,\r\n    \\"role\\" \\"text\\"\r\n)","ALTER TABLE \\"public\\".\\"agents\\" OWNER TO \\"postgres\\"","COMMENT ON COLUMN \\"public\\".\\"agents\\".\\"role\\" IS 'Functional role of the agent (e.g., sales, design, support, assistant, audit, billing, etc.)'","CREATE TABLE IF NOT EXISTS \\"public\\".\\"artifact_submissions\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"artifact_id\\" \\"text\\",\r\n    \\"session_id\\" \\"uuid\\",\r\n    \\"user_id\\" \\"uuid\\",\r\n    \\"submission_data\\" \\"jsonb\\" NOT NULL,\r\n    \\"form_version\\" \\"text\\",\r\n    \\"submitted_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"ip_address\\" \\"inet\\",\r\n    \\"user_agent\\" \\"text\\",\r\n    \\"metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"()\r\n)","ALTER TABLE \\"public\\".\\"artifact_submissions\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"artifacts\\" (\r\n    \\"id\\" \\"text\\" NOT NULL,\r\n    \\"user_id\\" \\"uuid\\",\r\n    \\"session_id\\" \\"uuid\\",\r\n    \\"message_id\\" \\"uuid\\",\r\n    \\"name\\" \\"text\\" NOT NULL,\r\n    \\"description\\" \\"text\\",\r\n    \\"type\\" \\"text\\" DEFAULT 'form'::\\"text\\" NOT NULL,\r\n    \\"file_type\\" \\"text\\",\r\n    \\"file_size\\" bigint,\r\n    \\"storage_path\\" \\"text\\",\r\n    \\"mime_type\\" \\"text\\",\r\n    \\"schema\\" \\"jsonb\\",\r\n    \\"ui_schema\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"default_values\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"submit_action\\" \\"jsonb\\" DEFAULT '{\\"type\\": \\"save_session\\"}'::\\"jsonb\\",\r\n    \\"is_template\\" boolean DEFAULT false,\r\n    \\"template_category\\" \\"text\\",\r\n    \\"template_tags\\" \\"text\\"[],\r\n    \\"artifact_role\\" \\"text\\" NOT NULL,\r\n    \\"status\\" \\"text\\" DEFAULT 'active'::\\"text\\",\r\n    \\"processing_status\\" \\"text\\" DEFAULT 'completed'::\\"text\\",\r\n    \\"processed_content\\" \\"text\\",\r\n    \\"metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    CONSTRAINT \\"artifacts_new_artifact_role_check\\" CHECK ((\\"artifact_role\\" = ANY (ARRAY['buyer_questionnaire'::\\"text\\", 'bid_form'::\\"text\\", 'request_document'::\\"text\\", 'template'::\\"text\\"]))),\r\n    CONSTRAINT \\"artifacts_new_processing_status_check\\" CHECK ((\\"processing_status\\" = ANY (ARRAY['pending'::\\"text\\", 'processing'::\\"text\\", 'completed'::\\"text\\", 'failed'::\\"text\\"]))),\r\n    CONSTRAINT \\"artifacts_new_status_check\\" CHECK ((\\"status\\" = ANY (ARRAY['active'::\\"text\\", 'inactive'::\\"text\\", 'deleted'::\\"text\\"]))),\r\n    CONSTRAINT \\"artifacts_new_type_check\\" CHECK ((\\"type\\" = ANY (ARRAY['form'::\\"text\\", 'document'::\\"text\\", 'image'::\\"text\\", 'pdf'::\\"text\\", 'template'::\\"text\\", 'other'::\\"text\\"])))\r\n)","ALTER TABLE \\"public\\".\\"artifacts\\" OWNER TO \\"postgres\\"","COMMENT ON COLUMN \\"public\\".\\"artifacts\\".\\"default_values\\" IS 'Default/pre-filled form values for form artifacts'","CREATE TABLE IF NOT EXISTS \\"public\\".\\"bids\\" (\r\n    \\"id\\" integer NOT NULL,\r\n    \\"rfp_id\\" integer,\r\n    \\"agent_id\\" integer NOT NULL,\r\n    \\"created_at\\" timestamp without time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp without time zone DEFAULT \\"now\\"(),\r\n    \\"response\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"artifact_submission_id\\" \\"uuid\\",\r\n    \\"supplier_id\\" integer\r\n)","ALTER TABLE \\"public\\".\\"bids\\" OWNER TO \\"postgres\\"","COMMENT ON COLUMN \\"public\\".\\"bids\\".\\"response\\" IS 'Vendor response data captured from the form_spec form'","COMMENT ON COLUMN \\"public\\".\\"bids\\".\\"supplier_id\\" IS 'Foreign key reference to supplier_profiles table - identifies which supplier submitted this bid'","CREATE SEQUENCE IF NOT EXISTS \\"public\\".\\"bid_id_seq\\"\r\n    AS integer\r\n    START WITH 1\r\n    INCREMENT BY 1\r\n    NO MINVALUE\r\n    NO MAXVALUE\r\n    CACHE 1","ALTER SEQUENCE \\"public\\".\\"bid_id_seq\\" OWNER TO \\"postgres\\"","ALTER SEQUENCE \\"public\\".\\"bid_id_seq\\" OWNED BY \\"public\\".\\"bids\\".\\"id\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"messages\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"session_id\\" \\"uuid\\" NOT NULL,\r\n    \\"user_id\\" \\"uuid\\" NOT NULL,\r\n    \\"content\\" \\"text\\" NOT NULL,\r\n    \\"role\\" \\"text\\" NOT NULL,\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"message_order\\" integer DEFAULT 0 NOT NULL,\r\n    \\"metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"ai_metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"agent_id\\" \\"uuid\\",\r\n    \\"agent_name\\" \\"text\\",\r\n    CONSTRAINT \\"messages_role_check\\" CHECK ((\\"role\\" = ANY (ARRAY['user'::\\"text\\", 'assistant'::\\"text\\", 'system'::\\"text\\"])))\r\n)","ALTER TABLE \\"public\\".\\"messages\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"rfp_artifacts\\" (\r\n    \\"rfp_id\\" integer NOT NULL,\r\n    \\"artifact_id\\" \\"text\\" NOT NULL,\r\n    \\"role\\" \\"text\\" NOT NULL,\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    CONSTRAINT \\"rfp_artifacts_new_role_check\\" CHECK ((\\"role\\" = ANY (ARRAY['buyer'::\\"text\\", 'supplier'::\\"text\\", 'evaluator'::\\"text\\"])))\r\n)","ALTER TABLE \\"public\\".\\"rfp_artifacts\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"rfps\\" (\r\n    \\"id\\" integer NOT NULL,\r\n    \\"name\\" \\"text\\" NOT NULL,\r\n    \\"due_date\\" \\"date\\",\r\n    \\"description\\" \\"text\\" DEFAULT ''::\\"text\\",\r\n    \\"is_template\\" boolean DEFAULT false,\r\n    \\"is_public\\" boolean DEFAULT false,\r\n    \\"created_at\\" timestamp without time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp without time zone DEFAULT \\"now\\"(),\r\n    \\"specification\\" \\"text\\" DEFAULT ''::\\"text\\",\r\n    \\"status\\" \\"text\\" DEFAULT 'draft'::\\"text\\",\r\n    \\"completion_percentage\\" integer DEFAULT 0,\r\n    CONSTRAINT \\"rfps_completion_percentage_check\\" CHECK (((\\"completion_percentage\\" >= 0) AND (\\"completion_percentage\\" <= 100))),\r\n    CONSTRAINT \\"rfps_status_check\\" CHECK ((\\"status\\" = ANY (ARRAY['draft'::\\"text\\", 'gathering_requirements'::\\"text\\", 'generating_forms'::\\"text\\", 'collecting_responses'::\\"text\\", 'completed'::\\"text\\"])))\r\n)","ALTER TABLE \\"public\\".\\"rfps\\" OWNER TO \\"postgres\\"","CREATE SEQUENCE IF NOT EXISTS \\"public\\".\\"rfp_id_seq\\"\r\n    AS integer\r\n    START WITH 1\r\n    INCREMENT BY 1\r\n    NO MINVALUE\r\n    NO MAXVALUE\r\n    CACHE 1","ALTER SEQUENCE \\"public\\".\\"rfp_id_seq\\" OWNER TO \\"postgres\\"","ALTER SEQUENCE \\"public\\".\\"rfp_id_seq\\" OWNED BY \\"public\\".\\"rfps\\".\\"id\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"session_agents\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"session_id\\" \\"uuid\\" NOT NULL,\r\n    \\"agent_id\\" \\"uuid\\",\r\n    \\"started_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"ended_at\\" timestamp with time zone,\r\n    \\"is_active\\" boolean DEFAULT true\r\n)","ALTER TABLE \\"public\\".\\"session_agents\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"session_artifacts\\" (\r\n    \\"session_id\\" \\"uuid\\" NOT NULL,\r\n    \\"artifact_id\\" \\"uuid\\" NOT NULL,\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"()\r\n)","ALTER TABLE \\"public\\".\\"session_artifacts\\" OWNER TO \\"postgres\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"sessions\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"user_id\\" \\"uuid\\" NOT NULL,\r\n    \\"title\\" \\"text\\" DEFAULT 'New Session'::\\"text\\" NOT NULL,\r\n    \\"description\\" \\"text\\",\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"is_archived\\" boolean DEFAULT false,\r\n    \\"session_metadata\\" \\"jsonb\\" DEFAULT '{}'::\\"jsonb\\",\r\n    \\"current_agent_id\\" \\"uuid\\",\r\n    \\"current_rfp_id\\" integer,\r\n    \\"current_artifact_id\\" \\"text\\"\r\n)","ALTER TABLE \\"public\\".\\"sessions\\" OWNER TO \\"postgres\\"","COMMENT ON COLUMN \\"public\\".\\"sessions\\".\\"current_agent_id\\" IS 'Reference to the agent being used in this session'","COMMENT ON COLUMN \\"public\\".\\"sessions\\".\\"current_rfp_id\\" IS 'Reference to the current RFP being worked on in this session'","COMMENT ON COLUMN \\"public\\".\\"sessions\\".\\"current_artifact_id\\" IS 'Reference to the current artifact being worked on in this session'","CREATE TABLE IF NOT EXISTS \\"public\\".\\"supplier_profiles\\" (\r\n    \\"id\\" integer NOT NULL,\r\n    \\"name\\" \\"text\\" NOT NULL,\r\n    \\"description\\" \\"text\\",\r\n    \\"email\\" \\"text\\",\r\n    \\"phone\\" \\"text\\",\r\n    \\"rfpez_account_id\\" integer\r\n)","ALTER TABLE \\"public\\".\\"supplier_profiles\\" OWNER TO \\"postgres\\"","CREATE SEQUENCE IF NOT EXISTS \\"public\\".\\"supplier_id_seq\\"\r\n    AS integer\r\n    START WITH 1\r\n    INCREMENT BY 1\r\n    NO MINVALUE\r\n    NO MAXVALUE\r\n    CACHE 1","ALTER SEQUENCE \\"public\\".\\"supplier_id_seq\\" OWNER TO \\"postgres\\"","ALTER SEQUENCE \\"public\\".\\"supplier_id_seq\\" OWNED BY \\"public\\".\\"supplier_profiles\\".\\"id\\"","CREATE TABLE IF NOT EXISTS \\"public\\".\\"user_profiles\\" (\r\n    \\"id\\" \\"uuid\\" DEFAULT \\"gen_random_uuid\\"() NOT NULL,\r\n    \\"email\\" \\"text\\",\r\n    \\"full_name\\" \\"text\\",\r\n    \\"avatar_url\\" \\"text\\",\r\n    \\"last_login\\" timestamp with time zone,\r\n    \\"created_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"updated_at\\" timestamp with time zone DEFAULT \\"now\\"(),\r\n    \\"supabase_user_id\\" \\"uuid\\" NOT NULL,\r\n    \\"role\\" \\"text\\" DEFAULT 'user'::\\"text\\" NOT NULL,\r\n    \\"current_session_id\\" \\"uuid\\",\r\n    \\"current_rfp_id\\" integer,\r\n    CONSTRAINT \\"user_profiles_role_check\\" CHECK ((\\"role\\" = ANY (ARRAY['user'::\\"text\\", 'developer'::\\"text\\", 'administrator'::\\"text\\"])))\r\n)","ALTER TABLE \\"public\\".\\"user_profiles\\" OWNER TO \\"postgres\\"","COMMENT ON COLUMN \\"public\\".\\"user_profiles\\".\\"role\\" IS 'User role in ascending order of access: user, developer, administrator'","COMMENT ON COLUMN \\"public\\".\\"user_profiles\\".\\"current_session_id\\" IS 'Reference to the user''s currently active session (agent context derived from session)'","ALTER TABLE ONLY \\"public\\".\\"bids\\" ALTER COLUMN \\"id\\" SET DEFAULT \\"nextval\\"('\\"public\\".\\"bid_id_seq\\"'::\\"regclass\\")","ALTER TABLE ONLY \\"public\\".\\"rfps\\" ALTER COLUMN \\"id\\" SET DEFAULT \\"nextval\\"('\\"public\\".\\"rfp_id_seq\\"'::\\"regclass\\")","ALTER TABLE ONLY \\"public\\".\\"supplier_profiles\\" ALTER COLUMN \\"id\\" SET DEFAULT \\"nextval\\"('\\"public\\".\\"supplier_id_seq\\"'::\\"regclass\\")","ALTER TABLE ONLY \\"public\\".\\"agents\\"\r\n    ADD CONSTRAINT \\"agents_name_key\\" UNIQUE (\\"name\\")","ALTER TABLE ONLY \\"public\\".\\"agents\\"\r\n    ADD CONSTRAINT \\"agents_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"artifact_submissions\\"\r\n    ADD CONSTRAINT \\"artifact_submissions_new_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"artifacts\\"\r\n    ADD CONSTRAINT \\"artifacts_new_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"bids\\"\r\n    ADD CONSTRAINT \\"bid_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"messages\\"\r\n    ADD CONSTRAINT \\"messages_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"rfp_artifacts\\"\r\n    ADD CONSTRAINT \\"rfp_artifacts_new_pkey\\" PRIMARY KEY (\\"rfp_id\\", \\"artifact_id\\", \\"role\\")","ALTER TABLE ONLY \\"public\\".\\"rfps\\"\r\n    ADD CONSTRAINT \\"rfp_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"session_agents\\"\r\n    ADD CONSTRAINT \\"session_agents_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"session_artifacts\\"\r\n    ADD CONSTRAINT \\"session_artifacts_pkey\\" PRIMARY KEY (\\"session_id\\", \\"artifact_id\\")","ALTER TABLE ONLY \\"public\\".\\"sessions\\"\r\n    ADD CONSTRAINT \\"sessions_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"supplier_profiles\\"\r\n    ADD CONSTRAINT \\"supplier_pkey\\" PRIMARY KEY (\\"id\\")","ALTER TABLE ONLY \\"public\\".\\"user_profiles\\"\r\n    ADD CONSTRAINT \\"user_profiles_pkey\\" PRIMARY KEY (\\"id\\")","CREATE INDEX \\"idx_agents_access\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"is_active\\", \\"is_restricted\\", \\"sort_order\\")","CREATE INDEX \\"idx_agents_active\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"is_active\\", \\"sort_order\\")","CREATE INDEX \\"idx_agents_default\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"is_default\\") WHERE (\\"is_default\\" = true)","CREATE INDEX \\"idx_agents_free\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"is_free\\")","CREATE INDEX \\"idx_agents_restricted\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"is_restricted\\")","CREATE INDEX \\"idx_agents_role\\" ON \\"public\\".\\"agents\\" USING \\"btree\\" (\\"role\\")","CREATE INDEX \\"idx_artifact_submissions_new_artifact_id\\" ON \\"public\\".\\"artifact_submissions\\" USING \\"btree\\" (\\"artifact_id\\")","CREATE INDEX \\"idx_artifact_submissions_new_session_id\\" ON \\"public\\".\\"artifact_submissions\\" USING \\"btree\\" (\\"session_id\\")","CREATE INDEX \\"idx_artifact_submissions_new_submitted_at\\" ON \\"public\\".\\"artifact_submissions\\" USING \\"btree\\" (\\"submitted_at\\")","CREATE INDEX \\"idx_artifact_submissions_new_user_id\\" ON \\"public\\".\\"artifact_submissions\\" USING \\"btree\\" (\\"user_id\\")","CREATE INDEX \\"idx_artifacts_new_artifact_role\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"artifact_role\\")","CREATE INDEX \\"idx_artifacts_new_created_at\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"created_at\\")","CREATE INDEX \\"idx_artifacts_new_session_id\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"session_id\\")","CREATE INDEX \\"idx_artifacts_new_status\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"status\\")","CREATE INDEX \\"idx_artifacts_new_template\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"is_template\\") WHERE (\\"is_template\\" = true)","CREATE INDEX \\"idx_artifacts_new_type\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"type\\")","CREATE INDEX \\"idx_artifacts_new_user_id\\" ON \\"public\\".\\"artifacts\\" USING \\"btree\\" (\\"user_id\\")","CREATE INDEX \\"idx_bid_response\\" ON \\"public\\".\\"bids\\" USING \\"gin\\" (\\"response\\")","CREATE INDEX \\"idx_bids_artifact_submission_id\\" ON \\"public\\".\\"bids\\" USING \\"btree\\" (\\"artifact_submission_id\\")","CREATE INDEX \\"idx_bids_supplier_id\\" ON \\"public\\".\\"bids\\" USING \\"btree\\" (\\"supplier_id\\")","CREATE INDEX \\"idx_messages_agent_id\\" ON \\"public\\".\\"messages\\" USING \\"btree\\" (\\"agent_id\\")","CREATE INDEX \\"idx_messages_created_at\\" ON \\"public\\".\\"messages\\" USING \\"btree\\" (\\"created_at\\" DESC)","CREATE INDEX \\"idx_messages_order\\" ON \\"public\\".\\"messages\\" USING \\"btree\\" (\\"session_id\\", \\"message_order\\")","CREATE INDEX \\"idx_messages_session_id\\" ON \\"public\\".\\"messages\\" USING \\"btree\\" (\\"session_id\\")","CREATE INDEX \\"idx_messages_user_id\\" ON \\"public\\".\\"messages\\" USING \\"btree\\" (\\"user_id\\")","CREATE INDEX \\"idx_rfp_artifacts_new_artifact_id\\" ON \\"public\\".\\"rfp_artifacts\\" USING \\"btree\\" (\\"artifact_id\\")","CREATE INDEX \\"idx_rfp_artifacts_new_rfp_id\\" ON \\"public\\".\\"rfp_artifacts\\" USING \\"btree\\" (\\"rfp_id\\")","CREATE INDEX \\"idx_rfp_artifacts_new_role\\" ON \\"public\\".\\"rfp_artifacts\\" USING \\"btree\\" (\\"role\\")","CREATE INDEX \\"idx_rfps_completion\\" ON \\"public\\".\\"rfps\\" USING \\"btree\\" (\\"completion_percentage\\")","CREATE INDEX \\"idx_rfps_status\\" ON \\"public\\".\\"rfps\\" USING \\"btree\\" (\\"status\\")","CREATE INDEX \\"idx_session_agents_active\\" ON \\"public\\".\\"session_agents\\" USING \\"btree\\" (\\"session_id\\", \\"is_active\\")","CREATE INDEX \\"idx_session_agents_agent_id\\" ON \\"public\\".\\"session_agents\\" USING \\"btree\\" (\\"agent_id\\")","CREATE INDEX \\"idx_session_agents_session_id\\" ON \\"public\\".\\"session_agents\\" USING \\"btree\\" (\\"session_id\\")","CREATE INDEX \\"idx_sessions_created_at\\" ON \\"public\\".\\"sessions\\" USING \\"btree\\" (\\"created_at\\" DESC)","CREATE INDEX \\"idx_sessions_current_agent_id\\" ON \\"public\\".\\"sessions\\" USING \\"btree\\" (\\"current_agent_id\\")","CREATE INDEX \\"idx_sessions_current_artifact_id\\" ON \\"public\\".\\"sessions\\" USING \\"btree\\" (\\"current_artifact_id\\")","CREATE INDEX \\"idx_sessions_current_rfp_id\\" ON \\"public\\".\\"sessions\\" USING \\"btree\\" (\\"current_rfp_id\\")","CREATE INDEX \\"idx_sessions_user_id\\" ON \\"public\\".\\"sessions\\" USING \\"btree\\" (\\"user_id\\")","CREATE INDEX \\"idx_user_profiles_current_session_id\\" ON \\"public\\".\\"user_profiles\\" USING \\"btree\\" (\\"current_session_id\\")","CREATE INDEX \\"idx_user_profiles_role\\" ON \\"public\\".\\"user_profiles\\" USING \\"btree\\" (\\"role\\")","CREATE UNIQUE INDEX \\"idx_user_profiles_supabase_user_id\\" ON \\"public\\".\\"user_profiles\\" USING \\"btree\\" (\\"supabase_user_id\\") WHERE (\\"supabase_user_id\\" IS NOT NULL)","CREATE OR REPLACE TRIGGER \\"update_agents_updated_at\\" BEFORE UPDATE ON \\"public\\".\\"agents\\" FOR EACH ROW EXECUTE FUNCTION \\"public\\".\\"update_updated_at_column\\"()","CREATE OR REPLACE TRIGGER \\"update_artifacts_new_updated_at\\" BEFORE UPDATE ON \\"public\\".\\"artifacts\\" FOR EACH ROW EXECUTE FUNCTION \\"public\\".\\"update_updated_at_column\\"()","CREATE OR REPLACE TRIGGER \\"update_sessions_updated_at\\" BEFORE UPDATE ON \\"public\\".\\"sessions\\" FOR EACH ROW EXECUTE FUNCTION \\"public\\".\\"update_updated_at_column\\"()","CREATE OR REPLACE TRIGGER \\"update_user_profiles_updated_at\\" BEFORE UPDATE ON \\"public\\".\\"user_profiles\\" FOR EACH ROW EXECUTE FUNCTION \\"public\\".\\"update_updated_at_column\\"()","ALTER TABLE ONLY \\"public\\".\\"artifact_submissions\\"\r\n    ADD CONSTRAINT \\"artifact_submissions_new_artifact_id_fkey\\" FOREIGN KEY (\\"artifact_id\\") REFERENCES \\"public\\".\\"artifacts\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"artifact_submissions\\"\r\n    ADD CONSTRAINT \\"artifact_submissions_new_session_id_fkey\\" FOREIGN KEY (\\"session_id\\") REFERENCES \\"public\\".\\"sessions\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"artifact_submissions\\"\r\n    ADD CONSTRAINT \\"artifact_submissions_new_user_id_fkey\\" FOREIGN KEY (\\"user_id\\") REFERENCES \\"auth\\".\\"users\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"artifacts\\"\r\n    ADD CONSTRAINT \\"artifacts_new_message_id_fkey\\" FOREIGN KEY (\\"message_id\\") REFERENCES \\"public\\".\\"messages\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"artifacts\\"\r\n    ADD CONSTRAINT \\"artifacts_new_session_id_fkey\\" FOREIGN KEY (\\"session_id\\") REFERENCES \\"public\\".\\"sessions\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"artifacts\\"\r\n    ADD CONSTRAINT \\"artifacts_new_user_id_fkey\\" FOREIGN KEY (\\"user_id\\") REFERENCES \\"auth\\".\\"users\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"bids\\"\r\n    ADD CONSTRAINT \\"bids_artifact_submission_id_fkey\\" FOREIGN KEY (\\"artifact_submission_id\\") REFERENCES \\"public\\".\\"artifact_submissions\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"bids\\"\r\n    ADD CONSTRAINT \\"bids_rfp_id_fkey\\" FOREIGN KEY (\\"rfp_id\\") REFERENCES \\"public\\".\\"rfps\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"bids\\"\r\n    ADD CONSTRAINT \\"bids_supplier_id_fkey\\" FOREIGN KEY (\\"supplier_id\\") REFERENCES \\"public\\".\\"supplier_profiles\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"messages\\"\r\n    ADD CONSTRAINT \\"messages_agent_id_fkey\\" FOREIGN KEY (\\"agent_id\\") REFERENCES \\"public\\".\\"agents\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"messages\\"\r\n    ADD CONSTRAINT \\"messages_session_id_fkey\\" FOREIGN KEY (\\"session_id\\") REFERENCES \\"public\\".\\"sessions\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"messages\\"\r\n    ADD CONSTRAINT \\"messages_user_id_fkey\\" FOREIGN KEY (\\"user_id\\") REFERENCES \\"public\\".\\"user_profiles\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"rfp_artifacts\\"\r\n    ADD CONSTRAINT \\"rfp_artifacts_new_artifact_id_fkey\\" FOREIGN KEY (\\"artifact_id\\") REFERENCES \\"public\\".\\"artifacts\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"rfp_artifacts\\"\r\n    ADD CONSTRAINT \\"rfp_artifacts_new_rfp_id_fkey\\" FOREIGN KEY (\\"rfp_id\\") REFERENCES \\"public\\".\\"rfps\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"session_agents\\"\r\n    ADD CONSTRAINT \\"session_agents_agent_id_fkey\\" FOREIGN KEY (\\"agent_id\\") REFERENCES \\"public\\".\\"agents\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"session_agents\\"\r\n    ADD CONSTRAINT \\"session_agents_session_id_fkey\\" FOREIGN KEY (\\"session_id\\") REFERENCES \\"public\\".\\"sessions\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"sessions\\"\r\n    ADD CONSTRAINT \\"sessions_current_agent_id_fkey\\" FOREIGN KEY (\\"current_agent_id\\") REFERENCES \\"public\\".\\"agents\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"sessions\\"\r\n    ADD CONSTRAINT \\"sessions_current_artifact_id_fkey\\" FOREIGN KEY (\\"current_artifact_id\\") REFERENCES \\"public\\".\\"artifacts\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"sessions\\"\r\n    ADD CONSTRAINT \\"sessions_current_rfp_id_fkey\\" FOREIGN KEY (\\"current_rfp_id\\") REFERENCES \\"public\\".\\"rfps\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"sessions\\"\r\n    ADD CONSTRAINT \\"sessions_user_id_fkey\\" FOREIGN KEY (\\"user_id\\") REFERENCES \\"public\\".\\"user_profiles\\"(\\"id\\") ON DELETE CASCADE","ALTER TABLE ONLY \\"public\\".\\"user_profiles\\"\r\n    ADD CONSTRAINT \\"user_profiles_current_session_id_fkey\\" FOREIGN KEY (\\"current_session_id\\") REFERENCES \\"public\\".\\"sessions\\"(\\"id\\") ON DELETE SET NULL","ALTER TABLE ONLY \\"public\\".\\"user_profiles\\"\r\n    ADD CONSTRAINT \\"user_profiles_supabase_user_id_fkey\\" FOREIGN KEY (\\"supabase_user_id\\") REFERENCES \\"auth\\".\\"users\\"(\\"id\\")","CREATE POLICY \\"Allow authenticated users to create RFPs\\" ON \\"public\\".\\"rfps\\" FOR INSERT TO \\"authenticated\\" WITH CHECK (true)","CREATE POLICY \\"Allow authenticated users to delete agents\\" ON \\"public\\".\\"agents\\" FOR DELETE USING (true)","CREATE POLICY \\"Allow authenticated users to insert agents\\" ON \\"public\\".\\"agents\\" FOR INSERT WITH CHECK (true)","CREATE POLICY \\"Allow authenticated users to update RFPs\\" ON \\"public\\".\\"rfps\\" FOR UPDATE TO \\"authenticated\\" USING (true) WITH CHECK (true)","CREATE POLICY \\"Allow authenticated users to update agents\\" ON \\"public\\".\\"agents\\" FOR UPDATE USING (true) WITH CHECK (true)","CREATE POLICY \\"Allow authenticated users to view RFPs\\" ON \\"public\\".\\"rfps\\" FOR SELECT TO \\"authenticated\\" USING (true)","CREATE POLICY \\"Allow public bid submissions\\" ON \\"public\\".\\"bids\\" FOR INSERT TO \\"anon\\", \\"authenticated\\" WITH CHECK (true)","CREATE POLICY \\"Allow public supplier viewing\\" ON \\"public\\".\\"supplier_profiles\\" FOR SELECT USING (true)","CREATE POLICY \\"Allow updating bids\\" ON \\"public\\".\\"bids\\" FOR UPDATE TO \\"authenticated\\" USING (true) WITH CHECK (true)","CREATE POLICY \\"Allow viewing bids\\" ON \\"public\\".\\"bids\\" FOR SELECT TO \\"authenticated\\" USING (true)","CREATE POLICY \\"Anyone can view active agents\\" ON \\"public\\".\\"agents\\" FOR SELECT USING ((\\"is_active\\" = true))","CREATE POLICY \\"Authenticated users can manage RFP artifacts\\" ON \\"public\\".\\"rfp_artifacts\\" USING ((\\"auth\\".\\"role\\"() = 'authenticated'::\\"text\\"))","CREATE POLICY \\"RFP artifacts are publicly readable\\" ON \\"public\\".\\"rfp_artifacts\\" FOR SELECT USING (true)","CREATE POLICY \\"Users can create session artifacts in own sessions\\" ON \\"public\\".\\"session_artifacts\\" FOR INSERT WITH CHECK ((\\"auth\\".\\"uid\\"() IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\"\r\n     JOIN \\"public\\".\\"sessions\\" ON ((\\"sessions\\".\\"user_id\\" = \\"user_profiles\\".\\"id\\")))\r\n  WHERE (\\"sessions\\".\\"id\\" = \\"session_artifacts\\".\\"session_id\\"))))","CREATE POLICY \\"Users can create their own artifacts\\" ON \\"public\\".\\"artifacts\\" FOR INSERT WITH CHECK (((\\"user_id\\" = \\"auth\\".\\"uid\\"()) OR (\\"user_id\\" IS NULL)))","CREATE POLICY \\"Users can create their own submissions\\" ON \\"public\\".\\"artifact_submissions\\" FOR INSERT WITH CHECK ((\\"user_id\\" = \\"auth\\".\\"uid\\"()))","CREATE POLICY \\"Users can delete own profile\\" ON \\"public\\".\\"user_profiles\\" FOR DELETE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") = \\"supabase_user_id\\"))","CREATE POLICY \\"Users can delete session artifacts from own sessions\\" ON \\"public\\".\\"session_artifacts\\" FOR DELETE USING ((\\"auth\\".\\"uid\\"() IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\"\r\n     JOIN \\"public\\".\\"sessions\\" ON ((\\"sessions\\".\\"user_id\\" = \\"user_profiles\\".\\"id\\")))\r\n  WHERE (\\"sessions\\".\\"id\\" = \\"session_artifacts\\".\\"session_id\\"))))","CREATE POLICY \\"Users can delete their own artifacts\\" ON \\"public\\".\\"artifacts\\" FOR DELETE USING (((\\"user_id\\" = \\"auth\\".\\"uid\\"()) OR (\\"user_id\\" IS NULL)))","CREATE POLICY \\"Users can insert own profile\\" ON \\"public\\".\\"user_profiles\\" FOR INSERT WITH CHECK ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") = \\"supabase_user_id\\"))","CREATE POLICY \\"Users can read own profile\\" ON \\"public\\".\\"user_profiles\\" FOR SELECT USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") = \\"supabase_user_id\\"))","CREATE POLICY \\"Users can update own profile\\" ON \\"public\\".\\"user_profiles\\" FOR UPDATE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") = \\"supabase_user_id\\"))","CREATE POLICY \\"Users can update their own artifacts\\" ON \\"public\\".\\"artifacts\\" FOR UPDATE USING (((\\"user_id\\" = \\"auth\\".\\"uid\\"()) OR (\\"user_id\\" IS NULL))) WITH CHECK (((\\"user_id\\" = \\"auth\\".\\"uid\\"()) OR (\\"user_id\\" IS NULL)))","CREATE POLICY \\"Users can view session artifacts from own sessions\\" ON \\"public\\".\\"session_artifacts\\" FOR SELECT USING ((\\"auth\\".\\"uid\\"() IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\"\r\n     JOIN \\"public\\".\\"sessions\\" ON ((\\"sessions\\".\\"user_id\\" = \\"user_profiles\\".\\"id\\")))\r\n  WHERE (\\"sessions\\".\\"id\\" = \\"session_artifacts\\".\\"session_id\\"))))","CREATE POLICY \\"Users can view their own artifacts and public artifacts\\" ON \\"public\\".\\"artifacts\\" FOR SELECT USING (((\\"user_id\\" = \\"auth\\".\\"uid\\"()) OR (\\"user_id\\" IS NULL) OR ((\\"status\\" = 'active'::\\"text\\") AND (\\"is_template\\" = true))))","CREATE POLICY \\"Users can view their own submissions\\" ON \\"public\\".\\"artifact_submissions\\" FOR SELECT USING ((\\"user_id\\" = \\"auth\\".\\"uid\\"()))","ALTER TABLE \\"public\\".\\"agents\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"artifact_submissions\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"artifacts\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"bids\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"messages\\" ENABLE ROW LEVEL SECURITY","CREATE POLICY \\"messages_delete_optimized\\" ON \\"public\\".\\"messages\\" FOR DELETE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"messages\\".\\"session_id\\"))))","CREATE POLICY \\"messages_insert_optimized\\" ON \\"public\\".\\"messages\\" FOR INSERT WITH CHECK ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"messages\\".\\"session_id\\"))))","CREATE POLICY \\"messages_select_optimized\\" ON \\"public\\".\\"messages\\" FOR SELECT USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"messages\\".\\"session_id\\"))))","CREATE POLICY \\"messages_update_optimized\\" ON \\"public\\".\\"messages\\" FOR UPDATE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"messages\\".\\"session_id\\"))))","ALTER TABLE \\"public\\".\\"rfp_artifacts\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"rfps\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"session_agents\\" ENABLE ROW LEVEL SECURITY","CREATE POLICY \\"session_agents_delete_optimized\\" ON \\"public\\".\\"session_agents\\" FOR DELETE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"session_agents\\".\\"session_id\\"))))","CREATE POLICY \\"session_agents_insert_optimized\\" ON \\"public\\".\\"session_agents\\" FOR INSERT WITH CHECK ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"session_agents\\".\\"session_id\\"))))","CREATE POLICY \\"session_agents_select_optimized\\" ON \\"public\\".\\"session_agents\\" FOR SELECT USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"session_agents\\".\\"session_id\\"))))","CREATE POLICY \\"session_agents_update_optimized\\" ON \\"public\\".\\"session_agents\\" FOR UPDATE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"up\\".\\"supabase_user_id\\"\r\n   FROM (\\"public\\".\\"user_profiles\\" \\"up\\"\r\n     JOIN \\"public\\".\\"sessions\\" \\"s\\" ON ((\\"up\\".\\"id\\" = \\"s\\".\\"user_id\\")))\r\n  WHERE (\\"s\\".\\"id\\" = \\"session_agents\\".\\"session_id\\"))))","ALTER TABLE \\"public\\".\\"session_artifacts\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"sessions\\" ENABLE ROW LEVEL SECURITY","CREATE POLICY \\"sessions_delete_optimized\\" ON \\"public\\".\\"sessions\\" FOR DELETE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM \\"public\\".\\"user_profiles\\"\r\n  WHERE (\\"user_profiles\\".\\"id\\" = \\"sessions\\".\\"user_id\\"))))","CREATE POLICY \\"sessions_insert_optimized\\" ON \\"public\\".\\"sessions\\" FOR INSERT WITH CHECK ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM \\"public\\".\\"user_profiles\\"\r\n  WHERE (\\"user_profiles\\".\\"id\\" = \\"sessions\\".\\"user_id\\"))))","CREATE POLICY \\"sessions_select_optimized\\" ON \\"public\\".\\"sessions\\" FOR SELECT USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM \\"public\\".\\"user_profiles\\"\r\n  WHERE (\\"user_profiles\\".\\"id\\" = \\"sessions\\".\\"user_id\\"))))","CREATE POLICY \\"sessions_update_optimized\\" ON \\"public\\".\\"sessions\\" FOR UPDATE USING ((( SELECT \\"auth\\".\\"uid\\"() AS \\"uid\\") IN ( SELECT \\"user_profiles\\".\\"supabase_user_id\\"\r\n   FROM \\"public\\".\\"user_profiles\\"\r\n  WHERE (\\"user_profiles\\".\\"id\\" = \\"sessions\\".\\"user_id\\"))))","ALTER TABLE \\"public\\".\\"supplier_profiles\\" ENABLE ROW LEVEL SECURITY","ALTER TABLE \\"public\\".\\"user_profiles\\" ENABLE ROW LEVEL SECURITY","ALTER PUBLICATION \\"supabase_realtime\\" OWNER TO \\"postgres\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"postgres\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"anon\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"authenticated\\"","GRANT USAGE ON SCHEMA \\"public\\" TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"generate_bid_submission_token\\"(\\"rfp_id_param\\" integer, \\"supplier_id_param\\" integer, \\"expires_hours\\" integer) TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"generate_bid_submission_token\\"(\\"rfp_id_param\\" integer, \\"supplier_id_param\\" integer, \\"expires_hours\\" integer) TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"generate_bid_submission_token\\"(\\"rfp_id_param\\" integer, \\"supplier_id_param\\" integer, \\"expires_hours\\" integer) TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_bid_response\\"(\\"bid_id_param\\" integer) TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_bid_response\\"(\\"bid_id_param\\" integer) TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_bid_response\\"(\\"bid_id_param\\" integer) TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_latest_submission\\"(\\"artifact_id_param\\" \\"text\\", \\"session_id_param\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_latest_submission\\"(\\"artifact_id_param\\" \\"text\\", \\"session_id_param\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_latest_submission\\"(\\"artifact_id_param\\" \\"text\\", \\"session_id_param\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_rfp_artifacts\\"(\\"rfp_id_param\\" integer) TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_rfp_artifacts\\"(\\"rfp_id_param\\" integer) TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_rfp_artifacts\\"(\\"rfp_id_param\\" integer) TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_session_active_agent\\"(\\"session_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_session_active_agent\\"(\\"session_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_session_active_agent\\"(\\"session_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_sessions_with_stats\\"(\\"user_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_sessions_with_stats\\"(\\"user_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_sessions_with_stats\\"(\\"user_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_agent\\"(\\"user_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_session\\"(\\"user_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_session\\"(\\"user_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_user_current_session\\"(\\"user_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_users_by_role\\"(\\"role_filter\\" \\"text\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_users_by_role\\"(\\"role_filter\\" \\"text\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"get_users_by_role\\"(\\"role_filter\\" \\"text\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\", \\"agent_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\", \\"agent_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_context\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\", \\"agent_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_session\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_session\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"set_user_current_session\\"(\\"user_uuid\\" \\"uuid\\", \\"session_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"switch_session_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"new_agent_uuid\\" \\"uuid\\", \\"user_uuid\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"switch_session_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"new_agent_uuid\\" \\"uuid\\", \\"user_uuid\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"switch_session_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"new_agent_uuid\\" \\"uuid\\", \\"user_uuid\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_artifact_submissions_updated_at\\"() TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_artifact_submissions_updated_at\\"() TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_artifact_submissions_updated_at\\"() TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_session_context_with_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"rfp_id_param\\" integer, \\"artifact_id_param\\" \\"uuid\\", \\"agent_id_param\\" \\"uuid\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_session_context_with_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"rfp_id_param\\" integer, \\"artifact_id_param\\" \\"uuid\\", \\"agent_id_param\\" \\"uuid\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_session_context_with_agent\\"(\\"session_uuid\\" \\"uuid\\", \\"rfp_id_param\\" integer, \\"artifact_id_param\\" \\"uuid\\", \\"agent_id_param\\" \\"uuid\\") TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_updated_at_column\\"() TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_updated_at_column\\"() TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"update_updated_at_column\\"() TO \\"service_role\\"","GRANT ALL ON FUNCTION \\"public\\".\\"validate_form_spec\\"(\\"spec\\" \\"jsonb\\") TO \\"anon\\"","GRANT ALL ON FUNCTION \\"public\\".\\"validate_form_spec\\"(\\"spec\\" \\"jsonb\\") TO \\"authenticated\\"","GRANT ALL ON FUNCTION \\"public\\".\\"validate_form_spec\\"(\\"spec\\" \\"jsonb\\") TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"agents\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"agents\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"agents\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"artifact_submissions\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"artifact_submissions\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"artifact_submissions\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"artifacts\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"artifacts\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"artifacts\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"bids\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"bids\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"bids\\" TO \\"service_role\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"bid_id_seq\\" TO \\"anon\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"bid_id_seq\\" TO \\"authenticated\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"bid_id_seq\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"messages\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"messages\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"messages\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"rfp_artifacts\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"rfp_artifacts\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"rfp_artifacts\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"rfps\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"rfps\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"rfps\\" TO \\"service_role\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"rfp_id_seq\\" TO \\"anon\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"rfp_id_seq\\" TO \\"authenticated\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"rfp_id_seq\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"session_agents\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"session_agents\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"session_agents\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"session_artifacts\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"session_artifacts\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"session_artifacts\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"sessions\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"sessions\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"sessions\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"supplier_profiles\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"supplier_profiles\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"supplier_profiles\\" TO \\"service_role\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"supplier_id_seq\\" TO \\"anon\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"supplier_id_seq\\" TO \\"authenticated\\"","GRANT ALL ON SEQUENCE \\"public\\".\\"supplier_id_seq\\" TO \\"service_role\\"","GRANT ALL ON TABLE \\"public\\".\\"user_profiles\\" TO \\"anon\\"","GRANT ALL ON TABLE \\"public\\".\\"user_profiles\\" TO \\"authenticated\\"","GRANT ALL ON TABLE \\"public\\".\\"user_profiles\\" TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON SEQUENCES TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON FUNCTIONS TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"postgres\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"authenticated\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" IN SCHEMA \\"public\\" GRANT ALL ON TABLES TO \\"service_role\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" GRANT ALL ON TABLES TO \\"anon\\"","ALTER DEFAULT PRIVILEGES FOR ROLE \\"postgres\\" GRANT ALL ON TABLES TO \\"authenticated\\"","RESET ALL"}	remote_schema
20251002012257	{"set check_function_bodies = off","CREATE OR REPLACE FUNCTION public.get_bid_response(bid_id_param integer)\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n    result JSONB;\nBEGIN\n  -- Try new schema first - get submission data from linked artifact\n  SELECT s.submission_data INTO result\n  FROM public.bids b\n  JOIN public.artifact_submissions s ON b.artifact_submission_id = s.id\n  WHERE b.id = bid_id_param;\n  \n  IF result IS NOT NULL THEN\n    RETURN result;\n  END IF;\n  \n  -- Fallback to legacy schema\n  SELECT response INTO result\n  FROM public.bids \n  WHERE id = bid_id_param;\n  \n  RETURN COALESCE(result, '{}'::jsonb);\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid DEFAULT NULL::uuid)\n RETURNS jsonb\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  result JSONB;\nBEGIN\n  SELECT submission_data INTO result\n  FROM public.artifact_submissions\n  WHERE artifact_id = artifact_id_param\n  AND (session_id_param IS NULL OR session_id = session_id_param)\n  ORDER BY submitted_at DESC\n  LIMIT 1;\n  \n  RETURN COALESCE(result, '{}'::jsonb);\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.get_rfp_artifacts(rfp_id_param integer)\n RETURNS TABLE(artifact_id text, artifact_name text, artifact_type text, artifact_role text, schema jsonb, ui_schema jsonb, form_data jsonb, created_at timestamp with time zone)\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  RETURN QUERY\n  SELECT \n    a.id as artifact_id,\n    a.name as artifact_name,\n    a.type as artifact_type,\n    ra.role as artifact_role,\n    a.schema,\n    a.ui_schema,\n    a.form_data,\n    a.created_at\n  FROM public.artifacts a\n  JOIN public.rfp_artifacts ra ON a.id = ra.artifact_id\n  WHERE ra.rfp_id = rfp_id_param\n  AND a.status = 'active'\n  ORDER BY ra.role, a.created_at;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.get_user_current_agent(user_uuid uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  current_agent_id UUID;\nBEGIN\n  -- Get the current agent from the user's current session\n  SELECT s.current_agent_id INTO current_agent_id\n  FROM public.user_profiles up\n  JOIN public.sessions s ON up.current_session_id = s.id\n  WHERE up.supabase_user_id = user_uuid;\n  \n  RETURN current_agent_id;\nEXCEPTION\n  WHEN OTHERS THEN\n    RETURN NULL;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.get_user_current_session(user_uuid uuid)\n RETURNS uuid\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n    session_id_var uuid;\n    profile_id_var uuid;\nBEGIN\n    -- First get the user profile ID from the Supabase auth user ID\n    SELECT id INTO profile_id_var\n    FROM user_profiles \n    WHERE supabase_user_id = user_uuid;\n    \n    -- If no profile found, return null\n    IF profile_id_var IS NULL THEN\n        RETURN NULL;\n    END IF;\n    \n    -- Try to get the current_session_id from user_profiles using the profile ID\n    SELECT current_session_id INTO session_id_var\n    FROM user_profiles \n    WHERE id = profile_id_var;\n    \n    -- If current_session_id is not null and the session exists, return it\n    IF session_id_var IS NOT NULL THEN\n        IF EXISTS (SELECT 1 FROM sessions WHERE id = session_id_var AND user_id = profile_id_var) THEN\n            RETURN session_id_var;\n        END IF;\n    END IF;\n    \n    -- Otherwise, get the most recent session for this user (using profile ID)\n    SELECT id INTO session_id_var\n    FROM sessions \n    WHERE user_id = profile_id_var \n    ORDER BY updated_at DESC, created_at DESC \n    LIMIT 1;\n    \n    -- Update the user profile with this session ID\n    IF session_id_var IS NOT NULL THEN\n        UPDATE user_profiles \n        SET current_session_id = session_id_var \n        WHERE id = profile_id_var;\n    END IF;\n    \n    RETURN session_id_var;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  user_profile_id UUID;\nBEGIN\n  -- Find the user profile ID from the supabase user ID\n  SELECT id INTO user_profile_id \n  FROM public.user_profiles \n  WHERE supabase_user_id = user_uuid;\n  \n  IF user_profile_id IS NULL THEN\n    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;\n    RETURN FALSE;\n  END IF;\n  \n  -- Update the user profile with current session only\n  UPDATE public.user_profiles \n  SET \n    current_session_id = COALESCE(session_uuid, current_session_id),\n    updated_at = NOW()\n  WHERE id = user_profile_id;\n  \n  RETURN TRUE;\nEXCEPTION\n  WHEN OTHERS THEN\n    RAISE NOTICE 'Error updating user context: %', SQLERRM;\n    RETURN FALSE;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid DEFAULT NULL::uuid, agent_uuid uuid DEFAULT NULL::uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  user_profile_id UUID;\nBEGIN\n  -- Find the user profile ID from the supabase user ID\n  SELECT id INTO user_profile_id \n  FROM public.user_profiles \n  WHERE supabase_user_id = user_uuid;\n  \n  IF user_profile_id IS NULL THEN\n    RAISE EXCEPTION 'User profile not found for user_uuid: %', user_uuid;\n    RETURN FALSE;\n  END IF;\n  \n  -- Update the user profile with current session and/or agent\n  UPDATE public.user_profiles \n  SET \n    current_session_id = COALESCE(session_uuid, current_session_id),\n    current_agent_id = COALESCE(agent_uuid, current_agent_id),\n    updated_at = NOW()\n  WHERE id = user_profile_id;\n  \n  RETURN TRUE;\nEXCEPTION\n  WHEN OTHERS THEN\n    RAISE NOTICE 'Error updating user context: %', SQLERRM;\n    RETURN FALSE;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nDECLARE\n  user_profile_id UUID;\nBEGIN\n  -- Get the user profile ID from supabase_user_id\n  SELECT id INTO user_profile_id \n  FROM public.user_profiles \n  WHERE supabase_user_id = user_uuid;\n  \n  IF user_profile_id IS NULL THEN\n    RETURN FALSE;\n  END IF;\n  \n  -- Update the current session\n  UPDATE public.user_profiles \n  SET current_session_id = session_uuid,\n      updated_at = NOW()\n  WHERE id = user_profile_id;\n  \n  RETURN TRUE;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.update_artifact_submissions_updated_at()\n RETURNS trigger\n LANGUAGE plpgsql\nAS $function$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer DEFAULT NULL::integer, artifact_id_param uuid DEFAULT NULL::uuid, agent_id_param uuid DEFAULT NULL::uuid)\n RETURNS boolean\n LANGUAGE plpgsql\n SECURITY DEFINER\nAS $function$\nBEGIN\n  UPDATE public.sessions \n  SET \n    current_rfp_id = COALESCE(rfp_id_param, current_rfp_id),\n    current_artifact_id = COALESCE(artifact_id_param, current_artifact_id),\n    current_agent_id = COALESCE(agent_id_param, current_agent_id),\n    updated_at = NOW()\n  WHERE id = session_uuid;\n  \n  RETURN FOUND;\nEXCEPTION\n  WHEN OTHERS THEN\n    RAISE NOTICE 'Error updating session context: %', SQLERRM;\n    RETURN FALSE;\nEND;\n$function$","CREATE OR REPLACE FUNCTION public.update_updated_at_column()\n RETURNS trigger\n LANGUAGE plpgsql\n SECURITY DEFINER\n SET search_path TO ''\nAS $function$\nBEGIN\n  NEW.updated_at = NOW();\n  RETURN NEW;\nEND;\n$function$"}	update_functions_schema
20251002030545	{"-- Populate Local Development Database with Agents\r\n-- This migration ensures the local Supabase instance has all necessary agent data\r\n\r\n-- Ensure agents table exists with all required columns\r\nCREATE TABLE IF NOT EXISTS public.agents (\r\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\r\n  name TEXT NOT NULL,\r\n  description TEXT,\r\n  instructions TEXT NOT NULL,\r\n  initial_prompt TEXT NOT NULL,\r\n  avatar_url TEXT,\r\n  is_active BOOLEAN DEFAULT TRUE,\r\n  is_default BOOLEAN DEFAULT FALSE,\r\n  is_restricted BOOLEAN DEFAULT FALSE,\r\n  is_free BOOLEAN DEFAULT FALSE,\r\n  sort_order INTEGER DEFAULT 0,\r\n  role TEXT,\r\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\r\n  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\r\n  metadata JSONB DEFAULT '{}'::jsonb\r\n)","-- Add unique constraint on name if it doesn't exist\r\nDO $$ \r\nBEGIN\r\n  IF NOT EXISTS (\r\n    SELECT 1 FROM information_schema.table_constraints \r\n    WHERE constraint_name = 'agents_name_key' \r\n    AND table_name = 'agents'\r\n    AND table_schema = 'public'\r\n  ) THEN\r\n    ALTER TABLE public.agents ADD CONSTRAINT agents_name_key UNIQUE (name);\r\n  END IF;\r\nEND $$","-- Add role column if it doesn't exist\r\nALTER TABLE public.agents ADD COLUMN IF NOT EXISTS role TEXT","ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS is_free BOOLEAN DEFAULT FALSE","-- Create index for performance\r\nCREATE INDEX IF NOT EXISTS idx_agents_role ON public.agents(role)","CREATE INDEX IF NOT EXISTS idx_agents_active ON public.agents(is_active)","CREATE INDEX IF NOT EXISTS idx_agents_default ON public.agents(is_default)","-- Use UPSERT to handle existing agents (INSERT ... ON CONFLICT UPDATE)\r\nINSERT INTO public.agents (id, name, description, instructions, initial_prompt, avatar_url, sort_order, is_default, is_restricted, is_free, role) VALUES\r\n(\r\n  '4fe117af-da1d-410c-bcf4-929012d8a673',\r\n  'Solutions',\r\n  'Sales agent for EZRFP.APP to help with product questions and competitive sourcing',\r\n  $solutions_instructions$## Name: Solutions\r\n**Database ID**: `e9fd3332-dcd1-42c1-a466-d80ec51647ad`\r\n**Role**: `sales`\r\n**Avatar URL**: `/assets/avatars/solutions-agent.svg`\r\n\r\n## Description:\r\nSales agent for EZRFP.APP to help with product questions and competitive sourcing\r\n\r\n## Initial Prompt:\r\nHi, I'm your EZ RFP AI agent. I'm here to see if I can help you. Are you looking to competitively source a product?\r\n\r\n## Instructions:\r\nYou are a sales agent for EZRFP.APP. Answer questions about the product and help users understand how our platform can assist with their procurement and RFP needs. Be helpful, professional, and focus on understanding their requirements.\r\n\r\n## 🤖 AVAILABLE AGENTS & SWITCHING:\r\n**When users ask about available agents or want to switch agents:**\r\n1. **ALWAYS** use the `get_available_agents` function to show current agents\r\n2. **Available agents typically include:**\r\n   - **Solutions** - Sales and product questions (that's me!)\r\n   - **RFP Design** - Create RFPs, forms, and procurement documents\r\n   - **Technical Support** - Technical assistance and troubleshooting\r\n   - **Other specialized agents** based on your needs\r\n3. **To switch agents:** Use `switch_agent` with the agent name (e.g., \\"RFP Design\\")\r\n4. **Make switching easy:** Always mention available agents in your responses and suggest appropriate agents for user needs\r\n\r\n**� CRITICAL WORKFLOW RULE - READ THIS FIRST!**\r\n**WHEN USERS EXPRESS ANY PROCUREMENT NEEDS, YOU MUST IMMEDIATELY SWITCH TO RFP DESIGN**\r\n\r\n**MANDATORY PROCUREMENT TRIGGERS - If user message contains ANY of these patterns, IMMEDIATELY call `switch_agent`:**\r\n- \\"I need to source [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I need to procure [anything]\\" → Call `switch_agent` to \\"RFP Design\\" \r\n- \\"I need to buy [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Create an RFP for [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I need an RFP for [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I want to create an RFP\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Help me create an RFP\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I need to find suppliers for [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I'm looking to source [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"We need to source [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Create a questionnaire\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Create a buyer questionnaire\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Generate a questionnaire\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"I need a questionnaire for [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Create a form for [anything]\\" → Call `switch_agent` to \\"RFP Design\\"\r\n- \\"Generate a form\\" → Call `switch_agent` to \\"RFP Design\\"\r\n\r\n**EXAMPLES OF IMMEDIATE SWITCHES REQUIRED:**\r\n- \\"I need to source acetone\\" → `switch_agent` to \\"RFP Design\\" \r\n- \\"I need to source floor tiles\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"I need to procure office supplies\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"I need to buy concrete\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"We need to source asphalt\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"I'm looking to source lumber\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"Create a buyer questionnaire for LED desk lamps\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"Generate a questionnaire to capture requirements\\" → `switch_agent` to \\"RFP Design\\"\r\n- \\"I need a form to collect buyer information\\" → `switch_agent` to \\"RFP Design\\"\r\n\r\n**CRITICAL RULES:**\r\n- **YOU CANNOT CREATE RFPs DIRECTLY** - You have NO ACCESS to RFP creation tools\r\n- **YOU CANNOT CREATE FORMS/QUESTIONNAIRES** - You have NO ACCESS to form creation tools\r\n- **NO PROCUREMENT ASSISTANCE** - You cannot \\"help create RFPs\\" or \\"help create questionnaires\\" - only switch to RFP Design\r\n- **IMMEDIATE SWITCH** - Do not engage in procurement discussion, switch immediately\r\n- **Include user's original request** in the `user_input` parameter when switching\r\n- **DO NOT SAY \\"I'll help you create\\"** - Say \\"I'll switch you to our RFP Design agent\\"\r\n\r\n**🚨 ABSOLUTELY NEVER DO THESE THINGS:**\r\n- **NEVER call `create_and_set_rfp`** - This tool is BLOCKED for you\r\n- **NEVER call `create_form_artifact`** - This tool is BLOCKED for you\r\n- **NEVER attempt to create RFPs yourself** - You MUST switch agents\r\n- **NEVER say \\"I'll create\\" anything procurement-related** - Only say \\"I'll switch you\\"\r\n\r\n**�🔐 AUTHENTICATION REQUIREMENTS:**\r\n**BEFORE SWITCHING AGENTS OR HANDLING PROCUREMENT REQUESTS:**\r\n- **Check User Status**: Look at the USER CONTEXT in your system prompt\r\n- **If \\"User Status: ANONYMOUS (not logged in)\\":**\r\n  - DO NOT call `switch_agent`\r\n  - DO NOT attempt any procurement assistance\r\n  - INFORM USER they must log in first\r\n  - DIRECT them to click the LOGIN button\r\n  - EXPLAIN that RFP creation and agent switching require authentication\r\n- **If \\"User Status: AUTHENTICATED\\":**\r\n  - Proceed with normal agent switching workflow\r\n  - Call `switch_agent` as instructed below\r\n\r\n**YOUR ONLY ALLOWED RESPONSE TO PROCUREMENT REQUESTS:**\r\n1. **First**: Check authentication status in USER CONTEXT\r\n2. **If not authenticated**: Instruct user to log in first\r\n3. **If authenticated**: Call `switch_agent` with agent_name: \\"RFP Design\\"\r\n4. Include the user's full request in the `user_input` parameter\r\n5. Say: \\"I'll switch you to our RFP Design agent who specializes in [specific task]\\"\r\n\r\n**CRITICAL: When users ask about available agents, which agents exist, or want to see a list of agents, you MUST use the `get_available_agents` function to retrieve the current list from the database. Do not provide agent information from memory - always query the database for the most up-to-date agent list.**$solutions_instructions$,\r\n  'Hi, I''m your EZ RFP AI agent. I''m here to see if I can help you. Are you looking to competitively source a product?',\r\n  '/assets/avatars/solutions-agent.svg',\r\n  0,\r\n  TRUE,  -- This is the default agent\r\n  FALSE, -- Not restricted - available to all users\r\n  FALSE, -- Not free - regular agent\r\n  'sales' -- Role for the agent\r\n),\r\n(\r\n  '8c5f11cb-1395-4d67-821b-89dd58f0c8dc',\r\n  'RFP Design',\r\n  'Creates comprehensive RFP packages by gathering buyer requirements, generating interactive questionnaires, and producing request documents',\r\n  $rfp_design_instructions$## Name: RFP Design\r\n**Database ID**: `8c5f11cb-1395-4d67-821b-89dd58f0c8dc`\r\n**Role**: `design`\r\n**Avatar URL**: `/assets/avatars/rfp-designer.svg`\r\n\r\n## Description:\r\nCreates comprehensive RFP packages by gathering buyer requirements, generating interactive questionnaires, and producing request documents. Generates \\"request\\" content (rfps.request field) sent to suppliers to solicit bids.\r\n\r\n## Initial Prompt:\r\nHello! I'm your RFP Design specialist. I'll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire.\r\n\r\nWhat type of product or service are you looking to procure? I'll generate a tailored questionnaire to capture all necessary details for your RFP.\r\n\r\n## 🚨 CRITICAL USER COMMUNICATION RULES:\r\n- **NEVER show code, schemas, or technical syntax to users**\r\n- **ALWAYS communicate in natural, professional language**\r\n- **Users should only see forms and friendly explanations**\r\n- **Keep all technical implementation completely hidden**\r\n\r\n## 🎯 CRITICAL SAMPLE DATA RULE:\r\n**When users request \\"sample data\\", \\"test data\\", \\"fill out form\\", or mention \\"sample\\":**\r\n1. **ALWAYS** call `update_form_data` after creating forms\r\n2. **IDENTIFY** the correct form artifact to populate\r\n3. **USE** realistic business values (Green Valley farms, Mountain View companies, etc.)\r\n4. **POPULATE** ALL required fields and most optional fields with appropriate sample data\r\n\r\n## 🔍 AGENT QUERY HANDLING & SWITCHING:\r\n**MANDATORY**: When users ask about available agents (\\"what agents are available?\\", \\"which agents do you have?\\", \\"show me available agents\\", \\"list all agents\\", \\"tell me about your agents\\"), you MUST use the `get_available_agents` function to retrieve the current agent list from the database. Never rely on static information - always query the database for the most current agent information.\r\n\r\n## 🤖 AVAILABLE AGENTS CONTEXT:\r\n**Always inform users about available agents and easy switching:**\r\n1. **Available agents typically include:**\r\n   - **RFP Design** - Create RFPs, forms, and procurement documents (that's me!)\r\n   - **Solutions** - Sales and product questions\r\n   - **Technical Support** - Technical assistance and troubleshooting\r\n   - **Other specialized agents** based on your needs\r\n2. **To switch agents:** Simply say \\"switch me to [Agent Name]\\" or \\"I want to talk to Solutions agent\\"\r\n3. **Proactive suggestions:** When users have non-procurement questions, suggest switching to the appropriate agent\r\n4. **Make it natural:** Include agent switching options in your responses when relevant\r\n\r\n## 🔥 CRITICAL RFP CREATION RULE - READ THIS FIRST!\r\n**INTELLIGENTLY RECOGNIZE PROCUREMENT NEEDS → CALL `create_and_set_rfp`**\r\n- When users express procurement needs, sourcing requirements, or buying intentions - create RFP records\r\n- Use context and conversation flow to determine when RFP creation is appropriate\r\n- ALWAYS call `create_and_set_rfp` BEFORE any other RFP-related actions\r\n- Consider the full conversation context, not just specific keywords\r\n- **CRITICAL**: This function automatically determines the current session - NO session_id parameter is needed\r\n\r\n## 🚨 CRITICAL FUNCTION CALL RULES:\r\n- **ALWAYS include form_schema parameter when calling create_form_artifact**\r\n- **NEVER call create_form_artifact with only title and description**\r\n- **The form_schema parameter is MANDATORY and must be a complete JSON Schema object**\r\n- **Function calls missing form_schema will fail with an error - you MUST retry with the complete schema**\r\n\r\n## 📋 COMPREHENSIVE WORKFLOW STEPS:\r\n\r\n### 1. Initial RFP Creation\r\n**For ANY procurement request:**\r\n1. **Immediately call `create_and_set_rfp`** with appropriate name and description\r\n2. Confirm RFP creation to the user: \\"I've created your RFP: [Name]\\"\r\n3. Proceed to questionnaire generation\r\n\r\n### 2. Questionnaire Generation & Form Creation\r\n1. **Generate comprehensive questionnaire** covering all relevant procurement aspects\r\n2. **Call `create_form_artifact`** with complete JSON Schema (MANDATORY form_schema parameter)\r\n3. **Present the form** to the user for completion\r\n4. **Offer sample data** if users want to see how the form works\r\n\r\n### 3. Form Data Collection & Processing\r\n1. **Monitor form submissions** via artifact system\r\n2. **Extract form data** when submitted by users\r\n3. **Process responses** into structured requirement format\r\n4. **Update RFP context** with gathered information\r\n\r\n### 4. Request Document Generation\r\n1. **Generate comprehensive request** based on form responses\r\n2. **Include all requirement details** from questionnaire responses\r\n3. **Structure request** for supplier clarity and response effectiveness\r\n4. **Present final request** to user for review\r\n\r\n## 🎯 QUESTIONNAIRE DESIGN PRINCIPLES:\r\n- **Always include basic information**: Company details, contact information, project overview\r\n- **Gather technical specifications**: Detailed product/service requirements, standards, certifications\r\n- **Include business requirements**: Quantities, timelines, delivery requirements, budget considerations\r\n- **Add evaluation criteria**: How proposals will be assessed, important factors\r\n- **Request supplier information**: Company background, certifications, references, financial stability\r\n\r\n## 📝 FORM SCHEMA BEST PRACTICES:\r\n- **Use appropriate field types**: text, number, date, select, checkbox, textarea\r\n- **Include clear labels and descriptions** for all fields\r\n- **Mark required fields** appropriately\r\n- **Group related fields** logically\r\n- **Provide helpful placeholders** and examples\r\n- **Include validation patterns** where appropriate\r\n\r\n## 🔧 TECHNICAL IMPLEMENTATION NOTES:\r\n- **Form schemas must be valid JSON Schema objects** with type, properties, and required fields\r\n- **Always include title and description** at the schema root level\r\n- **Use enum values for dropdown selections** where appropriate\r\n- **Include format specifications** for emails, dates, URLs\r\n- **Add pattern validation** for structured data like phone numbers\r\n\r\n## 🎬 USER EXPERIENCE GUIDELINES:\r\n- **Always explain what you're doing**: \\"I'm creating your RFP now...\\", \\"Let me generate a questionnaire...\\"\r\n- **Confirm major actions**: \\"Your RFP has been created\\", \\"I've generated your questionnaire\\"\r\n- **Guide users through the process**: \\"Please fill out this form to capture your requirements\\"\r\n- **Offer assistance**: \\"I can populate this with sample data if you'd like to see how it works\\"\r\n- **Be proactive**: Suggest next steps and additional considerations\r\n\r\n## 🚀 ADVANCED FEATURES:\r\n- **Context awareness**: Reference current RFP when available, build upon existing content\r\n- **Intelligent questionnaire customization**: Adapt questions based on product/service type\r\n- **Comprehensive requirement capture**: Technical, business, legal, and evaluation criteria\r\n- **Professional request generation**: Create supplier-ready RFP documents\r\n- **Form validation and data processing**: Ensure complete and accurate requirement capture$rfp_design_instructions$,\r\n  'Hello! I''m your RFP Design specialist. I''ll create a comprehensive Request for Proposal by gathering your procurement requirements through an interactive questionnaire. What type of product or service are you looking to procure?',\r\n  '/assets/avatars/rfp-designer.svg',\r\n  1,\r\n  FALSE, -- Not the default agent\r\n  FALSE, -- Not restricted - available to authenticated users\r\n  TRUE,  -- Free agent - available to authenticated users without billing\r\n  'design' -- Role for the agent\r\n),\r\n(\r\n  'f47ac10b-58cc-4372-a567-0e02b2c3d479',\r\n  'Support',\r\n  'Technical assistance agent for platform usage and troubleshooting',\r\n  'You are a technical support agent for EZRFP.APP. Help users with platform usage, troubleshooting, and technical questions. Provide clear, step-by-step guidance and escalate complex issues when needed.',\r\n  'Hello! I''m the technical support agent. I''m here to help you with any technical questions or issues you might have with the platform. How can I assist you today?',\r\n  '/assets/avatars/support-agent.svg',\r\n  2,\r\n  FALSE, -- Not the default agent\r\n  FALSE, -- Not restricted - available to all users\r\n  TRUE,  -- Free - available to authenticated users without billing\r\n  'support' -- Role for the agent\r\n)\r\nON CONFLICT (id) \r\nDO UPDATE SET \r\n  name = EXCLUDED.name,\r\n  description = EXCLUDED.description,\r\n  instructions = EXCLUDED.instructions,\r\n  initial_prompt = EXCLUDED.initial_prompt,\r\n  avatar_url = EXCLUDED.avatar_url,\r\n  sort_order = EXCLUDED.sort_order,\r\n  is_default = EXCLUDED.is_default,\r\n  is_restricted = EXCLUDED.is_restricted,\r\n  is_free = EXCLUDED.is_free,\r\n  role = EXCLUDED.role,\r\n  updated_at = NOW()","-- Ensure session_agents table exists for agent switching\r\nCREATE TABLE IF NOT EXISTS public.session_agents (\r\n  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\r\n  session_id UUID REFERENCES public.sessions(id) ON DELETE CASCADE NOT NULL,\r\n  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,\r\n  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\r\n  ended_at TIMESTAMP WITH TIME ZONE,\r\n  is_active BOOLEAN DEFAULT TRUE,\r\n  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()\r\n)","-- Create indexes for session_agents\r\nCREATE INDEX IF NOT EXISTS idx_session_agents_session ON public.session_agents(session_id)","CREATE INDEX IF NOT EXISTS idx_session_agents_agent ON public.session_agents(agent_id)","CREATE INDEX IF NOT EXISTS idx_session_agents_active ON public.session_agents(is_active)","-- Add agent_id to messages if it doesn't exist (it should already exist from remote schema)\r\n-- ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL;\r\n-- CREATE INDEX IF NOT EXISTS idx_messages_agent ON public.messages(agent_id);\r\n\r\n-- Update timestamps\r\nUPDATE public.agents SET updated_at = NOW()","-- Verify the migration\r\nSELECT \r\n  name, \r\n  role, \r\n  is_active, \r\n  is_default, \r\n  is_restricted, \r\n  is_free,\r\n  sort_order\r\nFROM public.agents \r\nORDER BY sort_order, name"}	populate_agents_local
\.


--
-- Data for Name: seed_files; Type: TABLE DATA; Schema: supabase_migrations; Owner: postgres
--

COPY supabase_migrations.seed_files (path, hash) FROM stdin;
supabase/seed.sql	bc6ca23af1768e4d5ead7a296a1b24e9a97f0635f6fec567cda8be04937324e3
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: supabase_admin
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: bid_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bid_id_seq', 1, false);


--
-- Name: rfp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.rfp_id_seq', 1, false);


--
-- Name: supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.supplier_id_seq', 1, false);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: supabase_admin
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('supabase_functions.hooks_id_seq', 1, false);


--
-- Name: extensions extensions_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY _realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY _realtime.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_client_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_client_id_key UNIQUE (client_id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: agents agents_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_name_key UNIQUE (name);


--
-- Name: agents agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.agents
    ADD CONSTRAINT agents_pkey PRIMARY KEY (id);


--
-- Name: artifact_submissions artifact_submissions_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifact_submissions
    ADD CONSTRAINT artifact_submissions_new_pkey PRIMARY KEY (id);


--
-- Name: artifacts artifacts_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_new_pkey PRIMARY KEY (id);


--
-- Name: bids bid_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bid_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: rfp_artifacts rfp_artifacts_new_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfp_artifacts
    ADD CONSTRAINT rfp_artifacts_new_pkey PRIMARY KEY (rfp_id, artifact_id, role);


--
-- Name: rfps rfp_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfps
    ADD CONSTRAINT rfp_pkey PRIMARY KEY (id);


--
-- Name: session_agents session_agents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_agents
    ADD CONSTRAINT session_agents_pkey PRIMARY KEY (id);


--
-- Name: session_artifacts session_artifacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_artifacts
    ADD CONSTRAINT session_artifacts_pkey PRIMARY KEY (session_id, artifact_id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: supplier_profiles supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.supplier_profiles
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_05 messages_2025_10_05_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_10_05
    ADD CONSTRAINT messages_2025_10_05_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_06 messages_2025_10_06_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_10_06
    ADD CONSTRAINT messages_2025_10_06_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_07 messages_2025_10_07_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_10_07
    ADD CONSTRAINT messages_2025_10_07_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_08 messages_2025_10_08_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_10_08
    ADD CONSTRAINT messages_2025_10_08_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: messages_2025_10_09 messages_2025_10_09_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.messages_2025_10_09
    ADD CONSTRAINT messages_2025_10_09_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: supabase_admin
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: iceberg_namespaces iceberg_namespaces_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_pkey PRIMARY KEY (id);


--
-- Name: iceberg_tables iceberg_tables_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: prefixes prefixes_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT prefixes_pkey PRIMARY KEY (bucket_id, level, name);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY supabase_functions.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: supabase_functions; Owner: supabase_functions_admin
--

ALTER TABLE ONLY supabase_functions.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (version);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: seed_files seed_files_pkey; Type: CONSTRAINT; Schema: supabase_migrations; Owner: postgres
--

ALTER TABLE ONLY supabase_migrations.seed_files
    ADD CONSTRAINT seed_files_pkey PRIMARY KEY (path);


--
-- Name: extensions_tenant_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE INDEX extensions_tenant_external_id_index ON _realtime.extensions USING btree (tenant_external_id);


--
-- Name: extensions_tenant_external_id_type_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX extensions_tenant_external_id_type_index ON _realtime.extensions USING btree (tenant_external_id, type);


--
-- Name: tenants_external_id_index; Type: INDEX; Schema: _realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX tenants_external_id_index ON _realtime.tenants USING btree (external_id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: oauth_clients_client_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_client_id_idx ON auth.oauth_clients USING btree (client_id);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: supabase_auth_admin
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: supabase_auth_admin
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: idx_agents_access; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_access ON public.agents USING btree (is_active, is_restricted, sort_order);


--
-- Name: idx_agents_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_active ON public.agents USING btree (is_active, sort_order);


--
-- Name: idx_agents_default; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_default ON public.agents USING btree (is_default) WHERE (is_default = true);


--
-- Name: idx_agents_free; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_free ON public.agents USING btree (is_free);


--
-- Name: idx_agents_restricted; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_restricted ON public.agents USING btree (is_restricted);


--
-- Name: idx_agents_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_agents_role ON public.agents USING btree (role);


--
-- Name: idx_artifact_submissions_new_artifact_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifact_submissions_new_artifact_id ON public.artifact_submissions USING btree (artifact_id);


--
-- Name: idx_artifact_submissions_new_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifact_submissions_new_session_id ON public.artifact_submissions USING btree (session_id);


--
-- Name: idx_artifact_submissions_new_submitted_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifact_submissions_new_submitted_at ON public.artifact_submissions USING btree (submitted_at);


--
-- Name: idx_artifact_submissions_new_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifact_submissions_new_user_id ON public.artifact_submissions USING btree (user_id);


--
-- Name: idx_artifacts_new_artifact_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_artifact_role ON public.artifacts USING btree (artifact_role);


--
-- Name: idx_artifacts_new_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_created_at ON public.artifacts USING btree (created_at);


--
-- Name: idx_artifacts_new_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_session_id ON public.artifacts USING btree (session_id);


--
-- Name: idx_artifacts_new_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_status ON public.artifacts USING btree (status);


--
-- Name: idx_artifacts_new_template; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_template ON public.artifacts USING btree (is_template) WHERE (is_template = true);


--
-- Name: idx_artifacts_new_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_type ON public.artifacts USING btree (type);


--
-- Name: idx_artifacts_new_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_artifacts_new_user_id ON public.artifacts USING btree (user_id);


--
-- Name: idx_bid_response; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bid_response ON public.bids USING gin (response);


--
-- Name: idx_bids_artifact_submission_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_artifact_submission_id ON public.bids USING btree (artifact_submission_id);


--
-- Name: idx_bids_supplier_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bids_supplier_id ON public.bids USING btree (supplier_id);


--
-- Name: idx_messages_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_agent_id ON public.messages USING btree (agent_id);


--
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at DESC);


--
-- Name: idx_messages_order; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_order ON public.messages USING btree (session_id, message_order);


--
-- Name: idx_messages_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_session_id ON public.messages USING btree (session_id);


--
-- Name: idx_messages_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_user_id ON public.messages USING btree (user_id);


--
-- Name: idx_rfp_artifacts_new_artifact_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfp_artifacts_new_artifact_id ON public.rfp_artifacts USING btree (artifact_id);


--
-- Name: idx_rfp_artifacts_new_rfp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfp_artifacts_new_rfp_id ON public.rfp_artifacts USING btree (rfp_id);


--
-- Name: idx_rfp_artifacts_new_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfp_artifacts_new_role ON public.rfp_artifacts USING btree (role);


--
-- Name: idx_rfps_completion; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfps_completion ON public.rfps USING btree (completion_percentage);


--
-- Name: idx_rfps_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_rfps_status ON public.rfps USING btree (status);


--
-- Name: idx_session_agents_active; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_agents_active ON public.session_agents USING btree (session_id, is_active);


--
-- Name: idx_session_agents_agent; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_agents_agent ON public.session_agents USING btree (agent_id);


--
-- Name: idx_session_agents_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_agents_agent_id ON public.session_agents USING btree (agent_id);


--
-- Name: idx_session_agents_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_agents_session ON public.session_agents USING btree (session_id);


--
-- Name: idx_session_agents_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_session_agents_session_id ON public.session_agents USING btree (session_id);


--
-- Name: idx_sessions_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_created_at ON public.sessions USING btree (created_at DESC);


--
-- Name: idx_sessions_current_agent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_current_agent_id ON public.sessions USING btree (current_agent_id);


--
-- Name: idx_sessions_current_artifact_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_current_artifact_id ON public.sessions USING btree (current_artifact_id);


--
-- Name: idx_sessions_current_rfp_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_current_rfp_id ON public.sessions USING btree (current_rfp_id);


--
-- Name: idx_sessions_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_sessions_user_id ON public.sessions USING btree (user_id);


--
-- Name: idx_user_profiles_current_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_current_session_id ON public.user_profiles USING btree (current_session_id);


--
-- Name: idx_user_profiles_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_user_profiles_role ON public.user_profiles USING btree (role);


--
-- Name: idx_user_profiles_supabase_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_user_profiles_supabase_user_id ON public.user_profiles USING btree (supabase_user_id) WHERE (supabase_user_id IS NOT NULL);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_inserted_at_topic_index; Type: INDEX; Schema: realtime; Owner: supabase_realtime_admin
--

CREATE INDEX messages_inserted_at_topic_index ON ONLY realtime.messages USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_10_05_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_10_05_inserted_at_topic_idx ON realtime.messages_2025_10_05 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_10_06_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_10_06_inserted_at_topic_idx ON realtime.messages_2025_10_06 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_10_07_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_10_07_inserted_at_topic_idx ON realtime.messages_2025_10_07 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_10_08_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_10_08_inserted_at_topic_idx ON realtime.messages_2025_10_08 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: messages_2025_10_09_inserted_at_topic_idx; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE INDEX messages_2025_10_09_inserted_at_topic_idx ON realtime.messages_2025_10_09 USING btree (inserted_at DESC, topic) WHERE ((extension = 'broadcast'::text) AND (private IS TRUE));


--
-- Name: subscription_subscription_id_entity_filters_key; Type: INDEX; Schema: realtime; Owner: supabase_admin
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_key ON realtime.subscription USING btree (subscription_id, entity, filters);


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucketid_objname; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX bucketid_objname ON storage.objects USING btree (bucket_id, name);


--
-- Name: idx_iceberg_namespaces_bucket_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_namespaces_bucket_id ON storage.iceberg_namespaces USING btree (bucket_id, name);


--
-- Name: idx_iceberg_tables_namespace_id; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_iceberg_tables_namespace_id ON storage.iceberg_tables USING btree (namespace_id, name);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_name_bucket_level_unique; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX idx_name_bucket_level_unique ON storage.objects USING btree (name COLLATE "C", bucket_id, level);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_objects_lower_name ON storage.objects USING btree ((path_tokens[level]), lower(name) text_pattern_ops, bucket_id, level);


--
-- Name: idx_prefixes_lower_name; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX idx_prefixes_lower_name ON storage.prefixes USING btree (bucket_id, level, ((string_to_array(name, '/'::text))[level]), lower(name) text_pattern_ops);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_bucket_id_level_idx; Type: INDEX; Schema: storage; Owner: supabase_storage_admin
--

CREATE UNIQUE INDEX objects_bucket_id_level_idx ON storage.objects USING btree (bucket_id, level, name COLLATE "C");


--
-- Name: supabase_functions_hooks_h_table_id_h_name_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX supabase_functions_hooks_h_table_id_h_name_idx ON supabase_functions.hooks USING btree (hook_table_id, hook_name);


--
-- Name: supabase_functions_hooks_request_id_idx; Type: INDEX; Schema: supabase_functions; Owner: supabase_functions_admin
--

CREATE INDEX supabase_functions_hooks_request_id_idx ON supabase_functions.hooks USING btree (request_id);


--
-- Name: messages_2025_10_05_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_10_05_inserted_at_topic_idx;


--
-- Name: messages_2025_10_05_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_05_pkey;


--
-- Name: messages_2025_10_06_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_10_06_inserted_at_topic_idx;


--
-- Name: messages_2025_10_06_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_06_pkey;


--
-- Name: messages_2025_10_07_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_10_07_inserted_at_topic_idx;


--
-- Name: messages_2025_10_07_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_07_pkey;


--
-- Name: messages_2025_10_08_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_10_08_inserted_at_topic_idx;


--
-- Name: messages_2025_10_08_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_08_pkey;


--
-- Name: messages_2025_10_09_inserted_at_topic_idx; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_inserted_at_topic_index ATTACH PARTITION realtime.messages_2025_10_09_inserted_at_topic_idx;


--
-- Name: messages_2025_10_09_pkey; Type: INDEX ATTACH; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER INDEX realtime.messages_pkey ATTACH PARTITION realtime.messages_2025_10_09_pkey;


--
-- Name: agents update_agents_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_agents_updated_at BEFORE UPDATE ON public.agents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: artifacts update_artifacts_new_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_artifacts_new_updated_at BEFORE UPDATE ON public.artifacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: user_profiles update_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON public.user_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: supabase_admin
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: objects objects_delete_delete_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_delete_delete_prefix AFTER DELETE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects objects_insert_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_insert_create_prefix BEFORE INSERT ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.objects_insert_prefix_trigger();


--
-- Name: objects objects_update_create_prefix; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER objects_update_create_prefix BEFORE UPDATE ON storage.objects FOR EACH ROW WHEN (((new.name <> old.name) OR (new.bucket_id <> old.bucket_id))) EXECUTE FUNCTION storage.objects_update_prefix_trigger();


--
-- Name: prefixes prefixes_create_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_create_hierarchy BEFORE INSERT ON storage.prefixes FOR EACH ROW WHEN ((pg_trigger_depth() < 1)) EXECUTE FUNCTION storage.prefixes_insert_trigger();


--
-- Name: prefixes prefixes_delete_hierarchy; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER prefixes_delete_hierarchy AFTER DELETE ON storage.prefixes FOR EACH ROW EXECUTE FUNCTION storage.delete_prefix_hierarchy_trigger();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: supabase_storage_admin
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: extensions extensions_tenant_external_id_fkey; Type: FK CONSTRAINT; Schema: _realtime; Owner: supabase_admin
--

ALTER TABLE ONLY _realtime.extensions
    ADD CONSTRAINT extensions_tenant_external_id_fkey FOREIGN KEY (tenant_external_id) REFERENCES _realtime.tenants(external_id) ON DELETE CASCADE;


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: artifact_submissions artifact_submissions_new_artifact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifact_submissions
    ADD CONSTRAINT artifact_submissions_new_artifact_id_fkey FOREIGN KEY (artifact_id) REFERENCES public.artifacts(id) ON DELETE CASCADE;


--
-- Name: artifact_submissions artifact_submissions_new_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifact_submissions
    ADD CONSTRAINT artifact_submissions_new_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: artifact_submissions artifact_submissions_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifact_submissions
    ADD CONSTRAINT artifact_submissions_new_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: artifacts artifacts_new_message_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_new_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id) ON DELETE SET NULL;


--
-- Name: artifacts artifacts_new_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_new_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: artifacts artifacts_new_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artifacts
    ADD CONSTRAINT artifacts_new_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: bids bids_artifact_submission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_artifact_submission_id_fkey FOREIGN KEY (artifact_submission_id) REFERENCES public.artifact_submissions(id) ON DELETE SET NULL;


--
-- Name: bids bids_rfp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_rfp_id_fkey FOREIGN KEY (rfp_id) REFERENCES public.rfps(id) ON DELETE CASCADE;


--
-- Name: bids bids_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bids
    ADD CONSTRAINT bids_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.supplier_profiles(id) ON DELETE SET NULL;


--
-- Name: messages messages_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: messages messages_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: messages messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: rfp_artifacts rfp_artifacts_new_artifact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfp_artifacts
    ADD CONSTRAINT rfp_artifacts_new_artifact_id_fkey FOREIGN KEY (artifact_id) REFERENCES public.artifacts(id) ON DELETE CASCADE;


--
-- Name: rfp_artifacts rfp_artifacts_new_rfp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.rfp_artifacts
    ADD CONSTRAINT rfp_artifacts_new_rfp_id_fkey FOREIGN KEY (rfp_id) REFERENCES public.rfps(id) ON DELETE CASCADE;


--
-- Name: session_agents session_agents_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_agents
    ADD CONSTRAINT session_agents_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: session_agents session_agents_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.session_agents
    ADD CONSTRAINT session_agents_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_current_agent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_current_agent_id_fkey FOREIGN KEY (current_agent_id) REFERENCES public.agents(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_current_artifact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_current_artifact_id_fkey FOREIGN KEY (current_artifact_id) REFERENCES public.artifacts(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_current_rfp_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_current_rfp_id_fkey FOREIGN KEY (current_rfp_id) REFERENCES public.rfps(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user_profiles(id) ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_current_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_current_session_id_fkey FOREIGN KEY (current_session_id) REFERENCES public.sessions(id) ON DELETE SET NULL;


--
-- Name: user_profiles user_profiles_supabase_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT user_profiles_supabase_user_id_fkey FOREIGN KEY (supabase_user_id) REFERENCES auth.users(id);


--
-- Name: iceberg_namespaces iceberg_namespaces_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_namespaces
    ADD CONSTRAINT iceberg_namespaces_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_analytics(id) ON DELETE CASCADE;


--
-- Name: iceberg_tables iceberg_tables_namespace_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.iceberg_tables
    ADD CONSTRAINT iceberg_tables_namespace_id_fkey FOREIGN KEY (namespace_id) REFERENCES storage.iceberg_namespaces(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: prefixes prefixes_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.prefixes
    ADD CONSTRAINT "prefixes_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: supabase_auth_admin
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: rfps Allow authenticated users to create RFPs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to create RFPs" ON public.rfps FOR INSERT TO authenticated WITH CHECK (true);


--
-- Name: agents Allow authenticated users to delete agents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to delete agents" ON public.agents FOR DELETE USING (true);


--
-- Name: agents Allow authenticated users to insert agents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to insert agents" ON public.agents FOR INSERT WITH CHECK (true);


--
-- Name: rfps Allow authenticated users to update RFPs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update RFPs" ON public.rfps FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: agents Allow authenticated users to update agents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to update agents" ON public.agents FOR UPDATE USING (true) WITH CHECK (true);


--
-- Name: rfps Allow authenticated users to view RFPs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow authenticated users to view RFPs" ON public.rfps FOR SELECT TO authenticated USING (true);


--
-- Name: bids Allow public bid submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public bid submissions" ON public.bids FOR INSERT TO authenticated, anon WITH CHECK (true);


--
-- Name: supplier_profiles Allow public supplier viewing; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public supplier viewing" ON public.supplier_profiles FOR SELECT USING (true);


--
-- Name: bids Allow updating bids; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow updating bids" ON public.bids FOR UPDATE TO authenticated USING (true) WITH CHECK (true);


--
-- Name: bids Allow viewing bids; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow viewing bids" ON public.bids FOR SELECT TO authenticated USING (true);


--
-- Name: agents Anyone can view active agents; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Anyone can view active agents" ON public.agents FOR SELECT USING ((is_active = true));


--
-- Name: rfp_artifacts Authenticated users can manage RFP artifacts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Authenticated users can manage RFP artifacts" ON public.rfp_artifacts USING ((auth.role() = 'authenticated'::text));


--
-- Name: rfp_artifacts RFP artifacts are publicly readable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "RFP artifacts are publicly readable" ON public.rfp_artifacts FOR SELECT USING (true);


--
-- Name: session_artifacts Users can create session artifacts in own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create session artifacts in own sessions" ON public.session_artifacts FOR INSERT WITH CHECK ((auth.uid() IN ( SELECT user_profiles.supabase_user_id
   FROM (public.user_profiles
     JOIN public.sessions ON ((sessions.user_id = user_profiles.id)))
  WHERE (sessions.id = session_artifacts.session_id))));


--
-- Name: artifacts Users can create their own artifacts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own artifacts" ON public.artifacts FOR INSERT WITH CHECK (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- Name: artifact_submissions Users can create their own submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own submissions" ON public.artifact_submissions FOR INSERT WITH CHECK ((user_id = auth.uid()));


--
-- Name: user_profiles Users can delete own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own profile" ON public.user_profiles FOR DELETE USING ((( SELECT auth.uid() AS uid) = supabase_user_id));


--
-- Name: session_artifacts Users can delete session artifacts from own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete session artifacts from own sessions" ON public.session_artifacts FOR DELETE USING ((auth.uid() IN ( SELECT user_profiles.supabase_user_id
   FROM (public.user_profiles
     JOIN public.sessions ON ((sessions.user_id = user_profiles.id)))
  WHERE (sessions.id = session_artifacts.session_id))));


--
-- Name: artifacts Users can delete their own artifacts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete their own artifacts" ON public.artifacts FOR DELETE USING (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- Name: user_profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) = supabase_user_id));


--
-- Name: user_profiles Users can read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can read own profile" ON public.user_profiles FOR SELECT USING ((( SELECT auth.uid() AS uid) = supabase_user_id));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING ((( SELECT auth.uid() AS uid) = supabase_user_id));


--
-- Name: artifacts Users can update their own artifacts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update their own artifacts" ON public.artifacts FOR UPDATE USING (((user_id = auth.uid()) OR (user_id IS NULL))) WITH CHECK (((user_id = auth.uid()) OR (user_id IS NULL)));


--
-- Name: session_artifacts Users can view session artifacts from own sessions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view session artifacts from own sessions" ON public.session_artifacts FOR SELECT USING ((auth.uid() IN ( SELECT user_profiles.supabase_user_id
   FROM (public.user_profiles
     JOIN public.sessions ON ((sessions.user_id = user_profiles.id)))
  WHERE (sessions.id = session_artifacts.session_id))));


--
-- Name: artifacts Users can view their own artifacts and public artifacts; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own artifacts and public artifacts" ON public.artifacts FOR SELECT USING (((user_id = auth.uid()) OR (user_id IS NULL) OR ((status = 'active'::text) AND (is_template = true))));


--
-- Name: artifact_submissions Users can view their own submissions; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own submissions" ON public.artifact_submissions FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: agents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

--
-- Name: artifact_submissions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.artifact_submissions ENABLE ROW LEVEL SECURITY;

--
-- Name: artifacts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: bids; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: messages messages_delete_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY messages_delete_optimized ON public.messages FOR DELETE USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = messages.session_id))));


--
-- Name: messages messages_insert_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY messages_insert_optimized ON public.messages FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = messages.session_id))));


--
-- Name: messages messages_select_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY messages_select_optimized ON public.messages FOR SELECT USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = messages.session_id))));


--
-- Name: messages messages_update_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY messages_update_optimized ON public.messages FOR UPDATE USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = messages.session_id))));


--
-- Name: rfp_artifacts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rfp_artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: rfps; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.rfps ENABLE ROW LEVEL SECURITY;

--
-- Name: session_agents; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.session_agents ENABLE ROW LEVEL SECURITY;

--
-- Name: session_agents session_agents_delete_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY session_agents_delete_optimized ON public.session_agents FOR DELETE USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = session_agents.session_id))));


--
-- Name: session_agents session_agents_insert_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY session_agents_insert_optimized ON public.session_agents FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = session_agents.session_id))));


--
-- Name: session_agents session_agents_select_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY session_agents_select_optimized ON public.session_agents FOR SELECT USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = session_agents.session_id))));


--
-- Name: session_agents session_agents_update_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY session_agents_update_optimized ON public.session_agents FOR UPDATE USING ((( SELECT auth.uid() AS uid) IN ( SELECT up.supabase_user_id
   FROM (public.user_profiles up
     JOIN public.sessions s ON ((up.id = s.user_id)))
  WHERE (s.id = session_agents.session_id))));


--
-- Name: session_artifacts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.session_artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions sessions_delete_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sessions_delete_optimized ON public.sessions FOR DELETE USING ((( SELECT auth.uid() AS uid) IN ( SELECT user_profiles.supabase_user_id
   FROM public.user_profiles
  WHERE (user_profiles.id = sessions.user_id))));


--
-- Name: sessions sessions_insert_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sessions_insert_optimized ON public.sessions FOR INSERT WITH CHECK ((( SELECT auth.uid() AS uid) IN ( SELECT user_profiles.supabase_user_id
   FROM public.user_profiles
  WHERE (user_profiles.id = sessions.user_id))));


--
-- Name: sessions sessions_select_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sessions_select_optimized ON public.sessions FOR SELECT USING ((( SELECT auth.uid() AS uid) IN ( SELECT user_profiles.supabase_user_id
   FROM public.user_profiles
  WHERE (user_profiles.id = sessions.user_id))));


--
-- Name: sessions sessions_update_optimized; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sessions_update_optimized ON public.sessions FOR UPDATE USING ((( SELECT auth.uid() AS uid) IN ( SELECT user_profiles.supabase_user_id
   FROM public.user_profiles
  WHERE (user_profiles.id = sessions.user_id))));


--
-- Name: supplier_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.supplier_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: supabase_realtime_admin
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_namespaces; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_namespaces ENABLE ROW LEVEL SECURITY;

--
-- Name: iceberg_tables; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.iceberg_tables ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: prefixes; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.prefixes ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: supabase_storage_admin
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION supabase_realtime OWNER TO postgres;

--
-- Name: DATABASE postgres; Type: ACL; Schema: -; Owner: postgres
--

GRANT CREATE ON DATABASE postgres TO supabase_etl_admin;
GRANT ALL ON DATABASE postgres TO dashboard_user;


--
-- Name: SCHEMA auth; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA auth TO anon;
GRANT USAGE ON SCHEMA auth TO authenticated;
GRANT USAGE ON SCHEMA auth TO service_role;
GRANT ALL ON SCHEMA auth TO supabase_auth_admin;
GRANT ALL ON SCHEMA auth TO dashboard_user;
GRANT USAGE ON SCHEMA auth TO postgres;


--
-- Name: SCHEMA extensions; Type: ACL; Schema: -; Owner: postgres
--

GRANT USAGE ON SCHEMA extensions TO anon;
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO service_role;
GRANT ALL ON SCHEMA extensions TO dashboard_user;


--
-- Name: SCHEMA net; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA net TO supabase_functions_admin;
GRANT USAGE ON SCHEMA net TO postgres;
GRANT USAGE ON SCHEMA net TO anon;
GRANT USAGE ON SCHEMA net TO authenticated;
GRANT USAGE ON SCHEMA net TO service_role;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: SCHEMA realtime; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA realtime TO postgres;
GRANT USAGE ON SCHEMA realtime TO anon;
GRANT USAGE ON SCHEMA realtime TO authenticated;
GRANT USAGE ON SCHEMA realtime TO service_role;
GRANT ALL ON SCHEMA realtime TO supabase_realtime_admin;


--
-- Name: SCHEMA storage; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA storage TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA storage TO anon;
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT USAGE ON SCHEMA storage TO service_role;
GRANT ALL ON SCHEMA storage TO supabase_storage_admin;
GRANT ALL ON SCHEMA storage TO dashboard_user;


--
-- Name: SCHEMA supabase_functions; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA supabase_functions TO postgres;
GRANT USAGE ON SCHEMA supabase_functions TO anon;
GRANT USAGE ON SCHEMA supabase_functions TO authenticated;
GRANT USAGE ON SCHEMA supabase_functions TO service_role;
GRANT ALL ON SCHEMA supabase_functions TO supabase_functions_admin;


--
-- Name: SCHEMA vault; Type: ACL; Schema: -; Owner: supabase_admin
--

GRANT USAGE ON SCHEMA vault TO postgres WITH GRANT OPTION;
GRANT USAGE ON SCHEMA vault TO service_role;


--
-- Name: FUNCTION email(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.email() TO dashboard_user;


--
-- Name: FUNCTION jwt(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.jwt() TO postgres;
GRANT ALL ON FUNCTION auth.jwt() TO dashboard_user;


--
-- Name: FUNCTION role(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.role() TO dashboard_user;


--
-- Name: FUNCTION uid(); Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON FUNCTION auth.uid() TO dashboard_user;


--
-- Name: FUNCTION armor(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION armor(bytea, text[], text[]); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.armor(bytea, text[], text[]) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION crypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.crypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.crypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION dearmor(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.dearmor(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.dearmor(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION decrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.decrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION digest(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.digest(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.digest(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION encrypt_iv(bytea, bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.encrypt_iv(bytea, bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_bytes(integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_bytes(integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_random_uuid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_random_uuid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION gen_salt(text, integer); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.gen_salt(text, integer) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_cron_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_cron_access() TO dashboard_user;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.grant_pg_graphql_access() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION grant_pg_net_access(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION extensions.grant_pg_net_access() FROM supabase_admin;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO supabase_admin WITH GRANT OPTION;
GRANT ALL ON FUNCTION extensions.grant_pg_net_access() TO dashboard_user;


--
-- Name: FUNCTION hmac(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hmac(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.hmac(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg(OUT indexname text, OUT indexrelid oid, OUT indrelid oid, OUT innatts integer, OUT indisunique boolean, OUT indkey int2vector, OUT indcollation oidvector, OUT indclass oidvector, OUT indoption oidvector, OUT indexprs pg_node_tree, OUT indpred pg_node_tree, OUT amid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_create_index(sql_order text, OUT indexrelid oid, OUT indexname text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_drop_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_drop_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_get_indexdef(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_get_indexdef(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_hidden_indexes(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_hidden_indexes() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_hide_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_hide_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_relation_size(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_relation_size(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_reset(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_reset() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_reset_index(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_reset_index() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_unhide_all_indexes(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_unhide_all_indexes() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION hypopg_unhide_index(indexid oid); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.hypopg_unhide_index(indexid oid) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION index_advisor(query text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.index_advisor(query text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements(showtext boolean, OUT userid oid, OUT dbid oid, OUT toplevel boolean, OUT queryid bigint, OUT query text, OUT plans bigint, OUT total_plan_time double precision, OUT min_plan_time double precision, OUT max_plan_time double precision, OUT mean_plan_time double precision, OUT stddev_plan_time double precision, OUT calls bigint, OUT total_exec_time double precision, OUT min_exec_time double precision, OUT max_exec_time double precision, OUT mean_exec_time double precision, OUT stddev_exec_time double precision, OUT rows bigint, OUT shared_blks_hit bigint, OUT shared_blks_read bigint, OUT shared_blks_dirtied bigint, OUT shared_blks_written bigint, OUT local_blks_hit bigint, OUT local_blks_read bigint, OUT local_blks_dirtied bigint, OUT local_blks_written bigint, OUT temp_blks_read bigint, OUT temp_blks_written bigint, OUT shared_blk_read_time double precision, OUT shared_blk_write_time double precision, OUT local_blk_read_time double precision, OUT local_blk_write_time double precision, OUT temp_blk_read_time double precision, OUT temp_blk_write_time double precision, OUT wal_records bigint, OUT wal_fpi bigint, OUT wal_bytes numeric, OUT jit_functions bigint, OUT jit_generation_time double precision, OUT jit_inlining_count bigint, OUT jit_inlining_time double precision, OUT jit_optimization_count bigint, OUT jit_optimization_time double precision, OUT jit_emission_count bigint, OUT jit_emission_time double precision, OUT jit_deform_count bigint, OUT jit_deform_time double precision, OUT stats_since timestamp with time zone, OUT minmax_stats_since timestamp with time zone) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_info(OUT dealloc bigint, OUT stats_reset timestamp with time zone) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pg_stat_statements_reset(userid oid, dbid oid, queryid bigint, minmax_only boolean) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_armor_headers(text, OUT key text, OUT value text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_armor_headers(text, OUT key text, OUT value text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_key_id(bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_key_id(bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_decrypt_bytea(bytea, bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_decrypt_bytea(bytea, bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt(text, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt(text, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_pub_encrypt_bytea(bytea, bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_pub_encrypt_bytea(bytea, bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_decrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_decrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt(text, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt(text, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgp_sym_encrypt_bytea(bytea, text, text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.pgp_sym_encrypt_bytea(bytea, text, text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_ddl_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_ddl_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION pgrst_drop_watch(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.pgrst_drop_watch() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.set_graphql_placeholder() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v1mc(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v1mc() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v3(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v3(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v4(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v4() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_generate_v5(namespace uuid, name text); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_generate_v5(namespace uuid, name text) TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_nil(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_nil() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_nil() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_dns(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_dns() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_oid(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_oid() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_url(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_url() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION uuid_ns_x500(); Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO dashboard_user;
GRANT ALL ON FUNCTION extensions.uuid_ns_x500() TO postgres WITH GRANT OPTION;


--
-- Name: FUNCTION graphql("operationName" text, query text, variables jsonb, extensions jsonb); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO postgres;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO anon;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO authenticated;
GRANT ALL ON FUNCTION graphql_public.graphql("operationName" text, query text, variables jsonb, extensions jsonb) TO service_role;


--
-- Name: FUNCTION http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
GRANT ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin;
GRANT ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO postgres;
GRANT ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO anon;
GRANT ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO authenticated;
GRANT ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO service_role;


--
-- Name: FUNCTION http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer); Type: ACL; Schema: net; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
GRANT ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin;
GRANT ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO postgres;
GRANT ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO anon;
GRANT ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO authenticated;
GRANT ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO service_role;


--
-- Name: FUNCTION get_auth(p_usename text); Type: ACL; Schema: pgbouncer; Owner: supabase_admin
--

REVOKE ALL ON FUNCTION pgbouncer.get_auth(p_usename text) FROM PUBLIC;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO pgbouncer;
GRANT ALL ON FUNCTION pgbouncer.get_auth(p_usename text) TO postgres;


--
-- Name: FUNCTION generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer, expires_hours integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer, expires_hours integer) TO anon;
GRANT ALL ON FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer, expires_hours integer) TO authenticated;
GRANT ALL ON FUNCTION public.generate_bid_submission_token(rfp_id_param integer, supplier_id_param integer, expires_hours integer) TO service_role;


--
-- Name: FUNCTION get_bid_response(bid_id_param integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_bid_response(bid_id_param integer) TO anon;
GRANT ALL ON FUNCTION public.get_bid_response(bid_id_param integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_bid_response(bid_id_param integer) TO service_role;


--
-- Name: FUNCTION get_latest_submission(artifact_id_param text, session_id_param uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid) TO anon;
GRANT ALL ON FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_latest_submission(artifact_id_param text, session_id_param uuid) TO service_role;


--
-- Name: FUNCTION get_rfp_artifacts(rfp_id_param integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_rfp_artifacts(rfp_id_param integer) TO anon;
GRANT ALL ON FUNCTION public.get_rfp_artifacts(rfp_id_param integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_rfp_artifacts(rfp_id_param integer) TO service_role;


--
-- Name: FUNCTION get_session_active_agent(session_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_session_active_agent(session_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_session_active_agent(session_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_session_active_agent(session_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_sessions_with_stats(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_sessions_with_stats(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_sessions_with_stats(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_sessions_with_stats(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_current_agent(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_current_agent(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_current_agent(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_current_agent(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_user_current_session(user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_user_current_session(user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.get_user_current_session(user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.get_user_current_session(user_uuid uuid) TO service_role;


--
-- Name: FUNCTION get_users_by_role(role_filter text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_users_by_role(role_filter text) TO anon;
GRANT ALL ON FUNCTION public.get_users_by_role(role_filter text) TO authenticated;
GRANT ALL ON FUNCTION public.get_users_by_role(role_filter text) TO service_role;


--
-- Name: FUNCTION set_user_current_context(user_uuid uuid, session_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid) TO service_role;


--
-- Name: FUNCTION set_user_current_context(user_uuid uuid, session_uuid uuid, agent_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid, agent_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid, agent_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.set_user_current_context(user_uuid uuid, session_uuid uuid, agent_uuid uuid) TO service_role;


--
-- Name: FUNCTION set_user_current_session(user_uuid uuid, session_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.set_user_current_session(user_uuid uuid, session_uuid uuid) TO service_role;


--
-- Name: FUNCTION switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid) TO anon;
GRANT ALL ON FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid) TO authenticated;
GRANT ALL ON FUNCTION public.switch_session_agent(session_uuid uuid, new_agent_uuid uuid, user_uuid uuid) TO service_role;


--
-- Name: FUNCTION update_artifact_submissions_updated_at(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_artifact_submissions_updated_at() TO anon;
GRANT ALL ON FUNCTION public.update_artifact_submissions_updated_at() TO authenticated;
GRANT ALL ON FUNCTION public.update_artifact_submissions_updated_at() TO service_role;


--
-- Name: FUNCTION update_session_context_with_agent(session_uuid uuid, rfp_id_param integer, artifact_id_param uuid, agent_id_param uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer, artifact_id_param uuid, agent_id_param uuid) TO anon;
GRANT ALL ON FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer, artifact_id_param uuid, agent_id_param uuid) TO authenticated;
GRANT ALL ON FUNCTION public.update_session_context_with_agent(session_uuid uuid, rfp_id_param integer, artifact_id_param uuid, agent_id_param uuid) TO service_role;


--
-- Name: FUNCTION update_updated_at_column(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.update_updated_at_column() TO anon;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT ALL ON FUNCTION public.update_updated_at_column() TO service_role;


--
-- Name: FUNCTION validate_form_spec(spec jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.validate_form_spec(spec jsonb) TO anon;
GRANT ALL ON FUNCTION public.validate_form_spec(spec jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.validate_form_spec(spec jsonb) TO service_role;


--
-- Name: FUNCTION apply_rls(wal jsonb, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO postgres;
GRANT ALL ON FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) TO dashboard_user;


--
-- Name: FUNCTION build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO postgres;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO anon;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO service_role;
GRANT ALL ON FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION "cast"(val text, type_ regtype); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO postgres;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO dashboard_user;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO anon;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO authenticated;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO service_role;
GRANT ALL ON FUNCTION realtime."cast"(val text, type_ regtype) TO supabase_realtime_admin;


--
-- Name: FUNCTION check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO postgres;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO anon;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO authenticated;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO service_role;
GRANT ALL ON FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) TO supabase_realtime_admin;


--
-- Name: FUNCTION is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO postgres;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO anon;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO authenticated;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO service_role;
GRANT ALL ON FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) TO supabase_realtime_admin;


--
-- Name: FUNCTION list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO postgres;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO anon;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO authenticated;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO service_role;
GRANT ALL ON FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) TO supabase_realtime_admin;


--
-- Name: FUNCTION quote_wal2json(entity regclass); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO postgres;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO anon;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO authenticated;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO service_role;
GRANT ALL ON FUNCTION realtime.quote_wal2json(entity regclass) TO supabase_realtime_admin;


--
-- Name: FUNCTION send(payload jsonb, event text, topic text, private boolean); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO postgres;
GRANT ALL ON FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean) TO dashboard_user;


--
-- Name: FUNCTION subscription_check_filters(); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO postgres;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO dashboard_user;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO anon;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO authenticated;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO service_role;
GRANT ALL ON FUNCTION realtime.subscription_check_filters() TO supabase_realtime_admin;


--
-- Name: FUNCTION to_regrole(role_name text); Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO postgres;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO dashboard_user;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO anon;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO authenticated;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO service_role;
GRANT ALL ON FUNCTION realtime.to_regrole(role_name text) TO supabase_realtime_admin;


--
-- Name: FUNCTION topic(); Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON FUNCTION realtime.topic() TO postgres;
GRANT ALL ON FUNCTION realtime.topic() TO dashboard_user;


--
-- Name: FUNCTION http_request(); Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

REVOKE ALL ON FUNCTION supabase_functions.http_request() FROM PUBLIC;
GRANT ALL ON FUNCTION supabase_functions.http_request() TO postgres;
GRANT ALL ON FUNCTION supabase_functions.http_request() TO anon;
GRANT ALL ON FUNCTION supabase_functions.http_request() TO authenticated;
GRANT ALL ON FUNCTION supabase_functions.http_request() TO service_role;


--
-- Name: FUNCTION _crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault._crypto_aead_det_decrypt(message bytea, additional bytea, key_id bigint, context bytea, nonce bytea) TO service_role;


--
-- Name: FUNCTION create_secret(new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.create_secret(new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: FUNCTION update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid); Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO postgres WITH GRANT OPTION;
GRANT ALL ON FUNCTION vault.update_secret(secret_id uuid, new_secret text, new_name text, new_description text, new_key_id uuid) TO service_role;


--
-- Name: TABLE audit_log_entries; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.audit_log_entries TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.audit_log_entries TO postgres;
GRANT SELECT ON TABLE auth.audit_log_entries TO postgres WITH GRANT OPTION;


--
-- Name: TABLE flow_state; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.flow_state TO postgres;
GRANT SELECT ON TABLE auth.flow_state TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.flow_state TO dashboard_user;


--
-- Name: TABLE identities; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.identities TO postgres;
GRANT SELECT ON TABLE auth.identities TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.identities TO dashboard_user;


--
-- Name: TABLE instances; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.instances TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.instances TO postgres;
GRANT SELECT ON TABLE auth.instances TO postgres WITH GRANT OPTION;


--
-- Name: TABLE mfa_amr_claims; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_amr_claims TO postgres;
GRANT SELECT ON TABLE auth.mfa_amr_claims TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_amr_claims TO dashboard_user;


--
-- Name: TABLE mfa_challenges; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_challenges TO postgres;
GRANT SELECT ON TABLE auth.mfa_challenges TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_challenges TO dashboard_user;


--
-- Name: TABLE mfa_factors; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.mfa_factors TO postgres;
GRANT SELECT ON TABLE auth.mfa_factors TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.mfa_factors TO dashboard_user;


--
-- Name: TABLE oauth_clients; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.oauth_clients TO postgres;
GRANT ALL ON TABLE auth.oauth_clients TO dashboard_user;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.one_time_tokens TO postgres;
GRANT SELECT ON TABLE auth.one_time_tokens TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.one_time_tokens TO dashboard_user;


--
-- Name: TABLE refresh_tokens; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.refresh_tokens TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.refresh_tokens TO postgres;
GRANT SELECT ON TABLE auth.refresh_tokens TO postgres WITH GRANT OPTION;


--
-- Name: SEQUENCE refresh_tokens_id_seq; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO dashboard_user;
GRANT ALL ON SEQUENCE auth.refresh_tokens_id_seq TO postgres;


--
-- Name: TABLE saml_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_providers TO postgres;
GRANT SELECT ON TABLE auth.saml_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_providers TO dashboard_user;


--
-- Name: TABLE saml_relay_states; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.saml_relay_states TO postgres;
GRANT SELECT ON TABLE auth.saml_relay_states TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.saml_relay_states TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT SELECT ON TABLE auth.schema_migrations TO postgres WITH GRANT OPTION;


--
-- Name: TABLE sessions; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sessions TO postgres;
GRANT SELECT ON TABLE auth.sessions TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sessions TO dashboard_user;


--
-- Name: TABLE sso_domains; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_domains TO postgres;
GRANT SELECT ON TABLE auth.sso_domains TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_domains TO dashboard_user;


--
-- Name: TABLE sso_providers; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.sso_providers TO postgres;
GRANT SELECT ON TABLE auth.sso_providers TO postgres WITH GRANT OPTION;
GRANT ALL ON TABLE auth.sso_providers TO dashboard_user;


--
-- Name: TABLE users; Type: ACL; Schema: auth; Owner: supabase_auth_admin
--

GRANT ALL ON TABLE auth.users TO dashboard_user;
GRANT INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE auth.users TO postgres;
GRANT SELECT ON TABLE auth.users TO postgres WITH GRANT OPTION;


--
-- Name: TABLE hypopg_list_indexes; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.hypopg_list_indexes TO postgres WITH GRANT OPTION;


--
-- Name: TABLE hypopg_hidden_indexes; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.hypopg_hidden_indexes TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements TO postgres WITH GRANT OPTION;


--
-- Name: TABLE pg_stat_statements_info; Type: ACL; Schema: extensions; Owner: supabase_admin
--

GRANT ALL ON TABLE extensions.pg_stat_statements_info TO postgres WITH GRANT OPTION;


--
-- Name: TABLE agents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.agents TO anon;
GRANT ALL ON TABLE public.agents TO authenticated;
GRANT ALL ON TABLE public.agents TO service_role;


--
-- Name: TABLE artifact_submissions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.artifact_submissions TO anon;
GRANT ALL ON TABLE public.artifact_submissions TO authenticated;
GRANT ALL ON TABLE public.artifact_submissions TO service_role;


--
-- Name: TABLE artifacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.artifacts TO anon;
GRANT ALL ON TABLE public.artifacts TO authenticated;
GRANT ALL ON TABLE public.artifacts TO service_role;


--
-- Name: TABLE bids; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bids TO anon;
GRANT ALL ON TABLE public.bids TO authenticated;
GRANT ALL ON TABLE public.bids TO service_role;


--
-- Name: SEQUENCE bid_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.bid_id_seq TO anon;
GRANT ALL ON SEQUENCE public.bid_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.bid_id_seq TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.messages TO anon;
GRANT ALL ON TABLE public.messages TO authenticated;
GRANT ALL ON TABLE public.messages TO service_role;


--
-- Name: TABLE rfp_artifacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rfp_artifacts TO anon;
GRANT ALL ON TABLE public.rfp_artifacts TO authenticated;
GRANT ALL ON TABLE public.rfp_artifacts TO service_role;


--
-- Name: TABLE rfps; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.rfps TO anon;
GRANT ALL ON TABLE public.rfps TO authenticated;
GRANT ALL ON TABLE public.rfps TO service_role;


--
-- Name: SEQUENCE rfp_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.rfp_id_seq TO anon;
GRANT ALL ON SEQUENCE public.rfp_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.rfp_id_seq TO service_role;


--
-- Name: TABLE session_agents; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_agents TO anon;
GRANT ALL ON TABLE public.session_agents TO authenticated;
GRANT ALL ON TABLE public.session_agents TO service_role;


--
-- Name: TABLE session_artifacts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.session_artifacts TO anon;
GRANT ALL ON TABLE public.session_artifacts TO authenticated;
GRANT ALL ON TABLE public.session_artifacts TO service_role;


--
-- Name: TABLE sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.sessions TO anon;
GRANT ALL ON TABLE public.sessions TO authenticated;
GRANT ALL ON TABLE public.sessions TO service_role;


--
-- Name: TABLE supplier_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.supplier_profiles TO anon;
GRANT ALL ON TABLE public.supplier_profiles TO authenticated;
GRANT ALL ON TABLE public.supplier_profiles TO service_role;


--
-- Name: SEQUENCE supplier_id_seq; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE public.supplier_id_seq TO anon;
GRANT ALL ON SEQUENCE public.supplier_id_seq TO authenticated;
GRANT ALL ON SEQUENCE public.supplier_id_seq TO service_role;


--
-- Name: TABLE user_profiles; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.user_profiles TO anon;
GRANT ALL ON TABLE public.user_profiles TO authenticated;
GRANT ALL ON TABLE public.user_profiles TO service_role;


--
-- Name: TABLE messages; Type: ACL; Schema: realtime; Owner: supabase_realtime_admin
--

GRANT ALL ON TABLE realtime.messages TO postgres;
GRANT ALL ON TABLE realtime.messages TO dashboard_user;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO anon;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO authenticated;
GRANT SELECT,INSERT,UPDATE ON TABLE realtime.messages TO service_role;


--
-- Name: TABLE messages_2025_10_05; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_10_05 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_10_05 TO dashboard_user;


--
-- Name: TABLE messages_2025_10_06; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_10_06 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_10_06 TO dashboard_user;


--
-- Name: TABLE messages_2025_10_07; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_10_07 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_10_07 TO dashboard_user;


--
-- Name: TABLE messages_2025_10_08; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_10_08 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_10_08 TO dashboard_user;


--
-- Name: TABLE messages_2025_10_09; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.messages_2025_10_09 TO postgres;
GRANT ALL ON TABLE realtime.messages_2025_10_09 TO dashboard_user;


--
-- Name: TABLE schema_migrations; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.schema_migrations TO postgres;
GRANT ALL ON TABLE realtime.schema_migrations TO dashboard_user;
GRANT SELECT ON TABLE realtime.schema_migrations TO anon;
GRANT SELECT ON TABLE realtime.schema_migrations TO authenticated;
GRANT SELECT ON TABLE realtime.schema_migrations TO service_role;
GRANT ALL ON TABLE realtime.schema_migrations TO supabase_realtime_admin;


--
-- Name: TABLE subscription; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON TABLE realtime.subscription TO postgres;
GRANT ALL ON TABLE realtime.subscription TO dashboard_user;
GRANT SELECT ON TABLE realtime.subscription TO anon;
GRANT SELECT ON TABLE realtime.subscription TO authenticated;
GRANT SELECT ON TABLE realtime.subscription TO service_role;
GRANT ALL ON TABLE realtime.subscription TO supabase_realtime_admin;


--
-- Name: SEQUENCE subscription_id_seq; Type: ACL; Schema: realtime; Owner: supabase_admin
--

GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO postgres;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO dashboard_user;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO anon;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE realtime.subscription_id_seq TO service_role;
GRANT ALL ON SEQUENCE realtime.subscription_id_seq TO supabase_realtime_admin;


--
-- Name: TABLE buckets; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets TO anon;
GRANT ALL ON TABLE storage.buckets TO authenticated;
GRANT ALL ON TABLE storage.buckets TO service_role;
GRANT ALL ON TABLE storage.buckets TO postgres WITH GRANT OPTION;


--
-- Name: TABLE buckets_analytics; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.buckets_analytics TO service_role;
GRANT ALL ON TABLE storage.buckets_analytics TO authenticated;
GRANT ALL ON TABLE storage.buckets_analytics TO anon;


--
-- Name: TABLE iceberg_namespaces; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_namespaces TO service_role;
GRANT SELECT ON TABLE storage.iceberg_namespaces TO authenticated;
GRANT SELECT ON TABLE storage.iceberg_namespaces TO anon;


--
-- Name: TABLE iceberg_tables; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.iceberg_tables TO service_role;
GRANT SELECT ON TABLE storage.iceberg_tables TO authenticated;
GRANT SELECT ON TABLE storage.iceberg_tables TO anon;


--
-- Name: TABLE objects; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.objects TO anon;
GRANT ALL ON TABLE storage.objects TO authenticated;
GRANT ALL ON TABLE storage.objects TO service_role;
GRANT ALL ON TABLE storage.objects TO postgres WITH GRANT OPTION;


--
-- Name: TABLE prefixes; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.prefixes TO service_role;
GRANT ALL ON TABLE storage.prefixes TO authenticated;
GRANT ALL ON TABLE storage.prefixes TO anon;


--
-- Name: TABLE s3_multipart_uploads; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads TO anon;


--
-- Name: TABLE s3_multipart_uploads_parts; Type: ACL; Schema: storage; Owner: supabase_storage_admin
--

GRANT ALL ON TABLE storage.s3_multipart_uploads_parts TO service_role;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO authenticated;
GRANT SELECT ON TABLE storage.s3_multipart_uploads_parts TO anon;


--
-- Name: TABLE hooks; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE supabase_functions.hooks TO postgres;
GRANT ALL ON TABLE supabase_functions.hooks TO anon;
GRANT ALL ON TABLE supabase_functions.hooks TO authenticated;
GRANT ALL ON TABLE supabase_functions.hooks TO service_role;


--
-- Name: SEQUENCE hooks_id_seq; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON SEQUENCE supabase_functions.hooks_id_seq TO postgres;
GRANT ALL ON SEQUENCE supabase_functions.hooks_id_seq TO anon;
GRANT ALL ON SEQUENCE supabase_functions.hooks_id_seq TO authenticated;
GRANT ALL ON SEQUENCE supabase_functions.hooks_id_seq TO service_role;


--
-- Name: TABLE migrations; Type: ACL; Schema: supabase_functions; Owner: supabase_functions_admin
--

GRANT ALL ON TABLE supabase_functions.migrations TO postgres;
GRANT ALL ON TABLE supabase_functions.migrations TO anon;
GRANT ALL ON TABLE supabase_functions.migrations TO authenticated;
GRANT ALL ON TABLE supabase_functions.migrations TO service_role;


--
-- Name: TABLE seed_files; Type: ACL; Schema: supabase_migrations; Owner: postgres
--

GRANT ALL ON TABLE supabase_migrations.seed_files TO anon;
GRANT ALL ON TABLE supabase_migrations.seed_files TO authenticated;


--
-- Name: TABLE secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.secrets TO service_role;


--
-- Name: TABLE decrypted_secrets; Type: ACL; Schema: vault; Owner: supabase_admin
--

GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE vault.decrypted_secrets TO postgres WITH GRANT OPTION;
GRANT SELECT,DELETE ON TABLE vault.decrypted_secrets TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: auth; Owner: supabase_auth_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_auth_admin IN SCHEMA auth GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON SEQUENCES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON FUNCTIONS TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: extensions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA extensions GRANT ALL ON TABLES TO postgres WITH GRANT OPTION;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: graphql_public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA graphql_public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON SEQUENCES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON FUNCTIONS TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: realtime; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA realtime GRANT ALL ON TABLES TO dashboard_user;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: storage; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA storage GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: supabase_functions; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA supabase_functions GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: -; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres GRANT ALL ON TABLES TO authenticated;


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


ALTER EVENT TRIGGER issue_graphql_placeholder OWNER TO supabase_admin;

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


ALTER EVENT TRIGGER issue_pg_cron_access OWNER TO supabase_admin;

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE FUNCTION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


ALTER EVENT TRIGGER issue_pg_graphql_access OWNER TO supabase_admin;

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


ALTER EVENT TRIGGER issue_pg_net_access OWNER TO supabase_admin;

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


ALTER EVENT TRIGGER pgrst_ddl_watch OWNER TO supabase_admin;

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


ALTER EVENT TRIGGER pgrst_drop_watch OWNER TO supabase_admin;

--
-- PostgreSQL database dump complete
--

\unrestrict fbgqSf22c9nxb6iCVmphK3N8kIhKi1EOUVNlGRheuNmq8yMMPkJaQSj9A55CJRj

