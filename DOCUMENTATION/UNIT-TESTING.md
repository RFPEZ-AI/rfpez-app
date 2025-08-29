# Unit Testing Guide

## Overview

This document provides comprehensive guidance for unit testing in the RFPEZ.AI application. The project uses Jest and React Testing Library for unit testing with a focus on improving test coverage and reliability.

## Current Status

- **Current Coverage**: 8.77% (Statement Coverage)
- **Test Framework**: Jest + React Testing Library
- **UI Framework**: Ionic React
- **Testing Tools**: @testing-library/react, @testing-library/jest-dom

## Testing Structure

### Test File Organization

```
src/
├── components/
│   ├── ComponentName.tsx
│   └── ComponentName.test.tsx
├── pages/
│   ├── PageName.tsx
│   └── PageName.test.tsx
├── services/
│   ├── serviceName.ts
│   └── serviceName.test.ts
├── utils/
│   ├── utilityName.ts
│   └── utilityName.test.ts
└── __tests__/
    └── integration/
```

### Test Naming Convention

- **Component Tests**: `ComponentName.test.tsx`
- **Service Tests**: `serviceName.test.ts`
- **Utility Tests**: `utilityName.test.ts`
- **Integration Tests**: `featureName.integration.test.ts`

## Testing Best Practices

### 1. Test Structure (AAA Pattern)

```typescript
describe('ComponentName', () => {
  it('should perform expected behavior', () => {
    // Arrange
    const props = { /* test props */ };
    
    // Act
    render(<ComponentName {...props} />);
    
    // Assert
    expect(/* assertion */).toBeInTheDocument();
  });
});
```

### 2. Component Testing Guidelines

#### Basic Component Test Template

```typescript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ComponentName from './ComponentName';

// Mock dependencies
jest.mock('../services/someService');

const MockedComponent = ({ children, ...props }) => (
  <BrowserRouter>
    <ComponentName {...props}>
      {children}
    </ComponentName>
  </BrowserRouter>
);

describe('ComponentName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<MockedComponent />);
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('displays expected content', () => {
    const props = { title: 'Test Title' };
    render(<MockedComponent {...props} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('handles user interactions', async () => {
    const mockCallback = jest.fn();
    render(<MockedComponent onAction={mockCallback} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledWith(/* expected args */);
    });
  });
});
```

#### Testing Ionic Components

```typescript
import { IonButton, IonInput } from '@ionic/react';

// Test Ionic components using data-testid
it('interacts with Ionic input', () => {
  render(<IonInput data-testid="test-input" />);
  const input = screen.getByTestId('test-input');
  
  fireEvent.change(input, { target: { value: 'test value' } });
  expect(input).toHaveValue('test value');
});
```

### 3. Service Testing Guidelines

```typescript
import { serviceFunction } from './serviceName';

describe('serviceName', () => {
  it('returns expected result for valid input', async () => {
    // Arrange
    const input = { /* test data */ };
    const expectedResult = { /* expected output */ };
    
    // Act
    const result = await serviceFunction(input);
    
    // Assert
    expect(result).toEqual(expectedResult);
  });

  it('handles error cases appropriately', async () => {
    // Arrange
    const invalidInput = { /* invalid data */ };
    
    // Act & Assert
    await expect(serviceFunction(invalidInput))
      .rejects
      .toThrow('Expected error message');
  });
});
```

### 4. Async Testing

```typescript
it('handles async operations', async () => {
  const mockApiCall = jest.fn().mockResolvedValue({ data: 'test' });
  
  render(<AsyncComponent apiCall={mockApiCall} />);
  
  // Wait for async operation to complete
  await waitFor(() => {
    expect(screen.getByText('test')).toBeInTheDocument();
  });
  
  expect(mockApiCall).toHaveBeenCalledTimes(1);
});
```

### 5. Mocking Guidelines

#### External Dependencies
```typescript
// Mock external libraries
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signIn: jest.fn(),
      signOut: jest.fn(),
    },
  })),
}));
```

#### React Context
```typescript
// Mock context providers
const mockContextValue = {
  user: { id: '1', email: 'test@example.com' },
  loading: false,
};

jest.mock('../context/SupabaseContext', () => ({
  useSupabase: () => mockContextValue,
}));
```

## Coverage Goals

### Current Targets

