export type MyRecordType = 'case' | 'info-request';

export interface MyRecord {
  id: string;
  type: MyRecordType;
  number: string;
  institutionName: string;
  createdAt: string;
}

const STORAGE_KEY = 'unde-merg:my-records';

function isValidRecord(value: unknown): value is MyRecord {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    (record.type === 'case' || record.type === 'info-request') &&
    typeof record.number === 'string' &&
    typeof record.institutionName === 'string' &&
    typeof record.createdAt === 'string'
  );
}

export function listMyRecords(): MyRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidRecord);
  } catch {
    // Private window, blocked storage, or malformed JSON — nothing remembered.
    return [];
  }
}

export function rememberRecord(record: MyRecord): void {
  try {
    const withoutDuplicate = listMyRecords().filter((r) => r.id !== record.id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([record, ...withoutDuplicate]));
  } catch {
    // Storage unavailable — the record still exists server-side, just won't be
    // listed on "Dosarele mele" for this browser.
  }
}

export function forgetRecord(id: string): MyRecord[] {
  const updated = listMyRecords().filter((r) => r.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Storage unavailable — nothing persisted, but this render already reflects the removal.
  }
  return updated;
}
