// Copyright Mark Skiba, 2025 All rights reserved
// System prompt construction utilities
// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */

// Interface for Supabase client - using unknown for complex API types
interface SupabaseAuth {
  getUser(): Promise<{ data: { user: Record<string, unknown> | null }; error: unknown }>;
}

interface SupabaseClient {
  from(table: string): unknown;
  auth: SupabaseAuth;
}

export interface Agent {
  id: string;
  name: string;
  instructions: string;
  initial_prompt?: string;
  role?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role?: string;
}

export interface SystemPromptContext {
  agent?: Agent;
  userProfile?: UserProfile;
  sessionId?: string;
  currentRfp?: { id: string; name: string };
  currentArtifact?: { id: string; type: string };
  isAnonymous?: boolean;
  loginEvidence?: {
    hasPreviousLogin: boolean;
    loginCount?: number;
    lastLoginTime?: string;
  };
}

/**
 * Build system prompt with agent instructions and context
 * Based on the original monolithic implementation
 * Enhanced with agent switch context detection and auto-processing
 */
export function buildSystemPrompt(context: SystemPromptContext, userMessage?: string): string {
  // Start with agent instructions, fallback to initial_prompt, then default
  let systemPrompt = context.agent?.instructions || context.agent?.initial_prompt || 'You are a helpful AI assistant.';
  
  // 🤖 AUTO-PROCESSING: Detect agent switch context and add auto-processing instructions
  if (userMessage && context.agent) {
    const isAgentSwitchContext = userMessage.includes('User context from previous agent:') || 
                                userMessage.includes('AUTO-PROCESSING:');
    
    if (isAgentSwitchContext) {
      console.log('🔄 AGENT SWITCH DETECTED - Adding auto-processing instructions');
      
      // Extract the original user request from the context message
      const contextMatch = userMessage.match(/User context from previous agent: "([^"]+)"/)
      const originalRequest = contextMatch ? contextMatch[1] : '';
      
      if (originalRequest) {
        // Add specific auto-processing instructions based on agent role and user request
        const agentRole = context.agent.role;
        const agentName = context.agent.name;
        const lowerRequest = originalRequest.toLowerCase();
        
        systemPrompt += `\n\n🤖 AGENT SWITCH AUTO-PROCESSING MODE:\n`;
        systemPrompt += `- You are continuing a conversation that was handed off from a previous agent\n`;
        systemPrompt += `- Original user request: "${originalRequest}"\n`;
        systemPrompt += `- Your role: ${agentName} (${agentRole})\n`;
        
        if (agentRole === 'design' && (lowerRequest.includes('rfp') || lowerRequest.includes('questionnaire') || lowerRequest.includes('form') || lowerRequest.includes('procurement') || lowerRequest.includes('source') || lowerRequest.includes('buy'))) {
          systemPrompt += `\n🎯 AUTO-PROCESS INSTRUCTIONS:\n`;
          systemPrompt += `1. IMMEDIATELY create the RFP using create_and_set_rfp function\n`;
          systemPrompt += `2. IMMEDIATELY generate the buyer questionnaire using create_form_artifact\n`;
          systemPrompt += `3. Provide a brief explanation of what you created\n`;
          systemPrompt += `4. Do NOT ask for additional input - execute these actions automatically\n`;
          
        } else if (agentRole === 'sales' && (lowerRequest.includes('help') || lowerRequest.includes('what') || lowerRequest.includes('how'))) {
          systemPrompt += `\n🎯 AUTO-PROCESS INSTRUCTIONS:\n`;
          systemPrompt += `1. IMMEDIATELY provide comprehensive information about the request\n`;
          systemPrompt += `2. Explain platform capabilities relevant to the user's question\n`;
          systemPrompt += `3. Offer specific next steps or actions\n`;
          
        } else {
          systemPrompt += `\n🎯 AUTO-PROCESS INSTRUCTIONS:\n`;
          systemPrompt += `1. IMMEDIATELY take appropriate action based on your role and the user's request\n`;
          systemPrompt += `2. Execute relevant functions to fulfill the original request\n`;
          systemPrompt += `3. Provide status and results of your actions\n`;
        }
        
        systemPrompt += `\n⚡ CRITICAL: This is an automatic handoff. Take action immediately without asking for clarification.\n`;
      }
    }
  }
  
  // 🔍 DEBUG: Log system prompt construction details
  console.log('🧩 buildSystemPrompt - Agent context:', {
    agentId: context.agent?.id,
    agentName: context.agent?.name,
    agentRole: context.agent?.role,
    hasInstructions: !!context.agent?.instructions,
    hasInitialPrompt: !!context.agent?.initial_prompt,
    instructionsLength: context.agent?.instructions?.length || 0,
    initialPromptLength: context.agent?.initial_prompt?.length || 0,
    usingInstructions: !!context.agent?.instructions,
    instructionsPreview: (context.agent?.instructions || context.agent?.initial_prompt || '').substring(0, 200) + '...'
  });
  
  // Add user authentication context to system prompt
  if (context.userProfile && !context.isAnonymous) {
    systemPrompt += `\n\nUSER CONTEXT:`;
    systemPrompt += `\n- User Status: AUTHENTICATED`;
    systemPrompt += `\n- User ID: ${context.userProfile.id}`;
    systemPrompt += `\n- Email: ${context.userProfile.email}`;
    if (context.userProfile.full_name) {
      systemPrompt += `\n- Name: ${context.userProfile.full_name}`;
    }
    if (context.userProfile.role) {
      systemPrompt += `\n- Role: ${context.userProfile.role}`;
    }
  } else {
    systemPrompt += `\n\nUSER CONTEXT:`;
    systemPrompt += `\n- User Status: ANONYMOUS (not logged in)`;
    
    // Add previous login evidence for anonymous users
    if (context.loginEvidence?.hasPreviousLogin) {
      systemPrompt += `\n- Previous Login History: YES - This user has logged in before on this device`;
      if (context.loginEvidence.loginCount) {
        systemPrompt += `\n- Login Count: ${context.loginEvidence.loginCount} previous logins`;
      }
      if (context.loginEvidence.lastLoginTime) {
        systemPrompt += `\n- Last Login: ${context.loginEvidence.lastLoginTime}`;
      }
      systemPrompt += `\n- Recommendation: This is a returning user who should be encouraged to log back in rather than sign up`;
    } else {
      systemPrompt += `\n- Previous Login History: NO - This appears to be a new user`;
      systemPrompt += `\n- Recommendation: This user is a potential customer who has not yet signed up`;
    }
  }
  
  // Add session context to system prompt if available
  if (context.sessionId) {
    systemPrompt += `\n\nCurrent session: ${context.sessionId}`;
  }
  if (context.currentRfp) {
    systemPrompt += `\n\nCurrent RFP: ${context.currentRfp.name} (ID: ${context.currentRfp.id})`;
  }
  if (context.currentArtifact) {
    systemPrompt += `\n\nCurrent Artifact: ${context.currentArtifact.type} (ID: ${context.currentArtifact.id})`;
  }

  // 🔍 DEBUG: Log final system prompt length and key sections
  console.log('🎯 buildSystemPrompt - Final prompt details:', {
    totalLength: systemPrompt.length,
    startsWithInstructions: systemPrompt.startsWith(context.agent?.instructions?.substring(0, 50) || ''),
    containsCriticalRules: systemPrompt.includes('🚨 CRITICAL AGENT SWITCHING PREVENTION') && systemPrompt.includes('🔥 CRITICAL RFP CREATION RULE'),
    containsCreateRfpRule: systemPrompt.includes('create_and_set_rfp'),
    containsSwitchAgentRule: systemPrompt.includes('DO NOT call switch_agent')
  });

  return systemPrompt;
}

