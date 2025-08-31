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
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonText,
  IonButtons,
  IonBackButton,
  IonItem,
  IonLabel
} from '@ionic/react';
import AgentAvatar from '../components/AgentAvatar';
import type { AvatarSize } from '../components/AgentAvatar.types';

const AgentAvatarDemo: React.FC = () => {
  const sizes: AvatarSize[] = ['small', 'medium', 'large', 'xlarge'];
  
  const sampleAgents = [
    {
      name: 'Default Agent',
      avatarUrl: null,
      isDefault: true,
      isActive: false,
      isPremium: false,
      isFree: false
    },
    {
      name: 'Active Agent',
      avatarUrl: null, // Show cartoon instead of placeholder
      isDefault: false,
      isActive: true,
      isPremium: false,
      isFree: false
    },
    {
      name: 'Premium Agent',
      avatarUrl: null, // Show cartoon instead of placeholder
      isDefault: false,
      isActive: false,
      isPremium: true,
      isFree: false
    },
    {
      name: 'Free Agent',
      avatarUrl: null, // Show cartoon instead of placeholder
      isDefault: false,
      isActive: false,
      isPremium: false,
      isFree: true
    },
    {
      name: 'No Image Agent',
      avatarUrl: null,
      isDefault: false,
      isActive: false,
      isPremium: false,
      isFree: false
    },
    {
      name: 'Custom Image Agent',
      avatarUrl: 'https://via.placeholder.com/64/4CAF50/FFFFFF?text=IMG',
      isDefault: false,
      isActive: false,
      isPremium: false,
      isFree: false
    }
  ];

  const handleAvatarClick = (agentName: string) => {
    console.log(`Clicked on ${agentName}`);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/debug" />
          </IonButtons>
          <IonTitle>Agent Avatar Demo</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '16px' }}>
          
          {/* Size Variants Demo */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Size Variants</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>Responsive sizes that adapt to screen size:</p>
              </IonText>
              <IonGrid>
                <IonRow>
                  {sizes.map(size => (
                    <IonCol size="6" sizeMd="3" key={size}>
                      <div style={{ textAlign: 'center' }}>
                        <AgentAvatar
                          agentName={`${size} agent`}
                          size={size}
                          avatarUrl="https://via.placeholder.com/64/2196F3/FFFFFF?text=S"
                          onClick={() => handleAvatarClick(`${size} agent`)}
                        />
                        <IonText>
                          <p style={{ marginTop: '8px', fontSize: '0.9rem' }}>
                            {size}
                          </p>
                        </IonText>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* State Variants Demo */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Cartoon Robot Designs</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>Colorful cartoon robot designs that change based on agent type:</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  <li><strong>Default</strong>: Friendly orange robot with antenna</li>
                  <li><strong>Active</strong>: Green robot with pulsing antenna and data streams</li>
                  <li><strong>Premium</strong>: Purple robot with golden crown and elegant features</li>
                  <li><strong>Free</strong>: Cyan robot with gift box and happy smile</li>
                </ul>
              </IonText>
              <IonGrid>
                <IonRow>
                  {sampleAgents.map((agent, index) => (
                    <IonCol size="6" sizeMd="4" sizeLg="2" key={index}>
                      <div style={{ textAlign: 'center' }}>
                        <AgentAvatar
                          agentName={agent.name}
                          avatarUrl={agent.avatarUrl}
                          size="large"
                          isDefault={agent.isDefault}
                          isActive={agent.isActive}
                          isPremium={agent.isPremium}
                          isFree={agent.isFree}
                          onClick={() => handleAvatarClick(agent.name)}
                        />
                        <IonText>
                          <p style={{ marginTop: '8px', fontSize: '0.8rem' }}>
                            {agent.name}
                          </p>
                        </IonText>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </IonCardContent>
          </IonCard>

          {/* Animation Features */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Interactive Animations</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>Each cartoon robot has unique animations:</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  <li><strong>Active agents</strong>: Gentle pulsing animation</li>
                  <li><strong>Premium agents</strong>: Glowing effect with sparkles</li>
                  <li><strong>Free agents</strong>: Happy bouncing animation</li>
                  <li><strong>Hover effects</strong>: Scale up on mouse over</li>
                </ul>
                <p><small>Note: Animations respect reduced motion preferences for accessibility.</small></p>
              </IonText>
              
              <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px' }}>
                <AgentAvatar agentName="Active Demo" size="xlarge" isActive={true} />
                <AgentAvatar agentName="Premium Demo" size="xlarge" isPremium={true} />
                <AgentAvatar agentName="Free Demo" size="xlarge" isFree={true} />
              </div>
            </IonCardContent>
          </IonCard>

          {/* Usage Examples */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Usage in Lists</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>How avatars look in typical list interfaces:</p>
              </IonText>
              
              {sampleAgents.slice(0, 3).map((agent, index) => (
                <IonItem key={index} button onClick={() => handleAvatarClick(agent.name)}>
                  <AgentAvatar
                    agentName={agent.name}
                    avatarUrl={agent.avatarUrl}
                    size="medium"
                    isDefault={agent.isDefault}
                    isActive={agent.isActive}
                    isPremium={agent.isPremium}
                    isFree={agent.isFree}
                  />
                  <IonLabel style={{ marginLeft: '12px' }}>
                    <h3>{agent.name}</h3>
                    <p>Ready to assist with your RFP needs</p>
                  </IonLabel>
                </IonItem>
              ))}
            </IonCardContent>
          </IonCard>

          {/* Responsive Behavior */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Responsive Behavior</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>Avatars automatically scale based on screen size:</p>
                <ul style={{ paddingLeft: '20px', margin: '8px 0' }}>
                  <li><strong>Desktop</strong>: Full size as defined</li>
                  <li><strong>Tablet (≤768px)</strong>: Slightly smaller</li>
                  <li><strong>Mobile (≤480px)</strong>: Compact for touch</li>
                </ul>
                <p>Try resizing your browser window to see the effect!</p>
              </IonText>
            </IonCardContent>
          </IonCard>

          {/* Code Example */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Code Example</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <pre style={{ 
                background: 'var(--ion-color-light)', 
                padding: '12px', 
                borderRadius: '8px',
                fontSize: '0.85rem',
                overflow: 'auto'
              }}>
{`<AgentAvatar
  agentName="Example Agent"
  avatarUrl="https://example.com/avatar.jpg"
  size="medium"
  isActive={true}
  onClick={() => handleAgentClick()}
/>`}
              </pre>
            </IonCardContent>
          </IonCard>

        </div>
      </IonContent>
    </IonPage>
  );
};

export default AgentAvatarDemo;
