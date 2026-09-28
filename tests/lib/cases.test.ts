import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createCase, findCase, updateCase } from '@/lib/cases';
import type { Case } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
}

const sampleCase: Case = {
  id: '1',
  case_number: 'GD-2026-0001',
  user_description: 'Am primit o amendă.',
  ai_analysis: null,
  recommended_institution_id: null,
  institution_code: 'PRIMARIE',
  status: 'new',
  session_id: null,
  created_at: '2026-09-28T10:00:00.000Z',
  petitioner_name: null,
  petitioner_cnp: null,
  petitioner_address: null,
  petitioner_email: null,
  petitioner_phone: null,
  pv_series: null,
  pv_number: null,
  pv_issue_date: null,
  pv_amount: null,
  pv_penalty_points: null,
  pv_issuing_agent: null,
  grounds: null,
  annexes: [],
  revision: 1,
  updated_at: '2026-09-28T10:00:00.000Z',
};

describe('createCase', () => {
  it('inserts and returns the new case', async () => {
    const rawRow = {
      ...sampleCase,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);
    const result = await createCase(sql, {
      userDescription: 'Am primit o amendă.',
      aiAnalysis: null,
      institutionCode: 'PRIMARIE',
      grounds: null,
    });
    expect(result).toEqual(sampleCase);
    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe('findCase', () => {
  it('returns the matched case', async () => {
    const rawRow = {
      ...sampleCase,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);
    expect(await findCase(sql, '1')).toEqual(sampleCase);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findCase(sql, 'missing')).toBeNull();
  });

  it('returns null when the row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleCase, revision: 'not-a-number' }]);
    expect(await findCase(sql, '1')).toBeNull();
  });

  it('converts a pv_issue_date Date object to a plain YYYY-MM-DD string, not a full ISO datetime', async () => {
    const rawRow = {
      ...sampleCase,
      pv_issue_date: new Date('2026-09-01T00:00:00.000Z'),
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);
    const result = await findCase(sql, '1');
    expect(result?.pv_issue_date).toBe('2026-09-01');
  });
});

describe('updateCase', () => {
  it('updates petitioner/PV fields and increments the revision', async () => {
    const updatedRow = {
      ...sampleCase,
      petitioner_name: 'Ion Popescu',
      revision: 2,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([updatedRow]);
    const result = await updateCase(sql, '1', {
      petitionerName: 'Ion Popescu',
      petitionerCnp: '1900010140017',
      petitionerAddress: 'Str. Exemplu nr. 1',
      petitionerEmail: null,
      petitionerPhone: null,
      pvSeries: 'ABC',
      pvNumber: '123',
      pvIssueDate: '2026-09-01',
      pvAmount: 500,
      pvPenaltyPoints: null,
      pvIssuingAgent: null,
      grounds: 'Nu am fost prezent la fața locului.',
      annexes: [],
    });
    expect(result?.petitioner_name).toBe('Ion Popescu');
    expect(result?.revision).toBe(2);
  });

  it('returns null when the case does not exist', async () => {
    const sql = createFakeSql([]);
    const result = await updateCase(sql, 'missing', {
      petitionerName: 'x',
      petitionerCnp: '1900010140017',
      petitionerAddress: 'x',
      petitionerEmail: null,
      petitionerPhone: null,
      pvSeries: 'x',
      pvNumber: 'x',
      pvIssueDate: '2026-09-01',
      pvAmount: 100,
      pvPenaltyPoints: null,
      pvIssuingAgent: null,
      grounds: 'x',
      annexes: [],
    });
    expect(result).toBeNull();
  });

  it('returns null when the updated row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleCase, revision: 'not-a-number' }]);
    const result = await updateCase(sql, '1', {
      petitionerName: 'x',
      petitionerCnp: '1900010140017',
      petitionerAddress: 'x',
      petitionerEmail: null,
      petitionerPhone: null,
      pvSeries: 'x',
      pvNumber: 'x',
      pvIssueDate: '2026-09-01',
      pvAmount: 100,
      pvPenaltyPoints: null,
      pvIssuingAgent: null,
      grounds: 'x',
      annexes: [],
    });
    expect(result).toBeNull();
  });
});