| Category | Current | Target | Priority |
|----------|---------|---------|----------|
| Overall | 8.77% | 80% | High |
| Components | 6.38% | 85% | High |
| Services | 4.96% | 90% | High |
| Utils | 9.69% | 95% | Medium |

### Coverage Commands

```bash
# Run tests with coverage
npm test -- --coverage --watchAll=false

# Generate detailed coverage report
npm test -- --coverage --coverageReporters=text-lcov | npx lcov-info

# Coverage threshold check
npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"statements":80,"branches":80,"functions":80,"lines":80}}'
```

## Testing Utilities

### Custom Test Utilities

Create `src/test-utils.tsx` for common testing utilities:

```typescript
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { SupabaseProvider } from './context/SupabaseContext';

// Mock Supabase context for tests
const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <SupabaseProvider>
        {children}
      </SupabaseProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

### Common Mocks

Create `src/__mocks__/` directory for common mocks:

```typescript
// src/__mocks__/supabase.ts
export const mockSupabaseClient = {
  auth: {
    signIn: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  })),
};
```

## Test Categories

### 1. Unit Tests
- **Focus**: Individual functions/components in isolation
- **Scope**: Single component or service
- **Example**: Testing a utility function's return value

### 2. Integration Tests  
- **Focus**: Component interactions and data flow
- **Scope**: Multiple components working together
- **Example**: Form submission workflow

### 3. Component Tests
- **Focus**: UI behavior and user interactions
- **Scope**: Component rendering and event handling
- **Example**: Button click triggers expected action

## Common Testing Patterns

### Form Testing
```typescript
it('submits form with valid data', async () => {
  const mockSubmit = jest.fn();
  render(<FormComponent onSubmit={mockSubmit} />);
  
  fireEvent.change(screen.getByLabelText('Email'), {
    target: { value: 'test@example.com' }
  });
  
  fireEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  await waitFor(() => {
    expect(mockSubmit).toHaveBeenCalledWith({
      email: 'test@example.com'
    });
  });
});
```

### Error Handling
```typescript
it('displays error message on failure', async () => {
  const mockService = jest.fn().mockRejectedValue(new Error('API Error'));
  
  render(<Component serviceCall={mockService} />);
  
  fireEvent.click(screen.getByRole('button'));
  
  await waitFor(() => {
    expect(screen.getByText('API Error')).toBeInTheDocument();
  });
});
```

### Loading States
```typescript
it('shows loading spinner during async operation', async () => {
  const mockService = jest.fn().mockReturnValue(
    new Promise(resolve => setTimeout(resolve, 100))
  );
  
  render(<Component serviceCall={mockService} />);
  
  fireEvent.click(screen.getByRole('button'));
  
  expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  
  await waitFor(() => {
    expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
  });
});
```

## Continuous Integration

### Pre-commit Hooks
Add to `.husky/pre-commit`:
```bash
#!/bin/sh
npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"statements":60,"branches":60,"functions":60,"lines":60}}'
```

### GitHub Actions
```yaml
- name: Run tests with coverage
  run: npm test -- --coverage --watchAll=false
  
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

1. **Ionic Component Testing**
   ```typescript
   // Use data-testid instead of role selectors for Ionic components
   <IonButton data-testid="submit-button">Submit</IonButton>
   screen.getByTestId('submit-button');
   ```

2. **Async State Updates**
   ```typescript
   // Wrap async operations in act()
   await act(async () => {
     fireEvent.click(button);
   });
   ```

3. **Context Dependencies**
   ```typescript
   // Mock context providers properly
   const wrapper = ({ children }) => (
     <MockedContext.Provider value={mockValue}>
       {children}
     </MockedContext.Provider>
   );
   ```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Ionic Testing Guide](https://ionicframework.com/docs/react/testing)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Next Steps

1. **Immediate** (Week 1-2):
   - Fix existing failing tests
   - Add missing test utilities
   - Create component test templates

2. **Short Term** (Month 1):
   - Achieve 40% overall coverage
   - Add tests for critical components
   - Set up CI/CD integration

3. **Medium Term** (Month 2-3):
   - Reach 70% overall coverage
   - Add integration tests
   - Implement test automation

4. **Long Term** (Month 3+):
   - Achieve 80%+ coverage target
   - Performance testing
   - E2E test integration
