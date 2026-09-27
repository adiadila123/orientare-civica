insert into institutions (code, name, description, category, website_url) values
  ('ANPC', 'Autoritatea Națională pentru Protecția Consumatorilor', 'Instituția responsabilă pentru protecția drepturilor consumatorilor.', 'protectia_consumatorului', 'https://anpc.ro'),
  ('ANAF', 'Agenția Națională de Administrare Fiscală', 'Administrează impozitele, taxele și contribuțiile sociale.', 'fiscal', 'https://www.anaf.ro'),
  ('PRIMARIE', 'Primăria (generică, locală)', 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.', 'administratie_locala', null),
  ('POLITIE_LOCALA', 'Poliția Locală', 'Sesizări stradale și contravenții locale; site-ul variază în funcție de localitate.', 'ordine_publica', null),
  ('ANRE', 'Autoritatea Națională de Reglementare în Domeniul Energiei', 'Reglementează piața de energie electrică și gaze naturale.', 'energie', 'https://www.anre.ro'),
  ('ANCOM', 'Autoritatea Națională pentru Administrare și Reglementare în Comunicații', 'Reglementează piața de telecomunicații.', 'telecomunicatii', 'https://www.ancom.ro'),
  ('CNAS', 'Casa Națională de Asigurări de Sănătate', 'Administrează sistemul de asigurări sociale de sănătate.', 'sanatate', 'https://cnas.ro'),
  ('ITM', 'Inspecția Muncii', 'Controlează respectarea legislației muncii.', 'munca', 'https://www.inspectiamuncii.ro')
on conflict (code) do nothing;
