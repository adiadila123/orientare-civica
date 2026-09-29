'use client';

import { useEffect, useState } from 'react';
import { listMyRecords, forgetRecord, type MyRecord } from '@/lib/myRecordsStorage';
import { getCaseStatus } from '@/lib/caseStatusStorage';

const TYPE_LABELS: Record<MyRecord['type'], string> = {
  case: 'Contestație',
  'info-request': 'Cerere de informații',
};

function recordHref(record: MyRecord): string {
  return record.type === 'case' ? `/dosare/${record.id}` : `/solicitare-informatii/${record.id}`;
}

function statusLabel(record: MyRecord): string {
  const status = getCaseStatus(record.id);
  if (status.responseReceivedAt) {
    return 'Răspuns primit';
  }
  if (status.sentAt) {
    return 'Trimis';
  }
  return 'În lucru';
}

export function MyRecordsView() {
  const [records, setRecords] = useState<MyRecord[]>([]);

  // Read from localStorage after mount only, so server and first client
  // render match (localStorage isn't available during SSR) — the initial
  // empty list is also the correct "nothing saved yet" state.
  useEffect(() => {
    setRecords(listMyRecords());
  }, []);

  function handleForget(id: string) {
    setRecords(forgetRecord(id));
  }

  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col gap-space-lg">
      <div className="flex flex-col gap-space-xs">
        <h1 className="font-headline-lg text-headline-lg text-on-surface">Dosarele mele</h1>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Lista de mai jos este salvată doar în acest browser — nu există cont, deci nu se
          sincronizează pe alte dispozitive.
        </p>
      </div>

      {records.length === 0 ? (
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Nu ai încă niciun dosar sau cerere generată pe acest dispozitiv.
        </p>
      ) : (
        <ul className="flex flex-col gap-space-sm">
          {records.map((record) => (
            <li
              key={record.id}
              className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg flex items-center justify-between gap-space-sm flex-wrap"
            >
              <div className="flex flex-col gap-1">
                <a href={recordHref(record)} className="font-title-md text-title-md text-on-surface underline underline-offset-2">
                  {record.number}
                </a>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  {TYPE_LABELS[record.type]} · {record.institutionName}
                </span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  {statusLabel(record)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleForget(record.id)}
                aria-label={`Șterge ${record.number} din istoric`}
                className="font-label-sm text-label-sm text-error underline underline-offset-2"
              >
                Șterge din istoric
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
