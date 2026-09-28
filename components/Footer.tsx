import Link from 'next/link';

const FOOTER_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

const LEGAL_LINKS = [
  { href: '/termeni-si-conditii', label: 'Termeni și condiții' },
  { href: '/confidentialitate', label: 'Confidențialitate' },
  { href: '/politica-cookie-uri', label: 'Cookie-uri' },
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
          Pentru urgențe, sună la <strong className="text-on-surface">112</strong>.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-space-sm pt-space-sm border-t border-outline-variant">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            © {new Date().getFullYear()} Unde merg? – Orientare Civică. Serviciu informativ, fără
            valoare de consultanță juridică.
          </p>
          <nav aria-label="Informații legale" className="flex flex-wrap gap-space-md">
            {LEGAL_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
