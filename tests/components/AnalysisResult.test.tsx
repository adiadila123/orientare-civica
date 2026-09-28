import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnalysisResult } from '@/components/AnalysisResult';
import type { TriageResponse } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
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
    iban: 'RO49AAAA1B31007593840001',
  },
};

describe('AnalysisResult', () => {
  it('renders the explanation, documents, next steps and institution', () => {
    render(<AnalysisResult result={baseResult} />);

    expect(screen.getByText(baseResult.explanation)).toBeInTheDocument();
    expect(screen.getByText('carte de identitate')).toBeInTheDocument();
    expect(screen.getByText('Depune cererea pe portalul SPV')).toBeInTheDocument();
    expect(screen.getByText('Agenția Națională de Administrare Fiscală')).toBeInTheDocument();
  });

  it('shows a manual-review notice when confidence is low', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.4 }} />);
    expect(screen.getByText('Recomandăm verificare manuală')).toBeInTheDocument();
  });

  it('does not show the manual-review notice when confidence is high', () => {
    render(<AnalysisResult result={{ ...baseResult, confidence: 0.9 }} />);
    expect(screen.queryByText('Recomandăm verificare manuală')).not.toBeInTheDocument();
  });

  it('shows a fallback message and no InstitutionCard when institution is null', () => {
    render(<AnalysisResult result={{ ...baseResult, institution: null }} />);

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
    render(<AnalysisResult result={baseResult} />);
    expect(screen.getByText('Online')).toBeInTheDocument();
  });

  it('shows the generate-contestation button when the institution is contestable', () => {
    render(<AnalysisResult result={contestableResult} />);
    expect(screen.getByRole('button', { name: 'Generează contestația' })).toBeInTheDocument();
  });

  it('does not show the generate-contestation button when the institution is not contestable', () => {
    render(<AnalysisResult result={baseResult} />);
    expect(screen.queryByRole('button', { name: 'Generează contestația' })).not.toBeInTheDocument();
  });
});
