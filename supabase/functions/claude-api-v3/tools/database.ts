// Copyright Mark Skiba, 2025 All rights reserved
// Core tools and database operations for Claude API v3

import { config } from '../config.ts';
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
  content: string;
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
  agent_id: string;
  agent_name?: string;
  user_input?: string;
  extracted_keywords?: string[];
  confusion_reason?: string;
  reason?: string;
}

// Create a form artifact in the database
export async function createFormArtifact(supabase: SupabaseClient, sessionId: string, userId: string, data: FormArtifactData) {
  const { name, description, content, artifactRole } = data;
  
  // Map artifact role to valid database value
  const mappedRole = mapArtifactRole(artifactRole);
  if (!mappedRole) {
    throw new Error(`Invalid artifact role: ${artifactRole}`);
  }
  
  // Generate a unique ID for the artifact (artifacts table uses text ID)
  const artifactId = crypto.randomUUID();
  
  console.log('Creating form artifact:', { artifactId, name, description, artifactRole, mappedRole, sessionId, userId });
  
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .insert({
      id: artifactId, // Provide the required ID field
      session_id: sessionId,
      user_id: userId,
      name: name,
      description: description,
      artifact_role: mappedRole,
      schema: content, // Store the form schema in the schema field
      type: 'form', // Set the type as 'form'
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
    throw error;
  }

  return { messages: messages || [] };
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
      suggestion: 'Common patterns: "rfp designer" → "RFP Designer", "solutions" → "Solutions", "support" → "Support"'
    }
  };
}

// Switch to a different agent
export async function switchAgent(supabase: SupabaseClient, userId: string, data: SwitchAgentData, userMessage?: string) {
  const { session_id, agent_id, agent_name, reason } = data;
  let targetAgent = agent_name || agent_id; // Support both parameter names
  
  // If no targetAgent and we have user message, try to extract from user input
  if (!targetAgent && userMessage) {
    console.log('🔍 Attempting to extract agent from user message:', userMessage);
    const message = userMessage.toLowerCase();
    
    if (message.includes('rfp') && (message.includes('designer') || message.includes('design'))) {
      targetAgent = 'RFP Designer';
      console.log('✅ Extracted agent from user message:', targetAgent);
    } else if (message.includes('solution') || message.includes('sales')) {
      targetAgent = 'Solutions';
      console.log('✅ Extracted agent from user message:', targetAgent);
    } else if (message.includes('support') || message.includes('help')) {
      targetAgent = 'Support';
      console.log('✅ Extracted agent from user message:', targetAgent);
    } else if (message.includes('technical')) {
      targetAgent = 'Technical Support';
      console.log('✅ Extracted agent from user message:', targetAgent);
    } else if (message.includes('assistant')) {
      targetAgent = 'RFP Assistant';
      console.log('✅ Extracted agent from user message:', targetAgent);
    }
  }
  
  console.log('🔄 AGENT SWITCH ATTEMPT:', {
    session_id,
    agent_id,
    agent_name,
    targetAgent,
    reason,
    userId,
    userMessage: userMessage ? userMessage.substring(0, 50) + '...' : 'not provided',
    timestamp: new Date().toISOString()
  });

  // Validate required parameters
  if (!targetAgent) {
    console.error('❌ Agent switch failed: agent_name/agent_id is required but was undefined or empty');
    throw new Error('Agent switch failed: agent_name is required. Please specify which agent to switch to (e.g., "RFP Designer", "Solutions", "Support")');
  }

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
    // Look up by name (case insensitive)
    const result = await supabase
      .from('agents')
      .select('id, name, role, instructions, initial_prompt, is_active, is_free, is_restricted')
      .ilike('name', targetAgent)
      .eq('is_active', true)
      .single();
    agent = result.data;
    agentError = result.error;
  }

  if (agentError || !agent) {
    console.error('❌ Agent not found:', agentError);
    throw new Error(`Agent not found with identifier: ${targetAgent}`);
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
    message: `Successfully switched to ${(agent as unknown as Agent).name} agent. The ${(agent as unknown as Agent).name} will respond in the next message.`,
    stop_processing: true // Signal to stop generating additional content
  };
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