// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  findCase: vi.fn(),
  findCaseByCaseNumber: vi.fn(),
  mergeCaseGroups: vi.fn(),
  findCasesByGroupId: vi.fn(),
}));

import { POST } from '@/app/api/cases/[id]/link/route';
import { findCase, findCaseByCaseNumber, mergeCaseGroups, findCasesByGroupId } from '@/lib/cases';
import type { Case } from '@/lib/types';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/cases/1/link', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function makeCase(overrides: Partial<Case>): Case {
  return {
    id: '1',
    case_number: 'GD-2026-0001',
    case_group_id: 'group-1',
    user_description: 'x',
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/cases/[id]/link', () => {
  it('returns 400 when caseNumber is missing', async () => {
    const response = await POST(makeRequest({}), { params: Promise.resolve({ id: '1' }) });
    expect(response.status).toBe(400);
  });

  it('returns 404 when the current case does not exist', async () => {
    vi.mocked(findCase).mockResolvedValue(null);
    const response = await POST(makeRequest({ caseNumber: 'GD-2026-0002' }), {
      params: Promise.resolve({ id: 'missing' }),
    });
    expect(response.status).toBe(404);
  });

  it('returns 404 when no case matches the given case number', async () => {
    vi.mocked(findCase).mockResolvedValue(makeCase({}));
    vi.mocked(findCaseByCaseNumber).mockResolvedValue(null);
    const response = await POST(makeRequest({ caseNumber: 'GD-2026-9999' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(404);
  });

  it('returns 400 when trying to link a case to itself', async () => {
    const current = makeCase({ id: '1', case_number: 'GD-2026-0001' });
    vi.mocked(findCase).mockResolvedValue(current);
    vi.mocked(findCaseByCaseNumber).mockResolvedValue(current);

    const response = await POST(makeRequest({ caseNumber: 'GD-2026-0001' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(400);
    expect(mergeCaseGroups).not.toHaveBeenCalled();
  });

  it('merges the two groups and returns the full linked group', async () => {
    const current = makeCase({ id: '1', case_number: 'GD-2026-0001', case_group_id: 'group-a' });
    const target = makeCase({ id: '2', case_number: 'GD-2026-0002', case_group_id: 'group-b' });
    vi.mocked(findCase).mockResolvedValue(current);
    vi.mocked(findCaseByCaseNumber).mockResolvedValue(target);
    vi.mocked(findCasesByGroupId).mockResolvedValue([
      { ...current, case_group_id: 'group-a' },
      { ...target, case_group_id: 'group-a' },
    ]);

    const response = await POST(makeRequest({ caseNumber: 'GD-2026-0002' }), {
      params: Promise.resolve({ id: '1' }),
    });
    const json = await response.json();

    expect(mergeCaseGroups).toHaveBeenCalledWith({}, 'group-a', 'group-b');
    expect(response.status).toBe(200);
    expect(json.group).toHaveLength(2);
  });

  it('returns 500 when linking throws', async () => {
    vi.mocked(findCase).mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest({ caseNumber: 'GD-2026-0002' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(500);
  });
});
