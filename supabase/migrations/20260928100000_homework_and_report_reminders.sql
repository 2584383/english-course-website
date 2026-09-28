-- ---------------------------------------------------------------------------
-- Autonomie de l'enseignant (proposition 4)
--   1. Devoirs prévus dans le gabarit, copiés dans le parcours de l'étudiant
--      et assignés automatiquement avant la séance concernée.
--   2. Relance de l'enseignant quand un compte-rendu n'est pas publié 24 h
--      après la séance.
-- ---------------------------------------------------------------------------

-- 1. Devoirs au niveau de la séance du parcours --------------------------------

-- `homework` : liste de { title, instructions, due_label } copiée du gabarit.
-- `homework_assigned_at` : posé au moment où les devoirs sont créés dans
-- `assignments` ; garantit qu'une séance ne les distribue qu'une fois.
alter table public.path_sessions
  add column if not exists homework jsonb not null default '[]'::jsonb,
  add column if not exists homework_assigned_at timestamptz;

-- Le gabarit copie désormais ses devoirs dans le parcours
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

  insert into public.path_sessions
    (path_id, position, title, module, goal, agenda, homework, status)
  select
    v_path_id, ts.position, ts.title, ts.module, ts.goal, ts.agenda,
    ts.default_homework,
    -- Les deux premières séances sont réservables d'emblée
    case when ts.position <= 2 then 'open'::public.path_session_status
         else 'locked'::public.path_session_status end
  from public.template_sessions ts
  where ts.template_id = p_template_id
  order by ts.position;

  return v_path_id;
end;
$$;

-- Parcours déjà assignés : reprise des devoirs du gabarit (même titre de séance)
update public.path_sessions ps
   set homework = ts.default_homework
  from public.learning_paths lp
  join public.template_sessions ts on ts.template_id = lp.template_id
 where ps.path_id = lp.id
   and ts.title = ps.title
   and ps.homework = '[]'::jsonb
   and ps.homework_assigned_at is null
   and ts.default_homework <> '[]'::jsonb;

-- 2. Relance « compte-rendu en attente » --------------------------------------

-- Le cron réutilise `booking_reminders` pour l'idempotence : on autorise un
-- nouveau libellé `report` à côté des rappels J-3 / J-1 / H-1.
alter table public.booking_reminders
  drop constraint if exists booking_reminders_offset_label_check;

alter table public.booking_reminders
  add constraint booking_reminders_offset_label_check
  check (offset_label in ('d3', 'd1', 'h1', 'report'));
