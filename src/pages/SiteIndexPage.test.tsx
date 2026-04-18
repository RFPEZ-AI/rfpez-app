// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SiteIndexPage from './SiteIndexPage';
import { SpecialtySiteService } from '../services/specialtySiteService';
import { SpecialtySite } from '../types/database';

// Mock the supabaseClient
jest.mock('../supabaseClient', () => ({
  supabase: {}
}));

// Mock the SpecialtySiteService
jest.mock('../services/specialtySiteService');

// Mock useHistory
const mockPush = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useHistory: () => ({
    push: mockPush
  })
}));

describe('SiteIndexPage', () => {
  const mockSites: SpecialtySite[] = [
    {
      id: '1',
      name: 'Corporate TMC',
      slug: 'corporate-tmc',
      description: 'Corporate Travel Management Company procurement',
      is_active: true,
      is_default: false,
      sort_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'LED Procurement',
      slug: 'led',
      description: 'LED lighting procurement site',
      is_active: true,
      is_default: false,
      sort_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (SpecialtySiteService.getActiveSpecialtySites as jest.Mock).mockResolvedValue(mockSites);
  });

  it('renders loading state initially', () => {
    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/loading available sites/i)).toBeInTheDocument();
  });

  it('displays available sites after loading', async () => {
    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Corporate TMC')).toBeInTheDocument();
      expect(screen.getByText('LED Procurement')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('navigates to home when home is clicked', async () => {
    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    const homeItem = screen.getByTestId('site-home');
    fireEvent.click(homeItem);

    expect(mockPush).toHaveBeenCalledWith('/home');
  });

  it('navigates to specialty site when site is clicked', async () => {
    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Corporate TMC')).toBeInTheDocument();
    });

    const corporateTmcItem = screen.getByTestId('site-corporate-tmc');
    fireEvent.click(corporateTmcItem);

    expect(mockPush).toHaveBeenCalledWith('/corporate-tmc');
  });

  it('displays error message when loading fails', async () => {
    (SpecialtySiteService.getActiveSpecialtySites as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load available sites/i)).toBeInTheDocument();
    });
  });

  it('allows retry after error', async () => {
    (SpecialtySiteService.getActiveSpecialtySites as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(mockSites);

    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/failed to load available sites/i)).toBeInTheDocument();
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('Corporate TMC')).toBeInTheDocument();
    });
  });

  it('displays message when no sites available', async () => {
    (SpecialtySiteService.getActiveSpecialtySites as jest.Mock).mockResolvedValue([]);

    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/no sites available at the moment/i)).toBeInTheDocument();
    });
  });

  it('displays site descriptions', async () => {
    render(
      <MemoryRouter>
        <SiteIndexPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Corporate Travel Management Company procurement')).toBeInTheDocument();
      expect(screen.getByText('LED lighting procurement site')).toBeInTheDocument();
    });
  });
});
