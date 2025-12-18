// Copyright Mark Skiba, 2025 All rights reserved

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
  checkmarkCircle,
  informationCircleOutline,
  starOutline,
  lockClosedOutline,
  giftOutline
} from 'ionicons/icons';
import { AgentService } from '../services/agentService';
import type { Agent, SessionActiveAgent } from '../types/database';
import AgentAvatar from './AgentAvatar';
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
  agents?: Agent[]; // Pre-filtered agents (e.g., by specialty site)
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  isOpen,
  onClose,
  sessionId,
  supabaseUserId,
  currentAgent,
  onAgentChanged,
  hasProperAccountSetup = false, // Default to false (restricted agents not available)
  isAuthenticated = false, // Default to false (not authenticated)
  agents: providedAgents // Agents provided by parent (pre-filtered by specialty site)
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
  }, [isOpen, providedAgents]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      
      // Use provided agents if available (pre-filtered by specialty site), otherwise load all
      if (providedAgents && providedAgents.length > 0) {
        console.log('🔍 Using provided agents (specialty-filtered):', providedAgents.map(a => a.name));
        setAgents(providedAgents);
      } else {
        // Fallback: Load agents based on user authentication and account setup status
        console.log('🔍 Loading agents with params:', { hasProperAccountSetup, isAuthenticated });
        const availableAgents = await AgentService.getAvailableAgents(hasProperAccountSetup, isAuthenticated);
        console.log('🔍 Available agents received:', availableAgents.map(a => ({ name: a.name, is_default: a.is_default, is_free: a.is_free })));
        setAgents(availableAgents);
      }
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
    let canAccess = false;
    let accessMessage = '';

    if (!isAuthenticated) {
      // ✅ Anonymous users can ONLY access:
      // 1. Anonymous default agent (is_anonymous_default = true)
      // 2. Free agents (is_free = true)
      // 3. Support agents (for help without login)
      const isSupport = agent.name?.toLowerCase().includes('support') || 
                       agent.name?.toLowerCase().includes('help') ||
                       agent.role === 'support' ||
                       (agent.description && agent.description.toLowerCase().includes('support'));
      
      canAccess = (agent.is_anonymous_default === true) || (agent.is_free === true) || (isSupport === true);
      accessMessage = isSupport 
        ? '' // Support agent is allowed
        : 'Please sign in to access this agent. Free agents are available to authenticated users, while premium agents require billing setup.';
    } else {
      // Authenticated users can access:
      // 1. Default agents (always available)
      // 2. Free agents (available to all authenticated users)
      // 3. Non-restricted, non-free agents
      // 4. Restricted agents only if they have proper account setup
      
      if (agent.is_default || agent.is_free || (!agent.is_restricted && !agent.is_free)) {
        canAccess = true;
      } else if (agent.is_restricted) {
        canAccess = hasProperAccountSetup;
        accessMessage = 'This premium agent requires billing setup. Please complete account setup to access advanced features.';
      }
    }

    if (!canAccess) {
      setToastMessage(accessMessage);
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
      <IonModal 
        isOpen={isOpen} 
        onDidDismiss={onClose}
        aria-label="Agent Selection Modal"
        backdropDismiss={true}
        className="agent-selector-modal"
      >
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
                  but you can always select an agent if the need arrises. Free agents (🎁) are available to all authenticated users. 
                  ${hasProperAccountSetup ? 'Premium agents (🔒) are also available with your billing setup.' : 'Premium agents (🔒) require billing setup.'}`
                  : 'Sign in to access our AI agents. Free agents are available to authenticated users, while premium agents require billing setup.'
                }

              </p>
            </IonText>

            <IonGrid>
              <IonRow>
                {loading ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, index) => (
                    <IonCol size="12" sizeMd="6" sizeLg="6" sizeXl="4" key={index}>
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
                    let canAccess = false;
                    let isLocked = false; // New: Track if agent is locked for this user
                    
                    if (!isAuthenticated) {
                      // ✅ Anonymous users can access:
                      // 1. Anonymous default agents (is_anonymous_default = true)
                      // 2. Free agents (is_free = true)
                      // 3. Support agents (for help without login)
                      const isSupport = agent.name?.toLowerCase().includes('support') || 
                                       agent.name?.toLowerCase().includes('help') ||
                                       agent.role === 'support' ||
                                       (agent.description && agent.description.toLowerCase().includes('support'));
                      
                      canAccess = (agent.is_anonymous_default === true) || (agent.is_free === true) || (isSupport === true);
                      isLocked = !canAccess; // Lock all other agents
                    } else {
                      // Authenticated users can access:
                      // 1. Default agents, 2. Free agents, 3. Non-restricted non-free agents
                      // 4. Restricted agents only if they have proper account setup
                      canAccess = agent.is_default || agent.is_free || 
                                (!agent.is_restricted && !agent.is_free) ||
                                (agent.is_restricted && hasProperAccountSetup);
                      
                      // Lock restricted agents without proper account setup
                      isLocked = agent.is_restricted && !hasProperAccountSetup;
                    }
                    
                    return (
                      <IonCol size="12" sizeMd="6" sizeLg="6" sizeXl="4" key={agent.id}>
                        <IonCard 
                          className={`agent-card ${isCurrentAgent ? 'current-agent' : ''} ${isLocked ? 'locked-agent' : ''}`}
                          button={true}
                          onClick={() => handleAgentSelect(agent)}
                          disabled={isSwitching || isLocked}
                          style={isLocked ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                        >
                          <IonCardHeader>
                            <div className="agent-card-header">
                              <AgentAvatar
                                agentName={agent.name}
                                avatarUrl={agent.avatar_url}
                                size="large"
                                isActive={isCurrentAgent}
                                isDefault={agent.is_default}
                                isFree={agent.is_free}
                                isPremium={agent.is_restricted}
                              />
                              <IonCardTitle className="agent-name">
                                <span className="agent-name-text" style={isLocked ? { color: '#999' } : {}}>
                                  {agent.name}
                                  <span className="agent-suffix"> Agent</span>
                                  {/* Show lock icon prominently for locked agents */}
                                  {isLocked && (
                                    <IonIcon 
                                      icon={lockClosedOutline} 
                                      color="medium" 
                                      style={{ fontSize: '20px', marginLeft: '8px', verticalAlign: 'middle' }}
                                      title={!isAuthenticated ? 'Sign in to access this agent' : 'Requires billing setup'}
                                    />
                                  )}
                                </span>
                                {!isLocked && agent.is_default && (
                                  <IonIcon 
                                    icon={starOutline} 
                                    color="warning" 
                                    className="default-indicator"
                                    title="Default Agent"
                                  />
                                )}
                                {!isLocked && agent.is_free && (
                                  <IonIcon 
                                    icon={giftOutline} 
                                    color="success" 
                                    className="free-indicator"
                                    title="Free Agent - Available to authenticated users"
                                  />
                                )}
                                {!isLocked && agent.is_restricted && canAccess && (
                                  <IonIcon 
                                    icon={lockClosedOutline} 
                                    color="medium" 
                                    className="restricted-indicator"
                                    title="Premium Agent - Requires billing setup"
                                  />
                                )}
                                {isCurrentAgent && !isLocked && (
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
                            <IonText color={isLocked ? 'medium' : 'dark'} className="agent-description">
                              {agent.description}
                            </IonText>
                            {isLocked && (
                              <div className="access-notice" style={{ 
                                marginTop: '12px', 
                                padding: '8px 12px', 
                                backgroundColor: 'rgba(0,0,0,0.05)', 
                                borderRadius: '8px',
                                borderLeft: '3px solid var(--ion-color-medium)'
                              }}>
                                <IonText color="medium">
                                  <small style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <IonIcon icon={lockClosedOutline} />
                                    <span>
                                      {!isAuthenticated ? 'Sign in to access this agent' : 
                                       agent.is_restricted ? 'Requires billing setup' : 
                                       'Access restricted'}
                                    </span>
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
        data-testid="toast"
      />
    </>
  );
};

export default AgentSelector;
