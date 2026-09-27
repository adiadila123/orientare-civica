import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Institution } from '@/lib/types';

interface InstitutionCardProps {
  institution: Institution;
}

export function InstitutionCard({ institution }: InstitutionCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{institution.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 text-sm">
        {institution.description && <p>{institution.description}</p>}
        {institution.website_url && (
          <p>
            <a href={institution.website_url} target="_blank" rel="noreferrer">
              {institution.website_url}
            </a>
          </p>
        )}
        {institution.phone && <p>Telefon: {institution.phone}</p>}
        {institution.email && <p>Email: {institution.email}</p>}
      </CardContent>
    </Card>
  );
}
