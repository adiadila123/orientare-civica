import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseView } from '@/components/CaseView';
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
  pv_issue_date: '2026-09-01',
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

const contestableInstitution: Institution = {
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
  iban: null,
  cod_venit: null,
  cui: null,
  wait_time_minutes: 40,
};

describe('CaseView', () => {
  it('shows the deadline-reminder button for a contestable case with a PV issue date', () => {
    render(<CaseView initialCase={caseRecord} institution={contestableInstitution} />);
    expect(screen.getByRole('button', { name: 'Adaugă termenul în calendar' })).toBeInTheDocument();
  });

  it('hides the deadline-reminder button when the PV issue date is not yet filled in', () => {
    render(
      <CaseView initialCase={{ ...caseRecord, pv_issue_date: null }} institution={contestableInstitution} />
    );
    expect(screen.queryByRole('button', { name: 'Adaugă termenul în calendar' })).not.toBeInTheDocument();
  });

  it('hides the deadline-reminder button for a non-contestable institution', () => {
    render(
      <CaseView
        initialCase={caseRecord}
        institution={{ ...contestableInstitution, associated_court: null }}
      />
    );
    expect(screen.queryByRole('button', { name: 'Adaugă termenul în calendar' })).not.toBeInTheDocument();
  });

  it('downloads an .ics file when the deadline-reminder button is clicked', async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    const revokeObjectURL = vi.fn();
    global.URL.createObjectURL = createObjectURL;
    global.URL.revokeObjectURL = revokeObjectURL;

    render(<CaseView initialCase={caseRecord} institution={contestableInstitution} />);
    await user.click(screen.getByRole('button', { name: 'Adaugă termenul în calendar' }));

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
  });
});
