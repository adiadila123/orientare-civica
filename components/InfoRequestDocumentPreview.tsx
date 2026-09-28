import type { InfoRequest, Institution } from '@/lib/types';

interface InfoRequestDocumentPreviewProps {
  infoRequest: InfoRequest;
  institution: Institution;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString('ro-RO');
}

export function InfoRequestDocumentPreview({ infoRequest, institution }: InfoRequestDocumentPreviewProps) {
  return (
    <div className="bg-white text-black mx-auto max-w-[210mm] p-space-xl shadow-sm font-body-md text-body-md flex flex-col gap-space-md print:shadow-none print:max-w-none print:p-0">
      <p className="text-right">{formatDate(infoRequest.updated_at)}</p>
      <h1 className="text-center font-title-md text-title-md">
        CERERE DE ACCES LA INFORMAȚII DE INTERES PUBLIC
      </h1>
      <p>Către: {institution.name}</p>

      <section>
        <p>
          Subsemnatul/subsemnata {infoRequest.requester_name || '[Nume Prenume]'}, cu domiciliul/reședința în{' '}
          {infoRequest.requester_address || '[Adresă]'}
          {infoRequest.requester_email ? `, email: ${infoRequest.requester_email}` : ''}
          {infoRequest.requester_phone ? `, telefon: ${infoRequest.requester_phone}` : ''}, în temeiul Legii nr.
          544/2001 privind liberul acces la informațiile de interes public, vă solicit următoarele informații:
        </p>
      </section>

      <section>
        <h2 className="font-title-md text-title-md mb-space-xs">Informația solicitată</h2>
        <p>{infoRequest.information_requested}</p>
      </section>

      <p>
        Vă rog să comunicați răspunsul, conform art. 7 din Legea nr. 544/2001, în termen de 10 zile lucrătoare de
        la înregistrarea prezentei cereri sau, dacă identificarea informației necesită mai mult timp, în cel mult
        30 de zile, cu condiția să fiu înștiințat(ă) în scris despre aceasta în primele 10 zile.
      </p>

      <p className="mt-space-lg">Semnătura: ___________________</p>
    </div>
  );
}
