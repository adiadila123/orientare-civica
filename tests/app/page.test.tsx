import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';

const sampleResponse = {
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
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

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
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut analiza problema');
  });
});
