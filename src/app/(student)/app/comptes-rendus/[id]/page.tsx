import { notFound } from "next/navigation";

import { markReportRead } from "@/app/actions/student";
import {
  ActionLink,
  BackLink,
  DetailHeader,
  Kicker,
  Panel,
} from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { getTeacherName } from "@/lib/queries/student";
import { createClient } from "@/lib/supabase/server";
import type { StudentReport } from "@/lib/database.types";
import { firstName, formatShortDate } from "@/lib/utils";

export const metadata = { title: "Compte-rendu" };

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireStudent();

  const supabase = await createClient();
  const { data } = await supabase
    .from("student_reports")
    .select("*")
    .eq("id", id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!data) notFound();
  const report = data as StudentReport;

  // Accusé de lecture : l'enseignant voit que le bilan a été consulté
  const [teacherName] = await Promise.all([
    getTeacherName(report.teacher_id),
    report.read_at ? null : markReportRead(report.id),
  ]);

  const meta = [
    formatShortDate(report.starts_at),
    "1 h",
    teacherName ? `avec ${firstName(teacherName)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex max-w-[940px] flex-col gap-3.5 animate-pop lg:gap-[18px]">
      <BackLink href="/app/parcours">Mon parcours</BackLink>

      <DetailHeader
        kicker={
          report.session_position
            ? `Compte-rendu · séance ${report.session_position}`
            : "Compte-rendu"
        }
        title={report.session_title ?? report.theme ?? "Compte-rendu de séance"}
        meta={meta}
      />

      {report.skills.length > 0 ? (
        <ul className="flex flex-wrap gap-[7px]">
          {report.skills.map((skill) => (
            <li
              key={skill}
              className="rounded-full border border-track-soft bg-soft px-3 py-1.5 text-xs font-bold text-brand-800 lg:px-[13px]"
            >
              {skill}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid items-start gap-3.5 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:gap-4">
        {report.strengths ? (
          <Panel tone="soft" className="flex flex-col gap-[7px] lg:gap-2">
            <Kicker tone="brand">Points forts</Kicker>
            <p className="whitespace-pre-line text-[14.5px] leading-normal text-deep lg:text-[15px] lg:leading-[1.55]">
              {report.strengths}
            </p>
          </Panel>
        ) : null}

        {report.improvements ? (
          <Panel className="flex flex-col gap-[7px] lg:gap-2">
            <Kicker>Axes d&apos;amélioration</Kicker>
            <p className="whitespace-pre-line text-[14.5px] leading-normal text-brand-600 lg:text-[15px] lg:leading-[1.55]">
              {report.improvements}
            </p>
          </Panel>
        ) : null}
      </div>

      {report.theme ? (
        <Panel className="flex flex-col gap-[7px] lg:gap-2">
          <Kicker>Thème abordé</Kicker>
          <p className="whitespace-pre-line text-[14.5px] leading-normal text-brand-600 lg:text-[15px] lg:leading-[1.55]">
            {report.theme}
          </p>
        </Panel>
      ) : null}

      <ActionLink
        href="/app/devoirs"
        tone="outline"
        className="w-full rounded-[14px] py-3.5 text-[15px] lg:w-auto lg:self-start lg:rounded-xl lg:px-[22px] lg:py-[13px] lg:text-sm"
      >
        Voir les devoirs liés
      </ActionLink>
    </div>
  );
}
