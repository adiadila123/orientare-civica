export interface CaseLocalStatus {
  sentAt: string | null;
  responseReceivedAt: string | null;
}

const EMPTY_STATUS: CaseLocalStatus = { sentAt: null, responseReceivedAt: null };

function storageKey(caseId: string): string {
  return `unde-merg:case-status:${caseId}`;
}

export function getCaseStatus(caseId: string): CaseLocalStatus {
  try {
    const raw = localStorage.getItem(storageKey(caseId));
    if (!raw) {
      return EMPTY_STATUS;
    }
    const parsed = JSON.parse(raw) as Partial<CaseLocalStatus>;
    return {
      sentAt: typeof parsed.sentAt === 'string' ? parsed.sentAt : null,
      responseReceivedAt: typeof parsed.responseReceivedAt === 'string' ? parsed.responseReceivedAt : null,
    };
  } catch {
    // Private window, blocked storage, or malformed JSON — treat as untracked.
    return EMPTY_STATUS;
  }
}

function writeCaseStatus(caseId: string, status: CaseLocalStatus): CaseLocalStatus {
  try {
    localStorage.setItem(storageKey(caseId), JSON.stringify(status));
  } catch {
    // Storage unavailable — the toggle still reflects the new state for this render.
  }
  return status;
}

export function markCaseSent(caseId: string, now: Date = new Date()): CaseLocalStatus {
  const current = getCaseStatus(caseId);
  return writeCaseStatus(caseId, { ...current, sentAt: now.toISOString() });
}

export function markCaseResponseReceived(caseId: string, now: Date = new Date()): CaseLocalStatus {
  const current = getCaseStatus(caseId);
  return writeCaseStatus(caseId, { ...current, responseReceivedAt: now.toISOString() });
}
