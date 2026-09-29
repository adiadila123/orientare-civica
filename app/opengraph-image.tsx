import { ImageResponse } from 'next/og';

export const alt = 'Unde merg? – Orientare Civică';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 32,
          backgroundColor: '#faf8ff',
        }}
      >
        <svg width="140" height="140" viewBox="0 0 32 32">
          <rect width="32" height="32" rx="8" fill="#1E3A8A" />
          <path d="M6 22L13 10L18 17L21 12L26 22Z" fill="#38BDF8" />
          <circle cx="21" cy="12" r="1.5" fill="#ffffff" />
          <path d="M6 22C10 19 18 19 26 22" stroke="#60A5FA" strokeWidth="1.5" fill="none" />
        </svg>
        <div
          style={{
            display: 'flex',
            fontSize: 72,
            fontWeight: 700,
            color: '#00236f',
            letterSpacing: -1.5,
          }}
        >
          Unde merg?
        </div>
        <div style={{ display: 'flex', fontSize: 32, color: '#444651' }}>Orientare Civică</div>
        <div style={{ display: 'flex', fontSize: 24, color: '#767680', marginTop: 16 }}>
          Află rapid la ce instituție publică trebuie să te adresezi
        </div>
      </div>
    ),
    { ...size }
  );
}
