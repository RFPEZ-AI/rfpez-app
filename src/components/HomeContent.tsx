// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { Message, Session, Artifact, ArtifactReference } from '../types/home';
import SessionHistory from './SessionHistory';
import SessionDialog from './SessionDialog';
import ArtifactWindow from './ArtifactWindow';

interface HomeContentProps {
  // Session management
  sessions: Session[];
  selectedSessionId?: string;
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  
  // Message handling
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  
  // File handling
  onAttachFile: (file: File) => void;
  
  // Artifacts
  artifacts: Artifact[];
  selectedArtifact?: Artifact | null;
  currentRfpId: number | null;
  onDownloadArtifact: (artifact: Artifact) => void;
  onArtifactSelect?: (artifactRef: ArtifactReference) => void;
  onFormSubmit?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  
  // Agent and cancel functionality
  currentAgent?: { agent_name: string } | null;
  onCancelRequest?: () => void;
  
  // New props for artifact window state and responsive behavior
  artifactWindowOpen?: boolean;
  artifactWindowCollapsed?: boolean;
  onToggleArtifactWindow?: () => void;
  onToggleArtifactCollapse?: () => void;
  forceSessionHistoryCollapsed?: boolean;
  onSessionHistoryToggle?: (expanded: boolean) => void;
}

const HomeContent: React.FC<HomeContentProps> = ({
  sessions,
  selectedSessionId,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  messages,
  isLoading,
  onSendMessage,
  onAttachFile,
  artifacts,
  selectedArtifact,
  currentRfpId,
  onDownloadArtifact,
  onArtifactSelect,
  onFormSubmit,
  currentAgent,
  onCancelRequest,
  artifactWindowOpen = false,
  artifactWindowCollapsed = true,
  onToggleArtifactWindow, // eslint-disable-line @typescript-eslint/no-unused-vars
  onToggleArtifactCollapse,
  forceSessionHistoryCollapsed = false,
  onSessionHistoryToggle
}) => {
  // Use selected artifact based on window state if available, otherwise fall back to most recent
  const displayedArtifact = selectedArtifact || (artifacts.length > 0 ? artifacts[artifacts.length - 1] : null);

  return (
    <div style={{ 
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      minHeight: 0,
      paddingTop: '56px', // Account for header height
      paddingBottom: '40px' // Account for footer height
    }}>
      {/* Left Panel - Session History */}
      <SessionHistory
        sessions={sessions}
        onNewSession={onNewSession}
        onSelectSession={onSelectSession}
        onDeleteSession={onDeleteSession}
        selectedSessionId={selectedSessionId}
        forceCollapsed={forceSessionHistoryCollapsed}
        onToggleExpanded={onSessionHistoryToggle}
      />

      {/* Center Panel - Dialog with integrated prompt */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SessionDialog
          messages={messages}
          isLoading={isLoading}
          onSendMessage={onSendMessage}
          onAttachFile={onAttachFile}
          promptPlaceholder="chat here..."
          onArtifactSelect={onArtifactSelect}
          currentAgent={currentAgent}
          onCancelRequest={onCancelRequest}
        />
      </div>

      {/* Right Panel - Artifacts */}
      {artifactWindowOpen && (
        <ArtifactWindow
          artifact={displayedArtifact}
          onDownload={onDownloadArtifact}
          onFormSubmit={onFormSubmit}
          currentRfpId={currentRfpId}
          isCollapsed={artifactWindowCollapsed}
          onToggleCollapse={onToggleArtifactCollapse}
        />
      )}
    </div>
  );
};

export default HomeContent;
