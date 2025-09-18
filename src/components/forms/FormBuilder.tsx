// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonButton,
  IonTextarea,
  IonItem,
  IonLabel,
  IonSpinner,
  IonAlert,
  IonText,
  IonIcon,
  IonSelect,
  IonSelectOption
} from '@ionic/react';
import { constructOutline, documentTextOutline, downloadOutline } from 'ionicons/icons';
import { RfpForm, RfpFormArtifact } from './RfpForm';
import { downloadBidDocx } from '../../utils/docxExporter';
import type { FormSpec } from '../../types/rfp';

interface FormBuilderProps {
  onFormSpecGenerated?: (formSpec: FormSpec) => void;
  className?: string;
  initialSpecification?: string; // Pre-fill with RFP specification
}

const FORM_TEMPLATES = [
  {
    value: 'hotel',
    label: 'Hotel Bid Proposal',
    prompt: `Create a vendor bid form for hotel accommodations.

Requirements:
- Fields: hotelName (string, required), nightlyRate (number, min 50, required), currency (enum USD/EUR/GBP, default USD), amenities (multi-select: WiFi, Parking, Breakfast, Gym, Pool), blackoutDates (array of date strings), contactPerson (string), notes (string).
- Use helpful placeholders and mobile-friendly widgets.
- Include clear field descriptions and validation rules.`
  },
  {
    value: 'software',
    label: 'Software Services Proposal',
    prompt: `Create a vendor bid form for software development services.

Requirements:
- Fields: companyName (required), projectType (enum: Web App, Mobile App, Desktop App, API), teamSize (number, min 1), hourlyRate (number), technologiesUsed (array), estimatedHours (number), deliverables (array), supportIncluded (boolean), timeline (string).
- Include validation and helpful descriptions.`
  },
  {
    value: 'catering',
    label: 'Catering Services Proposal',
    prompt: `Create a vendor bid form for catering services.

Requirements:
- Fields: cateringCompany (required), eventType (enum: Wedding, Corporate, Birthday, Conference), guestCount (number, min 10), menuType (enum: Buffet, Plated, Family Style), dietaryRestrictions (array: Vegetarian, Vegan, Gluten-Free, Kosher, Halal), pricePerPerson (number), includedServices (array), setupRequired (boolean), notes (text area).
- Make it comprehensive but user-friendly.`
  },
  {
    value: 'custom',
    label: 'Custom Form',
    prompt: ''
  }
];

