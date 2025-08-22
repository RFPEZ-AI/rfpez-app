// TypeScript types for RFPEZ.AI Supabase database schema

export interface UserProfile {
  id: string; // UUID from auth.users
  email?: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  session_metadata?: Record<string, any>;
}

export interface SessionWithStats extends Session {
  message_count: number;
  last_message?: string;
  last_message_at?: string;
  artifact_count: number;
}

export interface Message {
  id: string; // UUID
  session_id: string; // UUID
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  message_order: number;
  metadata?: Record<string, any>;
  ai_metadata?: {
    model?: string;
    tokens_used?: number;
    response_time?: number;
    temperature?: number;
    [key: string]: any;
  };
}

export interface Artifact {
  id: string; // UUID
  session_id: string; // UUID
  message_id?: string; // UUID - optional, linked to specific message
  name: string;
  file_type: string; // 'pdf', 'docx', 'txt', etc.
  file_size?: number; // in bytes
  storage_path?: string; // Supabase storage path
  mime_type?: string;
  created_at: string;
  metadata?: Record<string, any>;
  processed_content?: string; // Extracted text content
  processing_status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface SessionArtifact {
  session_id: string;
  artifact_id: string;
  created_at: string;
}

// Database function return types
export interface SessionStats {
  id: string;
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message?: string;
  last_message_at?: string;
  artifact_count: number;
}

// Supabase client types for operations
export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<UserProfile, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      sessions: {
        Row: Session;
        Insert: Omit<Session, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Session, 'id' | 'user_id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Message, 'id' | 'session_id' | 'created_at'>>;
      };
      artifacts: {
        Row: Artifact;
        Insert: Omit<Artifact, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<Artifact, 'id' | 'session_id' | 'created_at'>>;
      };
      session_artifacts: {
        Row: SessionArtifact;
        Insert: Omit<SessionArtifact, 'created_at'> & {
          created_at?: string;
        };
        Update: never; // Junction table, no updates
      };
    };
    Functions: {
      get_sessions_with_stats: {
        Args: { user_uuid: string };
        Returns: SessionStats[];
      };
    };
  };
}

// Utility types for the app
export type MessageRole = Message['role'];
export type ProcessingStatus = Artifact['processing_status'];
export type FileType = string; // Could be more specific: 'pdf' | 'docx' | 'txt' | etc.
