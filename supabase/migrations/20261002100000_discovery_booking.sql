-- ---------------------------------------------------------------------------
-- Appel de découverte réservé par l'étudiant à l'inscription
--   1. Chaque enseignant publie une courte présentation et le lien Calendly
--      de son appel de découverte : l'étudiant choisit son prof sur cette base.
--   2. L'appel réservé atterrit dans le CRM de l'enseignant (`discovery_calls`),
--      relié au compte de l'étudiant et à l'événement Calendly.
-- ---------------------------------------------------------------------------

-- 1. Fiche publique de l'enseignant --------------------------------------------
alter table public.profiles
  add column if not exists bio text,
  add column if not exists discovery_url text;

-- 2. Appel relié à l'étudiant et à Calendly -------------------------------------
alter table public.discovery_calls
  add column if not exists student_id uuid references public.profiles (id) on delete set null,
  add column if not exists calendly_event_uri text;

-- Rend l'enregistrement idempotent (widget + webhook pour un même événement)
create unique index if not exists discovery_calls_calendly_event_uri_key
  on public.discovery_calls (calendly_event_uri);

create index if not exists discovery_calls_student_idx
  on public.discovery_calls (student_id);

-- Pas de policy étudiant : les notes de l'appel sont privées. Le serveur lit
-- et écrit pour lui avec la clé de service, colonnes choisies.
