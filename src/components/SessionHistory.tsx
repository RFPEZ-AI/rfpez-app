import React, { useState, useEffect } from 'react';
import { IonButton, IonIcon, IonItem, IonLabel, IonList, IonActionSheet } from '@ionic/react';
import { add, chatbubbleOutline, chevronForward, chevronDown, trash } from 'ionicons/icons';
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
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  onNewSession,
  onSelectSession,
  onDeleteSession,
  selectedSessionId
}) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedSessionForAction, setSelectedSessionForAction] = useState<string | null>(null);

  // Set initial collapsed state based on screen size
  // On mobile/narrow screens (≤768px), start collapsed for better space utilization
  useEffect(() => {
    setIsExpanded(!isMobile);
  }, [isMobile]);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
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
      backgroundColor: 'var(--ion-background-color)'
    }}>
      {/* Header with collapse/expand and new session controls */}
      <div style={{ 
        padding: isExpanded ? '16px' : '8px', 
        borderBottom: '1px solid var(--ion-color-light-shade)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isExpanded ? 'flex-start' : 'center',
        gap: isExpanded ? '8px' : '4px',
        flexDirection: isExpanded ? 'row' : 'column'
      }}>
        {/* Collapse/Expand Button */}
        <IonButton 
          fill="clear" 
          size="small"
          onClick={toggleExpanded}
          title="Expand/collapse history"
          style={{ 
            '--padding-start': '8px', 
            '--padding-end': '8px',
            order: isExpanded ? 1 : 2
          }}
        >
          <IonIcon icon={isExpanded ? chevronDown : chevronForward} />
        </IonButton>

        {/* New Session Button - always visible but different styles */}
        {isExpanded ? (
          <IonButton 
            expand="block" 
            fill="outline" 
            onClick={onNewSession}
            title="Create new session"
            style={{ flex: 1, order: 2 }}
          >
            <IonIcon icon={add} slot="start" />
            New Session
          </IonButton>
        ) : (
          <IonButton 
            fill="solid" 
            onClick={onNewSession}
            title="Create new session"
            style={{ 
              '--padding-start': '8px', 
              '--padding-end': '8px',
              order: 1
            }}
          >
            <IonIcon icon={add} />
          </IonButton>
        )}
      </div>

      {/* Session List - only visible when expanded */}
      {isExpanded && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          <IonList>
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
