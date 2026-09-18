"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requireStudent } from "@/lib/auth";
import { AVAILABILITY_OPTIONS } from "@/lib/constants";
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

  revalidatePath("/app/devoirs");
  revalidatePath("/app");
}

export async function markReportRead(reportId: string) {
  const session = await requireStudent();
  const supabase = await createClient();

  await supabase
    .from("session_reports")
    .update({ read_at: new Date().toISOString() })
    .eq("id", reportId)
    .eq("student_id", session.id)
    .is("read_at", null);

  revalidatePath("/app");
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

export async function updateNotificationPreferences(formData: FormData) {
  const session = await requireStudent();
  const supabase = await createClient();

  await supabase.from("notification_preferences").upsert({
    user_id: session.id,
    session_reminders: formData.get("session_reminders") === "on",
    email_reminders: formData.get("email_reminders") === "on",
    report_published: formData.get("report_published") === "on",
  });

  revalidatePath("/app/profil");
}
