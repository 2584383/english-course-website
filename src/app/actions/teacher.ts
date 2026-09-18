"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendStudentInvitation, sendReportPublished } from "@/lib/email/send";
import { publicEnv } from "@/lib/env";
import type { ActionState } from "@/app/actions/auth";
import type {
  AgendaItem,
  CefrLevel,
  DiscoveryStatus,
  ModuleKind,
  ResourceKind,
  Scenario,
} from "@/lib/database.types";

/* -------------------------------------------------------------------------- */
/* Fiche étudiant                                                             */
/* -------------------------------------------------------------------------- */

const studentSheetSchema = z.object({
  studentId: z.string().uuid(),
  initialLevel: z.string().optional(),
  targetLevel: z.string().optional(),
  scenario: z.string().optional(),
  goal: z.string().optional(),
  teacherNotes: z.string().optional(),
});

export async function updateStudentSheet(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();

  const parsed = studentSheetSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { error: "Formulaire invalide." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("student_profiles")
    .update({
      initial_level: (parsed.data.initialLevel || null) as CefrLevel | null,
      target_level: (parsed.data.targetLevel || null) as CefrLevel | null,
      scenario: (parsed.data.scenario || null) as Scenario | null,
      goal: parsed.data.goal || null,
      teacher_notes: parsed.data.teacherNotes || null,
    })
    .eq("id", parsed.data.studentId);

  if (error) return { error: error.message };

  revalidatePath(`/prof/etudiants/${parsed.data.studentId}`);
  return { success: "Fiche enregistrée." };
}

/** Ouvre ou ferme les droits de réservation d'un étudiant (CDC 1.3). */
export async function setBookingAccess(formData: FormData) {
  await requireTeacher();

  const studentId = String(formData.get("studentId"));
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({
      booking_enabled: formData.get("enabled") === "on",
      booking_credits: Number(formData.get("credits") ?? 0),
    })
    .eq("id", studentId);

  revalidatePath(`/prof/etudiants/${studentId}`);
}

/* -------------------------------------------------------------------------- */
/* Invitation d'un étudiant                                                   */
/* -------------------------------------------------------------------------- */

const inviteSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  fullName: z.string().min(2, "Indique le prénom et le nom."),
});

/**
 * Crée le compte étudiant et l'affecte à l'enseignant.
 * Nécessite la clé de service : la création d'utilisateurs est un acte privilégié.
 */
export async function inviteStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();

  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY n'est pas configurée : l'invitation d'étudiants est indisponible.",
    };
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.fullName, role: "student" },
      redirectTo: `${publicEnv.siteUrl.replace(/\/$/, "")}/auth/callback?next=/bienvenue`,
    },
  );

  if (error) return { error: error.message };

  await admin
    .from("student_profiles")
    .upsert({ id: data.user.id, teacher_id: teacher.id });

  await sendStudentInvitation({
    to: parsed.data.email,
    studentName: parsed.data.fullName,
    teacherName: teacher.profile.full_name ?? "Ton enseignant",
  });

  revalidatePath("/prof/etudiants");
  return { success: `Invitation envoyée à ${parsed.data.email}.` };
}

/* -------------------------------------------------------------------------- */
/* Appels de découverte                                                       */
/* -------------------------------------------------------------------------- */

export async function saveDiscoveryCall(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const id = formData.get("id")?.toString();
  const payload = {
    teacher_id: teacher.id,
    full_name: String(formData.get("fullName") ?? "").trim(),
    email: formData.get("email")?.toString() || null,
    phone: formData.get("phone")?.toString() || null,
    scheduled_at: formData.get("scheduledAt")
      ? new Date(String(formData.get("scheduledAt"))).toISOString()
      : null,
    status: (formData.get("status")?.toString() ??
      "to_qualify") as DiscoveryStatus,
    notes: formData.get("notes")?.toString() || null,
  };

  if (!payload.full_name) return { error: "Le nom est obligatoire." };

  const { error } = id
    ? await supabase.from("discovery_calls").update(payload).eq("id", id)
    : await supabase.from("discovery_calls").insert(payload);

  if (error) return { error: error.message };

  revalidatePath("/prof/appels");
  return { success: "Appel enregistré." };
}

