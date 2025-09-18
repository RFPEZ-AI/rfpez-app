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
  static async createSession(supabaseUserId: string, title: string, description?: string): Promise<Session | null> {
    console.log('DatabaseService.createSession called with:', { supabaseUserId, title, description });
    
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

    console.log('Attempting to insert session into database...');
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userProfile.id,
        title,
        description
      })
      .select()
      .single();

    console.log('Insert session result:', { data, error });
    
    if (error) {
      console.error('Error creating session:', error);
      return null;
    }
    return data;
  }

  static async createSessionWithAgent(
    supabaseUserId: string, 
    title: string, 
    agentId?: string,
    description?: string
  ): Promise<Session | null> {
    console.log('DatabaseService.createSessionWithAgent called with:', { 
      supabaseUserId, title, agentId, description 
    });

    // Create the session first
    const session = await this.createSession(supabaseUserId, title, description);
    if (!session) {
      return null;
    }

    // Initialize with agent (use default if none specified)
    if (agentId) {
      await AgentService.setSessionAgent(session.id, agentId, supabaseUserId);
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

    // Get active agent for each session
    const sessionStats: SessionWithStats[] = await Promise.all(
      (sessions || []).map(async (session) => {
        // Get the active agent for this session
        const activeAgent = await AgentService.getSessionActiveAgent(session.id);
        
        return {
          ...session,
          message_count: 0,
          last_message: 'No messages yet',
          last_message_at: session.created_at,
          artifact_count: 0,
          agent_name: activeAgent?.agent_name || 'No Agent'
        } as SessionWithStats;
      })
    );

    return sessionStats;
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
    artifactRefs?: ArtifactReference[]
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

    console.log('Attempting to insert message into database...');
    const { data, error } = await supabase
      .from('messages')
      .insert({
        session_id: sessionId,
        user_id: userProfile.id,
        content,
        role,
        message_order: nextOrder,
        agent_id: agentId,
        agent_name: agentName,
        metadata: { 
          ...(metadata || {}),
          artifactRefs: artifactRefs || []
        },
        ai_metadata: aiMetadata || {}
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
          submission_data: submissionData,
          status: 'submitted'
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
  static async setUserCurrentSession(sessionId: string): Promise<boolean> {
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
    return data;
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
              form_data,
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
          role,
          artifacts:artifact_id (
            id,
            name,
            type,
            schema,
            ui_schema,
            form_data,
            submit_action,
            created_at
          )
        `)
        .eq('rfp_id', rfpId)
        .eq('role', role);

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
          role: role
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
