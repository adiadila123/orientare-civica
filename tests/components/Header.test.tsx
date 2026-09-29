import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Header } from '@/components/Header';

describe('Header', () => {
  it('renders the wordmark and primary nav links', () => {
    render(<Header />);
    expect(screen.getByText('Unde merg?')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Acasă' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Instituții' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dosarele mele' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Întrebări frecvente' })).toBeInTheDocument();
  });

  it('starts with the mobile menu closed', () => {
    render(<Header />);
    expect(screen.getByRole('button', { name: 'Deschide meniul' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('opens the mobile menu on toggle and closes it again on a second click', async () => {
    const user = userEvent.setup();
    render(<Header />);

    const toggle = screen.getByRole('button', { name: 'Deschide meniul' });
    await user.click(toggle);
    expect(screen.getByRole('button', { name: 'Închide meniul' })).toHaveAttribute(
      'aria-expanded',
      'true'
    );

    await user.click(screen.getByRole('button', { name: 'Închide meniul' }));
    expect(screen.getByRole('button', { name: 'Deschide meniul' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the mobile menu after a nav link is clicked', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Deschide meniul' }));
    await user.click(screen.getByRole('link', { name: 'Hartă' }));

    expect(screen.getByRole('button', { name: 'Deschide meniul' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });

  it('closes the mobile menu when the Escape key is pressed', async () => {
    const user = userEvent.setup();
    render(<Header />);

    await user.click(screen.getByRole('button', { name: 'Deschide meniul' }));
    await user.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Deschide meniul' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});
