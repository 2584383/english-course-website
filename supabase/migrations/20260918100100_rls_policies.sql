-- =============================================================================
-- Migration 2/3 : Row Level Security pour les 3 rôles (CDC §2)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Fonctions d'aide en SECURITY DEFINER.
-- Indispensables : une policy sur `profiles` qui interrogerait `profiles`
-- provoquerait une récursion infinie. Ces fonctions contournent la RLS.
-- ---------------------------------------------------------------------------
create or replace function public.current_app_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

create or replace function public.is_teacher()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role in ('teacher', 'super_admin') from public.profiles where id = auth.uid()),
    false
  );
$$;

-- L'enseignant n'accède qu'aux étudiants qui lui sont affectés ;
-- le super administrateur voit tout le monde.
create or replace function public.teaches(student uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin()
      or exists (
        select 1 from public.student_profiles sp
        where sp.id = student and sp.teacher_id = auth.uid()
      );
$$;

revoke execute on function public.current_app_role() from public;
grant execute on function public.current_app_role() to authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_teacher() to authenticated;
grant execute on function public.teaches(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Activation de la RLS
-- ---------------------------------------------------------------------------
alter table public.profiles                  enable row level security;
alter table public.student_profiles          enable row level security;
alter table public.consents                  enable row level security;
alter table public.deletion_requests         enable row level security;
alter table public.discovery_calls           enable row level security;
alter table public.path_templates            enable row level security;
alter table public.template_sessions         enable row level security;
alter table public.learning_paths            enable row level security;
alter table public.path_sessions             enable row level security;
alter table public.bookings                  enable row level security;
alter table public.booking_reminders         enable row level security;
alter table public.session_reports           enable row level security;
alter table public.resources                 enable row level security;
alter table public.resource_shares           enable row level security;
alter table public.assignments               enable row level security;
alter table public.self_evaluations          enable row level security;
alter table public.notification_preferences  enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
create policy "profiles_select_self" on public.profiles
  for select using (id = auth.uid());

create policy "profiles_select_as_teacher" on public.profiles
  for select using (public.teaches(id));

-- L'étudiant doit pouvoir lire la fiche de son enseignant (nom, avatar)
create policy "profiles_select_my_teacher" on public.profiles
  for select using (
    exists (
      select 1 from public.student_profiles sp
      where sp.id = auth.uid() and sp.teacher_id = public.profiles.id
    )
  );

create policy "profiles_select_admin" on public.profiles
  for select using (public.is_super_admin());

-- Un utilisateur met à jour son profil mais ne peut ni changer son rôle,
-- ni s'ouvrir des droits de réservation : ces colonnes sont verrouillées
-- par le trigger ci-dessous.
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_update_admin" on public.profiles
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- L'enseignant ouvre les droits de réservation de ses étudiants (CDC 1.3)
create policy "profiles_update_as_teacher" on public.profiles
  for update using (public.teaches(id)) with check (public.teaches(id));

create or replace function public.protect_privileged_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sans utilisateur authentifié, l'appel vient du code serveur de confiance
  -- (clé de service, webhook, cron) : la RLS ne s'applique pas, ces garde-fous
  -- non plus. Le rôle `anon`, lui, ne satisfait aucune policy d'écriture.
  if auth.uid() is null then
    return new;
  end if;

  if public.is_super_admin() then
    return new;
  end if;

  -- Personne ne s'auto-promeut ni ne se réactive
  if new.role is distinct from old.role then
    new.role := old.role;
  end if;
  if new.status is distinct from old.status then
    new.status := old.status;
  end if;

  -- Seul l'enseignant affecté (ou l'admin) ouvre les droits de réservation
  if (new.booking_enabled is distinct from old.booking_enabled
      or new.booking_credits is distinct from old.booking_credits)
     and not public.teaches(new.id) then
    new.booking_enabled := old.booking_enabled;
    new.booking_credits := old.booking_credits;
  end if;

  return new;
end;
$$;

create trigger protect_profiles_privileged_columns
  before update on public.profiles
  for each row execute function public.protect_privileged_columns();

-- ---------------------------------------------------------------------------
-- student_profiles
-- ---------------------------------------------------------------------------
create policy "student_profiles_select" on public.student_profiles
  for select using (id = auth.uid() or public.teaches(id));

-- L'étudiant ajuste son objectif et ses disponibilités (CDC 3.1 onboarding) ;
-- les constats pédagogiques restent la main de l'enseignant.
create policy "student_profiles_update_self" on public.student_profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

create policy "student_profiles_write_teacher" on public.student_profiles
  for all using (public.teaches(id)) with check (public.teaches(id));

create or replace function public.protect_student_profile_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sans utilisateur authentifié, l'appel vient du code serveur de confiance
  -- (clé de service, webhook, cron) : la RLS ne s'applique pas, ces garde-fous
  -- non plus. Le rôle `anon`, lui, ne satisfait aucune policy d'écriture.
  if auth.uid() is null then
    return new;
  end if;

  if public.teaches(new.id) then
    return new;
  end if;

  new.teacher_id := old.teacher_id;
  new.initial_level := old.initial_level;
  new.target_level := old.target_level;
  new.teacher_notes := old.teacher_notes;
  return new;
end;
$$;

create trigger protect_student_profile_columns
  before update on public.student_profiles
  for each row execute function public.protect_student_profile_columns();

-- ---------------------------------------------------------------------------
-- consents / deletion_requests (RGPD)
-- ---------------------------------------------------------------------------
create policy "consents_own" on public.consents
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "consents_admin_read" on public.consents
  for select using (public.is_super_admin());

create policy "deletion_requests_own" on public.deletion_requests
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "deletion_requests_admin" on public.deletion_requests
  for all using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- discovery_calls : strictement côté enseignant
-- ---------------------------------------------------------------------------
create policy "discovery_calls_owner" on public.discovery_calls
  for all using (teacher_id = auth.uid() or public.is_super_admin())
  with check (teacher_id = auth.uid() or public.is_super_admin());

-- ---------------------------------------------------------------------------
-- path_templates / template_sessions
-- ---------------------------------------------------------------------------
create policy "path_templates_owner" on public.path_templates
  for all using (teacher_id = auth.uid() or public.is_super_admin())
  with check (teacher_id = auth.uid() or public.is_super_admin());

create policy "template_sessions_owner" on public.template_sessions
  for all using (
    exists (
      select 1 from public.path_templates t
      where t.id = template_id
        and (t.teacher_id = auth.uid() or public.is_super_admin())
    )
  )
  with check (
    exists (
      select 1 from public.path_templates t
      where t.id = template_id
        and (t.teacher_id = auth.uid() or public.is_super_admin())
    )
  );

-- ---------------------------------------------------------------------------
-- learning_paths / path_sessions
-- ---------------------------------------------------------------------------
create policy "learning_paths_read" on public.learning_paths
  for select using (student_id = auth.uid() or public.teaches(student_id));

create policy "learning_paths_write" on public.learning_paths
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

create policy "path_sessions_read" on public.path_sessions
  for select using (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id
        and (p.student_id = auth.uid() or public.teaches(p.student_id))
    )
  );

