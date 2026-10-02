"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { requireTeacher } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendStudentInvitation, sendReportPublished } from "@/lib/email/send";
import {
  assignSessionHomework,
  homeworkFromText,
  nextPathSessionId,
  normalizeHomework,
} from "@/lib/homework";
import { getCatalogTemplate } from "@/lib/catalog";
import { insertTemplate, renumberTemplate } from "@/lib/templates";
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
/* Rattachement des étudiants inscrits d'eux-mêmes                            */
/* -------------------------------------------------------------------------- */

/**
 * Rattache à l'enseignant un étudiant encore sans enseignant. Sans effet si
 * l'étudiant est déjà suivi : on ne « vole » jamais l'élève d'un collègue.
 */
async function attachIfUnassigned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  teacherId: string,
) {
  await supabase
    .from("student_profiles")
    .update({ teacher_id: teacherId })
    .eq("id", studentId)
    .is("teacher_id", null);
}

export async function claimStudent(formData: FormData) {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  await attachIfUnassigned(supabase, studentId, teacher.id);

  revalidatePath(`/prof/etudiants/${studentId}`);
  revalidatePath("/prof/etudiants");
  revalidatePath("/prof");
}

/* -------------------------------------------------------------------------- */
/* Profil public de l'enseignant                                              */
/* -------------------------------------------------------------------------- */

const teacherProfileSchema = z.object({
  bio: z.string().trim().max(400, "400 caractères maximum."),
  discoveryUrl: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || /^https:\/\/calendly\.com\/.+/.test(value),
      "Colle le lien public de ton événement Calendly (https://calendly.com/…).",
    ),
});

/** Présentation et lien d'appel de découverte, montrés aux visiteurs. */
export async function updateTeacherProfile(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();

  const parsed = teacherProfileSchema.safeParse({
    bio: formData.get("bio") ?? "",
    discoveryUrl: formData.get("discoveryUrl") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      bio: parsed.data.bio || null,
      discovery_url: parsed.data.discoveryUrl || null,
    })
    .eq("id", teacher.id);

  if (error) return { error: error.message };

  revalidatePath("/prof/profil");
  return {
    success: parsed.data.discoveryUrl
      ? "Profil enregistré : les visiteurs peuvent te choisir pour leur appel découverte."
      : "Profil enregistré. Sans lien Calendly, tu n'es pas proposé pour les appels découverte.",
  };
}

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
  const teacher = await requireTeacher();

  const parsed = studentSheetSchema.safeParse(
    Object.fromEntries(formData.entries()),
  );
  if (!parsed.success) return { error: "Formulaire invalide." };

  const supabase = await createClient();
  await attachIfUnassigned(supabase, parsed.data.studentId, teacher.id);
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
  const teacher = await requireTeacher();

  const studentId = String(formData.get("studentId"));
  const supabase = await createClient();
  await attachIfUnassigned(supabase, studentId, teacher.id);

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
  revalidatePath("/prof/appels");
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
    default_homework: homeworkFromText(formData.get("homework")?.toString() ?? ""),
  });

  if (error) return { error: error.message };

  await supabase
    .from("path_templates")
    .update({ session_count: (count ?? 0) + 1 })
    .eq("id", templateId);

  revalidatePath(`/prof/parcours/${templateId}`);
  return { success: "Séance ajoutée." };
}

/**
 * Modifie une séance du gabarit (titre, module, objectif, ordre du jour,
 * devoirs). Les devoirs sont répercutés sur les parcours déjà assignés depuis
 * ce gabarit, tant que la séance ne les a pas distribués.
 */
