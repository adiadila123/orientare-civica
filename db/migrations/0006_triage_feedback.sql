create table triage_feedback (
  id uuid primary key default gen_random_uuid(),
  user_description text not null,
  ai_analysis jsonb not null,
  suggested_institution_code text,
  is_helpful boolean not null,
  correction text,
  created_at timestamptz not null default now()
);

create index triage_feedback_suggested_institution_code_idx on triage_feedback (suggested_institution_code);
