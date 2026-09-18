\set ON_ERROR_STOP on
set role authenticated;

-- ===========================================================================
-- 1. L'ENSEIGNANT voit ses étudiants, pas ceux des autres
-- ===========================================================================
select test_as('11111111-1111-1111-1111-111111111111');
select check_eq('prof: étudiants visibles',
  (select count(*) from public.student_profiles), 1);
select check_eq('prof: parcours de ses étudiants',
  (select count(*) from public.learning_paths), 1);
select check_eq('prof: ses comptes-rendus (brouillon inclus)',
  (select count(*) from public.session_reports), 1);

-- ===========================================================================
-- 2. L'ÉTUDIANT est cloisonné sur ses propres données
-- ===========================================================================
select test_as('22222222-2222-2222-2222-222222222222');
select check_eq('étudiant: son parcours',
  (select count(*) from public.learning_paths), 1);
select check_eq('étudiant: ses séances',
  (select count(*) from public.path_sessions), 2);
select check_eq('étudiant: ses réservations',
  (select count(*) from public.bookings), 1);
-- Le compte-rendu est encore en brouillon : invisible
select check_eq('étudiant: CR brouillon masqué',
  (select count(*) from public.session_reports), 0);
select check_eq('étudiant: vue student_reports vide',
  (select count(*) from public.student_reports), 0);

-- ===========================================================================
-- 3. UN AUTRE ENSEIGNANT ne voit rien de cet étudiant
-- ===========================================================================
select test_as('44444444-4444-4444-4444-444444444444');
select check_eq('autre prof: aucun parcours d''Amina',
  (select count(*) from public.learning_paths
     where student_id = '22222222-2222-2222-2222-222222222222'), 0);
select check_eq('autre prof: aucune réservation d''Amina',
  (select count(*) from public.bookings
     where student_id = '22222222-2222-2222-2222-222222222222'), 0);
select check_eq('autre prof: aucun CR d''Amina',
  (select count(*) from public.session_reports
     where student_id = '22222222-2222-2222-2222-222222222222'), 0);

-- ===========================================================================
-- 4. PUBLICATION : le CR devient visible, sans les notes privées
-- ===========================================================================
select test_as('11111111-1111-1111-1111-111111111111');
select public.publish_report('dddddddd-0000-0000-0000-000000000001');

select test_as('22222222-2222-2222-2222-222222222222');
select check_eq('étudiant: CR publié visible',
  (select count(*) from public.student_reports), 1);
select check_eq('étudiant: notes privées absentes de la vue',
  (select count(*) from information_schema.columns
     where table_name = 'student_reports' and column_name = 'private_notes'), 0);

-- La séance suivante a été déverrouillée par publish_report
select check_eq('séance 2 ouverte après publication',
  (select count(*) from public.path_sessions
     where position = 2 and status = 'open'), 1);

-- ===========================================================================
-- 5. ESCALADE DE PRIVILÈGES : un étudiant ne peut pas se promouvoir
-- ===========================================================================
select test_as('22222222-2222-2222-2222-222222222222');
update public.profiles set role = 'super_admin', booking_enabled = true
  where id = '22222222-2222-2222-2222-222222222222';
select check_eq('étudiant: promotion en admin bloquée',
  (select count(*) from public.profiles
     where id = '22222222-2222-2222-2222-222222222222' and role = 'student'), 1);
select check_eq('étudiant: auto-ouverture des droits bloquée',
  (select count(*) from public.profiles
     where id = '22222222-2222-2222-2222-222222222222' and booking_enabled = false), 1);

-- Il ne peut pas non plus réécrire le contenu d'un compte-rendu
update public.session_reports set strengths = 'PIRATE'
  where id = 'dddddddd-0000-0000-0000-000000000001';
select check_eq('étudiant: réécriture du CR bloquée',
  (select count(*) from public.student_reports where strengths = 'Bonne fluidité'), 1);

-- ===========================================================================
-- 6. L'ENSEIGNANT ouvre bien les droits de réservation
-- ===========================================================================
select test_as('11111111-1111-1111-1111-111111111111');
update public.profiles set booking_enabled = true, booking_credits = 10
  where id = '22222222-2222-2222-2222-222222222222';
select check_eq('prof: ouverture des droits autorisée',
  (select count(*) from public.profiles
     where id = '22222222-2222-2222-2222-222222222222'
       and booking_enabled and booking_credits = 10), 1);

-- ===========================================================================
-- 7. LE SUPER ADMIN voit tout
-- ===========================================================================
select test_as('55555555-5555-5555-5555-555555555555');
select check_eq('admin: tous les profils', (select count(*) from public.profiles), 5);
select check_eq('admin: tous les parcours', (select count(*) from public.learning_paths), 1);

-- ===========================================================================
-- 8. AUTO-ÉVALUATION : privée à l'étudiant et son enseignant
-- ===========================================================================
select test_as('22222222-2222-2222-2222-222222222222');
insert into public.self_evaluations (student_id, answers)
values ('22222222-2222-2222-2222-222222222222', '[{"question":"q","answer":"a"}]'::jsonb);

select test_as('44444444-4444-4444-4444-444444444444');
select check_eq('autre prof: auto-évaluation invisible',
  (select count(*) from public.self_evaluations), 0);

select test_as('11111111-1111-1111-1111-111111111111');
select check_eq('prof référent: auto-évaluation visible',
  (select count(*) from public.self_evaluations), 1);

reset role;

-- ===========================================================================
-- 9. assign_template : instancie un gabarit en parcours personnalisé
-- ===========================================================================
set role authenticated;

-- Un enseignant tiers ne peut pas assigner un parcours à un étudiant
-- qui ne lui est pas affecté.
select test_as('44444444-4444-4444-4444-444444444444');
do $$
declare
  refused boolean := false;
begin
  begin
    perform public.assign_template(
      'eeeeeeee-0000-0000-0000-000000000001',
      '22222222-2222-2222-2222-222222222222');
  exception when others then
    refused := true;
  end;

  if refused then
    raise notice 'OK   autre prof: assignation refusée';
  else
    raise exception 'ECHEC autre prof: assignation aurait dû être refusée';
  end if;
end $$;

select test_as('11111111-1111-1111-1111-111111111111');
select public.assign_template(
  'eeeeeeee-0000-0000-0000-000000000001',
  '22222222-2222-2222-2222-222222222222',
  'Com. pro — Amina') as new_path_id \gset

select check_eq('prof: 3 séances générées',
  (select count(*) from public.path_sessions where path_id = :'new_path_id'), 3);
select check_eq('prof: 2 premières séances ouvertes',
  (select count(*) from public.path_sessions
     where path_id = :'new_path_id' and status = 'open'), 2);
select check_eq('prof: ancien parcours archivé',
  (select count(*) from public.learning_paths
     where student_id = '22222222-2222-2222-2222-222222222222' and is_active), 1);

reset role;
