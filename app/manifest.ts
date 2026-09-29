import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Unde Merg? – Orientare Civică',
    short_name: 'Unde Merg?',
    description:
      'Află rapid la ce instituție publică trebuie să te adresezi pentru problema ta.',
    start_url: '/',
    display: 'standalone',
    background_color: '#faf8ff',
    theme_color: '#00236f',
    lang: 'ro',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  };
}
