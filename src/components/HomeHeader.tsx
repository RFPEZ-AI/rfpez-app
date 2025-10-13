// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { IonHeader, IonToolbar, IonButtons, IonButton, IonIcon } from '@ionic/react';
import { documentTextOutline, personCircle } from 'ionicons/icons';
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
import packageJson from '../../package.json';

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
  artifactWindowOpen: boolean;
  onToggleArtifactWindow: () => void;
  artifactCount?: number; // Number of artifacts available for current RFP
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
  onToggleArtifactWindow,
  artifactCount = 0
}) => {
  const isMobile = useIsMobile();
  
  // Get version info - use build number if available, otherwise package version
  const buildNumber = process.env.REACT_APP_BUILD_NUMBER;
  const commitSha = process.env.REACT_APP_COMMIT_SHA?.substring(0, 7);
  const baseVersion = packageJson.version;
  
  const versionDisplay = buildNumber 
    ? `v${baseVersion}.${buildNumber}${commitSha ? ` (${commitSha})` : ''}`
    : `v${baseVersion}`;

  return (
    <IonHeader>
      <IonToolbar>
        {/* Left section - Logo and title */}
        <div slot="start" style={{ display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <img 
            src="/assets/logo.svg?v=3" 
            alt="RFPEZ.AI" 
            title={`${versionDisplay} PWA`}
            style={{ height: '32px', marginRight: isMobile ? '6px' : '12px', cursor: 'pointer' }}
          />
          {!isMobile && (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontSize: '18px', fontWeight: 'bold' }}>RFPEZ.AI</span>
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
          
          {/* RFP Menu - Only available to administrators */}
          {(() => {
            const shouldShowRFPMenu = userProfile?.role && RoleService.isAdministrator(userProfile.role);
            console.log('RFP Menu visibility check:', {
              userRole: userProfile?.role,
              shouldShow: shouldShowRFPMenu,
              isAdministrator: userProfile?.role ? RoleService.isAdministrator(userProfile.role) : false
            });
            return shouldShowRFPMenu ? (
              <>
                <IonButton 
                  fill="clear" 
                  onClick={() => setShowRFPMenu(true)}
                  data-testid="rfp-menu-button"
                >
                  <IonIcon icon={documentTextOutline} slot="start" /> 
                  RFP
                </IonButton>
                
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
              </>
            ) : null;
          })()}
          
          {/* Agents Menu - Only available to administrators */}
          {(() => {
            const shouldShowAgentsMenu = userProfile?.role && RoleService.isAdministrator(userProfile.role);
            console.log('Agents Menu visibility check:', {
              userRole: userProfile?.role,
              shouldShow: shouldShowAgentsMenu,
              isAdministrator: userProfile?.role ? RoleService.isAdministrator(userProfile.role) : false
            });
            return shouldShowAgentsMenu ? (
              <>
                <IonButton 
                  fill="clear" 
                  onClick={() => setShowAgentsMenu(true)}
                  data-testid="agents-menu-button"
                >
                  <IonIcon icon={personCircle} slot="start" /> 
                  Agents
                </IonButton>
                
                <AgentsMenu
                  agents={agents}
                  onNew={onNewAgent}
                  onEdit={onEditAgent}
                  onDelete={onDeleteAgent}
                  showPopover={showAgentsMenu}
                  setShowPopover={setShowAgentsMenu}
                />
              </>
            ) : null;
          })()}
          
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
              data-testid="agent-selector"
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
            {/* Artifact Window Toggle Button - 3 States: Hidden-Empty, Hidden-HasArtifacts, Shown */}
            <IonButton
              fill="clear"
              size="small"
              onClick={onToggleArtifactWindow}
              title={
                artifactWindowOpen 
                  ? "Hide artifacts" 
                  : artifactCount > 0 
                    ? `Show ${artifactCount} artifact${artifactCount > 1 ? 's' : ''}` 
                    : "No artifacts"
              }
              data-testid="artifact-window-toggle"
              style={{
                '--padding-start': '6px',
                '--padding-end': '12px',
                '--padding-top': '8px',
                '--padding-bottom': '8px',
                // 3 visual states:
                // 1. Hidden + no artifacts = light gray (disabled look)
                // 2. Hidden + has artifacts = primary color (attention-grabbing)
                // 3. Shown = primary color (active)
                '--color': artifactWindowOpen 
                  ? 'var(--ion-color-primary)' 
                  : artifactCount > 0 
                    ? 'var(--ion-color-primary)' 
                    : 'var(--ion-color-light)',
                opacity: !artifactWindowOpen && artifactCount === 0 ? 0.5 : 1,
                position: 'relative',
                cursor: artifactCount === 0 && !artifactWindowOpen ? 'default' : 'pointer',
                overflow: 'visible'
              }}
              disabled={artifactCount === 0 && !artifactWindowOpen} // Disable when hidden and no artifacts
            >
              <IonIcon icon={documentTextOutline} />
              {/* Badge showing artifact count - only when there are artifacts */}
              {artifactCount > 0 && (
                <span 
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-8px',
                    backgroundColor: artifactWindowOpen ? '#2dd36f' : '#ffc409', // Green when open, Orange when hidden
                    color: 'white',
                    borderRadius: '10px',
                    padding: '2px 6px',
                    fontSize: '10px',
                    fontWeight: 'bold',
                    minWidth: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                    animation: !artifactWindowOpen ? 'pulse 2s infinite' : 'none'
                  }}
                >
                  {artifactCount > 99 ? '99+' : artifactCount}
                </span>
              )}
            </IonButton>
            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.1); opacity: 0.8; }
              }
            `}</style>
            <AuthButtons />
          </div>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
};

export default HomeHeader;
