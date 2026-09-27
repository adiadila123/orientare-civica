import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HowItWorks } from '@/components/HowItWorks';

describe('HowItWorks', () => {
  it('renders the heading and all three steps', () => {
    render(<HowItWorks />);
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
    expect(screen.getByText(/Descrii problema ta/)).toBeInTheDocument();
    expect(screen.getByText(/Inteligența artificială analizează/)).toBeInTheDocument();
    expect(screen.getByText(/Primești instituția potrivită/)).toBeInTheDocument();
  });
});
