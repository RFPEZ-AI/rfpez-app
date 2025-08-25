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
  informationCircleOutline,
  starOutline,
  lockClosedOutline
} from 'ionicons/icons';
import { AgentService } from '../services/agentService';
import type { Agent, SessionActiveAgent } from '../types/database';
import './AgentSelector.css';

interface AgentSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  supabaseUserId: string;
  currentAgent?: SessionActiveAgent | null;
  onAgentChanged: (agent: SessionActiveAgent) => void;
  hasProperAccountSetup?: boolean; // Whether user has access to restricted agents
  isAuthenticated?: boolean; // Whether user is authenticated
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  isOpen,
  onClose,
  sessionId,
  supabaseUserId,
  currentAgent,
  onAgentChanged,
  hasProperAccountSetup = false, // Default to false (restricted agents not available)
  isAuthenticated = false // Default to false (not authenticated)
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
      
      // Always load all active agents regardless of authentication status
      // We'll handle visibility/interaction in the UI
      const allAgents = await AgentService.getActiveAgents();
      setAgents(allAgents);
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

    // Check if user can access this agent
    const canAccess = isAuthenticated ? 
      (agent.is_restricted ? hasProperAccountSetup : true) : 
      !agent.is_restricted; // Non-authenticated users can access any non-restricted agent

    if (!canAccess) {
      if (!isAuthenticated) {
        setToastMessage('This agent requires account setup. Please sign in to access advanced features.');
      } else if (agent.is_restricted && !hasProperAccountSetup) {
        setToastMessage('This agent requires account setup and billing. Please complete onboarding first.');
      }
      setShowToast(true);
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
        const success = await AgentService.setSessionAgent(sessionId, agent.id, supabaseUserId);
        
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
              {sessionId === 'preview' ? 'Preview AI Agents' : 'Select AI Agent'}
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
                {isAuthenticated 
                  ? `RFP EZ has a team of specialized agents to get your sourcing job done EZ.  
                  We'll try to guide you to the right agent for each step in the process, 
                  but you can always select an agent if the need arrises.  For exanple, the ''Support Agent'' can be very helpful. 
                  ${hasProperAccountSetup ? 'All agents are available.' : 'Premium agents require billing setup.'}`
                  : 'Choose from our AI agents. Premium agents with advanced features require billaccount setup.'
                }

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
                    
                    // Determine if user can access this agent
                    const canAccess = isAuthenticated ? 
                      (agent.is_restricted ? hasProperAccountSetup : true) : 
                      !agent.is_restricted; // Non-authenticated users can access any non-restricted agent
                    
                    return (
                      <IonCol size="12" sizeMd="6" sizeLg="4" key={agent.id}>
                        <IonCard 
                          className={`agent-card ${isCurrentAgent ? 'current-agent' : ''} ${!canAccess ? 'disabled-agent' : ''}`}
                          button={canAccess}
                          onClick={canAccess ? () => handleAgentSelect(agent) : undefined}
                          disabled={isSwitching || !canAccess}
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
                                {agent.is_default && (
                                  <IonIcon 
                                    icon={starOutline} 
                                    color="warning" 
                                    className="default-indicator"
                                    title="Default Agent"
                                  />
                                )}
                                {agent.is_restricted && (
                                  <IonIcon 
                                    icon={lockClosedOutline} 
                                    color="medium" 
                                    className="restricted-indicator"
                                    title="Requires Account Setup"
                                  />
                                )}
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
                            {!canAccess && (
                              <div className="access-notice">
                                <IonText color="medium">
                                  <small>
                                    {!isAuthenticated ? 'Requires account setup - Sign in to access' : 
                                     agent.is_restricted ? 'Requires account setup and billing' : 
                                     'Access restricted'}
                                  </small>
                                </IonText>
                              </div>
                            )}
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
