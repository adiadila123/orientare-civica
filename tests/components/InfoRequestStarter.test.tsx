import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InfoRequestStarter } from '@/components/InfoRequestStarter';
import { rememberRecord } from '@/lib/myRecordsStorage';

const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock('@/lib/myRecordsStorage', () => ({
  rememberRecord: vi.fn(),
}));

describe('InfoRequestStarter', () => {
  it('shows an inline error and does not call the API when the textarea is empty', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn());

    render(<InfoRequestStarter institutionCode="PRIMARIE" institutionName="Primăria (generică, locală)" />);
    await user.click(screen.getByRole('button', { name: 'Generează cererea' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Descrie ce informație');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('creates the request, remembers it locally, and navigates to its page on success', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            id: '42',
            request_number: 'IP-2026-0001',
            created_at: '2026-09-28T10:00:00.000Z',
          }),
      })
    );

    render(<InfoRequestStarter institutionCode="PRIMARIE" institutionName="Primăria (generică, locală)" />);
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
    expect(rememberRecord).toHaveBeenCalledWith({
      id: '42',
      type: 'info-request',
      number: 'IP-2026-0001',
      institutionName: 'Primăria (generică, locală)',
      createdAt: '2026-09-28T10:00:00.000Z',
    });
    expect(pushMock).toHaveBeenCalledWith('/solicitare-informatii/42');
  });

  it('shows an error message when the request fails', async () => {
    const user = userEvent.setup();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    render(<InfoRequestStarter institutionCode="PRIMARIE" institutionName="Primăria (generică, locală)" />);
    await user.type(screen.getByLabelText('Ce informație vrei să afli'), 'Ceva');
    await user.click(screen.getByRole('button', { name: 'Generează cererea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am putut genera cererea');
  });
});
