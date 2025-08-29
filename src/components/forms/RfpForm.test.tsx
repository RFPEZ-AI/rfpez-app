import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RfpForm } from './RfpForm';
import type { FormSpec } from '../../types/rfp';

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  ...jest.requireActual('@ionic/react'),
  IonCard: ({ children }: any) => <div data-testid="ion-card">{children}</div>,
  IonCardContent: ({ children }: any) => <div data-testid="ion-card-content">{children}</div>,
  IonCardHeader: ({ children }: any) => <div data-testid="ion-card-header">{children}</div>,
  IonCardTitle: ({ children }: any) => <h2 data-testid="ion-card-title">{children}</h2>,
  IonButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="ion-button">
      {children}
    </button>
  ),
  IonSpinner: () => <div data-testid="ion-spinner">Loading...</div>,
  IonText: ({ children }: any) => <div data-testid="ion-text">{children}</div>
}));

// Mock RJSF
jest.mock('@rjsf/core', () => {
  return function MockForm({ schema, formData, onSubmit, onChange, disabled, children }: any) {
    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit?.({ formData });
    };

    const handleChange = (value: string) => {
      onChange?.({ formData: { ...formData, testField: value } });
    };

    return (
      <form onSubmit={handleSubmit} data-testid="rjsf-form">
        <div data-testid="form-title">{schema.title}</div>
        <input
          data-testid="test-input"
          value={formData?.testField || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
        {/* Render children (IonButton) from RfpForm */}
        {children}
      </form>
    );
  };
});

jest.mock('@rjsf/validator-ajv8', () => ({}));

const mockFormSpec: FormSpec = {
  version: 'rfpez-form@1',
  schema: {
    title: 'Test Form',
    type: 'object',
    required: ['testField'],
    properties: {
      testField: {
        type: 'string',
        title: 'Test Field'
      }
    }
  },
  uiSchema: {
    testField: {
      'ui:placeholder': 'Enter test value'
    }
  },
  defaults: {
    testField: 'default value'
  }
};

describe('RfpForm', () => {
  it('renders form with title', () => {
    render(<RfpForm formSpec={mockFormSpec} />);
    
    expect(screen.getByTestId('form-title')).toHaveTextContent('Test Form');
    expect(screen.getByTestId('ion-card')).toBeInTheDocument();
  });

  it('renders form without title when showTitle is false', () => {
    render(<RfpForm formSpec={mockFormSpec} showTitle={false} />);
    
    expect(screen.queryByTestId('ion-card-header')).not.toBeInTheDocument();
  });

  it('calls onSubmit when form is submitted', async () => {
    const handleSubmit = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onSubmit={handleSubmit}
        formData={{ testField: 'test value' }}
      />
    );
    
    fireEvent.click(screen.getByTestId('ion-button'));
    
    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({ testField: 'test value' });
    });
  });

  it('calls onChange when form data changes', async () => {
    const handleChange = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onChange={handleChange}
      />
    );
    
    fireEvent.change(screen.getByTestId('test-input'), {
      target: { value: 'new value' }
    });
    
    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith({ testField: 'new value' });
    });
  });

  it('disables form when disabled prop is true', () => {
    render(<RfpForm formSpec={mockFormSpec} disabled={true} />);
    
    expect(screen.getByTestId('test-input')).toBeDisabled();
    expect(screen.getByTestId('ion-button')).toBeDisabled();
  });

  it('disables form when readonly prop is true', () => {
    render(<RfpForm formSpec={mockFormSpec} readonly={true} />);
    
    expect(screen.getByTestId('test-input')).toBeDisabled();
    expect(screen.queryByTestId('ion-button')).not.toBeInTheDocument(); // No submit button in readonly mode
  });

  it('hides submit button when showSubmitButton is false', () => {
    render(<RfpForm formSpec={mockFormSpec} showSubmitButton={false} />);
    
    expect(screen.queryByTestId('ion-button')).not.toBeInTheDocument();
  });

  it('shows loading spinner when loading is true', () => {
    render(<RfpForm formSpec={mockFormSpec} loading={true} />);
    
    expect(screen.getByTestId('ion-spinner')).toBeInTheDocument();
  });

  it('merges defaults with form data', () => {
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        formData={{ otherField: 'other value' }}
      />
    );
    
    // The input should have the default value since testField wasn't provided in formData
    expect(screen.getByTestId('test-input')).toHaveValue('default value');
  });

  it('overrides defaults with provided form data', () => {
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        formData={{ testField: 'override value' }}
      />
    );
    
    expect(screen.getByTestId('test-input')).toHaveValue('override value');
  });
});
