// Quick test to verify save button is now visible
// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
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

  it('should show both Save Draft and Submit buttons when onSave prop is provided', () => {
    const mockOnSubmit = jest.fn();
    const mockOnSave = jest.fn();

    render(
      <ArtifactFormRenderer
        artifact={mockArtifact}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
      />
    );

    // Check that both buttons are present
    expect(screen.getByTestId('form-save-button')).toBeInTheDocument();
    expect(screen.getByTestId('form-submit')).toBeInTheDocument();
    
    // Check button text
    expect(screen.getByText('💾 Save Draft')).toBeInTheDocument();
    expect(screen.getByText('Submit Questionnaire')).toBeInTheDocument();
    
    console.log('✅ Both Save Draft and Submit buttons are visible when onSave prop is provided');
  });

  it('should only show Submit button when onSave prop is not provided', () => {
    const mockOnSubmit = jest.fn();

    render(
      <ArtifactFormRenderer
        artifact={mockArtifact}
        onSubmit={mockOnSubmit}
        // onSave prop omitted
      />
    );

    // Save button should not be present
    expect(screen.queryByTestId('form-save-button')).not.toBeInTheDocument();
    expect(screen.queryByText('💾 Save Draft')).not.toBeInTheDocument();
    
    // Submit button should still be present
    expect(screen.getByTestId('form-submit')).toBeInTheDocument();
    expect(screen.getByText('Submit Questionnaire')).toBeInTheDocument();
    
    console.log('✅ Only Submit button visible when onSave prop is not provided');
  });
});

console.log('🧪 Save button visibility test created');