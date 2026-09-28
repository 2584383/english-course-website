import { notFound } from "next/navigation";

import { AssignmentToggle } from "@/components/student/AssignmentToggle";
import {
  BackLink,
  Chevron,
  DetailHeader,
  KindTile,
  Kicker,
  Panel,
} from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import type { Assignment, PathSession, Resource } from "@/lib/database.types";
import { getTeacherName } from "@/lib/queries/student";
import { createClient } from "@/lib/supabase/server";
import { RESOURCE_KIND_LABELS, firstName, formatShortDate } from "@/lib/utils";

export const metadata = { title: "Devoir" };

/** Détail d'un devoir (wireframe 3b, prototype hi-fi). Rien à rendre : on coche. */
export default async function AssignmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireStudent();

  const supabase = await createClient();
  const { data } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", id)
    .eq("student_id", profile.id)
    .maybeSingle();

  if (!data) notFound();
  const assignment = data as Assignment;

  const [{ data: resource }, { data: session }, teacherName] = await Promise.all([
    assignment.resource_id
      ? supabase
          .from("resources")
          .select("*")
          .eq("id", assignment.resource_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    assignment.path_session_id
      ? supabase
          .from("path_sessions")
          .select("*")
          .eq("id", assignment.path_session_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    getTeacherName(assignment.teacher_id),
  ]);

  const teacher = firstName(teacherName) || "Ton enseignant";
  const linkedResource = resource as Resource | null;
  const linkedSession = session as PathSession | null;

  const meta = [
    `Donné par ${teacher} le ${formatShortDate(assignment.created_at)}`,
    assignment.due_label,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="flex max-w-[820px] flex-col gap-3.5 animate-pop lg:gap-[18px]">
      <BackLink href="/app/devoirs">Mon travail</BackLink>

      <DetailHeader title={assignment.title} meta={meta} />

      <Panel className="flex flex-col gap-[7px] lg:gap-2">
        <Kicker>Consigne</Kicker>
        <p className="whitespace-pre-line text-[14.5px] leading-normal text-brand-600 lg:text-[15px] lg:leading-[1.55]">
          {assignment.instructions ??
            "Pas de consigne détaillée : on en parle en début de séance."}
        </p>
      </Panel>

      {linkedResource ? (
        <a
          href={linkedResource.external_url ?? `/api/ressources/${linkedResource.id}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-[18px] border border-line bg-white p-[15px] no-underline transition hover:border-soft-border lg:gap-[13px] lg:p-[18px]"
        >
          <KindTile label={RESOURCE_KIND_LABELS[linkedResource.kind]} />
          <span className="min-w-0 flex-1">
            <span className="block font-display text-sm font-bold leading-[1.2] text-ink lg:text-[15px]">
              {linkedResource.title}
            </span>
            <span className="mt-0.5 block text-xs text-muted-soft">
              Ouvrir la ressource
            </span>
          </span>
          <Chevron />
        </a>
      ) : null}

      {linkedSession ? (
        <Panel className="flex flex-col gap-1.5">
          <Kicker>Rattaché à</Kicker>
          <p className="text-sm font-semibold leading-[1.35] text-ink lg:text-[14.5px]">
            Séance {linkedSession.position} · {linkedSession.title}
          </p>
        </Panel>
      ) : null}

      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-4">
        <AssignmentToggle id={assignment.id} done={assignment.status === "done"} />
        <p className="text-center text-[12.5px] leading-[1.45] text-muted-soft lg:text-left lg:text-[13px]">
          {teacher} voit que c&apos;est coché, pas ce que tu as écrit.
        </p>
      </div>
    </div>
  );
}
