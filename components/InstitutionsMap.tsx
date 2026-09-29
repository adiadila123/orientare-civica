'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Institution } from '@/lib/types';

// A small circular dot instead of Leaflet's default pin+shadow image —
// matches the app's minimalist design system better than the stock icon.
const defaultIcon = L.divIcon({
  className: 'institution-marker',
  html: '<span class="institution-marker-dot" aria-hidden="true"></span>',
  iconSize: [16, 16],
  iconAnchor: [8, 8],
  popupAnchor: [0, -10],
});

const BUCHAREST_CENTER: [number, number] = [44.4325, 26.1039];
const DEFAULT_ZOOM = 12;
const FOCUS_ZOOM = 15;

export type MappableInstitution = Institution & { latitude: number; longitude: number };

interface InstitutionsMapProps {
  institutions: MappableInstitution[];
}

function FlyToSelection({ institution }: { institution: MappableInstitution | null }) {
  const map = useMap();

  useEffect(() => {
    if (institution) {
      map.flyTo([institution.latitude, institution.longitude], FOCUS_ZOOM, { duration: 0.75 });
    }
  }, [institution, map]);

  return null;
}

export function InstitutionsMap({ institutions }: InstitutionsMapProps) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const selected = institutions.find((institution) => institution.code === selectedCode) ?? null;

  return (
    <div className="flex flex-col md:flex-row gap-space-md">
      <ul className="flex flex-row md:flex-col gap-space-xs overflow-x-auto md:overflow-x-visible md:overflow-y-auto md:max-h-[500px] md:w-64 md:flex-shrink-0">
        {institutions.map((institution) => (
          <li key={institution.code} className="flex-shrink-0">
            <button
              type="button"
              onClick={() => setSelectedCode(institution.code)}
              aria-pressed={institution.code === selectedCode}
              className={`w-full whitespace-nowrap md:whitespace-normal text-left rounded-lg px-space-sm py-2 font-body-sm text-body-sm transition-colors ${
                institution.code === selectedCode
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container'
              }`}
            >
              {institution.name}
            </button>
          </li>
        ))}
      </ul>

      <MapContainer
        center={BUCHAREST_CENTER}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={false}
        style={{ height: '500px', width: '100%', borderRadius: 'var(--radius-xl)' }}
      >
        <TileLayer
          attribution="Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ"
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
          maxNativeZoom={16}
          maxZoom={19}
        />
        <FlyToSelection institution={selected} />
        {institutions.map((institution) => (
          <Marker key={institution.code} position={[institution.latitude, institution.longitude]} icon={defaultIcon}>
            <Popup>
              <div className="flex flex-col gap-1">
                <strong>{institution.name}</strong>
                {institution.address && <span>{institution.address}</span>}
                {institution.phone && <span>Telefon: {institution.phone}</span>}
                <a href={`/institutii/${institution.code.toLowerCase()}`}>Vezi ghidul complet</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
