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
          const fieldId = field.id as string;
          if (!fieldId || typeof fieldId !== 'string') {
            console.warn('Skipping field with invalid or missing id:', field);
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

// Create a form artifact in the database
export async function createFormArtifact(supabase: SupabaseClient, sessionId: string, userId: string, data: FormArtifactData) {
  const { name, description, content, artifactRole } = data;
  
  // Default to buyer_questionnaire if artifactRole is not provided
  const effectiveArtifactRole = artifactRole || 'buyer_questionnaire';
  
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(effectiveArtifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${effectiveArtifactRole}`);
  }
  
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = crypto.randomUUID();
  
  console.log('Creating form artifact:', { artifactId, name, description, artifactRole: effectiveArtifactRole, mappedRole, sessionId, userId });
  
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

  return {
    success: true,
    artifact_id: (artifact as unknown as { id: string }).id,
    artifact_name: name, // Include the name in the response
    message: `Created ${mappedRole} artifact: ${name}`
  };
}

// Get conversation history for a session
export async function getConversationHistory(supabase: SupabaseClient, sessionId: string, limit = 50) {
  const { data: messages, error } = await supabase
    .from('conversation_messages')
    .select(`
      id,
      session_id,
      agent_id,
      user_id,
      sender,
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
  const { sessionId, agentId, userId, sender, content } = data;
  
  console.log('Storing message:', { sessionId, agentId, userId, sender, contentLength: content?.length });
  
  const { data: message, error } = await supabase
    .from('conversation_messages')
    .insert({
      session_id: sessionId,
      agent_id: agentId,
      user_id: userId,
      sender: sender,
      content: content,
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
  
  console.log('Creating session:', { userId, title, agentId });
  
  const { data: session, error } = await supabase
    .from('sessions')
    .insert({
      user_id: userId,
      title: title || 'New Conversation',
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating session:', error);
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

  return {
    success: true,
    session_id: (session as unknown as { id: string }).id,
    message: 'Session created successfully'
  };
}

// Search messages across conversations
export async function searchMessages(supabase: SupabaseClient, data: SearchData) {
  const { userId, query, limit = 20 } = data;
  
  console.log('Searching messages:', { userId, query, limit });
  
  const { data: messages, error } = await supabase
    .from('conversation_messages')
    .select(`
      id,
      session_id,
      agent_id,
      content,
      sender,
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
    const agentIsFree = agentObj.is_free;
    
    console.log('🔐 Anonymous user agent access validation:', {
      agentName: agentObj.name,
      is_restricted: agentIsRestricted,
      is_free: agentIsFree,
      canAccess: !agentIsRestricted || agentIsFree
    });
    
    // Anonymous users can only access agents that are:
    // 1. NOT restricted (is_restricted = false), OR
    // 2. Free agents (is_free = true, even if restricted)
    if (agentIsRestricted && !agentIsFree) {
      console.log('🚫 ACCESS DENIED: Anonymous user trying to access restricted agent:', agentObj.name);
      throw new Error(`Access denied: The ${agentObj.name} agent requires an account to use. Please sign up or log in to access specialized agents and advanced features. Anonymous users can use the Solutions agent and other free agents.`);
    }
    
    console.log('✅ Access granted: Anonymous user can access agent:', agentObj.name);
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
  const { data: _sessionAgent, error: insertError } = await supabase
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
    throw new Error(`Failed to fetch conversation history: ${error.message}`);
  }

  console.log(`📚 Retrieved ${messages?.length || 0} messages from conversation history`);
  
  return (messages || []).map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant' | 'system',
    message: msg.message,
    created_at: msg.created_at,
    agent_id: msg.agent_id,
    is_system_message: msg.is_system_message,
    metadata: msg.metadata,
    agent_name: (msg.agents as any)?.name,
    agent_role: (msg.agents as any)?.role
  })) as ConversationMessage[];
}

// Recommend agent for a topic
export async function recommendAgent(supabase: SupabaseClient, data: { topic: string; conversation_context?: string }) {
  const { topic, conversation_context: _conversation_context } = data;
  
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