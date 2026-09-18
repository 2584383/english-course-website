# English with Lea — plateforme de réservation et de suivi de cours d'anglais

Application web progressive (PWA) dédiée à l'apprentissage de l'anglais oral.
Elle se distingue d'un simple annuaire : l'enseignant conçoit un **parcours
personnalisé**, le réajuste séance après séance et publie un **compte-rendu
écrit** après chaque leçon.

Implémentation du cahier des charges v2.0, à partir des prototypes hi-fi
étudiant et enseignant.

---

## Stack technique

| Brique | Choix | Rôle |
| --- | --- | --- |
| Framework | **Next.js 16** (App Router, React 19, TypeScript) | Rendu serveur, Server Actions |
| Styles | **Tailwind CSS 4** | Design system issu des prototypes |
| Base de données | **Supabase** (PostgreSQL + RLS) | Données, authentification, stockage |
| Réservation | **Calendly** (widget + webhook) | Créneaux, fuseaux horaires, Google Meet |
| Emails | **Resend** | Invitations, confirmations, rappels |
| Hébergement | **Vercel** | Déploiement continu + cron des rappels |

---

## Démarrage rapide

```bash
npm install
cp .env.example .env.local     # puis renseigner les variables
npm run dev                    # http://localhost:3000
```

L'application démarre sans Calendly ni Resend : le widget affiche un message de
configuration et les emails sont journalisés dans la console. **Supabase est en
revanche indispensable.**

---

## 1. Mise en place de Supabase

1. Créer un projet sur [supabase.com](https://supabase.com) (région Europe).
2. Copier `Project Settings → API` dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` *(secrète — jamais côté navigateur)*
3. Appliquer les migrations, dans l'ordre, depuis le SQL Editor ou la CLI :

```bash
npx supabase link --project-ref <ref>
npx supabase db push
```

| Migration | Contenu |
| --- | --- |
| `20260918100000_init_schema.sql` | Types, tables, index, déclencheurs |
| `20260918100100_rls_policies.sql` | Row Level Security des 3 rôles |
| `20260918100200_storage_and_rpc.sql` | Bucket privé, RPC métier, vues d'admin |

4. Créer le premier compte enseignant depuis `Authentication → Users`, en
   ajoutant `{"role": "teacher"}` dans les *user metadata* (le déclencheur
   `handle_new_user` crée le profil et lui donne ce rôle).
5. Facultatif — charger le jeu de démonstration :

```bash
# Remplacer d'abord les deux UUID en tête du fichier
psql "$DATABASE_URL" -f supabase/seed.sql
```

### Régénérer les types TypeScript

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

---

## 2. Intégration Calendly

1. Créer un type d'événement « Cours d'anglais — 1 h » et y **connecter Google
   Meet** comme lieu : Calendly génère alors un lien de visio par réservation.
2. Renseigner `NEXT_PUBLIC_CALENDLY_EVENT_URL` avec l'URL publique de
   l'événement.
3. Déclarer le webhook (une seule fois), avec un jeton d'API personnel :

```bash
curl -X POST https://api.calendly.com/webhook_subscriptions \
  -H "Authorization: Bearer $CALENDLY_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://<domaine>/api/calendly/webhook",
    "events": ["invitee.created", "invitee.canceled"],
    "organization": "https://api.calendly.com/organizations/<org>",
    "scope": "organization"
  }'
```

La réponse contient une **clé de signature** : la placer dans
`CALENDLY_WEBHOOK_SIGNING_KEY`. La route vérifie l'en-tête
`Calendly-Webhook-Signature` (HMAC SHA-256) et rejette les rejeux de plus de
5 minutes. Laisser la variable vide désactive la vérification — pratique en
local, à proscrire en production.

**Rattachement d'une réservation.** Le widget transmet
`utm_content = "<studentId>:<pathSessionId>"`. Le webhook s'en sert pour relier
l'événement Calendly à l'apprenant et à la séance du parcours ; à défaut, il
retombe sur l'email de l'invité. La colonne `calendly_event_uri` est unique, ce
qui rend la route idempotente face aux relivraisons.

---

## 3. Emails (Resend) et rappels

- Créer une clé sur [resend.com](https://resend.com), vérifier le domaine
  d'envoi, renseigner `RESEND_API_KEY` et `EMAIL_FROM`.
- Les rappels **J-3 / J-1 / H-1** sont envoyés par `/api/cron/reminders`,
  déclenché toutes les heures par le cron déclaré dans `vercel.json`.
- La table `booking_reminders` a pour clé primaire `(booking_id, offset_label)` :
  un rappel ne peut pas partir deux fois, même si le cron rejoue.
- Protéger la route avec `CRON_SECRET` (Vercel envoie
  `Authorization: Bearer <valeur>`).

---

## 4. Architecture des rôles

Trois rôles, appliqués **au niveau de la base** via Row Level Security — pas
seulement dans l'interface.

| Rôle | Périmètre |
| --- | --- |
| `super_admin` | Comptes, affectation étudiant ↔ enseignant, statistiques globales |
| `teacher` | Ses étudiants affectés, parcours, comptes-rendus, planning |
| `student` | Son parcours, ses réservations, ses bilans publiés, ses devoirs |

Points de vigilance couverts par les politiques :

- Les fonctions d'aide (`teaches()`, `is_super_admin()`…) sont en
  `SECURITY DEFINER` : sans cela, une policy sur `profiles` qui interroge
  `profiles` provoquerait une **récursion infinie**.
- Des déclencheurs verrouillent les colonnes sensibles : un étudiant ne peut ni
  se promouvoir, ni s'ouvrir des droits de réservation, ni réécrire un
  compte-rendu. Ils s'effacent lorsque `auth.uid()` est nul, c'est-à-dire
  lorsque l'appel vient du code serveur de confiance (clé de service).
- Les **notes privées** de l'enseignant ne transitent jamais vers l'apprenant :
  celui-ci lit la vue `student_reports`, qui ne contient pas la colonne.
- Les comptes-rendus en brouillon sont invisibles tant qu'ils ne sont pas
  publiés.

### Tests de cloisonnement

26 assertions rejouent les migrations sur un PostgreSQL nu et vérifient
l'isolation entre rôles, y compris les tentatives d'escalade de privilèges :

```bash
createdb english_course_test
DATABASE_URL=postgres://postgres@localhost/english_course_test \
  ./supabase/tests/run.sh
