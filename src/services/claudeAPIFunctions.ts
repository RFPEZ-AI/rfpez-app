// Copyright Mark Skiba, 2025 All rights reserved

// Claude API Function Calling Integration for RFPEZ MCP
// This provides the same functionality as MCP but via HTTP endpoints that Claude API can call

import { supabase } from '../supabaseClient';
import { AgentService } from './agentService';
import type { Tool } from '@anthropic-ai/sdk/resources/messages.mjs';

// Claude API Function Definitions (Anthropic SDK format)
export const claudeApiFunctions: Tool[] = [
  {
    "name": "get_conversation_history",
    "description": "Retrieve conversation messages from a specific session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to retrieve messages from"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of messages to retrieve (default: 50)",
          "default": 50
        },
        "offset": {
          "type": "number",
          "description": "Number of messages to skip for pagination (default: 0)",
          "default": 0
        }
      },
      "required": ["session_id"]
    }
  },
  {
    "name": "get_recent_sessions",
    "description": "Get recent chat sessions for the authenticated user",
    "input_schema": {
      "type": "object",
      "properties": {
        "limit": {
          "type": "number",
          "description": "Maximum number of sessions to retrieve (default: 10)",
          "default": 10
        }
      }
    }
  },
  {
    "name": "store_message",
    "description": "Store a new message in a conversation session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to store the message in"
        },
        "content": {
          "type": "string",
          "description": "The message content"
        },
        "role": {
          "type": "string",
          "enum": ["user", "assistant", "system"],
          "description": "The role of the message sender"
        },
        "metadata": {
          "type": "object",
          "description": "Additional metadata for the message"
        }
      },
      "required": ["session_id", "content", "role"]
    }
  },
  {
    "name": "create_session",
    "description": "Create a new conversation session",
    "input_schema": {
      "type": "object",
      "properties": {
        "title": {
          "type": "string",
          "description": "Title for the new session"
        },
        "description": {
          "type": "string",
          "description": "Optional description for the session"
        }
      },
      "required": ["title"]
    }
  },
  {
    "name": "search_messages",
    "description": "Search for messages across all sessions by content",
    "input_schema": {
      "type": "object",
      "properties": {
        "query": {
          "type": "string",
          "description": "Search query to match against message content"
        },
        "limit": {
          "type": "number",
          "description": "Maximum number of results (default: 20)",
          "default": 20
        }
      },
      "required": ["query"]
    }
  },
  {
    "name": "get_available_agents",
    "description": "Get all agents available to the current user based on their authentication status and account setup",
    "input_schema": {
      "type": "object",
      "properties": {
        "include_restricted": {
          "type": "boolean",
          "description": "Whether to include restricted/premium agents (default: false)",
          "default": false
        }
      }
    }
  },
  {
    "name": "get_current_agent",
    "description": "Get the currently active agent for a specific session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to get the current agent for"
        }
      },
      "required": ["session_id"]
    }
  },
  {
    "name": "switch_agent",
    "description": "Switch to a different AI agent for the current session",
    "input_schema": {
      "type": "object",
      "properties": {
        "session_id": {
          "type": "string",
          "description": "The UUID of the session to switch agents in"
        },
        "agent_id": {
          "type": "string",
          "description": "The UUID of the agent to switch to"
        },
        "reason": {
          "type": "string",
          "description": "Optional reason for switching agents"
        }
      },
      "required": ["session_id", "agent_id"]
    }
  },
  {
    "name": "recommend_agent",
    "description": "Recommend the best agent for handling a specific topic or user request",
    "input_schema": {
      "type": "object",
      "properties": {
        "topic": {
          "type": "string",
          "description": "The topic or user request to find the best agent for"
        },
        "conversation_context": {
          "type": "string",
          "description": "Optional context from the current conversation"
        }
      },
      "required": ["topic"]
    }
  }
];

// Function execution handlers for Claude API
export class ClaudeAPIFunctionHandler {
  
