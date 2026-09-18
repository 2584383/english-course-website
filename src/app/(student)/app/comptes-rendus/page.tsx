import Link from "next/link";

import { Badge, Card, EmptyState } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getStudentReports } from "@/lib/queries/student";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Comptes-rendus" };

export default async function ReportsPage() {
  const { profile } = await requireStudent();
  const reports = await getStudentReports(profile.id);

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          Mes comptes-rendus
        </h1>
        <p className="text-[13px] text-muted">
          Ce que tu as réussi, ce qu&apos;on travaille ensuite.
        </p>
      </header>

      {reports.length === 0 ? (
        <EmptyState
          title="Aucun compte-rendu pour l'instant"
          description="Ton enseignant publie un bilan après chaque séance."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {reports.map((report) => (
            <li key={report.id}>
              <Link
                href={`/app/comptes-rendus/${report.id}`}
                className="block no-underline"
              >
                <Card className="flex flex-col gap-1.5 transition hover:border-brand-300">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-[15px] font-bold text-ink">
                      {report.session_position
                        ? `${report.session_position}. `
                        : ""}
                      {report.session_title ?? report.theme ?? "Séance"}
                    </span>
                    {!report.read_at ? <Badge tone="accent">Nouveau</Badge> : null}
                  </div>
                  <p className="line-clamp-2 text-[13px] leading-relaxed text-muted">
                    {report.theme}
                  </p>
                  <p className="text-xs text-muted-soft">
                    {report.published_at ? formatDate(report.published_at) : ""}
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
