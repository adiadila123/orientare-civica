import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { InfoRequestDocumentPreview } from '@/components/InfoRequestDocumentPreview';
import type { InfoRequest, Institution } from '@/lib/types';

const infoRequest: InfoRequest = {
  id: '1',
  request_number: 'IP-2026-0001',
  institution_code: 'PRIMARIE',
  requester_name: 'Ion Popescu',
  requester_address: 'Str. Exemplu nr. 1, București',
  requester_email: 'ion@example.com',
  requester_phone: null,
  information_requested: 'Câte sesizări privind câini fără stăpân au fost înregistrate în 2026?',
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

describe('InfoRequestDocumentPreview', () => {
  it('renders the requester details, institution, and the requested information', () => {
    render(<InfoRequestDocumentPreview infoRequest={infoRequest} institution={institution} />);

    expect(screen.getByText(/Ion Popescu/)).toBeInTheDocument();
    expect(screen.getByText(/Str\. Exemplu nr\. 1, București/)).toBeInTheDocument();
    expect(screen.getByText(/ion@example.com/)).toBeInTheDocument();
    expect(screen.getByText(infoRequest.information_requested)).toBeInTheDocument();
    expect(screen.getByText(/Către: Primăria/)).toBeInTheDocument();
  });

  it('cites Legea 544/2001 art. 7 with the real 10/30-day deadlines, not an invented one', () => {
    render(<InfoRequestDocumentPreview infoRequest={infoRequest} institution={institution} />);

    expect(screen.getByText(/Legii nr\.\s*544\/2001/)).toBeInTheDocument();
    expect(screen.getByText(/art\. 7 din Legea nr\. 544\/2001/)).toBeInTheDocument();
    expect(screen.getByText(/10 zile lucrătoare/)).toBeInTheDocument();
    expect(screen.getByText(/30 de zile/)).toBeInTheDocument();
  });

  it('shows placeholder text for an unfilled requester name and address', () => {
    render(
      <InfoRequestDocumentPreview
        infoRequest={{ ...infoRequest, requester_name: null, requester_address: null }}
        institution={institution}
      />
    );

    expect(screen.getByText(/\[Nume Prenume\]/)).toBeInTheDocument();
    expect(screen.getByText(/\[Adresă\]/)).toBeInTheDocument();
  });
});