/* -------------------------------------------------------------------------- */
/* Gabarits de parcours                                                       */
/* -------------------------------------------------------------------------- */

export async function createTemplate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Donne un nom au gabarit." };

  const { data, error } = await supabase
    .from("path_templates")
    .insert({
      teacher_id: teacher.id,
      name,
      scenario: (formData.get("scenario")?.toString() || null) as Scenario | null,
      description: formData.get("description")?.toString() || null,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/prof/parcours");
  redirect(`/prof/parcours/${data.id}`);
}

const agendaFromText = (text: string): AgendaItem[] =>
  text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Format attendu : « 15 min | Construire un récit »
      const [duration, ...rest] = line.split("|");
      return rest.length
        ? { duration: duration.trim(), label: rest.join("|").trim() }
        : { duration: "", label: line };
    });

export async function addTemplateSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const templateId = String(formData.get("templateId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le titre de la séance est obligatoire." };

  const { count } = await supabase
    .from("template_sessions")
    .select("id", { count: "exact", head: true })
    .eq("template_id", templateId);

  const { error } = await supabase.from("template_sessions").insert({
    template_id: templateId,
    position: (count ?? 0) + 1,
    title,
    module: (formData.get("module")?.toString() ?? "other") as ModuleKind,
    goal: formData.get("goal")?.toString() || null,
    agenda: agendaFromText(formData.get("agenda")?.toString() ?? ""),
  });

  if (error) return { error: error.message };

  await supabase
    .from("path_templates")
    .update({ session_count: (count ?? 0) + 1 })
    .eq("id", templateId);

  revalidatePath(`/prof/parcours/${templateId}`);
  return { success: "Séance ajoutée." };
}

export async function deleteTemplateSession(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const id = String(formData.get("sessionId"));
  const templateId = String(formData.get("templateId"));

  await supabase.from("template_sessions").delete().eq("id", id);
  revalidatePath(`/prof/parcours/${templateId}`);
}

/** Instancie un gabarit en parcours personnalisé (RPC `assign_template`). */
export async function assignTemplateToStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  const { error } = await supabase.rpc("assign_template", {
    p_template_id: String(formData.get("templateId")),
    p_student_id: studentId,
    p_name: formData.get("name")?.toString() || undefined,
  });

  if (error) return { error: error.message };

  revalidatePath(`/prof/etudiants/${studentId}`);
  return { success: "Parcours assigné." };
}

/** Réordonne une séance du parcours d'un étudiant (CDC 3.2 : flexibilité). */
export async function movePathSession(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const sessionId = String(formData.get("sessionId"));
  const direction = formData.get("direction") === "up" ? -1 : 1;
  const studentId = String(formData.get("studentId"));

  const { data: current } = await supabase
    .from("path_sessions")
    .select("id, path_id, position")
    .eq("id", sessionId)
    .single();

  if (!current) return;

  const { data: neighbour } = await supabase
    .from("path_sessions")
    .select("id, position")
    .eq("path_id", current.path_id)
    .eq("position", current.position + direction)
    .maybeSingle();

  if (!neighbour) return;

  // Échange en trois temps : la contrainte d'unicité (path_id, position)
  // interdit un échange direct.
  await supabase
    .from("path_sessions")
    .update({ position: -1 })
    .eq("id", current.id);
  await supabase
    .from("path_sessions")
    .update({ position: current.position })
    .eq("id", neighbour.id);
  await supabase
    .from("path_sessions")
    .update({ position: neighbour.position })
    .eq("id", current.id);

  revalidatePath(`/prof/etudiants/${studentId}`);
}

/* -------------------------------------------------------------------------- */
/* Comptes-rendus                                                             */
/* -------------------------------------------------------------------------- */