```

---

## 5. Parcours fonctionnels

### Étudiant (mobile-first)

`/app` — accueil : progression, prochaine séance et lien Meet · `/app/parcours`
— les séances et leur ordre du jour · `/app/reserver` — widget Calendly ·
`/app/comptes-rendus` — bilans publiés · `/app/devoirs` — to-do interactive et
bibliothèque · `/app/evaluation` — auto-évaluation de mi-parcours · `/app/profil`
— notifications, export RGPD, suppression du compte.

L'accès à la réservation reste **fermé par défaut** : l'enseignant l'ouvre
manuellement une fois les modalités réglées, la facturation se faisant hors
plateforme.

### Enseignant (back-office)

`/prof` — séances du jour et files d'attente · `/prof/planning` — vue semaine ·
`/prof/etudiants` — liste et fiche détaillée · `/prof/appels` — CRM des appels
de découverte · `/prof/parcours` — gabarits réutilisables · `/prof/ressources` —
bibliothèque et partages · `/prof/comptes-rendus` — éditeur avec checklist de
compétences.

Publier un compte-rendu (RPC `publish_report`) marque la séance comme faite,
**déverrouille la suivante** et notifie l'apprenant.

### Super administrateur

`/admin` — volume de leçons et activité par enseignant ·
`/admin/utilisateurs` — création, suspension, changement de rôle, affectation
d'un étudiant à un enseignant, suppression définitive.

---

## 6. RGPD

- Consentement explicite aux CGU et à la politique de confidentialité à
  l'inscription, horodaté dans `consents`.
- **Portabilité** : `/api/compte/export` renvoie l'intégralité des données en
  JSON.
- **Droit à l'oubli** : depuis `Profil → Confidentialité`. La RPC
  `request_account_deletion` trace la demande et anonymise le profil, puis la
  Server Action supprime le compte `auth.users` — ce qui cascade sur toutes les
  données pédagogiques.
- Les supports de cours vivent dans un bucket **privé** ; ils ne sont servis
  qu'au travers d'URL signées valables 10 minutes, via `/api/ressources/[id]`.

---

## 7. PWA

- Manifeste généré par `src/app/manifest.ts`, icônes dans `public/icons/`.
- `public/sw.js` : coquille hors-ligne et cache des assets statiques.
  Le service worker n'est enregistré **qu'en production**.
- Interface pensée mobile d'abord (70 % des usages apprenants), navigation par
  onglets en bas d'écran, zones tactiles confortables.

---

## Structure du projet

```
src/
├── app/
│   ├── (student)/app/     Espace apprenant (layout à navigation basse)
│   ├── prof/              Back-office enseignant (layout à barre latérale)
│   ├── admin/             Console super administrateur
│   ├── actions/           Server Actions (auth, student, teacher, admin, rgpd)
│   └── api/               Webhook Calendly, cron, export RGPD, ressources
├── components/            UI partagée + composants par espace
├── lib/
│   ├── supabase/          Clients navigateur / serveur / service / session
│   ├── queries/           Chargement des données par espace
│   ├── email/             Gabarits et envoi Resend
│   └── calendly.ts        Types, signature du webhook, contexte de réservation
└── proxy.ts               Rafraîchissement de session + routage par rôle
supabase/
├── migrations/            Schéma, RLS, storage et RPC
├── tests/                 Suite d'assertions RLS
└── seed.sql               Jeu de démonstration
```

## Scripts

```bash
npm run dev      # développement
npm run build    # build de production
npm run start    # serveur de production
npm run lint     # ESLint
npx tsc --noEmit # vérification des types
```

## Déploiement sur Vercel

1. Importer le dépôt, laisser Vercel détecter Next.js.
2. Reporter toutes les variables de `.env.example` dans les *Environment
   Variables*, avec `NEXT_PUBLIC_SITE_URL` pointant sur le domaine final.
3. Le cron de `vercel.json` s'active automatiquement au premier déploiement.
4. Dans Supabase, ajouter le domaine aux *Redirect URLs*
   (`Authentication → URL Configuration`).
