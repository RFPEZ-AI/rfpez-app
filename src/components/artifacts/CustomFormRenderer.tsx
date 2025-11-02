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
    
    // Debug logging for array fields
    if (fieldName === 'vendors' || type === 'array') {
      console.log(`🔍 Rendering field "${fieldName}":`, {
        type,
        hasItems: !!fieldSchema.items,
        itemsType: fieldSchema.items?.type,
        hasItemProperties: !!(fieldSchema.items?.properties),
        isArray: Array.isArray(value),
        arrayLength: Array.isArray(value) ? value.length : 'N/A',
        valueType: typeof value,
        valuePreview: Array.isArray(value) ? `Array(${value.length}) with first item: ${JSON.stringify(value[0])}` : value?.toString?.()?.substring(0, 100)
      });
    }
    
    // Handle nested object schemas (like budget_and_pricing, evaluation_criteria)
    if (type === 'object' && fieldSchema.properties) {
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

    // Handle array fields (like vendors array)
    if (type === 'array') {
      if (!fieldSchema.items) {
        console.warn(`⚠️ Array field "${fieldName}" has no items schema, rendering as simple list`);
      }
      
      const arrayValue = Array.isArray(value) ? value : [];
      const itemSchema = fieldSchema.items;
      
      if (!itemSchema) {
        // Array with no item schema - render as simple list
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
            <ul style={{ paddingLeft: '24px' }}>
              {arrayValue.length === 0 ? (
                <li style={{ color: '#999', fontStyle: 'italic' }}>No items</li>
              ) : (
                arrayValue.map((item: any, index: number) => (
                  <li key={index}>{JSON.stringify(item)}</li>
                ))
              )}
            </ul>
          </div>
        );
      }
      
      // If array items are objects with properties, render them in a structured way
      if (itemSchema.type === 'object' && itemSchema.properties) {
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
            
            {arrayValue.length === 0 ? (
              <p style={{ color: '#999', fontStyle: 'italic', padding: '12px' }}>
                No items
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {arrayValue.map((item: any, index: number) => (
                  <div 
                    key={index}
                    style={{ 
                      padding: '12px',
                      border: '1px solid var(--ion-color-light)',
                      borderRadius: '8px',
                      backgroundColor: 'var(--ion-color-light-tint)'
                    }}
                  >
                    {Object.keys(itemSchema.properties).map(propName => {
                      const propSchema = itemSchema.properties[propName];
                      const propValue = item[propName];
                      const propTitle = propSchema.title || propName;
                      
                      // Special handling for boolean checkboxes
                      if (propSchema.type === 'boolean') {
                        return (
                          <div key={propName} style={{ marginBottom: '8px' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                              <input
                                type="checkbox"
                                checked={propValue === true}
                                onChange={(e) => {
                                  const newArray = [...arrayValue];
                                  newArray[index] = { ...item, [propName]: e.target.checked };
                                  handleFieldChange(fieldName, newArray);
                                }}
                                style={{ 
                                  width: '20px', 
                                  height: '20px',
                                  cursor: 'pointer',
                                  accentColor: 'var(--ion-color-primary)',
                                  backgroundColor: 'white',
                                  border: '2px solid #ccc',
                                  borderRadius: '3px'
                                }}
                              />
                              <span style={{ fontWeight: '500' }}>{propTitle}</span>
                            </label>
                          </div>
                        );
                      }
                      
                      // For other types, display as read-only for now
                      return (
                        <div key={propName} style={{ marginBottom: '8px' }}>
                          <strong style={{ fontSize: '0.9rem', color: '#666' }}>
                            {propTitle}:
                          </strong>{' '}
                          <span>
                            {propSchema.format === 'uri' && propValue ? (
                              <a href={propValue as string} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--ion-color-primary)' }}>
                                {propValue as string}
                              </a>
                            ) : (
                              propValue?.toString() || '-'
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      // For simple array types (strings, numbers), show as list
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
          <ul style={{ paddingLeft: '24px' }}>
            {arrayValue.length === 0 ? (
              <li style={{ color: '#999', fontStyle: 'italic' }}>No items</li>
            ) : (
              arrayValue.map((item: any, index: number) => (
                <li key={index}>{item?.toString() || '-'}</li>
              ))
            )}
          </ul>
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
      // Use text input with inputmode for better decimal support across browsers
      // This allows decimal points and proper keyboard on mobile
      return (
        <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
          <IonLabel position="stacked">
            {title}
            {fieldSchema.required && <span style={{ color: 'red' }}> *</span>}
            {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
          </IonLabel>
          <IonInput
            type="text"
            inputmode="decimal"
            value={value as number || ''}
            placeholder={`Enter ${title}`}
            onIonChange={(e) => {
              const val = e.detail.value as string;
              // Allow partial input like "123." for typing convenience
              if (val === '' || val === '-' || val.match(/^-?\d*\.?\d*$/)) {
                const numVal = parseFloat(val);
                handleFieldChange(fieldName, isNaN(numVal) ? val : numVal);
              }
            }}
          />
        </IonItem>
      );
    }

    // Handle boolean fields
    if (type === 'boolean') {
      // Special handling for select_all field to control vendor selection checkboxes
      if (fieldName === 'select_all') {
        const handleSelectAllChange = (selectAll: boolean) => {
          // Update the select_all field
          handleFieldChange(fieldName, selectAll);
          
          // Find and update all vendor checkboxes
          const vendorsField = Object.keys(properties).find(key => {
            const prop = properties[key];
            return prop && typeof prop === 'object' && 'type' in prop && 
              prop.type === 'array' && 
              (key === 'vendors' || key.toLowerCase().includes('vendor'));
          });
          
          if (vendorsField && formValues[vendorsField]) {
            const vendors = formValues[vendorsField] as any[];
            if (Array.isArray(vendors)) {
              const updatedVendors = vendors.map(vendor => ({
                ...vendor,
                selected: selectAll
              }));
              handleFieldChange(vendorsField, updatedVendors);
            }
          }
        };
        
        return (
          <IonItem key={fieldName} style={{ marginBottom: '12px' }}>
            <IonLabel>
              {title}
              {description && <p style={{ fontSize: '0.85em', color: '#666', marginTop: '4px' }}>{description}</p>}
            </IonLabel>
            <IonSelect
              value={value?.toString() || 'false'}
              onIonChange={(e) => handleSelectAllChange(e.detail.value === 'true')}
            >
              <IonSelectOption value="true">Yes</IonSelectOption>
              <IonSelectOption value="false">No</IonSelectOption>
            </IonSelect>
          </IonItem>
        );
      }
      
      // Standard boolean field
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
            data-testid="form-save-button"
            expand="block"
            fill="outline"
            onClick={handleSave}
            disabled={isSaving}
            style={{ flex: 1 }}
          >
            {isSaving ? 'Saving...' : '💾 Save Draft'}
          </IonButton>
        )}
        <IonButton
          data-testid="form-submit"
          expand="block"
          type="submit"
          style={{ flex: 1 }}
        >
          Submit Questionnaire
        </IonButton>
      </div>
    </form>
  );
};

export default CustomFormRenderer;
