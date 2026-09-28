import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { MappableInstitution } from '@/components/InstitutionsMap';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children, position }: { children: React.ReactNode; position: [number, number] }) => (
    <div data-testid="marker" data-position={position.join(',')}>
      {children}
    </div>
  ),
  Popup: ({ children }: { children: React.ReactNode }) => <div data-testid="popup">{children}</div>,
}));

import { InstitutionsMap } from '@/components/InstitutionsMap';

const anaf: MappableInstitution = {
  id: '1',
  code: 'ANAF',
  name: 'Agenția Națională de Administrare Fiscală',
  description: null,
  category: 'fiscal',
  website_url: 'https://www.anaf.ro',
  contact_form_url: null,
  phone: '021 387 10 00',
  email: null,
  address: 'Str. Apolodor nr. 17, Sector 5, București',
  latitude: 44.4283013,
  longitude: 26.0939112,
};

const anpc: MappableInstitution = {
  id: '2',
  code: 'ANPC',
  name: 'Autoritatea Națională pentru Protecția Consumatorilor',
  description: null,
  category: 'protectia_consumatorului',
  website_url: 'https://anpc.ro',
  contact_form_url: null,
  phone: '0377 755 100',
  email: 'cabinet@anpc.ro',
  address: 'Bulevardul Aviatorilor nr. 72, Sector 1, București',
  latitude: 44.4646903,
  longitude: 26.0868814,
};

describe('InstitutionsMap', () => {
  it('renders one marker per institution at its real coordinates', () => {
    render(<InstitutionsMap institutions={[anaf, anpc]} />);

    const markers = screen.getAllByTestId('marker');
    expect(markers).toHaveLength(2);
    expect(markers[0]).toHaveAttribute('data-position', '44.4283013,26.0939112');
    expect(markers[1]).toHaveAttribute('data-position', '44.4646903,26.0868814');
  });

  it('shows the institution name, address, phone, and a link to its guide in the popup', () => {
    render(<InstitutionsMap institutions={[anaf]} />);

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.getByText(anaf.address!)).toBeInTheDocument();
    expect(screen.getByText(`Telefon: ${anaf.phone}`)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Vezi ghidul complet' })).toHaveAttribute(
      'href',
      '/institutii/anaf'
    );
  });

  it('renders nothing extra when given an empty institution list', () => {
    render(<InstitutionsMap institutions={[]} />);
    expect(screen.queryAllByTestId('marker')).toHaveLength(0);
  });
});
