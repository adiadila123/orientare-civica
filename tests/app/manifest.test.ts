import { describe, expect, it } from 'vitest';
import manifest from '@/app/manifest';

describe('manifest', () => {
  it('describes an installable app with a real, served icon', () => {
    const result = manifest();

    expect(result.name).toBe('Unde Merg? – Orientare Civică');
    expect(result.start_url).toBe('/');
    expect(result.display).toBe('standalone');
    expect(result.icons?.[0]).toEqual({
      src: '/favicon.ico',
      sizes: 'any',
      type: 'image/x-icon',
    });
  });
});
