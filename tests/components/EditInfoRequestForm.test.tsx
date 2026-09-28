import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditInfoRequestForm } from '@/components/EditInfoRequestForm';
import type { InfoRequest } from '@/lib/types';

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

describe('EditInfoRequestForm', () => {
  it('blocks save and shows an inline error when the requested information is emptied out', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.stubGlobal('fetch', vi.fn());

    render(<EditInfoRequestForm infoRequest={infoRequest} onClose={vi.fn()} onSaved={onSaved} />);
    const textarea = screen.getByDisplayValue(infoRequest.information_requested);
    await user.clear(textarea);
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Descrie ce informație');
    expect(fetch).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves successfully and calls onSaved', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const updated = { ...infoRequest, requester_name: 'Ion Popescu', revision: 2 };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) }));

    render(<EditInfoRequestForm infoRequest={infoRequest} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByRole('button', { name: 'Salvează' })).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(updated);
  });

  it('shows the network-error backup state when the save request fails, without losing entered data', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<EditInfoRequestForm infoRequest={infoRequest} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByText(/Datele tale NU au fost pierdute/)).toBeInTheDocument();
    expect(screen.getByLabelText('Nume și prenume')).toHaveValue('Ion Popescu');
  });
});
