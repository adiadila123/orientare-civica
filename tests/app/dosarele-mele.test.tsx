import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyRecordsPage, { metadata } from '@/app/dosarele-mele/page';

describe('MyRecordsPage', () => {
  it('is not indexable, since it is a per-browser localStorage list', () => {
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it('renders the "Dosarele mele" heading', () => {
    render(<MyRecordsPage />);
    expect(screen.getByRole('heading', { name: 'Dosarele mele' })).toBeInTheDocument();
  });
});
