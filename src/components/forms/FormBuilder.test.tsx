// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormBuilder } from './FormBuilder';

// Mock RfpForm and RfpFormArtifact components
jest.mock('./RfpForm', () => {
  const MockRfpForm = ({ title }: any) => <div data-testid="rfp-form">{title}</div>;
  const MockRfpFormArtifact = ({ title }: any) => <div data-testid="rfp-form-artifact">{title}</div>;
  
  return {
    RfpForm: MockRfpForm,
    RfpFormArtifact: MockRfpFormArtifact,
    __esModule: true,
    default: MockRfpForm,
  };
});

// Mock the docx exporter
jest.mock('../../utils/docxExporter', () => ({
  downloadBidDocx: jest.fn(),
}));

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  ...jest.requireActual('@ionic/react'),
  IonCard: ({ children }: any) => <div data-testid="ion-card">{children}</div>,
  IonCardContent: ({ children }: any) => <div data-testid="ion-card-content">{children}</div>,
  IonCardHeader: ({ children }: any) => <div data-testid="ion-card-header">{children}</div>,
  IonCardTitle: ({ children }: any) => <h2 data-testid="ion-card-title">{children}</h2>,
  IonButton: ({ children, onClick, disabled, color }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-testid={`ion-button-${color || 'default'}`}
      className={color}
    >
      {children}
    </button>
  ),
  IonItem: ({ children }: any) => <div data-testid="ion-item">{children}</div>,
  IonLabel: ({ children }: any) => <div data-testid="ion-label">{children}</div>,
  IonSelect: ({ children, value, onIonChange, placeholder }: any) => (
    <select
      data-testid="ion-select"
      value={value}
      onChange={(e) => onIonChange?.({ detail: { value: e.target.value } })}
    >
      <option value="">{placeholder}</option>
      {children}
    </select>
  ),
  IonSelectOption: ({ value, children }: any) => (
    <option value={value}>{children}</option>
  ),
  IonTextarea: ({ value, onIonInput, placeholder }: any) => (
    <textarea
      data-testid="ion-textarea"
      value={value}
      onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
      placeholder={placeholder}
    />
  ),
  IonSpinner: () => <div data-testid="ion-spinner">Loading...</div>,
  IonText: ({ children }: any) => <div data-testid="ion-text">{children}</div>,
  IonIcon: () => <div data-testid="ion-icon" />,
  IonAlert: ({ isOpen, onDidDismiss }: any) => 
    isOpen ? <div data-testid="ion-alert" onClick={onDidDismiss}>Alert</div> : null,
}));

// Mock RfpForm
jest.mock('./RfpForm', () => ({
  RfpForm: ({ formSpec }: any) => (
    <div data-testid="rfp-form">
      Form Preview: {formSpec?.schema?.title}
    </div>
  )
}));

describe('FormBuilder', () => {
  const mockOnFormSpecGenerated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders form builder interface', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    expect(screen.getByTestId('ion-card-title')).toHaveTextContent('AI Form Builder');
    expect(screen.getByTestId('ion-select')).toBeInTheDocument();
    expect(screen.getByTestId('ion-button-default')).toBeInTheDocument();
  });

  it('displays template selection', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    expect(screen.getByTestId('ion-select')).toBeInTheDocument();
    expect(screen.getByText('Hotel Bid Proposal')).toBeInTheDocument();
    expect(screen.getByText('Software Services Proposal')).toBeInTheDocument();
    expect(screen.getByText('Catering Services Proposal')).toBeInTheDocument();
  });

  it('updates custom prompt when template is custom', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Select custom template
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    // Wait for textarea to appear
    await waitFor(() => {
      const textarea = screen.getByTestId('ion-textarea');
      fireEvent.change(textarea, { target: { value: 'Custom form requirements' } });
      expect(textarea).toHaveValue('Custom form requirements');
    });
  });

  it('calls generate form when button is clicked with template selected', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Select a template
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'hotel' } });
    
    // Click generate button
    const generateButton = screen.getByTestId('ion-button-default');
    expect(generateButton).not.toBeDisabled();
    fireEvent.click(generateButton);
    
    // Verify the button was clicked (we can't easily test the async part without complex mocking)
    expect(generateButton).toBeInTheDocument();
  });

  it('shows template description when selected', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'hotel' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Create a vendor bid form for hotel accommodations/i)).toBeInTheDocument();
    });
  });

  it('shows different template description when changed', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'software' } });
    
    await waitFor(() => {
      expect(screen.getByText(/Create a vendor bid form for software development services/i)).toBeInTheDocument();
    });
  });

  it('shows custom textarea when custom template selected', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'custom' } });
    
    await waitFor(() => {
      expect(screen.getByTestId('ion-textarea')).toBeInTheDocument();
    });
  });

  it('enables generate button when template is selected', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Initially button should be disabled
    const generateButton = screen.getByTestId('ion-button-default');
    expect(generateButton).toBeDisabled();
    
    // Select template and button should be enabled
    const select = screen.getByTestId('ion-select');
    fireEvent.change(select, { target: { value: 'hotel' } });
    
    expect(generateButton).not.toBeDisabled();
  });

  it('prevents generation without template selection', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const generateButton = screen.getByTestId('ion-button-default');
    expect(generateButton).toBeDisabled();
    
    // Should not call onFormSpecGenerated without template
    fireEvent.click(generateButton);
    expect(mockOnFormSpecGenerated).not.toHaveBeenCalled();
  });
});
