import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoRequestStarter } from '@/components/InfoRequestStarter';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe('InfoRequestStarter', () => {
  it('shows an inline error and does not call the API when the textarea is empty', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn());

    render(<InfoRequestStarter institutionCode="PRIMARIE" />);
    await user.click(screen.getByRole('button', { name: 'Generează cererea' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Descrie ce informație');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates the request and navigates to its page on success', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: '42' }) })
    );

    render(<InfoRequestStarter institutionCode="PRIMARIE" />);
    await user.type(
      screen.getByLabelText('Ce informație vrei să afli'),
      'Câte sesizări au fost înregistrate în 2026?'
    );
    await user.click(screen.getByRole('button', { name: 'Generează cererea' }));

    expect(fetch).toHaveBeenCalledWith(
      '/api/info-requests',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          institutionCode: 'PRIMARIE',
          informationRequested: 'Câte sesizări au fost înregistrate în 2026?',
        }),
      })
    );
    expect(pushMock).toHaveBeenCalledWith('/solicitare-informatii/42');
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<InfoRequestStarter institutionCode="PRIMARIE" />);
    await user.type(screen.getByLabelText('Ce informație vrei să afli'), 'Ceva');
    await user.click(screen.getByRole('button', { name: 'Generează cererea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut genera cererea');
  });
});
