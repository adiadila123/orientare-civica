import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/app/institutii/[code]/loading';

describe('InstitutionGuideLoading', () => {
  it('renders a loading status', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
