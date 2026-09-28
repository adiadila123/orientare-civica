import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LocationSelector } from '@/components/LocationSelector';

beforeEach(() => {
  localStorage.clear();
});

describe('LocationSelector', () => {
  it('starts with no locality selected and every județ available', () => {
    const onChange = vi.fn();
    render(<LocationSelector onChange={onChange} />);

    expect(screen.getByLabelText('Județ')).toHaveValue('');
    expect(screen.getByLabelText('Localitate')).toBeDisabled();
  });

  it('narrows the locality dropdown to the chosen județ and reports the selection', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocationSelector onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Județ'), 'Alba');
    expect(screen.getByLabelText('Localitate')).toBeEnabled();

    await user.selectOptions(screen.getByLabelText('Localitate'), 'Albac');

    expect(onChange).toHaveBeenLastCalledWith({ judet: 'Alba', localitate: 'Albac' });
  });

  it('clears the locality and reports null when the județ is reset', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LocationSelector onChange={onChange} />);

    await user.selectOptions(screen.getByLabelText('Județ'), 'Alba');
    await user.selectOptions(screen.getByLabelText('Localitate'), 'Albac');
    await user.selectOptions(screen.getByLabelText('Județ'), '');

    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.getByLabelText('Localitate')).toBeDisabled();
  });

  it('persists the selection to localStorage and restores it on the next mount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<LocationSelector onChange={vi.fn()} />);

    await user.selectOptions(screen.getByLabelText('Județ'), 'Alba');
    await user.selectOptions(screen.getByLabelText('Localitate'), 'Albac');
    unmount();

    const onChangeAfterRemount = vi.fn();
    render(<LocationSelector onChange={onChangeAfterRemount} />);

    expect(await screen.findByLabelText('Județ')).toHaveValue('Alba');
    expect(screen.getByLabelText('Localitate')).toHaveValue('Albac');
  });

  it('ignores a corrupted localStorage value instead of crashing', () => {
    localStorage.setItem('unde-merg:locality', 'not-json');
    const onChange = vi.fn();

    expect(() => render(<LocationSelector onChange={onChange} />)).not.toThrow();
    expect(screen.getByLabelText('Județ')).toHaveValue('');
  });
});
