// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonModal, IonButton, IonInput, IonTextarea, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter } from '@ionic/react';
import type { Agent } from '../types/database';

interface AgentEditModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onSave: (agent: Partial<Agent>) => void;
  onCancel: () => void;
}

const AgentEditModal: React.FC<AgentEditModalProps> = ({ agent, isOpen, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<Agent>>(agent || {});

  React.useEffect(() => {
    setForm(agent || {});
  }, [agent]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{agent ? 'Edit Agent' : 'New Agent'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput value={form.name || ''} onIonChange={e => setForm(f => ({ ...f, name: e.detail.value || '' }))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea value={form.description || ''} onIonChange={e => setForm(f => ({ ...f, description: e.detail.value || '' }))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Instructions</IonLabel>
          <IonTextarea value={form.instructions || ''} onIonChange={e => setForm(f => ({ ...f, instructions: e.detail.value || '' }))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Initial Prompt</IonLabel>
          <IonTextarea value={form.initial_prompt || ''} onIonChange={e => setForm(f => ({ ...f, initial_prompt: e.detail.value || '' }))} />
        </IonItem>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" onClick={() => onSave(form)}>
            Save
          </IonButton>
          <IonButton expand="block" fill="outline" color="medium" onClick={onCancel} style={{ marginTop: 8 }}>
            Cancel
          </IonButton>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default AgentEditModal;
