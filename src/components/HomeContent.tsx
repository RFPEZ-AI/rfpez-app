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
  
  // Agent and cancel functionality
  currentAgent?: { agent_name: string } | null;
  onCancelRequest?: () => void;
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
  currentAgent,
  onCancelRequest
}) => {
  // Use selected artifact or fall back to most recent
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
      <ArtifactWindow
        artifact={displayedArtifact}
        onDownload={onDownloadArtifact}
        currentRfpId={currentRfpId}
      />
    </div>
  );
};

export default HomeContent;
