import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/infoRequests', () => ({
  findInfoRequest: vi.fn(),
}));

vi.mock('@/lib/institutions', () => ({
  findInstitution: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
}));

vi.mock('@/lib/myRecordsStorage', () => ({
  rememberRecord: vi.fn(),
}));

import InfoRequestPage from '@/app/solicitare-informatii/[id]/page';
import { findInfoRequest } from '@/lib/infoRequests';
import { findInstitution } from '@/lib/institutions';
import { rememberRecord } from '@/lib/myRecordsStorage';
import type { InfoRequest, Institution } from '@/lib/types';

const infoRequest: InfoRequest = {
  id: '1',
  request_number: 'IP-2026-0001',
  institution_code: 'PRIMARIE',
  requester_name: null,
  requester_address: null,
  requester_email: null,
  requester_phone: null,
  information_requested: 'Câte sesizări au fost înregistrate în 2026?',
  revision: 1,
  created_at: '2026-09-28T10:00:00.000Z',
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
};

describe('InfoRequestPage', () => {
  it('renders the request number and document preview', async () => {
    vi.mocked(findInfoRequest).mockResolvedValue(infoRequest);
    vi.mocked(findInstitution).mockResolvedValue(institution);

    render(await InfoRequestPage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) }));

    expect(screen.getByText(/IP-2026-0001/)).toBeInTheDocument();
    expect(screen.getByText('CERERE DE ACCES LA INFORMAȚII DE INTERES PUBLIC')).toBeInTheDocument();
  });

  it('backfills "Dosarele mele" on mount, so a bookmarked/pre-existing request gets remembered', async () => {
    vi.mocked(findInfoRequest).mockResolvedValue(infoRequest);
    vi.mocked(findInstitution).mockResolvedValue(institution);

    render(await InfoRequestPage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) }));

    expect(rememberRecord).toHaveBeenCalledWith({
      id: infoRequest.id,
      type: 'info-request',
      number: infoRequest.request_number,
      institutionName: institution.name,
      createdAt: infoRequest.created_at,
    });
  });

  it('calls notFound when the request does not exist', async () => {
    vi.mocked(findInfoRequest).mockResolvedValue(null);

    await expect(
      InfoRequestPage({ params: Promise.resolve({ id: 'missing' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('calls notFound when the request has no resolvable institution', async () => {
    vi.mocked(findInfoRequest).mockResolvedValue(infoRequest);
    vi.mocked(findInstitution).mockResolvedValue(null);

    await expect(
      InfoRequestPage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('opens the edit form, saves, and shows a success toast with the updated document', async () => {
    const user = userEvent.setup();
    vi.mocked(findInfoRequest).mockResolvedValue(infoRequest);
    vi.mocked(findInstitution).mockResolvedValue(institution);
    const updated = { ...infoRequest, requester_name: 'Ion Popescu', revision: 2 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) }));

    render(await InfoRequestPage({ params: Promise.resolve({ id: '1' }), searchParams: Promise.resolve({}) }));

    await user.click(screen.getByRole('button', { name: 'Editează' }));
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByRole('status')).toHaveTextContent('Datele au fost salvate cu succes.');
    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
  });
});
