import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Footer } from '@/components/Footer';

describe('Footer', () => {
  it('renders the emergency number and legal disclaimer', () => {
    render(<Footer />);
    expect(screen.getByText(/112/)).toBeInTheDocument();
    expect(screen.getByText(/fără valoare de consultanță juridică/)).toBeInTheDocument();
  });

  it('renders navigation links to every page', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Acasă' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituții' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Întrebări frecvente' })).toBeInTheDocument();
  });

  it('renders links to the legal pages', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: 'Termeni și condiții' })).toHaveAttribute(
      'href',
      '/termeni-si-conditii'
    );
    expect(screen.getByRole('link', { name: 'Confidențialitate' })).toHaveAttribute(
      'href',
      '/confidentialitate'
    );
    expect(screen.getByRole('link', { name: 'Cookie-uri' })).toHaveAttribute(
      'href',
      '/politica-cookie-uri'
    );
  });
});
