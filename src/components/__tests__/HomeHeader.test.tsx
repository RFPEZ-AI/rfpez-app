// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIsMobile } from '../../utils/useMediaQuery';
import { RoleService } from '../../services/roleService';
import HomeHeader from '../HomeHeader';

// Mock the dependencies
jest.mock('../../utils/useMediaQuery');
jest.mock('../../services/roleService');

// Mock the Ionic components
jest.mock('@ionic/react', () => ({
  IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
  IonButtons: ({ children }: any) => <div data-testid="ion-buttons">{children}</div>,
}));

// Mock the component dependencies
jest.mock('../MainMenu', () => {
  return function MainMenu({ onSelect }: any) {
    return <div data-testid="main-menu" onClick={() => onSelect('test')}>Main Menu</div>;
  };
});

jest.mock('../AgentsMenu', () => {
  return function AgentsMenu() {
    return <div data-testid="agents-menu">Agents Menu</div>;
  };
});

jest.mock('../GenericMenu', () => {
  return function GenericMenu() {
    return <div data-testid="generic-menu">Generic Menu</div>;
  };
});

jest.mock('../AgentIndicator', () => {
  return function AgentIndicator() {
    return <div data-testid="agent-indicator">Agent Indicator</div>;
  };
});

jest.mock('../AuthButtons', () => {
  return function AuthButtons() {
    return <div data-testid="auth-buttons">Auth Buttons</div>;
  };
});

const mockUseIsMobile = useIsMobile as jest.MockedFunction<typeof useIsMobile>;
const mockRoleService = RoleService as jest.Mocked<typeof RoleService>;

describe('HomeHeader', () => {
  const defaultProps = {
    userProfile: null,
    isAuthenticated: false,
    user: null,
    rfps: [],
    currentRfpId: null,
    showRFPMenu: false,
    setShowRFPMenu: jest.fn(),
    onNewRFP: jest.fn(),
    onEditRFP: jest.fn(),
    onDeleteRFP: jest.fn(),
    onPreviewRFP: jest.fn(),
    onShareRFP: jest.fn(),
    onSetCurrentRfp: jest.fn(),
    onClearCurrentRfp: jest.fn(),
    agents: [],
    showAgentsMenu: false,
    setShowAgentsMenu: jest.fn(),
    currentAgent: null,
    onNewAgent: jest.fn(),
    onEditAgent: jest.fn(),
    onDeleteAgent: jest.fn(),
    onSwitchAgent: jest.fn(),
    onMainMenuSelect: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseIsMobile.mockReturnValue(false);
    mockRoleService.isDeveloperOrHigher.mockReturnValue(false);
  });

  it('should render basic header structure', () => {
    render(<HomeHeader {...defaultProps} />);

    expect(screen.getByTestId('ion-header')).toBeInTheDocument();
    expect(screen.getByTestId('ion-toolbar')).toBeInTheDocument();
    expect(screen.getByAltText('RFPEZ.AI')).toBeInTheDocument();
  });

  it('should show title on desktop but not on mobile', () => {
    // Desktop
    mockUseIsMobile.mockReturnValue(false);
    const { rerender } = render(<HomeHeader {...defaultProps} />);
    expect(screen.getByText('RFPEZ.AI')).toBeInTheDocument();

    // Mobile
    mockUseIsMobile.mockReturnValue(true);
    rerender(<HomeHeader {...defaultProps} />);
    expect(screen.queryByText('RFPEZ.AI')).not.toBeInTheDocument();
  });

  it('should show main menu for developer or higher roles', () => {
    const userProfile = { role: 'developer' };
    mockRoleService.isDeveloperOrHigher.mockReturnValue(true);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.getByTestId('main-menu')).toBeInTheDocument();
  });

  it('should not show main menu for non-developer roles', () => {
    const userProfile = { role: 'user' };
    mockRoleService.isDeveloperOrHigher.mockReturnValue(false);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.queryByTestId('main-menu')).not.toBeInTheDocument();
  });

  it('should show saved indicator when authenticated and not mobile', () => {
    const props = {
      ...defaultProps,
      isAuthenticated: true,
      user: { id: 'user-123' },
      userProfile: { id: 'profile-123' }
    };
    mockUseIsMobile.mockReturnValue(false);

    render(<HomeHeader {...props} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should not show saved indicator on mobile', () => {
    const props = {
      ...defaultProps,
      isAuthenticated: true,
      user: { id: 'user-123' },
      userProfile: { id: 'profile-123' }
    };
    mockUseIsMobile.mockReturnValue(true);

    render(<HomeHeader {...props} />);

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('should render all required components', () => {
    render(<HomeHeader {...defaultProps} />);

    expect(screen.getByTestId('generic-menu')).toBeInTheDocument();
    expect(screen.getByTestId('agents-menu')).toBeInTheDocument();
    expect(screen.getByTestId('agent-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
  });
});
