import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';
import type { Case, Institution } from '@/lib/types';

const caseRecord: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  case_group_id: 'group-1',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: 'Ion Popescu',
  petitioner_cnp: '1900010140017',
  petitioner_address: 'Str. Exemplu nr. 1, București',
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: 'ABC',
  pv_number: '123',
  pv_issue_date: '2026-09-01',
  pv_amount: 500,
  pv_penalty_points: null,
  pv_issuing_agent: 'Poliția Locală Sector 1',
  grounds: 'Nu am fost prezent la fața locului în momentul constatării.',
  annexes: ['Copie carte de identitate'],
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

describe('LegalDocumentPreview', () => {
  it('renders the petitioner, PV details, grounds, and annexes', () => {
    render(<LegalDocumentPreview caseRecord={caseRecord} institution={institution} />);

    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    expect(screen.getByText(/1900010140017/)).toBeInTheDocument();
    expect(screen.getByText(/seria ABC nr\. 123/)).toBeInTheDocument();
    expect(screen.getByText(/500 LEI/)).toBeInTheDocument();
    expect(screen.getByText('Nu am fost prezent la fața locului în momentul constatării.')).toBeInTheDocument();
    expect(screen.getByText('Copie carte de identitate')).toBeInTheDocument();
  });

  it('renders placeholder text for unfilled petitioner/PV fields', () => {
    render(
      <LegalDocumentPreview
        caseRecord={{ ...caseRecord, petitioner_name: null, petitioner_cnp: null }}
        institution={institution}
      />
    );
    expect(screen.getByText(/\[Nume Prenume\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[CNP\]/)).toBeInTheDocument();
  });
});
