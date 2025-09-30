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
    .from('conversation_sessions')
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
      conversation_sessions!inner (
        id,
        title,
        user_id
      ),
      agents (
        name
      )
    `)
    .eq('conversation_sessions.user_id', userId)
    .textSearch('content', query)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error searching messages:', error);
    throw error;
  }

  return { messages: messages || [] };
}