import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders the civic helpline and legal disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/0800 008 123/)).toBeInTheDocument();
    expect(screen.getByText(/nu constituie consultanță juridică/)).toBeInTheDocument();
  });
});
