import React, { useState } from 'react';
import { IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel } from '@ionic/react';
import { menu as menuIcon, people, documentText, briefcase } from 'ionicons/icons';

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
      <IonButton fill="clear" onClick={() => setShowPopover(true)}>
        <IonIcon icon={menuIcon} slot="icon-only" />
      </IonButton>
      <IonPopover isOpen={showPopover} onDidDismiss={() => setShowPopover(false)}>
        <IonList>
          <IonItem button onClick={() => handleSelect('RFP')}>
            <IonIcon icon={documentText} slot="start" />
            <IonLabel>RFP</IonLabel>
          </IonItem>
          <IonItem button onClick={() => handleSelect('Agents')}>
            <IonIcon icon={people} slot="start" />
            <IonLabel>Agents</IonLabel>
          </IonItem>
        </IonList>
      </IonPopover>
    </>
  );
};

export default MainMenu;
