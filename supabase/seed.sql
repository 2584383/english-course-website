-- =============================================================================
-- Jeu de démonstration — parcours « Job Interview » repris des prototypes.
--
-- Prérequis : créer d'abord les comptes dans Supabase Auth, puis remplacer les
-- deux identifiants ci-dessous par les UUID réels.
--
--   psql "$DATABASE_URL" -f supabase/seed.sql
-- =============================================================================

\set teacher_id '00000000-0000-0000-0000-000000000001'
\set student_id '00000000-0000-0000-0000-000000000002'

-- ---------------------------------------------------------------------------
-- Rôles et affectation
-- ---------------------------------------------------------------------------
update public.profiles
   set role = 'teacher', status = 'active', full_name = coalesce(full_name, 'Lea M.')
 where id = :'teacher_id';

update public.profiles
   set role = 'student', status = 'active', full_name = coalesce(full_name, 'Amina B.'),
       booking_enabled = true, booking_credits = 10
 where id = :'student_id';

insert into public.student_profiles
  (id, teacher_id, initial_level, target_level, scenario, goal, availability, teacher_notes, onboarded_at)
values (
  :'student_id', :'teacher_id', 'B1', 'B2', 'job_interview',
  'Décrocher un poste de PM dans une boîte anglophone d''ici janvier.',
  array['Lun–jeu soir', 'Mardi 18h–20h'],
  'Comprend bien, bloque à l''oral dès que c''est spontané. 1 h / 2 semaines.',
  now()
)
on conflict (id) do update set
  teacher_id = excluded.teacher_id,
  initial_level = excluded.initial_level,
  target_level = excluded.target_level,
  scenario = excluded.scenario,
  goal = excluded.goal,
  availability = excluded.availability,
  teacher_notes = excluded.teacher_notes,
  onboarded_at = excluded.onboarded_at;

-- ---------------------------------------------------------------------------
-- Gabarit « Job Interview » (13 séances)
-- ---------------------------------------------------------------------------
insert into public.path_templates (id, teacher_id, name, scenario, description, session_count)
values ('10000000-0000-0000-0000-000000000001', :'teacher_id',
        'Job Interview', 'job_interview',
        'Pour les apprenants B1+ visant un poste en anglais sous 4 mois.', 13)
on conflict (id) do nothing;

insert into public.template_sessions (template_id, position, title, module, goal, agenda) values
 ('10000000-0000-0000-0000-000000000001',  1, 'Se présenter en 90 secondes',      'simulation',  'Un pitch clair, sans notes.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  2, 'Écoute : entretiens réels',        'listening',   'Repérer les attentes du recruteur.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  3, 'Méthode STAR',                     'simulation',  'Structurer une réponse en 4 temps.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  4, 'Parler de ses échecs',             'simulation',  'Assumer sans se dévaloriser.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  5, 'Phone calls & visios',             'listening',   'Comprendre malgré une mauvaise ligne.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  6, 'Vocabulaire du recrutement',       'vocabulary',  '30 termes clés replacés en situation.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  7, 'Questions ouvertes',               'simulation',  'Répondre sans perdre le fil.', '[]'),
 ('10000000-0000-0000-0000-000000000001',  8, 'Storytelling',                     'simulation',
   'Raconter un projet en 90 secondes, avec un début, une tension et une fin — sans notes.',
   '[{"duration":"5 min","label":"Retour sur tes devoirs"},
     {"duration":"15 min","label":"Construire un récit : situation, tension, résolution"},
     {"duration":"30 min","label":"3 récits chronométrés, feedback après chacun"},
     {"duration":"10 min","label":"Bilan & devoirs"}]'),
 ('10000000-0000-0000-0000-000000000001',  9, 'Simulation d''entretien complet',  'simulation',
   'Tenir un entretien de 30 minutes sans blanc.',
   '[{"duration":"5 min","label":"Retour sur tes devoirs"},
     {"duration":"30 min","label":"Entretien complet, en continu, sans interruption"},
     {"duration":"15 min","label":"Questions de salaire & négociation"},
     {"duration":"10 min","label":"Débrief à chaud"}]'),
 ('10000000-0000-0000-0000-000000000001', 10, 'Négocier son salaire',            'simulation',
   'Annoncer une fourchette et la défendre sans s''excuser.',
   '[{"duration":"10 min","label":"Le vocabulaire de la négociation"},
     {"duration":"25 min","label":"Annoncer un chiffre et le défendre"},
     {"duration":"15 min","label":"Répondre à une contre-proposition"},
     {"duration":"10 min","label":"Bilan & devoirs"}]'),
 ('10000000-0000-0000-0000-000000000001', 11, 'Le suivi après entretien',        'vocabulary',  'Relancer sans être insistant.', '[]'),
 ('10000000-0000-0000-0000-000000000001', 12, 'Entretien final avec le CEO',     'simulation',  'Tenir un échange de haut niveau.', '[]'),
 ('10000000-0000-0000-0000-000000000001', 13, 'Bilan & plan de vol',             'simulation',  'Repartir avec un plan autonome.', '[]')
