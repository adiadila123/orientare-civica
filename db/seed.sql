insert into institutions (code, name, description, category, website_url, associated_court, iban, cod_venit, cui, wait_time_minutes) values
  ('ANPC', 'Autoritatea Națională pentru Protecția Consumatorilor', 'Instituția responsabilă pentru protecția drepturilor consumatorilor.', 'protectia_consumatorului', 'https://anpc.ro', null, 'RO49AAAA1B31007593840000', '20.03.01.02', '11111111', 15),
  ('ANAF', 'Agenția Națională de Administrare Fiscală', 'Administrează impozitele, taxele și contribuțiile sociale.', 'fiscal', 'https://www.anaf.ro', null, 'RO49AAAA1B31007593840001', '20.01.01.01', '22222222', 25),
  ('PRIMARIE', 'Primăria (generică, locală)', 'Sesizări și amenzi la nivel local; site-ul variază în funcție de localitate.', 'administratie_locala', null, 'Judecătoria de sector/localitate', 'RO49AAAA1B31007593840002', '21.02.05.02', '33333333', 40),
  ('POLITIE_LOCALA', 'Poliția Locală', 'Sesizări stradale și contravenții locale; site-ul variază în funcție de localitate.', 'ordine_publica', null, 'Judecătoria de sector/localitate', 'RO49AAAA1B31007593840003', '21.02.05.03', '44444444', 20),
  ('ANRE', 'Autoritatea Națională de Reglementare în Domeniul Energiei', 'Reglementează piața de energie electrică și gaze naturale.', 'energie', 'https://www.anre.ro', null, null, null, null, 10),
  ('ANCOM', 'Autoritatea Națională pentru Administrare și Reglementare în Comunicații', 'Reglementează piața de telecomunicații.', 'telecomunicatii', 'https://www.ancom.ro', null, null, null, null, 10),
  ('CNAS', 'Casa Națională de Asigurări de Sănătate', 'Administrează sistemul de asigurări sociale de sănătate.', 'sanatate', 'https://cnas.ro', null, null, null, null, 30),
  ('ITM', 'Inspecția Muncii', 'Controlează respectarea legislației muncii.', 'munca', 'https://www.inspectiamuncii.ro', null, null, null, null, 15)
on conflict (code) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  website_url = excluded.website_url,
  associated_court = excluded.associated_court,
  iban = excluded.iban,
  cod_venit = excluded.cod_venit,
  cui = excluded.cui,
  wait_time_minutes = excluded.wait_time_minutes;
