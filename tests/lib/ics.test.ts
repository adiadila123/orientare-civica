import { describe, expect, it } from 'vitest';
import { buildContestationDeadlineIcs } from '@/lib/ics';

describe('buildContestationDeadlineIcs', () => {
  it('sets the deadline 15 calendar days after the PV issue date', () => {
    const ics = buildContestationDeadlineIcs({
      caseNumber: 'GD-2026-0001',
      pvIssueDate: '2026-09-01',
      now: new Date('2026-09-05T12:00:00Z'),
    });

    expect(ics).toContain('DTSTART;VALUE=DATE:20260916');
  });

  it('rolls the deadline correctly across a month boundary', () => {
    const ics = buildContestationDeadlineIcs({
      caseNumber: 'GD-2026-0002',
      pvIssueDate: '2026-09-20',
      now: new Date('2026-09-21T00:00:00Z'),
    });

    expect(ics).toContain('DTSTART;VALUE=DATE:20261005');
  });

  it('includes the case number in the event summary', () => {
    const ics = buildContestationDeadlineIcs({
      caseNumber: 'GD-2026-0001',
      pvIssueDate: '2026-09-01',
    });

    expect(ics).toContain('SUMMARY:Termen limită contestație PV GD-2026-0001');
  });

  it('cites art. 31 O.G. nr. 2/2001 without inventing a different deadline text', () => {
    const ics = buildContestationDeadlineIcs({
      caseNumber: 'GD-2026-0001',
      pvIssueDate: '2026-09-01',
    });

    expect(ics).toContain('art. 31 din O.G. nr. 2/2001');
  });

  it('produces a well-formed VCALENDAR envelope', () => {
    const ics = buildContestationDeadlineIcs({
      caseNumber: 'GD-2026-0001',
      pvIssueDate: '2026-09-01',
    });

    expect(ics).toMatch(/^BEGIN:VCALENDAR\r\n/);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('END:VEVENT');
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
  });
});
