-- =============================================================================
-- Reproduction minimale des objets fournis par Supabase (auth, storage).
-- Sert uniquement à rejouer les migrations sur un PostgreSQL nu, pour valider
-- le schéma et les politiques RLS hors d'un projet Supabase réel.
-- =============================================================================
create schema if not exists auth;
create schema if not exists storage;

create table if not exists auth.users (
  id uuid primary key default gen_random_uuid(),
  email text,
  raw_user_meta_data jsonb default '{}'::jsonb
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;

create table if not exists storage.buckets (
  id text primary key,
  name text,
  public boolean default false,
  file_size_limit bigint
);

create table if not exists storage.objects (
  id uuid primary key default gen_random_uuid(),
  bucket_id text references storage.buckets (id),
  name text
);
alter table storage.objects enable row level security;

create or replace function storage.foldername(name text) returns text[]
language sql immutable as $$ select string_to_array(name, '/') $$;

do $$ begin
  create role anon;
exception when duplicate_object then null;
end $$;

do $$ begin
  create role authenticated;
exception when duplicate_object then null;
end $$;

-- Supabase accorde ces droits par défaut : `auth.uid()` doit être appelable
-- depuis les fonctions en SECURITY INVOKER.
grant usage on schema auth, storage to anon, authenticated;
grant execute on function auth.uid() to anon, authenticated;
grant select on auth.users to authenticated;
