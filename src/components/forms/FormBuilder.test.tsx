import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FormBuilder } from './FormBuilder';

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
  IonInput: ({ value, onIonInput, placeholder }: any) => (
    <input
      data-testid="ion-input"
      value={value}
      onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
      placeholder={placeholder}
    />
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
  IonGrid: ({ children }: any) => <div data-testid="ion-grid">{children}</div>,
  IonRow: ({ children }: any) => <div data-testid="ion-row">{children}</div>,
  IonCol: ({ children }: any) => <div data-testid="ion-col">{children}</div>,
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
    expect(screen.getByTestId('ion-input')).toBeInTheDocument();
    expect(screen.getByTestId('ion-textarea')).toBeInTheDocument();
  });

  it('displays template buttons', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    expect(screen.getByTestId('ion-button-secondary')).toHaveTextContent('Hotel/Event Services');
    expect(screen.getByText('Software/Technology')).toBeInTheDocument();
    expect(screen.getByText('Catering Services')).toBeInTheDocument();
  });

  it('updates title when input changes', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const titleInput = screen.getByTestId('ion-input');
    fireEvent.change(titleInput, { target: { value: 'Test Form Title' } });
    
    expect(titleInput).toHaveValue('Test Form Title');
  });

  it('updates description when textarea changes', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const descriptionTextarea = screen.getByTestId('ion-textarea');
    fireEvent.change(descriptionTextarea, { target: { value: 'Test description' } });
    
    expect(descriptionTextarea).toHaveValue('Test description');
  });

  it('generates form when Generate Form button is clicked', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Fill in required fields
    fireEvent.change(screen.getByTestId('ion-input'), {
      target: { value: 'Test Form' }
    });
    fireEvent.change(screen.getByTestId('ion-textarea'), {
      target: { value: 'Test description' }
    });
    
    // Click generate button
    const generateButton = screen.getByTestId('ion-button-primary');
    fireEvent.click(generateButton);
    
    // Check loading state
    expect(screen.getByTestId('ion-spinner')).toBeInTheDocument();
    
    // Wait for generation to complete
    await waitFor(() => {
      expect(mockOnFormSpecGenerated).toHaveBeenCalledWith(
        expect.objectContaining({
          version: 'rfpez-form@1',
          schema: expect.objectContaining({
            title: 'Test Form',
            type: 'object'
          })
        })
      );
    });
  });

  it('applies hotel template when clicked', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const hotelButton = screen.getByTestId('ion-button-secondary');
    fireEvent.click(hotelButton);
    
    expect(screen.getByTestId('ion-input')).toHaveValue('Hotel/Event Services RFP');
    expect(screen.getByTestId('ion-textarea')).toHaveValue(
      expect.stringContaining('venue rental')
    );
  });

  it('applies software template when clicked', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const softwareButton = screen.getByText('Software/Technology');
    fireEvent.click(softwareButton);
    
    expect(screen.getByTestId('ion-input')).toHaveValue('Software/Technology RFP');
    expect(screen.getByTestId('ion-textarea')).toHaveValue(
      expect.stringContaining('software solution')
    );
  });

  it('applies catering template when clicked', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    const cateringButton = screen.getByText('Catering Services');
    fireEvent.click(cateringButton);
    
    expect(screen.getByTestId('ion-input')).toHaveValue('Catering Services RFP');
    expect(screen.getByTestId('ion-textarea')).toHaveValue(
      expect.stringContaining('catering services')
    );
  });

  it('shows preview when form is generated', async () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Fill and generate form
    fireEvent.change(screen.getByTestId('ion-input'), {
      target: { value: 'Test Form' }
    });
    fireEvent.change(screen.getByTestId('ion-textarea'), {
      target: { value: 'Test description' }
    });
    
    fireEvent.click(screen.getByTestId('ion-button-primary'));
    
    await waitFor(() => {
      expect(screen.getByTestId('rfp-form')).toBeInTheDocument();
      expect(screen.getByTestId('rfp-form')).toHaveTextContent('Form Preview: Test Form');
    });
  });

  it('prevents generation without title', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Only fill description
    fireEvent.change(screen.getByTestId('ion-textarea'), {
      target: { value: 'Test description' }
    });
    
    const generateButton = screen.getByTestId('ion-button-primary');
    fireEvent.click(generateButton);
    
    // Should not call onFormSpecGenerated without title
    expect(mockOnFormSpecGenerated).not.toHaveBeenCalled();
  });

  it('prevents generation without description', () => {
    render(<FormBuilder onFormSpecGenerated={mockOnFormSpecGenerated} />);
    
    // Only fill title
    fireEvent.change(screen.getByTestId('ion-input'), {
      target: { value: 'Test Form' }
    });
    
    const generateButton = screen.getByTestId('ion-button-primary');
    fireEvent.click(generateButton);
    
    // Should not call onFormSpecGenerated without description
    expect(mockOnFormSpecGenerated).not.toHaveBeenCalled();
  });
});
