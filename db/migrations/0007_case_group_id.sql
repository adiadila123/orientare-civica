-- gen_random_uuid() as the default is evaluated per row on ADD COLUMN, so
-- every existing case gets its own distinct group id (a "group of one")
-- rather than all sharing a single accidental group.
alter table cases
  add column case_group_id uuid not null default gen_random_uuid();

create index cases_case_group_id_idx on cases (case_group_id);
