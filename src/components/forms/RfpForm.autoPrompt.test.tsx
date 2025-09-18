// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RfpForm } from '../../components/forms/RfpForm';
import type { FormSpec } from '../../types/rfp';

// Mock dependencies
jest.mock('@ionic/react', () => ({
  IonCard: ({ children }: any) => <div data-testid="ion-card">{children}</div>,
  IonCardContent: ({ children }: any) => <div data-testid="ion-card-content">{children}</div>,
  IonCardHeader: ({ children }: any) => <div data-testid="ion-card-header">{children}</div>,
  IonCardTitle: ({ children }: any) => <div data-testid="ion-card-title">{children}</div>,
  IonButton: ({ children, onClick, disabled, type }: any) => (
    <button
      data-testid="ion-button"
      onClick={onClick}
      disabled={disabled}
      type={type}
    >
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
        <div data-testid="form-title">{(schema as { title?: string }).title}</div>
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
    type: 'object',
    title: 'Test Auto-Prompt Form',
    properties: {
      testField: {
        type: 'string',
        title: 'Test Field'
      }
    }
  },
  uiSchema: {},
  defaults: {}
};

describe('RfpForm Auto-Prompt Functionality', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls onSubmitSuccess with form name after successful submission', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnSubmitSuccess = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onSubmit={mockOnSubmit}
        onSubmitSuccess={mockOnSubmitSuccess}
        formData={{ testField: 'test value' }}
      />
    );
    
    // Find and click the submit button
    const submitButton = screen.getByTestId('ion-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ testField: 'test value' });
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith('Test Auto-Prompt Form');
    });
  });

  it('does not call onSubmitSuccess if onSubmit fails', async () => {
    const mockOnSubmit = jest.fn().mockRejectedValue(new Error('Submission failed'));
    const mockOnSubmitSuccess = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onSubmit={mockOnSubmit}
        onSubmitSuccess={mockOnSubmitSuccess}
        formData={{ testField: 'test value' }}
      />
    );
    
    // Find and click the submit button
    const submitButton = screen.getByTestId('ion-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({ testField: 'test value' });
      expect(mockOnSubmitSuccess).not.toHaveBeenCalled();
    });
  });

  it('uses custom title for auto-prompt when provided', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnSubmitSuccess = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onSubmit={mockOnSubmit}
        onSubmitSuccess={mockOnSubmitSuccess}
        title="Custom Form Title"
        formData={{ testField: 'test value' }}
      />
    );
    
    // Find and click the submit button
    const submitButton = screen.getByTestId('ion-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith('Custom Form Title');
    });
  });

  it('falls back to schema title if no custom title provided', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnSubmitSuccess = jest.fn();
    
    render(
      <RfpForm 
        formSpec={mockFormSpec} 
        onSubmit={mockOnSubmit}
        onSubmitSuccess={mockOnSubmitSuccess}
        formData={{ testField: 'test value' }}
      />
    );
    
    // Find and click the submit button
    const submitButton = screen.getByTestId('ion-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith('Test Auto-Prompt Form');
    });
  });

  it('falls back to "Form" if no title is available', async () => {
    const mockOnSubmit = jest.fn().mockResolvedValue(true);
    const mockOnSubmitSuccess = jest.fn();
    
    const formSpecWithoutTitle: FormSpec = {
      ...mockFormSpec,
      schema: {
        ...mockFormSpec.schema,
        title: undefined
      }
    };
    
    render(
      <RfpForm 
        formSpec={formSpecWithoutTitle} 
        onSubmit={mockOnSubmit}
        onSubmitSuccess={mockOnSubmitSuccess}
        formData={{ testField: 'test value' }}
      />
    );
    
    // Find and click the submit button
    const submitButton = screen.getByTestId('ion-button');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmitSuccess).toHaveBeenCalledWith('Form');
    });
  });
});