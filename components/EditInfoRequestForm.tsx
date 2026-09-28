'use client';

import { useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import type { InfoRequest } from '@/lib/types';

interface EditInfoRequestFormProps {
  infoRequest: InfoRequest;
  onClose: () => void;
  onSaved: (updated: InfoRequest) => void;
}

type SaveState = 'idle' | 'saving' | 'error';

export function EditInfoRequestForm({ infoRequest, onClose, onSaved }: EditInfoRequestFormProps) {
  const [requesterName, setRequesterName] = useState(infoRequest.requester_name ?? '');
  const [requesterAddress, setRequesterAddress] = useState(infoRequest.requester_address ?? '');
  const [requesterEmail, setRequesterEmail] = useState(infoRequest.requester_email ?? '');
  const [requesterPhone, setRequesterPhone] = useState(infoRequest.requester_phone ?? '');
  const [informationRequested, setInformationRequested] = useState(infoRequest.information_requested);

  const [informationError, setInformationError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastAttemptAt, setLastAttemptAt] = useState<number | null>(null);

  function buildPayload() {
    return {
      requesterName: requesterName || null,
      requesterAddress: requesterAddress || null,
      requesterEmail: requesterEmail || null,
      requesterPhone: requesterPhone || null,
      informationRequested,
    };
  }

  function downloadBackup() {
    const payload = buildPayload();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_cerere_${infoRequest.request_number}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleSave() {
    if (informationRequested.trim().length === 0) {
      setInformationError('Descrie ce informație vrei să afli');
      return;
    }
    setInformationError(null);
    setSaveState('saving');
    setLastAttemptAt(Date.now());

    try {
      const response = await fetch(`/api/info-requests/${infoRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });

      if (!response.ok) {
        throw new Error('save-failed');
      }

      const updated = (await response.json()) as InfoRequest;
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
              Editează cererea de informații
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
            <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Solicitant</legend>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
              Nume și prenume
              <input
                value={requesterName}
                onChange={(e) => setRequesterName(e.target.value)}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
              />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
              Adresă
              <input
                value={requesterAddress}
                onChange={(e) => setRequesterAddress(e.target.value)}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
              />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
              Email
              <input
                type="email"
                value={requesterEmail}
                onChange={(e) => setRequesterEmail(e.target.value)}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
              />
            </label>
            <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
              Telefon
              <input
                type="tel"
                value={requesterPhone}
                onChange={(e) => setRequesterPhone(e.target.value)}
                className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
              />
            </label>
          </fieldset>

          <fieldset className="flex flex-col gap-space-sm">
            <legend className="font-title-md text-title-md text-on-surface mb-space-xs">Informația solicitată</legend>
            <textarea
              value={informationRequested}
              onChange={(e) => setInformationRequested(e.target.value)}
              rows={5}
              aria-invalid={informationError ? true : undefined}
              aria-describedby={informationError ? 'information-error' : undefined}
              className="rounded-lg border border-outline-variant px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
            />
            {informationError && (
              <p id="information-error" role="alert" className="font-label-sm text-label-sm text-error">
                {informationError}
              </p>
            )}
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
