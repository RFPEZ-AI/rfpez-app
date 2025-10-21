// Copyright Mark Skiba, 2025 All rights reserved

// Database service layer for RFPEZ.AI
import { supabase } from '../supabaseClient';
import type { 
  Session, 
  Message, 
  Artifact, 
  SessionWithStats,
  UserProfile,
  UserRole
} from '../types/database';
import type { ArtifactReference } from '../types/home';

// Import AgentService statically - circular dependency should be resolved by module system
import { AgentService } from './agentService';

export class DatabaseService {
  // Helper function to validate UUID format
  private static isValidUuid(str: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  // Session operations
  static async createSession(supabaseUserId: string, title: string, description?: string, currentRfpId?: number): Promise<Session | null> {
    console.log('DatabaseService.createSession called with:', { supabaseUserId, title, description, currentRfpId });
    
    // Get the user profile and their account_id via user_accounts junction table
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        id,
        user_accounts!inner(account_id)
      `)
      .eq('supabase_user_id', supabaseUserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Supabase user ID:', supabaseUserId);
      return null;
    }

    // Extract account_id from user_accounts junction table
    const accountId = (userProfile.user_accounts as any)?.[0]?.account_id;
    if (!accountId) {
      console.error('No account found for user profile:', userProfile.id);
      return null;
    }

    console.log('Attempting to insert session into database with account_id:', accountId);
    const sessionData: Omit<Session, 'id' | 'created_at' | 'updated_at' | 'is_archived'> = {
      user_id: userProfile.id, // Use the user_profiles.id (internal UUID)
      account_id: accountId,   // ✅ CRITICAL FIX: Include account_id from user_accounts
      title,
      description
    };
    
    // Add current RFP ID if provided
    if (currentRfpId) {
      sessionData.current_rfp_id = currentRfpId;
      console.log('Setting session current_rfp_id to:', currentRfpId);
    }
    
    const { data, error } = await supabase
      .from('sessions')
      .insert(sessionData)
      .select()
      .single();

    console.log('Insert session result:', { data, error });
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    // ✅ NO WELCOME MESSAGE STORAGE: Agent activation handled in UI only
    // The "Activating..." message persists until the user's first interaction
    // This prevents showing welcome_prompt text that gets immediately replaced
    console.log('✅ Session created without initial welcome message:', data.id);

    return data;
  }

  static async createSessionWithAgent(
    supabaseUserId: string, 
    title: string, 
    agentId?: string,
    description?: string,
    currentRfpId?: number
  ): Promise<Session | null> {
    console.log('DatabaseService.createSessionWithAgent called with:', { 
      supabaseUserId, title, agentId, description, currentRfpId 
    });

    // Create the session first
    const session = await this.createSession(supabaseUserId, title, description, currentRfpId);
    if (!session) {
      return null;
    }

    // Initialize with agent (use default if none specified)
    let agentAssignmentSuccess = false;
    if (agentId) {
      agentAssignmentSuccess = await AgentService.setSessionAgent(session.id, agentId, supabaseUserId);
      
      if (!agentAssignmentSuccess) {
        console.error('[DatabaseService] Failed to assign agent to session, retrying...', { sessionId: session.id, agentId });
        
        // Retry once
        agentAssignmentSuccess = await AgentService.setSessionAgent(session.id, agentId, supabaseUserId);
        if (!agentAssignmentSuccess) {
          console.error('[DatabaseService] Failed to assign agent after retry, using default agent', { sessionId: session.id, agentId });
          await AgentService.initializeSessionWithDefaultAgent(session.id, supabaseUserId);
        }
      }
    } else {
      await AgentService.initializeSessionWithDefaultAgent(session.id, supabaseUserId);
    }

    return session;
  }

  static async getUserSessions(supabaseUserId: string): Promise<SessionWithStats[]> {
    console.log('DatabaseService.getUserSessions called for supabaseUserId:', supabaseUserId);
    
    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Supabase user ID:', supabaseUserId);
      return [];
    }

    console.log('Fetching sessions directly from sessions table...');
    // Use direct query instead of RPC for now to debug
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select(`
        id,
        user_id,
        title,
        description,
        created_at,
        updated_at,
        is_archived
      `)
      .eq('user_id', userProfile.id)
      .order('updated_at', { ascending: false });

    console.log('getUserSessions result:', { sessions, error });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    // Get active agent and message count for each session
    const sessionStats: SessionWithStats[] = await Promise.all(
      (sessions || []).map(async (session) => {
        // Get the active agent for this session
        const activeAgent = await AgentService.getSessionActiveAgent(session.id);
        
        // Get actual message count
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('session_id', session.id);
        
        return {
          ...session,
          message_count: messageCount || 0,
          last_message: 'No messages yet',
          last_message_at: session.created_at,
          artifact_count: 0,
          agent_name: activeAgent?.agent_name || 'No Agent'
        } as SessionWithStats;
      })
    );

    // Filter out empty sessions with initial_prompt-style titles
    // These are sessions that were created but never used (no user messages)
    const filteredSessions = sessionStats.filter(session => {
      // Keep sessions that have messages
      if (session.message_count > 0) return true;
      
      // Filter out sessions with initial_prompt-style titles (agent welcome messages)
      const hasInitialPromptTitle = 
        session.title.includes('You are the') && 
        session.title.includes('agent welcoming');
      
      // Keep empty sessions with user-friendly titles like "Chat Session"
      // But exclude empty sessions with initial_prompt titles
      return !hasInitialPromptTitle;
    });

    return filteredSessions;
  }

  static async getSession(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    return data;
  }

  static async updateSession(sessionId: string, updates: Partial<Session>): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .update(updates)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session:', error);
      return null;
    }
    return data;
  }

  static async deleteSession(sessionId: string): Promise<boolean> {
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      console.error('Error deleting session:', error);
      return false;
    }
    return true;
  }

  // Session context management
  static async updateSessionContext(
    sessionId: string, 
    context: { 
      current_rfp_id?: number | null; 
      current_artifact_id?: string | null;
      current_agent_id?: string | null;
    }
  ): Promise<Session | null> {
    console.log('DatabaseService.updateSessionContext called with:', { sessionId, context });
    
    const { data, error } = await supabase
      .from('sessions')
      .update(context)
      .eq('id', sessionId)
      .select()
      .single();

    if (error) {
      console.error('Error updating session context:', error);
      return null;
    }
    
    console.log('Session context updated successfully:', data);
    return data;
  }

  static async getSessionWithContext(sessionId: string): Promise<Session | null> {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        rfps!current_rfp_id(id, name, description),
        artifacts!current_artifact_id(id, name, type, processed_content),
        agents!current_agent_id(id, name, description, role)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching session with context:', error);
      return null;
    }
    return data;
  }

  // User profile context management
  static async updateUserProfileContext(
    supabaseUserId: string,
    context: {
      current_agent_id?: string | null;
      current_session_id?: string | null;
    }
  ): Promise<UserProfile | null> {
    console.log('DatabaseService.updateUserProfileContext called with:', { supabaseUserId, context });
    
    const { data, error } = await supabase
      .from('user_profiles')
      .update(context)
      .eq('supabase_user_id', supabaseUserId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile context:', error);
      return null;
    }
    
    console.log('User profile context updated successfully:', data);
    return data;
  }

  static async getUserProfileWithContext(supabaseUserId: string): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(`
        *,
        current_agent:current_agent_id(id, name, description, role),
        current_session:current_session_id(id, title, created_at)
      `)
      .eq('supabase_user_id', supabaseUserId)
      .single();

    if (error) {
      console.error('Error fetching user profile with context:', error);
      return null;
    }
    return data;
  }

  // Message operations
  static async addMessage(
      sessionId: string, 
      supabaseUserId: string,
      content: string, 
      role: 'user' | 'assistant' | 'system',
      agentId?: string,
      agentName?: string,
      metadata?: Record<string, unknown>,
      aiMetadata?: Record<string, unknown>,
      artifactRefs?: ArtifactReference[],
      hidden?: boolean
    ): Promise<Message | null> {
    console.log('DatabaseService.addMessage called with:', {
      sessionId,
      supabaseUserId,
      content,
      role,
      agentId,
      agentName,
      metadata,
      aiMetadata
    });

    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('supabase_user_id', supabaseUserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Supabase user ID:', supabaseUserId);
      return null;
    }

    // Get the next message order - simplified approach
    console.log('Getting message count for session...');
    const { count, error: countError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId);

    console.log('Message count result:', { count, countError });

    const nextOrder = (count || 0) + 1;
    console.log('Next message order:', nextOrder);

    // Get the session's account_id
    console.log('Getting session account_id...');
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('account_id')
      .eq('id', sessionId)
      .single();

    console.log('Session data:', { sessionData, sessionError });

    if (sessionError || !sessionData?.account_id) {
      console.error('Session not found or missing account_id:', sessionId);
      return null;
    }

    console.log('Attempting to insert message into database...');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userProfile.id,
        account_id: sessionData.account_id,
        content,
        role,
        message_order: nextOrder,
        agent_id: agentId,
        agent_name: agentName,
        metadata: { 
          ...(metadata || {}),
          artifactRefs: artifactRefs || []
        },
        ai_metadata: aiMetadata || {},
        hidden: hidden === true ? true : false
      })
      .select()
      .single();

    console.log('addMessage result:', { data, error });

    if (error) {
      console.error('Error adding message:', error);
      return null;
    }

    // Update session timestamp
    console.log('Updating session timestamp...');
    await this.updateSession(sessionId, { updated_at: new Date().toISOString() });

    return data;
  }

  static async getSessionMessages(sessionId: string): Promise<Message[]> {
    console.log('Fetching messages for session:', sessionId);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    console.log('Database query result:', { data, error });
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    console.log('Returning messages:', data || []);
    return data || [];
  }

  static async deleteMessage(messageId: string): Promise<boolean> {
    const { error } = await supabase
      .from('messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      console.error('Error deleting message:', error);
      return false;
    }
    return true;
  }

  static async updateMessage(sessionId: string, messageId: string, updates: { metadata?: Record<string, unknown>; content?: string }): Promise<boolean> {
    // Validate that messageId is a UUID format (messages table uses UUID primary key)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(messageId)) {
      console.warn('⚠️ Skipping message update - messageId is not UUID format:', messageId, '(expected for frontend-generated messages)');
      return true; // Return true to prevent error cascading
    }

    console.log('Updating message:', messageId, 'with updates:', updates);
    const { error } = await supabase
      .from('messages')
      .update(updates)
      .eq('id', messageId)
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating message:', error);
      return false;
    }
    return true;
  }

  // Artifact operations
  static async addArtifact(
    sessionId: string,
    messageId: string | null,
    name: string,
    fileType: string,
    fileSize?: number,
    storagePath?: string,
    mimeType?: string,
    metadata?: Record<string, unknown>
  ): Promise<Artifact | null> {
    const { data, error } = await supabase
      .from('artifacts')
      .insert({
        session_id: sessionId,
        message_id: messageId,
        name,
        file_type: fileType,
        file_size: fileSize,
        storage_path: storagePath,
        mime_type: mimeType,
        metadata: metadata || {},
        processing_status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding artifact:', error);
      return null;
    }

    // Link artifact to session
    await supabase
      .from('session_artifacts')
      .insert({
        session_id: sessionId,
        artifact_id: data.id
      });

    return data;
  }

  static async getSessionArtifacts(sessionId: string): Promise<Artifact[]> {
    const { data, error } = await supabase
      .from('artifacts')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching artifacts:', error);
      return [];
    }
    return data || [];
  }

  static async updateArtifactProcessingStatus(
    artifactId: string, 
    status: 'pending' | 'processing' | 'completed' | 'failed',
    processedContent?: string
  ): Promise<Artifact | null> {
    const updates: Record<string, unknown> = { processing_status: status };
    if (processedContent !== undefined) {
      updates.processed_content = processedContent;
    }

    const { data, error } = await supabase
      .from('artifacts')
      .update(updates)
      .eq('id', artifactId)
      .select()
      .single();

    if (error) {
      console.error('Error updating artifact:', error);
      return null;
    }
    return data;
  }

  // Get latest submission for an artifact (updated for consolidated schema)
  static async getLatestSubmission(artifactId: string, sessionId?: string): Promise<Record<string, unknown> | null> {
    try {
      console.log('📥 Getting latest submission for artifact:', artifactId);
      
      // Try using the RPC function first (new consolidated schema)
      try {
        const { data, error } = await supabase
          .rpc('get_latest_submission', { 
            artifact_id_param: artifactId,
            session_id_param: sessionId || null
          });

        if (!error && data) {
          console.log('✅ Got submission data from RPC function');
          return data as Record<string, unknown>;
        }
      } catch (rpcError) {
        console.log('📝 RPC function not available, falling back to manual query...');
      }

      // Fallback: Try new artifact_submissions table
      const tableName = 'artifact_submissions';
      let query = supabase
        .from(tableName)
        .select('submission_data')
        .eq('artifact_id', artifactId)
        .order('submitted_at', { ascending: false })
        .limit(1);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      let { data, error } = await query;

      // If new table doesn't exist or no data found, try legacy approach
      if (error || !data || data.length === 0) {
        console.log('📝 New submission table not found or empty, trying legacy artifact_submissions...');
        
        // Only query if artifactId is a valid UUID format for legacy table
        if (!this.isValidUuid(artifactId)) {
          console.log('📋 Artifact ID is not a UUID format, skipping legacy submission lookup:', artifactId);
          return null;
        }

        query = supabase
          .from('artifact_submissions')
          .select('submission_data')
          .eq('artifact_id', artifactId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (sessionId) {
          query = query.eq('session_id', sessionId);
        }

        const result = await query;
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('❌ Error loading submission:', error);
        return null;
      }

      const submissionData = data && data.length > 0 ? data[0].submission_data : null;
      console.log('✅ Found submission data:', !!submissionData);
      return submissionData as Record<string, unknown> | null;
    } catch (error) {
      console.error('❌ Exception loading submission:', error);
      return null;
    }
  }

  static async saveArtifactSubmission(
    artifactId: string, 
    submissionData: Record<string, unknown>,
    sessionId?: string,
    userId?: string
  ): Promise<boolean> {
    try {
      // Only save if artifactId is a valid UUID - form artifacts have string IDs that aren't UUIDs
      if (!this.isValidUuid(artifactId)) {
        console.log('📋 Artifact ID is not a UUID format, skipping submission save:', artifactId);
        return true; // Return true to indicate "successful" operation (no error)
      }

      const { error } = await supabase
        .from('artifact_submissions')
        .insert({
          artifact_id: artifactId,
          session_id: sessionId || null, // Use null instead of 'current'
          user_id: userId || null,
          submission_data: submissionData
          // Note: Removed 'status' field as it doesn't exist in the current schema
        });

      if (error) {
        // Check for specific error types and provide appropriate handling
        if (error.code === '42P01') {
          // Table does not exist
          console.warn('⚠️ artifact_submissions table does not exist yet - skipping submission save');
          return true; // Return true to prevent error cascading
        } else if (error.code === '42501') {
          // Insufficient privileges (RLS policy issue)
          console.warn('⚠️ Insufficient privileges to save artifact submission - this may be expected for anonymous users');
          return true; // Return true to prevent error cascading
        } else {
          console.warn('Could not save artifact submission:', error.message, 'Code:', error.code);
        }
        return false;
      }

      console.log('✅ Artifact submission saved successfully for:', artifactId);
      return true;
    } catch (err) {
      console.warn('Error saving artifact submission:', err);
      return false;
    }
  }

  static async deleteArtifact(artifactId: string): Promise<boolean> {
    const { error } = await supabase
      .from('artifacts')
      .delete()
      .eq('id', artifactId);

    if (error) {
      console.error('Error deleting artifact:', error);
      return false;
    }
    return true;
  }

  // Form save operations (draft mode - no validation)
  static async saveFormData(
    artifactId: string,
    formData: Record<string, unknown>,
    userId?: string
  ): Promise<{ success: boolean; saveCount?: number; lastSavedAt?: string }> {
    try {
      console.log('💾 Saving form data for artifact:', artifactId);
      
      // Use the database function for atomic save operation
      const { data, error } = await supabase
        .rpc('save_form_data', {
          artifact_id_param: artifactId,
          form_data_param: formData,
          user_id_param: userId || null
        });

      if (error) {
        console.error('❌ Error saving form data:', error);
        return { success: false };
      }

      if (!data) {
        console.warn('⚠️ No artifact found to save data to:', artifactId);
        return { success: false };
      }

      // Get updated artifact info for confirmation
      const { data: artifactData } = await supabase
        .from('artifacts')
        .select('save_count, last_saved_at')
        .eq('id', artifactId)
        .single();

      console.log('✅ Form data saved successfully for artifact:', artifactId);
      
      return {
        success: true,
        saveCount: artifactData?.save_count || undefined,
        lastSavedAt: artifactData?.last_saved_at || undefined
      };
    } catch (err) {
      console.error('❌ Exception saving form data:', err);
      return { success: false };
    }
  }

  static async getFormData(artifactId: string): Promise<Record<string, unknown> | null> {
    try {
      console.log('📥 Getting form data for artifact:', artifactId);
      
      // Use the database function to get form data (draft + fallback)
      const { data, error } = await supabase
        .rpc('get_form_data', {
          artifact_id_param: artifactId
        });

      if (error) {
        console.error('❌ Error getting form data:', error);
        return null;
      }

      console.log('✅ Form data retrieved for artifact:', artifactId);
      return data as Record<string, unknown> | null;
    } catch (err) {
      console.error('❌ Exception getting form data:', err);
      return null;
    }
  }

  static async getFormSaveStats(artifactId: string): Promise<{
    saveCount: number;
    lastSavedAt: string | null;
    dataStatus: 'has_draft' | 'has_data' | 'empty';
  } | null> {
    try {
      const { data, error } = await supabase
        .from('form_save_stats')
        .select('save_count, last_saved_at, data_status')
        .eq('artifact_id', artifactId)
        .single();

      if (error) {
        console.error('❌ Error getting form save stats:', error);
        return null;
      }

      return {
        saveCount: data.save_count || 0,
        lastSavedAt: data.last_saved_at || null,
        dataStatus: data.data_status || 'empty'
      };
    } catch (err) {
      console.error('❌ Exception getting form save stats:', err);
      return null;
    }
  }

  // User profile operations
  static async createOrUpdateUserProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({
        id: user.id,
        email: user.email,
        ...profile
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }
    return data;
  }

  static async getUserProfile(): Promise<UserProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('supabase_user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  }

  static async updateUserRole(userId: string, role: UserRole): Promise<UserProfile | null> {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ 
        role,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating user role:', error);
      return null;
    }
    return data;
  }

  // Current session management for user profiles
  static async setUserCurrentSession(sessionId: string | null): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .rpc('set_user_current_session', {
        user_uuid: user.id,
        session_uuid: sessionId
      });

    if (error) {
      console.error('Error setting current session:', error);
      return false;
    }
    return true;
  }

  static async getUserCurrentSession(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .rpc('get_user_current_session', {
        user_uuid: user.id
      });

    if (error) {
      console.error('Error getting current session:', error);
      return null;
    }
    
    // RPC returns a single UUID string, not an array
    if (data && typeof data === 'string') {
      console.log('✅ getUserCurrentSession returning session ID:', data);
      return data;
    }
    
    console.log('ℹ️ getUserCurrentSession: No current session found');
    return null;
  }

  // File storage operations (for artifacts)
  static async uploadFile(file: File, sessionId: string): Promise<string | null> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${sessionId}/${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('artifacts')
      .upload(fileName, file);

    if (error) {
      console.error('Error uploading file:', error);
      return null;
    }
    return data.path;
  }

  static async downloadFile(storagePath: string): Promise<Blob | null> {
    const { data, error } = await supabase.storage
      .from('artifacts')
      .download(storagePath);

    if (error) {
      console.error('Error downloading file:', error);
      return null;
    }
    return data;
  }

  static async getFileUrl(storagePath: string): Promise<string | null> {
    const { data } = supabase.storage
      .from('artifacts')
      .getPublicUrl(storagePath);

    return data.publicUrl;
  }

  // Form Artifacts Management - Updated for consolidated schema
  static async getFormArtifacts(userId?: string | null): Promise<unknown[]> {
    console.log('📥 Loading form artifacts from database for user:', userId || 'anonymous');
    
    try {
      // Try new consolidated artifacts table first
      const { error: newTableError } = await supabase
        .from('artifacts')
        .select('id', { count: 'exact', head: true })
        .eq('type', 'form')
        .limit(1);

      if (newTableError) {
        console.warn('⚠️ Artifacts table not found:', newTableError.message);
        console.log('📝 Please ensure the schema migration has been applied: database/migration-consolidate-schema.sql');
        return [];
      }

      console.log('✅ Using artifacts table for form artifacts...');

      // If user is authenticated, get their artifacts + anonymous ones
      // If not authenticated, only get anonymous ones
      let formArtifacts: unknown[] = [];
      
      if (userId) {
        // Get user's artifacts
        const { data: userArtifacts, error: userError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('type', 'form')
          .eq('status', 'active')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (userError) {
          console.error('❌ Error loading user form artifacts:', userError);
        } else {
          formArtifacts = [...formArtifacts, ...(userArtifacts || [])];
        }

        // Get anonymous artifacts
        const { data: anonArtifacts, error: anonError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('type', 'form')
          .eq('status', 'active')
          .is('user_id', null)
          .order('created_at', { ascending: false });

        if (anonError) {
          console.error('❌ Error loading anonymous form artifacts:', anonError);
        } else {
          formArtifacts = [...formArtifacts, ...(anonArtifacts || [])];
        }
      } else {
        // Only get anonymous artifacts
        const { data: anonArtifacts, error: anonError } = await supabase
          .from('artifacts')
          .select('*')
          .eq('type', 'form')
          .eq('status', 'active')
          .is('user_id', null)
          .order('created_at', { ascending: false });

        if (anonError) {
          console.error('❌ Error loading anonymous form artifacts:', anonError);
          return [];
        }
        formArtifacts = anonArtifacts || [];
      }

      // Sort combined results by created_at descending
      formArtifacts.sort((a: unknown, b: unknown) => {
        const itemA = a as { created_at: string };
        const itemB = b as { created_at: string };
        const dateA = new Date(itemA.created_at).getTime();
        const dateB = new Date(itemB.created_at).getTime();
        return dateB - dateA;
      });

      console.log(`✅ Loaded ${formArtifacts?.length || 0} form artifacts from database`);
      return formArtifacts || [];
    } catch (error) {
      console.error('❌ Exception loading form artifacts:', error);
      return [];
    }
  }

  // RFP-Artifacts relationship management (new consolidated schema)
  static async getRFPArtifacts(rfpId: number): Promise<unknown[]> {
    console.log('📥 Loading artifacts for RFP:', rfpId);
    
    try {
      // Try using the new consolidated schema first
      const { data, error } = await supabase
        .rpc('get_rfp_artifacts', { rfp_id_param: rfpId });

      if (error) {
        console.warn('⚠️ RPC function not found, falling back to manual query...');
        
        // Fallback to manual join query
        const { data: artifactData, error: joinError } = await supabase
          .from('rfp_artifacts')
          .select(`
            role,
            artifacts:artifact_id (
              id,
              name,
              type,
              schema,
              ui_schema,
              default_values,
              created_at
            )
          `)
          .eq('rfp_id', rfpId);

        if (joinError) {
          console.error('❌ Error loading RFP artifacts:', joinError);
          return [];
        }

        return artifactData || [];
      }

      console.log(`✅ Loaded ${data?.length || 0} artifacts for RFP ${rfpId}`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception loading RFP artifacts:', error);
      return [];
    }
  }

  // Get artifacts by role for an RFP
  static async getRFPArtifactsByRole(rfpId: number, role: string): Promise<unknown[]> {
    console.log('📥 Loading artifacts for RFP:', rfpId, 'with role:', role);
    
    try {
      const { data, error } = await supabase
        .from('rfp_artifacts')
        .select(`
          artifact_role,
          artifacts:artifact_id (
            id,
            name,
            type,
            schema,
            ui_schema,
            default_values,
            submit_action,
            created_at
          )
        `)
        .eq('rfp_id', rfpId)
        .eq('artifact_role', role);

      if (error) {
        console.error('❌ Error loading RFP artifacts by role:', error);
        return [];
      }

      console.log(`✅ Loaded ${data?.length || 0} artifacts for RFP ${rfpId} with role ${role}`);
      return data || [];
    } catch (error) {
      console.error('❌ Exception loading RFP artifacts by role:', error);
      return [];
    }
  }

  // Link an artifact to an RFP with a specific role
  static async linkArtifactToRFP(rfpId: number, artifactId: string, role: string): Promise<boolean> {
    console.log('🔗 Linking artifact', artifactId, 'to RFP', rfpId, 'with role', role);
    
    try {
      const { error } = await supabase
        .from('rfp_artifacts')
        .insert({
          rfp_id: rfpId,
          artifact_id: artifactId,
          artifact_role: role
        });

      if (error) {
        console.error('❌ Error linking artifact to RFP:', error);
        return false;
      }

      console.log('✅ Successfully linked artifact to RFP');
      return true;
    } catch (error) {
      console.error('❌ Exception linking artifact to RFP:', error);
      return false;
    }
  }

  // Artifact management methods (complementing Claude tools)
  
  /**
   * List artifacts with optional scope filtering
   * @param sessionId Optional session ID to filter artifacts
   * @param allArtifacts If true, returns all user artifacts regardless of session
   * @param artifactType Optional artifact type filter
   * @param limit Maximum number of artifacts to return
   */
  static async listArtifacts({
    sessionId,
    allArtifacts = false,
    artifactType,
    limit = 50,
  }: {
    sessionId?: string;
    allArtifacts?: boolean;
    artifactType?: string;
    limit?: number;
  }): Promise<Artifact[]> {
    try {
      let query = supabase
        .from('artifacts')
        .select('id, name, type, description, artifact_role, created_at, updated_at, status, session_id')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!allArtifacts && sessionId) {
        // Session-scoped artifacts
        query = query.eq('session_id', sessionId);
      } else if (!allArtifacts) {
        // No session specified and not all artifacts - return empty
        return [];
      }
      // For all artifacts, we return all active artifacts (user filtering handled by RLS)

      if (artifactType) {
        query = query.eq('type', artifactType);
      }

      const { data: artifacts, error } = await query;

      if (error) {
        console.error('❌ Error listing artifacts:', error);
        throw error;
      }

      return artifacts || [];
    } catch (error) {
      console.error('❌ Exception listing artifacts:', error);
      throw error;
    }
  }

  /**
   * Get the current artifact ID for a session
   * @param sessionId Session ID to get current artifact for
   */
  static async getCurrentArtifactId(sessionId?: string): Promise<string | null> {
    try {
      if (!sessionId) {
        return null;
      }

      // Try to get current artifact from session context
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('context')
        .eq('id', sessionId)
        .single();

      if (sessionError) {
        console.warn('⚠️ Could not retrieve session context:', sessionError);
      }

      let currentArtifactId = null;
      if (sessionData?.context && typeof sessionData.context === 'object') {
        const context = sessionData.context as Record<string, unknown>;
        currentArtifactId = context.current_artifact_id as string || null;
      }

      // If no current artifact in context, get the most recent artifact for the session
      if (!currentArtifactId) {
        const { data: artifacts, error: artifactsError } = await supabase
          .from('artifacts')
          .select('id')
          .eq('session_id', sessionId)
          .eq('status', 'active')
          .order('created_at', { ascending: false })
          .limit(1);

        if (!artifactsError && artifacts && artifacts.length > 0) {
          currentArtifactId = artifacts[0].id;
        }
      }

      return currentArtifactId;
    } catch (error) {
      console.error('❌ Exception getting current artifact ID:', error);
      throw error;
    }
  }

  /**
   * Select an artifact to be displayed in the artifact window
   * @param artifactId ID of the artifact to select
   * @param sessionId Optional session ID to update context
   */
  static async selectActiveArtifact(artifactId: string, sessionId?: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      // Verify the artifact exists and get its details
      const { data: artifact, error: artifactError } = await supabase
        .from('artifacts')
        .select('id, name, type, session_id, status')
        .eq('id', artifactId)
        .single();

      if (artifactError || !artifact) {
        return {
          success: false,
          error: 'Artifact not found'
        };
      }

      if (artifact.status !== 'active') {
        return {
          success: false,
          error: 'Artifact is not active'
        };
      }

      // If sessionId is provided, update the session context
      if (sessionId) {
        // Get current session context
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('context')
          .eq('id', sessionId)
          .single();

        let context = {};
        if (!sessionError && sessionData?.context) {
          context = sessionData.context as Record<string, unknown>;
        }

        // Update context with current artifact
        const updatedContext = {
          ...context,
          current_artifact_id: artifactId
        };

        const { error: updateError } = await supabase
          .from('sessions')
          .update({ context: updatedContext })
          .eq('id', sessionId);

        if (updateError) {
          console.warn('⚠️ Failed to update session context:', updateError);
        }
      }

      return {
        success: true,
        message: `Active artifact set to: ${artifact.name}`
      };
    } catch (error) {
      console.error('❌ Exception selecting active artifact:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export default DatabaseService;

// Example usage (commented out to avoid compilation errors)
/*
async function exampleUsage() {
  try {
    // Create a new session
    const session = await DatabaseService.createSession('RFP Analysis Session');
    if (!session) {
      throw new Error('Failed to create session');
    }

    // Add user message
    await DatabaseService.addMessage(session.id, supabaseUserId, 'Analyze this RFP document', 'user');

    // Add AI response with metadata
    await DatabaseService.addMessage(
      session.id,
      supabaseUserId,
      'I\'ve analyzed the document...',
      'assistant',
      undefined, // agentId
      undefined, // agentName
      {}, // metadata
      { model: 'gpt-4', tokens_used: 150, response_time: 2.3 } // aiMetadata
    );

    // Upload and link artifact (example)
    const file = new File(['content'], 'example.pdf', { type: 'application/pdf' });
    const storagePath = await DatabaseService.uploadFile(file, session.id);
    if (storagePath) {
      await DatabaseService.addArtifact(session.id, null, file.name, 'pdf', file.size, storagePath);
    }

    console.log('Database operations completed successfully');
  } catch (error) {
    console.error('Database operation failed:', error);
  }
}
*/
