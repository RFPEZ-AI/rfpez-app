import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter } from 'react-router-dom';
import { BidSubmissionPage } from './BidSubmissionPage';

// Mock useParams
const mockUseParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => mockUseParams()
}));

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  ...jest.requireActual('@ionic/react'),
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
  IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
  IonTitle: ({ children }: any) => <h1 data-testid="ion-title">{children}</h1>,
  IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
  IonCard: ({ children }: any) => <div data-testid="ion-card">{children}</div>,
  IonCardContent: ({ children }: any) => <div data-testid="ion-card-content">{children}</div>,
  IonCardHeader: ({ children }: any) => <div data-testid="ion-card-header">{children}</div>,
  IonCardTitle: ({ children }: any) => <h2 data-testid="ion-card-title">{children}</h2>,
  IonButton: ({ children, onClick, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="ion-button">
      {children}
    </button>
  ),
  IonItem: ({ children }: any) => <div data-testid="ion-item">{children}</div>,
  IonLabel: ({ children }: any) => <label data-testid="ion-label">{children}</label>,
  IonInput: ({ value, onIonInput, placeholder }: any) => (
    <input
      data-testid="ion-input"
      value={value}
      onChange={(e) => onIonInput?.({ detail: { value: e.target.value } })}
      placeholder={placeholder}
    />
  ),
  IonSpinner: () => <div data-testid="ion-spinner">Loading...</div>,
  IonText: ({ children }: any) => <div data-testid="ion-text">{children}</div>,
  IonAlert: ({ isOpen, onDidDismiss }: any) => 
    isOpen ? <div data-testid="ion-alert" onClick={onDidDismiss}>Alert</div> : null,
  IonBackButton: () => <button data-testid="ion-back-button">Back</button>,
  IonButtons: ({ children }: any) => <div data-testid="ion-buttons">{children}</div>
}));

// Mock RfpForm
jest.mock('../components/forms/RfpForm', () => ({
  RfpForm: ({ formSpec, onChange, onSubmit, formData, readonly }: any) => (
    <div data-testid="rfp-form">
      <div data-testid="form-title">{formSpec?.schema?.title}</div>
      <div data-testid="form-readonly">{readonly ? 'readonly' : 'editable'}</div>
      <input
        data-testid="form-input"
        value={formData?.testField || ''}
        onChange={(e) => onChange?.({ testField: e.target.value })}
        disabled={readonly}
      />
      <button
        data-testid="form-submit"
        onClick={() => onSubmit?.(formData)}
        disabled={readonly}
      >
        Submit
      </button>
    </div>
  )
}));

