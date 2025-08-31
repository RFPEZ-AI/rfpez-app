// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonList,
  IonItem,
  IonLabel
} from '@ionic/react';
import AgentAvatar from './AgentAvatar';

const AgentAvatarDemo: React.FC = () => {
  const sampleAgents = [
    {
      name: 'Assistant',
      avatarUrl: null,
      isDefault: true
    },
    {
      name: 'Researcher',
      avatarUrl: 'https://via.placeholder.com/64/4CAF50/FFFFFF?text=R',
      isFree: true
    },
    {
      name: 'Analyst',
      avatarUrl: 'https://via.placeholder.com/64/2196F3/FFFFFF?text=A',
      isPremium: true
    },
    {
      name: 'Expert',
      avatarUrl: 'https://via.placeholder.com/64/FF9800/FFFFFF?text=E',
      isActive: true
    }
  ];

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Agent Avatar Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonGrid>
          {/* Size Variants */}
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Size Variants</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow className="ion-align-items-center">
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Small Agent"
                          size="small"
                          avatarUrl="https://via.placeholder.com/32/9C27B0/FFFFFF?text=S"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Small</p>
                          <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--ion-color-medium)' }}>32px → 28px → 24px</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Medium Agent"
                          size="medium"
                          avatarUrl="https://via.placeholder.com/40/3F51B5/FFFFFF?text=M"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Medium</p>
                          <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--ion-color-medium)' }}>40px → 32px → 28px</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Large Agent"
                          size="large"
                          avatarUrl="https://via.placeholder.com/48/4CAF50/FFFFFF?text=L"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Large</p>
                          <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--ion-color-medium)' }}>48px → 40px → 36px</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="XLarge Agent"
                          size="xlarge"
                          avatarUrl="https://via.placeholder.com/64/FF5722/FFFFFF?text=XL"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>X-Large</p>
                          <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--ion-color-medium)' }}>64px → 56px → 48px</p>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* State Variants */}
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>State Variants</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonGrid>
                    <IonRow className="ion-align-items-center">
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Default Agent"
                          size="large"
                          isDefault={true}
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Default</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Active Agent"
                          size="large"
                          isActive={true}
                          avatarUrl="https://via.placeholder.com/48/4CAF50/FFFFFF?text=A"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Active</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Free Agent"
                          size="large"
                          isFree={true}
                          avatarUrl="https://via.placeholder.com/48/00BCD4/FFFFFF?text=F"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Free</p>
                        </IonText>
                      </IonCol>
                      <IonCol size="3" className="ion-text-center">
                        <AgentAvatar
                          agentName="Premium Agent"
                          size="large"
                          isPremium={true}
                          avatarUrl="https://via.placeholder.com/48/673AB7/FFFFFF?text=P"
                        />
                        <IonText>
                          <p style={{ fontSize: '0.8rem', margin: '4px 0 0 0' }}>Premium</p>
                        </IonText>
                      </IonCol>
                    </IonRow>
                  </IonGrid>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Real-world Usage Examples */}
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Usage Examples</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonList>
                    {sampleAgents.map((agent, index) => (
                      <IonItem key={index}>
                        <AgentAvatar
                          agentName={agent.name}
                          avatarUrl={agent.avatarUrl}
                          size="medium"
                          isDefault={agent.isDefault}
                          isFree={agent.isFree}
                          isPremium={agent.isPremium}
                          isActive={agent.isActive}
                          onClick={() => console.log(`Clicked ${agent.name}`)}
                        />
                        <IonLabel style={{ marginLeft: '12px' }}>
                          <h3>{agent.name}</h3>
                          <p>
                            {agent.isDefault && 'Default Agent • '}
                            {agent.isFree && 'Free Agent • '}
                            {agent.isPremium && 'Premium Agent • '}
                            {agent.isActive && 'Currently Active • '}
                            Click to interact
                          </p>
                        </IonLabel>
                      </IonItem>
                    ))}
                  </IonList>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {/* Responsive Information */}
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Responsive Behavior</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonText>
                    <h4>Size Scaling by Screen Width:</h4>
                    <ul>
                      <li><strong>Desktop (&gt;768px):</strong> Full sizes (24px, 32px, 40px, 48px, 64px icons)</li>
                      <li><strong>Tablet (≤768px):</strong> Slightly smaller (28px, 32px, 40px, 56px containers)</li>
                      <li><strong>Mobile (≤480px):</strong> Compact sizes (24px, 28px, 36px, 48px containers)</li>
                    </ul>
                    <h4>Features:</h4>
                    <ul>
                      <li>Automatic image fallback to icon</li>
                      <li>Visual status indicators</li>
                      <li>Hover effects for interactive avatars</li>
                      <li>Dark mode support</li>
                      <li>High contrast mode support</li>
                      <li>Reduced motion support</li>
                    </ul>
                  </IonText>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default AgentAvatarDemo;
