import Link from "next/link";

import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import {
  getBookingsAwaitingReport,
  getReportQueue,
  getTeacherStudents,
} from "@/lib/queries/teacher";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Comptes-rendus" };

export default async function ReportsQueuePage() {
  const { id } = await requireTeacher();

  const [reports, awaiting, students] = await Promise.all([
    getReportQueue(id),
    getBookingsAwaitingReport(id),
    getTeacherStudents(id),
  ]);

  const byId = new Map(students.map((row) => [row.profile.id, row.profile]));
  const drafts = reports.filter((report) => report.status === "draft");
  const published = reports.filter((report) => report.status === "published");

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Comptes-rendus
        </h1>
        <p className="text-sm text-muted">
          {awaiting.length + drafts.length} à rédiger · {published.length}{" "}
          publiés
        </p>
      </header>

      {awaiting.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>Séances sans compte-rendu</SectionTitle>
          {awaiting.map((booking) => (
            <Link
              key={booking.id}
              href={`/prof/comptes-rendus/${booking.id}`}
              className="block no-underline"
            >
              <Card
                tone="accent"
                className="flex flex-wrap items-center gap-3 transition hover:border-accent"
              >
                <span className="flex-1 text-sm font-bold text-ink">
                  {byId.get(booking.student_id)?.full_name ?? "Étudiant"}
                </span>
                <span className="text-xs capitalize text-accent-ink">
                  {formatDateTime(booking.starts_at)}
                </span>
                <Badge tone="accent">À rédiger</Badge>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      {drafts.length > 0 ? (
        <section className="flex flex-col gap-2">
          <SectionTitle>Brouillons</SectionTitle>
          {drafts.map((report) => (
            <Link
              key={report.id}
              href={`/prof/comptes-rendus/${report.booking_id}`}
              className="block no-underline"
            >
              <Card className="flex flex-wrap items-center gap-3 transition hover:border-brand-300">
                <span className="flex-1 text-sm font-bold text-ink">
                  {report.student?.full_name ?? "Étudiant"}
                </span>
                <span className="text-xs text-muted">{report.theme}</span>
                <Badge tone="warn">Brouillon</Badge>
              </Card>
            </Link>
          ))}
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <SectionTitle>Publiés</SectionTitle>
        {published.length === 0 ? (
          <EmptyState
            title="Aucun compte-rendu publié"
            description="Les bilans publiés apparaissent immédiatement dans l'espace de l'apprenant."
          />
        ) : (
          published.map((report) => (
            <Link
              key={report.id}
              href={`/prof/comptes-rendus/${report.booking_id}`}
              className="block no-underline"
            >
              <Card className="flex flex-wrap items-center gap-3 transition hover:border-brand-300">
                <span className="flex-1 text-sm font-bold text-ink">
                  {report.student?.full_name ?? "Étudiant"}
                </span>
                <span className="text-xs text-muted">{report.theme}</span>
                {report.published_at ? (
                  <span className="text-xs text-muted-soft">
                    {formatDate(report.published_at)}
                  </span>
                ) : null}
                <Badge tone={report.read_at ? "success" : "neutral"}>
                  {report.read_at ? "Lu" : "Non lu"}
                </Badge>
              </Card>
            </Link>
          ))
        )}
      </section>
    </div>
  );
}
