import { NextResponse } from 'next/server';
import { haversineDistanceKm } from '@/lib/geo';
import { isRateLimited, getClientIp } from '@/lib/rateLimit';

const SEARCH_RADIUS_METERS = 30_000;
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OVERPASS_TIMEOUT_MS = 12_000;

interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function buildQuery(lat: number, lon: number): string {
  return `[out:json][timeout:15];(node["amenity"="townhall"](around:${SEARCH_RADIUS_METERS},${lat},${lon});way["amenity"="townhall"](around:${SEARCH_RADIUS_METERS},${lat},${lon});relation["amenity"="townhall"](around:${SEARCH_RADIUS_METERS},${lat},${lon}););out center 20;`;
}

function elementCoords(element: OverpassElement): { lat: number; lon: number } | null {
  if (typeof element.lat === 'number' && typeof element.lon === 'number') {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.center) {
    return element.center;
  }
  return null;
}

function elementAddress(tags: Record<string, string> | undefined): string | null {
  if (!tags) return null;
  const parts = [
    [tags['addr:street'], tags['addr:housenumber']].filter(Boolean).join(' '),
    tags['addr:city'],
  ].filter((part): part is string => Boolean(part && part.trim().length > 0));
  return parts.length > 0 ? parts.join(', ') : null;
}

export async function GET(req: Request) {
  if (isRateLimited(`nearest-townhall:${getClientIp(req)}`)) {
    return NextResponse.json(
      { error: 'Prea multe cereri. Încearcă din nou peste un minut.' },
      { status: 429 }
    );
  }

  const { searchParams } = new URL(req.url);
  const latParam = searchParams.get('lat');
  const lonParam = searchParams.get('lon');
  const lat = latParam !== null ? Number(latParam) : NaN;
  const lon = lonParam !== null ? Number(lonParam) : NaN;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    lat < -90 ||
    lat > 90 ||
    lon < -180 ||
    lon > 180
  ) {
    return NextResponse.json({ error: 'lat and lon must be valid coordinates' }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), OVERPASS_TIMEOUT_MS);

    const response = await fetch(OVERPASS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        // Required by Overpass/OSM Foundation usage policy: identify the calling app.
        'User-Agent': 'unde-merg-orientare-civica/1.0 (nearest-townhall lookup)',
      },
      body: buildQuery(lat, lon),
      signal: controller.signal,
    }).finally(() => clearTimeout(timeout));

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Serviciul OpenStreetMap nu a răspuns. Încearcă din nou mai târziu.' },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { elements: OverpassElement[] };

    const candidates = data.elements
      .map((element) => {
        const coords = elementCoords(element);
        if (!coords || !element.tags?.name) return null;
        return {
          name: element.tags.name,
          address: elementAddress(element.tags),
          lat: coords.lat,
          lon: coords.lon,
          distanceKm: haversineDistanceKm(lat, lon, coords.lat, coords.lon),
        };
      })
      .filter((candidate): candidate is NonNullable<typeof candidate> => candidate !== null)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    const nearest = candidates[0];

    if (!nearest) {
      return NextResponse.json(
        { error: 'Nu am găsit nicio primărie în OpenStreetMap în apropierea ta.' },
        { status: 404 }
      );
    }

    return NextResponse.json(nearest);
  } catch (error) {
    console.error('Nearest townhall lookup failed', error);
    return NextResponse.json(
      { error: 'Nu am putut contacta serviciul OpenStreetMap. Încearcă din nou.' },
      { status: 502 }
    );
  }
}
