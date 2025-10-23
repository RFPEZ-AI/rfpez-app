// Copyright Mark Skiba, 2025 All rights reserved
// Core tools and database operations for Claude API v3

import { mapArtifactRole } from '../utils/mapping.ts';

// Type definitions for database operations
interface Agent {
  id: string;
  name: string;
  description?: string;
  is_free?: boolean;
  is_restricted?: boolean;
  role?: string;
  instructions?: string;
  initial_prompt?: string;
}

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  message: string;
  created_at: string;
  agent_id?: string;
  is_system_message?: boolean;
  metadata?: Record<string, unknown>;
}

interface SupabaseClient {
  from: (table: string) => {
    select: (columns?: string) => SupabaseQuery;
    insert: (data: Record<string, unknown>) => SupabaseQuery;
    update: (data: Record<string, unknown>) => SupabaseQuery;
    delete: () => SupabaseQuery;
    eq: (column: string, value: unknown) => SupabaseQuery;
    in: (column: string, values: unknown[]) => SupabaseQuery;
    order: (column: string, options?: Record<string, unknown>) => SupabaseQuery;
    limit: (count: number) => SupabaseQuery;
    single: () => SupabaseQuery;
  };
  auth: {
    getUser: () => Promise<{ data: { user: Record<string, unknown> } | null; error: unknown }>;
  };
}

interface SupabaseQuery {
  select: (columns?: string) => SupabaseQuery;
  insert: (data: Record<string, unknown>) => SupabaseQuery;
  update: (data: Record<string, unknown>) => SupabaseQuery;
  delete: () => SupabaseQuery;
  eq: (column: string, value: unknown) => SupabaseQuery;
  in: (column: string, values: unknown[]) => SupabaseQuery;
  order: (column: string, options?: Record<string, unknown>) => SupabaseQuery;
  limit: (count: number) => SupabaseQuery;
  single: () => SupabaseQuery;
  textSearch: (column: string, query: string) => SupabaseQuery;
  ilike: (column: string, pattern: string) => SupabaseQuery;
  then: <T>(onfulfilled?: (value: { data: T; error: unknown }) => T | PromiseLike<T>) => Promise<T>;
}

interface FormArtifactData {
  rfp_id: number; // REQUIRED: RFP ID to associate artifact with
  name: string;
  description?: string;
  content: Record<string, unknown>; // JSON object for form schema
  artifactRole: string;
  form_schema?: Record<string, unknown>;
  form_data?: Record<string, unknown>;
  artifact_type?: string;
  title?: string;
}

interface MessageData {
  sessionId: string;
  agentId?: string;
  userId: string;
  sender: 'user' | 'assistant';
  content: string;
  session_id?: string;
  message?: string;
  role?: 'user' | 'assistant';
  agent_id?: string;
  function_name?: string;
  function_arguments?: Record<string, unknown>;
  artifacts?: Record<string, unknown>[];
  metadata?: Record<string, unknown>; // Tool execution metadata (functions_called, model, etc.)
}

interface DatabaseMessageResult {
  id: string;
  role: string;
  message: string;
  created_at: string;
  agent_id?: string;
  is_system_message?: boolean;
  metadata?: Record<string, unknown>;
  agents?: {
    name: string;
    role: string;
  };
}

interface SessionData {
  userId: string;
  title?: string;
  agentId?: string;
  name?: string;
  initial_message?: string;
}

interface SearchData {
  userId: string;
  query: string;
  session_id?: string;
  limit?: number;
}

interface AgentData {
  session_id: string;
  user_access_tier?: string;
  include_restricted?: boolean;
}

interface SwitchAgentData {
  session_id: string;
  agent_id?: string;
  agent_name?: string;
  user_input?: string;
  extracted_keywords?: string[];
  confusion_reason?: string;
  reason?: string;
}

// Transform custom form structure to standard JSON Schema
function transformToJsonSchema(customForm: Record<string, unknown>): { 
  schema: Record<string, unknown>, 
  uiSchema: Record<string, unknown>, 
  defaultValues: Record<string, unknown> 
} {
  // Check if it's already a valid JSON Schema
  if (customForm.type === 'object' && customForm.properties) {
    return {
      schema: customForm,
      uiSchema: {},
      defaultValues: {}
    };
  }

  // Check if it's our custom sections/fields structure
  if (customForm.sections && Array.isArray(customForm.sections)) {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    const uiSchema: Record<string, unknown> = {};
    const defaultValues: Record<string, unknown> = {};

    // Process each section
    (customForm.sections as Record<string, unknown>[]).forEach((section: Record<string, unknown>) => {
      if (section.fields && Array.isArray(section.fields)) {
        (section.fields as Record<string, unknown>[]).forEach((field: Record<string, unknown>) => {
          const fieldId = (field.id || field.name) as string;
          if (!fieldId || typeof fieldId !== 'string') {
            console.warn('Skipping field with invalid or missing id/name:', field);
            return;
          }

          // Convert field to JSON Schema property
          const property: Record<string, unknown> = {
            title: field.label || fieldId,
            description: field.placeholder || field.description
          };

          // Normalize field type to prevent undefined types
          const fieldType = field.type || 'text';
          console.log(`Processing field: ${fieldId}, type: ${fieldType}`);

          // Map field types to JSON Schema types
          switch (fieldType) {
            case 'text':
            case 'email':
            case 'tel':
              property.type = 'string';
              if (field.type === 'email') property.format = 'email';
              break;
            case 'textarea':
              property.type = 'string';
              uiSchema[fieldId] = { 'ui:widget': 'textarea' };
              break;
            case 'number':
              property.type = 'number';
              if (typeof field.min === 'number') property.minimum = field.min;
              if (typeof field.max === 'number') property.maximum = field.max;
              break;
            case 'checkbox':
              if (field.options && Array.isArray(field.options)) {
                property.type = 'array';
                // Handle both simple strings and objects with value property
                const enumValues = field.options.length > 0 && 
                  typeof field.options[0] === 'object' && 
                  (field.options[0] as Record<string, unknown>)?.value
                    ? field.options.map((opt: Record<string, unknown>) => opt.value as string)
                    : field.options;
                property.items = { type: 'string', enum: enumValues };
                property.uniqueItems = true;
                uiSchema[fieldId] = { 'ui:widget': 'checkboxes' };
              } else {
                property.type = 'boolean';
              }
              break;
            case 'radio': {
              property.type = 'string';
              // Handle both simple strings and objects with value property
              const radioEnumValues = Array.isArray(field.options) && field.options.length > 0 && 
                typeof field.options[0] === 'object' && 
                (field.options[0] as Record<string, unknown>)?.value
                  ? field.options.map((opt: Record<string, unknown>) => opt.value as string)
                  : field.options || [];
              property.enum = radioEnumValues;
              uiSchema[fieldId] = { 'ui:widget': 'radio' };
              break;
            }
            case 'select': {
              property.type = 'string';
              // Handle both simple strings and objects with value property
              const selectEnumValues = Array.isArray(field.options) && field.options.length > 0 && 
                typeof field.options[0] === 'object' && 
                (field.options[0] as Record<string, unknown>)?.value
                  ? field.options.map((opt: Record<string, unknown>) => opt.value as string)
                  : field.options || [];
              property.enum = selectEnumValues;
              break;
            }
            default:
              console.warn(`Unknown field type "${fieldType}" for field "${fieldId}", defaulting to string`);
              property.type = 'string';
          }

          // Ensure every property has a valid type
          if (!property.type) {
            console.warn(`Field "${fieldId}" missing type after processing, defaulting to string`);
            property.type = 'string';
          }

          properties[fieldId] = property;

          // Add to required if field is required
          if (field.required === true) {
            required.push(fieldId);
          }

          // Set default value if provided
          if (field.default !== undefined) {
            defaultValues[fieldId] = field.default;
          }
        });
      }
    });

    const schema = {
      type: 'object',
      title: customForm.title || 'Form',
      description: customForm.description,
      properties,
      required: required.length > 0 ? required : undefined
    };

    // Validate schema properties to prevent "Unknown field type undefined" errors
    Object.entries(properties).forEach(([key, prop]) => {
      const property = prop as Record<string, unknown>;
      if (!property.type) {
        console.error(`Property "${key}" has no type, fixing to string`);
        property.type = 'string';
      }
    });

    console.log('Generated schema with properties:', Object.keys(properties).map(key => {
      const prop = properties[key] as Record<string, unknown>;
      return `${key}:${prop.type}`;
    }).join(', '));

    return { schema, uiSchema, defaultValues };
  }

  // Fallback: treat as direct schema
  return {
    schema: customForm,
    uiSchema: {},
    defaultValues: {}
  };
}

// Get the current active RFP for a session
export async function getCurrentRfp(supabase: SupabaseClient, sessionId: string) {
  console.log('🔍 Getting current RFP for session:', sessionId);
  
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .select('current_rfp_id')
    .eq('id', sessionId)
    .single() as { data: { current_rfp_id?: number } | null; error: Error | null };
  
  if (sessionError) {
    console.error('Error fetching session:', sessionError);
    throw new Error(`Failed to fetch session: ${sessionError.message}`);
  }
  
  if (!session?.current_rfp_id) {
    console.log('⚠️ No current RFP set for this session');
    return {
      success: true,
      rfp_id: null,
      message: 'No RFP is currently set for this session. You must call create_and_set_rfp first before creating artifacts.'
    };
  }
  
  // Fetch RFP details
  const { data: rfp, error: rfpError } = await supabase
    .from('rfps')
    .select('id, name, description, status, created_at')
    .eq('id', session.current_rfp_id)
    .single() as { data: { id: number; name: string; description?: string; status: string; created_at: string } | null; error: Error | null };
  
  if (rfpError) {
    console.error('Error fetching RFP:', rfpError);
    throw new Error(`Failed to fetch RFP: ${rfpError.message}`);
  }
  
  if (!rfp) {
    throw new Error('RFP not found');
  }
  
  console.log('✅ Found current RFP:', { id: rfp.id, name: rfp.name });
  
  return {
    success: true,
    rfp_id: rfp.id,
    name: rfp.name,
    description: rfp.description,
    status: rfp.status,
    created_at: rfp.created_at,
    message: `Current RFP: ${rfp.name} (ID: ${rfp.id})`
  };
}

