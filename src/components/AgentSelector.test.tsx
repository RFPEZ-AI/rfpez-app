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
    getAvailableAgents: jest.fn(),
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
      description: 'Sales agent for EZRFP.APP to help with product questions and competitive sourcing',
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
      description: 'Free agent to help with basic RFP design and creation for authenticated users',
      instructions: 'You are an RFP design specialist',
      initial_prompt: 'I can help you design RFPs',
      is_active: true,
      is_default: false,
      is_restricted: false,
      is_free: false,  // This matches the database - RFP Design is NOT free
      sort_order: 1,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z'
    },
    {
      id: '3',
      name: 'Support',
      description: 'Technical assistance agent for platform usage and troubleshooting',
      instructions: 'You provide technical support',
      initial_prompt: 'How can I assist you?',
      is_active: true,
      is_default: false,
      is_restricted: false,
      is_free: true,  // This matches the database - Support IS free
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
    
    // Mock getAvailableAgents to properly filter agents based on parameters
    mockAgentService.getAvailableAgents.mockImplementation((hasProperAccountSetup = false, isAuthenticated = false) => {
      let availableAgents = [...mockAgents];
      
      // If user is not authenticated, they can see default agents AND free agents
      if (!isAuthenticated) {
        availableAgents = availableAgents.filter(agent => agent.is_default || agent.is_free);
        console.log('Mock: Non-authenticated user - showing default and free agents:', availableAgents.map(a => a.name));
        return Promise.resolve(availableAgents);
      }

      // For authenticated users, include:
      // 1. Default agents (available to all)
      // 2. Free agents (available to authenticated users without billing)
      // 3. Non-restricted, non-free agents for all authenticated users
      // 4. Restricted agents only if user has proper account setup
      availableAgents = availableAgents.filter(agent => {
        // Always include default agent
        if (agent.is_default) return true;
        
        // Include free agents for authenticated users
        if (agent.is_free) return true;
        
        // Include non-restricted, non-free agents for all authenticated users
        if (!agent.is_restricted && !agent.is_free) return true;
        
        // Include restricted agents only if user has proper account setup
        if (agent.is_restricted && hasProperAccountSetup) return true;
        
        return false;
      });

      console.log('Mock: Authenticated user (hasProperAccountSetup=' + hasProperAccountSetup + ') - showing agents:', availableAgents.map(a => a.name));
      return Promise.resolve(availableAgents);
    });
    
    mockAgentService.setSessionAgent.mockResolvedValue(true);
    mockAgentService.getSessionActiveAgent.mockResolvedValue(mockCurrentAgent);
  });

  it('should render agent selector modal when open', async () => {
    render(<AgentSelector {...defaultProps} />);

    expect(screen.getByTestId('modal')).toBeInTheDocument();
    
    await waitFor(() => {
      // Check for "Solutions" text and " Agent" text separately - they exist in the same element
      expect(screen.getByText('Solutions')).toBeInTheDocument();
      expect(screen.getByText('Support')).toBeInTheDocument();
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
        const supportAgent = screen.getByText('Support');
        expect(supportAgent).toBeInTheDocument();
      });

      // The agent card should not be disabled
      const supportCard = screen.getByText('Support').closest('ion-card');
      expect(supportCard).not.toHaveClass('disabled-agent');
    });

    it('should block premium agent selection for authenticated users without billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={false} />);

      await waitFor(() => {
        const rfpDesignAgent = screen.getByText('RFP Design');
        expect(rfpDesignAgent).toBeInTheDocument();
      });

      // Find the RFP Design agent card - it should be disabled since it's not free
      const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
      expect(rfpDesignCard).toHaveClass('disabled-agent');
    });

    it('should allow premium agent selection for authenticated users with billing', async () => {
      render(<AgentSelector {...defaultProps} hasProperAccountSetup={true} />);

      await waitFor(() => {
        const rfpDesignAgent = screen.getByText('RFP Design');
        expect(rfpDesignAgent).toBeInTheDocument();
      });

      // Find the RFP Design agent card - it should be enabled for users with billing
      const rfpDesignCard = screen.getByText('RFP Design').closest('ion-card');
      expect(rfpDesignCard).not.toHaveClass('disabled-agent');
    });

    it('should show default and free agents for non-authenticated users', async () => {
      render(<AgentSelector {...defaultProps} isAuthenticated={false} />);

      await waitFor(() => {
        // Should show default agent (Solutions) and free agent (Support)
        expect(screen.getByText('Solutions')).toBeInTheDocument();
        expect(screen.getByText('Support')).toBeInTheDocument();
        
        // RFP Design should not be visible for non-authenticated users (it's not free)
        expect(screen.queryByText('RFP Design')).not.toBeInTheDocument();
      });
    });
  });

  describe('Agent Selection', () => {
    it('should handle free agent selection successfully', async () => {
      render(<AgentSelector {...defaultProps} />);

      await waitFor(() => {
        const supportAgent = screen.getByText('Support');
        expect(supportAgent).toBeInTheDocument();
      });

      const supportCard = screen.getByText('Support').closest('ion-card');
      if (supportCard) {
        fireEvent.click(supportCard);
      }

      await waitFor(() => {
        expect(mockAgentService.setSessionAgent).toHaveBeenCalledWith(
          'test-session',
          '3', // Support agent ID
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
        // Premium support agent should NOT be visible since hasProperAccountSetup is false
        expect(screen.queryByText('Premium support agent')).not.toBeInTheDocument();
      });
    });

    it('should display agent initial prompts correctly', async () => {
      render(<AgentSelector {...defaultProps} />);

      await waitFor(() => {
        // The component wraps initial_prompt text in quotes and small elements, so use flexible text matching
        expect(screen.getByText((content, node) => 
          content.includes('How can I help you?')
        )).toBeInTheDocument();
        expect(screen.getByText((content, node) => 
          content.includes('How can I assist you?')
        )).toBeInTheDocument();
        // RFP Design agent should NOT be visible since it's not free and hasProperAccountSetup is false
        expect(screen.queryByText((content, node) => 
          content.includes('I can help you design RFPs')
        )).not.toBeInTheDocument();
      });
    });
  });
});
