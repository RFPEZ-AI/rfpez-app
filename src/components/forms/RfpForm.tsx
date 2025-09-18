// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import Form from '@rjsf/core';
import validator from '@rjsf/validator-ajv8';
import type { IChangeEvent } from '@rjsf/core';
import { IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonButton, IonSpinner, IonText } from '@ionic/react';
import { ionicWidgets } from './IonicWidgets';
import { IonicFieldTemplate, IonicObjectFieldTemplate, IonicArrayFieldTemplate } from './IonicFieldTemplate';
import type { FormSpec } from '../../types/rfp';

interface RfpFormProps {
  formSpec: FormSpec;
  formData?: Record<string, unknown>;
  onSubmit?: (data: Record<string, unknown>) => void;
  onChange?: (data: Record<string, unknown>) => void;
  onError?: (errors: unknown[]) => void;
  onSubmitSuccess?: (formName: string) => void; // Callback for successful submissions to trigger auto-prompts
  disabled?: boolean;
  readonly?: boolean;
  title?: string;
  showTitle?: boolean;
  showSubmitButton?: boolean;
  submitButtonText?: string;
  loading?: boolean;
  className?: string;
}

export const RfpForm: React.FC<RfpFormProps> = ({
  formSpec,
  formData,
  onSubmit,
  onChange,
  onError,
  onSubmitSuccess,
  disabled = false,
  readonly = false,
  title,
  showTitle = true,
  showSubmitButton = true,
  submitButtonText = 'Submit',
  loading = false,
  className
}) => {
  // Add defensive checks for formSpec structure
  if (!formSpec) {
    return (
      <IonCard className={className}>
        <IonCardContent>
          <IonText color="danger">
            <p>Form specification is missing</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  const { schema, uiSchema, defaults } = formSpec;

  // Add defensive check for schema
  if (!schema) {
    return (
      <IonCard className={className}>
        <IonCardContent>
          <IonText color="danger">
            <p>Form schema is missing</p>
          </IonText>
        </IonCardContent>
      </IonCard>
    );
  }

  // Merge defaults with formData
  const effectiveFormData = React.useMemo(() => {
    return { ...(defaults || {}), ...formData };
  }, [defaults, formData]);

  const handleSubmit = async (data: IChangeEvent<Record<string, unknown>>) => {
    if (data.formData) {
      try {
        // Call the original onSubmit handler
        await onSubmit?.(data.formData);
        
        // If submission was successful, trigger auto-prompt
        if (onSubmitSuccess) {
          const formName = title || (schema as { title?: string }).title || 'Form';
          onSubmitSuccess(formName);
        }
      } catch (error) {
        console.error('Form submission failed:', error);
        // Don't trigger auto-prompt if submission failed
      }
    }
  };

  const handleChange = (data: IChangeEvent<Record<string, unknown>>) => {
    if (data.formData) {
      onChange?.(data.formData);
    }
  };

  const handleError = (errors: unknown[]) => {
    onError?.(errors);
  };

  const templates = {
    FieldTemplate: IonicFieldTemplate,
    ObjectFieldTemplate: IonicObjectFieldTemplate,
    ArrayFieldTemplate: IonicArrayFieldTemplate
  };

  return (
    <IonCard className={className}>
      {showTitle && (title || (schema as { title?: string })?.title) && (
        <IonCardHeader>
          <IonCardTitle>{title || (schema as { title?: string })?.title}</IonCardTitle>
          {(schema as { description?: string })?.description && (
            <IonText color="medium">
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                {(schema as { description?: string }).description}
              </p>
            </IonText>
          )}
        </IonCardHeader>
      )}
      
      <IonCardContent>
        <Form
          schema={schema}
          uiSchema={uiSchema || {}}
          formData={effectiveFormData}
          widgets={ionicWidgets}
          templates={templates}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          validator={validator as any}
          onSubmit={handleSubmit}
          onChange={handleChange}
          onError={handleError}
          disabled={disabled || readonly}
          liveValidate={!readonly}
          showErrorList={false} // We handle errors in the field template
          noHtml5Validate
        >
          {showSubmitButton && !readonly && (
            <div style={{ marginTop: '20px', textAlign: 'center' }}>
              <IonButton
                type="submit"
                expand="block"
                disabled={disabled || loading}
                style={{ maxWidth: '300px', margin: '0 auto' }}
              >
                {loading && <IonSpinner name="crescent" slot="start" />}
                {submitButtonText}
              </IonButton>
            </div>
          )}
        </Form>
      </IonCardContent>
    </IonCard>
  );
};

// Readonly version for artifacts
export const RfpFormArtifact: React.FC<RfpFormProps> = (props) => {
  return (
    <RfpForm
      {...props}
      readonly={true}
      showSubmitButton={false}
      showTitle={props.showTitle ?? true}
      title={props.title || 'Form Response'}
    />
  );
};

export default RfpForm;
