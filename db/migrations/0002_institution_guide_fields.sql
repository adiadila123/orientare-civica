alter table institutions
  add column associated_court text,
  add column iban text,
  add column cod_venit text,
  add column cui text,
  add column wait_time_minutes integer;
