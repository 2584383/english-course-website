import Link from "next/link";
import { notFound } from "next/navigation";

import {
  archiveTemplate,
  deleteTemplateSession,
  duplicateTemplate,
  moveTemplateSession,
} from "@/app/actions/teacher";
import {
  AssignTemplateForm,
  type AssignableStudent,
} from "@/components/teacher/AssignTemplateForm";
import { TemplateMetaForm } from "@/components/teacher/TemplateMetaForm";
import { TemplateSessionEditor } from "@/components/teacher/TemplateSessionEditor";
import { TemplateSessionForm } from "@/components/teacher/TemplateSessionForm";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { homeworkToText, normalizeHomework } from "@/lib/homework";
import { getTeacherStudents } from "@/lib/queries/teacher";
import { createClient } from "@/lib/supabase/server";
import { agendaToText } from "@/lib/templates";
import { MODULE_LABELS, SCENARIO_LABELS } from "@/lib/utils";
import type { AgendaItem, PathTemplate, TemplateSession } from "@/lib/database.types";

export const metadata = { title: "Gabarit de parcours" };

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const teacher = await requireTeacher();

  const supabase = await createClient();
  const { data } = await supabase
    .from("path_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const template = data as PathTemplate;

  const [{ data: sessionRows }, students] = await Promise.all([
    supabase
      .from("template_sessions")
      .select("*")
      .eq("template_id", id)
      .order("position"),
    getTeacherStudents(teacher.id),
  ]);

  const sessions = (sessionRows ?? []) as TemplateSession[];
  const assignable: AssignableStudent[] = students.map((row) => ({
    id: row.profile.id,
    name: row.profile.full_name ?? row.profile.email,
    currentPath: row.path?.name ?? null,
  }));

  return (
    <div className="flex flex-col gap-5">
      <Link href="/prof/parcours" className="text-xs font-bold text-brand-800">
        ← Parcours & gabarits
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {template.name}
          </h1>
          {template.description ? (
            <p className="text-sm text-muted">{template.description}</p>
          ) : null}
        </div>
        {template.scenario ? (
          <Badge tone="brand">{SCENARIO_LABELS[template.scenario]}</Badge>
        ) : null}
        <Badge>{sessions.length} séances</Badge>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-2">
          {sessions.length === 0 ? (
            <EmptyState
              title="Aucune séance"
              description="Ajoute les séances du parcours : écoute, prononciation, simulation, vocabulaire."
            />
          ) : (
            sessions.map((session, index) => {
              const agenda = (session.agenda ?? []) as AgendaItem[];
              const homework = normalizeHomework(session.default_homework);

              return (
                <Card key={session.id} className="flex gap-3">
                  <span className="flex size-8 flex-none items-center justify-center rounded-full bg-brand-200 font-display text-sm font-extrabold text-brand-800">
                    {session.position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-[15px] font-bold text-ink">
                        {session.title}
                      </p>
                      <Badge>{MODULE_LABELS[session.module]}</Badge>
                    </div>

                    {session.goal ? (
                      <p className="mt-1 text-[13px] leading-relaxed text-brand-600">
                        {session.goal}
                      </p>
                    ) : null}

                    {agenda.length > 0 ? (
                      <ul className="mt-2 flex flex-col gap-1">
                        {agenda.map((item, i) => (
                          <li key={i} className="flex gap-2 text-xs">
                            <span className="w-14 flex-none font-bold text-brand-700">
                              {item.duration}
                            </span>
                            <span className="text-muted">{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {homework.length > 0 ? (
                      <div className="mt-2 rounded-[var(--radius-field)] bg-brand-50 px-3 py-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
                          Devoirs avant la séance
                        </p>
                        <ul className="mt-1 flex flex-col gap-0.5">
                          {homework.map((item, i) => (
                            <li key={i} className="text-xs text-brand-600">
                              • {item.title}
                              {item.instructions ? (
                                <span className="text-muted"> — {item.instructions}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <TemplateSessionEditor
                      sessionId={session.id}
                      templateId={id}
                      title={session.title}
                      module={session.module}
                      goal={session.goal}
                      agendaText={agendaToText(agenda)}
                      homeworkText={homeworkToText(session.default_homework)}
                    />
                  </div>

                  <div className="flex flex-none flex-col gap-1">
                    <MoveButton
                      sessionId={session.id}
                      templateId={id}
                      direction="up"
                      disabled={index === 0}
                    />
                    <MoveButton
                      sessionId={session.id}
                      templateId={id}
                      direction="down"
                      disabled={index === sessions.length - 1}
                    />
                    <form action={deleteTemplateSession}>
                      <input type="hidden" name="sessionId" value={session.id} />
                      <input type="hidden" name="templateId" value={id} />
                      <button
                        type="submit"
                        aria-label={`Supprimer la séance ${session.position}`}
                        className="flex size-7 items-center justify-center rounded-md border border-line text-xs text-muted hover:border-red-200 hover:text-red-700"
                      >
                        ✕
                      </button>
                    </form>
                  </div>
                </Card>
              );
            })
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <Card tone="soft" className="flex flex-col gap-3">
            <SectionTitle>Attribuer à un apprenant</SectionTitle>
            <AssignTemplateForm templateId={id} students={assignable} />
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle>Ajouter une séance</SectionTitle>
            <TemplateSessionForm templateId={id} />
          </Card>

          <Card className="flex flex-col gap-3">
            <details>
              <summary className="cursor-pointer list-none font-display text-base font-bold text-ink [&::-webkit-details-marker]:hidden">
                Modifier le gabarit
              </summary>
              <div className="mt-3">
                <TemplateMetaForm template={template} />
              </div>
            </details>
            <div className="flex flex-wrap gap-2 border-t border-line pt-3">
              <form action={duplicateTemplate}>
                <input type="hidden" name="templateId" value={id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius-field)] border border-line bg-white px-3.5 py-2 text-xs font-bold text-brand-600 hover:bg-brand-100"
                >
                  Dupliquer
                </button>
              </form>
              <form action={archiveTemplate}>
                <input type="hidden" name="templateId" value={id} />
                <button
                  type="submit"
                  className="rounded-[var(--radius-field)] border border-red-200 bg-white px-3.5 py-2 text-xs font-bold text-red-700 hover:bg-red-50"
                >
                  Archiver
                </button>
              </form>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-soft">
              Archiver retire le gabarit de ta liste ; les parcours déjà
              attribués ne changent pas.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function MoveButton({
  sessionId,
  templateId,
  direction,
  disabled,
}: {
  sessionId: string;
  templateId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={moveTemplateSession}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={direction === "up" ? "Remonter cette séance" : "Descendre cette séance"}
        className="flex size-7 items-center justify-center rounded-md border border-line text-xs text-brand-600 disabled:opacity-30"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}
