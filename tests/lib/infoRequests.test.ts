import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { createInfoRequest, findInfoRequest, updateInfoRequest } from '@/lib/infoRequests';
import type { InfoRequest } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
}

const sampleInfoRequest: InfoRequest = {
  id: '1',
  request_number: 'IP-2026-0001',
  institution_code: 'PRIMARIE',
  requester_name: null,
  requester_address: null,
  requester_email: null,
  requester_phone: null,
  information_requested: 'Câte sesizări privind câini fără stăpân au fost înregistrate în 2026?',
  revision: 1,
  created_at: '2026-09-28T10:00:00.000Z',
  updated_at: '2026-09-28T10:00:00.000Z',
};

describe('createInfoRequest', () => {
  it('inserts and returns the new request', async () => {
    const rawRow = {
      ...sampleInfoRequest,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);
    const result = await createInfoRequest(sql, {
      institutionCode: 'PRIMARIE',
      informationRequested: sampleInfoRequest.information_requested,
    });
    expect(result).toEqual(sampleInfoRequest);
    expect(sql).toHaveBeenCalledTimes(1);
  });
});

describe('findInfoRequest', () => {
  it('returns the matched request', async () => {
    const rawRow = {
      ...sampleInfoRequest,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([rawRow]);
    expect(await findInfoRequest(sql, '1')).toEqual(sampleInfoRequest);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findInfoRequest(sql, 'missing')).toBeNull();
  });

  it('returns null when the row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleInfoRequest, revision: 'not-a-number' }]);
    expect(await findInfoRequest(sql, '1')).toBeNull();
  });
});

describe('updateInfoRequest', () => {
  it('updates requester fields and increments the revision', async () => {
    const updatedRow = {
      ...sampleInfoRequest,
      requester_name: 'Ion Popescu',
      revision: 2,
      created_at: new Date('2026-09-28T10:00:00.000Z'),
      updated_at: new Date('2026-09-28T10:00:00.000Z'),
    };
    const sql = createFakeSql([updatedRow]);
    const result = await updateInfoRequest(sql, '1', {
      requesterName: 'Ion Popescu',
      requesterAddress: 'Str. Exemplu nr. 1',
      requesterEmail: null,
      requesterPhone: null,
      informationRequested: sampleInfoRequest.information_requested,
    });
    expect(result?.requester_name).toBe('Ion Popescu');
    expect(result?.revision).toBe(2);
  });

  it('returns null when the request does not exist', async () => {
    const sql = createFakeSql([]);
    const result = await updateInfoRequest(sql, 'missing', {
      requesterName: 'x',
      requesterAddress: null,
      requesterEmail: null,
      requesterPhone: null,
      informationRequested: 'x',
    });
    expect(result).toBeNull();
  });

  it('returns null when the updated row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleInfoRequest, revision: 'not-a-number' }]);
    const result = await updateInfoRequest(sql, '1', {
      requesterName: 'x',
      requesterAddress: null,
      requesterEmail: null,
      requesterPhone: null,
      informationRequested: 'x',
    });
    expect(result).toBeNull();
  });
});
