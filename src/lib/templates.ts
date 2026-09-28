import "server-only";

import type {
  AgendaItem,
  HomeworkItem,
  ModuleKind,
  Scenario,
} from "@/lib/database.types";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type TemplateInput = {
  name: string;
  scenario: Scenario | null;
  description: string | null;
  sessions: {
    title: string;
    module: ModuleKind;
    goal: string | null;
    agenda: AgendaItem[];
    homework: HomeworkItem[];
  }[];
};

/** Ordre du jour → texte éditable, au format « 15 min | Intitulé ». */
export function agendaToText(agenda: AgendaItem[] | null | undefined) {
  return (agenda ?? [])
    .map((item) => (item.duration ? `${item.duration} | ${item.label}` : item.label))
    .join("\n");
}

/** Crée un gabarit complet (catalogue, IA ou duplication). Renvoie son id. */
export async function insertTemplate(
  supabase: Supabase,
  teacherId: string,
  input: TemplateInput,
): Promise<{ id: string } | { error: string }> {
  const { data: template, error } = await supabase
    .from("path_templates")
    .insert({
      teacher_id: teacherId,
      name: input.name,
      scenario: input.scenario,
      description: input.description,
      session_count: input.sessions.length,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (input.sessions.length) {
    const { error: sessionsError } = await supabase.from("template_sessions").insert(
      input.sessions.map((session, index) => ({
        template_id: template.id,
        position: index + 1,
        title: session.title,
        module: session.module,
        goal: session.goal,
        agenda: session.agenda,
        default_homework: session.homework,
      })),
    );

    if (sessionsError) {
      await supabase.from("path_templates").delete().eq("id", template.id);
      return { error: sessionsError.message };
    }
  }

  return { id: template.id };
}

/**
 * Renumérote les séances d'un gabarit 1, 2, 3… après une suppression, et
 * remet `session_count` à jour. Passe par des positions négatives pour ne pas
 * heurter la contrainte d'unicité (template_id, position).
 */
export async function renumberTemplate(supabase: Supabase, templateId: string) {
  const { data: sessions } = await supabase
    .from("template_sessions")
    .select("id, position")
    .eq("template_id", templateId)
    .order("position");

  const rows = sessions ?? [];

  for (const [index, row] of rows.entries()) {
    if (row.position !== index + 1) {
      await supabase
        .from("template_sessions")
        .update({ position: -(index + 1) })
        .eq("id", row.id);
    }
  }
  for (const [index, row] of rows.entries()) {
    if (row.position !== index + 1) {
      await supabase
        .from("template_sessions")
        .update({ position: index + 1 })
        .eq("id", row.id);
    }
  }

  await supabase
    .from("path_templates")
    .update({ session_count: rows.length })
    .eq("id", templateId);
}
