import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import Loading from '@/app/dosare/[id]/loading';

describe('CasePageLoading', () => {
  it('renders a loading status', () => {
    render(<Loading />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
