import React, { useState } from 'react';
import { 
  IonModal, 
  IonButton, 
  IonInput, 
  IonTextarea, 
  IonItem, 
  IonLabel, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonFooter,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToggle
} from '@ionic/react';
import FormBuilder from './forms/FormBuilder';
import { RfpFormArtifact } from './forms/RfpForm';
import type { FormSpec } from '../types/rfp';

export interface RFPFormValues {
  name: string;
  due_date: string;
  description?: string;
  document?: File | null;
  form_spec?: FormSpec | null;
  is_template?: boolean;
  is_public?: boolean;
  suppliers?: number[];
}

// Helper type for database entities converted to form values
export interface RFPEditFormValues {
  name: string;
  due_date: string;
  description?: string;
  document?: Record<string, unknown> | File | null;
  form_spec?: FormSpec | null;
  is_template?: boolean;
  is_public?: boolean;
  suppliers?: number[];
}

interface RFPEditModalProps {
  rfp: Partial<RFPEditFormValues> | null;
  isOpen: boolean;
  onSave: (values: Partial<RFPFormValues>) => void;
  onCancel: () => void;
}

// Helper function to convert RFPEditFormValues to RFPFormValues
const convertToFormValues = (editValues: Partial<RFPEditFormValues> | null): Partial<RFPFormValues> => {
  if (!editValues) return {};
  
  const { document, ...rest } = editValues;
  return {
    ...rest,
    // If document is a Record (from database), convert to null for form
    // If it's already a File or null, keep as is
    document: document && typeof document === 'object' && !(document instanceof File) ? null : document as File | null
  };
};

const RFPEditModal: React.FC<RFPEditModalProps> = ({ rfp, isOpen, onSave, onCancel }) => {
  const [form, setForm] = useState<Partial<RFPFormValues>>(() => convertToFormValues(rfp));
  const [activeTab, setActiveTab] = useState<'basic' | 'form' | 'preview'>('basic');

  React.useEffect(() => {
    setForm(convertToFormValues(rfp));
  }, [rfp]);

  const handleFormSpecGenerated = (formSpec: FormSpec) => {
    setForm(f => ({ ...f, form_spec: formSpec }));
    setActiveTab('preview');
  };

  const handleSave = () => {
    onSave(form);
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onCancel} style={{ '--height': '90%' }}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{rfp ? 'Edit RFP' : 'New RFP'}</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent>
        {/* Tab Navigation */}
        <IonSegment 
          value={activeTab} 
          onIonChange={(e) => setActiveTab(e.detail.value as any)}
          style={{ padding: '16px' }}
        >
          <IonSegmentButton value="basic">
            <IonLabel>Basic Info</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="form">
            <IonLabel>Bid Form</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton value="preview" disabled={!form.form_spec}>
            <IonLabel>Preview</IonLabel>
          </IonSegmentButton>
        </IonSegment>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div style={{ padding: '16px' }}>
            <IonItem>
              <IonLabel position="stacked">RFP Name *</IonLabel>
              <IonInput 
                value={form.name || ''} 
                onIonInput={e => setForm(f => ({ ...f, name: e.detail.value || '' }))}
                placeholder="Enter RFP name"
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Due Date *</IonLabel>
              <IonInput 
                type="date" 
                value={form.due_date || ''} 
                onIonInput={e => setForm(f => ({ ...f, due_date: e.detail.value || '' }))} 
              />
            </IonItem>
            
            <IonItem>
              <IonLabel position="stacked">Description</IonLabel>
              <IonTextarea 
                value={form.description || ''} 
                onIonInput={e => setForm(f => ({ ...f, description: e.detail.value || '' }))}
                placeholder="Describe the RFP requirements..."
                rows={4}
                autoGrow
              />
            </IonItem>

            <IonItem>
              <IonLabel>Template RFP</IonLabel>
              <IonToggle
                checked={form.is_template || false}
                onIonChange={e => setForm(f => ({ ...f, is_template: e.detail.checked }))}
              />
            </IonItem>

            <IonItem>
              <IonLabel>Public RFP</IonLabel>
              <IonToggle
                checked={form.is_public || false}
                onIonChange={e => setForm(f => ({ ...f, is_public: e.detail.checked }))}
              />
            </IonItem>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <IonButton 
                expand="block" 
                onClick={() => setActiveTab('form')}
                disabled={!form.name || !form.due_date}
              >
                Next: Configure Bid Form
              </IonButton>
            </div>
          </div>
        )}

        {/* Form Builder Tab */}
        {activeTab === 'form' && (
          <div style={{ padding: '16px' }}>
            <IonText>
              <h3>Create Vendor Bid Form</h3>
              <p>Use AI to generate a custom form that vendors will fill out when submitting their bids.</p>
            </IonText>
            
            <FormBuilder 
              onFormSpecGenerated={handleFormSpecGenerated}
            />
            
            {form.form_spec && (
              <div style={{ marginTop: '20px', textAlign: 'center' }}>
                <IonButton 
                  expand="block" 
                  onClick={() => setActiveTab('preview')}
                >
                  Preview Form
                </IonButton>
              </div>
            )}
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && form.form_spec && (
          <div style={{ padding: '16px' }}>
            <IonText>
              <h3>Form Preview</h3>
              <p>This is how vendors will see the bid submission form:</p>
            </IonText>
            
            <RfpFormArtifact
              formSpec={form.form_spec}
              formData={{}}
              title="Vendor Bid Form Preview"
            />
          </div>
        )}
      </IonContent>
      
      <IonFooter>
        <IonToolbar>
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            padding: '8px 16px',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <IonButton 
              fill="outline" 
              color="medium" 
              onClick={onCancel}
              size="default"
            >
              Cancel
            </IonButton>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              {activeTab !== 'basic' && (
                <IonButton 
                  fill="outline" 
                  onClick={() => {
                    if (activeTab === 'form') setActiveTab('basic');
                    if (activeTab === 'preview') setActiveTab('form');
                  }}
                  size="default"
                >
                  Back
                </IonButton>
              )}
              
              <IonButton 
                onClick={handleSave}
                disabled={!form.name || !form.due_date}
                size="default"
              >
                Save RFP
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
    </IonModal>
  );
};

export default RFPEditModal;
