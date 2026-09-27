import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InstitutionCard } from '@/components/InstitutionCard';
import type { Institution } from '@/lib/types';

const institution: Institution = {
  id: '1',
  code: 'ANAF',
  name: 'Agenția Națională de Administrare Fiscală',
  description: 'Administrează impozitele și taxele.',
  category: 'fiscal',
  website_url: 'https://www.anaf.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('InstitutionCard', () => {
  it('renders the website link with a visible, styled affordance', () => {
    render(<InstitutionCard institution={institution} />);
    const link = screen.getByRole('link', { name: 'https://www.anaf.ro' });
    expect(link).toHaveClass('underline');
  });

  it('links to the institution guide page', () => {
    render(<InstitutionCard institution={institution} />);
    const link = screen.getByRole('link', { name: 'Vezi ghidul complet' });
    expect(link).toHaveAttribute('href', '/institutii/anaf');
  });
});
