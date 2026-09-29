import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: '--font-plus-jakarta-sans' }),
}));

import RootLayout, { metadata } from '@/app/layout';

describe('RootLayout metadata', () => {
  it('sets the canonical URL, openGraph, and twitter card for the homepage', () => {
    expect(metadata.alternates?.canonical).toBe('/');
    expect(metadata.openGraph).toMatchObject({
      type: 'website',
      locale: 'ro_RO',
      siteName: 'Unde Merg? – Orientare Civică',
    });
    expect(metadata.twitter).toMatchObject({ card: 'summary_large_image' });
  });

  it('embeds WebSite JSON-LD with the site name and language', () => {
    const { container } = render(
      <RootLayout params={Promise.resolve({})}>
        <div>child</div>
      </RootLayout>
    );

    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const jsonLd = JSON.parse(script!.innerHTML);

    expect(jsonLd).toMatchObject({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Unde Merg? – Orientare Civică',
      inLanguage: 'ro-RO',
    });
  });
});
