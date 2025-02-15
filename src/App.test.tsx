import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders card quiz game title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Card Quiz Game/i);
  expect(titleElement).toBeInTheDocument();
});
