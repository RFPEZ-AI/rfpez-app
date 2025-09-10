// Copyright Mark Skiba, 2025 All rights reserved

// Local interfaces for UI compatibility
export interface Message {
  id: string;
  content: string;
  isUser: boolean;
  timestamp: Date;
  agentName?: string; // Agent name for assistant messages
  artifactRefs?: ArtifactReference[]; // References to artifacts mentioned in this message
}

export interface ArtifactReference {
  artifactId: string;
  artifactName: string;
  artifactType: 'document' | 'image' | 'pdf' | 'form' | 'other';
  isCreated?: boolean; // True if this message created the artifact
}

// Singleton artifact window props
export interface SingletonArtifactWindowProps {
  artifact: Artifact | null; // Single artifact to display
  onDownload?: (artifact: Artifact) => void;
  onFormSubmit?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentRfpId?: number | null;
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
  // Metadata for session-based artifacts
  sessionId?: string;
  messageId?: string;
  isReferencedInSession?: boolean;
}
