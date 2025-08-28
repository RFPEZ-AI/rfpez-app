import React, { useState } from 'react';
import { IonButton, IonIcon, IonPopover, IonList, IonItem, IonLabel, IonAlert } from '@ionic/react';
import { personCircle, add, create, trash } from 'ionicons/icons';
import type { Agent } from '../types/database';

interface AgentsMenuProps {
  agents: Agent[];
  onNew: () => void;
  onEdit: (agent: Agent) => void;
  onDelete: (agent: Agent) => void;
  showPopover?: boolean;
  setShowPopover?: (show: boolean) => void;
}

const AgentsMenu: React.FC<AgentsMenuProps> = ({ agents, onNew, onEdit, onDelete, showPopover, setShowPopover }) => {
  const [internalPopover, setInternalPopover] = useState(false);
  const isControlled = typeof showPopover === 'boolean' && typeof setShowPopover === 'function';
  const popoverOpen = isControlled ? (showPopover || false) : internalPopover;
  const setPopover = isControlled ? (setShowPopover || setInternalPopover) : setInternalPopover;
  const [deleteAgent, setDeleteAgent] = useState<Agent | null>(null);

  return (
    <>
      {!isControlled && (
        <IonButton fill="clear" onClick={() => setPopover(true)}>
        <IonIcon icon={personCircle} slot="start" /> Agents
        </IonButton>
      )}
  <IonPopover isOpen={popoverOpen} onDidDismiss={() => setPopover(false)}>
        <IonList>
          <IonItem button onClick={() => { setPopover(false); onNew(); }}>
            <IonIcon icon={add} slot="start" />
            <IonLabel>New Agent</IonLabel>
          </IonItem>
          {agents.map(agent => (
            <IonItem key={agent.id}>
              <IonLabel>{agent.name}</IonLabel>
              <IonButton fill="clear" slot="end" onClick={() => { setPopover(false); onEdit(agent); }}>
                <IonIcon icon={create} />
              </IonButton>
              <IonButton fill="clear" color="danger" slot="end" onClick={() => setDeleteAgent(agent)}>
                <IonIcon icon={trash} />
              </IonButton>
            </IonItem>
          ))}
        </IonList>
      </IonPopover>
      <IonAlert
        isOpen={!!deleteAgent}
        header="Delete Agent?"
        message={`Are you sure you want to delete agent '${deleteAgent?.name}'?`}
        buttons={[
          { text: 'Cancel', role: 'cancel', handler: () => setDeleteAgent(null) },
          { text: 'Delete', role: 'destructive', handler: () => { if (deleteAgent) onDelete(deleteAgent); setDeleteAgent(null); } }
        ]}
        onDidDismiss={() => setDeleteAgent(null)}
      />
    </>
  );
};

export default AgentsMenu;
