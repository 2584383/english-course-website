"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requireStudent } from "@/lib/auth";
import { AVAILABILITY_OPTIONS } from "@/lib/constants";
import {
  fetchCalendlyEvent,
  getStudentDiscoveryCall,
  recordDiscoveryCall,
} from "@/lib/discovery";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/auth";

const onboardingSchema = z.object({
  goal: z.string().trim().min(10, "Décris ton objectif en une phrase au moins."),
  availability: z.array(z.string()).max(AVAILABILITY_OPTIONS.length),
});

/** Étape 2 de l'onboarding : l'étudiant valide l'objectif saisi par l'enseignant. */
export async function completeOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireStudent();

  const parsed = onboardingSchema.safeParse({
    goal: formData.get("goal"),
    availability: formData.getAll("availability").map(String),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      goal_in_own_words: parsed.data.goal,
      availability: parsed.data.availability,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", session.id);

  if (error) return { error: error.message };

  revalidatePath("/app", "layout");
  redirect("/app");
}

/**
 * Appelée par le widget dès que l'étudiant a réservé son appel de découverte :
 * l'appel apparaît tout de suite chez le prof, sans attendre le webhook.
 */
export async function confirmDiscoveryBooking(
  teacherId: string,
  eventUri: string,
): Promise<{ error?: string; scheduledAt?: string | null }> {
  const session = await requireStudent();
  if (
    !z.string().uuid().safeParse(teacherId).success ||
    !/^https:\/\/api\.calendly\.com\/scheduled_events\/[\w-]+$/.test(eventUri)
  ) {
    return { error: "Réservation incomplète." };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { error: "Enregistrement indisponible pour le moment." };
  }

  // Un seul appel en cours par étudiant : l'appel vient du navigateur, on ne
  // laisse pas remplir le CRM du prof d'événements à la chaîne.
  const existing = await getStudentDiscoveryCall(admin, session.id);
  if (existing && existing.eventUri !== eventUri) {
    return { error: "Tu as déjà un appel de découverte réservé." };
  }

  const event = await fetchCalendlyEvent(eventUri);
  const result = await recordDiscoveryCall(admin, {
    studentId: session.id,
    teacherId,
    eventUri,
    startTime: event?.startTime,
    endTime: event?.endTime,
  });
  if ("error" in result) return { error: result.error };

  revalidatePath("/app", "layout");
  revalidatePath("/bienvenue");
  return { scheduledAt: event?.startTime ?? null };
}

export async function toggleAssignment(assignmentId: string, done: boolean) {
  const session = await requireStudent();
  const supabase = await createClient();

  await supabase
    .from("assignments")
    .update({
      status: done ? "done" : "todo",
      completed_at: done ? new Date().toISOString() : null,
    })
    .eq("id", assignmentId)
    .eq("student_id", session.id);

  revalidatePath("/app", "layout");
}

// Appelée pendant le rendu de la page du compte-rendu : pas de revalidatePath
// ici (interdit au rendu), les pages /app sont de toute façon dynamiques.
export async function markReportRead(reportId: string) {
  const session = await requireStudent();
  const supabase = await createClient();

  await supabase
    .from("session_reports")
    .update({ read_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("student_id", session.id)
    .is("read_at", null);
}

const evaluationSchema = z.object({
  answers: z
    .array(z.object({ question: z.string(), answer: z.string() }))
    .min(1),
  comment: z.string().optional(),
});

export async function submitSelfEvaluation(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireStudent();
  const supabase = await createClient();

  const raw = formData.get("answers");
  const parsed = evaluationSchema.safeParse({
    answers: raw ? JSON.parse(String(raw)) : [],
    comment: formData.get("comment")?.toString() ?? "",
  });

  if (!parsed.success) {
    return { error: "Réponds à toutes les questions avant de valider." };
  }

  const { data: path } = await supabase
    .from("learning_paths")
    .select("id")
    .eq("student_id", session.id)
    .eq("is_active", true)
    .maybeSingle();

  const { error } = await supabase.from("self_evaluations").insert({
    student_id: session.id,
    path_id: path?.id ?? null,
    answers: parsed.data.answers,
    free_comment: parsed.data.comment || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/app");
  return { success: "Merci, ton enseignant reçoit tes réponses." };
}

const PREFERENCE_KEYS = [
  "session_reminders",
  "email_reminders",
  "report_published",
] as const;

export type PreferenceKey = (typeof PREFERENCE_KEYS)[number];

/** Un interrupteur du profil = une préférence, enregistrée au clic. */
export async function setNotificationPreference(
  key: PreferenceKey,
  value: boolean,
) {
  if (!PREFERENCE_KEYS.includes(key)) return;

  const session = await requireStudent();
  const supabase = await createClient();

  const { data: current } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", session.id)
    .maybeSingle();

  const next: Record<PreferenceKey, boolean> = {
    session_reminders: current?.session_reminders ?? true,
    email_reminders: current?.email_reminders ?? true,
    report_published: current?.report_published ?? true,
  };
  next[key] = value;

  await supabase
    .from("notification_preferences")
    .upsert({ user_id: session.id, ...next });

  revalidatePath("/app/profil");
}