// Create a form artifact in the database
export async function createFormArtifact(supabase: SupabaseClient, sessionId: string, userId: string, data: FormArtifactData) {
  const { name, description, content, artifactRole, rfp_id } = data;
  
  // ⚠️ CRITICAL: Validate RFP ID is provided
  if (!rfp_id) {
    throw new Error('❌ CRITICAL: rfp_id is required. You must either call create_and_set_rfp first (which returns rfp_id) or use get_current_rfp to get the session\'s current RFP ID. Forms cannot be created without an associated RFP.');
  }
  
  // Validate RFP exists
  const { data: rfp, error: rfpError } = await supabase
    .from('rfps')
    .select('id, name')
    .eq('id', rfp_id)
    .single() as { data: { id: number; name: string } | null; error: Error | null };
  
  if (rfpError || !rfp) {
    throw new Error(`❌ Invalid RFP ID: ${rfp_id}. The specified RFP does not exist. Use get_current_rfp or create_and_set_rfp to get a valid RFP ID.`);
  }
  
  console.log('✅ Validated RFP association:', { rfp_id, rfp_name: rfp.name });
  
  // ✅ CRITICAL FIX: Get account_id from session (artifacts table requires it)
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('account_id')
    .eq('id', sessionId)
    .single() as { data: { account_id: string } | null; error: Error | null };
  
  if (sessionError || !sessionData?.account_id) {
    throw new Error(`❌ Could not get account_id from session ${sessionId}. Session may not exist or lacks account association.`);
  }
  
  const accountId = sessionData.account_id;
  console.log('✅ Retrieved account_id from session:', accountId);
  
  // Default to buyer_questionnaire if artifactRole is not provided
  const effectiveArtifactRole = artifactRole || 'buyer_questionnaire';
  
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(effectiveArtifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${effectiveArtifactRole}`);
  }
  
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = crypto.randomUUID();
  
  console.log('Creating form artifact:', { artifactId, name, description, artifactRole: effectiveArtifactRole, mappedRole, sessionId, userId, accountId });
  
  // Parse the content to extract schema components
  let schema: Record<string, unknown> = {};
  let ui_schema: Record<string, unknown> = {};
  let default_values: Record<string, unknown> = {};
  let submit_action: Record<string, unknown> = { type: 'save_session' };
  
  if (content && typeof content === 'object') {
    const contentObj = content as Record<string, unknown>;
    
    // If content already has the expected structure
    if (contentObj.schema) {
      schema = contentObj.schema as Record<string, unknown>;
      ui_schema = (contentObj.uiSchema || contentObj.ui_schema || {}) as Record<string, unknown>;
      default_values = (contentObj.formData || contentObj.default_values || {}) as Record<string, unknown>;
      submit_action = (contentObj.submitAction || contentObj.submit_action || { type: 'save_session' }) as Record<string, unknown>;
    } else {
      // Transform any custom structure to JSON Schema
      const transformed = transformToJsonSchema(contentObj);
      schema = transformed.schema;
      ui_schema = transformed.uiSchema;
      default_values = transformed.defaultValues;
      submit_action = { type: 'save_session' };
    }
  }
  
  // Validate schema structure to prevent frontend errors
  if (schema && typeof schema === 'object' && schema.properties) {
    const properties = schema.properties as Record<string, unknown>;
    Object.entries(properties).forEach(([key, prop]) => {
      const property = prop as Record<string, unknown>;
      if (!property.type) {
        console.warn(`Schema property "${key}" missing type, defaulting to string`);
        property.type = 'string';
      }
    });
  }

  console.log('Parsed form components:', { 
    hasSchema: !!schema && Object.keys(schema).length > 0,
    hasUiSchema: !!ui_schema && Object.keys(ui_schema).length > 0,
    hasDefaultValues: !!default_values && Object.keys(default_values).length > 0,
    schemaType: (schema as Record<string, unknown>)?.type,
    propertyCount: schema && schema.properties ? Object.keys(schema.properties as Record<string, unknown>).length : 0
  });
  
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .insert({
      id: artifactId, // Provide the required ID field
      session_id: sessionId,
      user_id: userId,
      account_id: accountId, // ✅ CRITICAL FIX: Include account_id from session
      name: name,
      description: description,
      artifact_role: mappedRole,
      schema: schema, // Store the JSON Schema
      ui_schema: ui_schema, // Store the UI Schema
      default_values: default_values, // Store the default form data
      submit_action: submit_action, // Store the submit action
      type: 'form', // Set the type as 'form'
      status: 'active', // Required by constraint
      processing_status: 'completed', // Required by constraint
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating form artifact:', error);
    throw error;
  }

  console.log('✅ Form artifact successfully inserted into database:', (artifact as unknown as { id: string }).id);
  
  // Add explicit wait to ensure database commit completes
  await new Promise(resolve => setTimeout(resolve, 100));

  // ARTIFACT-RFP LINKING: Link form artifact to the provided RFP
  try {
    console.log('🔗 Claude API V3: Linking form artifact to RFP:', {
      artifactId: (artifact as unknown as { id: string }).id,
      rfpId: rfp_id,
      artifactRole: mappedRole
    });
    
    // Map artifact role to valid rfp_artifacts role values
    let rfpRole = 'supplier'; // Default
    if (mappedRole?.includes('buyer') || mappedRole?.includes('questionnaire')) {
      rfpRole = 'buyer';
    } else if (mappedRole?.includes('supplier') || mappedRole?.includes('bid')) {
      rfpRole = 'supplier';
    } else if (mappedRole?.includes('evaluator')) {
      rfpRole = 'evaluator';
    }
    
    // Insert into rfp_artifacts junction table
    const { error: linkError } = await supabase
      .from('rfp_artifacts')
      .insert({
        rfp_id: rfp_id,
        artifact_id: (artifact as unknown as { id: string }).id,
        role: rfpRole
      });
    
    if (linkError) {
      console.error('⚠️ Claude API V3: Failed to link artifact to RFP:', linkError);
      throw new Error(`Failed to link artifact to RFP: ${JSON.stringify(linkError)}`);
    }
    
    console.log('✅ Claude API V3: Successfully linked artifact to RFP');
  } catch (linkingError) {
    console.error('⚠️ Claude API V3: Error during artifact linking:', linkingError);
    throw linkingError;
  }

  // Verify the artifact was actually saved by querying it back
  const createdArtifactId = (artifact as unknown as { id: string }).id;
  const { data: verification, error: verifyError } = await supabase
    .from('artifacts')
    .select('id, name, type')
    .eq('id', createdArtifactId)
    .single();

  if (verifyError || !verification) {
    console.error('⚠️ Form artifact verification failed:', verifyError);
    throw new Error(`Failed to verify artifact creation: ${typeof verifyError === 'object' && verifyError && 'message' in verifyError ? String(verifyError.message) : 'Artifact not found after creation'}`);
  }

  console.log('✅ Form artifact creation verified:', verification);

  return {
    success: true,
    artifact_id: createdArtifactId,
    artifact_name: name, // Include the name in the response
    message: `Created ${mappedRole} artifact: ${name}`,
    clientCallbacks: [
      {
        type: 'ui_refresh',
        target: 'artifact_panel',
        payload: {
          artifact_id: createdArtifactId,
          artifact_name: name,
          artifact_type: 'form',
          artifact_role: mappedRole,
          message: `Form artifact "${name}" has been created successfully`
        },
        priority: 'medium'
      }
    ]
  };
}

// Create a document artifact and store in the database
export async function createDocumentArtifact(supabase: SupabaseClient, sessionId: string, userId: string, data: {
  rfp_id: number; // REQUIRED: RFP ID to associate artifact with
  name: string;
  description?: string;
  content: string;
  content_type?: string;
  artifactRole: string;
  tags?: string[];
}) {
  console.log('🔥 CREATEDOCUMENTARTIFACT FUNCTION CALLED!', {
    sessionId,
    userId,
    data: JSON.stringify(data, null, 2)
  });
  
  const { rfp_id, name, description, content, content_type = 'markdown', artifactRole, tags = [] } = data;
  
  // ⚠️ CRITICAL: Validate RFP ID is provided
  if (!rfp_id) {
    throw new Error('❌ CRITICAL: rfp_id is required. You must either call create_and_set_rfp first (which returns rfp_id) or use get_current_rfp to get the session\'s current RFP ID. Documents cannot be created without an associated RFP.');
  }
  
  // Validate RFP exists
  const { data: rfp, error: rfpError } = await supabase
    .from('rfps')
    .select('id, name')
    .eq('id', rfp_id)
    .single() as { data: { id: number; name: string } | null; error: Error | null };
  
  if (rfpError || !rfp) {
    throw new Error(`❌ Invalid RFP ID: ${rfp_id}. The specified RFP does not exist. Use get_current_rfp or create_and_set_rfp to get a valid RFP ID.`);
  }
  
  console.log('✅ Validated RFP association:', { rfp_id, rfp_name: rfp.name });
  
  // ✅ CRITICAL FIX: Get account_id from session (artifacts table requires it)
  const { data: sessionData, error: sessionError } = await supabase
    .from('sessions')
    .select('account_id')
    .eq('id', sessionId)
    .single() as { data: { account_id: string } | null; error: Error | null };
  
  if (sessionError || !sessionData?.account_id) {
    throw new Error(`❌ Could not get account_id from session ${sessionId}. Session may not exist or lacks account association.`);
  }
  
  const accountId = sessionData.account_id;
  console.log('✅ Retrieved account_id from session:', accountId);
  
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(artifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${artifactRole}`);
  }
  
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log('Creating document artifact:', { artifactId, name, description, artifactRole, mappedRole, sessionId, userId, accountId });
  
  // Validate content_type
  const validContentTypes = ['markdown', 'plain', 'html'];
  if (!validContentTypes.includes(content_type)) {
    throw new Error(`Content type must be one of: ${validContentTypes.join(', ')}`);
  }
  
  const insertData = {
    id: artifactId, // Provide the required ID field
    session_id: sessionId,
    user_id: userId,
    account_id: accountId, // ✅ CRITICAL FIX: Include account_id from session
    name: name,
    description: description,
    artifact_role: mappedRole,
    schema: {
      type: 'text',
      content_type,
      tags: tags || []
    },
    ui_schema: null,
    default_values: {
      content,
      content_type,
      tags: tags || []
    },
    submit_action: null,
    type: 'document', // Set the type as 'document'
    status: 'active', // Required by constraint
    processing_status: 'completed', // Required by constraint
    file_size: content.length,
    mime_type: content_type === 'html' ? 'text/html' : content_type === 'plain' ? 'text/plain' : 'text/markdown',
    processed_content: content,
    metadata: {
      type: 'text',
      content_type,
      description: description || null,
      tags: tags || [],
      user_id: userId
    },
    created_at: new Date().toISOString()
  };
  
  console.log('🗄️ Document artifact insert data:', JSON.stringify(insertData, null, 2));
  
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .insert(insertData)
    .select()
    .single();

  console.log('🗄️ Document artifact insert result:', { 
    success: !error,
    error: error ? JSON.stringify(error, null, 2) : null,
    artifact: artifact ? { 
      id: (artifact as unknown as { id: string }).id, 
      name: (artifact as unknown as { name: string }).name 
    } : null
  });

  if (error) {
    console.error('❌ Error creating document artifact:', JSON.stringify(error, null, 2));
    throw error;
  }

  console.log('✅ Document artifact successfully inserted into database:', (artifact as unknown as { id: string }).id);

  // ARTIFACT-RFP LINKING: Link document artifact to the provided RFP
  try {
    console.log('🔗 Claude API V3: Linking document artifact to RFP:', {
      artifactId: (artifact as unknown as { id: string }).id,
      rfpId: rfp_id,
      artifactRole: mappedRole
    });
    
    // Map artifact role to valid rfp_artifacts role values
    let rfpRole = 'buyer'; // Default for documents
    if (mappedRole?.includes('supplier') || mappedRole?.includes('vendor')) {
      rfpRole = 'supplier';
    } else if (mappedRole?.includes('evaluator')) {
      rfpRole = 'evaluator';
    }
    
    // Insert into rfp_artifacts junction table
    const { error: linkError } = await supabase
      .from('rfp_artifacts')
      .insert({
        rfp_id: rfp_id,
        artifact_id: (artifact as unknown as { id: string }).id,
        role: rfpRole
      });
    
    if (linkError) {
      console.error('⚠️ Claude API V3: Failed to link document to RFP:', linkError);
      throw new Error(`Failed to link document to RFP: ${JSON.stringify(linkError)}`);
    }
    
    console.log('✅ Claude API V3: Successfully linked document to RFP');
  } catch (linkingError) {
    console.error('⚠️ Claude API V3: Error during document linking:', linkingError);
    throw linkingError;
  }

  return {
    success: true,
    artifact_id: (artifact as unknown as { id: string }).id,
    artifact_name: name, // Include the name in the response
    message: `Created ${mappedRole} document artifact: ${name}`
  };
}

