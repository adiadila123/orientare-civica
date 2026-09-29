import { describe, expect, it } from 'vitest';
import { haversineDistanceKm } from '@/lib/geo';

describe('haversineDistanceKm', () => {
  it('returns 0 for identical coordinates', () => {
    expect(haversineDistanceKm(44.4268, 26.1025, 44.4268, 26.1025)).toBe(0);
  });

  it('returns a plausible distance between two Bucharest landmarks (~2.8 km)', () => {
    // Piața Unirii -> Piața Victoriei
    const distance = haversineDistanceKm(44.4304, 26.1032, 44.4522, 26.0858);
    expect(distance).toBeGreaterThan(2.5);
    expect(distance).toBeLessThan(3.5);
  });

  it('is symmetric', () => {
    const a = haversineDistanceKm(44.4304, 26.1032, 44.4522, 26.0858);
    const b = haversineDistanceKm(44.4522, 26.0858, 44.4304, 26.1032);
    expect(a).toBeCloseTo(b, 10);
  });
});