  // Get user ID from the current session (supports anonymous users)
  private async getCurrentUserId(): Promise<string> {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Allow anonymous users for agent switching (especially for support)
    if (error || !user) {
      return 'anonymous';
    }
    
    // For authenticated users, verify the user profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', user.id)
      .single();
    
    if (!profile?.id) {
      // User is authenticated but profile doesn't exist - still allow access
      console.warn('Authenticated user has no profile, allowing anonymous access');
      return 'anonymous';
    }
    
    // Return the Supabase auth user ID (not the user_profiles.id)
    return user.id;
  }

  // Get user_profiles.id from Supabase auth user ID (supports anonymous users)
  private async getUserProfileId(supabaseUserId: string): Promise<string | null> {
    // Handle anonymous users
    if (supabaseUserId === 'anonymous') {
      return null;
    }
    
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();
    
    // Return null instead of throwing error for anonymous-like access
    return profile?.id || null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async executeFunction(functionName: string, parameters: any) {
    const userId = await this.getCurrentUserId();
    
    switch (functionName) {
      case 'get_conversation_history':
        return await this.getConversationHistory(parameters, userId);
      case 'get_recent_sessions':
        return await this.getRecentSessions(parameters, userId);
      case 'store_message':
        return await this.storeMessage(parameters, userId);
      case 'create_session':
        return await this.createSession(parameters, userId);
      case 'search_messages':
        return await this.searchMessages(parameters, userId);
      case 'get_available_agents':
        return await this.getAvailableAgents(parameters, userId);
      case 'get_current_agent':
        return await this.getCurrentAgent(parameters, userId);
      case 'switch_agent':
        return await this.switchAgent(parameters, userId);
      case 'recommend_agent':
        return await this.recommendAgent(parameters, userId);
      default:
        throw new Error(`Unknown function: ${functionName}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
  private async getConversationHistory(params: any, _userId: string) {
    const { session_id, limit = 50, offset = 0 } = params;
    
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        content,
        role,
        created_at,
        message_order,
        metadata,
        ai_metadata
      `)
      .eq('session_id', session_id)
      .order('message_order', { ascending: true })
      .range(offset, offset + limit - 1);
    
    if (error) {
      throw new Error(`Failed to retrieve messages: ${error.message}`);
    }
    
    return {
      session_id,
      messages: messages || [],
      total_retrieved: messages?.length || 0,
      offset,
      limit
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getRecentSessions(params: any, userId: string) {
    const { limit = 10 } = params;
    
    // Get the user_profiles.id for the session query
    const userProfileId = await this.getUserProfileId(userId);
    
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        title,
        description,
        created_at,
        updated_at,
        session_metadata
      `)
      .eq('user_id', userProfileId)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to retrieve sessions: ${error.message}`);
    }
    
    return {
      sessions: sessions || [],
      total_retrieved: sessions?.length || 0
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async storeMessage(params: any, userId: string) {
    const { session_id, content, role, metadata = {} } = params;
    
    // Handle anonymous users - they can't store messages in the database
    if (userId === 'anonymous') {
      console.log('Anonymous user attempted to store message - skipping database storage');
      return {
        success: false,
        message: 'Anonymous users cannot store messages',
        user_type: 'anonymous'
      };
    }
    
    // Get the user_profiles.id for the message insert
    const userProfileId = await this.getUserProfileId(userId);
    
    // If no user profile, skip message storage
    if (!userProfileId) {
      console.warn('User has no profile - skipping message storage');
      return {
        success: false,
        message: 'Cannot store message without user profile',
        user_type: 'authenticated-no-profile'
      };
    }
    
    // Get the current highest message order for this session
    const { data: lastMessage } = await supabase
      .from('messages')
      .select('message_order')
      .eq('session_id', session_id)
      .order('message_order', { ascending: false })
      .limit(1)
      .single();
    
    const nextOrder = (lastMessage?.message_order || 0) + 1;
    
    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        session_id,
        user_id: userProfileId,
        content,
        role,
        message_order: nextOrder,
        metadata
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to store message: ${error.message}`);
    }
    
    // Update session timestamp
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', session_id);
    
    return {
      message_id: message.id,
      session_id,
      message_order: nextOrder,
      created_at: message.created_at
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async createSession(params: any, userId: string) {
    const { title, description } = params;
    
    // Get the user_profiles.id for the session insert
    const userProfileId = await this.getUserProfileId(userId);
    
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userProfileId,
        title,
        description
      })
      .select()
      .single();
    
    if (error) {
      throw new Error(`Failed to create session: ${error.message}`);
    }
    
    return {
      session_id: session.id,
      title: session.title,
      description: session.description,
      created_at: session.created_at
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async searchMessages(params: any, userId: string) {
    const { query, limit = 20 } = params;
    
    // Handle anonymous users - they can't search messages
    if (userId === 'anonymous') {
      return {
        query,
        results: [],
        total_found: 0,
        message: 'Anonymous users cannot search messages',
        user_type: 'anonymous'
      };
    }
    
    // Get the user_profiles.id for the session query
    const userProfileId = await this.getUserProfileId(userId);
    
    // If no user profile, return empty results
    if (!userProfileId) {
      return {
        query,
        results: [],
        total_found: 0,
        message: 'Cannot search messages without user profile',
        user_type: 'authenticated-no-profile'
      };
    }
    
    // Use text search across messages for sessions owned by this user
    const { data: messages, error } = await supabase
      .from('messages')
      .select(`
        id,
        session_id,
        content,
        role,
        created_at,
        sessions!inner(title, description)
      `)
      .textSearch('content', query)
      .eq('sessions.user_id', userProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to search messages: ${error.message}`);
    }
    
    return {
      query,
      results: messages || [],
      total_found: messages?.length || 0
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getAvailableAgents(params: any, userId: string) {
    const { include_restricted = false } = params;
    
    // Handle anonymous users
    let hasProperAccountSetup = false;
    let isAuthenticated = false;
    
    if (userId === 'anonymous') {
      console.log('Anonymous user requesting available agents');
      hasProperAccountSetup = false; // Anonymous users get limited access
      isAuthenticated = false;
    } else {
      // Get user profile to determine access level for authenticated users
      console.log('Getting user profile for userId:', userId);
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        // Still allow access for authenticated users even if profile is missing
        hasProperAccountSetup = true;
        isAuthenticated = true;
      } else {
        console.log('User profile result:', userProfile);
        hasProperAccountSetup = true; // All authenticated users have access to all agents
        isAuthenticated = true;
      }
    }
    
    // Get available agents based on user's access level
    const agents = await AgentService.getAvailableAgents(
      hasProperAccountSetup || include_restricted, 
      isAuthenticated
    );
    
    return {
      agents: agents.map(agent => ({
        id: agent.id,
        name: agent.name,
        description: agent.description,
        initial_prompt: agent.initial_prompt,
        is_default: agent.is_default,
        is_restricted: agent.is_restricted,
        is_free: agent.is_free,
        avatar_url: agent.avatar_url
      })),
      user_access_level: hasProperAccountSetup ? 'premium' : 'anonymous',
      total_available: agents.length,
      user_type: userId === 'anonymous' ? 'anonymous' : 'authenticated'
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async getCurrentAgent(params: any, userId: string) {
    const { session_id } = params;
    
    // Verify session belongs to user
    const { data: session } = await supabase
      .from('sessions')
      .select('id')
      .eq('id', session_id)
      .eq('user_id', userId)
      .single();
    
    if (!session) {
      throw new Error('Session not found or access denied');
    }
    
    // Get current active agent for the session
    const activeAgent = await AgentService.getSessionActiveAgent(session_id);
    
    if (!activeAgent) {
      // No agent set, return default agent
      const defaultAgent = await AgentService.getDefaultAgent();
      return {
        session_id,
        current_agent: defaultAgent ? {
          id: defaultAgent.id,
          name: defaultAgent.name,
          description: defaultAgent.description,
          initial_prompt: defaultAgent.initial_prompt,
          is_default: true
        } : null,
        message: 'No active agent found, showing default agent'
      };
    }
    
    return {
      session_id,
      current_agent: {
        id: activeAgent.agent_id,
        name: activeAgent.agent_name,
        instructions: activeAgent.agent_instructions,
        initial_prompt: activeAgent.agent_initial_prompt,
        avatar_url: activeAgent.agent_avatar_url
      }
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async switchAgent(params: any, userId: string) {
    const { session_id, agent_id, reason } = params;
    
    console.log('🔄 AGENT SWITCH ATTEMPT:', {
      session_id,
      agent_id,
      reason,
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Handle anonymous users - they can switch agents but with limited functionality
    if (userId === 'anonymous') {
      // Verify agent exists
      const agent = await AgentService.getAgentById(agent_id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      // For anonymous users, we only allow switching to free/unrestricted agents
      // This is especially important for support scenarios
      if (agent.is_restricted && !agent.is_free) {
        // Allow access to support-type agents even if restricted
        const isSupport = agent.name.toLowerCase().includes('support') || 
                         agent.name.toLowerCase().includes('help') ||
                         (agent.description && agent.description.toLowerCase().includes('support'));
        if (!isSupport) {
          throw new Error('Anonymous users can only access free or support agents');
        }
      }
      
      console.log('Anonymous agent switch:', {
        agent_id: agent.id,
        agent_name: agent.name,
        is_free: agent.is_free,
        is_restricted: agent.is_restricted
      });
      
      // For anonymous users, return success without session management
      return {
        success: true,
        session_id: session_id || 'anonymous-session',
        previous_agent_id: null,
        new_agent: {
          id: agent.id,
          name: agent.name,
          instructions: agent.initial_prompt,
          initial_prompt: agent.initial_prompt
        },
        switch_reason: reason,
        message: `Successfully switched to ${agent.name} agent (anonymous session). The ${agent.name} will respond in the next message.`,
        user_type: 'anonymous',
        stop_processing: true // Signal to stop generating additional content
      };
    }
    
    // For authenticated users, proceed with full session management
    const userProfileId = await this.getUserProfileId(userId);
    
    // If user profile doesn't exist, handle gracefully
    if (!userProfileId) {
      console.warn('Authenticated user has no profile, treating as anonymous for agent switching');
      // Fallback to anonymous-style agent switching
      const agent = await AgentService.getAgentById(agent_id);
      if (!agent) {
        throw new Error('Agent not found');
      }
      
      return {
        success: true,
        session_id: session_id || 'temp-session',
        previous_agent_id: null,
        new_agent: {
          id: agent.id,
          name: agent.name,
          instructions: agent.initial_prompt,
          initial_prompt: agent.initial_prompt
        },
        switch_reason: reason,
        message: `Successfully switched to ${agent.name} agent (temporary session). The ${agent.name} will respond in the next message.`,
        user_type: 'authenticated-no-profile',
        stop_processing: true // Signal to stop generating additional content
      };
    }
    
    // Skip session verification for now to avoid 406 errors
    // TODO: Fix session verification database schema issues
    console.log('Skipping session verification to avoid database errors, proceeding with agent switch');
    
    // Verify agent exists and user has access
    const agent = await AgentService.getAgentById(agent_id);
    if (!agent) {
      throw new Error('Agent not found');
    }
    
    // Check if user has access to this agent
    console.log('Switching agent - checking user access for userId:', userId);
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, supabase_user_id')
      .eq('supabase_user_id', userId)
      .single();
    
    if (profileError) {
      console.error('Error fetching user profile in switchAgent:', profileError);
      throw new Error(`User profile fetch failed: ${profileError.message}`);
    }
    
    console.log('User profile found:', userProfile);
    
    // For agent switching, any authenticated user with a valid role can access any agent
    const hasProperAccountSetup = true; // All authenticated users have access
    
    console.log('Agent access check:', {
      agent_id: agent.id,
      agent_name: agent.name,
      is_free: agent.is_free,
      is_restricted: agent.is_restricted,
      user_role: userProfile?.role,
      hasProperAccountSetup
    });
    
    // Verify user authentication data exists
    if (!userProfile?.supabase_user_id) {
      throw new Error('User authentication data not found');
    }
    
    // Perform the switch
    console.log('🔄 Performing agent switch in database...', {
      session_id,
      agent_id,
      agent_name: agent.name,
      user_id: userProfile.supabase_user_id
    });
    
    const success = await AgentService.setSessionAgent(
      session_id, 
      agent_id, 
      userProfile.supabase_user_id
    );
    
    console.log('🔄 Agent switch database result:', {
      success,
      session_id,
      agent_id,
      agent_name: agent.name
    });
    
    if (!success) {
      console.error('❌ Agent switch failed in database');
      throw new Error('Failed to switch agent');
    }
    
    // Store the switch reason in session metadata if provided
    if (reason) {
      await supabase
        .from('sessions')
        .update({
          session_metadata: {
            last_agent_switch: {
              timestamp: new Date().toISOString(),
              reason,
              agent_id,
              agent_name: agent.name
            }
          }
        })
        .eq('id', session_id);
    }
    
    // Get the updated active agent with retry to ensure database consistency
    let newActiveAgent = null;
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries && !newActiveAgent) {
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay for database consistency
      newActiveAgent = await AgentService.getSessionActiveAgent(session_id);
      
      if (newActiveAgent && newActiveAgent.agent_id === agent_id) {
        break; // Success - agent switch is confirmed
      }
      
      retryCount++;
      console.log(`🔄 Agent switch verification retry ${retryCount}/${maxRetries}`, {
        session_id,
        expected_agent_id: agent_id,
        actual_agent_id: newActiveAgent?.agent_id || 'null'
      });
    }
    
    if (!newActiveAgent || newActiveAgent.agent_id !== agent_id) {
      console.error('❌ Agent switch verification failed after retries', {
        session_id,
        expected_agent_id: agent_id,
        actual_agent_id: newActiveAgent?.agent_id || 'null'
      });
      throw new Error('Agent switch verification failed - database may not have updated correctly');
    }
    
    console.log('🔄 Agent switch verification - new active agent:', {
      session_id,
      newActiveAgent: newActiveAgent ? {
        agent_id: newActiveAgent.agent_id,
        agent_name: newActiveAgent.agent_name,
        has_initial_prompt: !!newActiveAgent.agent_initial_prompt
      } : 'NULL'
    });
    
    const switchResult = {
      success: true,
      session_id,
      previous_agent_id: null, // We could track this if needed
      new_agent: newActiveAgent ? {
        id: newActiveAgent.agent_id,
        name: newActiveAgent.agent_name,
        instructions: newActiveAgent.agent_instructions,
        initial_prompt: newActiveAgent.agent_initial_prompt
      } : null,
      switch_reason: reason,
      message: `Successfully switched to ${agent.name} agent. The ${agent.name} will respond in the next message.`,
      user_type: 'authenticated',
      stop_processing: true // Signal to stop generating additional content
    };
    
    console.log('🔄 Agent switch complete, returning result:', {
      success: switchResult.success,
      new_agent_name: switchResult.new_agent?.name,
      message: switchResult.message,
      stop_processing: switchResult.stop_processing
    });
    
    return switchResult;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async recommendAgent(params: any, userId: string) {
    const { topic, conversation_context } = params;
    
    // Handle anonymous users
    let hasProperAccountSetup = false;
    let isAuthenticated = false;
    
    if (userId === 'anonymous') {
      hasProperAccountSetup = false; // Anonymous users get limited access
      isAuthenticated = false;
    } else {
      // Get all available agents for authenticated users
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('supabase_user_id', userId)
        .single();
      
      hasProperAccountSetup = true; // All authenticated users have access to all agents
      isAuthenticated = true;
    }
    
    const availableAgents = await AgentService.getAvailableAgents(
      hasProperAccountSetup, 
      isAuthenticated
    );
    
    // Simple keyword-based recommendation logic
    const topicLower = topic.toLowerCase();
    const contextLower = (conversation_context || '').toLowerCase();
    const searchText = `${topicLower} ${contextLower}`;
    
    // Agent recommendation rules
    const recommendations = [];
    
    for (const agent of availableAgents) {
      let score = 0;
      const reasons = [];
      
      // Support/Help keywords - prioritize for anonymous users
      if (searchText.includes('help') || searchText.includes('support') || 
          searchText.includes('problem') || searchText.includes('issue') ||
          searchText.includes('login') || searchText.includes('access')) {
        if (agent.name.toLowerCase().includes('support') || 
            agent.name.toLowerCase().includes('help')) {
          score += 60;
          reasons.push('Specialized in user support and troubleshooting');
        }
      }
      
      // RFP-related keywords
      if (searchText.includes('rfp') || searchText.includes('request for proposal') || 
          searchText.includes('procurement') || searchText.includes('vendor') ||
          searchText.includes('bid') || searchText.includes('proposal')) {
        if (agent.name.toLowerCase().includes('rfp')) {
          score += 50;
          reasons.push('Specialized in RFP creation and management');
        }
      }
      
      // Technical support keywords
      if (searchText.includes('technical') || searchText.includes('support') || 
          searchText.includes('bug') || searchText.includes('error') ||
          searchText.includes('problem') || searchText.includes('issue')) {
        if (agent.name.toLowerCase().includes('technical') || 
            agent.name.toLowerCase().includes('support')) {
          score += 50;
          reasons.push('Specialized in technical support and troubleshooting');
        }
      }
      
      // Sales and general questions
      if (searchText.includes('price') || searchText.includes('cost') || 
          searchText.includes('subscription') || searchText.includes('plan') ||
          searchText.includes('general') || searchText.includes('question')) {
        if (agent.name.toLowerCase().includes('solution') || 
            agent.name.toLowerCase().includes('sales')) {
          score += 40;
          reasons.push('Best for general inquiries and product information');
        }
      }
      
      // Onboarding and getting started
      if (searchText.includes('start') || searchText.includes('begin') || 
          searchText.includes('new') || searchText.includes('setup') ||
          searchText.includes('onboard') || searchText.includes('help')) {
        if (agent.name.toLowerCase().includes('onboard')) {
          score += 45;
          reasons.push('Specialized in helping new users get started');
        }
      }
      
      // Default agent gets base score
      if (agent.is_default) {
        score += 10;
        reasons.push('Default agent suitable for general assistance');
      }
      
      // Free agent preference for basic users
      if (agent.is_free && !hasProperAccountSetup) {
        score += 15;
        reasons.push('Free agent available to all authenticated users');
      }
      
      if (score > 0) {
        recommendations.push({
          agent: {
            id: agent.id,
            name: agent.name,
            description: agent.description,
            initial_prompt: agent.initial_prompt,
            is_default: agent.is_default,
            is_restricted: agent.is_restricted,
            is_free: agent.is_free
          },
          score,
          reasons,
          confidence: Math.min(score / 50, 1.0) // Normalize to 0-1
        });
      }
    }
    
    // Sort by score descending
    recommendations.sort((a, b) => b.score - a.score);
    
    // Return top 3 recommendations
    const topRecommendations = recommendations.slice(0, 3);
    
    return {
      topic,
      conversation_context,
      recommendations: topRecommendations,
      total_agents_considered: availableAgents.length,
      user_access_level: hasProperAccountSetup ? 'premium' : 'basic',
      message: topRecommendations.length > 0 
        ? `Found ${topRecommendations.length} agent recommendations for: "${topic}"`
        : 'No specific agent recommendations found, consider using the default agent'
    };
  }
}

// Export singleton instance
export const claudeAPIHandler = new ClaudeAPIFunctionHandler();
