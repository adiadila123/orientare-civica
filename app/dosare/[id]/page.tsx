import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findCase } from '@/lib/cases';
import { findInstitution } from '@/lib/institutions';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Dosarul tău — Unde Merg?',
};

export default async function CasePage(props: PageProps<'/dosare/[id]'>) {
  const { id } = await props.params;
  const sql = createDb();
  const caseRecord = await findCase(sql, id);

  if (!caseRecord) {
    notFound();
  }

  const institution = caseRecord.institution_code
    ? await findInstitution(sql, caseRecord.institution_code)
    : null;

  if (!institution) {
    notFound();
  }

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Dosar {caseRecord.case_number}</h1>
      <LegalDocumentPreview caseRecord={caseRecord} institution={institution} />
    </div>
  );
}
