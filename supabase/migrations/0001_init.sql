create table institutions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  category text,
  website_url text,
  contact_form_url text,
  phone text,
  email text,
  address text,
  created_at timestamptz not null default now()
);

create table problem_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  keywords text[] not null default '{}',
  institution_id uuid references institutions(id),
  created_at timestamptz not null default now()
);

create table cases (
  id uuid primary key default gen_random_uuid(),
  user_description text not null,
  ai_analysis jsonb,
  recommended_institution_id uuid references institutions(id),
  status text not null default 'new' check (status in ('new', 'in_progress', 'resolved')),
  session_id text,
  created_at timestamptz not null default now()
);

create index cases_session_id_idx on cases (session_id);
create index cases_status_idx on cases (status);

alter table institutions enable row level security;
create policy "institutions are publicly readable" on institutions for select using (true);

alter table problem_categories enable row level security;

alter table cases enable row level security;
