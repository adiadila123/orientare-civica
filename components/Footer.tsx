import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/cum-functioneaza', label: 'Cum funcționează' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

export function Footer() {
  return (
    <footer className="w-full bg-surface-container-low mt-space-xl">
      <div className="max-w-7xl mx-auto px-margin py-space-xl flex flex-col gap-space-md">
        <nav aria-label="Navigare footer" className="flex flex-wrap gap-space-md md:hidden">
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          Dispecerat Civic Gratuit: <strong className="text-on-surface">0800 008 123</strong>{' '}
          (Luni – Vineri: 08:00 – 18:00)
        </p>
        <p className="font-body-sm text-body-sm text-on-surface-variant">
          © 2026 Unde merg? – Orientare Civică. Acest serviciu civic nu constituie consultanță
          juridică autorizată. Informațiile prezentate au scop strict orientativ.
        </p>
      </div>
    </footer>
  );
}
