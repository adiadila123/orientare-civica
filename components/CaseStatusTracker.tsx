'use client';

import { useEffect, useState } from 'react';
import {
  getCaseStatus,
  markCaseSent,
  markCaseResponseReceived,
  type CaseLocalStatus,
} from '@/lib/caseStatusStorage';

interface CaseStatusTrackerProps {
  caseId: string;
  sentLabel?: string;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString('ro-RO');
}

export function CaseStatusTracker({ caseId, sentLabel = 'Am trimis contestația' }: CaseStatusTrackerProps) {
  const [status, setStatus] = useState<CaseLocalStatus>({ sentAt: null, responseReceivedAt: null });

  // Read from localStorage after mount only, so server and first client
  // render match (localStorage isn't available during SSR).
  useEffect(() => {
    setStatus(getCaseStatus(caseId));
  }, [caseId]);

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex flex-col gap-space-sm print:hidden">
      <h2 className="font-title-md text-title-md text-on-surface">Urmărește dosarul</h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant">
        Bifele de mai jos sunt salvate doar în acest browser, ca să ții minte unde ai rămas — nu
        înlocuiesc un răspuns oficial de la instituție.
      </p>
      <div className="flex flex-col gap-space-sm">
        <label className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
          <input
            type="checkbox"
            checked={Boolean(status.sentAt)}
            onChange={() => setStatus(markCaseSent(caseId))}
            disabled={Boolean(status.sentAt)}
          />
          {sentLabel}
          {status.sentAt && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              ({formatTimestamp(status.sentAt)})
            </span>
          )}
        </label>
        <label className="flex items-center gap-space-sm font-body-sm text-body-sm text-on-surface">
          <input
            type="checkbox"
            checked={Boolean(status.responseReceivedAt)}
            onChange={() => setStatus(markCaseResponseReceived(caseId))}
            disabled={Boolean(status.responseReceivedAt)}
          />
          Am primit răspuns
          {status.responseReceivedAt && (
            <span className="font-label-sm text-label-sm text-on-surface-variant">
              ({formatTimestamp(status.responseReceivedAt)})
            </span>
          )}
        </label>
      </div>
    </div>
  );
}
