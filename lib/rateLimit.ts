const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 8;
const MAX_TRACKED_KEYS = 5000;

// In-memory only — best-effort per warm serverless instance, resets on cold
// start and isn't shared across instances. Good enough as a first line of
// defense against a single abusive client exhausting the paid Groq quota;
// a shared store (e.g. Upstash Redis) would be needed for a hard guarantee.
const hits = new Map<string, number[]>();

export function isRateLimited(key: string, now: number = Date.now()): boolean {
  if (hits.size > MAX_TRACKED_KEYS) {
    for (const [trackedKey, timestamps] of hits) {
      if (timestamps.every((t) => now - t >= WINDOW_MS)) {
        hits.delete(trackedKey);
      }
    }
  }

  const timestamps = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  timestamps.push(now);
  hits.set(key, timestamps);

  return timestamps.length > MAX_REQUESTS_PER_WINDOW;
}

export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0]!.trim();
  }
  return req.headers.get('x-real-ip') ?? 'unknown';
}

export function __resetRateLimiterForTests(): void {
  hits.clear();
}
