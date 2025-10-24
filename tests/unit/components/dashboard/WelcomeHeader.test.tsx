import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';

describe('WelcomeHeader', () => {
  it('renders greeting with plant emoji', () => {
    render(<WelcomeHeader greeting="Welcome back, John!" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('Welcome back, John! 🌱');
  });

  it('renders the subtitle text', () => {
    render(<WelcomeHeader greeting="Welcome back!" />);

    expect(screen.getByText("Here's how your plants are doing today")).toBeInTheDocument();
  });

  it('handles empty greeting', () => {
    render(<WelcomeHeader greeting="" />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent('🌱');
  });

  it('handles long greeting text', () => {
    const longGreeting = 'Welcome back, ' + 'A'.repeat(100) + '!';
    render(<WelcomeHeader greeting={longGreeting} />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent(longGreeting + ' 🌱');
  });
});
