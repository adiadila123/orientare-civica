import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaseStatusTracker } from '@/components/CaseStatusTracker';

beforeEach(() => {
  localStorage.clear();
});

describe('CaseStatusTracker', () => {
  it('starts with both checkboxes unchecked', () => {
    render(<CaseStatusTracker caseId="1" />);

    expect(screen.getByRole('checkbox', { name: /Am trimis contestația/ })).not.toBeChecked();
    expect(screen.getByRole('checkbox', { name: /Am primit răspuns/ })).not.toBeChecked();
  });

  it('checks and locks the sent checkbox once clicked, and shows a timestamp', async () => {
    const user = userEvent.setup();
    render(<CaseStatusTracker caseId="1" />);

    const sentCheckbox = screen.getByRole('checkbox', { name: /Am trimis contestația/ });
    await user.click(sentCheckbox);

    expect(sentCheckbox).toBeChecked();
    expect(sentCheckbox).toBeDisabled();
  });

  it('restores a previously saved status on mount', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CaseStatusTracker caseId="1" />);
    await user.click(screen.getByRole('checkbox', { name: /Am trimis contestația/ }));
    unmount();

    render(<CaseStatusTracker caseId="1" />);
    expect(await screen.findByRole('checkbox', { name: /Am trimis contestația/ })).toBeChecked();
  });

  it('keeps status for different cases independent', async () => {
    const user = userEvent.setup();
    const { unmount } = render(<CaseStatusTracker caseId="1" />);
    await user.click(screen.getByRole('checkbox', { name: /Am trimis contestația/ }));
    unmount();

    render(<CaseStatusTracker caseId="2" />);
    expect(screen.getByRole('checkbox', { name: /Am trimis contestația/ })).not.toBeChecked();
  });
});
