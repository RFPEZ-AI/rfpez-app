import React from 'react';
import { IonModal, IonButton, IonInput, IonTextarea, IonItem, IonLabel, IonHeader, IonToolbar, IonTitle, IonContent, IonFooter, IonCheckbox } from '@ionic/react';

export interface RFPFormValues {
  name: string;
  due_date: string;
  description?: string;
  document?: any;
  is_template?: boolean;
  is_public?: boolean;
  suppliers?: number[];
}

interface RFPEditModalProps {
  rfp: Partial<RFPFormValues> | null;
  isOpen: boolean;
  onSave: (values: Partial<RFPFormValues>) => void;
  onCancel: () => void;
}

const RFPEditModal: React.FC<RFPEditModalProps> = ({ rfp, isOpen, onSave, onCancel }) => {
  const [form, setForm] = React.useState<Partial<RFPFormValues>>(rfp || {});

  React.useEffect(() => {
    setForm(rfp || {});
  }, [rfp]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{rfp ? 'Edit RFP' : 'New RFP'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <IonItem>
          <IonLabel position="stacked">Name</IonLabel>
          <IonInput value={form.name || ''} onIonChange={e => setForm(f => ({ ...f, name: e.detail.value! }))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Due Date</IonLabel>
          <IonInput type="date" value={form.due_date || ''} onIonChange={e => setForm(f => ({ ...f, due_date: e.detail.value! }))} />
        </IonItem>
        <IonItem>
          <IonLabel position="stacked">Description</IonLabel>
          <IonTextarea value={form.description || ''} onIonChange={e => setForm(f => ({ ...f, description: e.detail.value! }))} />
        </IonItem>
        {/* Add more fields as needed */}
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

export default RFPEditModal;
