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
 */
export function buildSystemPrompt(context: SystemPromptContext): string {
  // Start with agent instructions or default prompt
  let systemPrompt = context.agent?.instructions || 'You are a helpful AI assistant.';
  
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

  return systemPrompt;
}

/**
 * Load agent context from database
 */
export async function loadAgentContext(supabase: unknown, sessionId?: string, agentId?: string): Promise<Agent | null> {
  if (!sessionId && !agentId) {
    console.log('No session ID or agent ID provided, using default agent');
    return null;
  }

  try {
    let agent = null;

    if (agentId) {
      // Load specific agent by ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('agents')
        .select('id, name, instructions, role')
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
            role
          )
        `)
        .eq('session_id', sessionId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('Error loading session agent:', error);
        // Try to get default agent
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: defaultAgent } = await (supabase as any)
          .from('agents')
          .select('id, name, instructions, role')
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