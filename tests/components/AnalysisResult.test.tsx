import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AnalysisResult } from '@/components/AnalysisResult';
import { rememberRecord } from '@/lib/myRecordsStorage';
import type { TriageResponse } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/lib/myRecordsStorage', () => ({
  rememberRecord: vi.fn(),
}));

const baseResult: TriageResponse = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: ['carte de identitate'],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
  confidence: 0.9,
  institution: {
    id: '1',
    code: 'ANAF',
    name: 'Agenția Națională de Administrare Fiscală',
    description: null,
    category: 'fiscal',
    website_url: 'https://www.anaf.ro',
    contact_form_url: null,
    phone: null,
    email: null,
    address: null,
  },
};

const contestableResult: TriageResponse = {
  ...baseResult,
  institution: {
    ...baseResult.institution!,
    associated_court: 'Judecătoria de sector/localitate',
  },
};

describe('AnalysisResult', () => {
  it('renders the explanation, documents, next steps and institution', () => {
    render(<AnalysisResult result={baseResult} description="Am primit o amendă." />);

    expect(screen.getByText(baseResult.explanation)).toBeInTheDocument();
    expect(screen.getByText('carte de identitate')).toBeInTheDocument();
    expect(screen.getByText('Depune cererea pe portalul SPV')).toBeInTheDocument();
    expect(screen.getByText('Agenția Națională de Administrare Fiscală')).toBeInTheDocument();
  });

  it('shows a manual-review notice when confidence is low', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.4 }} description="x" />);
    expect(screen.getByText('Recomandăm verificare manuală')).toBeInTheDocument();
  });

  it('does not show the manual-review notice when confidence is high', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.9 }} description="x" />);
    expect(screen.queryByText('Recomandăm verificare manuală')).not.toBeInTheDocument();
  });

  it('shows a fallback message and no InstitutionCard when institution is null', () => {
    render(<AnalysisResult result={{ ...baseResult, institution: null }} description="x" />);

    expect(
      screen.getByText(
        'Nu am putut identifica exact instituția potrivită pentru această problemă. Verifică manual sau contactează primăria locală pentru îndrumare.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Agenția Națională de Administrare Fiscală')
    ).not.toBeInTheDocument();
  });

  it('shows the recommended channel as a badge', () => {
    render(<AnalysisResult result={baseResult} description="x" />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows the generate-contestation button when the institution is contestable', () => {
    render(<AnalysisResult result={contestableResult} description="x" />);
    expect(screen.getByRole('button', { name: 'Generează contestația' })).toBeInTheDocument();
  });

  it('does not show the generate-contestation button when the institution is not contestable', () => {
    render(<AnalysisResult result={baseResult} description="x" />);
    expect(screen.queryByRole('button', { name: 'Generează contestația' })).not.toBeInTheDocument();
  });

  it('sends the original user description and the AI explanation as grounds when generating a contestation', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisResult result={contestableResult} description="Am primit o amendă nedreaptă." />);
    await userEvent.click(screen.getByRole('button', { name: 'Generează contestația' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/cases',
      expect.objectContaining({
        body: JSON.stringify({
          description: 'Am primit o amendă nedreaptă.',
          grounds: contestableResult.explanation,
          institutionCode: contestableResult.institution!.code,
          aiAnalysis: contestableResult,
        }),
      })
    );

    global.fetch = originalFetch;
  });

  it('remembers the newly created case locally so it appears on "Dosarele mele"', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: '1', case_number: 'GD-2026-0001', created_at: '2026-09-28T10:00:00.000Z' }),
    });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisResult result={contestableResult} description="Am primit o amendă nedreaptă." />);
    await userEvent.click(screen.getByRole('button', { name: 'Generează contestația' }));

    expect(rememberRecord).toHaveBeenCalledWith({
      id: '1',
      type: 'case',
      number: 'GD-2026-0001',
      institutionName: contestableResult.institution!.name,
      createdAt: '2026-09-28T10:00:00.000Z',
    });

    global.fetch = originalFetch;
  });

  it('sends positive feedback immediately when the thumbs-up button is clicked', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: '1' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisResult result={baseResult} description="Am primit o amendă." />);
    await userEvent.click(screen.getByRole('button', { name: 'Recomandarea a fost utilă' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/triage-feedback',
      expect.objectContaining({
        body: JSON.stringify({
          description: 'Am primit o amendă.',
          aiAnalysis: baseResult,
          suggestedInstitutionCode: 'ANAF',
          isHelpful: true,
          correction: null,
        }),
      })
    );
    expect(await screen.findByText('Mulțumim pentru feedback!')).toBeInTheDocument();

    global.fetch = originalFetch;
  });

  it('reveals an optional correction field after thumbs-down, then submits it', async () => {
    const originalFetch = global.fetch;
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: '1' }) });
    global.fetch = fetchMock as unknown as typeof fetch;

    render(<AnalysisResult result={baseResult} description="Am primit o amendă." />);
    await userEvent.click(screen.getByRole('button', { name: 'Recomandarea nu a fost utilă' }));

    const correctionField = screen.getByLabelText('Ce instituție ar fi fost corectă?');
    await userEvent.type(correctionField, 'Ar fi trebuit ANPC');
    await userEvent.click(screen.getByRole('button', { name: 'Trimite feedback' }));

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/triage-feedback',
      expect.objectContaining({
        body: JSON.stringify({
          description: 'Am primit o amendă.',
          aiAnalysis: baseResult,
          suggestedInstitutionCode: 'ANAF',
          isHelpful: false,
          correction: 'Ar fi trebuit ANPC',
        }),
      })
    );
    expect(await screen.findByText('Mulțumim pentru feedback!')).toBeInTheDocument();

    global.fetch = originalFetch;
  });
});
