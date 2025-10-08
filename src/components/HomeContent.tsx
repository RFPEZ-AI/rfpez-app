// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { Message, Session, Artifact, ArtifactReference } from '../types/home';
import { useIsMobile } from '../utils/useMediaQuery';
import SessionHistory from './SessionHistory';
import SessionDialog from './SessionDialog';
import ArtifactWindow from './ArtifactWindow';
import { ToolInvocationEvent } from '../types/streamingProtocol';

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
  onFormSave?: (artifact: Artifact, formData: Record<string, unknown>) => void;
  
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
  
  // Tool transparency props
  toolInvocations?: ToolInvocationEvent[];
  isToolExecutionActive?: boolean;
  
  // Session loading prop for auto-focus behavior
  isSessionLoading?: boolean;
  
  // Session loading prop
  forceScrollToBottom?: boolean;
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
  onFormSave,
  currentAgent,
  onCancelRequest,
  artifactWindowOpen = false,
  artifactWindowCollapsed = true,
  onToggleArtifactWindow, // eslint-disable-line @typescript-eslint/no-unused-vars
  onToggleArtifactCollapse,
  forceSessionHistoryCollapsed = false,
  onSessionHistoryToggle,
  // Tool transparency props
  toolInvocations = [],
  isToolExecutionActive = false,
  // Session loading props
  forceScrollToBottom = false,
  isSessionLoading = false
}) => {
  const isMobile = useIsMobile();
  // Use selected artifact based on window state if available, otherwise fall back to most recent
  const displayedArtifact = selectedArtifact || null;

  return (
    <div style={{ 
      flex: 1,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      overflow: 'hidden',
      minHeight: 0
      // No padding needed - parent container handles positioning
    }}>
      {!isMobile && (
        /* Left Panel - Session History (Desktop only) */
        <SessionHistory
          sessions={sessions}
          onNewSession={onNewSession}
          onSelectSession={onSelectSession}
          onDeleteSession={onDeleteSession}
          selectedSessionId={selectedSessionId}
          forceCollapsed={forceSessionHistoryCollapsed}
          onToggleExpanded={onSessionHistoryToggle}
        />
      )}

      {/* Center Panel - Dialog with integrated prompt */}
      <div style={{ 
        flex: 1, 
        overflow: 'hidden',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        {isMobile && (
          /* Left Panel - Session History (Mobile - top) */
          <div style={{
            maxHeight: forceSessionHistoryCollapsed ? '40px' : '200px', // Limit height to prevent excessive space usage
            flexShrink: 0, // Don't shrink below minimum
            transition: 'max-height 0.3s ease'
          }}>
            <SessionHistory
              sessions={sessions}
              onNewSession={onNewSession}
              onSelectSession={onSelectSession}
              onDeleteSession={onDeleteSession}
              selectedSessionId={selectedSessionId}
              forceCollapsed={forceSessionHistoryCollapsed}
              onToggleExpanded={onSessionHistoryToggle}
            />
          </div>
        )}
        
        {/* Message area - flex to accommodate artifact panel on mobile */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: isMobile ? '200px' : 0 // Ensure minimum space for messages on mobile
        }}>
          <SessionDialog
            messages={messages}
            isLoading={isLoading}
            onSendMessage={onSendMessage}
            onAttachFile={onAttachFile}
            promptPlaceholder="chat here..."
            onArtifactSelect={onArtifactSelect}
            currentAgent={currentAgent}
            onCancelRequest={onCancelRequest}
            toolInvocations={toolInvocations}
            isToolExecutionActive={isToolExecutionActive}
            forceScrollToBottom={forceScrollToBottom}
            isSessionLoading={isSessionLoading}
          />
        </div>

        {/* Right Panel - Artifacts (Desktop) or Bottom Panel (Mobile) */}
        <div style={{ 
          display: artifactWindowOpen ? 'block' : 'none',
          ...(isMobile && { 
            flexShrink: 0, // Prevent artifact from shrinking messages area to 0
            maxHeight: '50vh' // Limit artifact window to max 50% of viewport on mobile
          })
        }}>
          <ArtifactWindow
            artifact={displayedArtifact}
            artifacts={artifacts}
            onDownload={onDownloadArtifact}
            onFormSubmit={onFormSubmit}
            onFormSave={onFormSave}
            currentRfpId={currentRfpId}
            isCollapsed={artifactWindowCollapsed}
            onToggleCollapse={onToggleArtifactCollapse}
            onArtifactSelect={(artifact) => {
              if (onArtifactSelect) {
                // Convert Artifact to ArtifactReference
                const artifactRef: ArtifactReference = {
                  artifactId: artifact.id,
                  artifactName: artifact.name,
                  artifactType: artifact.type
                };
                onArtifactSelect(artifactRef);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default HomeContent;
