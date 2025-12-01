// Copyright Mark Skiba, 2025 All rights reserved
// System prompt construction utilities
// deno-lint-ignore-file no-explicit-any
/* eslint-disable @typescript-eslint/no-explicit-any */ import { loadAgentWithInheritance, logInheritanceDetails } from './agent-inheritance.ts';
/**
 * Build system prompt with agent instructions and context
 * Based on the original monolithic implementation
 * Enhanced with agent switch context detection and auto-processing
 */ export function buildSystemPrompt(context, userMessage) {
  // 🎯 ALWAYS use full instructions as system prompt (never use initial_prompt as system)
  // The initial_prompt is only used in the USER MESSAGE to guide welcome generation
  let systemPrompt = context.agent?.instructions || context.agent?.initial_prompt || 'You are a helpful AI assistant.';
  // Check for agent fallback information (attached to agent object or in context)
  const fallbackInfo = context.agentFallback || context.agent?._fallbackInfo;
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
    const isAgentSwitchContext = userMessage.includes('User context from previous agent:') || userMessage.includes('AUTO-PROCESSING:');
    if (isAgentSwitchContext) {
      console.log('🔄 AGENT SWITCH DETECTED - Adding auto-processing instructions');
      // Extract the original user request from the context message
      const contextMatch = userMessage.match(/User context from previous agent: "([^"]+)"/);
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
var AgentLoadError;
/**
 * Error types for agent loading operations
 */ (function(AgentLoadError) {
  AgentLoadError["NOT_FOUND"] = "NOT_FOUND";
  AgentLoadError["DATABASE_ERROR"] = "DATABASE_ERROR";
  AgentLoadError["NETWORK_ERROR"] = "NETWORK_ERROR";
  AgentLoadError["PERMISSION_ERROR"] = "PERMISSION_ERROR";
  AgentLoadError["UNKNOWN_ERROR"] = "UNKNOWN_ERROR";
})(AgentLoadError || (AgentLoadError = {}));
/**
 * Sleep utility for retry delays
 */ const sleep = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
/**
 * Categorize database errors for better handling
 */ function categorizeError(error) {
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
 */ async function loadAgentWithRetry(_supabase, queryFn, maxRetries = 3, baseDelayMs = 100) {
  let lastError = null;
  for(let attempt = 1; attempt <= maxRetries; attempt++){
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
        return {
          ...result,
          finalError: errorType
        };
      }
      // Retry for transient errors
      if (attempt < maxRetries && (errorType === AgentLoadError.NETWORK_ERROR || errorType === AgentLoadError.DATABASE_ERROR)) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`⏳ Retrying agent query in ${delayMs}ms (attempt ${attempt}/${maxRetries}) due to ${errorType}`);
        await sleep(delayMs);
        continue;
      }
      return {
        ...result,
        finalError: errorType
      };
    } catch (exception) {
      lastError = exception;
      const errorType = categorizeError(exception);
      if (attempt < maxRetries && errorType !== AgentLoadError.PERMISSION_ERROR) {
        const delayMs = baseDelayMs * Math.pow(2, attempt - 1);
        console.log(`⏳ Retrying after exception in ${delayMs}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(delayMs);
        continue;
      }
      return {
        data: null,
        error: lastError,
        finalError: errorType
      };
    }
  }
  return {
    data: null,
    error: lastError,
    finalError: categorizeError(lastError)
  };
}
/**
 * Load default Solutions agent with detailed logging
 * 🚨 FALLBACK PREVENTION: Only fallback in critical scenarios
 */ async function loadDefaultAgent(supabase, reason, originalError, currentAgentId) {
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
  const isCriticalFailure = reason.includes('CRITICAL') || reason.includes('no active agents found') || !originalError || originalError?.code === 'PGRST116' // Table not found
  ;
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
  // Check if user is authenticated to determine correct default agent
  let defaultAgentName = 'Solutions'; // Default for anonymous users
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user) {
      console.log('🔐 Authenticated user detected in fallback, using RFP Design agent');
      defaultAgentName = 'RFP Design';
    } else {
      console.log('👤 Anonymous user detected in fallback, using Solutions agent');
    }
  } catch (authError) {
    console.error('⚠️ Auth check failed in fallback, defaulting to Solutions agent:', authError);
  }
  const fallbackInfo = {
    occurred: true,
    reason: reason,
    originalAgent: currentAgentId || 'Unknown',
    fallbackAgent: defaultAgentName,
    timestamp: new Date().toISOString()
  };
  try {
    const { data: defaultAgent, error: defaultError } = await supabase.from('agents').select('id, name, instructions, initial_prompt, role, access').eq('name', defaultAgentName).eq('is_active', true).single();
    if (defaultError) {
      console.error(`🚨 CRITICAL - ${defaultAgentName} agent fallback also failed:`, defaultError);
      // Final fallback: try the other default agent
      const finalFallbackName = defaultAgentName === 'Solutions' ? 'RFP Design' : 'Solutions';
      console.log(`🔄 Attempting final fallback to ${finalFallbackName} agent`);
      const { data: finalAgent, error: finalError } = await supabase.from('agents').select('id, name, instructions, initial_prompt, role, access').eq('name', finalFallbackName).eq('is_active', true).single();
      if (finalError) {
        console.error('🚨 CRITICAL - Final fallback also failed:', finalError);
        return {
          agent: null,
          fallbackInfo
        };
      }
      fallbackInfo.fallbackAgent = finalAgent.name;
      return {
        agent: finalAgent,
        fallbackInfo
      };
    }
    if (defaultAgent) {
      console.log(`✅ Successfully loaded default ${defaultAgent.name} agent as fallback`);
      console.log('📋 Default agent details:', {
        id: defaultAgent.id,
        name: defaultAgent.name,
        role: defaultAgent.role,
        hasInstructions: !!defaultAgent.instructions,
        instructionsLength: defaultAgent.instructions?.length || 0
      });
      fallbackInfo.fallbackAgent = defaultAgent.name;
    }
    return {
      agent: defaultAgent,
      fallbackInfo
    };
  } catch (error) {
    console.error('🚨 CRITICAL - Exception during default agent fallback:', error);
    return {
      agent: null,
      fallbackInfo
    };
  }
}
/**
 * Load agent context from database with inheritance support
 * This is the main entry point for loading agents - now uses inheritance system
 */ export async function loadAgentContext(supabase, sessionId, agentId) {
  console.log('🔧 loadAgentContext - ENTRY POINT:', {
    sessionId,
    agentId
  });
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
    let targetAgentId = null;
    if (agentId) {
      console.log('🎯 Loading specific agent by ID:', agentId);
      targetAgentId = agentId;
    } else if (sessionId) {
      console.log('🎯 Loading active agent for session:', sessionId);
      // Get agent ID from session_agents
      const result = await loadAgentWithRetry(supabase, ()=>supabase.from('session_agents').select('agent_id').eq('session_id', sessionId).eq('is_active', true).order('started_at', {
          ascending: false
        }).limit(1).maybeSingle());
      if (result.error) {
        console.error('❌ Error loading session agent:', {
          sessionId,
          error: result.error,
          errorType: result.finalError,
          timestamp: new Date().toISOString()
        });
        // Fallback to default agent if session lookup fails
        const fallbackResult = await loadDefaultAgent(supabase, `Session agent lookup failed: ${result.finalError}`, result.error);
        if (fallbackResult.fallbackInfo && fallbackResult.agent) {
          fallbackResult.agent._fallbackInfo = fallbackResult.fallbackInfo;
        }
        // Load default agent with inheritance
        if (fallbackResult.agent?.id) {
          return await loadAgentWithInheritance(supabase, fallbackResult.agent.id);
        }
        return fallbackResult.agent;
      }
      targetAgentId = result.data?.agent_id;
    }
    if (!targetAgentId) {
      console.log('⚠️ loadAgentContext - No agent ID determined');
      return null;
    }
    // 🔗 NEW: Load agent with inheritance
    console.log('🔗 INHERITANCE - Starting inheritance loading for agent:', targetAgentId);
    const agent = await loadAgentWithInheritance(supabase, targetAgentId);
    if (agent && agent._inheritanceChain) {
      // Log detailed inheritance information
      logInheritanceDetails(agent);
    } else if (agent) {
      console.log('ℹ️ Agent loaded without inheritance:', agent.name);
    }
    if (agent) {
      console.log('✅ Successfully loaded agent context:', {
        id: agent.id,
        name: agent.name,
        role: agent.role,
        instructionsLength: agent.instructions?.length || 0,
        toolsCount: agent.access?.length || 0,
        hasInheritance: !!agent._inheritanceChain && agent._inheritanceChain.length > 1,
        timestamp: new Date().toISOString()
      });
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
      if (fallbackResult.fallbackInfo && fallbackResult.agent) {
        fallbackResult.agent._fallbackInfo = fallbackResult.fallbackInfo;
      }
      // Load default agent with inheritance
      if (fallbackResult.agent?.id) {
        return await loadAgentWithInheritance(supabase, fallbackResult.agent.id);
      }
      return fallbackResult.agent;
    }
    return null;
  }
}
/**
 * Enhanced system prompt builder that handles agent switch contexts
 * This is the main export that should be used for agent switch scenarios
 */ export function buildSystemPromptWithContext(context, userMessage) {
  return buildSystemPrompt(context, userMessage);
}
/**
 * Load user profile from authenticated session
 */ export async function loadUserProfile(supabase) {
  try {
    // Get current user from authenticated session
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('No authenticated user found');
      return null;
    }
    // Try to get additional profile information
    const userObj = user;
    const userMeta = userObj.user_metadata || {};
    const userProfile = {
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