create policy "path_sessions_write" on public.path_sessions
  for all using (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id and public.teaches(p.student_id)
    )
  )
  with check (
    exists (
      select 1 from public.learning_paths p
      where p.id = path_id and public.teaches(p.student_id)
    )
  );

-- ---------------------------------------------------------------------------
-- bookings
-- ---------------------------------------------------------------------------
create policy "bookings_read" on public.bookings
  for select using (student_id = auth.uid() or public.teaches(student_id));

-- L'étudiant ne crée une réservation que si ses droits sont ouverts.
-- Le webhook Calendly, lui, passe par la service role key (hors RLS).
create policy "bookings_insert_student" on public.bookings
  for insert with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.booking_enabled
    )
  );

create policy "bookings_update_student" on public.bookings
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "bookings_write_teacher" on public.bookings
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

create policy "booking_reminders_read" on public.booking_reminders
  for select using (
    exists (
      select 1 from public.bookings b
      where b.id = booking_id
        and (b.student_id = auth.uid() or public.teaches(b.student_id))
    )
  );

-- ---------------------------------------------------------------------------
-- session_reports : l'étudiant ne voit que les comptes-rendus publiés,
-- et jamais les notes privées de l'enseignant (cf. vue dédiée ci-dessous).
-- ---------------------------------------------------------------------------
create policy "session_reports_read_student" on public.session_reports
  for select using (student_id = auth.uid() and status = 'published');

