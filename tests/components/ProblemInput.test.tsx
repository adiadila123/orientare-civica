import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProblemInput } from '@/components/ProblemInput';

describe('ProblemInput', () => {
  it('keeps the submit button disabled until text is entered', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    const submitButton = screen.getByRole('button', { name: 'Analizează' });
    expect(submitButton).toBeDisabled();

    await user.type(screen.getByLabelText('Descrierea problemei'), 'Am primit o amendă');
    expect(submitButton).toBeEnabled();
  });

  it('calls onSubmit with the trimmed description', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<ProblemInput onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText('Descrierea problemei'), '  Am o amendă  ');
    await user.click(screen.getByRole('button', { name: 'Analizează' }));

    expect(handleSubmit).toHaveBeenCalledWith('Am o amendă');
  });

  it('fills the textarea when a quick category is clicked', async () => {
    const user = userEvent.setup();
    render(<ProblemInput onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Problemă ANAF' }));
    expect(screen.getByLabelText('Descrierea problemei')).toHaveValue('Problemă ANAF');
  });

  it('disables the button and shows a loading label while isLoading is true', () => {
    render(<ProblemInput onSubmit={vi.fn()} isLoading />);
    expect(screen.getByRole('button', { name: 'Se analizează...' })).toBeDisabled();
  });
});
