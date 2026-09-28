import { describe, expect, it, beforeEach } from 'vitest';
import { isRateLimited, getClientIp, __resetRateLimiterForTests } from '@/lib/rateLimit';

beforeEach(() => {
  __resetRateLimiterForTests();
});

describe('isRateLimited', () => {
  it('allows requests up to the limit', () => {
    for (let i = 0; i < 8; i++) {
      expect(isRateLimited('1.2.3.4')).toBe(false);
    }
  });

  it('blocks the request once the limit is exceeded within the window', () => {
    for (let i = 0; i < 8; i++) {
      isRateLimited('1.2.3.4');
    }
    expect(isRateLimited('1.2.3.4')).toBe(true);
  });

  it('tracks different keys independently', () => {
    for (let i = 0; i < 8; i++) {
      isRateLimited('1.2.3.4');
    }
    expect(isRateLimited('5.6.7.8')).toBe(false);
  });

  it('allows requests again once the window has passed', () => {
    const start = 1_000_000;
    for (let i = 0; i < 8; i++) {
      isRateLimited('1.2.3.4', start);
    }
    expect(isRateLimited('1.2.3.4', start + 61_000)).toBe(false);
  });
});

describe('getClientIp', () => {
  it('reads the first IP from x-forwarded-for', () => {
    const req = new Request('http://localhost/x', {
      headers: { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' },
    });
    expect(getClientIp(req)).toBe('1.2.3.4');
  });

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = new Request('http://localhost/x', { headers: { 'x-real-ip': '9.9.9.9' } });
    expect(getClientIp(req)).toBe('9.9.9.9');
  });

  it('falls back to "unknown" when no IP header is present', () => {
    const req = new Request('http://localhost/x');
    expect(getClientIp(req)).toBe('unknown');
  });
});