// Get conversation history for a session
export async function getConversationHistory(supabase: SupabaseClient, sessionId: string, limit = 50) {
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      session_id,
      agent_id,
      user_id,
      role,
      content,
      created_at,
      agents!inner (
        id,
        name,
        instructions
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching conversation history:', error);
    return {
      success: false,
      error: String(error),
      data: null
    };
  }

  const messageList = Array.isArray(messages) ? messages : [];
  return {
    success: true,
    data: { messages: messageList },
    message: `Retrieved ${messageList.length} messages`
  };
}

// Store a message in the conversation
export async function storeMessage(supabase: SupabaseClient, data: MessageData) {
  const { sessionId, agentId, userId, sender, content, metadata } = data;
  
  console.log('Storing message:', { 
    sessionId, 
    agentId, 
    userId, 
    sender, 
    contentLength: content?.length,
    hasMetadata: !!metadata,
    metadataKeys: metadata ? Object.keys(metadata) : []
  });
  
  // Get the user's account_id from account_users (required for messages table)
  // userId is the auth user ID (auth.users.id)
  const { data: accountUser, error: accountError } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)  // account_users.user_id is auth.users.id
    .single();

  if (accountError || !accountUser) {
    console.error('❌ Error finding account for user:', userId, accountError);
    throw new Error(`Account not found for user_id: ${userId}. Cannot store message.`);
  }

  // @ts-expect-error - We know accountUser has an account_id property
  const accountId = accountUser.account_id;
  console.log('✅ Found account_id:', accountId, 'for auth user:', userId);
  
  const { data: message, error } = await supabase
    .from('messages')
    .insert({
      session_id: sessionId,
      agent_id: agentId,
      user_id: userId, // Now using auth.users.id directly (FK constraint updated) ✅
      account_id: accountId, // Required NOT NULL field
      role: sender, // Use 'role' column (not 'sender')
      content: content,
      metadata: metadata || {}, // Store tool execution metadata
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing message:', error);
    throw error;
  }

  return {
    success: true,
    message_id: (message as unknown as { id: string }).id,
    message: 'Message stored successfully'
  };
}

// Create a new conversation session
export async function createSession(supabase: SupabaseClient, data: SessionData) {
  const { userId, title, agentId } = data;
  
  console.log('🔧 CREATE_SESSION DEBUG START:', { 
    userId, 
    title, 
    agentId,
    userIdType: typeof userId,
    userIdLength: userId?.length,
    timestamp: new Date().toISOString()
  });
  
  // Get the user's account_id from account_users
  // userId is auth.users.id - sessions.user_id now directly references auth.users
  const { data: accountUser, error: accountError } = await supabase
    .from('account_users')
    .select('account_id')
    .eq('user_id', userId)
    .single();

  console.log('🔧 Account lookup result:', { 
    accountUser, 
    accountError: accountError ? JSON.stringify(accountError) : null
  });

  if (accountError || !accountUser) {
    console.error('❌ Account not found for auth user ID:', userId);
    throw new Error(`Account not found for user_id: ${userId}. Error: ${JSON.stringify(accountError)}`);
  }

  // @ts-expect-error - We know accountUser has an account_id property
  const accountId = accountUser.account_id;
  console.log('✅ Found account_id:', accountId, 'for auth user:', userId);
  
  const sessionData = {
    user_id: userId,  // Now directly uses auth.users.id (FK updated)
    account_id: accountId,  // Required field after schema update
    title: title || 'New Conversation',
    created_at: new Date().toISOString()
  };
  
  console.log('🔧 Attempting to insert session:', sessionData);
  
  const { data: session, error } = await supabase
    .from('sessions')
    .insert(sessionData)
    .select()
    .single();

  console.log('🔧 Session creation result:', { 
    session, 
    error: error ? JSON.stringify(error) : null,
    success: !error
  });

  if (error) {
    console.error('❌ Error creating session:', JSON.stringify(error));
    throw error;
  }

  // Link agent to session if provided
  if (agentId) {
    const { error: agentError } = await supabase
      .from('session_agents')
      .insert({
        session_id: (session as unknown as { id: string }).id,
        agent_id: agentId,
        created_at: new Date().toISOString()
      });

    if (agentError) {
      console.error('Error linking agent to session:', agentError);
      // Don't throw here, session creation succeeded
    }
  }

  // IMPORTANT: Set this new session as the user's current session
  // This ensures that when the user refreshes, they stay in the new session
  const sessionId = (session as unknown as { id: string }).id;
  console.log('🔧 Setting new session as current for user:', userId, 'Session:', sessionId);
  
  const { error: profileUpdateError } = await supabase
    .from('user_profiles')
    .update({ 
      current_session_id: sessionId,
      updated_at: new Date().toISOString()
    })
    .eq('supabase_user_id', userId);

  if (profileUpdateError) {
    console.error('⚠️ Warning: Failed to set current session in user profile:', profileUpdateError);
    // Don't throw here, session creation succeeded, this is just a convenience feature
  } else {
    console.log('✅ Successfully set new session as current session for user');
  }

  // 🎯 LAZY SESSION CREATION: No initial message storage on session creation
  // Welcome messages are handled by React UI via pendingWelcomeMessage state
  // This prevents empty sessions from accumulating in the database
  // Messages are only stored when the user actually interacts with the agent
  console.log('✅ V3: Session created successfully - welcome message handled by React UI');
  console.log('💡 V3: No database message storage on session creation (lazy pattern)');
  console.log('🎯 V3: Session will receive messages only when user sends first message');

  const result = {
    success: true,
    session_id: sessionId,
    message: 'Session created successfully'
  };
  
  console.log('✅ CREATE_SESSION SUCCESS:', result);
  return result;
}

