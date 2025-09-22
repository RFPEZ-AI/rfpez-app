// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonActionSheet } from '@ionic/react';
import { create, chatbubbleOutline, chevronForward, chevronDown, trash } from 'ionicons/icons';
import { useIsMobile } from '../utils/useMediaQuery';

interface Session {
  id: string;
  title: string;
  timestamp: Date;
  agent_name?: string; // Name of the active agent for this session
}

interface SessionHistoryProps {
  sessions: Session[];
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  selectedSessionId?: string;
  // New props for responsive behavior
  forceCollapsed?: boolean; // Force collapse when artifact window needs space
  onToggleExpanded?: (expanded: boolean) => void; // Callback when expansion state changes
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  selectedSessionId,
  forceCollapsed = false,
  onToggleExpanded
}) => {
  const isMobile = useIsMobile();
  const [internalExpanded, setInternalExpanded] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedSessionForAction, setSelectedSessionForAction] = useState<string | null>(null);

  // Determine actual expanded state based on internal state
  // forceCollapsed now only triggers auto-collapse via useEffect, but manual expansion is always allowed
  const isExpanded = internalExpanded;

  // Auto-collapse when forceCollapsed becomes true
  useEffect(() => {
    if (forceCollapsed) {
      console.log('🔄 SessionHistory: Force collapsing due to forceCollapsed=true');
      setInternalExpanded(false);
    }
  }, [forceCollapsed]);

  // Initialize expanded state based on mobile detection
  useEffect(() => {
    console.log('🔄 SessionHistory: Initializing expanded state', { isMobile, forceCollapsed });
    // Only auto-expand if not force collapsed
    if (!forceCollapsed) {
      setInternalExpanded(true);
    }
  }, [isMobile]); // Only depend on isMobile, not forceCollapsed

  // Notify parent when expansion state changes
  useEffect(() => {
    onToggleExpanded?.(isExpanded);
  }, [isExpanded, onToggleExpanded]);

  const toggleExpanded = () => {
    // Allow toggle always, but force collapse may override it
    setInternalExpanded(!internalExpanded);
  };

  const handleSessionRightClick = (e: React.MouseEvent, sessionId: string) => {
    e.preventDefault();
    setSelectedSessionForAction(sessionId);
    setShowActionSheet(true);
  };

  const handleDeleteConfirm = () => {
    if (selectedSessionForAction) {
      onDeleteSession(selectedSessionForAction);
      setSelectedSessionForAction(null);
    }
    setShowActionSheet(false);
  };

  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid var(--ion-color-light-shade)',
      width: isExpanded ? '300px' : '60px',
      minWidth: isExpanded ? '300px' : '60px',
      transition: 'width 0.3s ease, min-width 0.3s ease',
      backgroundColor: 'var(--ion-background-color)',
      position: 'relative',
      zIndex: 1
      // No margin needed - parent container handles positioning
    }}>
      {/* Header with collapse/expand and new session controls */}
      <div style={{ 
        padding: isExpanded ? '8px 12px' : '4px', 
        borderBottom: '1px solid var(--ion-color-light-shade)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'space-between' : 'center',
        gap: '4px',
        flexDirection: 'row',
        minHeight: isExpanded ? '40px' : '32px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--ion-background-color)',
        zIndex: 2
      }}>
        {/* Collapse/Expand Button */}
        <IonButton 
          fill="clear" 
          size="small"
          onClick={toggleExpanded}
          title="Expand/collapse history"
          style={{ 
            '--padding-start': '4px', 
            '--padding-end': '4px',
            order: 1,
            minWidth: isExpanded ? '32px' : '24px',
            height: isExpanded ? '32px' : '24px'
          }}
        >
          <IonIcon icon={isExpanded ? chevronDown : chevronForward} />
        </IonButton>

        {/* New Session Button - always visible but different styles */}
        {isExpanded ? (
          <IonButton 
            fill="clear" 
            size="small"
            onClick={onNewSession}
            title="Create new session"
            style={{ 
              '--padding-start': '4px', 
              '--padding-end': '4px',
              order: 2,
              minWidth: '32px',
              height: '32px'
            }}
          >
            <IonIcon icon={create} />
          </IonButton>
        ) : (
          <IonButton 
            fill="clear" 
            size="small"
            onClick={onNewSession}
            title="Create new session"
            style={{ 
              '--padding-start': '4px', 
              '--padding-end': '4px',
              order: 2,
              minWidth: '24px',
              height: '24px'
            }}
          >
            <IonIcon icon={create} />
          </IonButton>
        )}
      </div>

      {/* Session List - only visible when expanded */}
      {isExpanded && (
        <div style={{ 
          flex: 1, 
          overflow: 'auto',
          // On mobile, limit the session list height to prevent taking too much space
          maxHeight: isMobile ? '160px' : 'none'
        }}>
          <IonList style={{
            // More compact styling on mobile
            '--ion-item-min-height': isMobile ? '40px' : '48px'
          }}>
            {sessions.map((session) => (
              <IonItem
                key={session.id}
                button
                onClick={() => onSelectSession(session.id)}
                onContextMenu={(e) => handleSessionRightClick(e, session.id)}
                color={selectedSessionId === session.id ? 'primary' : undefined}
                style={{ 
                  cursor: 'pointer',
                  '--hover-opacity': '0.8'
                }}
                title="Right-click for options"
              >
                <IonIcon icon={chatbubbleOutline} slot="start" />
                <IonLabel>
                  <h3>{session.title}</h3>
                  <p>{session.agent_name || 'No Agent'}</p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>

          {/* Action Sheet for Delete Confirmation */}
          <IonActionSheet
            isOpen={showActionSheet}
            onDidDismiss={() => setShowActionSheet(false)}
            header="Session Actions"
            buttons={[
              {
                text: 'Delete Session',
                role: 'destructive',
                icon: trash,
                handler: handleDeleteConfirm
              },
              {
                text: 'Cancel',
                role: 'cancel'
              }
            ]}
          />
        </div>
      )}
    </div>
  );
};

export default SessionHistory;
