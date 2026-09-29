import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyRecordsView } from '@/components/MyRecordsView';
import { rememberRecord } from '@/lib/myRecordsStorage';
import { markCaseSent, markCaseResponseReceived } from '@/lib/caseStatusStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('MyRecordsView', () => {
  it('shows a message when nothing was generated on this device yet', () => {
    render(<MyRecordsView />);
    expect(
      screen.getByText('Nu ai încă niciun dosar sau cerere generată pe acest dispozitiv.')
    ).toBeInTheDocument();
  });

  it('lists a remembered case with a link to its page and an "În lucru" status by default', () => {
    rememberRecord({
      id: '1',
      type: 'case',
      number: 'GD-2026-0001',
      institutionName: 'Primăria (generică, locală)',
      createdAt: '2026-09-28T10:00:00.000Z',
    });

    render(<MyRecordsView />);

    expect(screen.getByRole('link', { name: 'GD-2026-0001' })).toHaveAttribute('href', '/dosare/1');
    expect(screen.getByText(/Contestație · Primăria/)).toBeInTheDocument();
    expect(screen.getByText('În lucru')).toBeInTheDocument();
  });

  it('links an info request to its own page', () => {
    rememberRecord({
      id: '2',
      type: 'info-request',
      number: 'IP-2026-0001',
      institutionName: 'ANPC',
      createdAt: '2026-09-28T10:00:00.000Z',
    });

    render(<MyRecordsView />);

    expect(screen.getByRole('link', { name: 'IP-2026-0001' })).toHaveAttribute(
      'href',
      '/solicitare-informatii/2'
    );
  });

  it('shows "Trimis" once the case is marked sent, and "Răspuns primit" once a response is logged', () => {
    rememberRecord({
      id: '1',
      type: 'case',
      number: 'GD-2026-0001',
      institutionName: 'Primăria (generică, locală)',
      createdAt: '2026-09-28T10:00:00.000Z',
    });
    markCaseSent('1', new Date('2026-09-28T11:00:00.000Z'));

    const { rerender } = render(<MyRecordsView />);
    expect(screen.getByText('Trimis')).toBeInTheDocument();

    markCaseResponseReceived('1', new Date('2026-09-29T11:00:00.000Z'));
    rerender(<MyRecordsView />);
    expect(screen.getByText('Răspuns primit')).toBeInTheDocument();
  });

  it('removes a record from the list when "Șterge din istoric" is clicked', async () => {
    const user = userEvent.setup();
    rememberRecord({
      id: '1',
      type: 'case',
      number: 'GD-2026-0001',
      institutionName: 'Primăria (generică, locală)',
      createdAt: '2026-09-28T10:00:00.000Z',
    });

    render(<MyRecordsView />);
    await user.click(screen.getByRole('button', { name: 'Șterge GD-2026-0001 din istoric' }));

    expect(screen.queryByRole('link', { name: 'GD-2026-0001' })).not.toBeInTheDocument();
    expect(
      screen.getByText('Nu ai încă niciun dosar sau cerere generată pe acest dispozitiv.')
    ).toBeInTheDocument();
  });
});
