// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import { SpecialtySite, Agent } from '../types/database';

/**
 * Service for managing specialty procurement vertical sites
 * Handles fetching specialty sites and their associated agents
 */
export class SpecialtySiteService {
  /**
   * Get all active specialty sites
   */
  static async getActiveSpecialtySites(): Promise<SpecialtySite[]> {
    console.log('SpecialtySiteService.getActiveSpecialtySites called');
    
    try {
      const { data, error } = await supabase
        .from('specialty_sites')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching specialty sites:', error);
        throw error;
      }

      console.log('✅ Fetched specialty sites:', data?.length || 0);
      return data || [];
    } catch (err) {
      console.error('Unexpected error in getActiveSpecialtySites:', err);
      throw err;
    }
  }

  /**
   * Get a specialty site by slug
   */
  static async getSpecialtySiteBySlug(slug: string): Promise<SpecialtySite | null> {
    console.log('SpecialtySiteService.getSpecialtySiteBySlug called with slug:', slug);
    
    try {
      const { data, error } = await supabase
        .from('specialty_sites')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - specialty site not found
          console.log('⚠️ Specialty site not found for slug:', slug);
          return null;
        }
        console.error('Error fetching specialty site:', error);
        throw error;
      }

      console.log('✅ Fetched specialty site:', data?.name);
      return data;
    } catch (err) {
      console.error('Unexpected error in getSpecialtySiteBySlug:', err);
      throw err;
    }
  }

  /**
   * Get the default specialty site (home page)
   */
  static async getDefaultSpecialtySite(): Promise<SpecialtySite | null> {
    console.log('SpecialtySiteService.getDefaultSpecialtySite called');
    
    try {
      const { data, error } = await supabase
        .from('specialty_sites')
        .select('*')
        .eq('is_default', true)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching default specialty site:', error);
        throw error;
      }

      console.log('✅ Fetched default specialty site:', data?.name);
      return data;
    } catch (err) {
      console.error('Unexpected error in getDefaultSpecialtySite:', err);
      throw err;
    }
  }

  /**
   * Get agents for a specific specialty site
   * Uses the database function for optimal performance
   */
  static async getAgentsForSpecialtySite(siteSlug: string): Promise<Agent[]> {
    console.log('SpecialtySiteService.getAgentsForSpecialtySite called with slug:', siteSlug);
    
    try {
      const { data, error } = await supabase
        .rpc('get_specialty_site_agents', { site_slug: siteSlug });

      if (error) {
        console.error('Error fetching agents for specialty site:', error);
        throw error;
      }

      // Map the RPC result to Agent type
      const agents: Agent[] = (data || []).map((row: any) => ({
        id: row.agent_id,
        name: row.agent_name,
        description: row.agent_description,
        instructions: row.agent_instructions,
        initial_prompt: row.agent_initial_prompt,
        avatar_url: row.agent_avatar_url,
        is_active: row.is_active,
        is_default: row.is_default,
        sort_order: row.sort_order,
        // Add other Agent fields with defaults
        is_restricted: false,
        is_free: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      console.log('✅ Fetched agents for specialty site:', agents.length);
      return agents;
    } catch (err) {
      console.error('Unexpected error in getAgentsForSpecialtySite:', err);
      throw err;
    }
  }

  /**
   * Get the default agent for a specialty site
   */
  static async getDefaultAgentForSpecialtySite(siteSlug: string): Promise<Agent | null> {
    console.log('SpecialtySiteService.getDefaultAgentForSpecialtySite called with slug:', siteSlug);
    
    try {
      // Get specialty site first
      const site = await this.getSpecialtySiteBySlug(siteSlug);
      if (!site) {
        console.warn('⚠️ Specialty site not found, cannot get default agent');
        return null;
      }

      // Get agents for the site
      const agents = await this.getAgentsForSpecialtySite(siteSlug);
      
      // Find the default agent
      const defaultAgent = agents.find(agent => agent.is_default);
      
      if (!defaultAgent && agents.length > 0) {
        // Fallback to first agent if no default set
        console.warn('⚠️ No default agent set for specialty site, using first agent');
        return agents[0];
      }

      console.log('✅ Default agent for specialty site:', defaultAgent?.name);
      return defaultAgent || null;
    } catch (err) {
      console.error('Unexpected error in getDefaultAgentForSpecialtySite:', err);
      throw err;
    }
  }

  /**
   * Debug helper to log all specialty sites and their agents
   */
  static async debugSpecialtySites(): Promise<void> {
    console.log('🔍 SpecialtySiteService Debug Information:');
    
    try {
      const sites = await this.getActiveSpecialtySites();
      console.log('Total active specialty sites:', sites.length);
      
      for (const site of sites) {
        console.log(`\n📍 Specialty Site: ${site.name} (${site.slug})`);
        console.log(`   Default: ${site.is_default}, Active: ${site.is_active}`);
        console.log(`   Hero: ${site.hero_title}`);
        
        const agents = await this.getAgentsForSpecialtySite(site.slug);
        console.log(`   Agents (${agents.length}):`);
        agents.forEach((agent, idx) => {
          console.log(`     ${idx + 1}. ${agent.name}${agent.is_default ? ' (DEFAULT)' : ''}`);
        });
      }
    } catch (err) {
      console.error('Error in debugSpecialtySites:', err);
    }
  }
}
