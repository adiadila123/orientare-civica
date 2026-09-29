'use client';

import { useState } from 'react';

interface NearestTownhallResult {
  name: string;
  address: string | null;
  distanceKm: number;
  lat: number;
  lon: number;
}

type Status = 'idle' | 'locating' | 'loading' | 'success' | 'error';

export function NearestTownhallFinder() {
  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<NearestTownhallResult | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  function handleFind() {
    if (!navigator.geolocation) {
      setStatus('error');
      setErrorMessage('Browserul tău nu suportă geolocalizarea.');
      return;
    }

    setStatus('locating');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setStatus('loading');
        const { latitude, longitude } = position.coords;

        fetch(`/api/nearest-townhall?lat=${latitude}&lon=${longitude}`)
          .then(async (response) => {
            if (!response.ok) {
              const body = await response.json().catch(() => null);
              throw new Error(body?.error ?? 'request failed');
            }
            return response.json() as Promise<NearestTownhallResult>;
          })
          .then((data) => {
            setResult(data);
            setStatus('success');
          })
          .catch((error: Error) => {
            setStatus('error');
            setErrorMessage(error.message || 'Nu am putut găsi o primărie în apropiere. Încearcă din nou.');
          });
      },
      () => {
        setStatus('error');
        setErrorMessage('Nu am putut accesa locația ta — permite accesul la locație și încearcă din nou.');
      }
    );
  }

  const isBusy = status === 'locating' || status === 'loading';

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm p-space-lg">
      <h2 className="font-title-md text-title-md text-on-surface mb-space-xs">
        Găsește cea mai apropiată primărie
      </h2>
      <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-sm">
        Folosim locația ta și date din OpenStreetMap (contribuție comunitară, neverificate de noi)
        pentru a estima cea mai apropiată primărie.
      </p>
      <button
        type="button"
        onClick={handleFind}
        disabled={isBusy}
        className="bg-primary text-on-primary rounded-lg px-space-md py-2 font-label-lg text-label-lg disabled:opacity-50"
      >
        {status === 'locating' ? 'Se localizează...' : status === 'loading' ? 'Se caută...' : 'Găsește primăria mea'}
      </button>

      {status === 'error' && (
        <p role="alert" className="font-body-sm text-body-sm text-error mt-space-sm">
          {errorMessage}
        </p>
      )}

      {status === 'success' && result && (
        <div className="mt-space-sm flex flex-col gap-space-xs">
          <p className="font-title-sm text-title-sm text-on-surface">{result.name}</p>
          {result.address && (
            <p className="font-body-sm text-body-sm text-on-surface-variant">{result.address}</p>
          )}
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            ~{result.distanceKm.toFixed(1)} km distanță
          </p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${result.lat}&mlon=${result.lon}#map=17/${result.lat}/${result.lon}`}
            target="_blank"
            rel="noreferrer"
            className="text-secondary underline underline-offset-2 font-body-sm text-body-sm"
          >
            Deschide pe hartă
          </a>
        </div>
      )}
    </div>
  );
}
