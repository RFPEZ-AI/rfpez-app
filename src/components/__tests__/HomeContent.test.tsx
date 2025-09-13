// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeContent from '../HomeContent';
import { Message, Session, Artifact } from '../../types/home';

// Mock the component dependencies
jest.mock('../SessionHistory', () => {
  return function SessionHistory({ sessions, onNewSession }: { 
    sessions: Session[]; 
    onNewSession: () => void;
    [key: string]: unknown;
  }) {
    return (
      <div data-testid="session-history">
        <button onClick={onNewSession}>New Session</button>
        <div>Sessions: {sessions.length}</div>
      </div>
    );
  };
});

jest.mock('../SessionDialog', () => {
  return function SessionDialog({ messages, onSendMessage }: { 
    messages: Message[]; 
    onSendMessage: (message: string) => void;
    [key: string]: unknown;
  }) {
    return (
      <div data-testid="session-dialog">
        <div>Messages: {messages.length}</div>
        <button onClick={() => onSendMessage('test message')}>Send Message</button>
      </div>
    );
  };
});

jest.mock('../ArtifactWindow', () => {
  return function ArtifactWindow({ artifact }: { 
    artifact: Artifact | null;
    [key: string]: unknown;
  }) {
    return (
      <div data-testid="artifact-window">
        <div>Artifact: {artifact ? artifact.name : 'None'}</div>
      </div>
    );
  };
});

describe('HomeContent', () => {
  const mockMessages: Message[] = [
    {
      id: '1',
      content: 'Hello',
      isUser: true,
      timestamp: new Date(),
    },
    {
      id: '2',
      content: 'Hi there!',
      isUser: false,
      timestamp: new Date(),
      agentName: 'TestAgent'
    }
  ];

  const mockSessions: Session[] = [
    {
      id: 'session-1',
      title: 'Test Session 1',
      timestamp: new Date(),
    },
    {
      id: 'session-2',
      title: 'Test Session 2',
      timestamp: new Date(),
      agent_name: 'TestAgent'
    }
  ];

  const mockArtifacts: Artifact[] = [
    {
      id: 'artifact-1',
      name: 'Test Document',
      type: 'document',
      size: '1.2 KB'
    },
    {
      id: 'artifact-2',
      name: 'Test Form',
      type: 'form',
      size: 'Interactive Form'
    }
  ];

  const defaultProps = {
    sessions: mockSessions,
    selectedSessionId: 'session-1',
    onNewSession: jest.fn(),
    onSelectSession: jest.fn(),
    onDeleteSession: jest.fn(),
    messages: mockMessages,
    isLoading: false,
    onSendMessage: jest.fn(),
    onAttachFile: jest.fn(),
    artifacts: mockArtifacts,
    currentRfpId: 123,
    onDownloadArtifact: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all three main sections', () => {
    render(<HomeContent {...defaultProps} />);

    expect(screen.getByTestId('session-history')).toBeInTheDocument();
    expect(screen.getByTestId('session-dialog')).toBeInTheDocument();
    expect(screen.getByTestId('artifact-window')).toBeInTheDocument();
  });

  it('should pass correct props to SessionHistory', () => {
    render(<HomeContent {...defaultProps} />);

    expect(screen.getByText('Sessions: 2')).toBeInTheDocument();
    expect(screen.getByText('New Session')).toBeInTheDocument();
  });

  it('should pass correct props to SessionDialog', () => {
    render(<HomeContent {...defaultProps} />);

    expect(screen.getByText('Messages: 2')).toBeInTheDocument();
    expect(screen.getByText('Send Message')).toBeInTheDocument();
  });

  it('should pass correct props to ArtifactWindow', () => {
    render(<HomeContent {...defaultProps} />);

    // With singleton pattern, shows the most recent artifact (Test Form)
    expect(screen.getByText('Artifact: Test Form')).toBeInTheDocument();
  });

  it('should handle empty data correctly', () => {
    const emptyProps = {
      ...defaultProps,
      sessions: [],
      messages: [],
      artifacts: []
    };

    render(<HomeContent {...emptyProps} />);

    expect(screen.getByText('Sessions: 0')).toBeInTheDocument();
    expect(screen.getByText('Messages: 0')).toBeInTheDocument();
    expect(screen.getByText('Artifact: None')).toBeInTheDocument();
  });

  it('should show first artifact when only one artifact exists', () => {
    const singleArtifactProps = {
      ...defaultProps,
      artifacts: [mockArtifacts[0]]
    };

    render(<HomeContent {...singleArtifactProps} />);

    expect(screen.getByText('Artifact: Test Document')).toBeInTheDocument();
  });

  it('should apply correct CSS layout styles', () => {
    const { container } = render(<HomeContent {...defaultProps} />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toBeInTheDocument();
    
    // Check individual style properties to better debug issues
    expect(mainDiv.style.flex).toBe('1');
    expect(mainDiv.style.display).toBe('flex');
    expect(mainDiv.style.overflow).toBe('hidden');
  });

  it('should have correct structure for responsive layout', () => {
    render(<HomeContent {...defaultProps} />);

    const sessionHistory = screen.getByTestId('session-history');
    const sessionDialog = screen.getByTestId('session-dialog');
    const artifactWindow = screen.getByTestId('artifact-window');

    // Check they are all rendered in the DOM
    expect(sessionHistory).toBeInTheDocument();
    expect(sessionDialog).toBeInTheDocument();
    expect(artifactWindow).toBeInTheDocument();

    // The session dialog should be wrapped in a flex container
    const dialogWrapper = sessionDialog.parentElement;
    expect(dialogWrapper).toBeInTheDocument();
    if (dialogWrapper) {
      // Check inline styles directly instead of using toHaveStyle
      expect(dialogWrapper.style.flex).toBe('1');
      expect(dialogWrapper.style.overflow).toBe('hidden');
    }
  });
});
