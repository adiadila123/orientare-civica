// @vitest-environment node
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GET } from '@/app/api/nearest-townhall/route';
import { __resetRateLimiterForTests } from '@/lib/rateLimit';

function makeRequest(query: string, headers: Record<string, string> = {}) {
  return new Request(`http://localhost/api/nearest-townhall${query}`, { headers });
}

const overpassResponse = {
  elements: [
    {
      type: 'node',
      lat: 44.5,
      lon: 26.1,
      tags: { name: 'Primăria Comunei Departe', amenity: 'townhall' },
    },
    {
      type: 'way',
      center: { lat: 44.4283, lon: 26.0939 },
      tags: {
        name: 'Primăria Sectorului 5',
        amenity: 'townhall',
        'addr:street': 'Str. Fabrica de Chibrituri',
        'addr:housenumber': '9-11',
        'addr:city': 'București',
      },
    },
    {
      type: 'node',
      lat: 44.43,
      lon: 26.1,
      tags: { amenity: 'townhall' }, // no name — should be skipped
    },
  ],
};

beforeEach(() => {
  __resetRateLimiterForTests();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('GET /api/nearest-townhall', () => {
  it('returns 400 when lat/lon are missing or invalid', async () => {
    const response = await GET(makeRequest(''));
    expect(response.status).toBe(400);
  });

  it('returns 400 when coordinates are out of range', async () => {
    const response = await GET(makeRequest('?lat=999&lon=26'));
    expect(response.status).toBe(400);
  });

  it('returns the nearest named townhall, skipping unnamed elements', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(overpassResponse) })
    );

    const response = await GET(makeRequest('?lat=44.4283&lon=26.0939'));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.name).toBe('Primăria Sectorului 5');
    expect(json.address).toBe('Str. Fabrica de Chibrituri 9-11, București');
    expect(json.distanceKm).toBeCloseTo(0, 1);
  });

  it('returns 404 when Overpass has no named townhall nearby', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({ elements: [] }) }));

    const response = await GET(makeRequest('?lat=44.4283&lon=26.0939'));
    expect(response.status).toBe(404);
  });

  it('returns 502 when Overpass responds with a non-ok status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));

    const response = await GET(makeRequest('?lat=44.4283&lon=26.0939'));
    expect(response.status).toBe(502);
  });

  it('returns 502 when the request to Overpass throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));

    const response = await GET(makeRequest('?lat=44.4283&lon=26.0939'));
    expect(response.status).toBe(502);
  });

  it('returns 429 after too many requests from the same client in a short window', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(overpassResponse) })
    );

    let lastResponse;
    for (let i = 0; i < 9; i++) {
      lastResponse = await GET(
        makeRequest('?lat=44.4283&lon=26.0939', { 'x-forwarded-for': '203.0.113.9' })
      );
    }

    expect(lastResponse!.status).toBe(429);
  });
});
