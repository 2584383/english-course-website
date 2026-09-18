-- =============================================================================
-- Migration 3/3 : Storage, RPC métier, vues d'administration
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Bucket privé pour les supports de cours (CDC 4.2)
-- Convention de chemin : <teacher_id>/<uuid>-<nom-de-fichier>
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit)
values ('resources', 'resources', false, 26214400)
on conflict (id) do nothing;

create policy "resources_upload_teacher" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resources'
    and public.is_teacher()
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "resources_manage_teacher" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'resources'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- L'étudiant lit un fichier uniquement si la ressource lui a été partagée
create policy "resources_read_shared_student" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resources'
    and exists (
      select 1
      from public.resources r
      join public.resource_shares s on s.resource_id = r.id
      where r.storage_path = storage.objects.name
        and s.student_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Progression d'un parcours
-- ---------------------------------------------------------------------------
create or replace function public.path_progress(path uuid)
returns table (total integer, done integer, pct integer)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)::integer as total,
    count(*) filter (where status = 'done')::integer as done,
    case when count(*) = 0 then 0
         else round(count(*) filter (where status = 'done')::numeric * 100 / count(*))::integer
    end as pct
  from public.path_sessions
  where path_id = path;
$$;

-- ---------------------------------------------------------------------------
-- Instancie un gabarit en parcours personnalisé pour un étudiant (CDC 3.2)
-- ---------------------------------------------------------------------------
create or replace function public.assign_template(
  p_template_id uuid,
  p_student_id uuid,
  p_name text default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_path_id uuid;
  v_template public.path_templates;
begin
  if not public.teaches(p_student_id) then
    raise exception 'Non autorisé : cet étudiant ne vous est pas affecté';
  end if;

  select * into v_template from public.path_templates where id = p_template_id;
  if not found then
    raise exception 'Gabarit introuvable';
  end if;

  update public.learning_paths
     set is_active = false
   where student_id = p_student_id and is_active;

  insert into public.learning_paths
    (student_id, teacher_id, template_id, name, scenario, started_at)
  values
    (p_student_id, auth.uid(), p_template_id,
     coalesce(p_name, v_template.name), v_template.scenario, now())
  returning id into v_path_id;

  insert into public.path_sessions (path_id, position, title, module, goal, agenda, status)
  select
    v_path_id, ts.position, ts.title, ts.module, ts.goal, ts.agenda,
    -- Les deux premières séances sont réservables d'emblée
    case when ts.position <= 2 then 'open'::public.path_session_status
         else 'locked'::public.path_session_status end
  from public.template_sessions ts
  where ts.template_id = p_template_id
  order by ts.position;

  return v_path_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Clôture d'une séance : compte-rendu publié -> séance marquée faite,
-- et déverrouillage de la suivante.
-- ---------------------------------------------------------------------------
create or replace function public.publish_report(p_report_id uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_report public.session_reports;
  v_session public.path_sessions;
begin
  select * into v_report from public.session_reports where id = p_report_id;
  if not found then
    raise exception 'Compte-rendu introuvable';
  end if;
  if not public.teaches(v_report.student_id) then
    raise exception 'Non autorisé';
  end if;

  update public.session_reports
     set status = 'published', published_at = now()
   where id = p_report_id;

  update public.bookings
     set status = 'completed'
   where id = v_report.booking_id and status = 'scheduled';

  select ps.* into v_session
  from public.path_sessions ps
  join public.bookings b on b.path_session_id = ps.id
  where b.id = v_report.booking_id;

  if found then
    update public.path_sessions
       set status = 'done'
     where id = v_session.id;

    -- Ouvre la prochaine séance verrouillée du parcours
    update public.path_sessions
       set status = 'open'
     where path_id = v_session.path_id
       and position = v_session.position + 1
       and status = 'locked';
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- RGPD — droit à l'oubli (CDC 4.3)
-- Efface l'intégralité des données personnelles et pédagogiques.
-- La suppression de auth.users cascade sur tout le schéma public.
-- ---------------------------------------------------------------------------
create or replace function public.request_account_deletion(p_reason text default null)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  insert into public.deletion_requests (user_id, reason)
  values (auth.uid(), p_reason);

  -- Anonymisation immédiate ; la purge définitive du compte auth est
  -- réalisée par la route serveur avec la clé de service.
  update public.profiles
     set full_name = 'Compte supprimé',
         avatar_url = null,
         status = 'suspended',
         booking_enabled = false
   where id = auth.uid();
end;
$$;

-- ---------------------------------------------------------------------------
-- Vue de pilotage pour le super administrateur (CDC 3.3)
-- ---------------------------------------------------------------------------
create or replace view public.admin_overview
with (security_invoker = true)
as
select
  (select count(*) from public.profiles where role = 'student')                       as students,
  (select count(*) from public.profiles where role = 'teacher')                       as teachers,
  (select count(*) from public.profiles where role = 'student' and status = 'active') as active_students,
  (select count(*) from public.bookings where status = 'completed')                   as lessons_completed,
  (select count(*) from public.bookings
     where status = 'scheduled' and starts_at > now())                                as lessons_upcoming,
  (select count(*) from public.session_reports where status = 'published')            as reports_published,
  (select count(*) from public.profiles
     where last_seen_at > now() - interval '7 days')                                  as active_last_7_days;

-- Activité par enseignant
create or replace view public.teacher_activity
with (security_invoker = true)
as
select
  t.id as teacher_id,
  t.full_name,
  t.email,
  count(distinct sp.id)                                                as student_count,
  count(distinct b.id) filter (where b.status = 'completed')           as lessons_completed,
  count(distinct r.id) filter (where r.status = 'draft')               as reports_pending
from public.profiles t
left join public.student_profiles sp on sp.teacher_id = t.id
left join public.bookings b on b.teacher_id = t.id
left join public.session_reports r on r.teacher_id = t.id
where t.role = 'teacher'
group by t.id, t.full_name, t.email;
