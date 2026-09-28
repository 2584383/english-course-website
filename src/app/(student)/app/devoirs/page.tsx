import Link from "next/link";

import { ResourceList } from "@/components/student/ResourceList";
import { WorkChecklist } from "@/components/student/WorkChecklist";
import {
  ActionLink,
  Chevron,
  Kicker,
  Panel,
  PageHeader,
} from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import {
  getSharedResources,
  getStudentDashboard,
  getTeacherName,
} from "@/lib/queries/student";
import { groupWork, type WorkItem } from "@/lib/student-work";
import { cn, firstName } from "@/lib/utils";

export const metadata = { title: "Mon travail" };

function weekdayOf(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
  }).format(new Date(iso));
}

/** Mon travail : devoirs groupés par échéance + bibliothèque (wireframe 3b). */
export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue } = await searchParams;
  const showResources = vue === "ressources";

  const { profile, studentProfile } = await requireStudent();
  const [dashboard, resources, teacherName] = await Promise.all([
    getStudentDashboard(profile.id),
    getSharedResources(profile.id),
    getTeacherName(studentProfile?.teacher_id),
  ]);

  const { assignments, sessions, nextBooking, lastBooking } = dashboard;
  const work = groupWork({ assignments, sessions, nextBooking, lastBooking });
  const teacher = firstName(teacherName) || "ton enseignant";
  const Teacher = teacher[0].toUpperCase() + teacher.slice(1);
  const nextDay = nextBooking ? weekdayOf(nextBooking.starts_at) : null;
  const before = nextDay ? `avant ${nextDay}` : null;

  const nowDone = work.now.filter((item) => item.done).length;
  const subtitle = showResources
    ? `${resources.length} ressource${resources.length > 1 ? "s" : ""} partagée${resources.length > 1 ? "s" : ""} par ${Teacher}`
    : work.now.length > 0
      ? `${nowDone} devoir${nowDone > 1 ? "s" : ""} fait${nowDone > 1 ? "s" : ""} sur ${work.now.length}${before ? ` ${before}` : ""}`
      : "Tout est à jour";

  const segmented = (
    <div
      role="tablist"
      aria-label="Vue"
      className="flex gap-1 rounded-[14px] bg-track p-1 lg:rounded-[13px]"
    >
      {[
        { label: "Devoirs", href: "/app/devoirs", active: !showResources },
        { label: "Ressources", href: "/app/devoirs?vue=ressources", active: showResources },
      ].map((tab) => (
        <Link
          key={tab.label}
          href={tab.href}
          role="tab"
          aria-selected={tab.active}
          className={cn(
            "flex-1 rounded-[11px] py-[9px] text-center text-[13px] font-bold no-underline transition lg:flex-none lg:rounded-[10px] lg:px-[22px]",
            tab.active ? "bg-white text-brand-800" : "text-brand-500 hover:text-brand-800",
          )}
        >
          {tab.label}
        </Link>
      ))}
    </div>
  );

  const hasAny = assignments.length > 0;

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
      <PageHeader
        title="Mon travail"
        subtitle={subtitle}
        action={<div className="hidden lg:block">{segmented}</div>}
      />
      <div className="lg:hidden">{segmented}</div>

      {showResources ? (
        <ResourceList resources={resources} />
      ) : !hasAny || (work.now.length === 0 && work.later.length === 0) ? (
        /* État vide (wireframe 3b, 3e téléphone) */
        <div className="grid max-w-[1060px] items-start gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-5">
          <Panel
            tone="dashed"
            className="flex flex-col items-center gap-2.5 px-3.5 py-[22px] text-center lg:py-8"
          >
            <span
              aria-hidden
              className="flex size-12 items-center justify-center rounded-full bg-soft text-xl font-bold text-brand-800"
            >
              ✓
            </span>
            <p className="font-display text-base font-bold text-ink">Tout est à jour</p>
            <p className="max-w-xs text-[13px] leading-snug text-brand-500">
              {Teacher} te donnera tes prochains devoirs après
              {nextDay ? ` la séance de ${nextDay}` : " ta prochaine séance"}.
            </p>
          </Panel>

          <div className="flex flex-col gap-3.5 lg:gap-4">
            {work.done.length > 0 ? <DoneDrawer items={work.done} /> : null}
            {resources.length > 0 ? (
              <Panel tone="dashed" className="flex flex-col gap-2">
                <Kicker>En attendant</Kicker>
                <p className="text-[13px] leading-snug text-brand-500">
                  {resources.length} ressource{resources.length > 1 ? "s" : ""} dans ta bibliothèque
                </p>
                <ActionLink
                  href="/app/devoirs?vue=ressources"
                  tone="outline"
                  className="self-start px-[18px]"
                >
                  Voir
                </ActionLink>
              </Panel>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid max-w-[1060px] items-start gap-3.5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-5">
          <div className="flex flex-col gap-3.5 lg:gap-4">
            {work.now.length > 0 ? (
              <WorkChecklist
                mode="progress"
                title={before ? "Avant ta prochaine séance" : "À faire"}
                items={work.now}
              />
            ) : null}

            {work.later.length > 0 ? (
              <>
                <Kicker>Pour plus tard</Kicker>
                <WorkChecklist mode="list" items={work.later} />
              </>
            ) : null}
          </div>

          <div className="flex flex-col gap-3.5 lg:gap-4">
            {work.done.length > 0 ? <DoneDrawer items={work.done} /> : null}
            <p className="text-center text-[12.5px] leading-[1.45] text-muted-soft lg:rounded-[18px] lg:border lg:border-line lg:bg-white lg:p-5 lg:text-left lg:text-[13.5px] lg:leading-[1.55] lg:text-brand-500">
              Rien à envoyer : tu coches quand c&apos;est fait, et vous en parlez
              en séance avec {Teacher}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/** « Terminés · N devoirs », repliable. */
function DoneDrawer({ items }: { items: WorkItem[] }) {
  return (
    <details className="group">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-[18px] border border-dashed border-dash bg-white p-[15px] lg:p-5 [&::-webkit-details-marker]:hidden">
        <span className="flex-1">
          <span className="block font-display text-sm font-bold leading-[1.2] text-ink lg:text-[15px]">
            Terminés
          </span>
          <span className="mt-0.5 block text-[12.5px] leading-[1.35] text-muted-soft">
            {items.length} devoir{items.length > 1 ? "s" : ""}
          </span>
        </span>
        <span className="transition group-open:rotate-90">
          <Chevron />
        </span>
      </summary>
      <div className="mt-2.5">
        <WorkChecklist mode="list" items={items} />
      </div>
    </details>
  );
}
