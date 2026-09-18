-- =============================================================================
-- Jeu de données de test : 2 enseignants, 2 étudiants, 1 super administrateur.
-- =============================================================================
grant usage on schema public to authenticated;
grant all on all tables in schema public to authenticated;
grant all on all sequences in schema public to authenticated;

insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'lea@test.fr',   '{"role":"teacher","full_name":"Lea M."}'),
  ('22222222-2222-2222-2222-222222222222', 'amina@test.fr', '{"role":"student","full_name":"Amina B."}'),
  ('33333333-3333-3333-3333-333333333333', 'zoe@test.fr',   '{"role":"student","full_name":"Zoe R."}'),
  ('44444444-4444-4444-4444-444444444444', 'marc@test.fr',  '{"role":"teacher","full_name":"Marc T."}'),
  ('55555555-5555-5555-5555-555555555555', 'admin@test.fr', '{"role":"super_admin","full_name":"Admin"}');

-- Affectation des étudiants (contexte « clé de service » : auth.uid() est nul)
update public.student_profiles set teacher_id = '11111111-1111-1111-1111-111111111111'
  where id = '22222222-2222-2222-2222-222222222222';
update public.student_profiles set teacher_id = '44444444-4444-4444-4444-444444444444'
  where id = '33333333-3333-3333-3333-333333333333';

insert into public.learning_paths (id, student_id, teacher_id, name)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111', 'Job Interview');

insert into public.path_sessions (id, path_id, position, title, status) values
  ('bbbbbbbb-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 1, 'Se présenter', 'done'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001', 2, 'Méthode STAR', 'open');

insert into public.bookings (id, student_id, teacher_id, path_session_id, starts_at, ends_at)
values ('cccccccc-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        '11111111-1111-1111-1111-111111111111',
        'bbbbbbbb-0000-0000-0000-000000000001',
        now() - interval '2 days', now() - interval '2 days' + interval '1 hour');

insert into public.session_reports
  (id, booking_id, student_id, teacher_id, theme, strengths, private_notes, status)
values ('dddddddd-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111',
        'STAR', 'Bonne fluidité', 'NOTE PRIVEE A NE JAMAIS EXPOSER', 'draft');

-- Gabarit réutilisable, pour tester assign_template
insert into public.path_templates (id, teacher_id, name, session_count)
values ('eeeeeeee-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111', 'Communication pro', 3);

insert into public.template_sessions (template_id, position, title, module) values
  ('eeeeeeee-0000-0000-0000-000000000001', 1, 'Small talk',   'listening'),
  ('eeeeeeee-0000-0000-0000-000000000001', 2, 'Négocier',     'simulation'),
  ('eeeeeeee-0000-0000-0000-000000000001', 3, 'Animer',       'simulation');

-- Helpers ---------------------------------------------------------------------
create or replace function test_as(uid uuid) returns void
language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', uid::text, false);
end $$;

create or replace function check_eq(label text, got bigint, want bigint) returns void
language plpgsql as $$
begin
  if got = want then
    raise notice 'OK   % (=%)', label, got;
  else
    raise exception 'ECHEC % : attendu %, obtenu %', label, want, got;
  end if;
end $$;
