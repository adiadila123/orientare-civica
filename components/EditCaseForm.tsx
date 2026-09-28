'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { isValidCnp } from '@/lib/cnp';
import type { Case } from '@/lib/types';

interface EditCaseFormProps {
  caseRecord: Case;
  onClose: () => void;
  onSaved: (updated: Case) => void;
}

type SaveState = 'idle' | 'saving' | 'error';

export function EditCaseForm({ caseRecord, onClose, onSaved }: EditCaseFormProps) {
  const [petitionerName, setPetitionerName] = useState(caseRecord.petitioner_name ?? '');
  const [petitionerCnp, setPetitionerCnp] = useState(caseRecord.petitioner_cnp ?? '');
  const [cnpVisible, setCnpVisible] = useState(false);
  const [petitionerAddress, setPetitionerAddress] = useState(caseRecord.petitioner_address ?? '');
  const [petitionerEmail, setPetitionerEmail] = useState(caseRecord.petitioner_email ?? '');
  const [pvSeries, setPvSeries] = useState(caseRecord.pv_series ?? '');
  const [pvNumber, setPvNumber] = useState(caseRecord.pv_number ?? '');
  const [pvIssueDate, setPvIssueDate] = useState(caseRecord.pv_issue_date ?? '');
  const [pvAmount, setPvAmount] = useState(caseRecord.pv_amount?.toString() ?? '');
  const [pvIssuingAgent, setPvIssuingAgent] = useState(caseRecord.pv_issuing_agent ?? '');
  const [pvPenaltyPoints, setPvPenaltyPoints] = useState(caseRecord.pv_penalty_points?.toString() ?? '');
  const [grounds, setGrounds] = useState(caseRecord.grounds ?? '');
  const [annexes, setAnnexes] = useState<string[]>(caseRecord.annexes);
  const [newAnnex, setNewAnnex] = useState('');

  const [cnpError, setCnpError] = useState<string | null>(null);
  const [pvAmountError, setPvAmountError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  const MAX_PV_AMOUNT = 2_147_483_647;

  function addAnnex() {
    if (newAnnex.trim().length === 0) {
      return;
    }
    setAnnexes((current) => [...current, newAnnex.trim()]);
    setNewAnnex('');
  }

  function removeAnnex(annex: string) {
    setAnnexes((current) => current.filter((item) => item !== annex));
  }

  function buildPayload() {
    return {
      petitionerName,
      petitionerCnp,
      petitionerAddress,
      petitionerEmail: petitionerEmail || null,
      petitionerPhone: caseRecord.petitioner_phone,
      pvSeries,
      pvNumber,
      pvIssueDate: pvIssueDate || null,
      pvAmount: Number(pvAmount) || 0,
      pvPenaltyPoints: pvPenaltyPoints ? Number(pvPenaltyPoints) : null,
      pvIssuingAgent: pvIssuingAgent || null,
      grounds,
      annexes,
    };
  }

  function downloadBackup() {
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_contestatie_${caseRecord.case_number}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    let hasError = false;
    if (!isValidCnp(petitionerCnp)) {
      setCnpError('CNP invalid (trebuie să conțină exact 13 cifre valide)');
      hasError = true;
    } else {
      setCnpError(null);
    }

    const amount = Number(pvAmount) || 0;
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_PV_AMOUNT) {
      setPvAmountError('Suma amenzii este invalidă');
      hasError = true;
    } else {
      setPvAmountError(null);
    }

    if (hasError) {
      return;
    }

    setSaveState('saving');
    setLastAttemptAt(Date.now());

    try {
      const response = await fetch(`/api/cases/${caseRecord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) {
        throw new Error('save-failed');
      }

      const updated = (await response.json()) as Case;
      setSaveState('idle');
      onSaved(updated);
    } catch {
      setSaveState('error');
    }
  }

  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-on-surface/40" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-lg outline-none">
            <div className="flex items-center justify-between">
              <Dialog.Title className="font-title-md text-title-md text-on-surface">
                Editează datele contestației
              </Dialog.Title>
              <Dialog.Close aria-label="Închide" className="text-on-surface-variant">
                ✕
              </Dialog.Close>
            </div>

            {saveState === 'error' && (
              <div role="alert" className="bg-error-container rounded-lg p-space-md flex flex-col gap-space-sm">
                <p className="font-body-sm text-body-sm text-on-error-container">
                  Datele tale NU au fost pierdute. A apărut o eroare de conexiune la salvare.
                </p>
                <p className="font-label-sm text-label-sm text-on-error-container">
                  Ultima încercare: {lastAttemptAt ? new Date(lastAttemptAt).toLocaleTimeString('ro-RO') : '—'}
                </p>
                <div className="flex gap-space-sm">
                  <button type="button" onClick={downloadBackup} className="text-secondary underline underline-offset-2">
                    Descarcă backup
                  </button>
                  <button type="button" onClick={handleSave} className="text-secondary underline underline-offset-2">
                    Reîncearcă
                  </button>
                </div>
              </div>
            )}

            <fieldset className="flex flex-col gap-space-sm">
              <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Petent</legend>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Nume și prenume
                <input
                  value={petitionerName}
                  onChange={(e) => setPetitionerName(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <div className="flex flex-col gap-1">
                <label htmlFor="cnp-input" className="font-label-md text-label-md text-on-surface-variant">
                  CNP
                </label>
                <div className="flex gap-space-sm items-center">
                  <input
                    id="cnp-input"
                    type={cnpVisible ? 'text' : 'password'}
                    value={petitionerCnp}
                    onChange={(e) => setPetitionerCnp(e.target.value)}
                    aria-invalid={cnpError ? true : undefined}
                    aria-describedby={cnpError ? 'cnp-error' : undefined}
                    className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setCnpVisible((visible) => !visible)}
                    className="text-secondary underline underline-offset-2"
                  >
                    {cnpVisible ? 'Ascunde' : 'Arată'}
                  </button>
                </div>
                {cnpError && (
                  <p id="cnp-error" role="alert" className="font-label-sm text-label-sm text-error">
                    {cnpError}
                  </p>
                )}
              </div>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Adresă
                <input
                  value={petitionerAddress}
                  onChange={(e) => setPetitionerAddress(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Email
                <input
                  type="email"
                  value={petitionerEmail}
                  onChange={(e) => setPetitionerEmail(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
            </fieldset>

            <fieldset className="flex flex-col gap-space-sm">
              <legend className="font-title-md text-title-md text-on-surface mb-space-xs">PV & sancțiune</legend>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Serie PV
                <input
                  value={pvSeries}
                  onChange={(e) => setPvSeries(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Număr PV
                <input
                  value={pvNumber}
                  onChange={(e) => setPvNumber(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Data emiterii
                <input
                  type="date"
                  value={pvIssueDate}
                  onChange={(e) => setPvIssueDate(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Suma amenzii (LEI)
                <input
                  type="number"
                  value={pvAmount}
                  onChange={(e) => setPvAmount(e.target.value)}
                  aria-invalid={pvAmountError ? true : undefined}
                  aria-describedby={pvAmountError ? 'pv-amount-error' : undefined}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              {pvAmountError && (
                <p id="pv-amount-error" role="alert" className="font-label-sm text-label-sm text-error">
                  {pvAmountError}
                </p>
              )}
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Agent emitent
                <input
                  value={pvIssuingAgent}
                  onChange={(e) => setPvIssuingAgent(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
              <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
                Puncte de penalizare
                <input
                  type="number"
                  value={pvPenaltyPoints}
                  onChange={(e) => setPvPenaltyPoints(e.target.value)}
                  className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
              </label>
            </fieldset>

            <fieldset className="flex flex-col gap-space-sm">
              <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Motivele</legend>
              <textarea
                value={grounds}
                onChange={(e) => setGrounds(e.target.value)}
                rows={4}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
              />
            </fieldset>

            <fieldset className="flex flex-col gap-space-sm">
              <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Anexe</legend>
              <ul className="flex flex-col gap-space-xs">
                {annexes.map((annex) => (
                  <li key={annex} className="flex items-center justify-between font-body-sm text-body-sm text-on-surface">
                    <span>{annex}</span>
                    <button
                      type="button"
                      onClick={() => removeAnnex(annex)}
                      aria-label={`Șterge ${annex}`}
                      className="text-error"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex gap-space-sm">
                <input
                  value={newAnnex}
                  onChange={(e) => setNewAnnex(e.target.value)}
                  placeholder="Denumire document"
                  className="flex-1 rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
                />
                <button type="button" onClick={addAnnex} className="text-secondary underline underline-offset-2">
                  Adaugă
                </button>
              </div>
            </fieldset>

            <button
              type="button"
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50"
            >
              {saveState === 'saving' ? 'Se salvează...' : 'Salvează'}
            </button>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