export async function saveReport(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const bookingId = String(formData.get("bookingId"));
  const publish = formData.get("intent") === "publish";

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, student_id")
    .eq("id", bookingId)
    .single();

  if (!booking) return { error: "Séance introuvable." };

  const payload = {
    booking_id: bookingId,
    student_id: booking.student_id,
    teacher_id: teacher.id,
    theme: formData.get("theme")?.toString() || null,
    strengths: formData.get("strengths")?.toString() || null,
    improvements: formData.get("improvements")?.toString() || null,
    private_notes: formData.get("privateNotes")?.toString() || null,
    skills: formData.getAll("skills").map(String),
  };

  const { data: report, error } = await supabase
    .from("session_reports")
    .upsert(payload, { onConflict: "booking_id" })
    .select("id")
    .single();

  if (error) return { error: error.message };

  if (!publish) {
    revalidatePath("/prof/comptes-rendus");
    return { success: "Brouillon enregistré." };
  }

  const { error: publishError } = await supabase.rpc("publish_report", {
    p_report_id: report.id,
  });
  if (publishError) return { error: publishError.message };

  const { data: student } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", booking.student_id)
    .single();

  if (student) {
    await sendReportPublished({
      to: student.email,
      studentName: student.full_name ?? "",
      reportId: report.id,
      theme: payload.theme ?? "",
    });
  }

  revalidatePath("/prof/comptes-rendus");
  redirect("/prof/comptes-rendus");
}

/* -------------------------------------------------------------------------- */
/* Devoirs et ressources                                                      */
/* -------------------------------------------------------------------------- */

export async function assignHomework(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le titre du devoir est obligatoire." };

  const { error } = await supabase.from("assignments").insert({
    student_id: studentId,
    teacher_id: teacher.id,
    title,
    instructions: formData.get("instructions")?.toString() || null,
    due_label: formData.get("dueLabel")?.toString() || null,
    resource_id: formData.get("resourceId")?.toString() || null,
  });

  if (error) return { error: error.message };

  revalidatePath(`/prof/etudiants/${studentId}`);
  return { success: "Devoir assigné." };
}

export async function shareResource(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  await supabase.from("resource_shares").upsert({
    resource_id: String(formData.get("resourceId")),
    student_id: studentId,
  });

  revalidatePath(`/prof/etudiants/${studentId}`);
}

/* -------------------------------------------------------------------------- */
/* Bibliothèque de ressources                                                 */
/* -------------------------------------------------------------------------- */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

/** Dépose un support de cours dans le bucket privé, ou référence un lien. */
export async function uploadResource(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Donne un titre à la ressource." };

  const kind = (formData.get("kind")?.toString() ?? "pdf") as ResourceKind;
  const externalUrl = formData.get("externalUrl")?.toString()?.trim() || null;
  const file = formData.get("file");

  let storagePath: string | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_UPLOAD_BYTES) {
      return { error: "Fichier trop volumineux (25 Mo maximum)." };
    }

    // Le premier segment du chemin doit être l'identifiant de l'enseignant :
    // c'est ce que vérifient les policies Storage.
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
    storagePath = `${teacher.id}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("resources")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: uploadError.message };
  }

  if (!storagePath && !externalUrl) {
    return { error: "Ajoute un fichier ou un lien externe." };
  }

  const { error } = await supabase.from("resources").insert({
    teacher_id: teacher.id,
    title,
    kind,
    storage_path: storagePath,
    external_url: externalUrl,
    description: formData.get("description")?.toString() || null,
    duration_label: formData.get("durationLabel")?.toString() || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/prof/ressources");
  return { success: "Ressource ajoutée." };
}

export async function deleteResource(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const id = String(formData.get("resourceId"));
  const { data: resource } = await supabase
    .from("resources")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (resource?.storage_path) {
    await supabase.storage.from("resources").remove([resource.storage_path]);
  }

  await supabase.from("resources").delete().eq("id", id);
  revalidatePath("/prof/ressources");
}
