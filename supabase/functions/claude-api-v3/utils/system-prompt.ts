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
  memoryContext?: string; // Pre-built memory context from client-side embeddings
  loginEvidence?: {
    hasPreviousLogin: boolean;
    loginCount?: number;
    lastLoginTime?: string;
  };
  agentFallback?: {
    occurred: boolean;
    reason: string;
    originalAgent?: string;
    fallbackAgent?: string;
    timestamp?: string;
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
  
  // Check for agent fallback information (attached to agent object or in context)
  const fallbackInfo = context.agentFallback || (context.agent as any)?._fallbackInfo;
  if (fallbackInfo?.occurred) {
    systemPrompt += `\n\n🔔 AGENT FALLBACK NOTICE:\n`;
    systemPrompt += `- There was an issue loading the intended agent for this session\n`;
    systemPrompt += `- Reason: ${fallbackInfo.reason}\n`;
    systemPrompt += `- You are now operating as: ${fallbackInfo.fallbackAgent || context.agent?.name || 'Default Agent'}\n`;
    systemPrompt += `- Please acknowledge this fallback to the user and explain that you're the ${fallbackInfo.fallbackAgent || context.agent?.name} agent\n`;
    systemPrompt += `- If the user expected a different agent, they can manually switch using the agent selector\n`;
    systemPrompt += `- Time: ${fallbackInfo.timestamp}\n`;
  }
  
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
  
  // Add memory context if provided (from client-side semantic search)
  if (context.memoryContext) {
    systemPrompt += `\n\n${context.memoryContext}`;
  }

  // 🔍 DEBUG: Log final system prompt length and key sections
  console.log('🎯 buildSystemPrompt - Final prompt details:', {
    totalLength: systemPrompt.length,
    startsWithInstructions: systemPrompt.startsWith(context.agent?.instructions?.substring(0, 50) || ''),
    containsCriticalRules: systemPrompt.includes('🚨 CRITICAL AGENT SWITCHING PREVENTION') && systemPrompt.includes('🔥 CRITICAL RFP CREATION RULE'),
    containsCreateRfpRule: systemPrompt.includes('create_and_set_rfp'),
    containsSwitchAgentRule: systemPrompt.includes('DO NOT call switch_agent'),
    hasMemoryContext: !!context.memoryContext
  });

  return systemPrompt;
}

/**
 * Error types for agent loading operations
 */