// Mock DocxExporter
jest.mock('../utils/docxExporter', () => ({
  DocxExporter: {
    downloadBidDocx: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock Supabase
const mockSupabase: any = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  single: jest.fn(() => Promise.resolve({ data: null, error: null })),
  insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
};

jest.mock('../supabaseClient', () => ({
  supabase: mockSupabase
}));

const mockRfp = {
  id: '123',
  title: 'Test RFP',
  description: 'Test description',
  form_spec: {
    version: 'rfpez-form@1',
    schema: {
      title: 'Test Form',
      type: 'object',
      required: ['companyName'],
      properties: {
        companyName: {
          type: 'string',
          title: 'Company Name'
        }
      }
    },
    uiSchema: {},
    defaults: {}
  }
};

describe('BidSubmissionPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseParams.mockReturnValue({ id: '123' });
    mockSupabase.single.mockResolvedValue({ data: mockRfp, error: null });
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <BidSubmissionPage />
      </BrowserRouter>
    );
  };

  it('renders loading state initially', () => {
    renderComponent();
    
    expect(screen.getByTestId('ion-spinner')).toBeInTheDocument();
  });

  it('loads RFP data on mount', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('rfps');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', '123');
    });
  });

  it('displays RFP title when loaded', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('ion-title')).toHaveTextContent('Submit Bid: Test RFP');
    });
  });

  it('shows error when RFP not found', async () => {
    mockSupabase.single.mockResolvedValue({ data: null, error: { message: 'RFP not found' } });
    
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('ion-text')).toHaveTextContent('RFP not found');
    });
  });

  it('displays supplier information form', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('ion-card-title')).toHaveTextContent('Supplier Information');
      expect(screen.getAllByTestId('ion-input')).toHaveLength(4); // name, email, phone, company
    });
  });

  it('updates supplier info when inputs change', async () => {
    renderComponent();
    
    await waitFor(() => {
      const inputs = screen.getAllByTestId('ion-input');
      fireEvent.change(inputs[0], { target: { value: 'John Doe' } });
    });
    
    expect(screen.getAllByTestId('ion-input')[0]).toHaveValue('John Doe');
  });

  it('displays bid form when RFP is loaded', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByTestId('rfp-form')).toBeInTheDocument();
      expect(screen.getByTestId('form-title')).toHaveTextContent('Test Form');
      expect(screen.getByTestId('form-readonly')).toHaveTextContent('editable');
    });
  });

  it('disables submit when supplier info is incomplete', async () => {
    renderComponent();
    
    await waitFor(() => {
      const submitButton = screen.getByText('Submit Bid');
      expect(submitButton).toBeDisabled();
    });
  });

  it('enables submit when supplier info is complete', async () => {
    renderComponent();
    
    await waitFor(() => {
      const inputs = screen.getAllByTestId('ion-input');
      fireEvent.change(inputs[0], { target: { value: 'John Doe' } });
      fireEvent.change(inputs[1], { target: { value: 'john@test.com' } });
      fireEvent.change(inputs[2], { target: { value: '555-1234' } });
      fireEvent.change(inputs[3], { target: { value: 'Test Co' } });
    });
    
    await waitFor(() => {
      const submitButton = screen.getByText('Submit Bid');
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('submits bid with complete data', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Fill supplier info
      const inputs = screen.getAllByTestId('ion-input');
      fireEvent.change(inputs[0], { target: { value: 'John Doe' } });
      fireEvent.change(inputs[1], { target: { value: 'john@test.com' } });
      fireEvent.change(inputs[2], { target: { value: '555-1234' } });
      fireEvent.change(inputs[3], { target: { value: 'Test Co' } });
      
      // Fill form data
      fireEvent.change(screen.getByTestId('form-input'), {
        target: { value: 'Test Company' }
      });
    });
    
    const submitButton = screen.getByText('Submit Bid');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockSupabase.insert).toHaveBeenCalledWith({
        rfp_id: '123',
        supplier_name: 'John Doe',
        supplier_email: 'john@test.com',
        supplier_phone: '555-1234',
        supplier_company: 'Test Co',
        response: { testField: 'Test Company' },
        status: 'submitted'
      });
    });
  });

  it('shows success message after submission', async () => {
    renderComponent();
    
    await waitFor(() => {
      // Fill all required fields
      const inputs = screen.getAllByTestId('ion-input');
      inputs.forEach((input, index) => {
        const values = ['John Doe', 'john@test.com', '555-1234', 'Test Co'];
        fireEvent.change(input, { target: { value: values[index] } });
      });
      
      fireEvent.change(screen.getByTestId('form-input'), {
        target: { value: 'Test Company' }
      });
    });
    
    fireEvent.click(screen.getByText('Submit Bid'));
    
    await waitFor(() => {
      expect(screen.getByText('Download Bid Document')).toBeInTheDocument();
    });
  });

  it('downloads bid document when button clicked', async () => {
    const { DocxExporter } = require('../utils/docxExporter');
    
    renderComponent();
    
    // Complete submission flow first
    await waitFor(() => {
      const inputs = screen.getAllByTestId('ion-input');
      inputs.forEach((input, index) => {
        const values = ['John Doe', 'john@test.com', '555-1234', 'Test Co'];
        fireEvent.change(input, { target: { value: values[index] } });
      });
    });
    
    fireEvent.click(screen.getByText('Submit Bid'));
    
    await waitFor(() => {
      const downloadButton = screen.getByText('Download Bid Document');
      fireEvent.click(downloadButton);
    });
    
    expect(DocxExporter.downloadBidDocx).toHaveBeenCalled();
  });

  it('handles submission error gracefully', async () => {
    mockSupabase.insert.mockResolvedValue({ 
      data: null, 
      error: { message: 'Submission failed' } 
    });
    
    renderComponent();
    
    await waitFor(() => {
      // Fill all required fields
      const inputs = screen.getAllByTestId('ion-input');
      inputs.forEach((input, index) => {
        const values = ['John Doe', 'john@test.com', '555-1234', 'Test Co'];
        fireEvent.change(input, { target: { value: values[index] } });
      });
    });
    
    fireEvent.click(screen.getByText('Submit Bid'));
    
    await waitFor(() => {
      expect(screen.getByTestId('ion-alert')).toBeInTheDocument();
    });
  });
});
