// Quick test to verify save button is now visible
// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArtifactFormRenderer from '../artifacts/ArtifactFormRenderer';
import { Artifact } from '../../types/home';

// Mock services
jest.mock('../../services/artifactService', () => ({
  ArtifactService: {
    saveFormData: jest.fn().mockResolvedValue(true),
  }
}));

jest.mock('../../services/database', () => ({
  default: {
    saveFormData: jest.fn().mockResolvedValue({ success: true, saveCount: 1 }),
  }
}));

jest.mock('../../supabaseClient', () => ({
  default: {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({ data: [], error: null }),
    }),
  },
}));

describe('Save Button Visibility Test', () => {
  const mockArtifact: Artifact = {
    id: 'test-id',
    name: 'Test Form',
    type: 'form',
    size: '1KB',
    sessionId: 'session-123',
    status: 'ready',
    content: JSON.stringify({
      schema: {
        type: 'object',
        properties: {
          name: { type: 'string', title: 'Name' },
          email: { type: 'string', title: 'Email' }
        }
      }
    })
  };

  it('should show both Save Draft and Submit buttons when onSave prop is provided', async () => {
    const mockOnSubmit = jest.fn();
    const mockOnSave = jest.fn();

    render(
      <ArtifactFormRenderer
        artifact={mockArtifact}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
      />
    );

    // Wait for form to finish loading (component has 10ms delay before showing form)
    await waitFor(() => {
      expect(screen.queryByText('Loading form...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Wait for buttons to be rendered
    await waitFor(() => {
      expect(screen.getByTestId('form-submit')).toBeInTheDocument();
    }, { timeout: 1000 });

    // Check that both buttons are present
    const saveButton = screen.getByTestId('form-save-button');
    const submitButton = screen.getByTestId('form-submit');
    
    expect(saveButton).toBeInTheDocument();
    expect(submitButton).toBeInTheDocument();
    
    // Check button text content
    expect(saveButton).toHaveTextContent('💾 Save Draft');
    expect(submitButton).toHaveTextContent('Submit Questionnaire');
    
    console.log('✅ Both Save Draft and Submit buttons are visible when onSave prop is provided');
  });

  it('should only show Submit button when onSave prop is not provided', async () => {
    const mockOnSubmit = jest.fn();

    render(
      <ArtifactFormRenderer
        artifact={mockArtifact}
        onSubmit={mockOnSubmit}
        // onSave prop omitted
      />
    );

    // Wait for form to finish loading
    await waitFor(() => {
      expect(screen.queryByText('Loading form...')).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Save button should not be present
    expect(screen.queryByTestId('form-save-button')).not.toBeInTheDocument();
    
    // Submit button should still be present
    const submitButton = screen.getByTestId('form-submit');
    expect(submitButton).toBeInTheDocument();
    expect(submitButton).toHaveTextContent('Submit Questionnaire');
    
    console.log('✅ Only Submit button visible when onSave prop is not provided');
  });
});

console.log('🧪 Save button visibility test created');