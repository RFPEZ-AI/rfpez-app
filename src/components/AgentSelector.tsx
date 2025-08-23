import React, { useState, useEffect } from 'react';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCol,
  IonGrid,
  IonIcon,
  IonItem,
  IonLabel,
  IonModal,
  IonRow,
  IonText,
  IonToolbar,
  IonTitle,
  IonContent,
  IonHeader,
  IonButtons,
  IonAvatar,
  IonSkeletonText,
  IonToast
} from '@ionic/react';
import { 
  closeOutline, 
  personOutline, 
  chatbubbleOutline,
  checkmarkCircle,
  informationCircleOutline
} from 'ionicons/icons';
import { AgentService } from '../services/agentService';
import type { Agent, SessionActiveAgent } from '../types/database';
import './AgentSelector.css';

interface AgentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  auth0UserId: string;
  currentAgent?: SessionActiveAgent | null;
  onAgentChanged: (agent: SessionActiveAgent) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  isOpen,
  onClose,
  sessionId,
  auth0UserId,
  currentAgent,
  onAgentChanged
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadAgents();
    }
  }, [isOpen]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const activeAgents = await AgentService.getActiveAgents();
      setAgents(activeAgents);
    } catch (error) {
      console.error('Error loading agents:', error);
      setToastMessage('Failed to load agents');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  const handleAgentSelect = async (agent: Agent) => {
    if (switching || agent.id === currentAgent?.agent_id) {
      return;
    }

    try {
      setSwitching(agent.id);
      
      // Check if this is preview mode (no real session)
      if (sessionId === 'preview') {
        // In preview mode, just update the current agent without saving to database
        const previewAgent: SessionActiveAgent = {
          agent_id: agent.id,
          agent_name: agent.name,
          agent_instructions: agent.instructions,
          agent_initial_prompt: agent.initial_prompt,
          agent_avatar_url: agent.avatar_url
        };
        onAgentChanged(previewAgent);
        setToastMessage(`Selected ${agent.name}`);
        setShowToast(true);
        onClose();
      } else {
        // Normal mode with real session
        const success = await AgentService.setSessionAgent(sessionId, agent.id, auth0UserId);
        
        if (success) {
          // Get the updated active agent
          const newActiveAgent = await AgentService.getSessionActiveAgent(sessionId);
          if (newActiveAgent) {
            onAgentChanged(newActiveAgent);
            setToastMessage(`Switched to ${agent.name}`);
            setShowToast(true);
            onClose();
          }
        } else {
          setToastMessage('Failed to switch agent');
          setShowToast(true);
        }
      }
    } catch (error) {
      console.error('Error switching agent:', error);
      setToastMessage('Failed to switch agent');
      setShowToast(true);
    } finally {
      setSwitching(null);
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {sessionId === 'preview' ? 'Preview AI Agent' : 'Select AI Agent'}
            </IonTitle>
            <IonButtons slot="end">
              <IonButton fill="clear" onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="agent-selector-content">
            <IonText color="medium">
              <p style={{ padding: '16px', margin: 0, textAlign: 'center' }}>
                Choose the AI agent that best fits your needs. Each agent is specialized for different types of assistance.
              </p>
            </IonText>

            <IonGrid>
              <IonRow>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <IonCol size="12" sizeMd="6" sizeLg="4" key={index}>
                      <IonCard>
                        <IonCardHeader>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <IonAvatar>
                              <IonSkeletonText animated />
                            </IonAvatar>
                            <IonSkeletonText animated style={{ width: '60%' }} />
                          </div>
                        </IonCardHeader>
                        <IonCardContent>
                          <IonSkeletonText animated />
                          <IonSkeletonText animated />
                          <IonSkeletonText animated style={{ width: '80%' }} />
                        </IonCardContent>
                      </IonCard>
                    </IonCol>
                  ))
                ) : (
                  // Agent cards
                  agents.map((agent) => {
                    const isCurrentAgent = agent.id === currentAgent?.agent_id;
                    const isSwitching = switching === agent.id;
                    
                    return (
                      <IonCol size="12" sizeMd="6" sizeLg="4" key={agent.id}>
                        <IonCard 
                          className={`agent-card ${isCurrentAgent ? 'current-agent' : ''}`}
                          button
                          onClick={() => handleAgentSelect(agent)}
                          disabled={isSwitching}
                        >
                          <IonCardHeader>
                            <div className="agent-card-header">
                              <IonAvatar className="agent-avatar">
                                {agent.avatar_url ? (
                                  <img src={agent.avatar_url} alt={agent.name} />
                                ) : (
                                  <IonIcon icon={personOutline} />
                                )}
                              </IonAvatar>
                              <IonCardTitle className="agent-name">
                                {agent.name}
                                {isCurrentAgent && (
                                  <IonIcon 
                                    icon={checkmarkCircle} 
                                    color="success" 
                                    className="current-indicator"
                                  />
                                )}
                              </IonCardTitle>
                            </div>
                          </IonCardHeader>
                          <IonCardContent>
                            <IonText color="medium" className="agent-description">
                              {agent.description}
                            </IonText>
                            <div className="agent-initial-prompt">
                              <IonIcon icon={chatbubbleOutline} color="primary" />
                              <IonText color="dark">
                                <small>&quot;{agent.initial_prompt}&quot;</small>
                              </IonText>
                            </div>
                            {isSwitching && (
                              <div className="switching-indicator">
                                <IonText color="primary">Switching...</IonText>
                              </div>
                            )}
                          </IonCardContent>
                        </IonCard>
                      </IonCol>
                    );
                  })
                )}
              </IonRow>
            </IonGrid>

            {!loading && agents.length === 0 && (
              <IonItem>
                <IonIcon icon={informationCircleOutline} slot="start" color="warning" />
                <IonLabel>
                  <h3>No agents available</h3>
                  <p>There are no active agents configured.</p>
                </IonLabel>
              </IonItem>
            )}
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="top"
      />
    </>
  );
};

export default AgentSelector;
