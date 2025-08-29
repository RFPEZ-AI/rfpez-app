import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from './context/SupabaseContext';

// Mock Supabase client for testing
const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    onAuthStateChange: jest.fn().mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } }
    }),
    getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    single: jest.fn().mockResolvedValue({ data: null, error: null }),
  })),
  functions: {
    invoke: jest.fn().mockResolvedValue({ data: null, error: null }),
  },
};

// Mock the supabase module
jest.mock('./supabaseClient', () => ({
  supabase: mockSupabaseClient,
  __esModule: true,
  default: mockSupabaseClient,
}));

// Custom context wrapper for tests
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </BrowserRouter>
  );
};

// Custom render function that includes providers
const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: TestWrapper, ...options });

// Mock implementations for common services
export const mockClaudeService = {
  sendMessage: jest.fn().mockResolvedValue({ 
    content: [{ text: 'Mock response' }] 
  }),
  generateFormSpec: jest.fn().mockResolvedValue({
    title: 'Mock Form',
    description: 'Mock Description',
    schema: {},
    uiSchema: {},
  }),
};

export const mockMCPClient = {
  sendMessage: jest.fn().mockResolvedValue('Mock MCP response'),
  listTools: jest.fn().mockResolvedValue([]),
  callTool: jest.fn().mockResolvedValue({ result: 'Mock tool result' }),
};

export const mockRFPService = {
  getAllRFPs: jest.fn().mockResolvedValue([]),
  createRFP: jest.fn().mockResolvedValue({ id: '1', title: 'Mock RFP' }),
  updateRFP: jest.fn().mockResolvedValue({ id: '1', title: 'Updated RFP' }),
  deleteRFP: jest.fn().mockResolvedValue(undefined),
};

// Mock form data generators
export const createMockFormSpec = (overrides = {}) => ({
  title: 'Test Form',
  description: 'Test Description',
  schema: {
    type: 'object',
    properties: {
      testField: { type: 'string', title: 'Test Field' },
    },
    required: ['testField'],
  },
  uiSchema: {
    testField: { 'ui:placeholder': 'Enter test value' },
  },
  ...overrides,
});

export const createMockRFP = (overrides = {}) => ({
  id: '1',
  title: 'Test RFP',
  description: 'Test RFP Description',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  user_id: 'test-user-id',
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  id: 'test-user-id',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

export const createMockUserProfile = (overrides = {}) => ({
  id: 'test-profile-id',
  user_id: 'test-user-id',
  role: 'user',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00.000Z',
  updated_at: '2024-01-01T00:00:00.000Z',
  ...overrides,
});

// Helper functions for common test scenarios
export const waitForLoadingToFinish = async () => {
  const { waitForElementToBeRemoved, queryByTestId } = await import('@testing-library/react');
  const loadingElement = queryByTestId(document.body, 'loading-spinner');
  if (loadingElement) {
    await waitForElementToBeRemoved(loadingElement);
  }
};

export const mockFormSubmission = () => {
  const mockSubmit = jest.fn();
  const mockPreventDefault = jest.fn();
  return {
    mockSubmit,
    mockEvent: {
      preventDefault: mockPreventDefault,
      target: { checkValidity: () => true },
    },
  };
};

// Error boundary for testing error states
export class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return <div data-testid="error-boundary">Something went wrong</div>;
    }
    return this.props.children;
  }
}

// Re-export everything from React Testing Library
export * from '@testing-library/react';
export { customRender as render };
export { mockSupabaseClient };
