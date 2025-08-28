import React from 'react';
import {
  IonButton,
  IonIcon,
  IonText,
  IonAvatar,
  IonChip,
  IonLabel
} from '@ionic/react';
import { 
  personOutline, 
  swapHorizontalOutline,
  informationCircleOutline
} from 'ionicons/icons';
import type { SessionActiveAgent } from '../types/database';
import './AgentIndicator.css';

interface AgentIndicatorProps {
  agent: SessionActiveAgent | null;
  onSwitchAgent: () => void;
  compact?: boolean;
  showSwitchButton?: boolean;
}

const AgentIndicator: React.FC<AgentIndicatorProps> = ({
  agent,
  onSwitchAgent,
  compact = false,
  showSwitchButton = true
}) => {
  if (!agent) {
    return (
      <IonChip className="agent-indicator no-agent" color="warning">
        <IonIcon icon={informationCircleOutline} />
        <IonLabel>No agent selected</IonLabel>
        {showSwitchButton && (
          <IonButton 
            fill="clear" 
            size="small" 
            onClick={onSwitchAgent}
          >
            Select Agent
          </IonButton>
        )}
      </IonChip>
    );
  }

  if (compact) {
    return (
      <IonChip 
        className="agent-indicator compact" 
        color="primary"
        onClick={showSwitchButton ? onSwitchAgent : undefined}
        style={{ cursor: showSwitchButton ? 'pointer' : 'default' }}
      >
        <IonAvatar>
          {agent.agent_avatar_url ? (
            <img src={agent.agent_avatar_url} alt={agent.agent_name} />
          ) : (
            <IonIcon icon={personOutline} />
          )}
        </IonAvatar>
        <IonLabel>
          <span className="agent-name-text">
            {agent.agent_name}
            <span className="agent-suffix"> agent</span>
          </span>
        </IonLabel>
        {showSwitchButton && <IonIcon icon={swapHorizontalOutline} />}
      </IonChip>
    );
  }

  return (
    <div className="agent-indicator full">
      <div className="agent-info">
        <IonAvatar className="agent-avatar">
          {agent.agent_avatar_url ? (
            <img src={agent.agent_avatar_url} alt={agent.agent_name} />
          ) : (
            <IonIcon icon={personOutline} />
          )}
        </IonAvatar>
        <div className="agent-details">
          <IonText color="dark">
            <h3 className="agent-name">
              <span className="agent-name-text">
                {agent.agent_name}
                <span className="agent-suffix"> agent</span>
              </span>
            </h3>
          </IonText>
          <IonText color="medium">
            <p className="agent-initial-prompt">&quot;{agent.agent_initial_prompt}&quot;</p>
          </IonText>
        </div>
      </div>
      {showSwitchButton && (
        <IonButton 
          fill="outline" 
          size="small" 
          onClick={onSwitchAgent}
          className="switch-button"
        >
          <IonIcon icon={swapHorizontalOutline} slot="start" />
          Switch Agent
        </IonButton>
      )}
    </div>
  );
};

export default AgentIndicator;
