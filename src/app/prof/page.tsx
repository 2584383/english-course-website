import Link from "next/link";

import { Badge, Card, Eyebrow, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import {
  getBookingsAwaitingReport,
  getTeacherStudents,
  getTodayBookings,
} from "@/lib/queries/teacher";
import { formatDate, formatTime, relativeLabel } from "@/lib/utils";

export const metadata = { title: "Aujourd'hui" };

export default async function TeacherTodayPage() {
  const { id, profile } = await requireTeacher();

  const [today, students, awaitingReport] = await Promise.all([
    getTodayBookings(id),
    getTeacherStudents(id),
    getBookingsAwaitingReport(id),
  ]);

  const byId = new Map(students.map((row) => [row.profile.id, row]));

  // Étudiants sans séance à venir depuis longtemps : à relancer
  const toFollowUp = students.filter((row) => !row.nextBooking);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Bonjour {profile.full_name?.split(" ")[0]}
        </h1>
        <p className="text-sm text-muted">
          {today.length === 0
            ? "Aucune séance aujourd'hui."
            : `${today.length} séance${today.length > 1 ? "s" : ""} aujourd'hui.`}
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="flex flex-col gap-3 xl:col-span-2">
          <SectionTitle
            action={
              <Link
                href="/prof/planning"
                className="text-xs font-bold text-brand-800"
              >
                Voir le planning
              </Link>
            }
          >
            Mes séances du jour
          </SectionTitle>

          {today.length === 0 ? (
            <EmptyState
              title="Journée libre"
              description="Aucun créneau réservé pour aujourd'hui."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {today.map((booking) => {
                const student = byId.get(booking.student_id);
                return (
                  <li key={booking.id}>
                    <Card className="flex flex-wrap items-center gap-3">
                      <span className="w-16 flex-none font-display text-lg font-extrabold text-brand-800">
                        {formatTime(booking.starts_at)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-ink">
                          {student?.profile.full_name ?? "Étudiant"}
                        </span>
                        <span className="block text-xs text-muted">
                          {student?.path?.name ?? "Séance"} ·{" "}
                          {student?.progress.done ?? 0} /{" "}
                          {student?.progress.total ?? 0}
                        </span>
                      </span>
                      <Badge tone="accent">
                        {relativeLabel(booking.starts_at)}
                      </Badge>
                      {booking.meet_url ? (
                        <a
                          href={booking.meet_url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-[var(--radius-field)] bg-brand-800 px-3.5 py-2 text-xs font-bold text-white no-underline"
                        >
                          Rejoindre
                        </a>
                      ) : null}
                      <Link
                        href={`/prof/comptes-rendus/${booking.id}`}
                        className="rounded-[var(--radius-field)] border border-line px-3.5 py-2 text-xs font-bold text-brand-600 no-underline"
                      >
                        Compte-rendu
                      </Link>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="flex flex-col gap-3">
          <SectionTitle>À traiter</SectionTitle>

          {awaitingReport.length > 0 ? (
            <Card tone="accent" className="flex flex-col gap-2">
              <Eyebrow>Comptes-rendus en attente</Eyebrow>
              <ul className="flex flex-col gap-1.5">
                {awaitingReport.slice(0, 5).map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/prof/comptes-rendus/${booking.id}`}
                      className="flex items-baseline justify-between gap-2 text-sm text-ink no-underline"
                    >
                      <span className="font-semibold">
                        {byId.get(booking.student_id)?.profile.full_name ??
                          "Étudiant"}
                      </span>
                      <span className="text-xs text-accent-ink">
                        {formatDate(booking.starts_at)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {toFollowUp.length > 0 ? (
            <Card className="flex flex-col gap-2">
              <Eyebrow>Étudiants à relancer</Eyebrow>
              <p className="text-xs text-muted">
                Aucune séance programmée pour ces apprenants.
              </p>
              <ul className="flex flex-col gap-1.5">
                {toFollowUp.slice(0, 6).map((row) => (
                  <li key={row.profile.id}>
                    <Link
                      href={`/prof/etudiants/${row.profile.id}`}
                      className="flex items-baseline justify-between gap-2 text-sm text-ink no-underline"
                    >
                      <span className="font-semibold">
                        {row.profile.full_name}
                      </span>
                      <span className="text-xs text-muted-soft">
                        {row.profile.last_seen_at
                          ? `vu ${relativeLabel(row.profile.last_seen_at)}`
                          : "jamais connecté"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {awaitingReport.length === 0 && toFollowUp.length === 0 ? (
            <EmptyState title="Rien en attente" description="Tout est à jour." />
          ) : null}
        </section>
      </div>
    </div>
  );
}
