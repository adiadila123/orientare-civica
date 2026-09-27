import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="max-w-3xl mx-auto px-margin py-space-xl flex flex-col items-center text-center gap-space-md">
      <h1 className="font-headline-lg text-headline-lg text-on-surface">Pagina nu a fost găsită</h1>
      <p className="font-body-lg text-body-lg text-on-surface-variant">
        Ne pare rău, pagina pe care o cauți nu există sau a fost mutată.
      </p>
      <Link href="/institutii" className="text-secondary underline underline-offset-2">
        Vezi lista instituțiilor
      </Link>
    </div>
  );
}