on conflict (template_id, position) do nothing;

-- ---------------------------------------------------------------------------
-- Parcours actif de l'étudiante : 7 séances faites, la 8e réservable
-- ---------------------------------------------------------------------------
insert into public.learning_paths (id, student_id, teacher_id, template_id, name, scenario, started_at)
values ('20000000-0000-0000-0000-000000000001', :'student_id', :'teacher_id',
        '10000000-0000-0000-0000-000000000001', 'Job Interview', 'job_interview', now() - interval '6 weeks')
on conflict (id) do nothing;

insert into public.path_sessions (path_id, position, title, module, goal, agenda, status)
select '20000000-0000-0000-0000-000000000001', ts.position, ts.title, ts.module, ts.goal, ts.agenda,
       case when ts.position <= 7 then 'done'
            when ts.position <= 9 then 'open'
            else 'locked' end::public.path_session_status
  from public.template_sessions ts
 where ts.template_id = '10000000-0000-0000-0000-000000000001'
on conflict (path_id, position) do nothing;

-- ---------------------------------------------------------------------------
-- Ressources partagées
-- ---------------------------------------------------------------------------
insert into public.resources (id, teacher_id, title, kind, external_url, description, duration_label) values
 ('30000000-0000-0000-0000-000000000001', :'teacher_id', 'Small talk — écoute', 'audio',
  'https://example.com/small-talk.mp3', 'Cinq expressions à réutiliser en entretien.', '4 min'),
 ('30000000-0000-0000-0000-000000000002', :'teacher_id', 'Fiche past tenses', 'pdf',
  'https://example.com/past-tenses.pdf', 'Present perfect vs simple past.', '2 pages')
on conflict (id) do nothing;

insert into public.resource_shares (resource_id, student_id) values
 ('30000000-0000-0000-0000-000000000001', :'student_id'),
 ('30000000-0000-0000-0000-000000000002', :'student_id')
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Devoirs en cours
-- ---------------------------------------------------------------------------
insert into public.assignments (student_id, teacher_id, resource_id, title, instructions, due_label) values
 (:'student_id', :'teacher_id', '30000000-0000-0000-0000-000000000001',
  'Écouter l''audio « Small talk »',
  'Écoute-le deux fois : la première sans rien noter, la seconde en relevant les 5 expressions que tu pourrais réutiliser en entretien.',
  '4 min · donné le 15 sept'),
 (:'student_id', :'teacher_id', null,
  'Préparer 3 phrases sur ton dernier projet',
  'Trois phrases, pas plus : ce que tu as fait, avec qui, et ce que ça a changé. Tu les diras à l''oral, ne les écris pas mot à mot.',
  'à dire à l''oral en début de séance'),
 (:'student_id', :'teacher_id', '30000000-0000-0000-0000-000000000002',
  'Lire la fiche « past tenses »',
  'Concentre-toi sur la page 2 : quand utiliser le present perfect plutôt que le simple past.',
  'avant la séance 10');

-- ---------------------------------------------------------------------------
-- Appels de découverte en cours de qualification
-- ---------------------------------------------------------------------------
insert into public.discovery_calls (teacher_id, full_name, email, status, notes) values
 (:'teacher_id', 'Léa M.', 'lea.m@exemple.fr', 'confirmed',
  'Cherche un poste de PM à Londres. A passé 2 entretiens en anglais, s''est effondrée sur les questions de parcours.'),
 (:'teacher_id', 'Thomas R.', null, 'thinking',
  'Soutenance de master en mars, entièrement en anglais. Veut « juste 5 séances ». À rappeler la semaine prochaine.'),
 (:'teacher_id', 'Nadia', null, 'scheduled', 'Appel prévu demain 12h.');
