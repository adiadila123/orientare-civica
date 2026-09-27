import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findInstitution } from '@/lib/institutions';

const STAMP_DUTY_AMOUNT = '20,00 LEI';
const LEGAL_DEADLINE_DAYS = 15;

const REQUIRED_DOCUMENTS = [
  'Copie act de identitate',
  'Copie procesul-verbal de contravenție',
  'Dovada plății taxei de timbru (dacă este cazul)',
];

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: PageProps<'/institutii/[code]'>
): Promise<Metadata> {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  return {
    title: institution ? `${institution.name} — Ghid — Unde Merg?` : 'Instituție negăsită — Unde Merg?',
  };
}

export default async function InstitutionGuidePage(props: PageProps<'/institutii/[code]'>) {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    notFound();
  }

  const resolutionPaths = [
    {
      title: 'Online',
      description: institution.contact_form_url
        ? 'Depune cererea prin formularul online al instituției.'
        : institution.website_url
          ? 'Verifică site-ul instituției pentru depunere online.'
          : 'Depunerea online nu este disponibilă pentru această instituție.',
    },
    {
      title: 'Telefon',
      description: institution.phone
        ? `Sună la ${institution.phone} pentru îndrumare.`
        : 'Numărul de telefon nu este disponibil pentru această instituție.',
    },
    {
      title: 'În persoană',
      description: institution.address
        ? `Depune cererea la sediul: ${institution.address}.`
        : 'Adresa sediului nu este disponibilă pentru această instituție.',
    },
  ];

  const steps = [
    'Completează cererea de contestație folosind modelul recomandat.',
    institution.iban && institution.cod_venit && institution.cui
      ? `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} către IBAN ${institution.iban}, Cod Venit ${institution.cod_venit}, CUI ${institution.cui}.`
      : `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} (detaliile de plată se obțin de la instituție).`,
    `Depune cererea și dovada plății la ${institution.name}, prin canalul ales mai sus.`,
    'Așteaptă răspunsul instituției în termenul legal.',
  ];

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{institution.name}</h1>
        {institution.associated_court && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Instanța competentă: {institution.associated_court}
          </p>
        )}
        {typeof institution.wait_time_minutes === 'number' && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Timp estimat de așteptare: ~{institution.wait_time_minutes} minute
          </p>
        )}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Termen legal</h2>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Ai la dispoziție {LEGAL_DEADLINE_DAYS} zile calendaristice de la comunicarea procesului-verbal
          pentru a depune contestația, conform O.G. nr. 2/2001.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
        {resolutionPaths.map((path) => (
          <div key={path.title} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
            <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">{path.title}</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{path.description}</p>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Pașii de urmat</h2>
        <ol className="flex flex-col gap-space-sm">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <span className="w-6 h-6 rounded-full bg-secondary text-on-secondary text-label-sm font-label-sm flex items-center justify-center shrink-0">
                {index + 1}
              </span>
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Documente necesare</h2>
        <ul className="flex flex-col gap-space-xs">
          {REQUIRED_DOCUMENTS.map((doc, index) => (
            <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
              <span aria-hidden="true">✓</span>
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Date de contact</h2>
        <div className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
          {institution.address && <p>{institution.address}</p>}
          {institution.phone && <p>Telefon: {institution.phone}</p>}
          {institution.email && <p>Email: {institution.email}</p>}
          {institution.website_url && (
            <p>
              <a
                href={institution.website_url}
                target="_blank"
                rel="noreferrer"
                className="text-secondary underline underline-offset-2"
              >
                {institution.website_url}
              </a>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
