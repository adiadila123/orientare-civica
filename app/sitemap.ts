import type { MetadataRoute } from 'next';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { SITE_URL } from '@/lib/site';

// Institution routes are fetched live from the DB on every request rather
// than baked into the static shell at build time (same reasoning as
// app/institutii/page.tsx — avoids requiring DB access during `next build`).
export const dynamic = 'force-dynamic';

const STATIC_ROUTES = [
  '',
  '/institutii',
  '/intrebari-frecvente',
  '/termeni-si-conditii',
  '/confidentialitate',
  '/politica-cookie-uri',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sql = createDb();
  const institutions = await listInstitutions(sql);

  const staticEntries = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const institutionEntries = institutions.map((institution) => ({
    url: `${SITE_URL}/institutii/${institution.code.toLowerCase()}`,
    lastModified: new Date(),
  }));

  return [...staticEntries, ...institutionEntries];
}
