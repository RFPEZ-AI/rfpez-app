// Copyright Mark Skiba, 2025 All rights reserved
/* eslint-disable @typescript-eslint/no-explicit-any */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIsMobile } from '../../utils/useMediaQuery';
import { RoleService } from '../../services/roleService';
import HomeHeader from '../HomeHeader';

// Mock the dependencies
jest.mock('../../utils/useMediaQuery');
jest.mock('../../services/roleService', () => ({
  RoleService: {
    isDeveloperOrHigher: jest.fn(),
    isAdministrator: jest.fn(),
  }
}));

// Mock the Ionic components
jest.mock('@ionic/react', () => ({
  IonHeader: ({ children }: any) => <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: any) => <div data-testid="ion-toolbar">{children}</div>,
  IonButtons: ({ children }: any) => <div data-testid="ion-buttons">{children}</div>,
  IonButton: ({ children, onClick, 'data-testid': dataTestId, ...props }: any) => (
    <div data-testid={dataTestId} onClick={onClick} {...props}>{children}</div>
  ),
  IonIcon: ({ icon }: any) => <div data-testid="ion-icon">{icon}</div>,
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

jest.mock('../RateLimitStatus', () => ({
  SimpleRateLimitStatus: function SimpleRateLimitStatus() {
    return <div data-testid="rate-limit-status">Rate Limit Status</div>;
  }
}));

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
    mockRoleService.isAdministrator.mockReturnValue(false);
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
    const userProfile = { 
      supabase_user_id: 'user-123',
      role: 'developer' as any,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockRoleService.isDeveloperOrHigher.mockReturnValue(true);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.getByTestId('main-menu')).toBeInTheDocument();
  });

  it('should not show main menu for non-developer roles', () => {
    const userProfile = { 
      supabase_user_id: 'user-123',
      role: 'user' as any,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockRoleService.isDeveloperOrHigher.mockReturnValue(false);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.queryByTestId('main-menu')).not.toBeInTheDocument();
  });

  it('should show saved indicator when authenticated and not mobile', () => {
    const props = {
      ...defaultProps,
      isAuthenticated: true,
      user: { 
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      } as any,
      userProfile: { 
        id: 'profile-123',
        supabase_user_id: 'user-123',
        role: 'user' as any,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    };
    mockUseIsMobile.mockReturnValue(false);

    render(<HomeHeader {...props} />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
  });

  it('should not show saved indicator on mobile', () => {
    const props = {
      ...defaultProps,
      isAuthenticated: true,
      user: { 
        id: 'user-123',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2024-01-01T00:00:00.000Z'
      } as any,
      userProfile: { 
        id: 'profile-123',
        supabase_user_id: 'user-123',
        role: 'user' as any,
        created_at: '2024-01-01T00:00:00.000Z',
        updated_at: '2024-01-01T00:00:00.000Z'
      }
    };
    mockUseIsMobile.mockReturnValue(true);

    render(<HomeHeader {...props} />);

    expect(screen.queryByText('Saved')).not.toBeInTheDocument();
  });

  it('should show RFP and Agents menus for administrator roles', () => {
    const userProfile = { 
      supabase_user_id: 'user-123',
      role: 'administrator' as any,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockRoleService.isAdministrator.mockReturnValue(true);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.getByTestId('rfp-menu-button')).toBeInTheDocument();
    expect(screen.getByTestId('agents-menu-button')).toBeInTheDocument();
    expect(screen.getByTestId('generic-menu')).toBeInTheDocument();
    expect(screen.getByTestId('agents-menu')).toBeInTheDocument();
  });

  it('should not show RFP and Agents menus for non-administrator roles', () => {
    const userProfile = { 
      supabase_user_id: 'user-123',
      role: 'user' as any,
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };
    mockRoleService.isAdministrator.mockReturnValue(false);

    render(<HomeHeader {...defaultProps} userProfile={userProfile} />);

    expect(screen.queryByTestId('rfp-menu-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agents-menu-button')).not.toBeInTheDocument();
    expect(screen.queryByTestId('generic-menu')).not.toBeInTheDocument();
    expect(screen.queryByTestId('agents-menu')).not.toBeInTheDocument();
  });

  it('should render required components that are always visible', () => {
    render(<HomeHeader {...defaultProps} />);

    expect(screen.getByTestId('agent-indicator')).toBeInTheDocument();
    expect(screen.getByTestId('auth-buttons')).toBeInTheDocument();
  });
});
