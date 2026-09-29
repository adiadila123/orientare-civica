import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import PoliticaCookieUriPage, { metadata } from '@/app/politica-cookie-uri/page';

describe('PoliticaCookieUriPage', () => {
  it('sets a canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/politica-cookie-uri');
  });

  it('renders the page heading and states no tracking cookies are used', () => {
    render(<PoliticaCookieUriPage />);
    expect(screen.getByRole('heading', { name: 'Politica de cookie-uri' })).toBeInTheDocument();
    expect(screen.getByText(/nu folosește cookie-uri de urmărire/)).toBeInTheDocument();
  });
});
