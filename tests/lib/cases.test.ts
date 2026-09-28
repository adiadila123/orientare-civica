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
    const sql = createFakeSql([sampleCase]);
    const result = await createCase(sql, {
      userDescription: 'Am primit o amendă.',
      aiAnalysis: null,
      institutionCode: 'PRIMARIE',
    });
    expect(result).toEqual(sampleCase);
    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe('findCase', () => {
  it('returns the matched case', async () => {
    const sql = createFakeSql([sampleCase]);
    expect(await findCase(sql, '1')).toEqual(sampleCase);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findCase(sql, 'missing')).toBeNull();
  });
});

describe('updateCase', () => {
  it('updates petitioner/PV fields and increments the revision', async () => {
    const updated = { ...sampleCase, petitioner_name: 'Ion Popescu', revision: 2 };
    const sql = createFakeSql([updated]);
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
});
