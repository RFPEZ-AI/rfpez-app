import React from 'react';
import { IonButton, IonIcon, IonItem, IonLabel, IonList } from '@ionic/react';
import { add, chatbubbleOutline } from 'ionicons/icons';

interface Session {
  id: string;
  title: string;
  timestamp: Date;
}

interface SessionHistoryProps {
  sessions: Session[];
  onNewSession: () => void;
  onSelectSession: (sessionId: string) => void;
  selectedSessionId?: string;
}

const SessionHistory: React.FC<SessionHistoryProps> = ({
  sessions,
  onNewSession,
  onSelectSession,
  selectedSessionId
}) => {
  return (
    <div style={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      borderRight: '1px solid var(--ion-color-light-shade)'
    }}>
      {/* New Session Button */}
      <div style={{ padding: '16px', borderBottom: '1px solid var(--ion-color-light-shade)' }}>
        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={onNewSession}
        >
          <IonIcon icon={add} slot="start" />
          New Session
        </IonButton>
      </div>

      {/* Session List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <IonList>
          {sessions.map((session) => (
            <IonItem
              key={session.id}
              button
              onClick={() => onSelectSession(session.id)}
              color={selectedSessionId === session.id ? 'primary' : undefined}
            >
              <IonIcon icon={chatbubbleOutline} slot="start" />
              <IonLabel>
                <h3>{session.title}</h3>
                <p>{session.timestamp.toLocaleDateString()} at {session.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </IonLabel>
            </IonItem>
          ))}
        </IonList>
      </div>
    </div>
  );
};

export default SessionHistory;
