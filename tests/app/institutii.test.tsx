import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('@/lib/db', () => ({
  createDb: vi.fn().mockReturnValue({}),
}));

vi.mock('@/lib/institutions', () => ({
  listInstitutions: vi.fn(),
}));

import InstitutiiPage from '@/app/institutii/page';
import { listInstitutions } from '@/lib/institutions';

describe('InstitutiiPage', () => {
  it('renders every institution returned by listInstitutions', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([
      {
        id: '1',
        code: 'ANAF',
        name: 'Agenția Națională de Administrare Fiscală',
        description: null,
        category: 'fiscal',
        website_url: 'https://www.anaf.ro',
        contact_form_url: null,
        phone: null,
        email: null,
        address: null,
      },
    ]);

    render(await InstitutiiPage());

    expect(screen.getByText('Agenția Națională de Administrare Fiscală')).toBeInTheDocument();
  });

  it('shows a fallback message when no institutions are returned', async () => {
    vi.mocked(listInstitutions).mockResolvedValue([]);

    render(await InstitutiiPage());

    expect(screen.getByText(/nu este disponibilă momentan/)).toBeInTheDocument();
  });
});
