// Copyright Mark Skiba, 2025 All rights reserved

import { supabase } from '../supabaseClient';
import type { UserProfile } from '../types/database';
import type { RFP } from '../types/rfp';

export class UserContextService {
  /**
   * Set the current RFP context for a user
   */
  static async setCurrentRfp(userId: string, rfpId: number | null): Promise<UserProfile | null> {
    console.log('🔄 Setting current RFP context for user:', userId, 'RFP ID:', rfpId);
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ current_rfp_id: rfpId })
        .eq('supabase_user_id', userId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error setting current RFP context:', error);
        return null;
      }
      
      console.log('✅ Current RFP context updated successfully');
      return data;
    } catch (error) {
      console.error('❌ Exception in setCurrentRfp:', error);
      return null;
    }
  }

  /**
   * Get the current RFP context for a user
   */
  static async getCurrentRfp(userId: string): Promise<RFP | null> {
    console.log('🔄 Getting current RFP context for user:', userId);
    
    try {
      // First get the user profile with current_rfp_id
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_rfp_id')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError || !profile?.current_rfp_id) {
        console.log('ℹ️ No current RFP context found for user');
        return null;
      }
      
      // Then get the RFP details
      const { data: rfp, error: rfpError } = await supabase
        .from('rfps')
        .select('*')
        .eq('id', profile.current_rfp_id)
        .single();
      
      if (rfpError) {
        console.error('❌ Error fetching current RFP:', rfpError);
        return null;
      }
      
      console.log('✅ Current RFP context retrieved successfully:', rfp?.name);
      return rfp;
    } catch (error) {
      console.error('❌ Exception in getCurrentRfp:', error);
      return null;
    }
  }

  /**
   * Clear the current RFP context for a user
   */
  static async clearCurrentRfp(userId: string): Promise<UserProfile | null> {
    return this.setCurrentRfp(userId, null);
  }

  /**
   * Get user profile with current RFP context
   */
  static async getUserProfileWithRfpContext(userId: string): Promise<{
    profile: UserProfile | null;
    currentRfp: RFP | null;
  }> {
    console.log('🔄 Getting user profile with RFP context for user:', userId);
    
    try {
      // Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('supabase_user_id', userId)
        .single();
      
      if (profileError) {
        console.error('❌ Error fetching user profile:', profileError);
        return { profile: null, currentRfp: null };
      }
      
      // Get current RFP if exists
      let currentRfp: RFP | null = null;
      if (profile.current_rfp_id) {
        const { data: rfp, error: rfpError } = await supabase
          .from('rfps')
          .select('*')
          .eq('id', profile.current_rfp_id)
          .single();
        
        if (!rfpError && rfp) {
          currentRfp = rfp;
        }
      }
      
      console.log('✅ User profile with RFP context retrieved successfully');
      return { profile, currentRfp };
    } catch (error) {
      console.error('❌ Exception in getUserProfileWithRfpContext:', error);
      return { profile: null, currentRfp: null };
    }
  }
}
