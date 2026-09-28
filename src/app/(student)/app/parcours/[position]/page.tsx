import { notFound } from "next/navigation";

import { WorkChecklist } from "@/components/student/WorkChecklist";
import {
  ActionLink,
  BackLink,
  Chevron,
  DetailHeader,
  KindTile,
  Kicker,
  Panel,
  actionClass,
} from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import type {
  AgendaItem,
  Assignment,
  Booking,
  PathSession,
  Resource,
} from "@/lib/database.types";
import { getStudentDashboard } from "@/lib/queries/student";
import { createClient } from "@/lib/supabase/server";
import { workMeta } from "@/lib/student-work";
import {
  MODULE_LABELS,
  RESOURCE_KIND_LABELS,
  formatShortDate,
  formatSlot,
  isMeetOpen,
} from "@/lib/utils";

export const metadata = { title: "Séance" };

function metaFor(session: PathSession, booking: Booking | null) {
  if (session.status === "booked" && booking) {
    return formatSlot(booking.starts_at, booking.ends_at);
  }
  if (session.status === "done") {
    return booking ? `Faite le ${formatShortDate(booking.starts_at)} · 1 h` : "Séance faite";
  }
  if (session.status === "locked") {
    return `S'ouvrira après la séance ${session.position - 1}`;
  }
  return "1 h · pas encore réservée";
}

/** Détail d'une séance : objectif, ordre du jour, préparation, ressources. */
export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ position: string }>;
}) {
  const { position } = await params;
  const { profile } = await requireStudent();
  const { sessions } = await getStudentDashboard(profile.id);

  const session = sessions.find((s) => s.position === Number(position));
  if (!session) notFound();

  const supabase = await createClient();
  const [{ data: booking }, { data: report }, { data: assignmentRows }] =
    await Promise.all([
      supabase
        .from("bookings")
        .select("*")
        .eq("path_session_id", session.id)
        .eq("student_id", profile.id)
        .neq("status", "canceled")
        .order("starts_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("student_reports")
        .select("id")
        .eq("student_id", profile.id)
        .eq("session_position", session.position)
        .maybeSingle(),
      supabase
        .from("assignments")
        .select("*")
        .eq("student_id", profile.id)
        .eq("path_session_id", session.id)
        .order("created_at"),
    ]);

  const assignments = (assignmentRows ?? []) as Assignment[];
  const resourceIds = [
    ...new Set(assignments.map((a) => a.resource_id).filter(Boolean)),
  ] as string[];
  const { data: resourceRows } = resourceIds.length
    ? await supabase.from("resources").select("*").in("id", resourceIds)
    : { data: [] };
  const resources = (resourceRows ?? []) as Resource[];

  const agenda = (session.agenda ?? []) as AgendaItem[];
  const typedBooking = (booking as Booking | null) ?? null;

  /* CTA : rejoindre, réserver, relire, ou rien tant que c'est verrouillé */
  let cta: React.ReactNode = null;
  if (session.status === "booked" && typedBooking) {
    cta =
      typedBooking.meet_url && isMeetOpen(typedBooking.starts_at) ? (
        <a
          href={typedBooking.meet_url}
          target="_blank"
          rel="noreferrer"
          className={actionClass("accent", "w-full lg:w-auto lg:px-[22px] lg:py-[13px] lg:text-sm")}
        >
          Rejoindre sur Google Meet
        </a>
      ) : (
        <span
          aria-disabled
          className={actionClass(
            "accent",
            "w-full cursor-default opacity-70 hover:brightness-100 lg:w-auto lg:px-[22px] lg:py-[13px] lg:text-sm",
          )}
        >
          Le lien Meet s&apos;ouvre 15 min avant
        </span>
      );
  } else if (session.status === "open") {
    cta = (
      <ActionLink
        href="/app/reserver"
        className="w-full lg:w-auto lg:px-[22px] lg:py-[13px] lg:text-sm"
      >
        Choisir un créneau
      </ActionLink>
    );
  } else if (session.status === "done" && report) {
    cta = (
      <ActionLink
        href={`/app/comptes-rendus/${report.id}`}
        className="w-full lg:w-auto lg:px-[22px] lg:py-[13px] lg:text-sm"
      >
        Lire le compte-rendu
      </ActionLink>
    );
  } else if (session.status === "locked") {
    cta = (
      <span className={actionClass("disabled", "w-full lg:w-auto lg:px-[22px] lg:py-[13px] lg:text-sm")}>
        Séance pas encore ouverte
      </span>
    );
  }

  return (
    <div className="flex max-w-[980px] flex-col gap-3.5 animate-pop lg:gap-5">
      <BackLink href="/app/parcours">Mon parcours</BackLink>

      <DetailHeader
        kicker={`Séance ${session.position} · ${MODULE_LABELS[session.module]}`}
        title={session.title}
        meta={metaFor(session, typedBooking)}
        action={cta}
      />

      {session.goal ? (
        <Panel tone="soft">
          <Kicker tone="brand">Ce que tu vas savoir faire</Kicker>
          <p className="mt-[7px] max-w-[720px] text-[15px] font-semibold leading-[1.4] text-ink lg:mt-2 lg:text-[17px] lg:leading-[1.45]">
            {session.goal}
          </p>
        </Panel>
      ) : null}

      <div className="grid items-start gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-4">
        {agenda.length > 0 ? (
          <Panel className="flex flex-col gap-[11px] lg:gap-[13px]">
            <Kicker>Au programme</Kicker>
            <ol className="flex flex-col gap-[11px] lg:gap-[13px]">
              {agenda.map((item, index) => (
                <li key={index} className="flex items-baseline gap-3 lg:gap-3.5">
                  <span className="w-12 flex-none text-xs font-bold text-brand-800 lg:w-[54px] lg:text-[12.5px]">
                    {item.duration}
                  </span>
                  <span className="flex-1 text-sm leading-[1.4] text-brand-600 lg:text-[14.5px] lg:leading-[1.45]">
                    {item.label}
                  </span>
                </li>
              ))}
            </ol>
          </Panel>
        ) : (
          <Panel className="flex flex-col gap-2">
            <Kicker>Au programme</Kicker>
            <p className="text-sm leading-[1.45] text-brand-500">
              L&apos;ordre du jour sera précisé avant la séance.
            </p>
          </Panel>
        )}

        {assignments.length > 0 || resources.length > 0 ? (
          <div className="flex flex-col gap-3.5 lg:gap-4">
            {assignments.length > 0 ? (
              <WorkChecklist
                mode="list"
                title="À préparer avant"
                items={assignments.map((a) => ({
                  id: a.id,
                  title: a.title,
                  meta: workMeta(a),
                  done: a.status === "done",
                }))}
              />
            ) : null}

            {resources.length > 0 ? (
              <Panel className="flex flex-col gap-2.5 lg:gap-3">
                <Kicker>Ressources de la séance</Kicker>
                <ul className="flex flex-col gap-2.5 lg:gap-3">
                  {resources.map((resource) => (
                    <li key={resource.id}>
                      <a
                        href={resource.external_url ?? `/api/ressources/${resource.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-[11px] no-underline"
                      >
                        <KindTile label={RESOURCE_KIND_LABELS[resource.kind]} />
                        <span className="flex-1 text-sm font-semibold leading-[1.3] text-ink">
                          {resource.title}
                        </span>
                        <Chevron />
                      </a>
                    </li>
                  ))}
                </ul>
              </Panel>
            ) : null}
          </div>
        ) : null}
      </div>

      {cta ? <div className="flex lg:hidden">{cta}</div> : null}
    </div>
  );
}
