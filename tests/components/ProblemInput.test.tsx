import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemInput } from '@/components/ProblemInput';

describe('ProblemInput', () => {
  it('keeps the submit button disabled until text is entered', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: 'Analizează situația' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am primit o amendă');
    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with the trimmed description', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ProblemInput onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), '  Am primit o amendă  ');
    await user.click(screen.getByRole('button', { name: 'Analizează situația' }));

    expect(handleSubmit).toHaveBeenCalledWith('Am primit o amendă');
  });

  it('fills the textarea when a quick category is clicked', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Probleme cu ANAF/ }));
    expect(screen.getByLabelText('Descrierea problemei')).toHaveValue('Am o poprire pe cont de la ANAF și vreau să aflu baza legală și să depun declarația unică.');
  });

  it('disables the button and shows a loading label while isLoading is true', () => {
    render(<ProblemInput onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: 'Se analizează...' })).toBeDisabled();
  });

  it('caps the textarea at 2000 characters', () => {
    render(<ProblemInput onSubmit={vi.fn()} />);
    expect(screen.getByLabelText('Descrierea problemei')).toHaveAttribute('maxLength', '2000');
  });

  it('shows the too-short validation message under 15 characters and disables submit', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), 'am o problema');

    expect(screen.getByText('Descrierea este prea scurtă (minim 15 caractere)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizează situația' })).toBeDisabled();
  });

  it('clears the too-short message and enables submit at 15+ characters', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am primit o amendă');

    expect(
      screen.queryByText('Descrierea este prea scurtă (minim 15 caractere)')
    ).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Analizează situația' })).toBeEnabled();
  });
});
