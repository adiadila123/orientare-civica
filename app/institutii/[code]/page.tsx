import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createDb } from '@/lib/db';
import { findInstitution } from '@/lib/institutions';
import { StepNumber } from '@/components/StepNumber';
import { InfoRequestStarter } from '@/components/InfoRequestStarter';

const STAMP_DUTY_AMOUNT = '20,00 LEI';
const LEGAL_DEADLINE_DAYS = 15;

const CONTESTATION_DOCUMENTS = [
  'Copie act de identitate',
  'Copie procesul-verbal de contravenție',
  'Dovada plății taxei de timbru (dacă este cazul)',
];

const COMPLAINT_DOCUMENTS = [
  'Copie act de identitate',
  'Orice document care susține sesizarea (facturi, corespondență, fotografii etc.)',
];

export const dynamic = 'force-dynamic';

export async function generateMetadata(
  props: PageProps<'/institutii/[code]'>
): Promise<Metadata> {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    return { title: 'Instituție negăsită — Unde Merg?' };
  }

  return {
    title: `${institution.name} — Ghid — Unde Merg?`,
    description: `Ghid pas cu pas pentru ${institution.name}: termen legal, pași și documente necesare.`,
  };
}

export default async function InstitutionGuidePage(props: PageProps<'/institutii/[code]'>) {
  const { code } = await props.params;
  const sql = createDb();
  const institution = await findInstitution(sql, code);

  if (!institution) {
    notFound();
  }

  const isContestable = Boolean(institution.associated_court);

  const resolutionPaths = [
    institution.contact_form_url
      ? { title: 'Online', description: 'Depune cererea prin formularul online al instituției.' }
      : institution.website_url
        ? { title: 'Online', description: 'Verifică site-ul instituției pentru depunere online.' }
        : null,
    institution.phone
      ? { title: 'Telefon', description: `Sună la ${institution.phone} pentru îndrumare.` }
      : null,
    institution.address
      ? { title: 'În persoană', description: `Depune cererea la sediul: ${institution.address}.` }
      : null,
  ].filter((path): path is { title: string; description: string } => path !== null);

  const hasResolutionPath = resolutionPaths.length > 0;

  const steps = isContestable
    ? [
        'Completează cererea de contestație folosind modelul recomandat.',
        `Achită taxa de timbru de ${STAMP_DUTY_AMOUNT} la trezoreria/primăria din localitatea ta de domiciliu, conform art. 40 din O.U.G. nr. 80/2013 privind taxele judiciare de timbru.`,
        `Depune cererea și dovada plății la ${institution.associated_court}.`,
        'Așteaptă soluționarea de către instanță în termenul legal.',
      ]
    : [
        'Completează o sesizare sau cerere către instituție, descriind clar problema.',
        hasResolutionPath
          ? 'Trimite sesizarea prin canalul ales mai sus.'
          : `Trimite sesizarea către ${institution.name} — verifică site-ul oficial pentru datele de contact.`,
        'Așteaptă răspunsul instituției.',
      ];

  const requiredDocuments = isContestable ? CONTESTATION_DOCUMENTS : COMPLAINT_DOCUMENTS;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOrganization',
    name: institution.name,
    ...(institution.description && { description: institution.description }),
    ...(institution.website_url && { url: institution.website_url }),
    ...(institution.phone && { telephone: institution.phone }),
    ...(institution.email && { email: institution.email }),
    ...(institution.address && { address: institution.address }),
  };

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">{institution.name}</h1>
        {institution.description && (
          <p className="font-body-sm text-body-sm text-on-surface-variant">{institution.description}</p>
        )}
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

      {isContestable && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Termen legal</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Ai la dispoziție {LEGAL_DEADLINE_DAYS} zile calendaristice de la comunicarea procesului-verbal
            pentru a depune contestația, conform art. 31 din O.G. nr. 2/2001. Taxa judiciară de timbru este
            de {STAMP_DUTY_AMOUNT}, conform art. 19 din O.U.G. nr. 80/2013 privind taxele judiciare de timbru.
          </p>
        </div>
      )}

      {hasResolutionPath ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-space-md">
          {resolutionPaths.map((path) => (
            <div key={path.title} className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
              <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">{path.title}</h3>
              <p className="font-body-sm text-body-sm text-on-surface-variant">{path.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
          <h3 className="font-title-md text-title-md text-on-surface mb-space-xs">Contact</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Datele de contact pentru această instituție nu sunt disponibile momentan în platforma noastră.
          </p>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Pașii de urmat</h2>
        <ol className="flex flex-col gap-space-sm">
          {steps.map((step, index) => (
            <li key={index} className="flex items-center gap-space-sm">
              <StepNumber index={index + 1} />
              <span className="font-body-sm text-body-sm text-on-surface">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
        <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">Documente necesare</h2>
        <ul className="flex flex-col gap-space-xs">
          {requiredDocuments.map((doc, index) => (
            <li key={index} className="flex items-center gap-space-xs font-body-sm text-body-sm">
              <span aria-hidden="true">✓</span>
              <span>{doc}</span>
            </li>
          ))}
        </ul>
      </div>

      {(institution.address || institution.phone || institution.email || institution.website_url) && (
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
      )}

      <InfoRequestStarter institutionCode={institution.code} />
    </div>
  );
}
