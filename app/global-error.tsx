'use client';

// global-error replaces the root layout entirely when it triggers, so it
// does not receive globals.css or the app's fonts — everything here is
// inline so the fallback still looks intentional rather than unstyled.
interface GlobalErrorProps {
  error: Error & { digest?: string };
  retry: () => void;
}

export default function GlobalError({ error, retry }: GlobalErrorProps) {
  return (
    <html lang="ro">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#faf8ff',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          color: '#1c1b1f',
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center', padding: '0 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#00236f', marginBottom: 12 }}>
            Ceva nu a mers bine
          </h1>
          <p style={{ fontSize: 16, color: '#444651', marginBottom: 24 }}>
            A apărut o eroare neașteptată la nivelul întregii aplicații. Te rugăm să reîncerci.
          </p>
          {error.digest && (
            <p style={{ fontSize: 13, color: '#767680', marginBottom: 24 }}>
              Cod de referință: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={() => retry()}
            style={{
              backgroundColor: '#00236f',
              color: '#ffffff',
              border: 'none',
              borderRadius: 8,
              padding: '10px 20px',
              fontSize: 15,
              cursor: 'pointer',
            }}
          >
            Încearcă din nou
          </button>
        </div>
      </body>
    </html>
  );
}
