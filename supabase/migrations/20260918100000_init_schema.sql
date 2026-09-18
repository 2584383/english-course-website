-- =============================================================================
-- Plateforme de réservation et de suivi de cours d'anglais
-- Migration 1/3 : types, tables, index, triggers
-- =============================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Énumérations
-- ---------------------------------------------------------------------------
create type public.user_role as enum ('super_admin', 'teacher', 'student');
create type public.account_status as enum ('invited', 'active', 'suspended');
create type public.cefr_level as enum ('A1', 'A2', 'B1', 'B2', 'C1', 'C2');
create type public.scenario as enum ('job_interview', 'academic', 'business', 'fluency');
create type public.module_kind as enum ('listening', 'pronunciation', 'simulation', 'vocabulary', 'grammar', 'other');
create type public.path_session_status as enum ('locked', 'open', 'booked', 'done');
create type public.booking_status as enum ('scheduled', 'completed', 'canceled', 'no_show');
create type public.resource_kind as enum ('pdf', 'audio', 'video', 'link', 'doc');
create type public.assignment_status as enum ('todo', 'done');
create type public.discovery_status as enum ('to_qualify', 'scheduled', 'confirmed', 'thinking', 'converted', 'lost');
create type public.report_status as enum ('draft', 'published');

-- ---------------------------------------------------------------------------
-- Profils : une ligne par compte auth.users
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.user_role not null default 'student',
  status public.account_status not null default 'invited',
  avatar_url text,
  timezone text not null default 'Europe/Paris',
  -- L'accès à la réservation est ouvert manuellement par l'enseignant (CDC 1.3)
  booking_enabled boolean not null default false,
  booking_credits integer not null default 0 check (booking_credits >= 0),
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Fiche pédagogique de l'étudiant, renseignée par l'enseignant après l'audit
create table public.student_profiles (
  id uuid primary key references public.profiles (id) on delete cascade,
  teacher_id uuid references public.profiles (id) on delete set null,
  initial_level public.cefr_level,
  target_level public.cefr_level,
  scenario public.scenario,
  goal text,
  goal_in_own_words text,
  availability text[] not null default '{}',
  teacher_notes text,
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index student_profiles_teacher_idx on public.student_profiles (teacher_id);

-- ---------------------------------------------------------------------------
-- RGPD : consentements horodatés (CDC 4.3)
-- ---------------------------------------------------------------------------
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('terms', 'privacy', 'pedagogical_data', 'marketing')),
  granted boolean not null,
  version text not null default 'v1',
  granted_at timestamptz not null default now()
);

create index consents_user_idx on public.consents (user_id, kind);

create table public.deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  reason text,
  requested_at timestamptz not null default now(),
  processed_at timestamptz
);

