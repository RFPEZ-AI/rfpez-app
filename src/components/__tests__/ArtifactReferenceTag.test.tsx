import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ArtifactReferenceTag from '../ArtifactReferenceTag';
import { ArtifactReference } from '../../types/home';

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  IonIcon: ({ icon, ...props }: any) => <div data-testid="ion-icon" data-icon={icon} {...props} />
}));

// Mock ionicons
jest.mock('ionicons/icons', () => ({
  documentTextOutline: 'document-text-outline',
  imageOutline: 'image-outline',
  clipboardOutline: 'clipboard-outline'
}));

describe('ArtifactReferenceTag', () => {
  const mockOnClick = jest.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('should render text type artifact with document icon and primary color', () => {
    const textArtifactRef: ArtifactReference = {
      artifactId: 'text-1',
      artifactName: 'Text Document',
      artifactType: 'text',
      isCreated: true
    };

    render(<ArtifactReferenceTag artifactRef={textArtifactRef} onClick={mockOnClick} />);

    // Should display the artifact name
    expect(screen.getByText('Text Document')).toBeInTheDocument();
    
    // Should display the artifact type
    expect(screen.getByText('text')).toBeInTheDocument();
    
    // Should show "New" indicator
    expect(screen.getByText('✨ New')).toBeInTheDocument();
    
    // Should use document icon for text type
    const icon = screen.getByTestId('ion-icon');
    expect(icon).toHaveAttribute('data-icon', 'document-text-outline');
  });

  it('should render document type artifact correctly', () => {
    const documentArtifactRef: ArtifactReference = {
      artifactId: 'doc-1',
      artifactName: 'Document',
      artifactType: 'document',
      isCreated: false
    };

    render(<ArtifactReferenceTag artifactRef={documentArtifactRef} onClick={mockOnClick} />);

    expect(screen.getByText('Document')).toBeInTheDocument();
    expect(screen.getByText('document')).toBeInTheDocument();
    expect(screen.queryByText('✨ New')).not.toBeInTheDocument();
    
    const icon = screen.getByTestId('ion-icon');
    expect(icon).toHaveAttribute('data-icon', 'document-text-outline');
  });

  it('should render form type artifact correctly', () => {
    const formArtifactRef: ArtifactReference = {
      artifactId: 'form-1',
      artifactName: 'Form',
      artifactType: 'form',
      isCreated: true
    };

    render(<ArtifactReferenceTag artifactRef={formArtifactRef} onClick={mockOnClick} />);

    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByText('form')).toBeInTheDocument();
    expect(screen.getByText('✨ New')).toBeInTheDocument();
    
    const icon = screen.getByTestId('ion-icon');
    expect(icon).toHaveAttribute('data-icon', 'clipboard-outline');
  });

  it('should call onClick when clicked', () => {
    const artifactRef: ArtifactReference = {
      artifactId: 'test-1',
      artifactName: 'Test Artifact',
      artifactType: 'text',
      isCreated: false
    };

    render(<ArtifactReferenceTag artifactRef={artifactRef} onClick={mockOnClick} />);

    const tag = screen.getByText('Test Artifact').closest('div');
    fireEvent.click(tag!);

    expect(mockOnClick).toHaveBeenCalledWith(artifactRef);
  });

  it('should render proposal artifact with text type correctly', () => {
    const proposalArtifactRef: ArtifactReference = {
      artifactId: 'proposal-456',
      artifactName: 'Catering Services Proposal for 25-Person Event',
      artifactType: 'text',
      isCreated: true
    };

    render(<ArtifactReferenceTag artifactRef={proposalArtifactRef} onClick={mockOnClick} />);

    // Should display the proposal name
    expect(screen.getByText('Catering Services Proposal for 25-Person Event')).toBeInTheDocument();
    
    // Should display as 'text' type, NOT 'form'
    expect(screen.getByText('text')).toBeInTheDocument();
    expect(screen.queryByText('form')).not.toBeInTheDocument();
    
    // Should show "New" indicator
    expect(screen.getByText('✨ New')).toBeInTheDocument();
    
    // Should use document icon for text type (same as document)
    const icon = screen.getByTestId('ion-icon');
    expect(icon).toHaveAttribute('data-icon', 'document-text-outline');
  });
});