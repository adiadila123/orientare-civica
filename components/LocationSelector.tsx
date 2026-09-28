'use client';

import { useEffect, useState } from 'react';
import localitati from '@/lib/data/localitati.json';

const STORAGE_KEY = 'unde-merg:locality';
const JUDETE_DATA = localitati as Record<string, string[]>;
const JUDETE = Object.keys(JUDETE_DATA).sort((a, b) => a.localeCompare(b, 'ro'));

export interface LocationSelection {
  judet: string;
  localitate: string;
}

interface LocationSelectorProps {
  onChange: (selection: LocationSelection | null) => void;
}

export function LocationSelector({ onChange }: LocationSelectorProps) {
  const [judet, setJudet] = useState('');
  const [localitate, setLocalitate] = useState('');

  // Restore the last selection after mount only, so server and first client
  // render match (localStorage isn't available during SSR).
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw) as LocationSelection;
      if (saved.judet && JUDETE_DATA[saved.judet]) {
        setJudet(saved.judet);
        if (saved.localitate && JUDETE_DATA[saved.judet].includes(saved.localitate)) {
          setLocalitate(saved.localitate);
        }
      }
    } catch {
      // Private window, blocked storage, or malformed JSON — start with no filter.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    onChange(judet ? { judet, localitate } : null);
    try {
      if (judet) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ judet, localitate }));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Storage unavailable — the filter still works for this render, just isn't remembered.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [judet, localitate]);

  const localitatiForJudet = judet ? (JUDETE_DATA[judet] ?? []) : [];

  return (
    <div className="flex flex-wrap gap-space-sm" role="group" aria-label="Filtrează după județ și localitate">
      <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
        Județ
        <select
          value={judet}
          onChange={(event) => {
            setJudet(event.target.value);
            setLocalitate('');
          }}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-body-sm text-body-sm text-on-surface"
        >
          <option value="">Toate județele</option>
          {JUDETE.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 font-label-md text-label-md text-on-surface-variant">
        Localitate
        <select
          value={localitate}
          onChange={(event) => setLocalitate(event.target.value)}
          disabled={!judet}
          className="rounded-lg border border-outline-variant bg-surface-container-lowest px-space-sm py-2 font-body-sm text-body-sm text-on-surface disabled:opacity-50"
        >
          <option value="">Toate localitățile</option>
          {localitatiForJudet.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
