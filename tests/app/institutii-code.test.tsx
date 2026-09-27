import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import InstitutionGuidePage from '@/app/institutii/[code]/page';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

const anaf: Institution = {
  id: '1',
  code: 'ANAF',
  name: 'Agenția Națională de Administrare Fiscală',
  description: null,
  category: 'fiscal',
  website_url: 'https://www.anaf.ro',
  contact_form_url: null,
  phone: '031 403 91 60',
  email: null,
  address: 'Str. Apolodor nr. 17, București',
  associated_court: null,
  iban: 'RO49AAAA1B31007593840001',
  cod_venit: '20.01.01.01',
  cui: '22222222',
  wait_time_minutes: 25,
};

describe('InstitutionGuidePage', () => {
  it('renders the institution guide with the legal deadline, steps, and documents', async () => {
    vi.mocked(findInstitution).mockResolvedValue(anaf);

    render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'anaf' }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole('heading', { name: anaf.name })).toBeInTheDocument();
    expect(screen.getByText(/Ai la dispoziție 15 zile calendaristice/)).toBeInTheDocument();
    expect(screen.getByText(/Achită taxa de timbru de 20,00 LEI către IBAN/)).toBeInTheDocument();
    expect(screen.getByText('Copie act de identitate')).toBeInTheDocument();
  });

  it('falls back to a generic payment step when IBAN/cod venit/CUI are unknown', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      ...anaf,
      iban: null,
      cod_venit: null,
      cui: null,
      associated_court: 'Judecătoria Sectorului 1 București',
    });

    render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'anaf' }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByText(/detaliile de plată se obțin de la instituție/)).toBeInTheDocument();
  });

  it('calls notFound when the institution does not exist', async () => {
    vi.mocked(findInstitution).mockResolvedValue(null);

    await expect(
      InstitutionGuidePage({
        params: Promise.resolve({ code: 'necunoscut' }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('shows a single contact fallback instead of three unavailable paths when no channel exists', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      id: '3',
      code: 'PRIMARIE',
      name: 'Primăria (generică, locală)',
      description: 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.',
      category: 'administratie_locala',
      website_url: null,
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
      associated_court: 'Judecătoria de sector/localitate',
      iban: 'RO49AAAA1B31007593840002',
      cod_venit: '21.02.05.02',
      cui: '33333333',
      wait_time_minutes: 40,
    });

    render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'primarie' }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByText('Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.')).toBeInTheDocument();
    expect(screen.queryByText('Depunerea online nu este disponibilă pentru această instituție.')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Date de contact' })).not.toBeInTheDocument();
  });

  it('shows the shorter complaint variant for a non-contestable regulatory institution', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      id: '5',
      code: 'ANRE',
      name: 'Autoritatea Națională de Reglementare în Domeniul Energiei',
      description: 'Reglementează piața de energie electrică și gaze naturale.',
      category: 'energie',
      website_url: 'https://www.anre.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
      associated_court: null,
      iban: null,
      cod_venit: null,
      cui: null,
      wait_time_minutes: 10,
    });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anre' }), searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole('heading', { name: 'Termen legal' })).not.toBeInTheDocument();
    expect(screen.getByText(/Completează o sesizare sau cerere/)).toBeInTheDocument();
    expect(screen.getByText('Orice document care susține sesizarea (facturi, corespondență, fotografii etc.)')).toBeInTheDocument();
  });
});
