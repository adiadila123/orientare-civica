'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { Logo } from '@/components/Logo';

const NAV_LINKS = [
  { href: '/', label: 'Acasă' },
  { href: '/institutii', label: 'Instituții' },
  { href: '/harta', label: 'Hartă' },
  { href: '/intrebari-frecvente', label: 'Întrebări frecvente' },
];

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-md shadow-sm print:hidden">
      <div className="h-20 max-w-7xl mx-auto px-margin flex items-center justify-between">
        <Link href="/" onClick={() => setIsMenuOpen(false)}>
          <Logo />
        </Link>

        <nav
          aria-label="Navigare principală"
          className={
            isMenuOpen
              ? 'flex flex-col gap-space-sm absolute top-20 left-0 right-0 z-50 bg-surface px-margin py-space-md shadow-sm border-t border-outline-variant md:static md:flex-row md:items-center md:gap-space-lg md:border-0 md:shadow-none md:p-0 md:bg-transparent'
              : 'hidden md:flex md:items-center md:gap-space-lg'
          }
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setIsMenuOpen(false)}
              className="block py-2 md:py-0 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          onClick={() => setIsMenuOpen((open) => !open)}
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? 'Închide meniul' : 'Deschide meniul'}
          className="md:hidden text-on-surface p-2 -mr-2"
        >
          {isMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </div>

      {isMenuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setIsMenuOpen(false)}
          className="fixed inset-0 top-20 z-40 md:hidden"
        />
      )}
    </header>
  );
}
