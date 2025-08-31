// Copyright Mark Skiba, 2025 All rights reserved

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
  IonToggle,
  IonList,
  IonIcon
} from '@ionic/react';
import { add, create, trash, personCircle } from 'ionicons/icons';
import FormBuilder from './forms/FormBuilder';
import { RfpFormArtifact } from './forms/RfpForm';
import AgentEditModal from './AgentEditModal';
import { useSupabase } from '../context/SupabaseContext';
import { RoleService } from '../services/roleService';
import { AgentService } from '../services/agentService';
import type { FormSpec } from '../types/rfp';
import type { Agent } from '../types/database';

export interface RFPFormValues {
  name: string;
  due_date: string;
  description: string; // Required - public description
  specification: string; // Required - detailed specs for Claude
  form_spec?: FormSpec | null;
  is_template?: boolean;
  is_public?: boolean;
  suppliers?: number[];
}

// Helper type for database entities converted to form values
export interface RFPEditFormValues {
  name: string;
  due_date: string;
  description: string; // Required - public description
  specification: string; // Required - detailed specs for Claude
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
  if (!editValues) return { 
    description: '', 
    specification: '' 
  };
  
  // Extract only the fields we want (excluding document)
  const {
    name,
    due_date,
    description,
    specification,
    form_spec,
    is_template,
    is_public,
    suppliers
  } = editValues;
  
  return {
    name,
    due_date,
    description: description || '',
    specification: specification || '',
    form_spec,
    is_template,
    is_public,
    suppliers
  };
};

