import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findInfoRequest } from '@/lib/infoRequests';
import { findInstitution } from '@/lib/institutions';
import { InfoRequestView } from '@/components/InfoRequestView';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Cererea ta de informații — Unde Merg?',
  // Personal data (nume, adresă) may appear on this page once filled in —
  // never index it, and never let it show up in someone else's search results.
  robots: { index: false, follow: false },
};

export default async function InfoRequestPage(props: PageProps<'/solicitare-informatii/[id]'>) {
  const { id } = await props.params;
  const sql = createDb();
  const infoRequest = await findInfoRequest(sql, id);

  if (!infoRequest) {
    notFound();
  }

  const institution = await findInstitution(sql, infoRequest.institution_code);

  if (!institution) {
    notFound();
  }

  return <InfoRequestView initialInfoRequest={infoRequest} institution={institution} />;
}
