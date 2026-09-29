import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyRecordsPage from '@/app/dosarele-mele/page';

describe('MyRecordsPage', () => {
  it('renders the "Dosarele mele" heading', () => {
    render(<MyRecordsPage />);
    expect(screen.getByRole('heading', { name: 'Dosarele mele' })).toBeInTheDocument();
  });
});
