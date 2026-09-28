// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/cases', () => ({
  createCase: vi.fn(),
}));

import { POST } from '@/app/api/cases/route';
import { createCase } from '@/lib/cases';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/cases', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/cases', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({ institutionCode: 'ANAF' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when institutionCode is missing', async () => {
    const response = await POST(makeRequest({ description: 'Am primit o amendă.' }));
    expect(response.status).toBe(400);
  });

  it('creates and returns the case on valid input', async () => {
    vi.mocked(createCase).mockResolvedValue({
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
    });

    const response = await POST(makeRequest({ description: 'Am primit o amendă.', institutionCode: 'PRIMARIE' }));
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.case_number).toBe('GD-2026-0001');
  });

  it('passes the grounds field through to createCase, so Motivele is pre-filled with the AI explanation', async () => {
    vi.mocked(createCase).mockResolvedValue({
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
      grounds: 'Explicația AI.',
      annexes: [],
      revision: 1,
      updated_at: '2026-09-28T10:00:00.000Z',
    });

    await POST(
      makeRequest({ description: 'Am primit o amendă.', institutionCode: 'PRIMARIE', grounds: 'Explicația AI.' })
    );

    expect(createCase).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ grounds: 'Explicația AI.' })
    );
  });

  it('returns 500 when case creation throws', async () => {
    vi.mocked(createCase).mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest({ description: 'x', institutionCode: 'ANAF' }));
    expect(response.status).toBe(500);
  });
});
