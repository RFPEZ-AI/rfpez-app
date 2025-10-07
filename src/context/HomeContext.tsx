// Copyright Mark Skiba, 2025 All rights reserved

import React, { createContext, useContext, ReactNode } from 'react';
import { Message, Artifact, ArtifactReference } from '../types/home';
import { SessionActiveAgent, UserProfile } from '../types/database';
import { RFP } from '../types/rfp';
import { ToolInvocationEvent } from '../types/streamingProtocol';

// Define the comprehensive context interface
interface HomeContextType {
  // Authentication state
  isAuthenticated: boolean;
  user: { id: string } | null;
  userProfile: UserProfile | null;
  
  // Loading states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  // Session state
  currentSessionId: string | undefined;
  selectedSessionId: string | undefined;
  sessions: any[];
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  
  // Agent state
  currentAgent: SessionActiveAgent | null;
  agents: any[];
  showAgentSelector: boolean;
  setShowAgentSelector: (show: boolean) => void;
  
  // RFP state
  currentRfp: RFP | null;
  currentRfpId: string | undefined;
  rfps: RFP[];
  
  // Artifact state
  artifacts: Artifact[];
  selectedArtifact: Artifact | null;
  
  // Tool invocations
  toolInvocations: ToolInvocationEvent[];
  
  // UI state
  forceSessionHistoryCollapsed: boolean;
  setForceSessionHistoryCollapsed: (collapsed: boolean) => void;
  isCreatingNewSession: boolean;
  setIsCreatingNewSession: (creating: boolean) => void;
  
  // Modal states
  showAgentModal: boolean;
  showRFPModal: boolean;
  showRFPPreviewModal: boolean;
  showAgentsMenu: boolean;
  setShowAgentsMenu: (show: boolean) => void;
  showRFPMenu: boolean;
  setShowRFPMenu: (show: boolean) => void;
  
  // Artifact window state
  artifactWindowOpen: boolean;
  artifactWindowCollapsed: boolean;
  
  // Event handlers
  onSendMessage: (content: string) => Promise<void>;
  onNewSession: () => Promise<void>;
  onSelectSession: (sessionId: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => Promise<void>;
  onArtifactSelect: (artifactRef: ArtifactReference) => Promise<void>;
  onFormSubmit: (artifact: Artifact, formData: Record<string, unknown>) => Promise<void>;
  onDownloadArtifact: (artifact: Artifact) => Promise<void>;
  onAgentChanged: (agent: SessionActiveAgent) => Promise<void>;
  onViewBids: () => void;
  onMainMenuSelect: (item: string) => void;
  onCancelRequest: () => void;
  
  // RFP handlers
  onNewRFP: () => void;
  onEditRFP: (rfp: RFP) => void;
  onDeleteRFP: (rfpId: string) => Promise<void>;
  onPreviewRFP: (rfp: RFP) => void;
  onShareRFP: (rfp: RFP) => void;
  onSetCurrentRfp: (rfpId: string, rfpData?: RFP) => Promise<void>;
  onClearCurrentRfp: () => void;
  onSaveRFP: (values: any) => Promise<void>;
  onCancelRFP: () => void;
  onClosePreview: () => void;
  
  // Agent handlers
  onNewAgent: () => void;
  onEditAgent: (agent: any) => void;
  onDeleteAgent: (agentId: string) => Promise<void>;
  onSaveAgent: (agent: any) => Promise<void>;
  onCancelAgent: () => void;
  onSwitchAgent: () => void;
  
  // Artifact window handlers
  onToggleArtifactWindow: () => void;
  onToggleArtifactCollapse: () => void;
  onSessionHistoryToggle: (expanded: boolean) => void;
  
  // File handling
  onAttachFile: (file: File) => Promise<void>;
}

const HomeContext = createContext<HomeContextType | undefined>(undefined);

export const useHome = () => {
  const context = useContext(HomeContext);
  if (!context) {
    throw new Error('useHome must be used within a HomeProvider');
  }
  return context;
};

interface HomeProviderProps {
  children: ReactNode;
  value: HomeContextType;
}

export const HomeProvider: React.FC<HomeProviderProps> = ({ children, value }) => {
  return (
    <HomeContext.Provider value={value}>
      {children}
    </HomeContext.Provider>
  );
};

export default HomeContext;