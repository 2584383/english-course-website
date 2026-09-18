import Link from "next/link";

import { NextSessionCard } from "@/components/student/NextSessionCard";
import {
  Avatar,
  ButtonLink,
  Card,
  Eyebrow,
  ProgressBar,
  SectionTitle,
} from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries/student";
import { formatDate, initials } from "@/lib/utils";

export const metadata = { title: "Accueil" };

export default async function StudentHomePage() {
  const { profile, studentProfile } = await requireStudent();
  const dashboard = await getStudentDashboard(profile.id);
  const {
    path,
    progress,
    nextBooking,
    latestReport,
    assignments,
    needsSelfEvaluation,
  } = dashboard;

  const firstName = profile.full_name?.split(" ")[0] ?? "";
  const todo = assignments.filter((a) => a.status === "todo");
  const isFirstVisit = progress.done === 0 && !nextBooking;

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-[25px] font-extrabold leading-tight text-ink">
            Bonjour {firstName}
          </h1>
          <p className="text-[13px] text-muted">
            {path
              ? `${path.name} · ${
                  progress.done === 0
                    ? `${progress.total} séances`
                    : `séance ${Math.min(progress.done + 1, progress.total)} / ${progress.total}`
                }`
              : "Ton parcours arrive après l'appel de découverte."}
          </p>
        </div>
        <Link href="/app/profil" aria-label="Mon profil">
          <Avatar label={initials(profile.full_name)} />
        </Link>
      </header>

      {isFirstVisit ? (
        <Card tone="soft" className="flex flex-col gap-3">
          <Eyebrow>Première étape</Eyebrow>
          <p className="text-sm leading-relaxed text-brand-900">
            Ton parcours est prêt. Réserve ta première séance pour lancer la
            progression.
          </p>
          <ButtonLink href="/app/reserver" tone="accent">
            Réserver ma première séance
          </ButtonLink>
        </Card>
      ) : null}

      {nextBooking ? (
        <NextSessionCard booking={nextBooking} />
      ) : !isFirstVisit ? (
        <Card className="flex flex-col gap-3">
          <Eyebrow>Prochaine séance</Eyebrow>
          <p className="text-sm text-muted">
            Aucun créneau réservé pour le moment.
          </p>
          <ButtonLink href="/app/reserver" tone="accent">
            Choisir un créneau
          </ButtonLink>
        </Card>
      ) : null}

      {path ? (
        <Card className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link
                href="/app/parcours"
                className="text-xs font-bold text-brand-800"
              >
                Voir le parcours
              </Link>
            }
          >
            Ma progression
          </SectionTitle>
          <ProgressBar
            value={progress.pct}
            label={`${progress.done} / ${progress.total} séances`}
            sublabel={
              progress.done === 0
                ? "Ça commence après ta première séance."
                : `${progress.done} séances faites sur ${progress.total}.`
            }
          />
        </Card>
      ) : null}

      {needsSelfEvaluation ? (
        <Card tone="accent" className="flex flex-col gap-3">
          <Eyebrow>Mi-parcours</Eyebrow>
          <p className="text-sm leading-relaxed text-ink">
            3 questions pour mesurer ta prise de confiance et réajuster la suite.
          </p>
          <ButtonLink href="/app/evaluation" tone="primary">
            Faire mon auto-évaluation
          </ButtonLink>
        </Card>
      ) : null}

      {latestReport ? (
        <Card className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <Eyebrow>Dernier compte-rendu</Eyebrow>
            {!latestReport.read_at ? (
              <span
                className="size-2 rounded-full bg-brand-800"
                aria-label="Non lu"
              />
            ) : null}
          </div>
          <Link
            href={`/app/comptes-rendus/${latestReport.id}`}
            className="font-display text-base font-bold text-ink no-underline"
          >
            {latestReport.session_title ?? latestReport.theme ?? "Séance"}
          </Link>
          <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
            {latestReport.strengths ?? "Compte-rendu disponible."}
          </p>
          <p className="text-xs text-muted-soft">
            {latestReport.published_at
              ? formatDate(latestReport.published_at)
              : null}
          </p>
        </Card>
      ) : null}

      {todo.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <SectionTitle
            action={
              <Link
                href="/app/devoirs"
                className="text-xs font-bold text-brand-800"
              >
                Tout voir
              </Link>
            }
          >
            À faire · {todo.length}
          </SectionTitle>
          <ul className="flex flex-col gap-2">
            {todo.slice(0, 3).map((assignment) => (
              <li
                key={assignment.id}
                className="flex items-start gap-3 rounded-[var(--radius-field)] border border-line p-3"
              >
                <span className="mt-0.5 size-5 flex-none rounded-md border-2 border-brand-300" />
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {assignment.title}
                  </span>
                  {assignment.due_label ? (
                    <span className="block text-xs text-muted-soft">
                      {assignment.due_label}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {studentProfile?.goal_in_own_words ? (
        <Card tone="soft" className="flex flex-col gap-1.5">
          <Eyebrow>Mon objectif</Eyebrow>
          <p className="text-sm leading-relaxed text-brand-900">
            {studentProfile.goal_in_own_words}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
