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

const primarie: Institution = {
  id: '3',
  code: 'PRIMARIE',
  name: 'Primăria (generică, locală)',
  description: 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.',
  category: 'administratie_locala',
  website_url: null,
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

  it('filters by category via the dropdown', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, anpc]} />);

    await user.selectOptions(screen.getByLabelText('Categorie'), 'Fiscal');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
    expect(screen.queryByText(anpc.name)).not.toBeInTheDocument();
  });

  it('lists every category present in the data, including newly added ones, sorted alphabetically', () => {
    const cazier: Institution = {
      id: '4',
      code: 'CAZIER_JUDICIAR',
      name: 'Cazierul Judiciar (Poliția Română)',
      description: null,
      category: 'ordine_publica',
      website_url: 'https://hub.mai.gov.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    };
    const dgpci: Institution = {
      id: '5',
      code: 'DGPCI',
      name: 'Direcția Generală Permise de Conducere și Înmatriculări (DGPCI)',
      description: null,
      category: 'circulatie_rutiera',
      website_url: 'https://dgpci.mai.gov.ro',
      contact_form_url: null,
      phone: null,
      email: null,
      address: null,
    };
    render(<InstitutionCatalog institutions={[anaf, anpc, cazier, dgpci]} />);

    const select = screen.getByLabelText('Categorie') as HTMLSelectElement;
    const optionLabels = Array.from(select.options).map((option) => option.textContent);

    expect(optionLabels).toEqual(['Toate', 'Circulație rutieră', 'Fiscal', 'Ordine publică', 'Protecția consumatorilor']);
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

  it('personalizes PRIMARIE with the chosen locality, without fabricating contact data', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, primarie]} />);

    await user.selectOptions(screen.getByLabelText('Județ'), 'Alba');
    await user.selectOptions(screen.getByLabelText('Localitate'), 'Albac');

    expect(screen.getByText('Primăria — Albac, jud. Alba')).toBeInTheDocument();
    expect(screen.queryByText('Primăria (generică, locală)')).not.toBeInTheDocument();
    expect(screen.getByText(/Caută online „Primăria Albac”/)).toBeInTheDocument();
    expect(screen.getByText(anaf.name)).toBeInTheDocument();
  });

  it('does not personalize national institutions like ANAF when a locality is chosen', async () => {
    const user = userEvent.setup();
    render(<InstitutionCatalog institutions={[anaf, primarie]} />);

    await user.selectOptions(screen.getByLabelText('Județ'), 'Alba');
    await user.selectOptions(screen.getByLabelText('Localitate'), 'Albac');

    expect(screen.getByText(anaf.name)).toBeInTheDocument();
  });
});