create policy "session_reports_update_read_flag" on public.session_reports
  for update using (student_id = auth.uid() and status = 'published')
  with check (student_id = auth.uid() and status = 'published');

create policy "session_reports_write_teacher" on public.session_reports
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

create or replace function public.protect_report_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sans utilisateur authentifié, l'appel vient du code serveur de confiance
  -- (clé de service, webhook, cron) : la RLS ne s'applique pas, ces garde-fous
  -- non plus. Le rôle `anon`, lui, ne satisfait aucune policy d'écriture.
  if auth.uid() is null then
    return new;
  end if;

  if public.teaches(new.student_id) then
    return new;
  end if;

  -- Côté étudiant, seul l'accusé de lecture est modifiable
  new.theme := old.theme;
  new.strengths := old.strengths;
  new.improvements := old.improvements;
  new.private_notes := old.private_notes;
  new.skills := old.skills;
  new.status := old.status;
  new.published_at := old.published_at;
  return new;
end;
$$;

create trigger protect_report_columns
  before update on public.session_reports
  for each row execute function public.protect_report_columns();

-- Vue exposée à l'étudiant : les notes privées n'en font pas partie
create view public.student_reports
with (security_invoker = true)
as
select
  r.id, r.booking_id, r.student_id, r.teacher_id,
  r.theme, r.strengths, r.improvements, r.skills,
  r.published_at, r.read_at,
  b.starts_at, ps.position as session_position, ps.title as session_title
from public.session_reports r
join public.bookings b on b.id = r.booking_id
left join public.path_sessions ps on ps.id = b.path_session_id
where r.status = 'published';

-- ---------------------------------------------------------------------------
-- resources / resource_shares
-- ---------------------------------------------------------------------------
create policy "resources_owner" on public.resources
  for all using (teacher_id = auth.uid() or public.is_super_admin())
  with check (teacher_id = auth.uid() or public.is_super_admin());

create policy "resources_read_shared" on public.resources
  for select using (
    exists (
      select 1 from public.resource_shares s
      where s.resource_id = public.resources.id and s.student_id = auth.uid()
    )
  );

create policy "resource_shares_read_student" on public.resource_shares
  for select using (student_id = auth.uid());

create policy "resource_shares_write_teacher" on public.resource_shares
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

-- ---------------------------------------------------------------------------
-- assignments : l'étudiant coche, l'enseignant assigne
-- ---------------------------------------------------------------------------
create policy "assignments_read" on public.assignments
  for select using (student_id = auth.uid() or public.teaches(student_id));

create policy "assignments_check_student" on public.assignments
  for update using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "assignments_write_teacher" on public.assignments
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

create or replace function public.protect_assignment_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Sans utilisateur authentifié, l'appel vient du code serveur de confiance
  -- (clé de service, webhook, cron) : la RLS ne s'applique pas, ces garde-fous
  -- non plus. Le rôle `anon`, lui, ne satisfait aucune policy d'écriture.
  if auth.uid() is null then
    return new;
  end if;

  if public.teaches(new.student_id) then
    return new;
  end if;

  new.title := old.title;
  new.instructions := old.instructions;
  new.due_label := old.due_label;
  new.due_at := old.due_at;
  new.resource_id := old.resource_id;
  new.path_session_id := old.path_session_id;
  return new;
end;
$$;

create trigger protect_assignment_columns
  before update on public.assignments
  for each row execute function public.protect_assignment_columns();

-- ---------------------------------------------------------------------------
-- self_evaluations / notification_preferences
-- ---------------------------------------------------------------------------
create policy "self_evaluations_student" on public.self_evaluations
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

create policy "self_evaluations_teacher" on public.self_evaluations
  for all using (public.teaches(student_id)) with check (public.teaches(student_id));

create policy "notification_preferences_own" on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
