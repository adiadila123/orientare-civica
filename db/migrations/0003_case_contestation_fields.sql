create sequence if not exists case_number_seq;

alter table cases
  add column case_number text unique default (
    'GD-' || extract(year from now())::text || '-' || lpad(nextval('case_number_seq')::text, 4, '0')
  ),
  add column institution_code text,
  add column petitioner_name text,
  add column petitioner_cnp text,
  add column petitioner_address text,
  add column petitioner_email text,
  add column petitioner_phone text,
  add column pv_series text,
  add column pv_number text,
  add column pv_issue_date date,
  add column pv_amount integer,
  add column pv_penalty_points integer,
  add column pv_issuing_agent text,
  add column grounds text,
  add column annexes jsonb not null default '[]'::jsonb,
  add column revision integer not null default 1,
  add column updated_at timestamptz not null default now();
