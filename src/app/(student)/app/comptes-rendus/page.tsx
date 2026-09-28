import Link from "next/link";

import { BackLink, Empty, PageHeader } from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { getStudentReports } from "@/lib/queries/student";
import { cn, formatShortDate } from "@/lib/utils";

export const metadata = { title: "Comptes-rendus" };

/** Tous les comptes-rendus : la face « après » de chaque séance (wireframe 2a). */
export default async function ReportsPage() {
  const { profile } = await requireStudent();
  const reports = await getStudentReports(profile.id);

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
      <BackLink href="/app/parcours">Mon parcours</BackLink>

      <PageHeader
        title="Mes comptes-rendus"
        subtitle="Ce que tu as réussi, ce qu'on travaille ensuite."
      />

      {reports.length === 0 ? (
        <Empty
          title="Aucun compte-rendu pour l'instant"
          description="Ton enseignant publie un bilan après chaque séance."
        />
      ) : (
        <ul className="grid gap-[9px] lg:grid-cols-[repeat(auto-fill,minmax(330px,1fr))] lg:gap-3">
          {reports.map((report) => (
            <li key={report.id}>
              <Link
                href={`/app/comptes-rendus/${report.id}`}
                className="flex items-center gap-3 rounded-2xl border border-line bg-white p-3.5 no-underline transition hover:border-soft-border lg:gap-[13px] lg:p-4"
              >
                <span className="flex size-7 flex-none items-center justify-center rounded-[9px] bg-chip font-display text-[13px] font-bold text-muted lg:size-[30px] lg:rounded-[10px]">
                  {report.session_position ?? "·"}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-[15px] font-bold leading-[1.25] text-ink lg:text-[15.5px]">
                    {report.session_title ?? report.theme ?? "Séance"}
                  </span>
                  <span className="block text-[12.5px] leading-[1.35] text-muted">
                    {formatShortDate(report.published_at ?? report.starts_at)} ·{" "}
                    {report.read_at ? "compte-rendu lu" : "compte-rendu non lu"}
                  </span>
                </span>
                <span
                  className={cn(
                    "size-[7px] flex-none rounded-full",
                    report.read_at ? "bg-transparent" : "bg-brand-800",
                  )}
                  aria-hidden
                />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
