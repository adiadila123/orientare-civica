'use client';

import { useEffect, useState } from 'react';
import { LegalDocumentPreview } from '@/components/LegalDocumentPreview';
import { EditCaseForm } from '@/components/EditCaseForm';
import { CaseStatusTracker } from '@/components/CaseStatusTracker';
import { buildContestationDeadlineIcs } from '@/lib/ics';
import { rememberRecord } from '@/lib/myRecordsStorage';
import type { Case, Institution } from '@/lib/types';

interface CaseViewProps {
  initialCase: Case;
  institution: Institution;
  initialSiblingCases?: Case[];
}

export function CaseView({ initialCase, institution, initialSiblingCases = [] }: CaseViewProps) {
  const [caseRecord, setCaseRecord] = useState(initialCase);
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [siblingCases, setSiblingCases] = useState(initialSiblingCases);
  const [isLinking, setIsLinking] = useState(false);
  const [linkCaseNumber, setLinkCaseNumber] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  useEffect(() => {
    if (!showSuccess) {
      return;
    }
    const timeoutId = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timeoutId);
  }, [showSuccess]);

  // Backfills "Dosarele mele" for a case that predates that feature, or that
  // was opened on a browser/session that never went through the creation flow.
  useEffect(() => {
    rememberRecord({
      id: caseRecord.id,
      type: 'case',
      number: caseRecord.case_number,
      institutionName: institution.name,
      createdAt: caseRecord.created_at,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseRecord.id]);

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

  async function handleLinkCase() {
    const trimmed = linkCaseNumber.trim();
    if (trimmed.length === 0) {
      return;
    }
    setIsSubmittingLink(true);
    setLinkError(null);
    try {
      const response = await fetch(`/api/cases/${caseRecord.id}/link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseNumber: trimmed }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setLinkError(data?.error ?? 'Nu am putut lega dosarele.');
        return;
      }
      const group = (data?.group ?? []) as Case[];
      setSiblingCases(group.filter((c) => c.id !== caseRecord.id));
      setLinkCaseNumber('');
      setIsLinking(false);
    } catch {
      setLinkError('Nu am putut lega dosarele.');
    } finally {
      setIsSubmittingLink(false);
    }
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
          {institution.associated_court && (
            <>
              <a
                href="https://www.ghiseul.ro"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface"
              >
                Achită taxa (Ghișeul.ro)
              </a>
              <a
                href="https://registratura.rejust.ro"
                target="_blank"
                rel="noreferrer"
                className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface"
              >
                Depune electronic
              </a>
            </>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg"
          >
            Editează
          </button>
        </div>
      </div>

      <div className="print:hidden">
        <CaseStatusTracker caseId={caseRecord.id} />
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm print:hidden">
        <h2 className="font-title-md text-title-md text-on-surface">Dosare legate</h2>
        {siblingCases.length > 0 ? (
          <ul className="flex flex-col gap-space-xs">
            {siblingCases.map((sibling) => (
              <li key={sibling.id}>
                <a href={`/dosare/${sibling.id}`} className="text-secondary underline underline-offset-2">
                  {sibling.case_number}
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Acest dosar nu este încă legat de altele.
          </p>
        )}

        {isLinking ? (
          <div className="flex flex-col gap-space-xs">
            <label htmlFor="link-case-number" className="font-label-sm text-label-sm text-on-surface-variant">
              Numărul dosarului cu care vrei să legi acesta (ex: o altă amendă din același episod)
            </label>
            <div className="flex gap-space-sm flex-wrap">
              <input
                id="link-case-number"
                type="text"
                value={linkCaseNumber}
                onChange={(event) => setLinkCaseNumber(event.target.value)}
                placeholder="GD-2026-0002"
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm flex-1 min-w-40"
              />
              <button
                type="button"
                onClick={handleLinkCase}
                disabled={isSubmittingLink || linkCaseNumber.trim().length === 0}
                className="rounded-lg bg-primary text-on-primary px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50"
              >
                {isSubmittingLink ? 'Se leagă...' : 'Leagă dosarul'}
              </button>
            </div>
            {linkError && (
              <p role="alert" className="font-label-sm text-label-sm text-error">
                {linkError}
              </p>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsLinking(true)}
            className="rounded-lg border border-outline-variant px-space-md py-2 font-label-lg text-label-lg text-on-surface self-start"
          >
            Leagă un alt dosar
          </button>
        )}
      </div>

      <LegalDocumentPreview caseRecord={caseRecord} institution={institution} />

      {isEditing && (
        <EditCaseForm caseRecord={caseRecord} onClose={() => setIsEditing(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