enum AgentLoadError {
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Categorize database errors for better handling
 */
function categorizeError(error: any): AgentLoadError {
  if (!error) return AgentLoadError.UNKNOWN_ERROR;
  
  const errorCode = error.code || error.error_code || '';
  const errorMessage = (error.message || '').toLowerCase();
  
  // Supabase/PostgreSQL error codes
  if (errorCode === 'PGRST116' || errorMessage.includes('no rows returned')) {
    return AgentLoadError.NOT_FOUND;
  }
  
  if (errorCode.startsWith('08') || errorMessage.includes('connection') || errorMessage.includes('timeout')) {
    return AgentLoadError.NETWORK_ERROR;
  }
  
  if (errorCode.startsWith('42') || errorMessage.includes('permission') || errorMessage.includes('unauthorized')) {
    return AgentLoadError.PERMISSION_ERROR;
  }
  
  if (errorCode.startsWith('53') || errorMessage.includes('resource') || errorMessage.includes('lock')) {
    return AgentLoadError.DATABASE_ERROR;
  }
  
  return AgentLoadError.DATABASE_ERROR;
}

/**
 * Load agent with retry logic for transient errors
 */
async function loadAgentWithRetry(
  _supabase: any,
  queryFn: () => Promise<{ data: any; error: any }>,
  maxRetries = 3,
  baseDelayMs = 100
): Promise<{ data: any; error: any; finalError?: AgentLoadError }> {
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await queryFn();
      
      if (!result.error) {
        if (attempt > 1) {
          console.log(`✅ Agent query succeeded on attempt ${attempt}/${maxRetries}`);
        }
        return result;
      }
      
      lastError = result.error;
      const errorType = categorizeError(result.error);
      
      // Don't retry NOT_FOUND or PERMISSION errors
      if (errorType === AgentLoadError.NOT_FOUND || errorType === AgentLoadError.PERMISSION_ERROR) {
        console.log(`⏹️ Non-retryable error (${errorType}), stopping after attempt ${attempt}`);
        return { ...result, finalError: errorType };
      }
      
      // Retry for transient errors
      if (attempt < maxRetries && (errorType === AgentLoadError.NETWORK_ERROR || errorType === AgentLoadError.DATABASE_ERROR)) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying agent query in ${delayMs}ms (attempt ${attempt}/${maxRetries}) due to ${errorType}`);
        await sleep(delayMs);
        continue;
      }
      
      return { ...result, finalError: errorType };
    } catch (exception) {
      lastError = exception;
      const errorType = categorizeError(exception);
      
      if (attempt < maxRetries && errorType !== AgentLoadError.PERMISSION_ERROR) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying after exception in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }
      
      return { data: null, error: lastError, finalError: errorType };
    }
  }
  
  return { data: null, error: lastError, finalError: categorizeError(lastError) };
}

/**
 * Load default Solutions agent with detailed logging
 * 🚨 FALLBACK PREVENTION: Only fallback in critical scenarios
 */
async function loadDefaultAgent(supabase: any, reason: string, originalError?: any, currentAgentId?: string): Promise<{ agent: Agent | null; fallbackInfo?: any }> {
  console.log(`🔄 AGENT FALLBACK TRIGGERED - Reason: ${reason}`);
  console.log('📊 Fallback context:', {
    originalError: originalError?.message || 'Unknown',
    errorCode: originalError?.code || 'N/A',
    timestamp: new Date().toISOString(),
    currentAgentId: currentAgentId || 'Unknown',
    fallbackAgent: 'Solutions'
  });

  // 🚨 CRITICAL CHANGE: Prevent fallback during normal operation errors
  // Only fallback for truly critical system failures, not temporary database issues
  const isCriticalFailure = (
    reason.includes('CRITICAL') || 
    reason.includes('no active agents found') || 
    !originalError || 
    originalError?.code === 'PGRST116' // Table not found
  );

  if (!isCriticalFailure) {
    console.log('⚠️ FALLBACK PREVENTED - Non-critical error, preserving current agent context');
    console.log('🔧 Error details:', { 
      reason, 
      errorCode: originalError?.code,
      shouldPreserveContext: true 
    });
    
    // Return null to prevent fallback - let system attempt retry or preserve current state
    return { 
      agent: null, 
      fallbackInfo: {
        occurred: false,
        reason: 'Fallback prevented - non-critical error',
        originalAgent: currentAgentId || 'Unknown',
        preservedContext: true,
        timestamp: new Date().toISOString()
      }
    };
  }
  
  const fallbackInfo = {
    occurred: true,
    reason: reason,
    originalAgent: currentAgentId || 'Unknown',
    fallbackAgent: 'Solutions',
    timestamp: new Date().toISOString()
  };
  
  try {
    const { data: defaultAgent, error: defaultError } = await (supabase as any)
      .from('agents')
      .select('id, name, instructions, initial_prompt, role')
      .eq('name', 'Solutions')
      .eq('is_active', true)
      .single();
    
    if (defaultError) {
      console.error('🚨 CRITICAL - Default agent fallback also failed:', defaultError);
      return { agent: null, fallbackInfo };
    }
    
    if (defaultAgent) {
      console.log('✅ Successfully loaded default Solutions agent as fallback');
      console.log('📋 Default agent details:', {
        id: defaultAgent.id,
        name: defaultAgent.name,
        role: defaultAgent.role,
        hasInstructions: !!defaultAgent.instructions,
        instructionsLength: defaultAgent.instructions?.length || 0
      });
      
      fallbackInfo.fallbackAgent = defaultAgent.name;
    }
    
    return { agent: defaultAgent, fallbackInfo };
  } catch (error) {
    console.error('🚨 CRITICAL - Exception during default agent fallback:', error);
    return { agent: null, fallbackInfo };
  }
}

/**
 * Enhanced result type for loadAgentContext that includes fallback information
 */
export interface AgentContextResult {
  agent: Agent | null;
  fallbackInfo?: {
    occurred: boolean;
    reason: string;
    originalAgent?: string;
    fallbackAgent: string;
    timestamp: string;
  };
}

/**
 * Load agent context from database with enhanced error handling and retry logic
 */
export async function loadAgentContext(supabase: unknown, sessionId?: string, agentId?: string): Promise<Agent | null> {
  console.log('🔧 loadAgentContext - ENTRY POINT:', { sessionId, agentId });
  console.log('🔧 loadAgentContext - Parameter types:', { 
    sessionIdType: typeof sessionId, 
    agentIdType: typeof agentId,
    sessionIdValue: sessionId,
    agentIdValue: agentId,
    timestamp: new Date().toISOString()
  });
  
  if (!sessionId && !agentId) {
    console.log('❌ loadAgentContext - No session ID or agent ID provided, returning null (no fallback)');
    return null;
  }

  try {
    let agent = null;

    if (agentId) {
      console.log('🎯 Loading specific agent by ID:', agentId);
      
      const result = await loadAgentWithRetry(
        supabase,
        () => (supabase as any)
          .from('agents')
          .select('id, name, instructions, initial_prompt, role')
          .eq('id', agentId)
          .eq('is_active', true)
          .single()
      );

      if (result.error) {
        console.error('❌ Error loading agent by ID:', {
          agentId,
          error: result.error,
          errorType: result.finalError,
          timestamp: new Date().toISOString()
        });
        
        // For direct agent ID lookups, don't fallback to default - return null
        return null;
      }
      agent = result.data;
      
    } else if (sessionId) {
      console.log('🎯 Loading active agent for session:', sessionId);
      
      const result = await loadAgentWithRetry(
        supabase,
        () => (supabase as any)
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
          .single()
      );

      if (result.error) {
        console.error('❌ Error loading session agent:', {
          sessionId,
          error: result.error,
          errorType: result.finalError,
          timestamp: new Date().toISOString()
        });
        
        // 🚨 CRITICAL FIX: Get current agent ID to prevent unnecessary fallback
        let currentAgentId = 'Unknown';
        try {
          // Attempt to get the current agent ID from session context
          const sessionResult = await (supabase as any)
            .from('session_agents')
            .select('agent_id')
            .eq('session_id', sessionId)
            .eq('is_active', true)
            .order('started_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (sessionResult.data?.agent_id) {
            currentAgentId = sessionResult.data.agent_id;
          }
        } catch (_e) {
          console.log('⚠️ Could not retrieve current agent ID for fallback prevention');
        }

        // Only fallback for session-based lookups with enhanced context
        const fallbackResult = await loadDefaultAgent(
          supabase, 
          `Session agent lookup failed: ${result.finalError}`, 
          result.error,
          currentAgentId
        );
        
        // Store fallback info in a way that the system prompt can access it
        if (fallbackResult.fallbackInfo && fallbackResult.agent) {
          (fallbackResult.agent as any)._fallbackInfo = fallbackResult.fallbackInfo;
        }
        
        return fallbackResult.agent;
      }
      agent = result.data?.agents;
    }

    if (agent) {
      console.log('✅ Successfully loaded agent context:', {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        instructionsLength: agent.instructions?.length || 0,
        loadedVia: agentId ? 'agentId' : 'sessionId',
        timestamp: new Date().toISOString()
      });
    } else {
      console.log('⚠️ No agent found but no error occurred');
    }

    return agent;
  } catch (error) {
    console.error('🚨 Unexpected error in loadAgentContext:', {
      error,
      sessionId,
      agentId,
      timestamp: new Date().toISOString()
    });
    
    // For unexpected errors in session context, try fallback
    if (sessionId && !agentId) {
      const fallbackResult = await loadDefaultAgent(supabase, 'Unexpected exception during session agent lookup', error);
      
      // Store fallback info in a way that the system prompt can access it
      if (fallbackResult.fallbackInfo && fallbackResult.agent) {
        (fallbackResult.agent as any)._fallbackInfo = fallbackResult.fallbackInfo;
      }
      
      return fallbackResult.agent;
    }
    
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