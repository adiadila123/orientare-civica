import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';
import type { TriageResponse } from '@/lib/types';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const sampleResponse: TriageResponse = {
  primary_intent: 'problema_anaf',
  urgency: 'normal',
  institution_type: 'ANAF',
  required_documents: [],
  recommended_channel: 'online',
  next_steps: ['Depune cererea pe portalul SPV'],
  explanation: 'Trebuie să contactezi ANAF pentru această problemă.',
  confidence: 0.9,
  institution: null,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('HomePage', () => {
  it('submits the description and renders the analysis result', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(sampleResponse),
      })
    );

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează situația' }));

    expect(await screen.findByText(sampleResponse.explanation)).toBeInTheDocument();
    expect(fetch).toHaveBeenCalledWith(
      '/api/triage',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ description: 'Am o problemă cu ANAF' }),
      })
    );
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, json: () => Promise.resolve({}) }));

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează situația' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut analiza problema');
  });

  it('shows the analysis-progress stepper while loading', async () => {
    const user = userEvent.setup();
    let resolveFetch: (value: unknown) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn().mockReturnValue(new Promise((resolve) => { resolveFetch = resolve; }))
    );

    render(<HomePage />);
    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am o problemă cu ANAF');
    await user.click(screen.getByRole('button', { name: 'Analizează situația' }));

    expect(screen.getByRole('status', { name: 'Analiză în curs' })).toBeInTheDocument();

    resolveFetch({ ok: true, json: () => Promise.resolve(sampleResponse) });
  });

  it('shows the how-it-works panel before any submission', () => {
    render(<HomePage />);
    expect(screen.getByText('Cum funcționează')).toBeInTheDocument();
  });
});