/**
 * Load agent context from database
 */
export async function loadAgentContext(supabase: unknown, sessionId?: string, agentId?: string): Promise<Agent | null> {
  console.log('🔧 loadAgentContext - ENTRY POINT:', { sessionId, agentId });
  console.log('🔧 loadAgentContext - Parameter types:', { 
    sessionIdType: typeof sessionId, 
    agentIdType: typeof agentId,
    sessionIdValue: sessionId,
    agentIdValue: agentId
  });
  
  if (!sessionId && !agentId) {
    console.log('❌ loadAgentContext - No session ID or agent ID provided, using default agent');
    return null;
  }

  try {
    let agent = null;

    if (agentId) {
      // Load specific agent by ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agents')
        .select('id, name, instructions, initial_prompt, role')
        .eq('id', agentId)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error loading agent by ID:', error);
        return null;
      }
      agent = data;
    } else if (sessionId) {
      // Load active agent for session
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('session_agents')
        .select(`
          agents!inner (
            id,
            name,
            instructions,
            initial_prompt,
            role
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading session agent:', error);
        // Try to get default agent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: defaultAgent } = await (supabase as any)
          .from('agents')
          .select('id, name, instructions, initial_prompt, role')
          .eq('name', 'Solutions')
          .eq('is_active', true)
          .single();
        
        return defaultAgent || null;
      }
      agent = data?.agents;
    }

    if (agent) {
      console.log('✅ Loaded agent context:', {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        instructionsLength: agent.instructions?.length || 0
      });
    }

    return agent;
  } catch (error) {
    console.error('Unexpected error loading agent context:', error);
    return null;
  }
}

/**
 * Enhanced system prompt builder that handles agent switch contexts
 * This is the main export that should be used for agent switch scenarios
 */
export function buildSystemPromptWithContext(context: SystemPromptContext, userMessage?: string): string {
  return buildSystemPrompt(context, userMessage);
}

/**
 * Load user profile from authenticated session
 */
export async function loadUserProfile(supabase: unknown): Promise<UserProfile | null> {
  try {
    // Get current user from authenticated session
    const { data: { user }, error: userError } = await (supabase as SupabaseClient).auth.getUser();
    
    if (userError || !user) {
      console.log('No authenticated user found');
      return null;
    }

    // Try to get additional profile information
    const userObj = user as Record<string, unknown>;
    const userMeta = (userObj.user_metadata as Record<string, unknown>) || {};
    
    const userProfile: UserProfile = {
      id: String(userObj.id || ''),
      email: String(userObj.email || 'Unknown email'),
      full_name: String(userMeta.full_name || userMeta.name || '') || undefined,
      role: String(userMeta.role || '') || undefined
    };

    console.log('✅ Loaded user profile:', {
      id: userProfile.id,
      email: userProfile.email,
      hasFullName: !!userProfile.full_name,
      hasRole: !!userProfile.role
    });

    return userProfile;
  } catch (error) {
    console.error('Error loading user profile:', error);
    return null;
  }
}