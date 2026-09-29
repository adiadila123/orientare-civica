import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GlobalError from '@/app/global-error';

describe('GlobalError', () => {
  it('shows a friendly message', () => {
    render(<GlobalError error={new Error('boom')} retry={vi.fn()} />);
    expect(screen.getByText('Ceva nu a mers bine')).toBeInTheDocument();
  });

  it('calls retry when the button is clicked', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<GlobalError error={new Error('boom')} retry={retry} />);

    await user.click(screen.getByRole('button', { name: 'Încearcă din nou' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('shows the digest as a reference code when present', () => {
    const error = Object.assign(new Error('boom'), { digest: 'xyz789' });
    render(<GlobalError error={error} retry={vi.fn()} />);
    expect(screen.getByText(/Cod de referință: xyz789/)).toBeInTheDocument();
  });
});
