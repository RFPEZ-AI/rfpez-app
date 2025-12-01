// Copyright Mark Skiba, 2025 All rights reserved

// TypeScript types for RFPEZ.AI Supabase database schema

export type UserRole = 'user' | 'developer' | 'administrator';

export interface UserProfile {
  id?: string; // UUID from auth.users - optional for fallback cases
  supabase_user_id: string; // UUID reference to auth.users
  email?: string;
  full_name?: string;
  avatar_url?: string;
  role: UserRole;
  current_session_id?: string; // Foreign key to sessions table
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string; // UUID
  user_id: string; // UUID
  account_id: string; // UUID - Account this session belongs to (required)
  title: string;
  description?: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  session_metadata?: Record<string, unknown>;
  current_rfp_id?: number; // Reference to current RFP
  current_artifact_id?: string; // Reference to current artifact
  current_agent_id?: string; // Reference to current agent
  specialty_site_id?: string; // UUID - Reference to specialty site for context isolation
}

export interface SessionWithStats extends Session {
  message_count: number;
  last_message?: string;
  last_message_at?: string;
  artifact_count: number;
  agent_name?: string; // Name of the active agent for this session
}

export interface FileAttachment {
  memory_id: string; // UUID reference to account_memories
  file_name: string;
  file_type: string; // 'document', 'spreadsheet', 'image', 'pdf', etc.
  file_size: number; // bytes
  uploaded_at: string; // ISO timestamp
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
  metadata?: Record<string, unknown>;
  ai_metadata?: {
    model?: string;
    tokens_used?: number;
    response_time?: number;
    temperature?: number;
    [key: string]: unknown;
  };
  file_attachments?: FileAttachment[]; // Files uploaded with this message
}

export interface Artifact {
  id: string; // UUID
  user_id?: string; // UUID
  session_id?: string; // UUID
  message_id?: string; // UUID - optional, linked to specific message
  name: string;
  description?: string;
  type: string; // 'form', 'document', 'image', etc.
  file_type?: string; // 'pdf', 'docx', 'txt', etc.
  file_size?: number; // in bytes
  storage_path?: string; // Supabase storage path
  mime_type?: string;
  schema?: Record<string, unknown>; // JSON schema for forms
  ui_schema?: Record<string, unknown>; // UI schema for forms
  default_values?: Record<string, unknown>; // Default/pre-filled form values
  submit_action?: Record<string, unknown>; // Submit action for forms
  is_template?: boolean;
  template_category?: string;
  template_tags?: string[];
  artifact_role: string;
  status?: string;
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed';
  processed_content?: string; // Extracted text content
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
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
  role?: string; // Functional role of the agent (e.g., sales, design, support, assistant)
  instructions: string; // System instructions for the agent
  initial_prompt: string; // Initial greeting/prompt for users
  avatar_url?: string;
  is_active: boolean;
  is_default: boolean; // Identifies the default agent
  is_restricted: boolean; // Requires proper account setup to use
  is_free: boolean; // Available to authenticated users without billing
  sort_order: number;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, unknown>;
  specialty?: string | null; // Specialty site identifier (e.g., 'corporate-tmc-rfp', 'respond')
  parent_agent_id?: string | null; // UUID reference to parent agent for inheritance
  is_abstract?: boolean; // If true, agent is abstract and not directly selectable
}

export interface SessionAgent {
  id: string; // UUID
  session_id: string; // UUID
  agent_id: string; // UUID
  started_at: string;
  ended_at?: string;
  is_active: boolean;
}

export interface SpecialtySite {
  id: string; // UUID
  name: string;
  slug: string;
  description?: string;
  hero_title?: string;
  hero_subtitle?: string;
  is_default: boolean;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface SpecialtySiteAgent {
  id: string; // UUID
  specialty_site_id: string; // UUID
  agent_id: string; // UUID
  is_default_agent: boolean;
  sort_order: number;
  created_at: string;
}

export interface AgentWithActivity extends Agent {
  session_count?: number;
  last_used?: string;
}

export interface SessionActiveAgent {
  agent_id: string;
  agent_name: string;
  agent_role?: string;
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
      specialty_sites: {
        Row: SpecialtySite;
        Insert: Omit<SpecialtySite, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<SpecialtySite, 'id' | 'created_at'>> & {
          updated_at?: string;
        };
      };
      specialty_site_agents: {
        Row: SpecialtySiteAgent;
        Insert: Omit<SpecialtySiteAgent, 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Omit<SpecialtySiteAgent, 'id' | 'specialty_site_id' | 'agent_id' | 'created_at'>>;
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
