// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import HomeFooter from '../HomeFooter';

describe('HomeFooter', () => {
  it('should display "none" when no current RFP', () => {
    render(<HomeFooter currentRfp={null} />);
    
    expect(screen.getByText('Current RFP: none')).toBeInTheDocument();
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
    
    expect(screen.getByText('Current RFP: Test RFP Project')).toBeInTheDocument();
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
    expect(footerDiv.style.justifyContent).toBe('flex-start');
    expect(footerDiv.style.boxSizing).toBe('border-box');
    
    // Note: CSS custom properties (--ion-color-*) are not reliably testable in jsdom
    // but the component structure and non-variable styles are verified
  });

  it('should handle null currentRfp gracefully', () => {
    render(<HomeFooter currentRfp={null} />);
    
    expect(screen.getByText('Current RFP: none')).toBeInTheDocument();
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
});
