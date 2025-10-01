// Copyright Mark Skiba, 2025 All rights reserved
// Core tools and database operations for Claude API v3

import { config } from '../config.ts';
import { mapArtifactRole } from '../utils/mapping.ts';

// Create a form artifact in the database
export async function createFormArtifact(supabase: any, sessionId: string, userId: string, data: any) {
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
    artifact_id: artifact.id,
    message: `Created ${mappedRole} artifact: ${name}`
  };
}

// Get conversation history for a session
export async function getConversationHistory(supabase: any, sessionId: string, limit = 50) {
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
export async function storeMessage(supabase: any, data: any) {
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
    message_id: message.id,
    message: 'Message stored successfully'
  };
}

// Create a new conversation session
export async function createSession(supabase: any, data: any) {
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
        session_id: session.id,
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
    session_id: session.id,
    message: 'Session created successfully'
  };
}

// Search messages across conversations
export async function searchMessages(supabase: any, data: any) {
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
export async function getAvailableAgents(supabase: any, data: any) {
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
  const formattedAgentList = (agents || []).map(agent => 
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
export async function getCurrentAgent(supabase: any, data: any) {
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
      id: sessionAgent.agents.id,
      name: sessionAgent.agents.name,
      description: sessionAgent.agents.description,
      role: sessionAgent.agents.role,
      initial_prompt: sessionAgent.agents.initial_prompt
    }
  };
}

// Debug agent switch parameters
export async function debugAgentSwitch(supabase: any, userId: string, data: any) {
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
export async function switchAgent(supabase: any, userId: string, data: any, userMessage?: string) {
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
  const { data: sessionAgent, error: insertError } = await supabase
    .from('session_agents')
    .insert({
      session_id,
      agent_id: agent.id,
      is_active: true
    })
    .select()
    .single();

  if (insertError) {
    console.error('❌ Failed to switch agent:', insertError);
    throw new Error(`Failed to switch agent: ${insertError.message}`);
  }

  console.log('✅ Agent switch completed successfully');

  return {
    success: true,
    session_id,
    previous_agent_id: null, // Could track this if needed
    new_agent: {
      id: agent.id,
      name: agent.name,
      role: agent.role,
      instructions: agent.instructions,
      initial_prompt: agent.initial_prompt
    },
    switch_reason: reason,
    message: `Successfully switched to ${agent.name} agent. The ${agent.name} will respond in the next message.`,
    stop_processing: true // Signal to stop generating additional content
  };
}

// Recommend agent for a topic
export async function recommendAgent(supabase: any, data: any) {
  const { topic, conversation_context } = data;
  
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
      recommendedAgent = agents?.find(agent => matching.agentNames.includes(agent.name));
      if (recommendedAgent) break;
    }
  }

  // Default to RFP Assistant if no specific match
  if (!recommendedAgent && agents && agents.length > 0) {
    recommendedAgent = agents.find(agent => agent.name === 'RFP Assistant') || agents[0];
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