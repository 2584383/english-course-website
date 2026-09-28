import Link from "next/link";

import {
  NewReportForm,
  type ReportStudentOption,
} from "@/components/teacher/NewReportForm";
import { ButtonLink, Card, EmptyState, Eyebrow } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import type { PathSession } from "@/lib/database.types";
import { getTeacherStudents } from "@/lib/queries/teacher";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Nouveau compte-rendu" };

/** Date et heure courantes au format des champs <input>, dans le fuseau donné. */
function nowFields(timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(new Date())
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:00`,
  };
}

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ etudiant?: string }>;
}) {
  const { etudiant } = await searchParams;
  const teacher = await requireTeacher();
  const students = await getTeacherStudents(teacher.id);

  const pathIds = students.flatMap((row) => (row.path ? [row.path.id] : []));
  const supabase = await createClient();
  const { data } = pathIds.length
    ? await supabase
        .from("path_sessions")
        .select("*")
        .in("path_id", pathIds)
        .neq("status", "done")
        .order("position")
    : { data: [] };
  const sessions = (data ?? []) as PathSession[];

  const options: ReportStudentOption[] = students.map((row) => ({
    id: row.profile.id,
    name: row.profile.full_name ?? row.profile.email,
    sessions: sessions
      .filter((session) => session.path_id === row.path?.id)
      .map((session) => ({
        id: session.id,
        label: `${session.position}. ${session.title}`,
      })),
  }));

  const { date, time } = nowFields(teacher.profile.timezone);
  const defaultStudentId = options.some((o) => o.id === etudiant)
    ? etudiant
    : undefined;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/prof/comptes-rendus"
        className="text-xs font-bold text-brand-800"
      >
        ← Comptes-rendus
      </Link>

      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Nouveau compte-rendu
        </h1>
        <p className="text-sm text-muted">
          Pour une séance donnée hors réservation Calendly.
        </p>
      </header>

      {options.length === 0 ? (
        <EmptyState
          title="Aucun apprenant affecté"
          description="Invite un apprenant ou rattache-le à ton compte avant de rédiger un compte-rendu."
          action={
            <ButtonLink href="/prof/etudiants" tone="ghost">
              Voir les étudiants
            </ButtonLink>
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
          <NewReportForm
            students={options}
            defaultStudentId={defaultStudentId}
            defaultDate={date}
            defaultTime={time}
          />

          <aside>
            <Card tone="soft" className="flex flex-col gap-1.5">
              <Eyebrow>Comment ça marche</Eyebrow>
              <p className="text-[13px] leading-relaxed text-brand-900">
                On enregistre d&apos;abord la séance, puis tu arrives sur
                l&apos;éditeur : thème, compétences, points forts, axes
                d&apos;amélioration. Tu peux garder un brouillon avant de
                publier.
              </p>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
