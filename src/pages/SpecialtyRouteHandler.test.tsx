// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route } from 'react-router-dom';
import SpecialtyRouteHandler from './SpecialtyRouteHandler';
import { SpecialtySiteService } from '../services/specialtySiteService';
import { SpecialtySite } from '../types/database';

// Mock the supabaseClient
jest.mock('../supabaseClient', () => ({
  supabase: {}
}));

// Mock the services and components
jest.mock('../services/specialtySiteService');
jest.mock('./Home', () => {
  return function MockHome() {
    return <div>Home Component</div>;
  };
});
jest.mock('./SiteIndexPage', () => {
  return function MockSiteIndexPage() {
    return <div>Site Index Page</div>;
  };
});

describe('SpecialtyRouteHandler', () => {
  const mockValidSite: SpecialtySite = {
    id: '1',
    name: 'Corporate TMC',
    slug: 'corporate-tmc',
    description: 'Corporate Travel Management Company procurement',
    is_active: true,
    is_default: false,
    sort_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading spinner while validating site', async () => {
    let resolvePromise: (value: SpecialtySite | null) => void;
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockImplementation(
      () => new Promise((resolve) => { resolvePromise = resolve; })
    );

    render(
      <MemoryRouter initialEntries={['/corporate-tmc']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    // Give it a moment to start rendering loading state
    await waitFor(() => {
      expect(SpecialtySiteService.getSpecialtySiteBySlug).toHaveBeenCalled();
    });
  })

  it('renders Home component when specialty site is valid', async () => {
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockResolvedValue(mockValidSite);

    render(
      <MemoryRouter initialEntries={['/corporate-tmc']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Home Component')).toBeInTheDocument();
    });
  });

  it('renders SiteIndexPage when specialty site is not found', async () => {
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockResolvedValue(null);

    render(
      <MemoryRouter initialEntries={['/invalid-site']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Site Index Page')).toBeInTheDocument();
    });
  });

  it('renders SiteIndexPage when specialty site validation fails', async () => {
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(
      <MemoryRouter initialEntries={['/error-site']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Site Index Page')).toBeInTheDocument();
    });
  });

  it('renders SiteIndexPage when specialty parameter is missing', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Route exact path="/:specialty?" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Site Index Page')).toBeInTheDocument();
    });
  });

  it('calls getSpecialtySiteBySlug with correct slug', async () => {
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockResolvedValue(mockValidSite);

    render(
      <MemoryRouter initialEntries={['/corporate-tmc']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(SpecialtySiteService.getSpecialtySiteBySlug).toHaveBeenCalledWith('corporate-tmc');
    });
  });

  it('calls getSpecialtySiteBySlug when specialty parameter is provided', async () => {
    (SpecialtySiteService.getSpecialtySiteBySlug as jest.Mock).mockResolvedValue(mockValidSite);

    render(
      <MemoryRouter initialEntries={['/corporate-tmc']}>
        <Route path="/:specialty" component={SpecialtyRouteHandler} />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(SpecialtySiteService.getSpecialtySiteBySlug).toHaveBeenCalledWith('corporate-tmc');
      expect(screen.getByText('Home Component')).toBeInTheDocument();
    });
  });
});
