// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  updateCase: vi.fn(),
}));

import { PUT } from '@/app/api/cases/[id]/route';
import { updateCase } from '@/lib/cases';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/cases/1', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

const validBody = {
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
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('PUT /api/cases/[id]', () => {
  it('returns 400 when the CNP is invalid', async () => {
    const response = await PUT(makeRequest({ ...validBody, petitionerCnp: '19000101400' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(400);
  });

  it('returns 400 when pvAmount overflows a Postgres int4 column', async () => {
    const response = await PUT(makeRequest({ ...validBody, pvAmount: 99999999999 }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(400);
    expect(updateCase).not.toHaveBeenCalled();
  });

  it('saves a null pv_issue_date instead of an empty string, when no PV date was entered yet', async () => {
    vi.mocked(updateCase).mockResolvedValue(null);
    await PUT(makeRequest({ ...validBody, pvIssueDate: '' }), { params: Promise.resolve({ id: '1' }) });
    expect(updateCase).toHaveBeenCalledWith(
      expect.anything(),
      '1',
      expect.objectContaining({ pvIssueDate: null })
    );
  });

  it('updates and returns the case on a valid CNP', async () => {
    vi.mocked(updateCase).mockResolvedValue({
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
      petitioner_name: 'Ion Popescu',
      petitioner_cnp: '1900010140017',
      petitioner_address: 'Str. Exemplu nr. 1',
      petitioner_email: null,
      petitioner_phone: null,
      pv_series: 'ABC',
      pv_number: '123',
      pv_issue_date: '2026-09-01',
      pv_amount: 500,
      pv_penalty_points: null,
      pv_issuing_agent: null,
      grounds: 'Nu am fost prezent la fața locului.',
      annexes: [],
      revision: 2,
      updated_at: '2026-09-28T10:05:00.000Z',
    });

    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.revision).toBe(2);
  });

  it('returns 404 when the case does not exist', async () => {
    vi.mocked(updateCase).mockResolvedValue(null);
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: 'missing' }) });
    expect(response.status).toBe(404);
  });

  it('returns 500 when the update throws', async () => {
    vi.mocked(updateCase).mockRejectedValue(new Error('db down'));
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    expect(response.status).toBe(500);
  });
});
