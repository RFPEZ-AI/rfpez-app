// Copyright Mark Skiba, 2025 All rights reserved

// Local interfaces for UI compatibility
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
}

export interface Session {
  id: string;
  title: string;
  timestamp: Date;
  agent_name?: string; // Name of the active agent for this session
}

export interface Artifact {
  id: string;
  name: string;
  type: 'document' | 'image' | 'pdf' | 'form' | 'other';
  size: string;
  url?: string;
  content?: string;
}
