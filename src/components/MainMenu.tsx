// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel } from '@ionic/react';
import { menu as menuIcon, documentText, bug } from 'ionicons/icons';

interface MainMenuProps {
  onSelect: (item: string) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onSelect }) => {
  const [showPopover, setShowPopover] = useState(false);

  const handleSelect = (item: string) => {
    setShowPopover(false);
    onSelect(item);
  };

  return (
    <>
      <IonButton id="main-menu-trigger" fill="clear" onClick={() => setShowPopover(true)}>
        <IonIcon icon={menuIcon} slot="icon-only" />
      </IonButton>
      <IonPopover 
        trigger="main-menu-trigger"
        isOpen={showPopover} 
        onDidDismiss={() => setShowPopover(false)}
      >
        <IonList>
          <IonItem button onClick={() => handleSelect('RFP')}>
            <IonIcon icon={documentText} slot="start" />
            <IonLabel>RFP</IonLabel>
          </IonItem>
          {process.env.NODE_ENV === 'development' && (
            <IonItem button onClick={() => handleSelect('Debug')}>
              <IonIcon icon={bug} slot="start" />
              <IonLabel>Debug Tools</IonLabel>
            </IonItem>
          )}
        </IonList>
      </IonPopover>
    </>
  );
};

export default MainMenu;
