create sequence if not exists info_request_number_seq;

create table info_requests (
  id uuid primary key default gen_random_uuid(),
  request_number text unique default (
    'IP-' || extract(year from now())::text || '-' || lpad(nextval('info_request_number_seq')::text, 4, '0')
  ),
  institution_code text not null,
  requester_name text,
  requester_address text,
  requester_email text,
  requester_phone text,
  information_requested text not null,
  revision integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index info_requests_institution_code_idx on info_requests (institution_code);