export const FormBuilder: React.FC<FormBuilderProps> = ({
  onFormSpecGenerated,
  className,
  initialSpecification = ''
}) => {
  const [customPrompt, setCustomPrompt] = useState(initialSpecification);
  const [selectedTemplate, setSelectedTemplate] = useState<string>(initialSpecification ? 'custom' : '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [generatedFormSpec, setGeneratedFormSpec] = useState<FormSpec | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [previewFormData, setPreviewFormData] = useState<Record<string, any>>({});

  const generateFormSpec = async () => {
    if (!selectedTemplate) {
      setAlertMessage('Please select a form template first.');
      setShowAlert(true);
      return;
    }

    const template = FORM_TEMPLATES.find(t => t.value === selectedTemplate);
    if (!template) return;

    let prompt = template.prompt;
    if (selectedTemplate === 'custom' && !customPrompt.trim()) {
      setAlertMessage('Please enter a custom prompt for your form.');
      setShowAlert(true);
      return;
    }

    if (selectedTemplate === 'custom') {
      prompt = customPrompt;
    }

    setIsGenerating(true);

    try {
      // In a real implementation, this would call Claude API or a form generation service
      // For now, we'll create a mock form spec based on the template
      const formSpec = await mockGenerateFormSpec(selectedTemplate, prompt);
      
      setGeneratedFormSpec(formSpec);
      onFormSpecGenerated?.(formSpec);

      setAlertMessage('Form generated successfully! You can now preview and test it below.');
      setShowAlert(true);
    } catch (error) {
      console.error('Form generation error:', error);
      setAlertMessage('Error generating form. Please try again.');
      setShowAlert(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handlePreviewSubmit = (data: Record<string, any>) => {
    console.log('Preview form submitted:', data);
    setAlertMessage('Form submitted successfully! In a real scenario, this would save the bid response.');
    setShowAlert(true);
  };

  const handleDownloadDocx = async () => {
    if (!generatedFormSpec || !previewFormData) return;

    try {
      await downloadBidDocx(generatedFormSpec, previewFormData, {
        title: 'Sample Bid Response',
        filename: 'sample-bid-response.docx',
        companyName: 'Your Company',
        rfpName: (generatedFormSpec.schema as { title?: string }).title || 'Sample RFP',
        submissionDate: new Date()
      });
    } catch (error) {
      console.error('Error generating DOCX:', error);
      setAlertMessage('Error generating document. Please try again.');
      setShowAlert(true);
    }
  };

  return (
    <div className={className}>
      {/* Form Generator */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>
            <IonIcon icon={constructOutline} style={{ marginRight: '8px' }} />
            AI Form Builder
          </IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <IonItem>
            <IonLabel position="stacked">Select Form Template</IonLabel>
            <IonSelect
              placeholder="Choose a template or create custom"
              value={selectedTemplate}
              onIonChange={(e) => setSelectedTemplate(e.detail.value)}
            >
              {FORM_TEMPLATES.map(template => (
                <IonSelectOption key={template.value} value={template.value}>
                  {template.label}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>

          {selectedTemplate === 'custom' && (
            <IonItem>
              <IonLabel position="stacked">
                {initialSpecification ? 'RFP Specification (Customize as needed)' : 'Custom Form Requirements'}
              </IonLabel>
              <IonTextarea
                placeholder={initialSpecification ? 
                  "Review and modify the RFP specification below, or describe additional form requirements..." :
                  "Describe the form you want to create. Include field names, types, validation rules, and any specific requirements..."
                }
                value={customPrompt}
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                onIonInput={(e) => setCustomPrompt(e.detail.value!)}
                rows={6}
                autoGrow
              />
            </IonItem>
          )}

          {selectedTemplate && selectedTemplate !== 'custom' && (
            <IonItem>
              <IonLabel position="stacked">Form Description</IonLabel>
              <IonText color="medium">
                <p>{FORM_TEMPLATES.find(t => t.value === selectedTemplate)?.prompt}</p>
              </IonText>
            </IonItem>
          )}

          <IonButton
            expand="block"
            onClick={generateFormSpec}
            disabled={isGenerating || !selectedTemplate}
            style={{ marginTop: '20px' }}
          >
            {isGenerating && <IonSpinner name="crescent" slot="start" />}
            <IonIcon icon={constructOutline} slot="start" />
            Generate Form
          </IonButton>
        </IonCardContent>
      </IonCard>

      {/* Generated Form Preview */}
      {generatedFormSpec && (
        <>
          {/* Form Schema Display */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>
                <IonIcon icon={documentTextOutline} style={{ marginRight: '8px' }} />
                Generated Form Schema
              </IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonTextarea
                readonly
                value={JSON.stringify(generatedFormSpec, null, 2)}
                rows={10}
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            </IonCardContent>
          </IonCard>

          {/* Interactive Form Preview */}
          <RfpForm
            formSpec={generatedFormSpec}
            formData={previewFormData}
            onChange={setPreviewFormData}
            onSubmit={handlePreviewSubmit}
            title="Form Preview (Interactive)"
            submitButtonText="Test Submit"
          />

          {/* Readonly Artifact Preview */}
          <RfpFormArtifact
            formSpec={generatedFormSpec}
            formData={previewFormData}
            title="Artifact View (Read-only)"
          />

          {/* Export Options */}
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Export Options</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonButton
                expand="block"
                fill="outline"
                onClick={handleDownloadDocx}
                disabled={Object.keys(previewFormData).length === 0}
              >
                <IonIcon icon={downloadOutline} slot="start" />
                Download as Word Document
              </IonButton>
              <IonText color="medium">
                <p style={{ marginTop: '8px', fontSize: '0.875rem' }}>
                  Fill out the form above to enable document export
                </p>
              </IonText>
            </IonCardContent>
          </IonCard>
        </>
      )}

      <IonAlert
        isOpen={showAlert}
        onDidDismiss={() => setShowAlert(false)}
        header="Form Builder"
        message={alertMessage}
        buttons={['OK']}
      />
    </div>
  );
};

// Mock form generation function (replace with actual Claude API call)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function mockGenerateFormSpec(template: string, prompt: string): Promise<FormSpec> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  switch (template) {
    case 'hotel':
      return {
        version: 'rfpez-form@1',
        schema: {
          title: 'Hotel Bid Proposal',
          type: 'object',
          required: ['hotelName', 'nightlyRate', 'amenities'],
          properties: {
            hotelName: {
              type: 'string',
              title: 'Hotel Name'
            },
            nightlyRate: {
              type: 'number',
              title: 'Nightly Rate (USD)',
              minimum: 50
            },
            currency: {
              type: 'string',
              title: 'Currency',
              default: 'USD',
              enum: ['USD', 'EUR', 'GBP']
            },
            amenities: {
              type: 'array',
              title: 'Available Amenities',
              items: {
                type: 'string',
                enum: ['WiFi', 'Parking', 'Breakfast', 'Gym', 'Pool']
              },
              uniqueItems: true
            },
            blackoutDates: {
              type: 'array',
              title: 'Blackout Dates',
              items: {
                type: 'string',
                format: 'date'
              }
            },
            contactPerson: {
              type: 'string',
              title: 'Contact Person'
            },
            notes: {
              type: 'string',
              title: 'Additional Notes'
            }
          }
        },
        uiSchema: {
          hotelName: {
            'ui:placeholder': 'e.g., Oceanview Suites',
            'ui:autofocus': true
          },
          nightlyRate: {
            'ui:widget': 'ionNumber'
          },
          currency: {
            'ui:widget': 'ionSelect'
          },
          amenities: {
            'ui:widget': 'ionCheckboxes'
          },
          blackoutDates: {
            'ui:widget': 'ionArray',
            items: {
              'ui:widget': 'ionDate'
            }
          },
          contactPerson: {
            'ui:placeholder': 'Primary contact for this proposal'
          },
          notes: {
            'ui:widget': 'ionTextarea',
            'ui:options': {
              rows: 4
            }
          }
        },
        defaults: {
          currency: 'USD'
        }
      };

    case 'software':
      return {
        version: 'rfpez-form@1',
        schema: {
          title: 'Software Services Proposal',
          type: 'object',
          required: ['companyName', 'projectType', 'teamSize', 'hourlyRate'],
          properties: {
            companyName: {
              type: 'string',
              title: 'Company Name'
            },
            projectType: {
              type: 'string',
              title: 'Project Type',
              enum: ['Web App', 'Mobile App', 'Desktop App', 'API']
            },
            teamSize: {
              type: 'number',
              title: 'Team Size',
              minimum: 1
            },
            hourlyRate: {
              type: 'number',
              title: 'Hourly Rate (USD)',
              minimum: 25
            },
            technologiesUsed: {
              type: 'array',
              title: 'Technologies Used',
              items: {
                type: 'string'
              }
            },
            estimatedHours: {
              type: 'number',
              title: 'Estimated Hours'
            },
            supportIncluded: {
              type: 'boolean',
              title: 'Post-Launch Support Included'
            },
            timeline: {
              type: 'string',
              title: 'Estimated Timeline'
            }
          }
        },
        uiSchema: {
          companyName: {
            'ui:placeholder': 'Your company name'
          },
          projectType: {
            'ui:widget': 'ionSelect'
          },
          teamSize: {
            'ui:widget': 'ionNumber'
          },
          hourlyRate: {
            'ui:widget': 'ionNumber'
          },
          technologiesUsed: {
            'ui:widget': 'ionArray'
          },
          estimatedHours: {
            'ui:widget': 'ionNumber'
          },
          supportIncluded: {
            'ui:widget': 'ionToggle'
          },
          timeline: {
            'ui:placeholder': 'e.g., 3-4 months'
          }
        }
      };

    default:
      // Custom form - create a basic structure
      return {
        version: 'rfpez-form@1',
        schema: {
          title: 'Custom Form',
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              title: 'Name'
            },
            description: {
              type: 'string',
              title: 'Description'
            }
          }
        },
        uiSchema: {
          name: {
            'ui:placeholder': 'Enter name'
          },
          description: {
            'ui:widget': 'ionTextarea'
          }
        }
      };
  }
}

export default FormBuilder;
