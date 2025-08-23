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
  user_id: string; // UUID
  content: string;
  role: 'user' | 'assistant' | 'system';
  created_at: string;
  message_order: number;
  agent_id?: string; // UUID - which agent handled this message
  agent_name?: string; // Name of the agent that handled this message
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

// Multi-Agent System Types
export interface Agent {
  id: string; // UUID
  name: string;
  description?: string;
  instructions: string; // System instructions for the agent
  initial_prompt: string; // Initial greeting/prompt for users
  avatar_url?: string;
  is_active: boolean;
  is_default: boolean; // Identifies the default agent
  is_restricted: boolean; // Requires proper account setup to use
  sort_order: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export interface SessionAgent {
  id: string; // UUID
  session_id: string; // UUID
  agent_id: string; // UUID
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

export interface AgentWithActivity extends Agent {
  session_count?: number;
  last_used?: string;
}

export interface SessionActiveAgent {
  agent_id: string;
  agent_name: string;
  agent_instructions: string;
  agent_initial_prompt: string;
  agent_avatar_url?: string;
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
      agents: {
        Row: Agent;
        Insert: Omit<Agent, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<Agent, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      session_agents: {
        Row: SessionAgent;
        Insert: Omit<SessionAgent, 'id' | 'started_at'> & {
          id?: string;
          started_at?: string;
        };
        Update: Partial<Omit<SessionAgent, 'id' | 'session_id' | 'agent_id' | 'started_at'>>;
      };
    };
    Functions: {
      get_sessions_with_stats: {
        Args: { user_uuid: string };
        Returns: SessionStats[];
      };
      get_session_active_agent: {
        Args: { session_uuid: string };
        Returns: SessionActiveAgent[];
      };
      switch_session_agent: {
        Args: { 
          session_uuid: string; 
          new_agent_uuid: string; 
          user_uuid: string;
        };
        Returns: boolean;
      };
    };
  };
}

// Utility types for the app
export type MessageRole = Message['role'];
export type ProcessingStatus = Artifact['processing_status'];
export type FileType = string; // Could be more specific: 'pdf' | 'docx' | 'txt' | etc.
