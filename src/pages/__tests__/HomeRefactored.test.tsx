// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Router } from 'react-router-dom';
import { createMemoryHistory } from 'history';
import HomeRefactored from '../HomeRefactored';

// Mock all the dependencies
jest.mock('../../context/SupabaseContext', () => ({
  useSupabase: () => ({
    user: null,
    session: null,
    loading: false,
    userProfile: null
  })
}));

jest.mock('../../hooks/useHomeState', () => ({
  useHomeState: () => ({
    isLoading: false,
    setIsLoading: jest.fn(),
    selectedSessionId: undefined,
    setSelectedSessionId: jest.fn(),
    currentSessionId: undefined,
    setCurrentSessionId: jest.fn()
  })
}));

jest.mock('../../hooks/useSessionState', () => ({
  useSessionState: () => ({
    sessions: [],
    setSessions: jest.fn(),
    messages: [],
    setMessages: jest.fn(),
    loadUserSessions: jest.fn(),
    loadSessionMessages: jest.fn(),
    createNewSession: jest.fn(),
    deleteSession: jest.fn(),
    clearUIState: jest.fn()
  })
}));

jest.mock('../../hooks/useAgentManagement', () => ({
  useAgentManagement: () => ({
    currentAgent: null,
    setCurrentAgent: jest.fn(),
    showAgentSelector: false,
    setShowAgentSelector: jest.fn(),
    agents: [],
    setAgents: jest.fn(),
    showAgentModal: false,
    setShowAgentModal: jest.fn(),
    editingAgent: null,
    setEditingAgent: jest.fn(),
    showAgentsMenu: false,
    setShowAgentsMenu: jest.fn(),
    loadDefaultAgentWithPrompt: jest.fn().mockResolvedValue(null),
    loadSessionAgent: jest.fn(),
    handleAgentChanged: jest.fn(),
    handleNewAgent: jest.fn(),
    handleEditAgent: jest.fn(),
    handleDeleteAgent: jest.fn(),
    handleSaveAgent: jest.fn(),
    handleCancelAgent: jest.fn(),
    handleShowAgentSelector: jest.fn()
  })
}));

jest.mock('../../hooks/useRFPManagement', () => ({
  useRFPManagement: () => ({
    rfps: [],
    setRFPs: jest.fn(),
    showRFPMenu: false,
    setShowRFPMenu: jest.fn(),
    showRFPModal: false,
    setShowRFPModal: jest.fn(),
    showRFPPreviewModal: false,
    setShowRFPPreviewModal: jest.fn(),
    editingRFP: null,
    setEditingRFP: jest.fn(),
    previewingRFP: null,
    setPreviewingRFP: jest.fn(),
    currentRfpId: null,
    setCurrentRfpId: jest.fn(),
    currentRfp: null,
    setCurrentRfp: jest.fn(),
    handleNewRFP: jest.fn(),
    handleEditRFP: jest.fn(),
    handlePreviewRFP: jest.fn(),
    handleShareRFP: jest.fn(),
    handleDeleteRFP: jest.fn(),
    handleSaveRFP: jest.fn(),
    handleCancelRFP: jest.fn(),
    handleClosePreview: jest.fn(),
    handleSetCurrentRfp: jest.fn(),
    handleClearCurrentRfp: jest.fn()
  })
}));

jest.mock('../../hooks/useArtifactManagement', () => ({
  useArtifactManagement: () => ({
    artifacts: [],
    setArtifacts: jest.fn(),
    loadSessionArtifacts: jest.fn(),
    handleAttachFile: jest.fn(),
    addClaudeArtifacts: jest.fn(),
    clearArtifacts: jest.fn()
  })
}));

jest.mock('../../hooks/useMessageHandling', () => ({
  useMessageHandling: () => ({
    handleSendMessage: jest.fn()
  })
}));

// Mock the layout components
jest.mock('../../components/HomeHeader', () => {
  return function HomeHeader() {
    return <div data-testid="home-header">Home Header</div>;
  };
});

jest.mock('../../components/HomeContent', () => {
  return function HomeContent() {
    return <div data-testid="home-content">Home Content</div>;
  };
});

jest.mock('../../components/HomeFooter', () => {
  return function HomeFooter() {
    return <div data-testid="home-footer">Home Footer</div>;
  };
});

// Mock the modal components
jest.mock('../../components/AgentEditModal', () => {
  return function AgentEditModal({ isOpen }: any) {
    return isOpen ? <div data-testid="agent-edit-modal">Agent Edit Modal</div> : null;
  };
});

jest.mock('../../components/RFPEditModal', () => {
  return function RFPEditModal({ isOpen }: any) {
    return isOpen ? <div data-testid="rfp-edit-modal">RFP Edit Modal</div> : null;
  };
});

jest.mock('../../components/RFPPreviewModal', () => {
  return function RFPPreviewModal({ isOpen }: any) {
    return isOpen ? <div data-testid="rfp-preview-modal">RFP Preview Modal</div> : null;
  };
});

jest.mock('../../components/AgentSelector', () => {
  return function AgentSelector({ isOpen }: any) {
    return isOpen ? <div data-testid="agent-selector">Agent Selector</div> : null;
  };
});

// Mock Ionic components
jest.mock('@ionic/react', () => ({
  IonPage: ({ children }: any) => <div data-testid="ion-page">{children}</div>,
  IonContent: ({ children }: any) => <div data-testid="ion-content">{children}</div>,
}));

describe('HomeRefactored Integration Tests', () => {
  const renderWithRouter = (component: React.ReactElement) => {
    const history = createMemoryHistory();
    return render(
      <Router history={history}>
        {component}
      </Router>
    );
  };

  it('should render all main layout components', async () => {
    renderWithRouter(<HomeRefactored />);

    await waitFor(() => {
      expect(screen.getByTestId('ion-page')).toBeInTheDocument();
      expect(screen.getByTestId('home-header')).toBeInTheDocument();
      expect(screen.getByTestId('ion-content')).toBeInTheDocument();
      expect(screen.getByTestId('home-content')).toBeInTheDocument();
      expect(screen.getByTestId('home-footer')).toBeInTheDocument();
    });
  });

  it('should not show modals when they are closed', async () => {
    renderWithRouter(<HomeRefactored />);

    await waitFor(() => {
      expect(screen.queryByTestId('agent-edit-modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rfp-edit-modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('rfp-preview-modal')).not.toBeInTheDocument();
      expect(screen.queryByTestId('agent-selector')).not.toBeInTheDocument();
    });
  });

  it('should have correct CSS structure for main container', async () => {
    const { container } = renderWithRouter(<HomeRefactored />);

    await waitFor(() => {
      const mainDiv = container.querySelector('[style*="height: 100vh"]');
      expect(mainDiv).toBeInTheDocument();
      expect(mainDiv).toHaveStyle({
        height: '100vh',
        display: 'flex',
        'flex-direction': 'column',
        overflow: 'hidden'
      });
    });
  });

  it('should render without crashing when all hooks return default values', async () => {
    renderWithRouter(<HomeRefactored />);

    // Just verify it doesn't crash and basic structure is there
    await waitFor(() => {
      expect(screen.getByTestId('ion-page')).toBeInTheDocument();
    });
  });
});
