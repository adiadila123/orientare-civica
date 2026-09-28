import type { Case, Institution } from '@/lib/types';

interface LegalDocumentPreviewProps {
  caseRecord: Case;
  institution: Institution;
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('ro-RO') : '[Data]';
}

export function LegalDocumentPreview({ caseRecord, institution }: LegalDocumentPreviewProps) {
  return (
    <div className="bg-white text-black mx-auto max-w-[210mm] p-space-xl shadow-sm font-body-md text-body-md flex flex-col gap-space-md">
      <p className="text-right">{formatDate(caseRecord.pv_issue_date)}</p>
      <h1 className="text-center font-title-md text-title-md">PLÂNGERE CONTRAVENȚIONALĂ</h1>
      <p>
        Către: {institution.associated_court || 'Judecătoria competentă'}
        {institution.name ? ` (proces-verbal emis de ${institution.name})` : ''}
      </p>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">I. Subsemnatul/Subsemnata</h2>
        <p>
          {caseRecord.petitioner_name || '[Nume Prenume]'}, CNP {caseRecord.petitioner_cnp || '[CNP]'}, domiciliat(ă)
          în {caseRecord.petitioner_address || '[Adresă]'}, formulez prezenta plângere contravențională împotriva
          procesului-verbal de contravenție seria {caseRecord.pv_series || '[Serie]'} nr.{' '}
          {caseRecord.pv_number || '[Număr]'}, încheiat la data de {formatDate(caseRecord.pv_issue_date)}.
        </p>
      </section>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">II. Obiectul contestației</h2>
        <p>
          Prin procesul-verbal menționat mi s-a aplicat o amendă în cuantum de{' '}
          {caseRecord.pv_amount ?? '[Sumă]'} LEI
          {caseRecord.pv_penalty_points ? ` și ${caseRecord.pv_penalty_points} puncte de penalizare` : ''}, aplicată
          de {caseRecord.pv_issuing_agent || '[Agent emitent]'}.
        </p>
      </section>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">III. Motivele contestației</h2>
        <p>{caseRecord.grounds || '[Motivele contestației]'}</p>
      </section>

      <p>
        Față de cele expuse, vă rog să dispuneți anularea procesului-verbal sus-menționat, conform O.G. nr. 2/2001
        privind regimul juridic al contravențiilor.
      </p>

      {caseRecord.annexes.length > 0 && (
        <section>
          <h2 className="font-title-md text-title-md mb-space-xs">Anexe</h2>
          <ul className="list-decimal list-inside">
            {caseRecord.annexes.map((annex, index) => (
              <li key={index}>{annex}</li>
            ))}
          </ul>
        </section>
      )}

      <p className="mt-space-lg">Data: {formatDate(caseRecord.updated_at)}</p>
      <p>Semnătura: ___________________</p>
    </div>
  );
}
