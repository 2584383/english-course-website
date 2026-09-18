import Link from "next/link";
import { notFound } from "next/navigation";

import { markReportRead } from "@/app/actions/student";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Compte-rendu" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireStudent();

  const supabase = await createClient();
  const { data: report } = await supabase
    .from("student_reports")
    .select("*")
    .eq("id", id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!report) notFound();

  // Accusé de lecture : l'enseignant voit que le bilan a été consulté
  if (!report.read_at) await markReportRead(report.id);

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <Link
        href="/app/comptes-rendus"
        className="text-xs font-bold text-brand-800"
      >
        ← Mes comptes-rendus
      </Link>

      <header className="flex flex-col gap-1.5">
        <p className="text-xs text-muted">
          {report.published_at ? formatDate(report.published_at) : ""}
        </p>
        <h1 className="font-display text-[25px] font-extrabold leading-tight text-ink">
          {report.session_title ?? "Compte-rendu de séance"}
        </h1>
        {report.skills.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {report.skills.map((skill) => (
              <Badge key={skill} tone="brand">
                {skill}
              </Badge>
            ))}
          </div>
        ) : null}
      </header>

      {report.theme ? (
        <Card tone="soft" className="flex flex-col gap-1.5">
          <Eyebrow>Thème abordé</Eyebrow>
          <p className="text-sm leading-relaxed text-brand-900">
            {report.theme}
          </p>
        </Card>
      ) : null}

      {report.strengths ? (
        <Card className="flex flex-col gap-1.5">
          <Eyebrow>Ce qui a marché</Eyebrow>
          <p className="whitespace-pre-line text-sm leading-relaxed text-brand-600">
            {report.strengths}
          </p>
        </Card>
      ) : null}

      {report.improvements ? (
        <Card tone="accent" className="flex flex-col gap-1.5">
          <Eyebrow>Axes d&apos;amélioration</Eyebrow>
          <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
            {report.improvements}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
