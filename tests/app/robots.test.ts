import { describe, expect, it } from 'vitest';
import robots from '@/app/robots';

describe('robots', () => {
  it('allows all crawlers and points to the sitemap', () => {
    const result = robots();
    expect(result.rules).toEqual({ userAgent: '*', allow: '/' });
    expect(result.sitemap).toContain('/sitemap.xml');
  });
});
