import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { findInstitution } from '@/lib/institutions';
import type { Institution } from '@/lib/types';

function createFakeSupabase(response: { data: Institution | null; error: { message: string } | null }) {
  const maybeSingle = vi.fn().mockResolvedValue(response);
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const from = vi.fn().mockReturnValue({ select });
  return { client: { from } as unknown as SupabaseClient, from, select, eq };
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
  it('returns the matched institution and normalizes the code to uppercase', async () => {
    const { client, from, select, eq } = createFakeSupabase({ data: sampleInstitution, error: null });
    const result = await findInstitution(client, 'anpc');
    expect(result).toEqual(sampleInstitution);
    expect(from).toHaveBeenCalledWith('institutions');
    expect(select).toHaveBeenCalledWith('*');
    expect(eq).toHaveBeenCalledWith('code', 'ANPC');
  });

  it('returns null when nothing matches', async () => {
    const { client } = createFakeSupabase({ data: null, error: null });
    expect(await findInstitution(client, 'necunoscut')).toBeNull();
  });

  it('throws when supabase returns an error', async () => {
    const { client } = createFakeSupabase({ data: null, error: { message: 'connection failed' } });
    await expect(findInstitution(client, 'ANPC')).rejects.toThrow('connection failed');
  });
});
