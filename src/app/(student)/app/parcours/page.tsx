import Link from "next/link";

import { Bar, Empty, Panel, PageHeader } from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import type { Booking, PathSession, StudentReport } from "@/lib/database.types";
import {
  getStudentBookings,
  getStudentDashboard,
  getStudentReports,
} from "@/lib/queries/student";
import { MODULE_LABELS, cn, formatShortDate, formatSlot } from "@/lib/utils";

export const metadata = { title: "Mon parcours" };

const FILTERS = [
  { key: "toutes", label: "Toutes" },
  { key: "a-venir", label: "À venir" },
  { key: "passees", label: "Passées" },
] as const;

type FilterKey = (typeof FILTERS)[number]["key"];

/** Quatre états, quatre traitements (wireframe 3a, prototype hi-fi). */
const STATE_STYLES = {
  done: {
    card: "border-line bg-white",
    num: "bg-chip text-muted",
    tag: "bg-chip text-chip-ink",
  },
  booked: {
    card: "border-soft-border bg-soft",
    num: "bg-brand-800 text-white",
    tag: "bg-brand-800 text-white",
  },
  open: {
    card: "border-line bg-white",
    num: "bg-white text-brand-800",
    tag: "bg-soft text-brand-800",
  },
  locked: {
    card: "border-line bg-locked opacity-75",
    num: "bg-chip text-faint",
    tag: "bg-transparent text-faint",
  },
} as const;

function durationLabel(booking: Booking | undefined) {
  if (!booking) return "1 h";
  const minutes = Math.round(
    (new Date(booking.ends_at).getTime() - new Date(booking.starts_at).getTime()) /
      60_000,
  );
  return minutes % 60 === 0 ? `${minutes / 60} h` : `${minutes} min`;
}

function describe(
  session: PathSession,
  booking: Booking | undefined,
  report: StudentReport | undefined,
) {
  switch (session.status) {
    case "done":
      return {
        meta: booking
          ? `${formatShortDate(booking.starts_at)} · ${durationLabel(booking)}`
          : "Séance faite",
        tag: report ? "compte-rendu" : "faite",
        href: report
          ? `/app/comptes-rendus/${report.id}`
          : `/app/parcours/${session.position}`,
      };
    case "booked":
      return {
        meta: booking ? formatSlot(booking.starts_at, booking.ends_at) : "Créneau réservé",
        tag: "réservée",
        href: `/app/parcours/${session.position}`,
      };
    case "open":
      return {
        meta: `${MODULE_LABELS[session.module]} · 1 h`,
        tag: "à réserver",
        href: `/app/parcours/${session.position}`,
      };
    default:
      return {
        meta: `après la séance ${session.position - 1}`,
        tag: "à venir",
        href: `/app/parcours/${session.position}`,
      };
  }
}

export default async function PathPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const { filtre } = await searchParams;
  const filter: FilterKey = FILTERS.some((f) => f.key === filtre)
    ? (filtre as FilterKey)
    : "toutes";

  const { profile } = await requireStudent();
  const [{ path, sessions, progress }, bookings, reports] = await Promise.all([
    getStudentDashboard(profile.id),
    getStudentBookings(profile.id),
    getStudentReports(profile.id),
  ]);

  if (!path) {
    return (
      <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
        <PageHeader title="Mon parcours" />
        <Empty
          title="Pas encore de parcours"
          description="Ton enseignant construit ton parcours après l'appel de découverte. Tu recevras un email dès qu'il est prêt."
        />
      </div>
    );
  }

  // Réservation la plus récente (hors annulées) et compte-rendu, par séance
  const bookingBySession = new Map<string, Booking>();
  for (const booking of bookings) {
    if (booking.status === "canceled" || !booking.path_session_id) continue;
    if (!bookingBySession.has(booking.path_session_id)) {
      bookingBySession.set(booking.path_session_id, booking);
    }
  }
  const reportByPosition = new Map(
    reports
      .filter((r) => r.session_position != null)
      .map((r) => [r.session_position as number, r]),
  );

  const visible = sessions.filter((session) =>
    filter === "a-venir"
      ? session.status !== "done"
      : filter === "passees"
        ? session.status === "done"
        : true,
  );

  const summary =
    progress.done === 0
      ? `0 / ${progress.total} · ça commence après ta première séance`
      : `${progress.done} séances faites sur ${progress.total}`;

  const filters = (
    <div className="flex gap-2">
      {FILTERS.map((item) => {
        const active = item.key === filter;
        return (
          <Link
            key={item.key}
            href={item.key === "toutes" ? "/app/parcours" : `/app/parcours?filtre=${item.key}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-[7px] text-[13px] font-bold no-underline transition lg:px-4 lg:py-2",
              active
                ? "border-brand-800 bg-brand-800 text-white"
                : "border-line bg-white text-body hover:border-soft-border",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
      <PageHeader
        title="Mon parcours"
        subtitle={`${path.name} · ${progress.total} séances`}
        action={<div className="hidden lg:block">{filters}</div>}
      />

      <Panel
        tone="soft"
        className="flex flex-col gap-[9px] p-[15px] lg:flex-row lg:flex-wrap lg:items-center lg:gap-5 lg:p-5"
      >
        <Bar tone="soft" value={progress.pct} className="lg:min-w-[240px] lg:flex-1" />
        <p className="text-[13px] font-semibold leading-snug text-brand-700 lg:text-[13.5px]">
          {summary}
        </p>
      </Panel>

      <div className="lg:hidden">{filters}</div>

      {visible.length === 0 ? (
        <Empty
          title={filter === "passees" ? "Aucune séance passée" : "Tout est fait"}
          description={
            filter === "passees"
              ? "Tes comptes-rendus apparaîtront ici après chaque séance."
              : "Toutes les séances du parcours sont terminées. Bravo !"
          }
        />
      ) : (
        <ol className="grid gap-[9px] lg:grid-cols-[repeat(auto-fill,minmax(330px,1fr))] lg:gap-3">
          {visible.map((session) => {
            const booking = bookingBySession.get(session.id);
            const report = reportByPosition.get(session.position);
            const { meta, tag, href } = describe(session, booking, report);
            const style = STATE_STYLES[session.status];

            return (
              <li key={session.id}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border p-3.5 no-underline transition hover:border-soft-border lg:gap-[13px] lg:p-4",
                    style.card,
                  )}
                >
                  <span
                    className={cn(
                      "flex size-7 flex-none items-center justify-center rounded-[9px] font-display text-[13px] font-bold lg:size-[30px] lg:rounded-[10px]",
                      style.num,
                    )}
                  >
                    {session.position}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] font-bold leading-[1.25] text-ink lg:text-[15.5px]">
                      {session.title}
                    </span>
                    <span className="block text-[12.5px] leading-[1.35] text-muted">
                      {meta}
                    </span>
                  </span>
                  {report && !report.read_at ? (
                    <span
                      className="size-[7px] flex-none rounded-full bg-brand-800"
                      aria-label="Compte-rendu non lu"
                    />
                  ) : null}
                  <span
                    className={cn(
                      "flex-none rounded-full px-2.5 py-[5px] text-[11px] font-bold",
                      style.tag,
                    )}
                  >
                    {tag}
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
