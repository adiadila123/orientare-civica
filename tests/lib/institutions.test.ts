import { describe, expect, it, vi } from 'vitest';
import type { NeonQueryFunction } from '@neondatabase/serverless';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

function createFakeSql(rows: unknown[]) {
  const sql = vi.fn().mockResolvedValue(rows);
  return sql as unknown as NeonQueryFunction<false, false>;
}

const sampleInstitution: Institution = {
  id: '1',
  code: 'ANPC',
  name: 'ANPC',
  description: null,
  category: 'protectia_consumatorului',
  website_url: 'https://anpc.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('findInstitution', () => {
  it('returns the matched institution', async () => {
    const sql = createFakeSql([sampleInstitution]);
    const result = await findInstitution(sql, 'anpc');
    expect(result).toEqual(sampleInstitution);
    expect(sql).toHaveBeenCalledTimes(1);
  });

  it('returns null when nothing matches', async () => {
    const sql = createFakeSql([]);
    expect(await findInstitution(sql, 'necunoscut')).toBeNull();
  });

  it('returns null when the row fails schema validation', async () => {
    const sql = createFakeSql([{ ...sampleInstitution, website_url: 'not-a-url' }]);
    expect(await findInstitution(sql, 'ANPC')).toBeNull();
  });
});
