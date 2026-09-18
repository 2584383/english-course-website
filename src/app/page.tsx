import Link from "next/link";

import { ButtonLink, Card, Eyebrow } from "@/components/ui";
import { getSessionUser } from "@/lib/auth";
import { HOME_BY_ROLE } from "@/lib/supabase/session";

/** Les 4 scénarios d'usage du cahier des charges (§1.2). */
const SCENARIOS = [
  {
    title: "Entretiens d'embauche",
    body: "Pitch professionnel, méthode STAR, questions pièges et négociation salariale.",
  },
  {
    title: "Intégration académique",
    body: "Masters anglophones, soutenances et présentations orales devant un jury.",
  },
  {
    title: "Communication professionnelle",
    body: "Réunions, négociations et échanges avec des partenaires anglophones.",
  },
  {
    title: "Fluidité & confiance",
    body: "Prise de parole spontanée, expressions idiomatiques, vie courante.",
  },
];

const STEPS = [
  {
    step: "1",
    title: "Appel de découverte",
    body: "Un premier échange pour cerner ton niveau, ton objectif et ton échéance.",
  },
  {
    step: "2",
    title: "Parcours sur mesure",
    body: "Ton enseignant construit une progression séance par séance, ajustable à tout moment.",
  },
  {
    step: "3",
    title: "Séances & comptes-rendus",
    body: "Tu réserves tes créneaux, tu reçois un bilan écrit après chaque séance.",
  },
];

export default async function LandingPage() {
  const session = await getSessionUser();

  return (
    <main className="min-h-dvh bg-brand-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <span className="font-display text-base font-extrabold text-ink">
          English with Lea
        </span>
        {session ? (
          <ButtonLink href={HOME_BY_ROLE[session.profile.role]} tone="ghost">
            Mon espace
          </ButtonLink>
        ) : (
          <Link href="/connexion" className="text-sm font-bold text-brand-800">
            Se connecter
          </Link>
        )}
      </header>

      <section className="mx-auto max-w-3xl px-5 pb-12 pt-6 text-center sm:pt-14">
        <Eyebrow>Cours d&apos;anglais oral · en visio</Eyebrow>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.1] text-ink sm:text-5xl">
          Un parcours construit pour <em className="not-italic text-brand-800">ton</em>{" "}
          échéance
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted">
          Pas une mise en relation de plus : un enseignant qui conçoit ta
          progression, la réajuste séance après séance et t&apos;écrit un bilan
          détaillé à chaque fois.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <ButtonLink href="/inscription" tone="accent">
            Créer mon compte
          </ButtonLink>
          <ButtonLink href="/connexion" tone="ghost">
            J&apos;ai déjà un compte
          </ButtonLink>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-14">
        <h2 className="mb-4 text-center font-display text-2xl font-extrabold text-ink">
          Quatre objectifs, quatre parcours
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {SCENARIOS.map((scenario) => (
            <Card key={scenario.title} className="flex flex-col gap-1.5">
              <h3 className="font-display text-base font-bold text-ink">
                {scenario.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted">
                {scenario.body}
              </p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 pb-16">
        <h2 className="mb-4 text-center font-display text-2xl font-extrabold text-ink">
          Comment ça se passe
        </h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((item) => (
            <li key={item.step}>
              <Card tone="soft" className="flex h-full flex-col gap-2">
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-800 font-display text-sm font-extrabold text-white">
                  {item.step}
                </span>
                <h3 className="font-display text-base font-bold text-ink">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-brand-600">
                  {item.body}
                </p>
              </Card>
            </li>
          ))}
        </ol>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 px-5 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} English with Lea</span>
          <nav className="flex gap-4">
            <Link href="/cgu" className="text-brand-600">
              CGU
            </Link>
            <Link href="/confidentialite" className="text-brand-600">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
