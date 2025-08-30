// Copyright Mark Skiba, 2025 All rights reserved

import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders without crashing', () => {
  const { baseElement } = render(<App />);
  expect(baseElement).toBeDefined();
});
