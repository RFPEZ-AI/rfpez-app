// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeContent from '../HomeContent';
import { Message, Session, Artifact } from '../../types/home';

// Mock the component dependencies
jest.mock('../SessionHistory', () => {
  return function SessionHistory({ sessions, onNewSession }: any) {
    return (
      <div data-testid="session-history">
        <button onClick={onNewSession}>New Session</button>
        <div>Sessions: {sessions.length}</div>
      </div>
    );
  };
});

jest.mock('../SessionDialog', () => {
  return function SessionDialog({ messages, onSendMessage }: any) {
    return (
      <div data-testid="session-dialog">
        <div>Messages: {messages.length}</div>
        <button onClick={() => onSendMessage('test message')}>Send Message</button>
      </div>
    );
  };
});

jest.mock('../ArtifactWindow', () => {
  return function ArtifactWindow({ artifacts }: any) {
    return (
      <div data-testid="artifact-window">
        <div>Artifacts: {artifacts.length}</div>
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
    onViewArtifact: jest.fn(),
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

    expect(screen.getByText('Artifacts: 2')).toBeInTheDocument();
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
    expect(screen.getByText('Artifacts: 0')).toBeInTheDocument();
  });

  it('should apply correct CSS layout styles', () => {
    const { container } = render(<HomeContent {...defaultProps} />);
    
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveStyle({
      flex: '1',
      display: 'flex',
      overflow: 'hidden',
      'min-height': '0',
      'padding-top': '56px',
      'padding-bottom': '40px'
    });
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
    expect(dialogWrapper).toHaveStyle({
      flex: '1',
      overflow: 'hidden'
    });
  });
});
