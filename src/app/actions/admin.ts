"use server";

import { revalidatePath } from "next/cache";

import { z } from "zod";

import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { publicEnv } from "@/lib/env";
import type { ActionState } from "@/app/actions/auth";
import type { AccountStatus, UserRole } from "@/lib/database.types";

const createUserSchema = z.object({
  email: z.string().email("Adresse email invalide."),
  fullName: z.string().min(2, "Indique le prénom et le nom."),
  role: z.enum(["teacher", "student", "super_admin"]),
});

/** Création d'un compte enseignant ou étudiant (CDC 3.3). */
export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const parsed = createUserSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    role: formData.get("role"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return {
      error:
        "SUPABASE_SERVICE_ROLE_KEY n'est pas configurée : la création de comptes est indisponible.",
    };
  }

  const { error } = await admin.auth.admin.inviteUserByEmail(parsed.data.email, {
    data: { full_name: parsed.data.fullName, role: parsed.data.role },
    redirectTo: `${publicEnv.siteUrl.replace(/\/$/, "")}/auth/callback`,
  });

  if (error) return { error: error.message };

  revalidatePath("/admin/utilisateurs");
  return { success: `Invitation envoyée à ${parsed.data.email}.` };
}

/** Suspend ou réactive un compte. */
export async function setAccountStatus(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ status: formData.get("status") as AccountStatus })
    .eq("id", String(formData.get("userId")));

  revalidatePath("/admin/utilisateurs");
}

/** Affecte un étudiant à un enseignant (modèle multi-professeurs). */
export async function assignTeacher(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  const teacherId = formData.get("teacherId")?.toString() || null;

  await supabase
    .from("student_profiles")
    .update({ teacher_id: teacherId })
    .eq("id", String(formData.get("studentId")));

  revalidatePath("/admin/utilisateurs");
}

export async function changeRole(formData: FormData) {
  await requireAdmin();
  const supabase = await createClient();

  await supabase
    .from("profiles")
    .update({ role: formData.get("role") as UserRole })
    .eq("id", String(formData.get("userId")));

  revalidatePath("/admin/utilisateurs");
}

/** Suppression définitive d'un compte et de toutes ses données. */
export async function deleteUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();

  const userId = String(formData.get("userId"));
  if (formData.get("confirmation") !== "SUPPRIMER") {
    return { error: "Saisis SUPPRIMER pour confirmer." };
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) return { error: error.message };
  } catch {
    return { error: "SUPABASE_SERVICE_ROLE_KEY n'est pas configurée." };
  }

  revalidatePath("/admin/utilisateurs");
  return { success: "Compte supprimé." };
}
