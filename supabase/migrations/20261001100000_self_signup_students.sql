-- ---------------------------------------------------------------------------
-- Étudiants inscrits d'eux-mêmes (sans invitation ni appel de découverte)
--   Jusqu'ici leur fiche était créée sans enseignant : personne ne les voyait.
--   1. À l'inscription, l'étudiant est rattaché d'office à l'enseignant
--      lorsqu'il n'y en a qu'un seul.
--   2. Sinon il reste « à rattacher » : tout enseignant le voit et peut le
--      prendre en charge (assigner un parcours, renseigner sa fiche…).
--   3. Les étudiants déjà inscrits sans enseignant sont rattachés de même.
-- ---------------------------------------------------------------------------

-- Enseignant unique de la plateforme, ou null s'il y en a zéro ou plusieurs
create or replace function public.sole_teacher_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select case when count(*) = 1 then (array_agg(id))[1] end
  from public.profiles
  where role = 'teacher' and status = 'active';
$$;

revoke execute on function public.sole_teacher_id() from public;

-- 1. Rattachement à l'inscription ---------------------------------------------
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

  -- L'invitation par un enseignant écrase ensuite ce rattachement par défaut
  if desired_role = 'student' then
    insert into public.student_profiles (id, teacher_id)
    values (new.id, public.sole_teacher_id())
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

-- 2. Les étudiants sans enseignant sont visibles de tous les enseignants -------
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
        where sp.id = student
          and (
            sp.teacher_id = auth.uid()
            or (sp.teacher_id is null and public.is_teacher())
          )
      );
$$;

-- 3. Reprise des inscriptions existantes ---------------------------------------
update public.student_profiles
   set teacher_id = public.sole_teacher_id()
 where teacher_id is null
   and public.sole_teacher_id() is not null;
