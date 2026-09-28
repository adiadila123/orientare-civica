import Link from 'next/link';
import { Logo } from '@/components/Logo';

const NAV_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm print:hidden">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
        <Link href="/">
          <Logo />
        </Link>
        <nav className="hidden md:flex items-center gap-space-lg" aria-label="Navigare principală">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
