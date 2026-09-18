import Link from "next/link";

import { Badge, Card, EmptyState } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getTeacherStudents, getWeekBookings } from "@/lib/queries/teacher";
import { formatTime } from "@/lib/utils";

export const metadata = { title: "Planning" };

const DAY_LABELS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

/** Lundi de la semaine contenant `date`. */
function startOfWeek(date: Date) {
  const result = new Date(date);
  const offset = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - offset);
  result.setHours(0, 0, 0, 0);
  return result;
}

export default async function PlanningPage({
  searchParams,
}: {
  searchParams: Promise<{ semaine?: string }>;
}) {
  const { semaine } = await searchParams;
  const offsetWeeks = Number(semaine ?? 0) || 0;

  const { id } = await requireTeacher();

  const weekStart = startOfWeek(new Date());
  weekStart.setDate(weekStart.getDate() + offsetWeeks * 7);

  const [bookings, students] = await Promise.all([
    getWeekBookings(id, weekStart),
    getTeacherStudents(id),
  ]);

  const byId = new Map(students.map((row) => [row.profile.id, row]));

  const days = DAY_LABELS.map((label, index) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + index);

    return {
      label,
      date,
      bookings: bookings.filter((booking) => {
        const start = new Date(booking.starts_at);
        return (
          start.getFullYear() === date.getFullYear() &&
          start.getMonth() === date.getMonth() &&
          start.getDate() === date.getDate()
        );
      }),
    };
  });

  const rangeLabel = new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
  }).formatRange(days[0].date, days[6].date);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Planning
          </h1>
          <p className="text-sm capitalize text-muted">{rangeLabel}</p>
        </div>

        <nav className="flex gap-2">
          <Link
            href={`/prof/planning?semaine=${offsetWeeks - 1}`}
            className="rounded-[var(--radius-field)] border border-line bg-white px-3.5 py-2 text-xs font-bold text-brand-600 no-underline"
          >
            ← Semaine précédente
          </Link>
          {offsetWeeks !== 0 ? (
            <Link
              href="/prof/planning"
              className="rounded-[var(--radius-field)] border border-line bg-white px-3.5 py-2 text-xs font-bold text-brand-600 no-underline"
            >
              Cette semaine
            </Link>
          ) : null}
          <Link
            href={`/prof/planning?semaine=${offsetWeeks + 1}`}
            className="rounded-[var(--radius-field)] border border-line bg-white px-3.5 py-2 text-xs font-bold text-brand-600 no-underline"
          >
            Semaine suivante →
          </Link>
        </nav>
      </header>

      {bookings.length === 0 ? (
        <EmptyState
          title="Aucune séance cette semaine"
          description="Les créneaux réservés via Calendly apparaissent ici automatiquement."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {days.map((day) => (
            <Card key={day.label} className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className="font-display text-sm font-bold text-ink">
                  {day.label}
                </span>
                <span className="text-xs text-muted-soft">
                  {day.date.getDate()}
                </span>
              </div>

              {day.bookings.length === 0 ? (
                <p className="text-xs text-muted-soft">—</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {day.bookings.map((booking) => {
                    const student = byId.get(booking.student_id);
                    return (
                      <li key={booking.id}>
                        <Link
                          href={`/prof/comptes-rendus/${booking.id}`}
                          className="block rounded-[var(--radius-field)] border border-soft-border bg-soft p-2.5 no-underline"
                        >
                          <span className="block text-xs font-bold text-brand-800">
                            {formatTime(booking.starts_at)}
                          </span>
                          <span className="block text-[13px] font-semibold text-ink">
                            {student?.profile.full_name ?? "Étudiant"}
                          </span>
                          <span className="block text-[11px] text-brand-600">
                            {student?.path?.name ?? "Séance"}
                          </span>
                          {booking.status === "completed" ? (
                            <Badge tone="success">Faite</Badge>
                          ) : null}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
