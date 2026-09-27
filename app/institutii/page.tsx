import type { Metadata } from 'next';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { InstitutionCatalog } from '@/components/InstitutionCatalog';

export const metadata: Metadata = {
  title: 'Instituții — Unde Merg?',
  description: 'Lista instituțiilor publice către care Unde Merg? te poate direcționa.',
};

// Institution data is fetched live from the DB on every request rather than
// baked into the static shell at build time (which would require DB access
// during `next build`).
export const dynamic = 'force-dynamic';

export default async function InstitutiiPage() {
  const sql = createDb();
  const institutions = await listInstitutions(sql);

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Instituții</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Lista instituțiilor publice către care te putem direcționa.
      </p>
      <InstitutionCatalog institutions={institutions} />
    </div>
  );
}
