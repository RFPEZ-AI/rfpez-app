// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import type { UserProfile, SessionActiveAgent } from '../types/database';

export class UserContextService {
  /**
   * Set the current session context for a user
   */
  static async setCurrentSession(userId: string, sessionId: string | null): Promise<UserProfile | null> {
    console.log('📝 Setting current session context for user:', userId, 'Session ID:', sessionId);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ current_session_id: sessionId })
        .eq('supabase_user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error setting current session context:', error);
        return null;
      }
      
      console.log('✅ Current session context updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Exception in setCurrentSession:', error);
      return null;
    }
  }

  /**
   * Get the current agent context for a user via their current session
   */
  static async getCurrentAgent(userId: string): Promise<SessionActiveAgent | null> {
    console.log('🔄 Getting current agent context via session for user:', userId);
    
    try {
      // Get the user's current session and its agent
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          current_session_id,
          sessions:current_session_id (
            current_agent_id,
            agents:current_agent_id (*)
          )
        `)
        .eq('supabase_user_id', userId)
        .single();
      
      if (error) {
        console.error('❌ Error fetching current agent via session:', error);
        return null;
      }
      
      // Extract the agent from the nested structure
      const sessionData = data?.sessions as { agents?: SessionActiveAgent } | null;
      const agent = sessionData?.agents;
      
      if (!agent) {
        console.log('ℹ️ No current agent found via session for user');
        return null;
      }
      
      console.log('✅ Current agent context retrieved via session:', agent.agent_name);
      return agent;
    } catch (error) {
      console.error('❌ Exception in getCurrentAgent:', error);
      return null;
    }
  }

  /**
   * Get the current session context for a user  
   */
  static async getCurrentSession(userId: string): Promise<string | null> {
    console.log('🔄 Getting current session context for user:', userId);
    
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_session_id')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError || !profile?.current_session_id) {
        console.log('ℹ️ No current session context found for user');
        return null;
      }
      
      console.log('✅ Current session context retrieved successfully:', profile.current_session_id);
      return profile.current_session_id;
    } catch (error) {
      console.error('❌ Exception in getCurrentSession:', error);
      return null;
    }
  }

  /**
   * Clear the current session context for a user (this also clears agent context)
   */
  static async clearCurrentSession(userId: string): Promise<UserProfile | null> {
    return this.setCurrentSession(userId, null);
  }

  /**
   * Get user profile with full context (session and derived agent)
   */
  static async getUserProfileWithContext(userId: string): Promise<{
    profile: UserProfile | null;
    currentAgent: SessionActiveAgent | null;
    currentSessionId: string | null;
  }> {
    console.log('🔄 Getting user profile with full context for user:', userId);
    
    try {
      // Get user profile with session and agent data
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          sessions:current_session_id (
            id,
            current_agent_id,
            agents:current_agent_id (*)
          )
        `)
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        return { profile: null, currentAgent: null, currentSessionId: null };
      }
      
      // Extract agent from session
      const sessionData = profile?.sessions as { agents?: SessionActiveAgent } | null;
      const currentAgent = sessionData?.agents || null;
      const currentSessionId = profile.current_session_id || null;
      
      console.log('✅ User profile with context retrieved successfully');
      return { 
        profile, 
        currentAgent, 
        currentSessionId 
      };
    } catch (error) {
      console.error('❌ Exception in getUserProfileWithContext:', error);
      return { profile: null, currentAgent: null, currentSessionId: null };
    }
  }
}