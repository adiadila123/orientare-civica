import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NearestTownhallFinder } from '@/components/NearestTownhallFinder';

function mockGeolocation(
  implementation: (
    success: (position: { coords: { latitude: number; longitude: number } }) => void,
    error?: (err: { code: number }) => void
  ) => void
) {
  Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition: vi.fn(implementation) },
    configurable: true,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });
});

describe('NearestTownhallFinder', () => {
  it('shows an error when geolocation is not supported', async () => {
    Object.defineProperty(global.navigator, 'geolocation', { value: undefined, configurable: true });
    const user = userEvent.setup();

    render(<NearestTownhallFinder />);
    await user.click(screen.getByRole('button', { name: 'Găsește primăria mea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('nu suportă geolocalizarea');
  });

  it('shows an error when the user denies location access', async () => {
    mockGeolocation((_success, error) => error?.({ code: 1 }));
    const user = userEvent.setup();

    render(<NearestTownhallFinder />);
    await user.click(screen.getByRole('button', { name: 'Găsește primăria mea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('permite accesul la locație');
  });

  it('fetches and shows the nearest townhall on success', async () => {
    mockGeolocation((success) => success({ coords: { latitude: 44.43, longitude: 26.1 } }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            name: 'Primăria Sectorului 5',
            address: 'Str. Exemplu 1, București',
            distanceKm: 1.234,
            lat: 44.43,
            lon: 26.1,
          }),
      })
    );

    const user = userEvent.setup();
    render(<NearestTownhallFinder />);
    await user.click(screen.getByRole('button', { name: 'Găsește primăria mea' }));

    expect(await screen.findByText('Primăria Sectorului 5')).toBeInTheDocument();
    expect(screen.getByText('Str. Exemplu 1, București')).toBeInTheDocument();
    expect(screen.getByText('~1.2 km distanță')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Deschide pe hartă' }).getAttribute('href')).toContain(
      'mlat=44.43'
    );
  });

  it('shows the server error message when the lookup fails', async () => {
    mockGeolocation((success) => success({ coords: { latitude: 44.43, longitude: 26.1 } }));
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'Nu am găsit nicio primărie în OpenStreetMap în apropierea ta.' }),
      })
    );

    const user = userEvent.setup();
    render(<NearestTownhallFinder />);
    await user.click(screen.getByRole('button', { name: 'Găsește primăria mea' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Nu am găsit nicio primărie');
  });
});
