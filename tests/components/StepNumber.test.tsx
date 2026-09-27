import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepNumber } from '@/components/StepNumber';

describe('StepNumber', () => {
  it('renders the given index', () => {
    render(<StepNumber index={3} />);
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders the larger primary variant when size is lg', () => {
    render(<StepNumber index={1} size="lg" />);
    expect(screen.getByText('1')).toHaveClass('w-8', 'h-8', 'bg-primary');
  });

  it('renders the default smaller secondary variant', () => {
    render(<StepNumber index={2} />);
    expect(screen.getByText('2')).toHaveClass('w-6', 'h-6', 'bg-secondary');
  });
});