const RFPEditModal: React.FC<RFPEditModalProps> = ({ rfp, isOpen, onSave, onCancel }) => {
  const { userProfile } = useSupabase();
  const [form, setForm] = useState<Partial<RFPFormValues>>(() => convertToFormValues(rfp));
  const [activeTab, setActiveTab] = useState<'basic' | 'form' | 'agents' | 'preview'>('basic');
  
  // Agent state
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);

  React.useEffect(() => {
    setForm(convertToFormValues(rfp));
  }, [rfp]);

  // Load agents when component mounts or when agents tab is accessed
  React.useEffect(() => {
    if (isOpen && userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role)) {
      const loadAgents = async () => {
        try {
          const activeAgents = await AgentService.getActiveAgents();
          setAgents(activeAgents);
        } catch (err) {
          console.error('Error loading agents:', err);
        }
      };
      loadAgents();
    }
  }, [isOpen, userProfile]);

  // Agent management handlers
  const handleNewAgent = () => {
    setEditingAgent(null);
    setShowAgentModal(true);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowAgentModal(true);
  };

  const handleDeleteAgent = async (agent: Agent) => {
    try {
      await AgentService.deleteAgent(agent.id);
      setAgents(prev => prev.filter(a => a.id !== agent.id));
    } catch (err) {
      console.error('Error deleting agent:', err);
    }
  };

  const handleAgentSave = async (agentData: Partial<Agent>) => {
    try {
      if (editingAgent?.id) {
        // Update existing agent
        await AgentService.updateAgent(editingAgent.id, agentData);
      } else {
        // Create new agent
        await AgentService.createAgent(agentData as Omit<Agent, 'id' | 'created_at' | 'updated_at'>);
      }
      
      // Reload agents after save
      const activeAgents = await AgentService.getActiveAgents();
      setAgents(activeAgents);
      setShowAgentModal(false);
      setEditingAgent(null);
    } catch (err) {
      console.error('Error saving agent:', err);
    }
  };

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
    <>
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
          onIonChange={(e) => setActiveTab(e.detail.value as 'basic' | 'form' | 'agents' | 'preview')}
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
          {userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role) && (
            <IonSegmentButton value="agents">
              <IonLabel>Agents</IonLabel>
            </IonSegmentButton>
          )}
        </IonSegment>

        {/* Basic Info Tab */}
        {activeTab === 'basic' && (
          <div style={{ padding: '16px' }}>
            <IonItem>
              <IonInput 
                label="RFP Name *"
                value={form.name || ''} 
                onIonInput={e => setForm(f => ({ ...f, name: e.detail.value || '' }))}
                placeholder="Enter RFP name"
              />
            </IonItem>
            
            <IonItem>
              <IonInput 
                label="Due Date *"
                type="date" 
                value={form.due_date || ''} 
                onIonInput={e => setForm(f => ({ ...f, due_date: e.detail.value || '' }))} 
              />
            </IonItem>
            
            <IonItem>
              <IonTextarea 
                label="Description *"
                value={form.description || ''} 
                onIonInput={e => setForm(f => ({ ...f, description: e.detail.value || '' }))}
                placeholder="Brief public description of the RFP..."
                rows={3}
                autoGrow
                required
              />
            </IonItem>

            <IonItem>
              <IonTextarea 
                label="Specification *"
                value={form.specification || ''} 
                onIonInput={e => setForm(f => ({ ...f, specification: e.detail.value || '' }))}
                placeholder="Detailed requirements and specifications for form generation..."
                rows={6}
                autoGrow
                required
              />
            </IonItem>

            <IonItem>
              <IonToggle
                checked={form.is_template || false}
                onIonChange={e => setForm(f => ({ ...f, is_template: e.detail.checked }))}
              >
                Template RFP
              </IonToggle>
            </IonItem>

            <IonItem>
              <IonToggle
                checked={form.is_public || false}
                onIonChange={e => setForm(f => ({ ...f, is_public: e.detail.checked }))}
              >
                Public RFP
              </IonToggle>
            </IonItem>

            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <IonButton 
                expand="block" 
                onClick={() => setActiveTab('form')}
                disabled={!form.name || !form.due_date || !form.description || form.description.trim() === '' || !form.specification || form.specification.trim() === ''}
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
              initialSpecification={form.specification}
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

        {/* Agents Tab - Only visible to developer/editor role users */}
        {activeTab === 'agents' && userProfile?.role && RoleService.isDeveloperOrHigher(userProfile.role) && (
          <div style={{ padding: '16px' }}>
            <IonText>
              <h3>Agent Management</h3>
              <p>Manage AI agents available for this RFP context:</p>
            </IonText>
            
            {/* New Agent Button */}
            <IonButton 
              expand="block" 
              fill="outline" 
              onClick={handleNewAgent}
              style={{ marginBottom: '16px' }}
            >
              <IonIcon icon={add} slot="start" />
              New Agent
            </IonButton>
            
            {/* Agents List */}
            <IonList>
              {agents.length === 0 ? (
                <IonItem>
                  <IonLabel color="medium">No agents available. Create your first agent!</IonLabel>
                </IonItem>
              ) : (
                agents.map(agent => (
                  <IonItem key={agent.id}>
                    <IonIcon icon={personCircle} slot="start" />
                    <IonLabel>
                      <h3>{agent.name}</h3>
                      {agent.description && <p>{agent.description}</p>}
                    </IonLabel>
                    <IonButton fill="clear" slot="end" onClick={() => handleEditAgent(agent)}>
                      <IonIcon icon={create} />
                    </IonButton>
                    <IonButton 
                      fill="clear" 
                      color="danger" 
                      slot="end" 
                      onClick={() => handleDeleteAgent(agent)}
                    >
                      <IonIcon icon={trash} />
                    </IonButton>
                  </IonItem>
                ))
              )}
            </IonList>
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
                    if (activeTab === 'agents') setActiveTab('preview');
                  }}
                  size="default"
                >
                  Back
                </IonButton>
              )}
              
              <IonButton 
                onClick={handleSave}
                disabled={!form.name || !form.due_date || !form.description || form.description.trim() === '' || !form.specification || form.specification.trim() === ''}
                size="default"
              >
                Save RFP
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonFooter>
      </IonModal>
      
      {/* Agent Edit Modal */}
      <AgentEditModal
        isOpen={showAgentModal}
        onCancel={() => setShowAgentModal(false)}
        agent={editingAgent}
        onSave={handleAgentSave}
      />
    </>
  );
};

export default RFPEditModal;
