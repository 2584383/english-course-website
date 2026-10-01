import Link from "next/link";

import { NextSessionCard } from "@/components/student/NextSessionCard";
import { WorkChecklist } from "@/components/student/WorkChecklist";
import {
  ActionLink,
  Bar,
  Chevron,
  Kicker,
  Panel,
  PageHeader,
  TextLink,
} from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { getDiscoveryState } from "@/lib/discovery";
import { getStudentDashboard, getTeacherName } from "@/lib/queries/student";
import { groupWork } from "@/lib/student-work";
import { firstName, formatShortDate, initials } from "@/lib/utils";

export const metadata = { title: "Accueil" };

/**
 * Accueil « la séance d'abord » (wireframe 1a, prototypes hi-fi).
 * Hiérarchie : séance → progression → compte-rendu → devoirs.
 * Desktop : deux colonnes 1.55fr / 1fr.
 */
export default async function StudentHomePage() {
  const { profile, studentProfile } = await requireStudent();
  const [dashboard, teacherName, discovery] = await Promise.all([
    getStudentDashboard(profile.id),
    getTeacherName(studentProfile?.teacher_id),
    getDiscoveryState(profile.id),
  ]);
  const {
    path,
    sessions,
    progress,
    nextBooking,
    lastBooking,
    latestReport,
    assignments,
    needsSelfEvaluation,
  } = dashboard;

  const teacher = firstName(teacherName) || "ton enseignant";
  const Teacher = teacher[0].toUpperCase() + teacher.slice(1);
  const work = groupWork({ assignments, sessions, nextBooking, lastBooking });
  const isFirstVisit = progress.done === 0 && !nextBooking;
  const openCount = sessions.filter((s) => s.status === "open").length;

  const subtitle = path
    ? progress.done === 0
      ? `${path.name} · ${progress.total} séances`
      : `${path.name} · séance ${Math.min(progress.done + 1, progress.total)} / ${progress.total}`
    : `${Teacher} prépare ton parcours.`;

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-[22px]">
      <PageHeader
        title={`Bonjour ${firstName(profile.full_name)}`}
        subtitle={subtitle}
        action={
          <>
            <Link
              href="/app/profil"
              aria-label="Mon profil"
              className="flex size-[46px] flex-none items-center justify-center rounded-full border border-soft-border bg-soft font-display text-base font-extrabold text-brand-800 no-underline lg:hidden"
            >
              {initials(profile.full_name).slice(0, 1)}
            </Link>
            <ActionLink
              href="/app/reserver"
              className="hidden px-5 py-3 text-sm lg:inline-flex"
            >
              Réserver une séance
            </ActionLink>
          </>
        }
      />

      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:gap-5">
        <div className="flex min-w-0 flex-col gap-3.5 lg:gap-5">
          {discovery.offer ? (
            <Panel
              tone="soft"
              size="lg"
              className="flex flex-col gap-2.5 lg:gap-[11px] lg:p-[26px]"
            >
              <Kicker tone="brand">Première étape</Kicker>
              <p className="font-display text-[19px] font-bold leading-[1.2] text-ink lg:text-2xl">
                Réserve ton appel découverte
              </p>
              <p className="max-w-[520px] text-sm leading-[1.45] text-body lg:text-[15px] lg:leading-normal">
                Choisis ton prof et un créneau : vous ferez le point sur ton
                niveau et tes objectifs avant de construire ton parcours.
              </p>
              <ActionLink
                href="/app/decouverte"
                className="mt-0.5 lg:mt-1 lg:self-start lg:px-6 lg:py-[13px]"
              >
                Choisir mon prof
              </ActionLink>
            </Panel>
          ) : null}

          {isFirstVisit && path ? (
            <Panel
              tone="soft"
              size="lg"
              className="flex flex-col gap-2.5 lg:gap-[11px] lg:p-[26px]"
            >
              <Kicker tone="brand">Première étape</Kicker>
              <p className="font-display text-[19px] font-bold leading-[1.2] text-ink lg:text-2xl">
                Réserve ta première séance
              </p>
              <p className="max-w-[520px] text-sm leading-[1.45] text-body lg:text-[15px] lg:leading-normal">
                {Teacher} a préparé ton
                parcours après votre appel.
                {openCount > 0
                  ? ` ${openCount} séance${openCount > 1 ? "s sont ouvertes" : " est ouverte"}.`
                  : ""}
              </p>
              <ActionLink
                href="/app/reserver"
                className="mt-0.5 lg:mt-1 lg:self-start lg:px-6 lg:py-[13px]"
              >
                Choisir un créneau
              </ActionLink>
            </Panel>
          ) : null}

          {nextBooking ? (
            <NextSessionCard
              booking={nextBooking}
              teacherName={teacherName ? firstName(teacherName) : null}
            />
          ) : !isFirstVisit && path ? (
            <Panel tone="soft" size="lg" className="flex flex-col gap-2.5 lg:p-[26px]">
              <Kicker tone="brand">Prochaine séance</Kicker>
              <p className="font-display text-[19px] font-bold leading-[1.2] text-ink lg:text-2xl">
                Aucun créneau réservé
              </p>
              <p className="text-sm leading-[1.45] text-body lg:text-[15px]">
                Choisis le prochain créneau pour garder le rythme.
              </p>
              <ActionLink href="/app/reserver" className="mt-0.5 lg:self-start lg:px-6 lg:py-[13px]">
                Choisir un créneau
              </ActionLink>
            </Panel>
          ) : null}

          <Panel size="lg" className="flex flex-col gap-[9px] lg:gap-[11px]">
            <div className="flex items-baseline justify-between gap-3">
              <Kicker>Ma progression</Kicker>
              <span className="font-display text-[13px] font-bold tabular-nums text-brand-800 lg:text-[15px]">
                {progress.pct} %
              </span>
            </div>
            <Bar value={progress.pct} />
            <p className="text-[13px] leading-snug text-brand-500 lg:text-sm">
              {!path
                ? "Ta progression apparaîtra dès que ton parcours sera prêt."
                : progress.done === 0
                  ? `0 / ${progress.total} · ça commence après ta première séance`
                  : `${progress.done} séances faites sur ${progress.total}`}
            </p>
            {path ? (
              <TextLink
                href="/app/parcours"
                className="mt-1 hidden self-start text-[13px] lg:inline"
              >
                Voir les {progress.total} séances →
              </TextLink>
            ) : null}
          </Panel>

          {latestReport ? (
            <Link
              href={`/app/comptes-rendus/${latestReport.id}`}
              className="block no-underline"
            >
              <Panel
                size="lg"
                className="flex flex-col gap-2 transition hover:border-soft-border lg:gap-[9px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <Kicker>Dernier compte-rendu</Kicker>
                  <span className="flex items-center gap-[7px]">
                    {!latestReport.read_at ? (
                      <span
                        className="size-[7px] rounded-full bg-brand-800"
                        aria-label="Non lu"
                      />
                    ) : null}
                    <span className="text-xs font-semibold text-brand-500">
                      {formatShortDate(latestReport.published_at ?? latestReport.starts_at)}
                    </span>
                  </span>
                </div>
                <p className="font-display text-base font-bold leading-[1.25] text-ink lg:text-[19px]">
                  {latestReport.session_title ?? latestReport.theme ?? "Séance"}
                </p>
                <p className="line-clamp-2 max-w-[620px] text-sm leading-[1.45] text-body lg:text-[14.5px] lg:leading-normal">
                  {[
                    latestReport.strengths,
                    latestReport.improvements
                      ? `à travailler : ${latestReport.improvements}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Ton compte-rendu est disponible."}
                </p>
              </Panel>
            </Link>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-3.5 lg:gap-5">
          {work.now.length > 0 ? (
            <WorkChecklist
              mode="home"
              items={work.now}
              title="À faire"
              moreHref="/app/devoirs"
            />
          ) : null}

          {work.later.length > 0 ? (
            <div className="hidden lg:block">
              <WorkChecklist mode="home" items={work.later} title="Pour plus tard" />
            </div>
          ) : null}

          {needsSelfEvaluation ? (
            <Link href="/app/evaluation" className="block no-underline">
              <Panel
                tone="dashed"
                size="lg"
                className="flex items-center gap-3 transition hover:border-soft-border"
              >
                <span className="flex-1">
                  <span className="block font-display text-[15px] font-bold leading-[1.2] text-ink lg:text-base">
                    Où en es-tu, vraiment ?
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-[1.4] text-brand-500 lg:mt-[3px]">
                    Auto-évaluation de mi-parcours · 3 questions, 2 min
                  </span>
                </span>
                <span aria-hidden className="text-lg font-bold text-brand-800">
                  ›
                </span>
              </Panel>
            </Link>
          ) : null}

          {work.now.length === 0 && work.later.length === 0 && !isFirstVisit ? (
            <Panel size="lg" className="flex flex-col gap-2">
              <Kicker>À faire</Kicker>
              <p className="text-sm leading-[1.45] text-body">
                Tout est à jour. {Teacher} te donnera tes prochains devoirs après la séance.
              </p>
              <Link
                href="/app/devoirs?vue=ressources"
                className="flex items-center gap-2 text-xs font-bold text-brand-800 no-underline"
              >
                Voir mes ressources <Chevron />
              </Link>
            </Panel>
          ) : null}
        </div>
      </div>
    </div>
  );
}
