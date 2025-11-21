-- Test array syntax
SELECT ARRAY['create_and_set_rfp, set_current_rfp, get_current_rfp', 'create_form_artifact, update_form_data, get_form_schema, update_form_artifact']::text[] AS test;
