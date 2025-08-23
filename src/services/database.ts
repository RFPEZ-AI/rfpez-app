// Database service layer for RFPEZ.AI
import { supabase } from '../supabaseClient';
import type { 
  Session, 
  Message, 
  Artifact, 
  SessionWithStats,
  UserProfile,
  Database 
} from '../types/database';

export class DatabaseService {
  // Session operations
  static async createSession(auth0UserId: string, title: string, description?: string): Promise<Session | null> {
    console.log('DatabaseService.createSession called with:', { auth0UserId, title, description });
    
    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth0_id', auth0UserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Auth0 ID:', auth0UserId);
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

  static async getUserSessions(auth0UserId: string): Promise<SessionWithStats[]> {
    console.log('DatabaseService.getUserSessions called for auth0UserId:', auth0UserId);
    
    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth0_id', auth0UserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Auth0 ID:', auth0UserId);
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

    // Map to SessionWithStats format (simplified for now)
    const sessionStats: SessionWithStats[] = (sessions || []).map(session => ({
      ...session,
      message_count: 0,
      last_message: 'No messages yet',
      last_message_at: session.created_at,
      artifact_count: 0
    } as SessionWithStats));

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
    auth0UserId: string,
    content: string, 
    role: 'user' | 'assistant' | 'system',
    metadata?: Record<string, any>,
    aiMetadata?: Record<string, any>
  ): Promise<Message | null> {
    console.log('DatabaseService.addMessage called with:', {
      sessionId,
      auth0UserId,
      content,
      role,
      metadata,
      aiMetadata
    });

    // First get the user profile to get the internal ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('auth0_id', auth0UserId)
      .single();

    console.log('User profile lookup:', { userProfile, profileError });

    if (profileError || !userProfile) {
      console.error('User profile not found for Auth0 ID:', auth0UserId);
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
        metadata: metadata || {},
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

  // Artifact operations
  static async addArtifact(
    sessionId: string,
    messageId: string | null,
    name: string,
    fileType: string,
    fileSize?: number,
    storagePath?: string,
    mimeType?: string,
    metadata?: Record<string, any>
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
    const updates: any = { processing_status: status };
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
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
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
    await DatabaseService.addMessage(session.id, 'Analyze this RFP document', 'user');

    // Add AI response with metadata
    await DatabaseService.addMessage(
      session.id,
      'I\'ve analyzed the document...',
      'assistant',
      {},
      { model: 'gpt-4', tokens_used: 150, response_time: 2.3 }
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
