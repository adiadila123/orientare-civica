// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

const listInstitutions = vi.fn();

vi.mock('@/lib/db', () => ({ createDb: () => ({}) }));
vi.mock('@/lib/institutions', () => ({
  listInstitutions: (...args: unknown[]) => listInstitutions(...args),
}));

import { GET } from '@/app/api/institutions/route';

beforeEach(() => {
  listInstitutions.mockReset();
});

describe('GET /api/institutions', () => {
  it('returns the institution list as JSON', async () => {
    listInstitutions.mockResolvedValue([{ id: '1', code: 'ANAF', name: 'ANAF' }]);

    const res = await GET();

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([{ id: '1', code: 'ANAF', name: 'ANAF' }]);
  });

  it('returns 500 with a friendly message when the database fails', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    listInstitutions.mockRejectedValue(new Error('db down'));

    const res = await GET();

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/instituțiile/);
  });
});
