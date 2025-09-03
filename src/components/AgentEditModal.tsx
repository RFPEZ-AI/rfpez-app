// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import { IonModal, IonButton, IonInput, IonTextarea, IonItem, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter } from '@ionic/react';
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

  const handleSave = () => {
    console.log('AgentEditModal handleSave called with form:', form);
    onSave(form);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{agent ? 'Edit Agent' : 'New Agent'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonInput 
            label="Name" 
            labelPlacement="stacked"
            value={form.name || ''} 
            onIonChange={e => {
              const newValue = e.detail.value || '';
              console.log('Name field changed from', form.name, 'to', newValue);
              setForm(f => ({ ...f, name: newValue }));
            }} 
          />
        </IonItem>
        <IonItem>
          <IonTextarea 
            label="Description" 
            labelPlacement="stacked"
            value={form.description || ''} 
            onIonChange={e => setForm(f => ({ ...f, description: e.detail.value || '' }))} 
          />
        </IonItem>
        <IonItem>
          <IonTextarea 
            label="Instructions" 
            labelPlacement="stacked"
            value={form.instructions || ''} 
            onIonChange={e => setForm(f => ({ ...f, instructions: e.detail.value || '' }))} 
          />
        </IonItem>
        <IonItem>
          <IonTextarea 
            label="Initial Prompt" 
            labelPlacement="stacked"
            value={form.initial_prompt || ''} 
            onIonChange={e => setForm(f => ({ ...f, initial_prompt: e.detail.value || '' }))} 
          />
        </IonItem>
      </IonContent>
      <IonFooter>
        <IonToolbar>
          <IonButton expand="block" onClick={handleSave}>
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
