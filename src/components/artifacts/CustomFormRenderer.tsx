// Copyright Mark Skiba, 2025 All rights reserved

import React, { useState, useEffect } from 'react';
import { IonInput, IonTextarea, IonSelect, IonSelectOption, IonItem, IonLabel, IonButton } from '@ionic/react';
import { RJSFSchema } from '@rjsf/utils';

interface CustomFormRendererProps {
  schema: RJSFSchema;
  formData: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  onSave?: (data: Record<string, unknown>) => void;
  isPortrait?: boolean;
}

const CustomFormRenderer: React.FC<CustomFormRendererProps> = ({
  schema,
  formData: initialFormData,
  onSubmit,
  onSave,
  isPortrait = false
}) => {
  const [formValues, setFormValues] = useState<Record<string, unknown>>(initialFormData);
  const [isSaving, setIsSaving] = useState(false);

  // Update form values when initialFormData changes
  useEffect(() => {
    console.log('📝 CustomFormRenderer: Initializing with data:', {
      fieldCount: Object.keys(initialFormData).length,
      sampleFields: Object.keys(initialFormData).slice(0, 5),
      sampleValues: {
        company_name: initialFormData['company_name'],
        contact_person: initialFormData['contact_person'],
        project_name: initialFormData['project_name']
      }
    });
    setFormValues(initialFormData);
  }, [initialFormData]);

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📤 Submitting form data:', formValues);
    onSubmit(formValues);
  };

  const handleSave = async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      console.log('💾 Saving draft:', formValues);
      await onSave(formValues);
    } catch (error) {
      console.error('Error saving form:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderField = (fieldName: string, fieldSchema: any) => {
    const value = formValues[fieldName];
    const title = fieldSchema.title || fieldName;
    const description = fieldSchema.description;
    const type = fieldSchema.type;
    const enumValues = fieldSchema.enum;
    
    // Handle nested object schemas (like budget_and_pricing, evaluation_criteria)
    if (type === 'object' && fieldSchema.properties) {
      const requiredFields = Array.isArray(fieldSchema.required) ? fieldSchema.required : [];
      
      return (
        <div key={fieldName} style={{ marginBottom: '24px' }}>
          <h3 style={{ margin: '16px 0 12px 0', fontSize: '1.1rem', fontWeight: '600' }}>
            {title}
          </h3>
          {description && (
            <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#666' }}>
              {description}
            </p>
          )}
          <div style={{ paddingLeft: '16px', borderLeft: '3px solid var(--ion-color-primary)' }}>
            {Object.keys(fieldSchema.properties).map(subFieldName => {
              const subFieldSchema = fieldSchema.properties[subFieldName];
              const isRequired = requiredFields.includes(subFieldName);
              
              return renderField(subFieldName, {
                ...subFieldSchema,
                // Don't pass required as a property, it's handled by the schema
                title: subFieldSchema.title || subFieldName,
              });
            })}
          </div>
        </div>
      );
    }

    // Handle enum/select fields
    if (enumValues && Array.isArray(enumValues)) {
      // Check if current value matches any enum option
      const valueStr = String(value || '');
      const hasMatchingEnum = enumValues.includes(valueStr);
      
      // If value doesn't match enum options and is substantial text, render as textarea
      // This handles cases where user entered free-form text instead of selecting from options
      if (!hasMatchingEnum && valueStr.length > 50) {
        console.log(`⚠️ Field "${fieldName}" has enum but value doesn't match. Rendering as textarea.`, {
          value: valueStr.substring(0, 100),
          enumOptions: enumValues
        });
        
        return (
          <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
            <IonLabel position="stacked">
              {title}
              {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
              {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
              <p style={{ fontSize: '0.75em', color: '#ff9800', marginTop: '4px' }}>
                ⚠️ Custom value (not from predefined options)
              </p>
            </IonLabel>
            <IonTextarea
              value={valueStr}
              rows={3}
              onIonChange={(e) => handleFieldChange(fieldName, e.detail.value || '')}
            />
          </IonItem>
        );
      }
      
      // Standard dropdown for enum values
      return (
        <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
          <IonLabel position="stacked">
            {title}
            {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
            {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
          </IonLabel>
          <IonSelect
            value={hasMatchingEnum ? valueStr : undefined}
            placeholder={`Select ${title}`}
            onIonChange={(e) => handleFieldChange(fieldName, e.detail.value)}
          >
            {!hasMatchingEnum && valueStr && (
              <IonSelectOption value={valueStr}>
                {valueStr.length > 50 ? valueStr.substring(0, 47) + '...' : valueStr}
              </IonSelectOption>
            )}
            {enumValues.map((option: string) => (
              <IonSelectOption key={option} value={option}>
                {option}
              </IonSelectOption>
            ))}
          </IonSelect>
        </IonItem>
      );
    }

    // Handle textarea for long text
    if (type === 'string' && (fieldSchema.maxLength > 200 || !fieldSchema.maxLength)) {
      return (
        <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
          <IonLabel position="stacked">
            {title}
            {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
            {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
          </IonLabel>
          <IonTextarea
            value={value as string || ''}
            placeholder={`Enter ${title}`}
            rows={4}
            onIonChange={(e) => handleFieldChange(fieldName, e.detail.value)}
            style={{ marginTop: '8px' }}
          />
        </IonItem>
      );
    }

    // Handle number fields
    if (type === 'number' || type === 'integer') {
      return (
        <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
          <IonLabel position="stacked">
            {title}
            {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
            {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
          </IonLabel>
          <IonInput
            type="number"
            value={value as number || ''}
            placeholder={`Enter ${title}`}
            onIonChange={(e) => handleFieldChange(fieldName, parseFloat(e.detail.value as string))}
          />
        </IonItem>
      );
    }

    // Handle boolean fields
    if (type === 'boolean') {
      return (
        <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
          <IonLabel>
            {title}
            {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
          </IonLabel>
          <IonSelect
            value={value?.toString() || 'false'}
            onIonChange={(e) => handleFieldChange(fieldName, e.detail.value === 'true')}
          >
            <IonSelectOption value="true">Yes</IonSelectOption>
            <IonSelectOption value="false">No</IonSelectOption>
          </IonSelect>
        </IonItem>
      );
    }

    // Default: string input
    return (
      <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
        <IonLabel position="stacked">
          {title}
          {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
          {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
        </IonLabel>
        <IonInput
          type="text"
          value={value as string || ''}
          placeholder={`Enter ${title}`}
          onIonChange={(e) => handleFieldChange(fieldName, e.detail.value)}
        />
      </IonItem>
    );
  };

  const properties = schema.properties || {};
  const requiredFields = schema.required || [];
  
  // Get all field names from both schema AND formData to handle cases where
  // data exists but isn't in schema (flat fields vs nested schema structure)
  const allFieldNames = new Set([
    ...Object.keys(properties),
    ...Object.keys(formValues)
  ]);
  
  console.log('📋 CustomFormRenderer fields:', {
    schemaFields: Object.keys(properties).length,
    dataFields: Object.keys(formValues).length,
    totalFields: allFieldNames.size,
    schemaFieldNames: Object.keys(properties),
    dataFieldNames: Object.keys(formValues).slice(0, 10)
  });

  return (
    <form onSubmit={handleSubmit} style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Form Header */}
      <div style={{ 
        padding: isPortrait ? '12px' : '16px',
        borderBottom: '1px solid var(--ion-color-light)',
        flexShrink: 0
      }}>
        <h2 style={{ margin: 0, fontSize: isPortrait ? '1.2rem' : '1.5rem' }}>
          {schema.title || 'Form'}
        </h2>
        {schema.description && (
          <p style={{ margin: '8px 0 0 0', fontSize: '0.9rem', color: '#666' }}>
            {schema.description}
          </p>
        )}
      </div>

      {/* Form Fields */}
      <div style={{ 
        flex: 1, 
        overflow: 'auto',
        padding: isPortrait ? '12px' : '16px'
      }}>
        {Array.from(allFieldNames).map(fieldName => {
          const fieldSchema = properties[fieldName];
          
          // If field has schema definition, use it
          if (fieldSchema && typeof fieldSchema === 'object' && fieldSchema !== null) {
            return renderField(fieldName, {
              ...fieldSchema,
              required: requiredFields.includes(fieldName)
            });
          }
          
          // Otherwise render as basic string field (for flat data not in schema)
          return renderField(fieldName, {
            type: 'string',
            title: fieldName.split('_').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            required: false
          });
        })}
      </div>

      {/* Action Buttons */}
      <div style={{ 
        padding: isPortrait ? '12px' : '16px',
        borderTop: '1px solid var(--ion-color-light)',
        display: 'flex',
        gap: '12px',
        flexShrink: 0
      }}>
        {onSave && (
          <IonButton
            expand="block"
            fill="outline"
            onClick={handleSave}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            {isSaving ? 'Saving...' : 'Save Draft'}
          </IonButton>
        )}
        <IonButton
          expand="block"
          type="submit"
          style={{ flex: 1 }}
        >
          Submit
        </IonButton>
      </div>
    </form>
  );
};

export default CustomFormRenderer;