// Search messages across conversations
export async function searchMessages(supabase: SupabaseClient, data: SearchData) {
  const { userId, query, limit = 20 } = data;
  
  console.log('Searching messages:', { userId, query, limit });
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      session_id,
      agent_id,
      content,
      role,
      created_at,
      sessions!inner (
        id,
        title,
        user_id
      ),
      agents (
        name
      )
    `)
    .eq('sessions.user_id', userId)
    .textSearch('content', query)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching messages:', error);
    throw error;
  }

  return { messages: messages || [] };
}

// Get available agents
export async function getAvailableAgents(supabase: SupabaseClient, data: AgentData) {
  const { include_restricted = false } = data;
  
  console.log('Getting available agents:', { include_restricted });
  
  let query = supabase
    .from('agents')
    .select('id, name, description, role, initial_prompt, is_active, is_free, is_restricted')
    .eq('is_active', true);
  
  if (!include_restricted) {
    query = query.eq('is_restricted', false);
  }
  
  const { data: agents, error } = await query.order('name');

  if (error) {
    console.error('Error fetching agents:', error);
    throw error;
  }

  // Format agents for display with IDs
  const formattedAgentList = ((agents as Agent[]) || []).map((agent: Agent) => 
    `**${agent.name}** (${agent.is_free ? 'free' : agent.is_restricted ? 'premium' : 'default'}) - ID: ${agent.id}${agent.description ? ' - ' + agent.description : ''}`
  );

  return {
    success: true,
    agents: agents || [],
    formatted_agent_list: formattedAgentList.join('\n'),
    agent_switching_instructions: "CRITICAL: When the user requests to switch agents, you MUST call the switch_agent function with session_id and agent_id. Do NOT just mention switching - you must execute the function call. Never say 'switching you to...' without calling switch_agent."
  };
}

// Get current agent for a session
export async function getCurrentAgent(supabase: SupabaseClient, data: AgentData) {
  const { session_id } = data;
  
  console.log('Getting current agent for session:', session_id);
  
  const { data: sessionAgent, error } = await supabase
    .from('session_agents')
    .select(`
      agent_id,
      created_at,
      agents!inner (
        id,
        name,
        description,
        role,
        initial_prompt,
        is_active
      )
    `)
    .eq('session_id', session_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching current agent:', error);
    return {
      success: false,
      error: 'No active agent found for this session',
      current_agent: null
    };
  }

  return {
    success: true,
    current_agent: {
      id: (sessionAgent as unknown as { agents: Agent }).agents.id,
      name: (sessionAgent as unknown as { agents: Agent }).agents.name,
      description: (sessionAgent as unknown as { agents: Agent }).agents.description,
      role: (sessionAgent as unknown as { agents: Agent }).agents.role,
      initial_prompt: (sessionAgent as unknown as { agents: Agent }).agents.initial_prompt
    }
  };
}

// Debug agent switch parameters
export function debugAgentSwitch(_supabase: SupabaseClient, userId: string, data: SwitchAgentData) {
  const { user_input, extracted_keywords, confusion_reason } = data;
  
  console.log('🐛 DEBUG AGENT SWITCH:', {
    user_input,
    extracted_keywords,
    confusion_reason,
    userId,
    timestamp: new Date().toISOString()
  });
  
  return {
    success: true,
    debug_info: {
      user_input,
      extracted_keywords,
      confusion_reason,
      message: 'Debug tool executed - this helps identify why agent switching fails',
      suggestion: 'Common patterns: "rfp design" → "RFP Design", "solutions" → "Solutions", "support" → "Technical Support"'
    }
  };
}

// Intelligent agent detection based on user message keywords
function detectAgentFromMessage(userMessage: string): string | null {
  const message = userMessage.toLowerCase();
  
  // RFP Design agent keywords (procurement, sourcing, buying)
  const rfpKeywords = ['source', 'buy', 'purchase', 'procure', 'rfp', 'equipment', 'supplies', 'computers', 'office', 'furniture', 'materials', 'construction', 'procurement', 'sourcing', 'need to buy', 'need to source', 'need to purchase'];
  
  // Solutions agent keywords (sales, product info)
  const salesKeywords = ['sell', 'products', 'services', 'pricing', 'demo', 'features', 'capabilities', 'what do you offer', 'how does it work'];
  
  // Support agent keywords  
  const supportKeywords = ['help', 'support', 'problem', 'issue', 'bug', 'error', 'how to', 'tutorial'];
  
  if (rfpKeywords.some(keyword => message.includes(keyword))) {
    return 'RFP Design';
  }
  
  if (salesKeywords.some(keyword => message.includes(keyword))) {
    return 'Solutions';
  }
  
  if (supportKeywords.some(keyword => message.includes(keyword))) {
    return 'Support';
  }
  
  return null;
}

// Switch to a different agent
export async function switchAgent(supabase: SupabaseClient, userId: string, data: SwitchAgentData, userMessage?: string) {
  const { session_id, agent_id, agent_name, reason } = data;
  let targetAgent = agent_id || agent_name; // Prioritize agent_id over agent_name
  
  // If no agent specified, try to detect from user message
  if (!targetAgent && userMessage) {
    const detectedAgent = detectAgentFromMessage(userMessage);
    if (detectedAgent) {
      console.log(`🤖 Auto-detected agent "${detectedAgent}" from user message: "${userMessage.substring(0, 100)}"`);
      targetAgent = detectedAgent;
    }
  }
  
  // Check if user is anonymous
  const ANONYMOUS_USER_ID = '00000000-0000-0000-0000-000000000001';
  const isAnonymousUser = userId === ANONYMOUS_USER_ID;
  
  console.log('🔄 AGENT SWITCH REQUEST:', {
    session_id,
    agent_id: agent_id || 'not provided',
    agent_name: agent_name || 'not provided', 
    targetAgent: targetAgent || 'not determined',
    reason: reason || 'not provided',
    userId,
    isAnonymousUser,
    userMessage: userMessage ? userMessage.substring(0, 100) + '...' : 'not provided'
  });
  
  // If no targetAgent was provided by Claude, this is a critical error
  if (!targetAgent && userMessage) {
    console.log('❌ Claude failed to provide agent_name parameter');
    console.log('📝 User message was:', userMessage);
    console.log('💡 This suggests Claude is not following the switch_agent tool instructions properly');
  }
  
  console.log('🔄 AGENT SWITCH ATTEMPT:', {
    session_id,
    agent_id,
    agent_name,
    targetAgent,
    reason,
    userId,
    isAnonymousUser,
    userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'not provided',
    timestamp: new Date().toISOString()
  });

  // Validate required parameters
  if (!targetAgent) {
    console.error('❌ Agent switch failed: Neither agent_name nor agent_id provided');
    console.error('❌ Input data:', { agent_id, agent_name, session_id });
    throw new Error('Agent switch failed: either agent_name or agent_id is required. Please specify which agent to switch to (e.g., "RFP Design", "Solutions", "Technical Support").');
  }
  
  console.log('✅ Target agent determined:', targetAgent);

  // Verify agent exists and is active (support both UUID and name)
  let agent, agentError;
  
  // Check if targetAgent is a UUID (contains hyphens and is 36 chars) or a name
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetAgent);
  
  if (isUUID) {
    // Look up by ID
    const result = await supabase
      .from('agents')
      .select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted')
      .eq('id', targetAgent)
      .eq('is_active', true)
      .single();
    agent = result.data;
    agentError = result.error;
  } else {
    // Look up by name (exact case match first, then case insensitive)
    let result = await supabase
      .from('agents')
      .select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted')
      .eq('name', targetAgent)
      .eq('is_active', true)
      .single();
    
    // If exact match fails, try case insensitive
    if (result.error) {
      console.log('🔍 Exact match failed, trying case insensitive search for:', targetAgent);
      result = await supabase
        .from('agents')
        .select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted')
        .ilike('name', targetAgent)
        .eq('is_active', true)
        .single();
    }
    
    agent = result.data;
    agentError = result.error;
  }

  if (agentError || !agent) {
    console.error('❌ Agent not found:', agentError);
    throw new Error(`Agent not found with identifier: ${targetAgent}`);
  }

  // 🔐 AUTHENTICATION & AUTHORIZATION CHECK
  // Validate agent access for anonymous users
  if (isAnonymousUser) {
    const agentObj = agent as unknown as Agent;
    const agentIsRestricted = agentObj.is_restricted;
    
    console.log('🔐 Anonymous user agent access validation:', {
      agentName: agentObj.name,
      is_restricted: agentIsRestricted,
      canAccess: !agentIsRestricted
    });
    
    // Anonymous users can ONLY access non-restricted agents
    // Restricted agents require authentication, regardless of is_free setting
    // This ensures premium features are locked behind sign-up/login
    if (agentIsRestricted) {
      console.log('🚫 ACCESS DENIED: Anonymous user trying to access restricted agent:', agentObj.name);
      throw new Error(`Access denied: The ${agentObj.name} agent requires an account to use. Please sign up or log in to access specialized agents like RFP Design, advanced features, and save your work. Anonymous users can use the Solutions agent for basic assistance.`);
    }
    
    console.log('✅ Access granted: Anonymous user can access non-restricted agent:', agentObj.name);
  } else {
    console.log('✅ Authenticated user - full agent access granted');
  }

  // CHECK IF WE'RE ALREADY ON THE REQUESTED AGENT - PREVENT REDUNDANT SWITCHES
  const { data: currentSessionAgent, error: currentAgentError } = await supabase
    .from('session_agents')
    .select(`
      agent_id,
      agents!inner (
        id,
        name
      )
    `)
    .eq('session_id', session_id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!currentAgentError && currentSessionAgent) {
    const currentAgentId = (currentSessionAgent as Record<string, unknown>).agent_id as string;
    const currentAgentName = ((currentSessionAgent as Record<string, unknown>).agents as Record<string, unknown>)?.name as string;
    const targetAgentId = (agent as unknown as Agent).id;
    
    console.log('🔍 Current vs Target agent check:', {
      current_agent_id: currentAgentId,
      current_agent_name: currentAgentName,
      target_agent_id: targetAgentId,
      target_agent_name: (agent as unknown as Agent).name,
      already_active: currentAgentId === targetAgentId
    });

    // If we're already on the requested agent, return early without switching
    if (currentAgentId === targetAgentId) {
      console.log('⚠️ REDUNDANT AGENT SWITCH DETECTED - Already on target agent:', currentAgentName);
      
      return {
        success: true,
        session_id,
        already_active: true, // Flag to indicate no switch was needed
        previous_agent_id: currentAgentId,
        new_agent: {
          id: (agent as unknown as Agent).id,
          name: (agent as unknown as Agent).name,
          role: (agent as unknown as Agent).role,
          instructions: (agent as unknown as Agent).instructions,
          initial_prompt: (agent as unknown as Agent).initial_prompt
        },
        switch_reason: reason,
        user_context: data.user_input,
        context_message: `You are already connected to the ${(agent as unknown as Agent).name} agent. How can I help you with your request?`,
        message: `You are already connected to the ${(agent as unknown as Agent).name} agent. How can I help you with your request?`,
        stop_processing: true // Signal that no switch was needed
      };
    }
  }

  // Deactivate current agent for this session
  await supabase
    .from('session_agents')
    .update({ is_active: false })
    .eq('session_id', session_id)
    .eq('is_active', true);

  // Activate new agent for this session
  const { error: insertError } = await supabase
    .from('session_agents')
    .insert({
      session_id,
      agent_id: (agent as unknown as Agent).id,
      is_active: true
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to switch agent:', insertError);
    throw new Error(`Failed to switch agent: ${(insertError as Error)?.message || 'Unknown error'}`);
  }

  console.log('✅ Agent switch completed successfully');

  console.log('✅ Agent switch completed - new agent will read conversation history');

  // Get current RFP context for UI updates
  let currentRfp = null;
  try {
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('current_rfp_id')
      .eq('id', session_id)
      .single();

    const sessionRecord = sessionData as unknown as { current_rfp_id?: string } | null;
    
    if (!sessionError && sessionRecord?.current_rfp_id) {
      // Get RFP details
      const { data: rfpData, error: rfpError } = await supabase
        .from('rfps')
        .select('id, name, status')
        .eq('id', sessionRecord.current_rfp_id)
        .single();

      const rfpRecord = rfpData as unknown as { id: string; name: string; status: string } | null;

      if (!rfpError && rfpRecord) {
        currentRfp = {
          id: rfpRecord.id,
          title: rfpRecord.name,
          status: rfpRecord.status
        };
        console.log('📋 Current RFP context for UI update:', currentRfp);
      }
    }
  } catch (rfpError) {
    console.warn('⚠️ Could not retrieve RFP context for UI update:', rfpError);
  }

  // No longer pass context directly - new agent will read session messages

  return {
    success: true,
    session_id,
    previous_agent_id: null, // Could track this if needed
    new_agent: {
      id: (agent as unknown as Agent).id,
      name: (agent as unknown as Agent).name,
      role: (agent as unknown as Agent).role,
      instructions: (agent as unknown as Agent).instructions,
      initial_prompt: (agent as unknown as Agent).initial_prompt
    },
    current_rfp: currentRfp, // Include RFP context for UI updates
    switch_reason: reason,
    message: `Successfully switched to ${(agent as unknown as Agent).name} agent. The ${(agent as unknown as Agent).name} will now read the conversation history and respond accordingly.`,
    trigger_continuation: true // Flag to trigger continuation with new agent reading full conversation
  };
}

// Fetch conversation history for agent switching context
export async function fetchConversationHistory(supabase: SupabaseClient, sessionId: string): Promise<ConversationMessage[]> {
  console.log('📚 Fetching conversation history for session:', sessionId);
  
  const { data: messages, error } = await supabase
    .from('messages')
    .select(`
      id,
      role,
      message,
      created_at,
      agent_id,
      is_system_message,
      metadata,
      agents!inner (
        name,
        role
      )
    `)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ Failed to fetch conversation history:', error);
    throw new Error(`Failed to fetch conversation history: ${(error as Error).message || 'Unknown error'}`);
  }

  console.log(`📚 Retrieved ${(messages as DatabaseMessageResult[])?.length || 0} messages from conversation history`);
  
  return ((messages as DatabaseMessageResult[]) || []).map((msg: DatabaseMessageResult) => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    message: msg.message,
    created_at: msg.created_at,
    agent_id: msg.agent_id,
    is_system_message: msg.is_system_message,
    metadata: msg.metadata,
    agent_name: msg.agents?.name,
    agent_role: msg.agents?.role
  })) as ConversationMessage[];
}

// Recommend agent for a topic
export async function recommendAgent(supabase: SupabaseClient, data: { topic: string; conversation_context?: string }) {
  const { topic } = data;
  
  console.log('Recommending agent for topic:', topic);
  
  // Get all active agents
  const { data: agents, error } = await supabase
    .from('agents')
    .select('id, name, description, role, initial_prompt, is_active')
    .eq('is_active', true)
    .order('name');

  if (error) {
    console.error('Error fetching agents for recommendation:', error);
    throw error;
  }

  // Simple keyword-based matching (could be enhanced with ML)
  const topicLower = topic.toLowerCase();
  let recommendedAgent = null;

  // Priority matching based on keywords
  const agentMatching = [
    { keywords: ['rfp', 'request for proposal', 'bid', 'procurement'], agentNames: ['RFP Design', 'RFP Assistant'] },
    { keywords: ['technical', 'support', 'help', 'error', 'bug'], agentNames: ['Technical Support'] },
    { keywords: ['sales', 'pricing', 'quote', 'cost'], agentNames: ['Solutions'] },
    { keywords: ['contract', 'negotiate', 'terms'], agentNames: ['Negotiation'] },
    { keywords: ['audit', 'review', 'compliance'], agentNames: ['Audit'] }
  ];

  for (const matching of agentMatching) {
    if (matching.keywords.some(keyword => topicLower.includes(keyword))) {
      recommendedAgent = (agents as unknown as Agent[])?.find((agent: Agent) => matching.agentNames.includes(agent.name));
      if (recommendedAgent) break;
    }
  }

  // Default to RFP Assistant if no specific match
  if (!recommendedAgent && agents && (agents as unknown as Agent[]).length > 0) {
    recommendedAgent = (agents as unknown as Agent[]).find((agent: Agent) => agent.name === 'RFP Assistant') || (agents as unknown as Agent[])[0];
  }

  return {
    success: true,
    recommended_agent: recommendedAgent ? {
      id: recommendedAgent.id,
      name: recommendedAgent.name,
      description: recommendedAgent.description,
      role: recommendedAgent.role,
      reason: recommendedAgent ? `Best match for topic: ${topic}` : 'Default recommendation'
    } : null,
    all_agents: agents || []
  };
}

// List artifacts with optional scope filtering
export async function listArtifacts(supabase: SupabaseClient, data: {
  sessionId?: string;
  allArtifacts?: boolean;
  artifactType?: string;
  limit?: number;
  userId: string;
}) {
  const { sessionId, allArtifacts = false, artifactType, limit = 50, userId } = data;
  
  console.log('📋 Listing artifacts:', { sessionId, allArtifacts, artifactType, limit, userId });

  try {
    let query = supabase
      .from('artifacts')
      .select('id, name, type, description, artifact_role, created_at, updated_at, status, session_id')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (!allArtifacts && sessionId) {
      // Session-scoped artifacts
      query = query.eq('session_id', sessionId);
    } else if (!allArtifacts) {
      // No session specified and not all artifacts - return empty
      return {
        success: true,
        artifacts: [],
        count: 0,
        scope: 'none'
      };
    }
    // For all artifacts, we'll filter after the query to handle user permissions properly

    if (artifactType) {
      query = query.eq('type', artifactType);
    }

    const { data: artifacts, error } = await query;

    if (error) {
      console.error('❌ Error listing artifacts:', error);
      throw error;
    }

    const artifactList = artifacts as unknown as Array<{
      id: string;
      name: string;
      type: string;
      description: string;
      artifact_role: string;
      created_at: string;
      updated_at: string;
      status: string;
      session_id: string;
    }> || [];

    return {
      success: true,
      artifacts: artifactList,
      count: artifactList.length,
      scope: allArtifacts ? 'account' : 'session',
      session_id: sessionId,
      filter_type: artifactType
    };
  } catch (error) {
    console.error('❌ Exception listing artifacts:', error);
    throw error;
  }
}

// Get the current artifact ID for a session
export async function getCurrentArtifactId(supabase: SupabaseClient, data: {
  sessionId?: string;
}) {
  const { sessionId } = data;
  
  console.log('🎯 Getting current artifact ID for session:', sessionId);

  try {
    if (!sessionId) {
      return {
        success: true,
        current_artifact_id: null,
        message: 'No session specified'
      };
    }

    // Try to get current artifact from session context
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('context')
      .eq('id', sessionId)
      .single();

    if (sessionError) {
      console.warn('⚠️ Could not retrieve session context:', sessionError);
    }

    const sessionRecord = sessionData as unknown as { context?: Record<string, unknown> } | null;
    let currentArtifactId = null;
    if (sessionRecord?.context && typeof sessionRecord.context === 'object') {
      currentArtifactId = sessionRecord.context.current_artifact_id as string || null;
    }

    // If no current artifact in context, get the most recent artifact for the session
    if (!currentArtifactId) {
      const { data: artifacts, error: artifactsError } = await supabase
        .from('artifacts')
        .select('id')
        .eq('session_id', sessionId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

      const artifactList = artifacts as unknown as Array<{ id: string }> || [];
      if (!artifactsError && artifactList.length > 0) {
        currentArtifactId = artifactList[0].id;
      }
    }

    return {
      success: true,
      current_artifact_id: currentArtifactId,
      session_id: sessionId,
      source: currentArtifactId ? (sessionRecord?.context ? 'session_context' : 'most_recent') : 'none'
    };
  } catch (error) {
    console.error('❌ Exception getting current artifact ID:', error);
    throw error;
  }
}

// Select an artifact to be displayed in the artifact window
export async function selectActiveArtifact(supabase: SupabaseClient, data: {
  artifactId: string;
  sessionId?: string;
}) {
  const { artifactId, sessionId } = data;
  
  console.log('🎯 Selecting active artifact:', { artifactId, sessionId });

  try {
    // Verify the artifact exists and get its details
    const { data: artifact, error: artifactError } = await supabase
      .from('artifacts')
      .select('id, name, type, session_id, status')
      .eq('id', artifactId)
      .single();

    if (artifactError || !artifact) {
      return {
        success: false,
        error: 'Artifact not found',
        artifact_id: artifactId
      };
    }

    const artifactRecord = artifact as unknown as {
      id: string;
      name: string;
      type: string;
      session_id: string;
      status: string;
    };

    if (artifactRecord.status !== 'active') {
      return {
        success: false,
        error: 'Artifact is not active',
        artifact_id: artifactId,
        status: artifactRecord.status
      };
    }

    // If sessionId is provided, update the session context
    if (sessionId) {
      // Get current session context
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('context')
        .eq('id', sessionId)
        .single();

      const sessionRecord = sessionData as unknown as { context?: Record<string, unknown> } | null;
      let context = {};
      if (!sessionError && sessionRecord?.context) {
        context = sessionRecord.context;
      }

      // Update context with current artifact
      const updatedContext = {
        ...context,
        current_artifact_id: artifactId
      };

      const { error: updateError } = await supabase
        .from('sessions')
        .update({ context: updatedContext })
        .eq('id', sessionId);

      if (updateError) {
        console.warn('⚠️ Failed to update session context:', updateError);
      }
    }

    return {
      success: true,
      artifact_id: artifactId,
      artifact_name: artifactRecord.name,
      artifact_type: artifactRecord.type,
      session_id: sessionId,
      message: `Active artifact set to: ${artifactRecord.name}`
    };
  } catch (error) {
    console.error('❌ Exception selecting active artifact:', error);
    throw error;
  }
}

// Get form schema to see field names and types before updating
export async function getFormSchema(supabase: SupabaseClient, _sessionId: string, _userId: string, data: {
  artifact_id: string;
  session_id: string;
}) {
  console.log('🔍 Getting form schema for:', data);
  
  const { artifact_id, session_id } = data;
  
  if (!artifact_id) {
    throw new Error('Artifact ID is required for getting form schema');
  }
  
  if (!session_id) {
    throw new Error('Session ID is required for getting form schema');
  }
  
  // Use same resolution logic as updateFormData
  let resolvedArtifactId = artifact_id;
  let existingArtifact: Record<string, unknown> | null = null;
  
  try {
    // Try UUID first
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifact_id);
    
    if (isUUID) {
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, name, type, schema, ui_schema, default_values')
        .eq('id', artifact_id)
        .eq('type', 'form')
        .single();
      
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = artifact_id;
      }
    }
    
    // Try by name in session
    if (!existingArtifact) {
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, name, type, schema, ui_schema, default_values')
        .eq('session_id', session_id)
        .eq('type', 'form')
        .eq('name', artifact_id)
        .single();
      
      if (!error && data) {
        existingArtifact = data as Record<string, unknown>;
        resolvedArtifactId = (data as unknown as { id: string }).id;
      } else {
        // Try fuzzy matching
        const { data: candidates, error: fuzzyError } = await supabase
          .from('artifacts')
          .select('id, name, type, schema, ui_schema, default_values')
          .eq('session_id', session_id)
          .eq('type', 'form')
          .ilike('name', `%${artifact_id}%`);
        
        if (!fuzzyError && candidates && Array.isArray(candidates) && candidates.length > 0) {
          existingArtifact = candidates[0] as Record<string, unknown>;
          resolvedArtifactId = (existingArtifact as { id: string }).id;
        }
      }
    }
    
    // Fallback to most recent form
    if (!existingArtifact) {
      const { data: currentArtifacts, error: currentError} = await supabase
        .from('artifacts')
        .select('id, name, type, schema, ui_schema, default_values')
        .eq('session_id', session_id)
        .eq('type', 'form')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!currentError && currentArtifacts && Array.isArray(currentArtifacts) && currentArtifacts.length > 0) {
        existingArtifact = currentArtifacts[0] as Record<string, unknown>;
        resolvedArtifactId = (existingArtifact as { id: string }).id;
      }
    }
    
    if (!existingArtifact) {
      throw new Error(`No form artifact found matching: ${artifact_id}`);
    }
    
    const schema = (existingArtifact as { schema?: Record<string, unknown> }).schema || {};
    const ui_schema = (existingArtifact as { ui_schema?: Record<string, unknown> }).ui_schema || {};
    const default_values = (existingArtifact as { default_values?: Record<string, unknown> }).default_values || {};
    
    console.log('✅ Retrieved form schema:', {
      artifact_id: resolvedArtifactId,
      name: (existingArtifact as { name: string }).name,
      field_count: Object.keys((schema as { properties?: Record<string, unknown> }).properties || {}).length
    });
    
    return {
      artifact_id: resolvedArtifactId,
      name: (existingArtifact as { name: string }).name,
      schema,
      ui_schema,
      default_values,
      field_names: Object.keys((schema as { properties?: Record<string, unknown> }).properties || {}),
      message: `Form schema retrieved for: ${(existingArtifact as { name: string }).name}`
    };
  } catch (error) {
    console.error('❌ Exception getting form schema:', error);
    throw error;
  }
}

// Update form data for an existing form artifact
export async function updateFormData(supabase: SupabaseClient, _sessionId: string, _userId: string, data: {
  artifact_id: string;
  session_id: string;
  form_data: Record<string, unknown>;
}) {
  console.log('🔄 Starting updateFormData with params:', JSON.stringify(data, null, 2));
  
  const { artifact_id, form_data, session_id } = data;
  
  console.log('🔄 Updating form data:', { artifact_id, userId: _userId, session_id });
  console.log('🔍 Form data to set:', form_data);
  
  if (!artifact_id) {
    throw new Error('Artifact ID is required for updating form data');
  }
  
  if (!form_data || typeof form_data !== 'object') {
    throw new Error('Form data must be a valid object');
  }
  
  if (!session_id) {
    throw new Error('Session ID is required for updating form data');
  }
  
  let resolvedArtifactId = artifact_id;
  let existingArtifact: Record<string, unknown> | null = null;
  
  try {
    // First try to find the artifact by ID (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(artifact_id);
    
    if (isUUID) {
      console.log('🔍 Searching by UUID:', artifact_id);
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, name, type, artifact_role, schema, user_id, session_id')
        .eq('id', artifact_id)
        .eq('type', 'form')
        .single();
      
      if (!error && data) {
        existingArtifact = data;
        resolvedArtifactId = artifact_id;
      }
    }
    
    // If not found by UUID or not a UUID, try to find by name in the current session
    if (!existingArtifact) {
      console.log('🔍 Searching by name in session:', { name: artifact_id, session_id });
      
      // Try exact name match first
      const { data, error } = await supabase
        .from('artifacts')
        .select('id, name, type, artifact_role, schema, user_id, session_id')
        .eq('session_id', session_id)
        .eq('type', 'form')
        .eq('name', artifact_id)
        .single();
      
      if (!error && data) {
        existingArtifact = data as Record<string, unknown>;
        resolvedArtifactId = (data as unknown as { id: string }).id;
        console.log('✅ Found artifact by exact name match:', resolvedArtifactId);
      } else {
        // Try fuzzy name matching (case-insensitive, partial matches)
        console.log('🔍 Trying fuzzy name matching...');
        const { data: candidates, error: fuzzyError } = await supabase
          .from('artifacts')
          .select('id, name, type, artifact_role, schema, user_id, session_id')
          .eq('session_id', session_id)
          .eq('type', 'form')
          .ilike('name', `%${artifact_id}%`);
        
        if (!fuzzyError && candidates && Array.isArray(candidates) && candidates.length > 0) {
          // Pick the first candidate (could be enhanced with better matching logic)
          existingArtifact = candidates[0] as Record<string, unknown>;
          resolvedArtifactId = (existingArtifact as { id: string }).id;
          console.log('✅ Found artifact by fuzzy name match:', { 
            resolvedId: resolvedArtifactId, 
            actualName: (existingArtifact as { name: string }).name 
          });
        }
      }
    }
    
    // If still not found, get the currently active artifact as fallback
    if (!existingArtifact) {
      console.log('🔍 Trying to get currently active form artifact...');
      const { data: currentArtifacts, error: currentError } = await supabase
        .from('artifacts')
        .select('id, name, type, artifact_role, schema, user_id, session_id')
        .eq('session_id', session_id)
        .eq('type', 'form')
        .order('updated_at', { ascending: false })
        .limit(1);
      
      if (!currentError && currentArtifacts && Array.isArray(currentArtifacts) && currentArtifacts.length > 0) {
        existingArtifact = currentArtifacts[0] as Record<string, unknown>;
        resolvedArtifactId = (existingArtifact as { id: string }).id;
        console.log('✅ Using most recently updated form artifact:', { 
          resolvedId: resolvedArtifactId, 
          actualName: (existingArtifact as { name: string }).name 
        });
      }
    }
    
    // Final check - if no artifact found, throw error
    if (!existingArtifact) {
      console.error('❌ No form artifact found for:', { artifact_id, session_id });
      throw new Error(`No form artifact found matching: ${artifact_id}`);
    }
    
    console.log('✅ Found existing form artifact:', {
      name: (existingArtifact as { name: string }).name,
      user_id: (existingArtifact as { user_id: string }).user_id,
      current_user: _userId,
      resolvedId: resolvedArtifactId
    });
    
    // Get current auth context for debugging
    const { data, error: authError } = await supabase.auth.getUser();
    const user = data?.user;
    console.log('🔐 Auth context:', { 
      authError, 
      user_id: user?.id,
      artifact_user_id: (existingArtifact as { user_id: string }).user_id,
      match: user?.id === (existingArtifact as { user_id: string }).user_id
    });
    
    // Update the default_values field with the new form data using the resolved artifact ID
    const { data: updatedData, error: updateError } = await supabase
      .from('artifacts')
      .update({
        default_values: form_data,
        updated_at: new Date().toISOString()
      })
      .eq('id', resolvedArtifactId)
      .select('id, name, default_values, updated_at')
      .single();
    
    if (updateError) {
      console.error('❌ Error updating form data:', updateError);
      console.error('❌ Update error details:', JSON.stringify(updateError, null, 2));
      throw updateError;
    }
    
    if (!updatedData) {
      console.error('❌ No data returned from update - possible RLS policy block');
      throw new Error('Update succeeded but no data returned - check RLS policies');
    }

    // CRITICAL: Verify the update actually worked by checking the returned data
    const returnedDefaultValues = (updatedData as unknown as { default_values: Record<string, unknown> }).default_values;
    if (!returnedDefaultValues || typeof returnedDefaultValues !== 'object') {
      console.error('❌ Update claimed success but default_values is null/invalid:', { returnedDefaultValues });
      throw new Error('Update failed: default_values was not properly updated');
    }

    // Verify at least some of the form_data was actually saved
    const expectedFormKeys = Object.keys(form_data);
    const savedDataKeys = Object.keys(returnedDefaultValues);
    const commonKeys = expectedFormKeys.filter(key => savedDataKeys.includes(key));
    
    if (commonKeys.length === 0 && expectedFormKeys.length > 0) {
      console.error('❌ Update claimed success but no form data was actually saved:', {
        expectedKeys: expectedFormKeys,
        actualKeys: savedDataKeys,
        form_data,
        returnedDefaultValues
      });
      throw new Error('Update failed: none of the provided form data was saved to the database');
    }

    console.log('✅ Update verification passed:', {
      expectedKeys: expectedFormKeys.length,
      savedKeys: savedDataKeys.length,
      commonKeys: commonKeys.length,
      sampleSavedData: commonKeys.slice(0, 3).reduce((obj, key) => ({ ...obj, [key]: returnedDefaultValues[key] }), {})
    });
    
    // FINAL VERIFICATION: Re-read the artifact to ensure data persistence
    console.log('🔍 Final verification: re-reading artifact to confirm persistence...');
    const { data: verificationData, error: verificationError } = await supabase
      .from('artifacts')
      .select('id, name, default_values, updated_at')
      .eq('id', resolvedArtifactId)
      .single();
    
    if (verificationError) {
      console.error('❌ Verification read failed:', verificationError);
      throw new Error(`Update appeared successful but verification read failed: ${JSON.stringify(verificationError)}`);
    }
    
    if (!verificationData) {
      console.error('❌ Verification read returned no data - artifact may have been deleted');
      throw new Error('Update appeared successful but artifact no longer exists');
    }
    
    const verifiedDefaultValues = (verificationData as unknown as { default_values: Record<string, unknown> }).default_values;
    if (!verifiedDefaultValues || typeof verifiedDefaultValues !== 'object') {
      console.error('❌ Verification failed: default_values is null/invalid after update');
      throw new Error('Update failed: default_values was not persisted to database');
    }
    
    // Compare the verification data with what we expected to save
    const finalFormKeys = Object.keys(form_data);
    const verifiedKeys = Object.keys(verifiedDefaultValues);
    const persistedKeys = finalFormKeys.filter(key => verifiedKeys.includes(key));
    
    if (persistedKeys.length === 0 && finalFormKeys.length > 0) {
      console.error('❌ Verification failed: no form data was actually persisted:', {
        expectedKeys: finalFormKeys,
        verifiedKeys: verifiedKeys,
        expectedData: form_data,
        verifiedData: verifiedDefaultValues
      });
      throw new Error('Update failed: form data was not persisted to database');
    }

    console.log('✅ Form data updated and verified successfully:', { 
      original_artifact_id: artifact_id,
      resolved_artifact_id: resolvedArtifactId,
      name: (existingArtifact as { name: string }).name,
      expected_keys: finalFormKeys.length,
      persisted_keys: persistedKeys.length,
      verification_timestamp: (verificationData as unknown as { updated_at: string }).updated_at
    });
    
    return {
      success: true,
      artifact_id: resolvedArtifactId,
      original_artifact_id: artifact_id,
      name: (existingArtifact as { name: string }).name,
      form_data,
      session_id,
      updated_at: (verificationData as unknown as { updated_at: string }).updated_at,
      verified: true,
      persisted_keys: persistedKeys.length,
      message: `Form data for "${(existingArtifact as { name: string }).name}" updated and verified successfully with ${persistedKeys.length} fields. ${artifact_id !== resolvedArtifactId ? `(Resolved "${artifact_id}" to UUID: ${resolvedArtifactId})` : ''}`
    };
  } catch (error) {
    console.error('❌ Error updating form data:', error);
    throw error;
  }
}

// Update form artifact with new data or schema
export async function updateFormArtifact(supabase: SupabaseClient, _sessionId: string, _userId: string, data: {
  artifact_id: string;
  updates: {
    title?: string;
    description?: string;
    form_schema?: Record<string, unknown>;
    ui_schema?: Record<string, unknown>;
    default_values?: Record<string, unknown>;
    submit_action?: Record<string, unknown>;
  };
}) {
  const { artifact_id, updates } = data;
  
  console.log('✏️ Updating form artifact:', { artifact_id, userId: _userId });
  
  if (!artifact_id) {
    throw new Error('Artifact ID is required for updating');
  }
  
  if (!updates || typeof updates !== 'object') {
    throw new Error('Updates object is required');
  }
  
  try {
    // Get the existing artifact to validate schema compatibility
    const { data: existingArtifact, error: checkError } = await supabase
      .from('artifacts')
      .select('*')
      .eq('id', artifact_id)
      .single();
    
    if (!existingArtifact || checkError) {
      throw new Error(`Artifact not found: ${artifact_id}`);
    }
    
    // Update the artifact in database
    const { data: updatedArtifact, error: updateError } = await supabase
      .from('artifacts')
      .update({
        name: updates.title || (existingArtifact as unknown as { name: string }).name,
        description: updates.description || (existingArtifact as unknown as { description: string }).description,
        schema: updates.form_schema || (existingArtifact as unknown as { schema: Record<string, unknown> }).schema,
        ui_schema: updates.ui_schema || (existingArtifact as unknown as { ui_schema: Record<string, unknown> }).ui_schema,
        default_values: updates.default_values || (existingArtifact as unknown as { default_values: Record<string, unknown> }).default_values,
        submit_action: updates.submit_action || (existingArtifact as unknown as { submit_action: Record<string, unknown> }).submit_action,
        updated_at: new Date().toISOString()
      })
      .eq('id', artifact_id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Failed to update artifact in database:', updateError);
      throw new Error(`Failed to update artifact: ${String(updateError)}`);
    }
    
    console.log('✅ Form artifact updated successfully:', { artifact_id });
    
    // Return the updated artifact content so frontend can refresh the form
    const artifactContent = {
      schema: (updatedArtifact as unknown as { schema: Record<string, unknown> }).schema,
      uiSchema: (updatedArtifact as unknown as { ui_schema: Record<string, unknown> }).ui_schema || {},
      formData: (updatedArtifact as unknown as { default_values: Record<string, unknown> }).default_values || {},
      submitAction: (updatedArtifact as unknown as { submit_action: Record<string, unknown> }).submit_action || { type: 'save_session' }
    };
    
    return {
      success: true,
      artifact_id,
      updated: true,
      updated_fields: Object.keys(updates),
      updated_at: new Date().toISOString(),
      title: (updatedArtifact as unknown as { name: string }).name,
      description: (updatedArtifact as unknown as { description: string }).description,
      type: 'form',
      content: JSON.stringify(artifactContent),
      message: `Artifact "${artifact_id}" updated successfully`
    };
  } catch (error) {
    console.error('❌ Error updating form artifact:', error);
    throw error;
  }
}

// =====================================
// BID SUBMISSION FUNCTIONS
// =====================================

export async function submitBid(supabase: SupabaseClient, sessionId: string, userId: string, data: {
  rfp_id: number;
  artifact_id?: string;
  supplier_id?: number;
  form_data?: Record<string, unknown>;
  supplier_name?: string;
  bid_price?: number;
  delivery_days?: number;
}) {
  console.log('🎯 Submitting bid:', data);

  try {
    // DIRECT DATABASE INSERT PATH (when no artifact_id provided)
    if (!data.artifact_id && (data.supplier_name || data.bid_price || data.delivery_days)) {
      console.log('💾 Direct bid submission without artifact (simplified path)');
      
      // Get agent_id and account_id from session
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('agent_id, account_id')
        .eq('id', sessionId)
        .single();
      
      const agentId = (sessionData && typeof sessionData === 'object' && 'agent_id' in sessionData) 
        ? (sessionData.agent_id as number) 
        : 1;
      
      const accountId = (sessionData && typeof sessionData === 'object' && 'account_id' in sessionData) 
        ? (sessionData.account_id as string)
        : null;

      // Get account_id using the new helper function
      let finalAccountId = accountId;
      if (!finalAccountId) {
        // Try getting from get_user_account_id() function
        const rpcClient = supabase as unknown as { 
          rpc: (name: string, params?: Record<string, unknown>) => Promise<{ data: string | null; error: unknown }> 
        };
        const { data: userAccountId, error: accountError } = await rpcClient.rpc('get_user_account_id');
        
        if (!accountError && userAccountId) {
          finalAccountId = userAccountId;
          console.log('👤 Using user account_id from get_user_account_id():', finalAccountId);
        } else if (!accountError) {
          // If get_user_account_id() returns null, try RFP account_id as fallback
          const { data: rfpData } = await supabase
            .from('rfps')
            .select('account_id')
            .eq('id', data.rfp_id)
            .single();
          
          if (rfpData && typeof rfpData === 'object' && 'account_id' in rfpData) {
            finalAccountId = rfpData.account_id as string;
            console.log('📋 Using RFP account_id:', finalAccountId);
          }
        } else {
          console.warn('⚠️ Error calling get_user_account_id():', accountError);
        }
      }

      // AUTO-CREATE OR FIND SUPPLIER PROFILE
      let supplierId = data.supplier_id;
      
      if (!supplierId && data.supplier_name) {
        console.log('🔍 Checking for existing supplier:', data.supplier_name);
        
        // Check if supplier already exists (use limit(1) to avoid single() error when no match)
        const { data: existingSuppliers, error: lookupError } = await supabase
          .from('supplier_profiles')
          .select('id')
          .eq('name', data.supplier_name)
          .limit(1);
        
        if (lookupError) {
          console.error('❌ Error looking up supplier:', lookupError);
          throw new Error(`Failed to lookup supplier: ${String(lookupError)}`);
        }
        
        const existingSupplierArray = existingSuppliers as unknown as Array<{ id: number }> | null;
        const existingSupplier = existingSupplierArray && existingSupplierArray.length > 0 ? existingSupplierArray[0] : null;
        
        if (existingSupplier && typeof existingSupplier === 'object' && 'id' in existingSupplier) {
          supplierId = existingSupplier.id as number;
          console.log('✅ Found existing supplier:', { supplierId });
        } else {
          // Create new supplier profile
          console.log('➕ Creating new supplier profile:', data.supplier_name);
          const { data: newSupplier, error: supplierError } = await supabase
            .from('supplier_profiles')
            .insert({
              name: data.supplier_name,
              description: `Auto-created supplier profile for ${data.supplier_name}`
            })
            .select('id')
            .single();
          
          if (supplierError) {
            console.error('❌ Error creating supplier profile:', supplierError);
            throw new Error(`Failed to create supplier profile: ${String(supplierError)}`);
          }
          
          if (!newSupplier || typeof newSupplier !== 'object' || !('id' in newSupplier)) {
            console.error('❌ Supplier creation returned no data');
            throw new Error('Supplier profile was not created (no ID returned)');
          }
          
          supplierId = newSupplier.id as number;
          console.log('✅ Created new supplier:', { supplierId, supplierData: newSupplier });
        }
      }
      
      // CRITICAL VALIDATION: Ensure we have a supplier_id before inserting bid
      if (!supplierId) {
        console.error('❌ No supplier_id available for bid submission', { 
          hasSupplierName: !!data.supplier_name,
          hasDirectSupplierId: !!data.supplier_id,
          finalSupplierId: supplierId
        });
        throw new Error('Cannot submit bid without a valid supplier. Please provide either supplier_name or supplier_id.');
      }

      // Build response JSONB with bid details
      const response: Record<string, unknown> = {
        supplier_name: data.supplier_name || 'Unknown Supplier',
        amount: data.bid_price || 0,
        delivery_timeline: data.delivery_days ? `${data.delivery_days} days` : 'Not specified',
        status: 'pending',
        submitted_via: 'direct_agent_submission',
        submitted_at: new Date().toISOString()
      };

      // Direct INSERT into bids table
      const { data: insertedBid, error: insertError } = await supabase
        .from('bids')
        .insert({
          rfp_id: data.rfp_id,
          agent_id: agentId,
          supplier_id: supplierId || null,
          account_id: finalAccountId,
          response: response,
          bid_amount: data.bid_price || null,
          status: 'submitted',
          submitted_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('❌ Error inserting bid directly:', insertError);
        throw new Error(`Failed to insert bid: ${String(insertError)}`);
      }

      const bidId = insertedBid && typeof insertedBid === 'object' && 'id' in insertedBid 
        ? (insertedBid.id as number) 
        : undefined;

      console.log('✅ Bid inserted directly:', { bidId });

      return {
        success: true,
        bid_id: bidId,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        message: `✅ **Bid Successfully Submitted!**

📋 **Submission Details:**
- **Bid ID**: ${bidId}
- **Status**: Submitted
- **Submitted At**: ${new Date().toLocaleString()}

💰 **Bid Information:**
- **Supplier**: ${data.supplier_name}
- **Amount**: $${Number(data.bid_price).toLocaleString()}
- **Delivery**: ${data.delivery_days} days

🎯 **Next Steps:**
- Bid is now visible in the Bids view
- RFP owner will be notified of the submission
- Bid status can be tracked through the system
- Evaluation and ranking will be conducted by the buyer`
      };
    }

    // ARTIFACT-BASED SUBMISSION PATH (original logic)
    if (!data.artifact_id) {
      throw new Error('Either artifact_id or direct bid data (supplier_name, bid_price, delivery_days) must be provided');
    }

    // If form data is provided, save it to artifact first
    if (data.form_data) {
      console.log('💾 Saving form data to artifact before submission');
      const { error: saveError } = await supabase
        .from('artifacts')
        .update({
          default_values: data.form_data,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.artifact_id);

      if (saveError) {
        console.error('⚠️ Error saving form data:', saveError);
        // Continue anyway, as the data might already be saved
      }
    }

    // Call the submit_bid database function
    // Note: Using type assertion for RPC call as SupabaseClient type doesn't include rpc method
    const rpcClient = supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: string; error: unknown }> };
    const rpcResult = await rpcClient.rpc('submit_bid', {
      rfp_id_param: data.rfp_id,
      artifact_id_param: data.artifact_id,
      supplier_id_param: data.supplier_id || null,
      agent_id_param: null,
      session_id_param: sessionId,
      user_id_param: userId
    });

    if (rpcResult.error) {
      console.error('❌ Error submitting bid:', rpcResult.error);
      throw new Error(`Failed to submit bid: ${String(rpcResult.error)}`);
    }

    if (!rpcResult.data) {
      throw new Error('No submission ID returned from database function');
    }

    const submissionId = rpcResult.data;
    console.log('✅ Bid submitted successfully:', { submissionId });

    // Get the created bid ID from the submission metadata
    const { data: submissionData } = await supabase
      .from('artifact_submissions')
      .select('metadata')
      .eq('id', submissionId)
      .single();

    let bidId: number | undefined;
    if (submissionData && typeof submissionData === 'object') {
      const record = submissionData as Record<string, unknown>;
      if (record.metadata && typeof record.metadata === 'object') {
        const metadata = record.metadata as Record<string, unknown>;
        if (typeof metadata.bid_id === 'number') {
          bidId = metadata.bid_id;
        }
      }
    }

    // Extract bid information for the summary
    const { data: artifactData } = await supabase
      .from('artifacts')
      .select('default_values')
      .eq('id', data.artifact_id)
      .single();

    let formData: Record<string, unknown> = {};
    if (artifactData && typeof artifactData === 'object') {
      const record = artifactData as Record<string, unknown>;
      if (record.default_values && typeof record.default_values === 'object') {
        formData = record.default_values as Record<string, unknown>;
      }
    }
    
    // Extract bid details
    const bidAmount = formData.bid_amount || formData.amount || formData.price || formData.cost;
    const deliveryDate = formData.delivery_date || formData.deliveryDate || formData.delivery;
    const companyName = formData.company_name || formData.companyName || formData.supplier_name;

    // Create or update a "Bids" artifact to trigger bid view refresh
    try {
      // Get RFP name for artifact
      const { data: rfpData } = await supabase
        .from('rfps')
        .select('name')
        .eq('id', data.rfp_id)
        .single();
      
      const rfpName = rfpData && typeof rfpData === 'object' && 'name' in rfpData 
        ? String(rfpData.name) 
        : 'RFP';

      // Check if a bid view artifact already exists for this session and RFP
      const { data: existingArtifacts } = await supabase
        .from('artifacts')
        .select('id')
        .eq('session_id', sessionId)
        .eq('type', 'bid_view')
        .eq('rfp_id', data.rfp_id)
        .limit(1);

      if (existingArtifacts && Array.isArray(existingArtifacts) && existingArtifacts.length > 0) {
        // Update existing artifact's updated_at to trigger refresh
        const firstArtifact = existingArtifacts[0] as Record<string, unknown>;
        const artifactId = firstArtifact.id;
        await supabase
          .from('artifacts')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', artifactId);
        
        console.log('✅ Updated existing bid view artifact:', artifactId);
      } else {
        // Create new bid view artifact
        const { error: artifactError } = await supabase
          .from('artifacts')
          .insert({
            name: `Bids for ${rfpName}`,
            type: 'bid_view',
            content: rfpName,
            session_id: sessionId,
            user_id: userId,
            rfp_id: data.rfp_id,
            size: '0 KB',
            mime_type: 'application/x-bid-view'
          });

        if (!artifactError) {
          console.log('✅ Created new bid view artifact for RFP:', data.rfp_id);
        }
      }
    } catch (artifactError) {
      console.warn('⚠️ Failed to create/update bid view artifact:', artifactError);
      // Don't fail the bid submission if artifact creation fails
    }

    return {
      success: true,
      submission_id: submissionId,
      bid_id: bidId,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      message: `✅ **Bid Successfully Submitted!**

📋 **Submission Details:**
- **Bid ID**: ${bidId || 'Pending'}
- **Submission ID**: ${submissionId}
- **Status**: Submitted
- **Submitted At**: ${new Date().toLocaleString()}

💰 **Bid Information:**${bidAmount ? `
- **Amount**: $${Number(bidAmount).toLocaleString()}` : ''}${deliveryDate ? `
- **Delivery Date**: ${deliveryDate}` : ''}${companyName ? `
- **Company**: ${companyName}` : ''}

🎯 **Next Steps:**
- Bid is now visible in the Bids view
- RFP owner will be notified of the submission
- Bid status can be tracked through the system
- Evaluation and ranking will be conducted by the buyer`
    };

  } catch (error) {
    console.error('❌ Error in submitBid:', error);
    return {
      success: false,
      error: String(error),
      message: `❌ **Bid Submission Failed**: ${String(error)}`
    };
  }
}

export async function getRfpBids(supabase: SupabaseClient, data: {
  rfp_id: number;
}) {
  console.log('📋 Getting RFP bids:', data);

  try {
    // Debug: Log which database we're querying
    // @ts-expect-error - accessing private property for debugging
    const clientUrl = String(supabase['supabaseUrl'] || 'unknown');
    console.log('🔍 Supabase client connected to:', clientUrl);
    
    // 🚨 TEMPORARY TEST: Import service role client to test RLS hypothesis
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2.45.0');
    const testClient = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    );
    
    const { data: serviceRoleTest, error: serviceError } = await testClient
      .from('bids')
      .select('count');
    console.log('🧪 SERVICE ROLE TEST:', { count: serviceRoleTest, error: serviceError });
    
    // Direct table query instead of RPC to bypass PostgREST REST API issue
    console.log('🔍 Executing query: bids table, rfp_id =', data.rfp_id);
    
    // First, test if we can query the table at all
    const { data: testBids, error: testError } = await supabase
      .from('bids')
      .select('count');
    
    console.log('🔍 Test query (count all bids WITH RLS CLIENT):', { count: testBids, testError });
    
    const { data: bids, error } = await supabase
      .from('bids')
      .select('*')
      .eq('rfp_id', data.rfp_id)
      .order('created_at', { ascending: false });

    console.log('🔍 Query result:', { bids, error, hasData: !!bids, bidCount: Array.isArray(bids) ? bids.length : 0 });

    if (error) {
      console.error('❌ Error getting RFP bids:', error);
      throw new Error(`Failed to get RFP bids: ${String(error)}`);
    }

    const bidsArray = Array.isArray(bids) ? bids : [];
    console.log('✅ Retrieved RFP bids:', { count: bidsArray.length, firstBid: bidsArray[0] });

    return {
      success: true,
      bids: bidsArray,
      count: bidsArray.length,
      message: `Found ${bidsArray.length} bids for RFP ${data.rfp_id}`,
      _debug: {
        serviceRoleCount: Array.isArray(serviceRoleTest) && serviceRoleTest.length > 0 ? serviceRoleTest[0].count : 0,
        rlsClientCount: Array.isArray(testBids) && testBids.length > 0 ? testBids[0].count : 0,
        clientUrl: clientUrl,
        queryRfpId: data.rfp_id
      }
    };

  } catch (error) {
    console.error('❌ Error in getRfpBids:', error);
    return {
      success: false,
      error: String(error),
      bids: [],
      count: 0,
      message: `Failed to get bids: ${String(error)}`
    };
  }
}

export async function updateBidStatus(supabase: SupabaseClient, data: {
  bid_id: number;
  status: string;
  status_reason?: string;
  reviewer_id?: string;
  score?: number;
}) {
  console.log('🔄 Updating bid status:', data);

  try {
    const rpcClient = supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }> };
    const { error } = await rpcClient.rpc('update_bid_status', {
      bid_id_param: data.bid_id,
      new_status: data.status,
      status_reason_param: data.status_reason || null,
      reviewer_id_param: data.reviewer_id || null,
      score_param: data.score || null
    });

    if (error) {
      console.error('❌ Error updating bid status:', error);
      throw new Error(`Failed to update bid status: ${String(error)}`);
    }

    console.log('✅ Bid status updated successfully');

    return {
      success: true,
      bid_id: data.bid_id,
      new_status: data.status,
      updated_at: new Date().toISOString(),
      message: `Bid ${data.bid_id} status updated to "${data.status}"${data.status_reason ? ` (${data.status_reason})` : ''}`
    };

  } catch (error) {
    console.error('❌ Error in updateBidStatus:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to update bid status: ${String(error)}`
    };
  }
}

