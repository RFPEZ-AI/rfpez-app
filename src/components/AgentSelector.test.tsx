// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgentSelector from './AgentSelector';
import { AgentService } from '../services/agentService';
import type { Agent, SessionActiveAgent } from '../types/database';

// Mock the AgentService
jest.mock('../services/agentService', () => ({
  AgentService: {
    getActiveAgents: jest.fn(),
    setSessionAgent: jest.fn(),
    getSessionActiveAgent: jest.fn()
  }
}));

// Mock Ionic React components
interface MockIonModalProps {
  children: React.ReactNode;
  isOpen: boolean;
}

interface MockIonToastProps {
  isOpen: boolean;
  message: string;
}

jest.mock('@ionic/react', () => ({
  ...jest.requireActual('@ionic/react'),
  IonModal: ({ children, isOpen }: MockIonModalProps) => isOpen ? <div data-testid="modal">{children}</div> : null,
  IonToast: ({ isOpen, message }: MockIonToastProps) => isOpen ? <div data-testid="toast">{message}</div> : null
}));

describe('AgentSelector', () => {
  const mockAgentService = AgentService as jest.Mocked<typeof AgentService>;
  
  const mockAgents: Agent[] = [
    {
      id: '1',
      name: 'Solutions',
      description: 'Sales agent for EZRFP.APP',
      instructions: 'You are a sales agent',
      initial_prompt: 'How can I help you?',
      is_active: true,
      is_default: true,
      is_restricted: false,
      is_free: false,
      sort_order: 0,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '2',
      name: 'RFP Design',
      description: 'Free agent for RFP design',
      instructions: 'You are an RFP design specialist',
      initial_prompt: 'I can help you design RFPs',
      is_active: true,
      is_default: false,
      is_restricted: false,
      is_free: true,
      sort_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Technical Support',
      description: 'Premium support agent',
      instructions: 'You provide technical support',
      initial_prompt: 'How can I assist you?',
      is_active: true,
      is_default: false,
      is_restricted: true,
      is_free: false,
      sort_order: 2,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    }
  ];

  const mockCurrentAgent: SessionActiveAgent = {
    agent_id: '1',
    agent_name: 'Solutions',
    agent_instructions: 'You are a sales agent',
    agent_initial_prompt: 'How can I help you?'
  };

  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    sessionId: 'test-session',
    supabaseUserId: 'test-user',
    currentAgent: mockCurrentAgent,
    onAgentChanged: jest.fn(),
    hasProperAccountSetup: false,
    isAuthenticated: true
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAgentService.getActiveAgents.mockResolvedValue(mockAgents);
    mockAgentService.setSessionAgent.mockResolvedValue(true);
    mockAgentService.getSessionActiveAgent.mockResolvedValue(mockCurrentAgent);
  });

  it('should render agent selector modal when open', async () => {
    render(<AgentSelector {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    await waitFor(() => {
      // Check for "Solutions" text and " Agent" text separately - they exist in the same element
      expect(screen.getByText('Solutions')).toBeInTheDocument();
      expect(screen.getByText('RFP Design')).toBeInTheDocument();
    });
  });

  it('should display appropriate info text for authenticated users without billing', async () => {
    render(<AgentSelector {...defaultProps} hasProperAccountSetup={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Free agents \(🎁\) are available to all authenticated users/)).toBeInTheDocument();
      expect(screen.getByText(/Premium agents \(🔒\) require billing setup/)).toBeInTheDocument();
    });
  });

  it('should display appropriate info text for authenticated users with billing', async () => {
    render(<AgentSelector {...defaultProps} hasProperAccountSetup={true} />);

    await waitFor(() => {
      expect(screen.getByText(/Premium agents \(🔒\) are also available with your billing setup/)).toBeInTheDocument();
    });
  });

  it('should display appropriate info text for non-authenticated users', async () => {
    render(<AgentSelector {...defaultProps} isAuthenticated={false} />);

    await waitFor(() => {
      expect(screen.getByText(/Sign in to access our AI agents/)).toBeInTheDocument();
    });
  });

  it('should show free agent indicator', async () => {
    render(<AgentSelector {...defaultProps} />);

    await waitFor(() => {
      const freeAgentIndicator = screen.getByTitle('Free Agent - Available to authenticated users');
      expect(freeAgentIndicator).toBeInTheDocument();
    });
  });

  it('should show default agent indicator', async () => {
    render(<AgentSelector {...defaultProps} />);

    await waitFor(() => {
      const defaultAgentIndicator = screen.getByTitle('Default Agent');
      expect(defaultAgentIndicator).toBeInTheDocument();
    });
  });

  it('should show premium agent indicator', async () => {
    render(<AgentSelector {...defaultProps} />);

    await waitFor(() => {
      const premiumAgentIndicator = screen.getByTitle('Premium Agent - Requires billing setup');
      expect(premiumAgentIndicator).toBeInTheDocument();
    });
  });

  describe('Agent Access Control', () => {
    it('should allow free agent selection for authenticated users without billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={false} />);

      await waitFor(() => {
        const rfpDesignAgent = screen.getByText('RFP Design');
        expect(rfpDesignAgent).toBeInTheDocument();
      });

      // The agent card should not be disabled
      const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
      expect(rfpDesignCard).not.toHaveClass('disabled-agent');
    });

    it('should block premium agent selection for authenticated users without billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={false} />);

      await waitFor(() => {
        const supportAgent = screen.getByText('Technical Support');
        expect(supportAgent).toBeInTheDocument();
      });

      // Find the Technical Support agent card - it should be disabled
      const supportCard = screen.getByText('Technical Support').closest('ion-card');
      expect(supportCard).toHaveClass('disabled-agent');
    });

    it('should allow premium agent selection for authenticated users with billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={true} />);

      await waitFor(() => {
        const supportAgent = screen.getByText('Technical Support');
        expect(supportAgent).toBeInTheDocument();
      });

      // Find the Technical Support agent card - it should be enabled
      const supportCard = screen.getByText('Technical Support').closest('ion-card');
      expect(supportCard).not.toHaveClass('disabled-agent');
    });

    it('should show only default agent for non-authenticated users', async () => {
      render(<AgentSelector {...defaultProps} isAuthenticated={false} />);

      await waitFor(() => {
        // Should only show default agent - check for "Solutions" text
        expect(screen.getByText('Solutions')).toBeInTheDocument();
        
        // Should not show free or premium agents for non-authenticated users
        const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
        const supportCard = screen.getByText('Technical Support').closest('ion-card');
        
        expect(rfpDesignCard).toHaveClass('disabled-agent');
        expect(supportCard).toHaveClass('disabled-agent');
      });
    });
  });

  describe('Agent Selection', () => {
    it('should handle free agent selection successfully', async () => {
      render(<AgentSelector {...defaultProps} />);

      await waitFor(() => {
        const rfpDesignAgent = screen.getByText('RFP Design');
        expect(rfpDesignAgent).toBeInTheDocument();
      });

      const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
      if (rfpDesignCard) {
        fireEvent.click(rfpDesignCard);
      }

      await waitFor(() => {
        expect(mockAgentService.setSessionAgent).toHaveBeenCalledWith(
          'test-session',
          '2', // RFP Design agent ID
          'test-user'
        );
      });
    });

    it('should show toast when trying to select premium agent without billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={false} />);

      await waitFor(() => {
        const supportAgent = screen.getByText('Technical Support');
        expect(supportAgent).toBeInTheDocument();
      });

      const supportCard = screen.getByText('Technical Support').closest('ion-card');
      if (supportCard) {
        fireEvent.click(supportCard);
      }

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toHaveTextContent(
          'This premium agent requires billing setup. Please complete account setup to access advanced features.'
        );
      });

      expect(mockAgentService.setSessionAgent).not.toHaveBeenCalled();
    });

    it('should show toast when non-authenticated user tries to select non-default agent', async () => {
      render(<AgentSelector {...defaultProps} isAuthenticated={false} />);

      await waitFor(() => {
        const rfpDesignAgent = screen.getByText('RFP Design');
        expect(rfpDesignAgent).toBeInTheDocument();
      });

      const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
      if (rfpDesignCard) {
        fireEvent.click(rfpDesignCard);
      }

      await waitFor(() => {
        expect(screen.getByTestId('toast')).toHaveTextContent(
          'Please sign in to access more agents and features.'
        );
      });

      expect(mockAgentService.setSessionAgent).not.toHaveBeenCalled();
    });
  });

  describe('Agent Properties Display', () => {
    it('should display agent descriptions correctly', async () => {
      render(<AgentSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Sales agent for EZRFP.APP')).toBeInTheDocument();
        expect(screen.getByText('Free agent for RFP design')).toBeInTheDocument();
        expect(screen.getByText('Premium support agent')).toBeInTheDocument();
      });
    });

    it('should display agent initial prompts correctly', async () => {
      render(<AgentSelector {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('"How can I help you?"')).toBeInTheDocument();
        expect(screen.getByText('"I can help you design RFPs"')).toBeInTheDocument();
        expect(screen.getByText('"How can I assist you?"')).toBeInTheDocument();
      });
    });
  });
});
