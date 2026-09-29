import type { Metadata } from 'next';
import { createDb } from '@/lib/db';
import { listInstitutions } from '@/lib/institutions';
import { InstitutionsMapLoader } from '@/components/InstitutionsMapLoader';
import type { MappableInstitution } from '@/components/InstitutionsMap';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Harta instituțiilor — Unde Merg?',
  description: 'Sediile instituțiilor publice naționale, cu adrese reale, pe hartă.',
  alternates: { canonical: '/harta' },
  openGraph: {
    title: 'Harta instituțiilor — Unde Merg?',
    description: 'Sediile instituțiilor publice naționale, cu adrese reale, pe hartă.',
  },
};

export default async function HartaPage() {
  const sql = createDb();
  const institutions = await listInstitutions(sql);
  const mappable: MappableInstitution[] = institutions.filter(
    (institution): institution is MappableInstitution =>
      typeof institution.latitude === 'number' && typeof institution.longitude === 'number'
  );

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Harta instituțiilor</h1>
        <p className="font-body-lg text-body-lg text-on-surface-variant">
          Sediile centrale ale instituțiilor naționale către care te putem direcționa. Primăria și
          Poliția Locală nu au un sediu unic — variază în funcție de localitatea ta — de aceea nu
          apar pe hartă.
        </p>
      </div>

      {mappable.length > 0 ? (
        <InstitutionsMapLoader institutions={mappable} />
      ) : (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Harta nu este disponibilă momentan.
        </p>
      )}
    </div>
  );
}
