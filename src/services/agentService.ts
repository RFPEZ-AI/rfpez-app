// Copyright Mark Skiba, 2025 All rights reserved

// Agent service layer for RFPEZ.AI Multi-Agent System
import { supabase } from '../supabaseClient';
import type { 
  Agent, 
  SessionAgent, 
  SessionActiveAgent,
  AgentWithActivity,
  UserRole
} from '../types/database';
import { RoleService } from './roleService';
import { SpecialtySiteService } from './specialtySiteService';

export class AgentService {
  /**
   * Get all active agents (includes both restricted and unrestricted)
   */
  static async getActiveAgents(): Promise<Agent[]> {
    console.log('AgentService.getActiveAgents called');
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching active agents:', error);
        // Check if it's an API key issue
        if (error.message.includes('API key') || error.message.includes('apikey')) {
          console.error('Supabase API key issue detected. Check environment variables.');
        }
        return [];
      }

      console.log('Active agents fetched:', data);
      return data || [];
    } catch (err) {
      console.error('Unexpected error in getActiveAgents:', err);
      return [];
    }
  }

  /**
   * Get agents available to user (returns ALL agents, UI handles greying out locked ones)
   * Note: Filtering is now handled in the UI layer to show locked agents in greyed-out state
   * @param hasProperAccountSetup - Whether user has billing setup
   * @param isAuthenticated - Whether user is authenticated
   * @param specialty - Optional specialty site filter (e.g., 'corporate-tmc-rfp', 'respond')
   */
  static async getAvailableAgents(
    hasProperAccountSetup = false, 
    isAuthenticated = false,
    specialty?: string | null
  ): Promise<Agent[]> {
    console.log('AgentService.getAvailableAgents called with hasProperAccountSetup:', hasProperAccountSetup, 'isAuthenticated:', isAuthenticated, 'specialty:', specialty);
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching available agents:', error);
      return [];
    }

    const allAgents: Agent[] = data || [];

    // Apply server-side filtering to match test expectations and simple access control.
    // Rules:
    // - Guest (not authenticated): only default and free agents
    // - Authenticated without proper account setup: default + free + non-restricted (exclude is_restricted)
    // - Authenticated with proper account setup (billing): all active agents
    let filtered: Agent[];

    if (!isAuthenticated) {
      filtered = allAgents.filter(a => a.is_default || a.is_free);
    } else if (isAuthenticated && !hasProperAccountSetup) {
      filtered = allAgents.filter(a => a.is_default || a.is_free || !a.is_restricted);
      // Ensure restricted agents are excluded for users without proper account setup
      filtered = filtered.filter(a => !a.is_restricted || a.is_free || a.is_default);
    } else {
      filtered = allAgents.slice(); // return all for users with proper account setup
    }

    // Filter by specialty site if provided
    if (specialty) {
      console.log('Filtering agents for specialty site:', specialty);
      filtered = filtered.filter(agent => {
        // Exclude abstract agents (parent agents that aren't meant to be used directly)
        if (agent.is_abstract) {
          console.log(`Excluding abstract agent: ${agent.name}`);
          return false;
        }
        
        // If agent has no specialty, it's global and available on all sites
        if (!agent.specialty) {
          console.log(`Including global agent: ${agent.name}`);
          return true;
        }
        
        // If agent has a specialty, it must match the requested specialty
        const matches = agent.specialty === specialty;
        console.log(`Agent ${agent.name} specialty '${agent.specialty}' ${matches ? 'matches' : 'does not match'} requested '${specialty}'`);
        return matches;
      });
    } else {
      // If no specialty specified, exclude agents with specialties (they're site-specific)
      // and exclude abstract agents
      filtered = filtered.filter(agent => {
        if (agent.is_abstract) {
          console.log(`Excluding abstract agent: ${agent.name}`);
          return false;
        }
        if (agent.specialty) {
          console.log(`Excluding specialty-specific agent: ${agent.name} (${agent.specialty})`);
          return false;
        }
        return true;
      });
    }

    console.log('Returning filtered agents for display:', filtered.map(a => a.name));
    return filtered;
  }

  /**
   * Get free agents available to authenticated users
   */
  static async getFreeAgents(): Promise<Agent[]> {
    console.log('AgentService.getFreeAgents called');
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_free', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching free agents:', error);
      return [];
    }

    console.log('Free agents fetched:', data);
    return data || [];
  }

  /**
   * Get agents available to user based on their role (role-based filtering)
   */
  static async getAgentsByUserRole(userRole: UserRole = 'user'): Promise<Agent[]> {
    console.log('AgentService.getAgentsByUserRole called with role:', userRole);
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching agents by role:', error);
        return [];
      }

      // Role-based filtering includes free agents for all authenticated users
      const availableAgents = (data || []).filter(agent => {
        // Free agents are available to all authenticated users (user role and above)
        if (agent.is_free) {
          return true;
        }
        
        // Map existing restrictions to role requirements
        if (agent.is_restricted) {
          // Restricted agents require at least developer role
          return RoleService.hasRoleAccess(userRole, 'developer');
        }
        
        // Non-restricted, non-free agents are available to all roles
        return true;
      });

      console.log(`Agents available for role ${userRole}:`, availableAgents);
      return availableAgents;
    } catch (err) {
      console.error('Unexpected error in getAgentsByUserRole:', err);
      return [];
    }
  }

  /**
   * Get agents for a specific specialty site
   * This is the primary method for loading agents in specialty pages
   */
  static async getAgentsForSpecialtySite(specialtySlug: string): Promise<Agent[]> {
    console.log('AgentService.getAgentsForSpecialtySite called with slug:', specialtySlug);
    
    try {
      // Use SpecialtySiteService to get agents for this specialty
      const agents = await SpecialtySiteService.getAgentsForSpecialtySite(specialtySlug);
      
      console.log(`✅ Fetched ${agents.length} agents for specialty site:`, specialtySlug);
      return agents;
    } catch (err) {
      console.error('Unexpected error in getAgentsForSpecialtySite:', err);
      // Fallback to all active agents if specialty site lookup fails
      console.warn('⚠️ Falling back to all active agents');
      return await this.getActiveAgents();
    }
  }

  /**
   * Get default agent based on authentication status and site context
   * Uses data-driven approach querying specialty_site_agents table
   * @param siteSlug - Site slug to query agents for (e.g., 'home', 'corporate-tmc-rfp')
   * @returns Default agent for the site based on authentication status, or null
   */
  static async getDefaultAgent(siteSlug?: string): Promise<Agent | null> {
    console.log('🎯 AgentService.getDefaultAgent called with siteSlug:', siteSlug);
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAuthenticated = !!user;
    
    console.log('🔐 User authentication check:', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });
    
    // If siteSlug provided, query specialty_site_agents for site-specific default
    if (siteSlug) {
      console.log(`🎯 Querying default agent for site: ${siteSlug}, authenticated: ${isAuthenticated}`);
      
      // Use the RPC function to get agents for the site
      const { data: siteAgents, error: rpcError } = await supabase
        .rpc('get_specialty_site_agents', { site_slug: siteSlug });

      if (rpcError) {
        console.error('❌ Error calling get_specialty_site_agents RPC:', rpcError);
      } else if (siteAgents && siteAgents.length > 0) {
        // Filter by is_anonymous_default for anonymous users, is_default for authenticated
        // Note: RPC function returns is_default (not is_default_agent)
        const defaultField = isAuthenticated ? 'is_default' : 'is_anonymous_default';
        const defaultSiteAgent = siteAgents.find((row: any) => row[defaultField] === true);
        
        if (defaultSiteAgent) {
          // Convert the RPC result to Agent type
          const agent: Agent = {
            id: defaultSiteAgent.agent_id,
            name: defaultSiteAgent.agent_name,
            description: defaultSiteAgent.agent_description,
            instructions: defaultSiteAgent.agent_instructions,
            initial_prompt: defaultSiteAgent.agent_initial_prompt,
            avatar_url: defaultSiteAgent.agent_avatar_url,
            is_active: defaultSiteAgent.is_active,
            is_default: defaultSiteAgent.is_default,
            is_restricted: defaultSiteAgent.is_restricted || false,
            is_free: defaultSiteAgent.is_free !== undefined ? defaultSiteAgent.is_free : false,
            role: defaultSiteAgent.role || '',
            sort_order: defaultSiteAgent.sort_order,
            metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          console.log(`✅ Site default agent found: ${agent.name} (${defaultField}=true)`);
          return agent;
        } else {
          console.log(`⚠️ No ${defaultField} agent found for site: ${siteSlug}`);
        }
      }
    }
    
    // Fallback: Query agents table for global default
    console.log('🔄 Fallback to global default agent query');
    const { data: defaultAgent, error: defaultError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .order('name')
      .limit(1)
      .single();

    if (defaultError || !defaultAgent) {
      console.error('❌ Error fetching global default agent:', defaultError);
      
      // Last resort: first active free agent
      const { data: freeAgents, error: freeError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_active', true)
        .eq('is_free', true)
        .limit(1);
      
      if (!freeError && freeAgents && freeAgents.length > 0) {
        console.log('🔄 Fallback to first free agent:', freeAgents[0].name);
        return freeAgents[0];
      }
      
      // Absolute last resort: first active agent
      const agents = await this.getActiveAgents();
      if (agents.length > 0) {
        console.log('🔄 Absolute fallback to first active agent:', agents[0].name);
        return agents[0];
      }
      
      console.log('❌ No default agent found');
      return null;
    }

    console.log('✅ Global default agent found:', defaultAgent.name);
    return defaultAgent;
  }

  /**
   * Get agent by ID
   */
  static async getAgentById(agentId: string): Promise<Agent | null> {
    console.log('AgentService.getAgentById called with:', agentId);
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('id', agentId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching agent by ID:', error);
      return null;
    }

    // Handle multiple results by taking the first one
    if (data && data.length > 0) {
      if (data.length > 1) {
        console.warn('Multiple agents found with same ID:', agentId, 'taking first one');
      }
      return data[0];
    }

    return null;
  }

  /**
   * Get agent by name (case-insensitive)
   */
  static async getAgentByName(agentName: string): Promise<Agent | null> {
    console.log('AgentService.getAgentByName called with:', agentName);
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .ilike('name', agentName)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching agent by name:', error);
      return null;
    }

    // Handle multiple results by taking the first one
    if (data && data.length > 0) {
      if (data.length > 1) {
        console.warn('Multiple agents found with name:', agentName, 'taking first one');
      }
      return data[0];
    }

    return null;
  }

  /**
   * Get the currently active agent for a session
   */
  static async getSessionActiveAgent(sessionId: string): Promise<SessionActiveAgent | null> {
    console.log('AgentService.getSessionActiveAgent called with:', sessionId);
    
    try {
      const { data, error } = await supabase
        .rpc('get_session_active_agent', { session_uuid: sessionId });

      if (error) {
        console.error('❌ Supabase RPC error in getSessionActiveAgent:', {
          error,
          sessionId,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint
        });
        
        // Check if it's a network connectivity issue
        if (error.message?.includes('Failed to fetch') || error.message?.includes('fetch')) {
          console.error('🌐 Network connectivity issue detected. Check internet connection and Supabase status.');
        }
        
        // Check if it's an RPC function issue
        if (error.message?.includes('function') || error.code === 'PGRST202') {
          console.error('🔧 RPC function issue. The get_session_active_agent function may not exist or has wrong signature.');
        }
        
        return null;
      }

      console.log('Session active agent:', data);
      return data && data.length > 0 ? data[0] : null;
    } catch (networkError) {
      console.error('❌ Network error in getSessionActiveAgent:', {
        networkError,
        sessionId,
        errorType: networkError instanceof Error ? networkError.name : 'Unknown',
        errorMessage: networkError instanceof Error ? networkError.message : 'Unknown error'
      });
      return null;
    }
  }

  /**
   * Set the active agent for a session
   */
  static async setSessionAgent(
    sessionId: string, 
    agentId: string, 
    supabaseUserId: string
  ): Promise<boolean> {
    console.log('AgentService.setSessionAgent called with:', { sessionId, agentId, supabaseUserId });
    
    // First verify the agent exists
    const { data: agents, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId)
      .eq('is_active', true);

    if (agentError || !agents || agents.length === 0) {
      console.error('Agent not found or inactive:', agentId, agentError);
      return false;
    }
    
    if (agents.length > 1) {
      console.warn('Multiple agents found with same ID during setSessionAgent:', agentId);
    }

    const { data, error } = await supabase
      .rpc('switch_session_agent', { 
        session_uuid: sessionId, 
        new_agent_uuid: agentId, 
        user_uuid: supabaseUserId  // ✅ Direct auth.users.id usage
      });

    if (error) {
      console.error('Error setting session agent:', error);
      return false;
    }

    console.log('Session agent set successfully:', data);
    return data === true;
  }

  /**
   * Initialize a session with the default agent
   */
  static async initializeSessionWithDefaultAgent(
    sessionId: string, 
    supabaseUserId: string
  ): Promise<boolean> {
    console.log('AgentService.initializeSessionWithDefaultAgent called');
    
    // Get the default agent
    const defaultAgent = await this.getDefaultAgent();
    if (!defaultAgent) {
      console.error('No default agent found');
      return false;
    }

    return await this.setSessionAgent(sessionId, defaultAgent.id, supabaseUserId);
  }

  /**
   * Get agents with activity statistics
   */
  static async getAgentsWithActivity(): Promise<AgentWithActivity[]> {
    console.log('AgentService.getAgentsWithActivity called');
    
    const { data, error } = await supabase
      .from('agents')
      .select(`
        *,
        session_agents(
          session_id,
          started_at
        )
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching agents with activity:', error);
      return [];
    }

    // Transform the data to include activity stats
    const agentsWithActivity: AgentWithActivity[] = (data || []).map(agent => {
      const sessionAgents = (agent as any).session_agents || []; // eslint-disable-line @typescript-eslint/no-explicit-any
      return {
        ...agent,
        session_count: sessionAgents.length,
        last_used: sessionAgents.length > 0 
          ? new Date(Math.max(...sessionAgents.map((sa: any) => new Date(sa.started_at).getTime()))).toISOString() // eslint-disable-line @typescript-eslint/no-explicit-any
          : undefined
      };
    });

    return agentsWithActivity;
  }

  /**
   * Create a new agent (admin function)
   */
  static async createAgent(agent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<Agent | null> {
    console.log('AgentService.createAgent called with:', agent);
    
    const { data, error } = await supabase
      .from('agents')
      .insert(agent)
      .select();

    if (error) {
      console.error('Error creating agent:', error);
      return null;
    }

    // Handle array result from insert
    const createdAgent = data && data.length > 0 ? data[0] : null;
    console.log('Agent created successfully:', createdAgent);
    return createdAgent;
  }

  /**
   * Update an agent (admin function)
   */
  static async updateAgent(
    agentId: string, 
    updates: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Agent | null> {
    console.log('AgentService.updateAgent called with:', { agentId, updates });
    
    // First check if the agent exists
    const { data: existingAgents, error: checkError } = await supabase
      .from('agents')
      .select('id')
      .eq('id', agentId);

    if (checkError || !existingAgents || existingAgents.length === 0) {
      console.error('Agent not found for update:', agentId, checkError);
      return null;
    }

    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select();

    if (error) {
      console.error('Error updating agent:', error);
      console.error('Update attempt details:', { agentId, updates });
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
      console.error('Error code:', error.code);
      return null;
    }

    // Handle array result from update
    const updatedAgent = data && data.length > 0 ? data[0] : null;
    console.log('Agent updated successfully:', updatedAgent);
    return updatedAgent;
  }

  /**
   * Delete an agent (admin function) - soft delete by setting is_active to false
   */
  static async deleteAgent(agentId: string): Promise<boolean> {
    console.log('AgentService.deleteAgent called with:', agentId);
    
    const { error } = await supabase
      .from('agents')
      .update({ is_active: false })
      .eq('id', agentId);

    if (error) {
      console.error('Error deleting agent:', error);
      return false;
    }

    console.log('Agent deleted successfully');
    return true;
  }

  /**
   * Debug function to check current agents in database
   */
  static async debugAgents(): Promise<void> {
    console.log('=== DEBUGGING AGENTS ===');
    
    const { data: agents, error } = await supabase
      .from('agents')
      .select('*')
      .order('sort_order');

    if (error) {
      console.error('Error fetching agents for debug:', error);
      return;
    }

    console.log('Current agents in database:', agents);
    console.log('Agent count:', agents?.length || 0);
    
    if (agents && agents.length > 0) {
      console.log('Agent fields available:', Object.keys(agents[0]));
      agents.forEach(agent => {
        console.log(`Agent: ${agent.name} (ID: ${agent.id}) - Active: ${agent.is_active}, Default: ${agent.is_default}, Restricted: ${agent.is_restricted}, Free: ${agent.is_free}`);
      });
    }
    
    console.log('=== END DEBUG ===');
  }

  /**
   * Get session agent history for a session
   */
  static async getSessionAgentHistory(sessionId: string): Promise<SessionAgent[]> {
    console.log('AgentService.getSessionAgentHistory called with:', sessionId);
    
    const { data, error } = await supabase
      .from('session_agents')
      .select(`
        *,
        agents(name, description, avatar_url)
      `)
      .eq('session_id', sessionId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching session agent history:', error);
      return [];
    }

    return data || [];
  }
}
