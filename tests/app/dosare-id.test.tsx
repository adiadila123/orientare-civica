import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  findCase: vi.fn(),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

import CasePage from '@/app/dosare/[id]/page';
import { findCase } from '@/lib/cases';
import { findInstitution } from '@/lib/institutions';
import type { Case, Institution } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: null,
  petitioner_cnp: null,
  petitioner_address: null,
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: null,
  pv_number: null,
  pv_issue_date: null,
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

const institution: Institution = {
  id: '1',
  code: 'PRIMARIE',
  name: 'Primăria (generică, locală)',
  description: null,
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
};

describe('CasePage', () => {
  it('renders the case number and document preview', async () => {
    vi.mocked(findCase).mockResolvedValue(caseRecord);
    vi.mocked(findInstitution).mockResolvedValue(institution);

    render(
      await CasePage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) })
    );

    expect(screen.getByText(/GD-2026-0001/)).toBeInTheDocument();
    expect(screen.getByText('PLÂNGERE CONTRAVENȚIONALĂ')).toBeInTheDocument();
  });

  it('calls notFound when the case does not exist', async () => {
    vi.mocked(findCase).mockResolvedValue(null);

    await expect(
      CasePage({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound when the case has no resolvable institution', async () => {
    vi.mocked(findCase).mockResolvedValue(caseRecord);
    vi.mocked(findInstitution).mockResolvedValue(null);

    await expect(
      CasePage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