/**
 * Generate placeholder embedding vector
 * Returns array of 1024 zeros for vector(1024) column (Voyage AI dimension)
 * TODO: Replace with real embedding generation via generate-embedding function
 */
function generatePlaceholderEmbedding(): number[] {
  return new Array(1024).fill(0);
}

/**
 * Create a new memory entry for an agent
 * Stores important information about user preferences, decisions, facts, and context
 */
export async function createMemory(
  supabase: SupabaseClient,
  params: {
    content: string;
    memory_type: 'preference' | 'fact' | 'decision' | 'context' | 'conversation';
    importance_score: number;
    reference_type?: 'rfp' | 'bid' | 'artifact' | 'message' | 'user_profile';
    reference_id?: string;
  },
  userId: string,
  agentId: string,
  sessionId: string
): Promise<{ success: boolean; memory_id?: string; message: string; error?: string }> {
  console.log('🧠 Creating memory:', { ...params, userId, agentId, sessionId });

  try {
    // Validate importance score
    if (params.importance_score < 0 || params.importance_score > 1) {
      throw new Error('importance_score must be between 0.0 and 1.0');
    }

    // Get the user's account_id from account_users
    // userId is auth.users.id - account_memories.user_id now directly references auth.users
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)  // Use auth user ID directly
      .single();

    if (accountError || !accountUser) {
      console.error('❌ Error finding account for user:', accountError);
      throw new Error(`Account not found for user_id: ${userId}`);
    }

    // @ts-expect-error - We know accountUser has an account_id property
    const accountId = accountUser.account_id;
    console.log('✅ Found account_id:', accountId, 'for auth user:', userId);

    // Generate placeholder embedding (will be replaced with real embeddings later)
    const embedding = generatePlaceholderEmbedding();

    // Insert memory record using account-based schema
    const { data: memory, error: memoryError } = await supabase
      .from('account_memories')
      .insert({
        account_id: accountId,     // Account-based: shared across account users
        user_id: userId,           // Now directly uses auth.users.id (FK updated)
        session_id: sessionId,
        content: params.content,
        memory_type: params.memory_type,
        importance_score: params.importance_score,
        embedding: embedding,
        metadata: {}
      })
      .select('id')
      .single();

    if (memoryError) {
      console.error('❌ Error creating memory:', memoryError);
      throw new Error(`Failed to create memory: ${String(memoryError)}`);
    }

    const memoryId = (memory as { id: string }).id;
    console.log('✅ Memory created:', memoryId);

    // Create memory reference if reference_id provided
    if (params.reference_id && params.reference_type) {
      console.log('🔗 Creating memory reference:', { reference_type: params.reference_type, reference_id: params.reference_id });
      
      const { error: refError } = await supabase
        .from('memory_references')
        .insert({
          memory_id: memoryId,
          reference_type: params.reference_type,
          reference_id: params.reference_id
        });

      if (refError) {
        console.warn('⚠️ Warning: Failed to create memory reference:', refError);
        // Don't fail the entire operation if reference creation fails
      } else {
        console.log('✅ Memory reference created');
      }
    }

    return {
      success: true,
      memory_id: memoryId,
      message: `Memory stored successfully: "${params.content.substring(0, 50)}${params.content.length > 50 ? '...' : ''}"`
    };

  } catch (error) {
    console.error('❌ Error in createMemory:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to create memory: ${String(error)}`
    };
  }
}

