// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonText,
  IonGrid,
  IonRow,
  IonCol
} from '@ionic/react';
import { RfpForm } from '../components/forms/RfpForm';
import { FormBuilder } from '../components/forms/FormBuilder';
import { DocxExporter } from '../utils/docxExporter';
import type { FormSpec } from '../types/rfp';

// Test form spec matching what's in the database
const testFormSpec: FormSpec = {
  version: "rfpez-form@1",
  schema: {
    title: "Hotel Bid Proposal",
    type: "object",
    required: ["hotelName", "nightlyRate", "amenities"],
    properties: {
      hotelName: {
        type: "string",
        title: "Hotel Name"
      },
      nightlyRate: {
        type: "number",
        title: "Nightly Rate (USD)",
        minimum: 50
      },
      currency: {
        type: "string",
        title: "Currency",
        default: "USD",
        enum: ["USD", "EUR", "GBP"]
      },
      amenities: {
        type: "array",
        title: "Amenities",
        items: {
          type: "string",
          enum: ["WiFi", "Parking", "Breakfast", "Gym", "Pool"]
        },
        uniqueItems: true
      },
      notes: {
        type: "string",
        title: "Additional Notes"
      }
    }
  },
  uiSchema: {
    hotelName: {
      "ui:placeholder": "e.g., Oceanview Suites",
      "ui:autofocus": true
    },
    nightlyRate: {
      "ui:widget": "updown"
    },
    currency: {
      "ui:widget": "select"
    },
    amenities: {
      "ui:widget": "checkboxes"
    },
    notes: {
      "ui:widget": "textarea",
      "ui:options": {
        rows: 4
      }
    }
  },
  defaults: {
    currency: "USD"
  }
};

const RjsfTestPage: React.FC = () => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [generatedFormSpec, setGeneratedFormSpec] = useState<FormSpec | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleFormChange = (data: Record<string, unknown>) => {
    setFormData(data);
    addTestResult(`Form data updated: ${JSON.stringify(data, null, 2)}`);
  };

  const handleFormSubmit = (data: Record<string, unknown>) => {
    addTestResult(`Form submitted with data: ${JSON.stringify(data, null, 2)}`);
  };

  const handleFormGenerated = (formSpec: FormSpec) => {
    setGeneratedFormSpec(formSpec);
    addTestResult(`AI Form generated: ${(formSpec.schema as { title?: string }).title || 'Untitled Form'}`);
  };

  const testDocxExport = async () => {
    try {
      await DocxExporter.downloadBidDocx(testFormSpec, formData, {
        title: 'Test Bid Response',
        rfpName: 'Test RFP - Hotel Services',
        companyName: 'Test Company Inc.',
        filename: 'test-bid-response.docx'
      });
      addTestResult('✅ DOCX export successful');
    } catch (error) {
      addTestResult(`❌ DOCX export failed: ${error}`);
    }
  };

  const runAllTests = () => {
    setTestResults([]);
    addTestResult('🧪 Starting RJSF component tests...');
    
    // Test 1: Form spec validation
    try {
      const isValid = testFormSpec.schema && testFormSpec.schema.type === 'object';
      addTestResult(isValid ? '✅ Form spec structure valid' : '❌ Form spec structure invalid');
    } catch (error) {
      addTestResult(`❌ Form spec validation failed: ${error}`);
    }

    // Test 2: Default values
    if (testFormSpec.defaults) {
      addTestResult(`✅ Default values loaded: ${JSON.stringify(testFormSpec.defaults)}`);
    }

    // Test 3: UI Schema
    if (testFormSpec.uiSchema) {
      addTestResult(`✅ UI Schema configured with ${Object.keys(testFormSpec.uiSchema).length} widgets`);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>RJSF Testing Page</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <IonGrid>
          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Test Controls</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <IonButton 
                    expand="block" 
                    color="primary" 
                    onClick={runAllTests}
                    style={{ marginBottom: '10px' }}
                  >
                    Run All Tests
                  </IonButton>
                  <IonButton 
                    expand="block" 
                    color="secondary" 
                    onClick={testDocxExport}
                    disabled={Object.keys(formData).length === 0}
                  >
                    Test DOCX Export
                  </IonButton>
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          <IonRow>
            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Test Form (from Database)</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <RfpForm
                    formSpec={testFormSpec}
                    formData={formData}
                    onChange={handleFormChange}
                    onSubmit={handleFormSubmit}
                    submitButtonText="Test Submit"
                  />
                </IonCardContent>
              </IonCard>
            </IonCol>

            <IonCol size="12" sizeMd="6">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>AI Form Builder Test</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  <FormBuilder onFormSpecGenerated={handleFormGenerated} />
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>

          {generatedFormSpec && (
            <IonRow>
              <IonCol size="12">
                <IonCard>
                  <IonCardHeader>
                    <IonCardTitle>Generated Form Preview</IonCardTitle>
                  </IonCardHeader>
                  <IonCardContent>
                    <RfpForm
                      formSpec={generatedFormSpec}
                      showTitle={true}
                      showSubmitButton={false}
                      readonly={true}
                    />
                  </IonCardContent>
                </IonCard>
              </IonCol>
            </IonRow>
          )}

          <IonRow>
            <IonCol size="12">
              <IonCard>
                <IonCardHeader>
                  <IonCardTitle>Test Results</IonCardTitle>
                </IonCardHeader>
                <IonCardContent>
                  {testResults.length === 0 ? (
                    <IonText color="medium">
                      <p>Click &quot;Run All Tests&quot; to start testing...</p>
                    </IonText>
                  ) : (
                    <div style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                      {testResults.map((result, index) => (
                        <div key={index} style={{ marginBottom: '5px' }}>
                          {result}
                        </div>
                      ))}
                    </div>
                  )}
                </IonCardContent>
              </IonCard>
            </IonCol>
          </IonRow>
        </IonGrid>
      </IonContent>
    </IonPage>
  );
};

export default RjsfTestPage;
