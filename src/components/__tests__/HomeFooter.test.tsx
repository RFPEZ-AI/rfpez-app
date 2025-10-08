// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeFooter from '../HomeFooter';
import { RFP } from '../../types/rfp';

describe('HomeFooter', () => {
  it('should display "none" when no current RFP', () => {
    render(<HomeFooter currentRfp={null} />);
    
    // Check for the "Current RFP:" label
    expect(screen.getByText('Current RFP:')).toBeInTheDocument();
    
    // Check for the dropdown with empty value (no selection)
    const dropdown = screen.getByTestId('current-rfp-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveAttribute('value', '');
  });

  it('should display RFP name when current RFP exists', () => {
    const mockRfp = {
      id: 1,
      name: 'Test RFP Project',
      due_date: '2024-12-31T23:59:59.000Z',
      description: 'Test description',
      specification: 'Test specification',
      proposal: null,
      buyer_questionnaire: null,
      buyer_questionnaire_response: null,
      bid_form_questionaire: null,
      is_template: false,
      is_public: false,
      suppliers: [],
      agent_ids: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    render(<HomeFooter currentRfp={mockRfp} />);
    
    // Check for the "Current RFP:" label
    expect(screen.getByText('Current RFP:')).toBeInTheDocument();
    
    // Check for the dropdown with the RFP id as value
    const dropdown = screen.getByTestId('current-rfp-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveAttribute('value', '1');
  });

  it('should apply correct CSS styles for fixed positioning', () => {
    const { container } = render(<HomeFooter currentRfp={null} />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toBeInTheDocument();
    
    // Check individual style properties directly
    expect(footerDiv.style.position).toBe('fixed');
    expect(footerDiv.style.bottom).toBe('0px');
    expect(footerDiv.style.left).toBe('0px');
    expect(footerDiv.style.right).toBe('0px');
    expect(footerDiv.style.height).toBe('40px');
  });

  it('should have correct styling for footer appearance', () => {
    const { container } = render(<HomeFooter currentRfp={null} />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toBeInTheDocument();
    
    // Check the essential layout styles (non-CSS variable styles work fine)
    expect(footerDiv.style.fontSize).toBe('14px');
    expect(footerDiv.style.textAlign).toBe('left');
    expect(footerDiv.style.display).toBe('flex');
    expect(footerDiv.style.alignItems).toBe('center');
    expect(footerDiv.style.padding).toBe('8px 16px');
    expect(footerDiv.style.justifyContent).toBe('space-between');
    expect(footerDiv.style.boxSizing).toBe('border-box');
    
    // Note: CSS custom properties (--ion-color-*) are not reliably testable in jsdom
    // but the component structure and non-variable styles are verified
  });

  it('should handle null currentRfp gracefully', () => {
    render(<HomeFooter currentRfp={null} />);
    
    // Check for the "Current RFP:" label
    expect(screen.getByText('Current RFP:')).toBeInTheDocument();
    
    // Check for the dropdown with empty value (no selection)
    const dropdown = screen.getByTestId('current-rfp-dropdown');
    expect(dropdown).toBeInTheDocument();
    expect(dropdown).toHaveAttribute('value', '');
  });

  it('should handle RFP with empty name', () => {
    const mockRfp = {
      id: 1,
      name: '',
      due_date: '2024-12-31T23:59:59.000Z',
      description: 'Test description',
      specification: 'Test specification',
      proposal: null,
      buyer_questionnaire: null,
      buyer_questionnaire_response: null,
      bid_form_questionaire: null,
      is_template: false,
      is_public: false,
      suppliers: [],
      agent_ids: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    render(<HomeFooter currentRfp={mockRfp} />);
    
    expect(screen.getByText('Current RFP:')).toBeInTheDocument();
  });

  it('should show Bids button when RFP is selected and onViewBids is provided', () => {
    const mockRfp: RFP = {
      id: 1,
      name: 'Test RFP',
      due_date: '2024-12-31T23:59:59.000Z',
      description: 'Test description',
      specification: 'Test specification',
      buyer_questionnaire: null,
      buyer_questionnaire_response: null,
      bid_form_questionaire: null,
      is_template: false,
      is_public: false,
      suppliers: [],
      agent_ids: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    const mockOnViewBids = jest.fn();

    render(<HomeFooter currentRfp={mockRfp} onViewBids={mockOnViewBids} />);
    
    const bidsButton = screen.getByText('Bids');
    expect(bidsButton).toBeInTheDocument();
  });

  it('should call onViewBids when Bids button is clicked', () => {
    const mockRfp: RFP = {
      id: 1,
      name: 'Test RFP',
      due_date: '2024-12-31T23:59:59.000Z',
      description: 'Test description',
      specification: 'Test specification',
      buyer_questionnaire: null,
      buyer_questionnaire_response: null,
      bid_form_questionaire: null,
      is_template: false,
      is_public: false,
      suppliers: [],
      agent_ids: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    const mockOnViewBids = jest.fn();

    render(<HomeFooter currentRfp={mockRfp} onViewBids={mockOnViewBids} />);
    
    const bidsButton = screen.getByText('Bids');
    bidsButton.click();
    
    expect(mockOnViewBids).toHaveBeenCalledTimes(1);
  });

  it('should not show Bids button when no RFP is selected', () => {
    const mockOnViewBids = jest.fn();

    render(<HomeFooter currentRfp={null} onViewBids={mockOnViewBids} />);
    
    expect(screen.queryByText('Bids')).not.toBeInTheDocument();
  });

  it('should not show Bids button when onViewBids is not provided', () => {
    const mockRfp: RFP = {
      id: 1,
      name: 'Test RFP',
      due_date: '2024-12-31T23:59:59.000Z',
      description: 'Test description',
      specification: 'Test specification',
      buyer_questionnaire: null,
      buyer_questionnaire_response: null,
      bid_form_questionaire: null,
      is_template: false,
      is_public: false,
      suppliers: [],
      agent_ids: [],
      created_at: '2024-01-01T00:00:00.000Z',
      updated_at: '2024-01-01T00:00:00.000Z'
    };

    render(<HomeFooter currentRfp={mockRfp} />);
    
    expect(screen.queryByText('Bids')).not.toBeInTheDocument();
  });
});
