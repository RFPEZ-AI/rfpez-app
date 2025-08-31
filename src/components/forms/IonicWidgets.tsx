// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import {
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonCheckbox,
  IonToggle,
  IonDatetime,
  IonLabel,
  IonItem,
  IonButton,
  IonIcon,
  IonList
} from '@ionic/react';
import { addOutline, removeOutline } from 'ionicons/icons';
import type { WidgetProps } from '@rjsf/utils';

//
// Text Input Widget
export const IonTextWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema,
  disabled,
  readonly,
  placeholder
}) => {
  return (
    <IonInput
      id={id}
      value={value ?? ''}
      placeholder={placeholder}
      aria-labelledby={`${id}-label`}
      disabled={disabled || readonly}
      onIonInput={(e) => onChange(e.detail.value || '')}
      onIonBlur={() => onBlur && onBlur(id, value)}
      onIonFocus={() => onFocus && onFocus(id, value)}
      fill="outline"
    />
  );
};

// Number Input Widget
export const IonNumberWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  options,
  schema,
  disabled,
  readonly,
  placeholder
}) => {
  return (
    <IonInput
      id={id}
      type="number"
      value={value ?? ''}
      placeholder={placeholder}
      aria-labelledby={`${id}-label`}
      disabled={disabled || readonly}
      min={schema.minimum}
      max={schema.maximum}
      step={schema.multipleOf ? String(schema.multipleOf) : 'any'}
      onIonInput={(e) => {
        const val = e.detail.value;
        onChange(val === '' ? undefined : Number(val));
      }}
      onIonBlur={() => onBlur && onBlur(id, value)}
      onIonFocus={() => onFocus && onFocus(id, value)}
      fill="outline"
    />
  );
};

// Textarea Widget
export const IonTextareaWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  options,
  disabled,
  readonly,
  placeholder
}) => {
  return (
    <IonTextarea
      id={id}
      value={value ?? ''}
      placeholder={placeholder}
      aria-labelledby={`${id}-label`}
      disabled={disabled || readonly}
      rows={options?.rows || 4}
      onIonInput={(e) => onChange(e.detail.value || '')}
      onIonBlur={() => onBlur && onBlur(id, value)}
      onIonFocus={() => onFocus && onFocus(id, value)}
      fill="outline"
      autoGrow
    />
  );
};

// Select Widget
export const IonSelectWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  options,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  schema,
  disabled,
  readonly,
  placeholder
}) => {
  const { enumOptions = [] } = options;

  return (
    <IonSelect
      id={id}
      value={value}
      placeholder={placeholder || 'Select an option'}
      disabled={disabled || readonly}
      onIonChange={(e) => onChange(e.detail.value)}
      fill="outline"
      interface="popover"
    >
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {enumOptions.map((option: any) => (
        <IonSelectOption key={option.value} value={option.value}>
          {option.label}
        </IonSelectOption>
      ))}
    </IonSelect>
  );
};

// Multiple Select Widget (Checkboxes)
export const IonCheckboxesWidget: React.FC<WidgetProps> = ({
  value = [],
  onChange,
  options,
  disabled,
  readonly
}) => {
  const { enumOptions = [] } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (optionValue: any, checked: boolean) => {
    const newValue = [...(value || [])];
    if (checked) {
      if (!newValue.includes(optionValue)) {
        newValue.push(optionValue);
      }
    } else {
      const index = newValue.indexOf(optionValue);
      if (index !== -1) {
        newValue.splice(index, 1);
      }
    }
    onChange(newValue);
  };

  return (
    <IonList>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {enumOptions.map((option: any) => (
        <IonItem key={option.value}>
          <IonCheckbox
            checked={(value || []).includes(option.value)}
            disabled={disabled || readonly}
            onIonChange={(e) => handleChange(option.value, e.detail.checked)}
          />
          <IonLabel className="ion-margin-start">{option.label}</IonLabel>
        </IonItem>
      ))}
    </IonList>
  );
};

// Toggle Widget
export const IonToggleWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  disabled,
  readonly,
  label
}) => {
  return (
    <IonItem>
      <IonToggle
        id={id}
        checked={value ?? false}
        disabled={disabled || readonly}
        onIonChange={(e) => onChange(e.detail.checked)}
        aria-labelledby={`${id}-label`}
      >
        {label}
      </IonToggle>
    </IonItem>
  );
};

// Date Widget
export const IonDateWidget: React.FC<WidgetProps> = ({
  id,
  value,
  onChange,
  disabled,
  readonly
}) => {
  return (
    <IonDatetime
      id={id}
      value={value}
      disabled={disabled || readonly}
      presentation="date"
      onIonChange={(e) => {
        const val = e.detail.value;
        if (typeof val === 'string') {
          // Extract just the date part (YYYY-MM-DD)
          const dateOnly = val.split('T')[0];
          onChange(dateOnly);
        }
      }}
    />
  );
};

// Array Widget for managing arrays of simple values
export const IonArrayWidget: React.FC<WidgetProps> = ({
  value = [],
  onChange,
  disabled,
  readonly,
  title
}) => {
  const handleAddItem = () => {
    const newValue = [...value, ''];
    onChange(newValue);
  };

  const handleRemoveItem = (index: number) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const newValue = value.filter((_: any, i: number) => i !== index);
    onChange(newValue);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleItemChange = (index: number, itemValue: any) => {
    const newValue = [...value];
    newValue[index] = itemValue;
    onChange(newValue);
  };

  return (
    <div>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {value.map((item: any, index: number) => (
        <IonItem key={index}>
          <IonInput
            value={item}
            placeholder={`${title || 'Item'} ${index + 1}`}
            aria-label={`${title || 'Item'} ${index + 1}`}
            disabled={disabled || readonly}
            onIonInput={(e) => handleItemChange(index, e.detail.value || '')}
            fill="outline"
          />
          {!disabled && !readonly && (
            <IonButton
              fill="clear"
              color="danger"
              onClick={() => handleRemoveItem(index)}
            >
              <IonIcon icon={removeOutline} />
            </IonButton>
          )}
        </IonItem>
      ))}
      
      {!disabled && !readonly && (
        <IonButton
          fill="clear"
          onClick={handleAddItem}
          style={{ marginTop: '8px' }}
        >
          <IonIcon icon={addOutline} slot="start" />
          Add {title || 'Item'}
        </IonButton>
      )}
    </div>
  );
};

// Widget Registry for RJSF
export const ionicWidgets = {
  TextWidget: IonTextWidget,
  NumberWidget: IonNumberWidget,
  TextareaWidget: IonTextareaWidget,
  SelectWidget: IonSelectWidget,
  CheckboxesWidget: IonCheckboxesWidget,
  RadioWidget: IonSelectWidget, // Use select for radio as well
  ToggleWidget: IonToggleWidget,
  DateWidget: IonDateWidget,
  ArrayWidget: IonArrayWidget,
  
  // Custom widget mappings for uiSchema
  ionText: IonTextWidget,
  ionNumber: IonNumberWidget,
  ionTextarea: IonTextareaWidget,
  ionSelect: IonSelectWidget,
  ionCheckboxes: IonCheckboxesWidget,
  ionToggle: IonToggleWidget,
  ionDate: IonDateWidget,
  ionArray: IonArrayWidget
};
