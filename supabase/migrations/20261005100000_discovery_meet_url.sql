-- ---------------------------------------------------------------------------
-- Lien de visio des appels de découverte
--   Calendly le transmet au webhook comme pour les séances : on le garde pour
--   afficher l'appel dans le planning du prof avec un bouton « Rejoindre ».
-- ---------------------------------------------------------------------------

alter table public.discovery_calls
  add column if not exists meet_url text;

create index if not exists discovery_calls_teacher_scheduled_idx
  on public.discovery_calls (teacher_id, scheduled_at);
