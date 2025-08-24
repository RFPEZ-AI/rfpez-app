// Agent service layer for RFPEZ.AI Multi-Agent System
import { supabase } from '../supabaseClient';
import type { 
  Agent, 
  SessionAgent, 
  SessionActiveAgent,
  AgentWithActivity
} from '../types/database';

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
   * Get agents available to user (filters out restricted agents based on account setup)
   */
  static async getAvailableAgents(hasProperAccountSetup = false): Promise<Agent[]> {
    console.log('AgentService.getAvailableAgents called with hasProperAccountSetup:', hasProperAccountSetup);
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching available agents:', error);
      return [];
    }

    // Filter out restricted agents if user doesn't have proper account setup
    const availableAgents = hasProperAccountSetup 
      ? data || []
      : (data || []).filter(agent => !agent.is_restricted);

    console.log('Available agents filtered:', availableAgents);
    return availableAgents;
  }

  /**
   * Get the default agent
   */
  static async getDefaultAgent(): Promise<Agent | null> {
    console.log('AgentService.getDefaultAgent called');
    
    const { data, error } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .eq('is_default', true)
      .single();

    if (error) {
      console.error('Error fetching default agent:', error);
      // Fallback to first active agent if no default is set
      const agents = await this.getActiveAgents();
      return agents.length > 0 ? agents[0] : null;
    }

    console.log('Default agent fetched:', data);
    return data;
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
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching agent by ID:', error);
      return null;
    }

    return data;
  }

  /**
   * Get the currently active agent for a session
   */
  static async getSessionActiveAgent(sessionId: string): Promise<SessionActiveAgent | null> {
    console.log('AgentService.getSessionActiveAgent called with:', sessionId);
    
    const { data, error } = await supabase
      .rpc('get_session_active_agent', { session_uuid: sessionId });

    if (error) {
      console.error('Error fetching session active agent:', error);
      return null;
    }

    console.log('Session active agent:', data);
    return data && data.length > 0 ? data[0] : null;
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
    
    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (profileError || !userProfile) {
      console.error('User profile not found for Supabase user ID:', supabaseUserId);
      return false;
    }

    const { data, error } = await supabase
      .rpc('switch_session_agent', { 
        session_uuid: sessionId, 
        new_agent_uuid: agentId, 
        user_uuid: userProfile.id 
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
      .select()
      .single();

    if (error) {
      console.error('Error creating agent:', error);
      return null;
    }

    console.log('Agent created successfully:', data);
    return data;
  }

  /**
   * Update an agent (admin function)
   */
  static async updateAgent(
    agentId: string, 
    updates: Partial<Omit<Agent, 'id' | 'created_at' | 'updated_at'>>
  ): Promise<Agent | null> {
    console.log('AgentService.updateAgent called with:', { agentId, updates });
    
    const { data, error } = await supabase
      .from('agents')
      .update(updates)
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating agent:', error);
      return null;
    }

    console.log('Agent updated successfully:', data);
    return data;
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