export async function updateTemplateSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const sessionId = String(formData.get("sessionId"));
  const templateId = String(formData.get("templateId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { error: "Le titre de la séance est obligatoire." };

  const homework = homeworkFromText(formData.get("homework")?.toString() ?? "");

  const { data: before } = await supabase
    .from("template_sessions")
    .select("title")
    .eq("id", sessionId)
    .single();

  const { error } = await supabase
    .from("template_sessions")
    .update({
      title,
      module: (formData.get("module")?.toString() ?? "other") as ModuleKind,
      goal: formData.get("goal")?.toString().trim() || null,
      agenda: agendaFromText(formData.get("agenda")?.toString() ?? ""),
      default_homework: homework,
    })
    .eq("id", sessionId);

  if (error) return { error: error.message };

  const { data: paths } = await supabase
    .from("learning_paths")
    .select("id")
    .eq("template_id", templateId);

  if (paths?.length && before) {
    await supabase
      .from("path_sessions")
      .update({ homework })
      .in("path_id", paths.map((p) => p.id))
      .eq("title", before.title)
      .is("homework_assigned_at", null);
  }

  revalidatePath(`/prof/parcours/${templateId}`);
  return { success: "Séance enregistrée." };
}

export async function deleteTemplateSession(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const id = String(formData.get("sessionId"));
  const templateId = String(formData.get("templateId"));

  await supabase.from("template_sessions").delete().eq("id", id);
  // Pas de trou dans la numérotation, et un nombre de séances exact
  await renumberTemplate(supabase, templateId);
  revalidatePath(`/prof/parcours/${templateId}`);
  revalidatePath("/prof/parcours");
}

/** Remonte ou descend une séance du gabarit. */
export async function moveTemplateSession(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  const sessionId = String(formData.get("sessionId"));
  const templateId = String(formData.get("templateId"));
  const direction = formData.get("direction") === "up" ? -1 : 1;

  const { data: current } = await supabase
    .from("template_sessions")
    .select("id, position")
    .eq("id", sessionId)
    .single();
  if (!current) return;

  const { data: neighbour } = await supabase
    .from("template_sessions")
    .select("id, position")
    .eq("template_id", templateId)
    .eq("position", current.position + direction)
    .maybeSingle();
  if (!neighbour) return;

  // Échange en trois temps : contrainte d'unicité (template_id, position)
  await supabase.from("template_sessions").update({ position: -1 }).eq("id", current.id);
  await supabase
    .from("template_sessions")
    .update({ position: current.position })
    .eq("id", neighbour.id);
  await supabase
    .from("template_sessions")
    .update({ position: neighbour.position })
    .eq("id", current.id);

  revalidatePath(`/prof/parcours/${templateId}`);
}

/** Nom, scénario et description du gabarit. */
export async function updateTemplate(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireTeacher();
  const supabase = await createClient();

  const templateId = String(formData.get("templateId"));
  const name = String(formData.get("name") ?? "").trim();
  if (name.length < 3) return { error: "Donne un nom au gabarit." };

  const { error } = await supabase
    .from("path_templates")
    .update({
      name,
      scenario: (formData.get("scenario")?.toString() || null) as Scenario | null,
      description: formData.get("description")?.toString().trim() || null,
    })
    .eq("id", templateId);

  if (error) return { error: error.message };

  revalidatePath(`/prof/parcours/${templateId}`);
  revalidatePath("/prof/parcours");
  return { success: "Gabarit enregistré." };
}

/** Copie un gabarit pour en faire une variante (autre niveau, autre durée…). */
export async function duplicateTemplate(formData: FormData) {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const templateId = String(formData.get("templateId"));
  const [{ data: template }, { data: sessions }] = await Promise.all([
    supabase.from("path_templates").select("*").eq("id", templateId).single(),
    supabase
      .from("template_sessions")
      .select("*")
      .eq("template_id", templateId)
      .order("position"),
  ]);
  if (!template) return;

  const result = await insertTemplate(supabase, teacher.id, {
    name: `${template.name} (copie)`,
    scenario: template.scenario,
    description: template.description,
    sessions: (sessions ?? []).map((session) => ({
      title: session.title,
      module: session.module,
      goal: session.goal,
      agenda: session.agenda,
      homework: normalizeHomework(session.default_homework),
    })),
  });
  if ("error" in result) return;

  revalidatePath("/prof/parcours");
  redirect(`/prof/parcours/${result.id}`);
}

/** Retire un gabarit de la liste ; les parcours déjà assignés ne changent pas. */
export async function archiveTemplate(formData: FormData) {
  await requireTeacher();
  const supabase = await createClient();

  await supabase
    .from("path_templates")
    .update({ is_archived: true })
    .eq("id", String(formData.get("templateId")));

  revalidatePath("/prof/parcours");
  redirect("/prof/parcours");
}

/** Copie un gabarit du catalogue intégré dans les gabarits de l'enseignant. */
export async function installCatalogTemplate(formData: FormData) {
  const teacher = await requireTeacher();
  const catalog = getCatalogTemplate(String(formData.get("key")));
  if (!catalog) return;

  const supabase = await createClient();
  const result = await insertTemplate(supabase, teacher.id, {
    name: catalog.name,
    scenario: catalog.scenario,
    description: `${catalog.description} Niveau ${catalog.level}.`,
    sessions: catalog.sessions,
  });
  if ("error" in result) return;

  revalidatePath("/prof/parcours");
  redirect(`/prof/parcours/${result.id}`);
}

/** Instancie un gabarit en parcours personnalisé (RPC `assign_template`). */
export async function assignTemplateToStudent(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  await attachIfUnassigned(supabase, studentId, teacher.id);
  const { data: pathId, error } = await supabase.rpc("assign_template", {
    p_template_id: String(formData.get("templateId")),
    p_student_id: studentId,
    p_name: formData.get("name")?.toString() || undefined,
  });

  if (error) return { error: error.message };

  // Les devoirs de la séance 1 partent tout de suite
  const { data: first } = await supabase
    .from("path_sessions")
    .select("id")
    .eq("path_id", pathId)
    .order("position")
    .limit(1)
    .maybeSingle();
  const given = first ? await assignSessionHomework(supabase, first.id) : 0;

  revalidatePath(`/prof/etudiants/${studentId}`);
  return {
    success: given
      ? `Parcours assigné · ${given} devoir${given > 1 ? "s" : ""} donné${given > 1 ? "s" : ""} pour la séance 1.`
      : "Parcours assigné.",
  };
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

const reportSessionSchema = z.object({
  studentId: z.string().uuid("Choisis un apprenant."),
  startsAt: z.string().datetime({ message: "Date ou heure invalide." }),
  duration: z.coerce.number().int().min(15).max(240),
  pathSessionId: z.string().uuid().optional(),
});

/**
 * Crée une séance hors Calendly (cours donné en direct, séance rattrapée…)
 * pour pouvoir en rédiger le compte-rendu.
 */
export async function createReportSession(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const teacher = await requireTeacher();

  const parsed = reportSessionSchema.safeParse({
    studentId: formData.get("studentId"),
    startsAt: formData.get("startsAt"),
    duration: formData.get("duration"),
    pathSessionId: formData.get("pathSessionId") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const { studentId, startsAt, duration, pathSessionId } = parsed.data;
  const start = new Date(startsAt);
  if (start.getTime() > Date.now() + 5 * 60_000) {
    return { error: "Un compte-rendu porte sur une séance déjà donnée." };
  }

  const supabase = await createClient();

  const { data: student } = await supabase
    .from("student_profiles")
    .select("id")
    .eq("id", studentId)
    .eq("teacher_id", teacher.id)
    .maybeSingle();
  if (!student) return { error: "Cet apprenant ne t'est pas affecté." };

  const { data: booking, error } = await supabase
    .from("bookings")
    .insert({
      student_id: studentId,
      teacher_id: teacher.id,
      path_session_id: pathSessionId ?? null,
      starts_at: start.toISOString(),
      ends_at: new Date(start.getTime() + duration * 60_000).toISOString(),
      status: "completed",
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/prof/comptes-rendus");
  redirect(`/prof/comptes-rendus/${booking.id}`);
}

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
    .select("id, student_id, path_session_id")
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

  // Séance N bouclée → les devoirs prévus pour la séance N+1 sont donnés
  if (booking.path_session_id) {
    const nextId = await nextPathSessionId(supabase, booking.path_session_id);
    if (nextId) await assignSessionHomework(supabase, nextId);
  }

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

  await attachIfUnassigned(supabase, studentId, teacher.id);
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
  const teacher = await requireTeacher();
  const supabase = await createClient();

  const studentId = String(formData.get("studentId"));
  await attachIfUnassigned(supabase, studentId, teacher.id);
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
