// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import {
  IonButton,
  IonIcon,
  IonText,
  IonChip,
  IonLabel
} from '@ionic/react';
import { 
  swapHorizontalOutline,
  informationCircleOutline
} from 'ionicons/icons';
import type { SessionActiveAgent } from '../types/database';
import AgentAvatar from './AgentAvatar';
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
      <IonChip className="agent-indicator no-agent" color="warning" data-testid="agent-selector">
        <IonIcon icon={informationCircleOutline} />
        <IonLabel>
          <span>No agent selected</span>
          <IonText color="medium" style={{ fontSize: '0.75em', display: 'block', marginTop: '2px' }}>
            Check browser console for details
          </IonText>
        </IonLabel>
        {showSwitchButton && (
          <IonButton 
            fill="clear" 
            size="small" 
            onClick={onSwitchAgent}
            data-testid="select-agent-button"
            title="Select an agent to start chatting"
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
        data-testid="agent-selector"
        onClick={showSwitchButton ? onSwitchAgent : undefined}
        style={{ cursor: showSwitchButton ? 'pointer' : 'default' }}
      >
        <AgentAvatar
          agentName={agent.agent_name}
          avatarUrl={agent.agent_avatar_url}
          size="small"
        />
        <IonLabel>
          <span className="agent-name-text">
            {agent.agent_name}
            <span className="agent-suffix"> Agent</span>
          </span>
        </IonLabel>
        {showSwitchButton && <IonIcon icon={swapHorizontalOutline} />}
      </IonChip>
    );
  }

  return (
    <div className="agent-indicator full">
      <div className="agent-info">
        <AgentAvatar
          agentName={agent.agent_name}
          avatarUrl={agent.agent_avatar_url}
          size="medium"
          className="agent-avatar"
        />
        <div className="agent-details">
          <IonText color="dark">
            <h3 className="agent-name">
              <span className="agent-name-text">
                {agent.agent_name}
                <span className="agent-suffix"> Agent</span>
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
