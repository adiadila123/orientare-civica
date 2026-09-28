'use client';

import { useEffect, useState } from 'react';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';
import { EditCaseForm } from '@/components/EditCaseForm';
import { buildContestationDeadlineIcs } from '@/lib/ics';
import type { Case, Institution } from '@/lib/types';

interface CaseViewProps {
  initialCase: Case;
  institution: Institution;
}

export function CaseView({ initialCase, institution }: CaseViewProps) {
  const [caseRecord, setCaseRecord] = useState(initialCase);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timeoutId = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

  function handleSaved(updated: Case) {
    setCaseRecord(updated);
    setIsEditing(false);
    setShowSuccess(true);
  }

  function downloadDeadlineReminder() {
    if (!caseRecord.pv_issue_date) {
      return;
    }
    const ics = buildContestationDeadlineIcs({
      caseNumber: caseRecord.case_number,
      pvIssueDate: caseRecord.pv_issue_date,
    });
    const blob = new Blob([ics], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `termen_contestatie_${caseRecord.case_number}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  const canRemindDeadline = Boolean(institution.associated_court && caseRecord.pv_issue_date);

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
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Dosar {caseRecord.case_number}</h1>
        <div className="flex gap-space-sm">
          {canRemindDeadline && (
            <button
              type="button"
              onClick={downloadDeadlineReminder}
              className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface"
            >
              Adaugă termenul în calendar
            </button>
          )}
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

      <LegalDocumentPreview caseRecord={caseRecord} institution={institution} />

      {isEditing && (
        <EditCaseForm caseRecord={caseRecord} onClose={() => setIsEditing(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
