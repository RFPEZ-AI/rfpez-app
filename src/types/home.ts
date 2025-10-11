// Copyright Mark Skiba, 2025 All rights reserved

import { RFP } from './rfp';
import { SessionActiveAgent } from './database';

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
  artifacts?: Artifact[]; // All available artifacts for dropdown
  onDownload?: (artifact: Artifact) => void;
  onFormSubmit?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  onFormSave?: (artifact: Artifact, formData: Record<string, unknown>) => void; // Save form data without validation
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  currentRfpId?: number | null;
  onArtifactSelect?: (artifact: Artifact) => void; // Function to handle artifact selection
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
  status?: 'ready' | 'processing' | 'error' | string;
  // Form-specific fields (required for form data population)
  schema?: Record<string, unknown>;
  ui_schema?: Record<string, unknown>;
  default_values?: Record<string, unknown>;
  submit_action?: Record<string, unknown>;
}

// RFP Context State for managing current RFP
export interface RFPContextState {
  currentRfpId?: string;
  currentRfp: RFP | null;
  setCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>;
  clearCurrentRfp: () => Promise<void>;
}

// Provider props for HomeProvider
export interface HomeProviderProps {
  children: React.ReactNode;
  hooks: {
    session: Session | null;
    setSession: (session: Session | null) => void;
    currentRfpId?: string;
    setCurrentRfpId: (rfpId: string | undefined) => void;
    currentRfp: RFP | null;
    setCurrentRfp: (rfp: RFP | null) => void;
    sessionActiveAgent: SessionActiveAgent | null;
    setSessionActiveAgent: (agent: SessionActiveAgent | null) => void;
    messages: Message[];
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    isLoading: boolean;
    setIsLoading: (loading: boolean) => void;
    error: string | null;
    setError: (error: string | null) => void;
    showArtifactWindow: boolean;
    setShowArtifactWindow: (show: boolean) => void;
    selectedArtifact: Artifact | null;
    setSelectedArtifact: (artifact: Artifact | null) => void;
    debugMode: boolean;
    setDebugMode: (debug: boolean) => void;
    formData: Record<string, any>;
    setFormData: (data: Record<string, any>) => void;
    isSubmittingForm: boolean;
    setIsSubmittingForm: (submitting: boolean) => void;
  };
  agents: any[];
  artifacts: Artifact[];
  setArtifacts: (artifacts: Artifact[]) => void;
  loadSessionArtifacts: (sessionId: string) => Promise<any>;
}

// Context interface for HomeProvider
export interface HomeContext {
  // Session state
  session: Session | null;
  sessionId?: string;
  currentRfpId?: string;
  currentRfp: RFP | null;
  sessionActiveAgent: SessionActiveAgent | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  
  // UI state
  showArtifactWindow: boolean;
  setShowArtifactWindow: (show: boolean) => void;
  selectedArtifact: Artifact | null;
  setSelectedArtifact: (artifact: Artifact | null) => void;
  debugMode: boolean;
  setDebugMode: (debug: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  newSessionTitle: string;
  setNewSessionTitle: (title: string) => void;
  isCreatingSession: boolean;
  formData: Record<string, any>;
  setFormData: (data: Record<string, any>) => void;
  isSubmittingForm: boolean;
  
  // RFP context
  rfpContext: RFPContextState;
  
  // Handlers
  handleCreateSession: (title?: string) => Promise<string | null>;
  handleLoadSession: (sessionId: string) => Promise<void>;
  handleAgentChanged: (agent: SessionActiveAgent) => Promise<Message | null>;
  handleArtifactSelect: (artifactRef: any) => Promise<void>;
  handleDownloadArtifact: (artifact: Artifact) => Promise<void>;
  handleFormSubmit: (artifact: Artifact, formData: Record<string, any>, autoPrompt?: string) => Promise<void>;
  addSystemMessage: (content: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  
  // Data
  agents: any[];
  artifacts: Artifact[];
}
