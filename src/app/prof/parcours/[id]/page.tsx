import Link from "next/link";
import { notFound } from "next/navigation";

import { deleteTemplateSession } from "@/app/actions/teacher";
import { TemplateSessionForm } from "@/components/teacher/TemplateSessionForm";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { MODULE_LABELS, SCENARIO_LABELS } from "@/lib/utils";
import type { AgendaItem, TemplateSession } from "@/lib/database.types";

export const metadata = { title: "Gabarit de parcours" };

export default async function TemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireTeacher();

  const supabase = await createClient();
  const { data: template } = await supabase
    .from("path_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!template) notFound();

  const { data } = await supabase
    .from("template_sessions")
    .select("*")
    .eq("template_id", id)
    .order("position");

  const sessions = (data ?? []) as TemplateSession[];

  return (
    <div className="flex flex-col gap-5">
      <Link href="/prof/parcours" className="text-xs font-bold text-brand-800">
        ← Parcours & templates
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
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
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-2">
          {sessions.length === 0 ? (
            <EmptyState
              title="Aucune séance"
              description="Ajoute les modules du parcours : écoute, prononciation, simulation, vocabulaire."
            />
          ) : (
            sessions.map((session) => {
              const agenda = (session.agenda ?? []) as AgendaItem[];

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
                        {agenda.map((item, index) => (
                          <li key={index} className="flex gap-2 text-xs">
                            <span className="w-14 flex-none font-bold text-brand-700">
                              {item.duration}
                            </span>
                            <span className="text-muted">{item.label}</span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>

                  <form action={deleteTemplateSession} className="flex-none">
                    <input type="hidden" name="sessionId" value={session.id} />
                    <input type="hidden" name="templateId" value={id} />
                    <button
                      type="submit"
                      aria-label={`Supprimer la séance ${session.position}`}
                      className="rounded-md border border-line px-2 py-1 text-xs text-muted"
                    >
                      ✕
                    </button>
                  </form>
                </Card>
              );
            })
          )}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Ajouter une séance</SectionTitle>
            <TemplateSessionForm templateId={id} />
          </Card>
        </aside>
      </div>
    </div>
  );
}
