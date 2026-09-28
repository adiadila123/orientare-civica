// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/infoRequests', () => ({
  createInfoRequest: vi.fn(),
}));

import { POST } from '@/app/api/info-requests/route';
import { createInfoRequest } from '@/lib/infoRequests';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/info-requests', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

const createdRequest = {
  id: '1',
  request_number: 'IP-2026-0001',
  institution_code: 'PRIMARIE',
  requester_name: null,
  requester_address: null,
  requester_email: null,
  requester_phone: null,
  information_requested: 'Câte sesizări au fost înregistrate în 2026?',
  revision: 1,
  created_at: '2026-09-28T10:00:00.000Z',
  updated_at: '2026-09-28T10:00:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('POST /api/info-requests', () => {
  it('returns 400 when informationRequested is missing', async () => {
    const response = await POST(makeRequest({ institutionCode: 'PRIMARIE' }));
    expect(response.status).toBe(400);
  });

  it('returns 400 when institutionCode is missing', async () => {
    const response = await POST(makeRequest({ informationRequested: 'Ceva' }));
    expect(response.status).toBe(400);
  });

  it('creates and returns the request on valid input', async () => {
    vi.mocked(createInfoRequest).mockResolvedValue(createdRequest);

    const response = await POST(
      makeRequest({ institutionCode: 'PRIMARIE', informationRequested: createdRequest.information_requested })
    );
    const json = await response.json();

    expect(response.status).toBe(201);
    expect(json.request_number).toBe('IP-2026-0001');
  });

  it('returns 500 when creation throws', async () => {
    vi.mocked(createInfoRequest).mockRejectedValue(new Error('db down'));
    const response = await POST(makeRequest({ institutionCode: 'PRIMARIE', informationRequested: 'x' }));
    expect(response.status).toBe(500);
  });
});
