// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { Message, Session, Artifact } from '../types/home';
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
  currentRfpId: number | null;
  onDownloadArtifact: (artifact: Artifact) => void;
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
  currentRfpId,
  onDownloadArtifact
}) => {
  // For singleton artifact display, show the most recent artifact
  const currentArtifact = artifacts.length > 0 ? artifacts[artifacts.length - 1] : null;

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
        />
      </div>

      {/* Right Panel - Artifacts */}
      <ArtifactWindow
        artifact={currentArtifact}
        onDownload={onDownloadArtifact}
        currentRfpId={currentRfpId}
      />
    </div>
  );
};

export default HomeContent;
