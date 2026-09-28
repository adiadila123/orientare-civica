import { describe, expect, it, beforeEach } from 'vitest';
import { getCaseStatus, markCaseSent, markCaseResponseReceived } from '@/lib/caseStatusStorage';

beforeEach(() => {
  localStorage.clear();
});

describe('caseStatusStorage', () => {
  it('starts untracked when nothing has been saved', () => {
    expect(getCaseStatus('1')).toEqual({ sentAt: null, responseReceivedAt: null });
  });

  it('records a sent timestamp and persists it across reads', () => {
    const now = new Date('2026-09-28T10:00:00.000Z');
    markCaseSent('1', now);

    expect(getCaseStatus('1')).toEqual({ sentAt: now.toISOString(), responseReceivedAt: null });
  });

  it('records a response-received timestamp without clearing the sent timestamp', () => {
    const sentAt = new Date('2026-09-28T10:00:00.000Z');
    const responseAt = new Date('2026-10-05T09:00:00.000Z');
    markCaseSent('1', sentAt);
    markCaseResponseReceived('1', responseAt);

    expect(getCaseStatus('1')).toEqual({
      sentAt: sentAt.toISOString(),
      responseReceivedAt: responseAt.toISOString(),
    });
  });

  it('tracks different case ids independently', () => {
    markCaseSent('1', new Date('2026-09-28T10:00:00.000Z'));

    expect(getCaseStatus('2')).toEqual({ sentAt: null, responseReceivedAt: null });
  });

  it('ignores a corrupted localStorage value instead of throwing', () => {
    localStorage.setItem('unde-merg:case-status:1', 'not-json');

    expect(() => getCaseStatus('1')).not.toThrow();
    expect(getCaseStatus('1')).toEqual({ sentAt: null, responseReceivedAt: null });
  });
});
