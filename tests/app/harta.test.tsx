import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  listInstitutions: vi.fn(),
}));

vi.mock('@/components/InstitutionsMapLoader', () => ({
  InstitutionsMapLoader: ({ institutions }: { institutions: { code: string }[] }) => (
    <div data-testid="map-loader">{institutions.map((i) => i.code).join(',')}</div>
  ),
}));

import HartaPage, { metadata } from '@/app/harta/page';
import { listInstitutions } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

function makeInstitution(overrides: Partial<Institution>): Institution {
  return {
    id: '1',
    code: 'ANAF',
    name: 'ANAF',
    description: null,
    category: 'fiscal',
    website_url: null,
    contact_form_url: null,
    phone: null,
    email: null,
    address: null,
    ...overrides,
  };
}

describe('HartaPage', () => {
  it('sets a canonical URL', () => {
    expect(metadata.alternates?.canonical).toBe('/harta');
  });

  it('only passes institutions that have real coordinates to the map', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([
      makeInstitution({ code: 'ANAF', latitude: 44.42, longitude: 26.09 }),
      makeInstitution({ code: 'PRIMARIE', latitude: null, longitude: null }),
      makeInstitution({ code: 'ANPC', latitude: 44.46, longitude: 26.08 }),
    ]);

    render(await HartaPage());

    expect(screen.getByTestId('map-loader')).toHaveTextContent('ANAF,ANPC');
  });

  it('shows a fallback message when no institution has coordinates', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([
      makeInstitution({ code: 'PRIMARIE', latitude: null, longitude: null }),
    ]);

    render(await HartaPage());

    expect(screen.getByText('Harta nu este disponibilă momentan.')).toBeInTheDocument();
    expect(screen.queryByTestId('map-loader')).not.toBeInTheDocument();
  });

  it('explains why Primăria and Poliția Locală are excluded from the map', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([]);

    render(await HartaPage());

    expect(screen.getByText(/Primăria și Poliția Locală nu au un sediu unic/)).toBeInTheDocument();
  });
});
