import React from 'react';
import { IonItem, IonLabel, IonNote, IonText } from '@ionic/react';
import type { FieldTemplateProps } from '@rjsf/utils';

export const IonicFieldTemplate: React.FC<FieldTemplateProps> = ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id,
  children,
  classNames,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disabled,
  displayLabel,
  hidden,
  label,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDropPropertyClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onKeyChange,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readonly,
  required,
  rawErrors = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  errors,
  help,
  description,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rawDescription,
  schema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uiSchema
}) => {
  if (hidden) {
    return <div className="field-hidden">{children}</div>;
  }

  const hasErrors = rawErrors.length > 0;
  const isArrayType = schema.type === 'array';
  const isObjectType = schema.type === 'object';
  
  // For arrays and objects, render without IonItem wrapper
  if (isArrayType || isObjectType) {
    return (
      <div className={`field-template ${classNames}`} style={{ marginBottom: '16px' }}>
        {displayLabel && label && (
          <IonText>
            <h6 style={{ 
              margin: '8px 0', 
              fontWeight: 'bold',
              color: hasErrors ? 'var(--ion-color-danger)' : 'var(--ion-text-color)'
            }}>
              {label}
              {required && <span style={{ color: 'var(--ion-color-danger)' }}> *</span>}
            </h6>
          </IonText>
        )}
        
        {description && (
          <IonNote style={{ display: 'block', marginBottom: '8px' }}>
            {description}
          </IonNote>
        )}
        
        {children}
        
        {hasErrors && (
          <IonText color="danger">
            <small style={{ display: 'block', marginTop: '4px' }}>
              {rawErrors.join('. ')}
            </small>
          </IonText>
        )}
        
        {help && (
          <IonNote style={{ display: 'block', marginTop: '4px' }}>
            {help}
          </IonNote>
        )}
      </div>
    );
  }

  // For simple fields, use IonItem wrapper
  return (
    <IonItem 
      className={`field-template ${classNames}`}
      color={hasErrors ? 'danger' : undefined}
      style={{ marginBottom: '8px' }}
    >
      <div style={{ width: '100%' }}>
        {displayLabel && label && (
          <IonLabel position="stacked">
            {label}
            {required && <span style={{ color: 'var(--ion-color-danger)' }}> *</span>}
          </IonLabel>
        )}
        
        {description && (
          <IonNote style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>
            {description}
          </IonNote>
        )}
        
        <div style={{ marginTop: displayLabel && label ? '8px' : '0' }}>
          {children}
        </div>
        
        {hasErrors && (
          <IonText color="danger">
            <small style={{ display: 'block', marginTop: '4px' }}>
              {rawErrors.join('. ')}
            </small>
          </IonText>
        )}
        
        {help && (
          <IonNote style={{ display: 'block', marginTop: '4px', fontSize: '0.875rem' }}>
            {help}
          </IonNote>
        )}
      </div>
    </IonItem>
  );
};

// Object Field Template for nested objects
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IonicObjectFieldTemplate: React.FC<any> = ({
  title,
  description,
  properties,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  required,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readonly,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uiSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  idSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  formData,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddClick
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {title && (
        <IonText>
          <h5 style={{ 
            margin: '8px 0 16px 0', 
            fontWeight: 'bold',
            borderBottom: '1px solid var(--ion-color-light)',
            paddingBottom: '8px'
          }}>
            {title}
          </h5>
        </IonText>
      )}
      
      {description && (
        <IonNote style={{ display: 'block', marginBottom: '16px' }}>
          {description}
        </IonNote>
      )}
      
      <div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {properties.map((element: any) => element.content)}
      </div>
    </div>
  );
};

// Array Field Template for arrays
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const IonicArrayFieldTemplate: React.FC<any> = ({
  title,
  items,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canAdd,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onAddClick,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  disabled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  readonly,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  uiSchema,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema,
  required
}) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {title && (
        <IonText>
          <h6 style={{ 
            margin: '8px 0', 
            fontWeight: 'bold'
          }}>
            {title}
            {required && <span style={{ color: 'var(--ion-color-danger)' }}> *</span>}
          </h6>
        </IonText>
      )}
      
      <div>
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {items && items.length > 0 && items.map((element: any) => (
          <div key={element.key} style={{ marginBottom: '8px' }}>
            {element.children}
          </div>
        ))}
      </div>
    </div>
  );
};
