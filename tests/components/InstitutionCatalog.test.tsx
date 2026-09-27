import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InstitutionCatalog } from '@/components/InstitutionCatalog';
import type { Institution } from '@/lib/types';

const anaf: Institution = {
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
};

const anpc: Institution = {
  id: '2',
  code: 'ANPC',
  name: 'Autoritatea Națională pentru Protecția Consumatorilor',
  description: null,
  category: 'protectia_consumatorului',
  website_url: 'https://anpc.ro',
  contact_form_url: null,
  phone: null,
  email: null,
  address: null,
};

describe('InstitutionCatalog', () => {
  it('renders every institution by default', () => {
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);
    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.getByText(anpc.name)).toBeInTheDocument();
  });

  it('filters by search text', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'fiscală');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });

  it('shows a fallback message when the search matches nothing', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'xyz-inexistent');

    expect(screen.getByText('Nicio instituție nu corespunde căutării tale.')).toBeInTheDocument();
  });

  it('filters by category pill', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.click(screen.getByRole('button', { name: 'Fiscal' }));

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });

  it('shows the M1 fallback message when no institutions are provided at all', () => {
    render(<InstitutionCatalog institutions={[]} />);
    expect(screen.getByText(/nu este disponibilă momentan/)).toBeInTheDocument();
  });

  it('matches search text typed without diacritics', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'protectia');

    expect(screen.getByText(anpc.name)).toBeInTheDocument();
    expect(screen.queryByText(anaf.name)).not.toBeInTheDocument();
  });

  it('matches search text against the institution code (acronym)', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.type(screen.getByLabelText('Caută o instituție'), 'anaf');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });
});
