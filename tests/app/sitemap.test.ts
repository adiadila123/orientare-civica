// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from 'vitest';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  listInstitutions: vi.fn(),
}));

import sitemap from '@/app/sitemap';
import { listInstitutions } from '@/lib/institutions';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('sitemap', () => {
  it('includes every static route', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([]);

    const entries = await sitemap();
    const urls = entries.map((entry) => entry.url);

    expect(urls).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^https?:\/\/[^/]+$/),
        expect.stringContaining('/institutii'),
        expect.stringContaining('/intrebari-frecvente'),
        expect.stringContaining('/termeni-si-conditii'),
        expect.stringContaining('/confidentialitate'),
        expect.stringContaining('/politica-cookie-uri'),
      ])
    );
  });

  it('includes a lowercase-code route for every institution in the database', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([
      {
        id: '1',
        code: 'ANAF',
        name: 'ANAF',
        description: null,
        category: 'fiscal',
        website_url: null,
        contact_form_url: null,
        phone: null,
        email: null,
        address: null,
      },
    ]);

    const entries = await sitemap();
    expect(entries.map((entry) => entry.url)).toEqual(
      expect.arrayContaining([expect.stringContaining('/institutii/anaf')])
    );
  });
});
