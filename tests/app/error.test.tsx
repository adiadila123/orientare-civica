import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorPage from '@/app/error';

describe('Error', () => {
  it('shows a friendly message without leaking the raw error text', () => {
    const error = Object.assign(new Error('secret stack trace detail'), { digest: undefined });
    render(<ErrorPage error={error} retry={vi.fn()} />);

    expect(screen.getByText('Ceva nu a mers bine')).toBeInTheDocument();
    expect(screen.queryByText('secret stack trace detail')).not.toBeInTheDocument();
  });

  it('shows the digest as a reference code when present', () => {
    const error = Object.assign(new Error('boom'), { digest: 'abc123' });
    render(<ErrorPage error={error} retry={vi.fn()} />);

    expect(screen.getByText(/Cod de referință: abc123/)).toBeInTheDocument();
  });

  it('calls retry when "Încearcă din nou" is clicked', async () => {
    const user = userEvent.setup();
    const retry = vi.fn();
    render(<ErrorPage error={new Error('boom')} retry={retry} />);

    await user.click(screen.getByRole('button', { name: 'Încearcă din nou' }));

    expect(retry).toHaveBeenCalledTimes(1);
  });

  it('links back to the home page', () => {
    render(<ErrorPage error={new Error('boom')} retry={vi.fn()} />);
    expect(screen.getByRole('link', { name: 'Înapoi acasă' })).toHaveAttribute('href', '/');
  });
});
