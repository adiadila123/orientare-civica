import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditCaseForm } from '@/components/EditCaseForm';
import type { Case } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'x',
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

describe('EditCaseForm', () => {
  it('blocks save and shows an inline error when the CNP is invalid', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    vi.stubGlobal('fetch', vi.fn());

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('CNP'), '19000101400');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(screen.getByRole('alert')).toHaveTextContent('CNP invalid');
    expect(fetch).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it('saves successfully with a valid CNP and calls onSaved', async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn();
    const updated = { ...caseRecord, petitioner_name: 'Ion Popescu', revision: 2 };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(updated) })
    );

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={onSaved} />);
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByRole('button', { name: 'Salvează' })).toBeInTheDocument();
    expect(onSaved).toHaveBeenCalledWith(updated);
  });

  it('shows the network-error backup state when the save request fails, without losing entered data', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));

    expect(await screen.findByText(/Datele tale NU au fost pierdute/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Descarcă backup' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reîncearcă' })).toBeInTheDocument();
    expect(screen.getByLabelText('CNP')).toHaveValue('1900010140017');
  });

  it('downloads a JSON backup of the entered data when the backup button is clicked', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);
    await user.type(screen.getByLabelText('Nume și prenume'), 'Ion Popescu');
    await user.type(screen.getByLabelText('CNP'), '1900010140017');
    await user.click(screen.getByRole('button', { name: 'Salvează' }));
    await screen.findByRole('button', { name: 'Descarcă backup' });

    await user.click(screen.getByRole('button', { name: 'Descarcă backup' }));

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blobArg = createObjectURLSpy.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('application/json');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
    clickSpy.mockRestore();
  });

  it('toggles CNP visibility', async () => {
    const user = userEvent.setup();
    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('CNP')).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Arată' }));
    expect(screen.getByLabelText('CNP')).toHaveAttribute('type', 'text');
  });

  it('adds and removes an annex', async () => {
    const user = userEvent.setup();
    render(<EditCaseForm caseRecord={caseRecord} onClose={vi.fn()} onSaved={vi.fn()} />);

    await user.type(screen.getByPlaceholderText('Denumire document'), 'Copie carte de identitate');
    await user.click(screen.getByRole('button', { name: 'Adaugă' }));
    expect(screen.getByText('Copie carte de identitate')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Șterge Copie carte de identitate' }));
    expect(screen.queryByText('Copie carte de identitate')).not.toBeInTheDocument();
  });
});
