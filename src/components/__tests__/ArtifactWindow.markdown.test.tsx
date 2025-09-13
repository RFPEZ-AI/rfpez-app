// Test for enhanced markdown rendering in ArtifactWindow
import React from 'react';
import { render, screen } from '@testing-library/react';
import ArtifactWindow from '../ArtifactWindow';
import { Artifact } from '../../types/home';

// Mock ReactMarkdown for testing
jest.mock('react-markdown', () => {
  return function ReactMarkdown({ children }: { children: string }) {
    return <div data-testid="markdown-content">{children}</div>;
  };
});

describe('ArtifactWindow Enhanced Markdown Rendering', () => {
  const createDocumentArtifact = (content: string, name: string = 'Test Document'): Artifact => ({
    id: 'test-doc-1',
    name,
    type: 'document',
    size: `${content.length} chars`,
    content
  });

  const mockProps = {
    artifact: createDocumentArtifact(''),
    onDownload: jest.fn(),
    onFormSubmit: jest.fn(),
    currentRfpId: 123,
    isCollapsed: false,
    onToggleCollapse: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render structured JSON text artifact with markdown', () => {
    const structuredContent = JSON.stringify({
      title: 'Markdown Test Document',
      description: 'A test document with markdown',
      content: '# Heading\n\nThis is **bold** text with *italic* content.',
      content_type: 'markdown',
      tags: ['test', 'markdown']
    });

    const artifact = createDocumentArtifact(structuredContent);
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    // Should render the markdown content
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Heading');
  });

  it('should detect and render raw markdown content', () => {
    const rawMarkdown = `# Raw Markdown Document

This is a **raw markdown** document that should be *automatically detected*.

## Features
- Bullet point 1
- Bullet point 2`;

    const artifact = createDocumentArtifact(rawMarkdown, 'Raw Markdown Doc');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    // Should detect markdown and render it
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Raw Markdown Document');
  });

  it('should detect markdown patterns', () => {
    const markdownWithHeading = '# Heading pattern';
    const artifact = createDocumentArtifact(markdownWithHeading, 'Heading Test');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);
    
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
    expect(screen.getByTestId('markdown-content')).toHaveTextContent('# Heading pattern');
  });

  it('should detect plain text with line breaks as text content', () => {
    const plainTextWithBreaks = `Plain Text Document

This is plain text with line breaks.
Multiple paragraphs here.`;

    const artifact = createDocumentArtifact(plainTextWithBreaks, 'Plain Text with Breaks');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('should render long plain text as text content', () => {
    const longText = 'This is a longer piece of text that should be detected as text content even without markdown patterns because it exceeds the minimum length threshold.';

    const artifact = createDocumentArtifact(longText, 'Long Plain Text');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('should fall back to default rendering for short content without patterns', () => {
    const shortContent = 'Short text';

    const artifact = createDocumentArtifact(shortContent, 'Short Content');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    // Should use default rendering since content is too short and has no markdown patterns
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    expect(screen.getByText('Type: document')).toBeInTheDocument();
  });

  it('should handle empty content gracefully', () => {
    const artifact = createDocumentArtifact('', 'Empty Document');
    render(<ArtifactWindow {...mockProps} artifact={artifact} />);

    // Should fall back to default rendering
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    expect(screen.getByText('Type: document')).toBeInTheDocument();
  });

  it('should handle form artifacts correctly (not as text)', () => {
    const nonDocumentArtifact: Artifact = {
      id: 'test-form-1',
      name: 'Test Form',
      type: 'form',
      size: '1KB',
      content: JSON.stringify({ schema: {}, uiSchema: {} })
    };

    render(<ArtifactWindow {...mockProps} artifact={nonDocumentArtifact} />);

    // Should not render as text content
    expect(screen.queryByTestId('markdown-content')).not.toBeInTheDocument();
    // Should render as a form instead (look for the form element class)
    expect(screen.getByText('Submit Questionnaire')).toBeInTheDocument();
  });
});