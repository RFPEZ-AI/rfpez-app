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
  disabled = false,
  readonly = false,
  title,
  showTitle = true,
  showSubmitButton = true,
  submitButtonText = 'Submit',
  loading = false,
  className
}) => {
  const { schema, uiSchema, defaults } = formSpec;

  // Merge defaults with formData
  const effectiveFormData = React.useMemo(() => {
    return { ...defaults, ...formData };
  }, [defaults, formData]);

  const handleSubmit = (data: IChangeEvent<Record<string, unknown>>) => {
    if (data.formData) {
      onSubmit?.(data.formData);
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
      {showTitle && (title || schema.title) && (
        <IonCardHeader>
          <IonCardTitle>{title || schema.title}</IonCardTitle>
          {schema.description && (
            <IonText color="medium">
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem' }}>
                {schema.description}
              </p>
            </IonText>
          )}
        </IonCardHeader>
      )}
      
      <IonCardContent>
        <Form
          schema={schema}
          uiSchema={uiSchema}
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
