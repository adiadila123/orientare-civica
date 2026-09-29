'use client';

import { useEffect, useState } from 'react';
import { InfoRequestDocumentPreview } from '@/components/InfoRequestDocumentPreview';
import { EditInfoRequestForm } from '@/components/EditInfoRequestForm';
import { CaseStatusTracker } from '@/components/CaseStatusTracker';
import { rememberRecord } from '@/lib/myRecordsStorage';
import type { InfoRequest, Institution } from '@/lib/types';

interface InfoRequestViewProps {
  initialInfoRequest: InfoRequest;
  institution: Institution;
}

export function InfoRequestView({ initialInfoRequest, institution }: InfoRequestViewProps) {
  const [infoRequest, setInfoRequest] = useState(initialInfoRequest);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timeoutId = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

  // Backfills "Dosarele mele" for a request that predates that feature, or
  // that was opened on a browser/session that never went through the
  // creation flow.
  useEffect(() => {
    rememberRecord({
      id: infoRequest.id,
      type: 'info-request',
      number: infoRequest.request_number,
      institutionName: institution.name,
      createdAt: infoRequest.created_at,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoRequest.id]);

  function handleSaved(updated: InfoRequest) {
    setInfoRequest(updated);
    setIsEditing(false);
    setShowSuccess(true);
  }

  return (
    <div className="max-w-5xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg print:p-0 print:max-w-none">
      {showSuccess && (
        <div
          role="status"
          className="bg-tertiary-container text-on-tertiary-container rounded-lg p-space-md font-body-sm text-body-sm print:hidden"
        >
          Datele au fost salvate cu succes.
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-space-sm print:hidden">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">
          Cerere {infoRequest.request_number}
        </h1>
        <div className="flex gap-space-sm">
          <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface"
          >
            Descarcă PDF
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg"
          >
            Editează
          </button>
        </div>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg print:hidden">
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Conform art. 7 din Legea nr. 544/2001, instituția trebuie să răspundă în 10 zile lucrătoare
          de la înregistrarea cererii sau, dacă informația necesită mai mult timp, în cel mult 30 de
          zile — cu condiția să fii înștiințat(ă) în scris despre aceasta în primele 10 zile. Dacă nu
          primești răspuns sau ți se refuză nejustificat, poți depune o reclamație administrativă la
          conducătorul instituției în 30 de zile de la refuz (art. 21), iar dacă nici așa nu se
          rezolvă, te poți adresa instanței de contencios administrativ (art. 22).
        </p>
      </div>

      <div className="print:hidden">
        <CaseStatusTracker caseId={infoRequest.id} sentLabel="Am trimis cererea" />
      </div>

      <InfoRequestDocumentPreview infoRequest={infoRequest} institution={institution} />

      {isEditing && (
        <EditInfoRequestForm
          infoRequest={infoRequest}
          onClose={() => setIsEditing(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
