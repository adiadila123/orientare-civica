import { afterEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

describe('ServiceWorkerRegistration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
  });

  it('registers /sw.js when the browser supports service workers', () => {
    const register = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'serviceWorker', {
      value: { register },
      configurable: true,
    });

    render(<ServiceWorkerRegistration />);

    expect(register).toHaveBeenCalledWith('/sw.js');
  });

  it('renders nothing and does not throw when service workers are unsupported', () => {
    delete (navigator as { serviceWorker?: unknown }).serviceWorker;
    const { container } = render(<ServiceWorkerRegistration />);
    expect(container).toBeEmptyDOMElement();
  });
});
