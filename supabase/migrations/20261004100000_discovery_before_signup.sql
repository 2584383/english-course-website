-- ---------------------------------------------------------------------------
-- Appel de découverte AVANT la création du compte
--   Le prospect réserve son appel sans compte : seule une ligne
--   `discovery_calls` (nom, email) est créée par le webhook Calendly.
--   Quand il crée ensuite son compte (ou est invité) avec le même email, il est
--   rattaché au prof de cet appel, et l'appel passe « converti ».
-- ---------------------------------------------------------------------------

create index if not exists discovery_calls_email_idx
  on public.discovery_calls (lower(email));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  desired_role public.user_role;
  v_call public.discovery_calls;
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
    -- Appel de découverte le plus récent fait avec cette adresse
    select * into v_call
      from public.discovery_calls
     where lower(email) = lower(new.email)
       and status <> 'lost'
     order by created_at desc
     limit 1;

    -- L'invitation par un enseignant écrase ensuite ce rattachement par défaut
    insert into public.student_profiles (id, teacher_id)
    values (new.id, coalesce(v_call.teacher_id, public.sole_teacher_id()))
    on conflict (id) do nothing;

    if v_call.id is not null then
      update public.discovery_calls
         set status = 'converted',
             student_id = new.id,
             converted_student_id = new.id
       where id = v_call.id;
    end if;
  end if;

  return new;
end;
$$;
