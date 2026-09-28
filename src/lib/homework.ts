import "server-only";

import type { HomeworkItem } from "@/lib/database.types";
import type { createClient } from "@/lib/supabase/server";

type Supabase = Awaited<ReturnType<typeof createClient>>;

/**
 * Saisie enseignant → devoirs : une ligne par devoir, au format
 * « Intitulé | consigne » (la consigne est facultative), comme l'ordre du jour.
 */
export function homeworkFromText(text: string): HomeworkItem[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split("|");
      const instructions = rest.join("|").trim();
      return { title: title.trim(), instructions: instructions || null };
    })
    .filter((item) => item.title.length > 0);
}

/** Devoirs → texte éditable (inverse de `homeworkFromText`). */
export function homeworkToText(items: unknown): string {
  return normalizeHomework(items)
    .map((item) =>
      item.instructions ? `${item.title} | ${item.instructions}` : item.title,
    )
    .join("\n");
}

/** Accepte aussi l'ancien format (liste de chaînes) de `default_homework`. */
export function normalizeHomework(items: unknown): HomeworkItem[] {
  if (!Array.isArray(items)) return [];
  return items
    .map((item): HomeworkItem | null => {
      if (typeof item === "string") return item.trim() ? { title: item.trim() } : null;
      if (item && typeof item === "object" && "title" in item) {
        const { title, instructions, due_label } = item as HomeworkItem;
        return typeof title === "string" && title.trim()
          ? { title: title.trim(), instructions: instructions ?? null, due_label: due_label ?? null }
          : null;
      }
      return null;
    })
    .filter((item): item is HomeworkItem => item !== null);
}

/**
 * Distribue les devoirs prévus pour une séance du parcours.
 *
 * Idempotent : la séance est d'abord « réclamée » en posant
 * `homework_assigned_at` (uniquement s'il est vide) ; un second appel, ou un
 * appel concurrent, ne trouve plus rien à réclamer.
 * Renvoie le nombre de devoirs créés.
 */
export async function assignSessionHomework(
  supabase: Supabase,
  pathSessionId: string,
): Promise<number> {
  const { data: claimed } = await supabase
    .from("path_sessions")
    .update({ homework_assigned_at: new Date().toISOString() })
    .eq("id", pathSessionId)
    .is("homework_assigned_at", null)
    .select("id, path_id, position, homework")
    .maybeSingle();

  if (!claimed) return 0;

  const items = normalizeHomework(claimed.homework);
  if (items.length === 0) return 0;

  const { data: path } = await supabase
    .from("learning_paths")
    .select("student_id, teacher_id")
    .eq("id", claimed.path_id)
    .single();

  if (!path) return 0;

  const { error } = await supabase.from("assignments").insert(
    items.map((item) => ({
      student_id: path.student_id,
      teacher_id: path.teacher_id,
      path_session_id: claimed.id,
      title: item.title,
      instructions: item.instructions ?? null,
      due_label: item.due_label ?? `avant la séance ${claimed.position}`,
    })),
  );

  if (error) {
    // On relâche la séance pour qu'un prochain essai puisse la redistribuer
    await supabase
      .from("path_sessions")
      .update({ homework_assigned_at: null })
      .eq("id", claimed.id);
    console.error("[devoirs] distribution impossible", error);
    return 0;
  }

  return items.length;
}

/** Séance qui suit `pathSessionId` dans le même parcours, s'il y en a une. */
export async function nextPathSessionId(
  supabase: Supabase,
  pathSessionId: string,
): Promise<string | null> {
  const { data: current } = await supabase
    .from("path_sessions")
    .select("path_id, position")
    .eq("id", pathSessionId)
    .maybeSingle();

  if (!current) return null;

  const { data: next } = await supabase
    .from("path_sessions")
    .select("id")
    .eq("path_id", current.path_id)
    .gt("position", current.position)
    .order("position")
    .limit(1)
    .maybeSingle();

  return next?.id ?? null;
}
