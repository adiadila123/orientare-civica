// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/triageFeedback', () => ({
  createTriageFeedback: vi.fn(),
}));

import { POST } from '@/app/api/triage-feedback/route';
import { createTriageFeedback } from '@/lib/triageFeedback';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/triage-feedback', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const createdFeedback = {
  id: '1',
  user_description: 'Am primit o amendă.',
  ai_analysis: { primary_intent: 'contestatie_amenda' },
  suggested_institution_code: 'PRIMARIE',
  is_helpful: true,
  correction: null,
  created_at: '2026-09-28T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/triage-feedback', () => {
  it('returns 400 when description is missing', async () => {
    const response = await POST(makeRequest({ isHelpful: true }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when isHelpful is missing', async () => {
    const response = await POST(makeRequest({ description: 'Am primit o amendă.' }));
    expect(response.status).toBe(400);
  });

  it('creates and returns the feedback on valid input', async () => {
    vi.mocked(createTriageFeedback).mockResolvedValue(createdFeedback);

    const response = await POST(
      makeRequest({ description: 'Am primit o amendă.', isHelpful: true, suggestedInstitutionCode: 'PRIMARIE' })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.is_helpful).toBe(true);
  });

  it('passes a trimmed correction through when provided', async () => {
    vi.mocked(createTriageFeedback).mockResolvedValue({
      ...createdFeedback,
      is_helpful: false,
      correction: 'Ar fi trebuit ANAF',
    });

    await POST(
      makeRequest({
        description: 'Am primit o amendă.',
        isHelpful: false,
        correction: '  Ar fi trebuit ANAF  ',
      })
    );

    expect(createTriageFeedback).toHaveBeenCalledWith(
      {},
      expect.objectContaining({ correction: 'Ar fi trebuit ANAF' })
    );
  });

  it('returns 500 when creation throws', async () => {
    vi.mocked(createTriageFeedback).mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest({ description: 'x', isHelpful: true }));
    expect(response.status).toBe(500);
  });
});
