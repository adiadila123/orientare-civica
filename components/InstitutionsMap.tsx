'use client';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Institution } from '@/lib/types';

// Leaflet's default marker icon resolves relative image paths that don't
// survive bundling (and Next's static-image-import object shape isn't
// consistent for assets imported from node_modules under Turbopack vs.
// Webpack) — pointing at the CDN copy, pinned to the installed version,
// sidesteps both problems.
const LEAFLET_VERSION = '1.9.4';
const LEAFLET_CDN_BASE = `https://cdn.jsdelivr.net/npm/leaflet@${LEAFLET_VERSION}/dist/images`;

const defaultIcon = L.icon({
  iconRetinaUrl: `${LEAFLET_CDN_BASE}/marker-icon-2x.png`,
  iconUrl: `${LEAFLET_CDN_BASE}/marker-icon.png`,
  shadowUrl: `${LEAFLET_CDN_BASE}/marker-shadow.png`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BUCHAREST_CENTER: [number, number] = [44.4325, 26.1039];

export type MappableInstitution = Institution & { latitude: number; longitude: number };

interface InstitutionsMapProps {
  institutions: MappableInstitution[];
}

export function InstitutionsMap({ institutions }: InstitutionsMapProps) {
  return (
    <MapContainer
      center={BUCHAREST_CENTER}
      zoom={12}
      scrollWheelZoom={false}
      style={{ height: '500px', width: '100%', borderRadius: 'var(--radius-xl)' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
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
  );
}
