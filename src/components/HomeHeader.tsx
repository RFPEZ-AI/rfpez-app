// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { documentTextOutline } from 'ionicons/icons';
import type { User } from '@supabase/supabase-js';
import { RFP } from '../types/rfp';
import { Agent, SessionActiveAgent, UserProfile } from '../types/database';
import MainMenu from './MainMenu';
import AgentsMenu from './AgentsMenu';
import GenericMenu from './GenericMenu';
import AgentIndicator from './AgentIndicator';
import AuthButtons from './AuthButtons';
import { RoleService } from '../services/roleService';
import { useIsMobile } from '../utils/useMediaQuery';

interface HomeHeaderProps {
  // User and authentication props
  userProfile: UserProfile | null;
  isAuthenticated: boolean;
  user: User | null;
  
  // RFP management props
  rfps: RFP[];
  currentRfpId: number | null;
  showRFPMenu: boolean;
  setShowRFPMenu: (show: boolean) => void;
  onNewRFP: () => void;
  onEditRFP: (rfp: RFP) => void;
  onDeleteRFP: (rfp: RFP) => void;
  onPreviewRFP: (rfp: RFP) => void;
  onShareRFP: (rfp: RFP) => void;
  onSetCurrentRfp: (rfpId: number) => void;
  onClearCurrentRfp: () => void;
  
  // Agent management props
  agents: Agent[];
  showAgentsMenu: boolean;
  setShowAgentsMenu: (show: boolean) => void;
  currentAgent: SessionActiveAgent | null;
  onNewAgent: () => void;
  onEditAgent: (agent: Agent) => void;
  onDeleteAgent: (agent: Agent) => void;
  onSwitchAgent: () => void;
  
  // Main menu props
  onMainMenuSelect: (item: string) => void;
  
  // Artifact window props
  artifactWindowOpen?: boolean;
  onToggleArtifactWindow?: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({
  userProfile,
  isAuthenticated,
  user,
  rfps,
  currentRfpId,
  showRFPMenu,
  setShowRFPMenu,
  onNewRFP,
  onEditRFP,
  onDeleteRFP,
  onPreviewRFP,
  onShareRFP,
  onSetCurrentRfp,
  onClearCurrentRfp,
  agents,
  showAgentsMenu,
  setShowAgentsMenu,
  currentAgent,
  onNewAgent,
  onEditAgent,
  onDeleteAgent,
  onSwitchAgent,
  onMainMenuSelect,
  artifactWindowOpen,
  onToggleArtifactWindow
}) => {
  const isMobile = useIsMobile();

  return (
    <IonHeader>
      <IonToolbar>
        {/* Left section - Logo and title */}
        <div slot="start" style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <img 
            src="/assets/logo.svg?v=2" 
            alt="RFPEZ.AI" 
            style={{ height: '32px', marginRight: isMobile ? '6px' : '12px' }}
          />
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>RFPEZ.AI</span>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: 'normal', 
                backgroundColor: '#007bff', 
                color: 'white', 
                padding: '2px 6px', 
                borderRadius: '8px', 
                marginLeft: '8px',
                lineHeight: '1'
              }}>
                v1.2 PWA
              </span>
            </div>
          )}
          
          {/* Main Menu - Visible to developer and administrator roles (includes Debug menu access) */}
          {(() => {
            const shouldShowMenu = userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role);
            console.log('MainMenu visibility check:', {
              userRole: userProfile?.role,
              shouldShow: shouldShowMenu,
              isDeveloperOrHigher: userProfile?.role ? RoleService.isDeveloperOrHigher(userProfile.role) : false
            });
            return shouldShowMenu ? <MainMenu onSelect={onMainMenuSelect} /> : null;
          })()}
          
          {/* RFP Menu - Available to all authenticated users for creating and editing RFPs */}
          <GenericMenu
            items={rfps}
            getLabel={r => r.name || `RFP #${r.id}`}
            onNew={onNewRFP}
            onEdit={onEditRFP}
            onDelete={onDeleteRFP}
            onPreview={onPreviewRFP}
            onShare={onShareRFP}
            onSetCurrent={(rfp) => rfp ? onSetCurrentRfp(typeof rfp.id === 'string' ? parseInt(rfp.id) : rfp.id) : onClearCurrentRfp()}
            currentItemId={currentRfpId || undefined}
            showPopover={showRFPMenu}
            setShowPopover={setShowRFPMenu}
            title="RFP"
          />
          
          <AgentsMenu
            agents={agents}
            onNew={onNewAgent}
            onEdit={onEditAgent}
            onDelete={onDeleteAgent}
            showPopover={showAgentsMenu}
            setShowPopover={setShowAgentsMenu}
          />
          
          {isAuthenticated && user && userProfile && !isMobile && (
            <span style={{ 
              fontSize: '12px', 
              marginLeft: '12px', 
              padding: '4px 8px',
              backgroundColor: 'var(--ion-color-success)',
              color: 'white',
              borderRadius: '12px'
            }}>
              Saved
            </span>
          )}
        </div>
        
        {/* Center section - Agent Indicator */}
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flex: 1,
          padding: '0 8px',
          minWidth: 0
        }}>
          <div style={{ maxWidth: '100%', textAlign: 'center' }}>
            <AgentIndicator
              agent={currentAgent}
              onSwitchAgent={onSwitchAgent}
              compact={true}
              showSwitchButton={true}
            />
          </div>
        </div>
        
        {/* Right section - Auth buttons */}
        <IonButtons slot="end">
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            marginRight: '8px'
          }}>
            {/* Artifact Window Toggle Button */}
            {onToggleArtifactWindow && (
              <IonButton
                fill="clear"
                size="small"
                onClick={onToggleArtifactWindow}
                title={artifactWindowOpen ? "Hide artifacts" : "Show artifacts"}
                style={{
                  '--padding-start': '6px',
                  '--padding-end': '6px',
                  '--color': artifactWindowOpen ? 'var(--ion-color-primary)' : 'var(--ion-color-medium)'
                }}
              >
                <IonIcon icon={documentTextOutline} />
              </IonButton>
            )}
            <AuthButtons />
          </div>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default HomeHeader;
