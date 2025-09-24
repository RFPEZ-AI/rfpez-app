// Copyright Mark Skiba, 2025 All rights reserved

// Local interfaces for UI compatibility
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
  artifactRefs?: ArtifactReference[]; // References to artifacts mentioned in this message
  metadata?: Record<string, unknown>; // Additional metadata for the message
  isToolProcessing?: boolean; // True if this is a tool processing indicator message
}

export interface ArtifactReference {
  artifactId: string;
  artifactName: string;
  artifactType: 'document' | 'text' | 'image' | 'pdf' | 'form' | 'bid_view' | 'other';
  isCreated?: boolean; // True if this message created the artifact
  displayText?: string; // Optional custom display text for the reference
}

// Singleton artifact window props
export interface SingletonArtifactWindowProps {
  artifact: Artifact | null; // Single artifact to display
  onDownload?: (artifact: Artifact) => void;
  onFormSubmit?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentRfpId?: number | null;
  onArtifactSelect?: (artifact: Artifact) => void; // New function to handle artifact selection
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
  type: 'document' | 'text' | 'image' | 'pdf' | 'form' | 'bid_view' | 'other';
  size: string;
  url?: string;
  content?: string;
  // Metadata for session-based artifacts
  sessionId?: string;
  messageId?: string;
  isReferencedInSession?: boolean;
  // Metadata for RFP-linked artifacts (new schema)
  rfpId?: number;
  role?: 'buyer' | 'supplier' | 'system';
}