/**
 * Search for relevant memories from past conversations
 * Uses semantic search with vector similarity (currently using placeholder embeddings)
 */
export async function searchMemories(
  supabase: SupabaseClient,
  params: {
    query: string;
    memory_types?: string; // Comma-separated: "preference,fact"
    limit?: number;
  },
  userId: string,
  agentId: string
): Promise<{ success: boolean; memories?: Array<{ id: string; content: string; memory_type: string; importance_score: number; created_at: string; similarity: number }>; message: string; error?: string }> {
  console.log('🔍 Searching memories:', { ...params, userId, agentId });

  try {
    // Get the user's account_id from account_users
    // userId is auth.users.id - account_memories.user_id now directly references auth.users
    const { data: accountUser, error: accountError } = await supabase
      .from('account_users')
      .select('account_id')
      .eq('user_id', userId)  // Use auth user ID directly
      .single();

    if (accountError || !accountUser) {
      console.error('❌ Error finding account for user:', accountError);
      throw new Error(`Account not found for user_id: ${userId}`);
    }

    // @ts-expect-error - We know accountUser has an account_id property
    const accountId = accountUser.account_id;
    console.log('✅ Searching memories for account_id:', accountId, 'auth user:', userId);

    // Parse memory types from comma-separated string
    const memoryTypes = params.memory_types 
      ? params.memory_types.split(',').map(t => t.trim())
      : undefined;

    const limit = params.limit || 10;

    // Generate placeholder embedding for query (will be replaced with real embeddings later)
    const queryEmbedding = generatePlaceholderEmbedding();

    // Call database search function with account-based parameters
    const rpcClient = supabase as unknown as { 
      rpc: (name: string, params: Record<string, unknown>) => Promise<{ 
        data: Array<{
          id: string;
          content: string;
          memory_type: string;
          importance_score: number;
          created_at: string;
          similarity: number;
        }> | null;
        error: unknown;
      }> 
    };

    const { data: memories, error } = await rpcClient.rpc('search_account_memories', {
      p_account_id: accountId,
      p_user_id: userId,  // Now directly uses auth.users.id
      p_query_embedding: queryEmbedding,
      p_memory_types: memoryTypes || null,
      p_limit: limit,
      p_similarity_threshold: 0.5 // Lower threshold since using placeholder embeddings
    });

    if (error) {
      console.error('❌ Error searching memories:', error);
      throw new Error(`Failed to search memories: ${String(error)}`);
    }

    const memoryList = memories || [];
    console.log(`✅ Found ${memoryList.length} memories`);

    return {
      success: true,
      memories: memoryList,
      message: `Found ${memoryList.length} relevant memories`
    };

  } catch (error) {
    console.error('❌ Error in searchMemories:', error);
    return {
      success: false,
      error: String(error),
      message: `Failed to search memories: ${String(error)}`
    };
  }
}