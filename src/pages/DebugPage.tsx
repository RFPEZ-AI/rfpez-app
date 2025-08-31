// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButtons,
  IonBackButton,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton,
  IonIcon
} from '@ionic/react';
import { colorPaletteOutline } from 'ionicons/icons';
import ClaudeTestComponent from '../components/ClaudeTestComponent';
import AuthDebugger from '../components/AuthDebugger';
import RoleManagement from '../components/RoleManagement';
import { useSupabase } from '../context/SupabaseContext';
import { RoleService } from '../services/roleService';

const DebugPage: React.FC = () => {
  const { userProfile } = useSupabase();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/home" />
          </IonButtons>
          <IonTitle>Debug Tools</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {/* Claude API Test Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Claude API Test</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <ClaudeTestComponent />
          </IonCardContent>
        </IonCard>

        {/* Auth Debug Section */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Authentication Debug Info</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <AuthDebugger />
          </IonCardContent>
        </IonCard>

        {/* Component Demos */}
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Component Demos</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonButton 
              expand="block" 
              fill="outline" 
              routerLink="/debug/avatars"
              style={{ marginBottom: '8px' }}
            >
              <IonIcon icon={colorPaletteOutline} slot="start" />
              Agent Avatar Demo
            </IonButton>
          </IonCardContent>
        </IonCard>

        {/* Role Management Section (Admin Only) */}
        {userProfile?.role && RoleService.isAdministrator(userProfile.role) && (
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Role Management (Admin)</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <RoleManagement currentUserRole={userProfile.role} />
            </IonCardContent>
          </IonCard>
        )}
      </IonContent>
    </IonPage>
  );
};

export default DebugPage;
