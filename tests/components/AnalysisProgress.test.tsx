import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisProgress } from '@/components/AnalysisProgress';

describe('AnalysisProgress', () => {
  it('renders all four pipeline steps', () => {
    render(<AnalysisProgress />);
    expect(screen.getByText('Se analizează textul')).toBeInTheDocument();
    expect(screen.getByText('Se identifică domeniul')).toBeInTheDocument();
    expect(screen.getByText('Se caută instituția potrivită')).toBeInTheDocument();
    expect(screen.getByText('Se pregătește recomandarea')).toBeInTheDocument();
  });

  it('has an accessible status role so screen readers announce progress', () => {
    render(<AnalysisProgress />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