-- ---------------------------------------------------------------------------
-- Appels de découverte (CRM amont)
-- ---------------------------------------------------------------------------
create table public.discovery_calls (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  scheduled_at timestamptz,
  duration_minutes integer,
  status public.discovery_status not null default 'to_qualify',
  notes text,
  follow_ups jsonb not null default '[]'::jsonb,
  converted_student_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index discovery_calls_teacher_idx on public.discovery_calls (teacher_id, status);

-- ---------------------------------------------------------------------------
-- Gabarits de parcours réutilisables
-- ---------------------------------------------------------------------------
create table public.path_templates (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  scenario public.scenario,
  description text,
  session_count integer not null default 0,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.template_sessions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.path_templates (id) on delete cascade,
  position integer not null,
  title text not null,
  module public.module_kind not null default 'other',
  goal text,
  agenda jsonb not null default '[]'::jsonb,
  default_homework jsonb not null default '[]'::jsonb,
  unique (template_id, position)
);

-- ---------------------------------------------------------------------------
-- Parcours assigné à un étudiant
-- ---------------------------------------------------------------------------
create table public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  template_id uuid references public.path_templates (id) on delete set null,
  name text not null,
  scenario public.scenario,
  is_active boolean not null default true,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index learning_paths_student_idx on public.learning_paths (student_id, is_active);

create table public.path_sessions (
  id uuid primary key default gen_random_uuid(),
  path_id uuid not null references public.learning_paths (id) on delete cascade,
  position integer not null,
  title text not null,
  module public.module_kind not null default 'other',
  goal text,
  agenda jsonb not null default '[]'::jsonb,
  status public.path_session_status not null default 'locked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (path_id, position)
);

create index path_sessions_path_idx on public.path_sessions (path_id, position);

-- ---------------------------------------------------------------------------
-- Réservations (source de vérité : Calendly via webhook)
-- ---------------------------------------------------------------------------
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  path_session_id uuid references public.path_sessions (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.booking_status not null default 'scheduled',
  meet_url text,
  student_note text,
  -- Traçabilité Calendly
  calendly_event_uri text unique,
  calendly_invitee_uri text,
  calendly_reschedule_url text,
  calendly_cancel_url text,
  canceled_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint bookings_time_order check (ends_at > starts_at)
);

create index bookings_student_idx on public.bookings (student_id, starts_at desc);
create index bookings_teacher_idx on public.bookings (teacher_id, starts_at);
create index bookings_upcoming_idx on public.bookings (starts_at) where status = 'scheduled';

-- Rappels envoyés (J-3 / J-1 / H-1) : une ligne par rappel, garantit l'idempotence
create table public.booking_reminders (
  booking_id uuid not null references public.bookings (id) on delete cascade,
  offset_label text not null check (offset_label in ('d3', 'd1', 'h1')),
  sent_at timestamptz not null default now(),
  primary key (booking_id, offset_label)
);

-- ---------------------------------------------------------------------------
-- Comptes-rendus de séance
-- ---------------------------------------------------------------------------
create table public.session_reports (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  theme text,
  strengths text,
  improvements text,
  private_notes text,
  skills text[] not null default '{}',
  status public.report_status not null default 'draft',
  published_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index session_reports_student_idx on public.session_reports (student_id, status);

-- ---------------------------------------------------------------------------
-- Bibliothèque de ressources (Supabase Storage)
-- ---------------------------------------------------------------------------
create table public.resources (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  kind public.resource_kind not null default 'pdf',
  storage_path text,
  external_url text,
  description text,
  duration_label text,
  created_at timestamptz not null default now(),
  constraint resources_has_target check (storage_path is not null or external_url is not null)
);

-- Partage explicite d'une ressource à un étudiant
create table public.resource_shares (
  resource_id uuid not null references public.resources (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  shared_at timestamptz not null default now(),
  primary key (resource_id, student_id)
);

-- ---------------------------------------------------------------------------
-- Devoirs (to-do list interactive de l'apprenant)
-- ---------------------------------------------------------------------------
create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  teacher_id uuid not null references public.profiles (id) on delete cascade,
  path_session_id uuid references public.path_sessions (id) on delete set null,
  resource_id uuid references public.resources (id) on delete set null,
  title text not null,
  instructions text,
  due_label text,
  due_at timestamptz,
  status public.assignment_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index assignments_student_idx on public.assignments (student_id, status);

-- ---------------------------------------------------------------------------
-- Auto-évaluation à mi-parcours
-- ---------------------------------------------------------------------------
create table public.self_evaluations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  path_id uuid references public.learning_paths (id) on delete set null,
  answers jsonb not null default '[]'::jsonb,
  free_comment text,
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index self_evaluations_student_idx on public.self_evaluations (student_id, submitted_at desc);

-- ---------------------------------------------------------------------------
-- Préférences de notification
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  session_reminders boolean not null default true,
  email_reminders boolean not null default true,
  report_published boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Déclencheurs : updated_at + création automatique du profil
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'student_profiles', 'discovery_calls', 'path_templates',
    'learning_paths', 'path_sessions', 'bookings', 'session_reports'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
  end loop;
end;
$$;

-- Crée le profil dès l'inscription (le rôle vient des métadonnées d'invitation)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_role public.user_role;
begin
  desired_role := coalesce(
    nullif(new.raw_user_meta_data ->> 'role', '')::public.user_role,
    'student'
  );

  insert into public.profiles (id, email, full_name, role, status)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    desired_role,
    'active'
  )
  on conflict (id) do nothing;

  insert into public.notification_preferences (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  if desired_role = 'student' then
    insert into public.student_profiles (id)
    values (new.id)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
