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
  useRouter: () => ({ push: vi.fn() }),
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
  iban: null,
  cod_venit: null,
  cui: null,
  wait_time_minutes: 25,
};

const politieLocala: Institution = {
  id: '4',
  code: 'POLITIE_LOCALA',
  name: 'Poliția Locală',
  description: 'Sesizări stradale și contravenții locale; site-ul variază în funcție de localitate.',
  category: 'ordine_publica',
  website_url: null,
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
  associated_court: 'Judecătoria de sector/localitate',
  iban: null,
  cod_venit: null,
  cui: null,
  wait_time_minutes: 20,
};

describe('InstitutionGuidePage', () => {
  it('renders the institution guide with the legal deadline, steps, and documents', async () => {
    vi.mocked(findInstitution).mockResolvedValue(politieLocala);

    render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'politie_locala' }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.getByRole('heading', { name: politieLocala.name })).toBeInTheDocument();
    expect(screen.getByText(/Ai la dispoziție 15 zile calendaristice/)).toBeInTheDocument();
    expect(screen.getByText(/Achită taxa de timbru de 20,00 LEI la trezoreria\/primăria/)).toBeInTheDocument();
    expect(screen.getByText(/Depune cererea și dovada plății la Judecătoria de sector\/localitate/)).toBeInTheDocument();
    expect(screen.getByText('Copie act de identitate')).toBeInTheDocument();
  });

  it('shows the shorter complaint variant for ANAF now that fine payments route through local UAT treasuries, not ANAF', async () => {
    vi.mocked(findInstitution).mockResolvedValue(anaf);

    render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'anaf' }),
        searchParams: Promise.resolve({}),
      })
    );

    expect(screen.queryByRole('heading', { name: 'Termen legal' })).not.toBeInTheDocument();
    expect(screen.getByText(/Completează o sesizare sau cerere/)).toBeInTheDocument();
  });

  it('embeds GovernmentOrganization JSON-LD built only from real institution fields', async () => {
    vi.mocked(findInstitution).mockResolvedValue(anaf);

    const { container } = render(
      await InstitutionGuidePage({
        params: Promise.resolve({ code: 'anaf' }),
        searchParams: Promise.resolve({}),
      })
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const jsonLd = JSON.parse(script!.innerHTML);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'GovernmentOrganization',
      name: anaf.name,
      url: anaf.website_url,
      telephone: anaf.phone,
      address: anaf.address,
    });
    expect(jsonLd.description).toBeUndefined();
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
      iban: null,
      cod_venit: null,
      cui: null,
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

  it('shows real contact details for CNCD without inventing a contravention deadline', async () => {
    vi.mocked(findInstitution).mockResolvedValue({
      id: '6',
      code: 'CNCD',
      name: 'Consiliul Național pentru Combaterea Discriminării',
      description:
        'Soluționează sesizări privind fapte de discriminare. Termen legal de depunere: 1 an de la data săvârșirii faptei sau de la data la care persoana lezată putea lua cunoștință de aceasta.',
      category: 'discriminare',
      website_url: 'https://www.cncd.ro',
      contact_form_url: null,
      phone: '021 312 65 78',
      email: 'support@cncd.ro',
      address: 'Piața Valter Mărăcineanu nr. 1-3, Sector 1, București',
      associated_court: null,
      iban: null,
      cod_venit: null,
      cui: null,
      wait_time_minutes: null,
    });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'cncd' }), searchParams: Promise.resolve({}) }));

    expect(screen.queryByRole('heading', { name: 'Termen legal' })).not.toBeInTheDocument();
    expect(screen.getByText(/1 an de la data săvârșirii faptei/)).toBeInTheDocument();
    expect(screen.getAllByText(/021 312 65 78/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Piața Valter Mărăcineanu nr\. 1-3, Sector 1, București/).length).toBeGreaterThan(0);
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

  it('links to Ghișeul.ro and the court e-filing portal for a contestable case', async () => {
    vi.mocked(findInstitution).mockResolvedValue({ ...anaf, associated_court: 'Judecătoria Sectorului 5' });

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anaf' }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('link', { name: 'Ghișeul.ro' })).toHaveAttribute('href', 'https://www.ghiseul.ro');
    expect(screen.getByRole('link', { name: 'portalul instanțelor' })).toHaveAttribute(
      'href',
      'https://registratura.rejust.ro'
    );
  });

  it('links to the official "Fără hârtie" platform for reporting excessive bureaucracy', async () => {
    vi.mocked(findInstitution).mockResolvedValue(anaf);

    render(await InstitutionGuidePage({ params: Promise.resolve({ code: 'anaf' }), searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('link', { name: 'Fără hârtie' })).toHaveAttribute(
      'href',
      'https://fara-hartie.gov.ro'
    );
  });
});
