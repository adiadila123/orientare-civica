// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/infoRequests', () => ({
  updateInfoRequest: vi.fn(),
}));

import { PUT } from '@/app/api/info-requests/[id]/route';
import { updateInfoRequest } from '@/lib/infoRequests';

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/info-requests/1', {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

const validBody = {
  requesterName: 'Ion Popescu',
  requesterAddress: 'Str. Exemplu nr. 1',
  requesterEmail: 'ion@example.com',
  requesterPhone: null,
  informationRequested: 'Câte sesizări au fost înregistrate în 2026?',
};

const updatedRequest = {
  id: '1',
  request_number: 'IP-2026-0001',
  institution_code: 'PRIMARIE',
  requester_name: 'Ion Popescu',
  requester_address: 'Str. Exemplu nr. 1',
  requester_email: 'ion@example.com',
  requester_phone: null,
  information_requested: validBody.informationRequested,
  revision: 2,
  created_at: '2026-09-28T10:00:00.000Z',
  updated_at: '2026-09-28T10:05:00.000Z',
};

beforeEach(() => {
  vi.clearAllMocks();
  process.env.DATABASE_URL = 'postgres://test';
});

describe('PUT /api/info-requests/[id]', () => {
  it('returns 400 when informationRequested is empty', async () => {
    const response = await PUT(makeRequest({ ...validBody, informationRequested: '' }), {
      params: Promise.resolve({ id: '1' }),
    });
    expect(response.status).toBe(400);
    expect(updateInfoRequest).not.toHaveBeenCalled();
  });

  it('updates and returns the request on valid input', async () => {
    vi.mocked(updateInfoRequest).mockResolvedValue(updatedRequest);

    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.revision).toBe(2);
  });

  it('saves null instead of an empty string for optional requester fields', async () => {
    vi.mocked(updateInfoRequest).mockResolvedValue(updatedRequest);

    await PUT(makeRequest({ ...validBody, requesterAddress: '', requesterEmail: '' }), {
      params: Promise.resolve({ id: '1' }),
    });

    expect(updateInfoRequest).toHaveBeenCalledWith(
      expect.anything(),
      '1',
      expect.objectContaining({ requesterAddress: null, requesterEmail: null })
    );
  });

  it('returns 404 when the request does not exist', async () => {
    vi.mocked(updateInfoRequest).mockResolvedValue(null);
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: 'missing' }) });
    expect(response.status).toBe(404);
  });

  it('returns 500 when the update throws', async () => {
    vi.mocked(updateInfoRequest).mockRejectedValue(new Error('db down'));
    const response = await PUT(makeRequest(validBody), { params: Promise.resolve({ id: '1' }) });
    expect(response.status).toBe(500);
  });
});
