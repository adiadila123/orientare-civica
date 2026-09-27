import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Institution } from '@/lib/types';

interface InstitutionCardProps {
  institution: Institution;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <Card className="shadow-sm ring-0">
      <CardHeader>
        <CardTitle className="font-title-md text-title-md text-on-surface">
          {institution.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-space-xs font-body-sm text-body-sm text-on-surface-variant">
        {institution.description && <p>{institution.description}</p>}
        {institution.website_url && (
          <p>
            <a
              href={institution.website_url}
              target="_blank"
              rel="noreferrer"
              className="text-secondary underline underline-offset-2"
            >
              {institution.website_url}
            </a>
          </p>
        )}
        {institution.phone && <p>Telefon: {institution.phone}</p>}
        {institution.email && <p>Email: {institution.email}</p>}
        <p>
          <Link
            href={`/institutii/${institution.code.toLowerCase()}`}
            className="text-secondary underline underline-offset-2"
          >
            Vezi ghidul complet
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
