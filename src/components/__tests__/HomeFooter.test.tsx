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
      description: 'Test description',
      specification: 'Test specification'
    };

    render(<HomeFooter currentRfp={mockRfp} />);
    
    expect(screen.getByText('Current RFP: Test RFP Project')).toBeInTheDocument();
  });

  it('should apply correct CSS styles for fixed positioning', () => {
    const { container } = render(<HomeFooter currentRfp={null} />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toHaveStyle({
      position: 'fixed',
      bottom: '0',
      left: '0',
      right: '0',
      height: '40px',
      'z-index': '1000'
    });
  });

  it('should have correct styling for footer appearance', () => {
    const { container } = render(<HomeFooter currentRfp={null} />);
    
    const footerDiv = container.firstChild as HTMLElement;
    expect(footerDiv).toHaveStyle({
      'background-color': 'var(--ion-color-light)',
      'border-top': '1px solid var(--ion-color-medium)',
      'font-size': '14px',
      'color': 'var(--ion-color-dark)',
      'text-align': 'left'
    });
  });

  it('should handle undefined currentRfp gracefully', () => {
    render(<HomeFooter currentRfp={undefined} />);
    
    expect(screen.getByText('Current RFP: none')).toBeInTheDocument();
  });

  it('should handle RFP with empty name', () => {
    const mockRfp = {
      id: 1,
      name: '',
      description: 'Test description',
      specification: 'Test specification'
    };

    render(<HomeFooter currentRfp={mockRfp} />);
    
    expect(screen.getByText('Current RFP:')).toBeInTheDocument();
  });
});
