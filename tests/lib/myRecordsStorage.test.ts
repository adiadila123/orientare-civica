import { describe, expect, it, beforeEach } from 'vitest';
import { listMyRecords, rememberRecord, forgetRecord, type MyRecord } from '@/lib/myRecordsStorage';

const sample: MyRecord = {
  id: '1',
  type: 'case',
  number: 'GD-2026-0001',
  institutionName: 'Primăria (generică, locală)',
  createdAt: '2026-09-28T10:00:00.000Z',
};

beforeEach(() => {
  localStorage.clear();
});

describe('listMyRecords', () => {
  it('returns an empty list when nothing was saved', () => {
    expect(listMyRecords()).toEqual([]);
  });

  it('returns an empty list when the stored value is malformed JSON', () => {
    localStorage.setItem('unde-merg:my-records', 'not-json');
    expect(listMyRecords()).toEqual([]);
  });

  it('drops entries that fail validation instead of throwing', () => {
    localStorage.setItem(
      'unde-merg:my-records',
      JSON.stringify([sample, { id: '2', type: 'not-a-real-type' }])
    );
    expect(listMyRecords()).toEqual([sample]);
  });
});

describe('rememberRecord', () => {
  it('adds a new record to the front of the list', () => {
    rememberRecord(sample);
    const second: MyRecord = { ...sample, id: '2', number: 'GD-2026-0002' };
    rememberRecord(second);

    expect(listMyRecords()).toEqual([second, sample]);
  });

  it('replaces an existing record with the same id instead of duplicating it', () => {
    rememberRecord(sample);
    const updated: MyRecord = { ...sample, number: 'GD-2026-9999' };
    rememberRecord(updated);

    expect(listMyRecords()).toEqual([updated]);
  });
});

describe('forgetRecord', () => {
  it('removes only the matching record', () => {
    const other: MyRecord = { ...sample, id: '2', number: 'GD-2026-0002' };
    rememberRecord(sample);
    rememberRecord(other);

    const result = forgetRecord('1');

    expect(result).toEqual([other]);
    expect(listMyRecords()).toEqual([other]);
  });
});
