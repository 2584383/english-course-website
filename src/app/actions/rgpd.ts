"use server";

import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { ActionState } from "@/app/actions/auth";

/**
 * Droit à l'oubli (CDC 4.3).
 *
 * L'enregistrement de la demande et l'anonymisation passent par la RPC,
 * puis le compte `auth.users` est supprimé avec la clé de service, ce qui
 * cascade sur l'intégralité des données pédagogiques.
 */
export async function deleteMyAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const session = await requireUser();

  if (formData.get("confirmation") !== "SUPPRIMER") {
    return { error: "Saisis SUPPRIMER en majuscules pour confirmer." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("request_account_deletion", {
    p_reason: formData.get("reason")?.toString() || undefined,
  });

  if (error) return { error: error.message };

  try {
    const admin = createAdminClient();
    const { error: deleteError } = await admin.auth.admin.deleteUser(session.id);
    if (deleteError) throw deleteError;
  } catch {
    // La clé de service n'est pas disponible : la demande reste enregistrée
    // et le compte est déjà anonymisé et désactivé.
    await supabase.auth.signOut();
    return {
      error:
        "Ta demande est enregistrée et ton compte désactivé. La purge définitive sera finalisée sous 30 jours.",
    };
  }

  await supabase.auth.signOut();
  redirect("/?compte=supprime");
}

/** Export des données personnelles au format JSON (portabilité RGPD). */
export async function exportMyData() {
  const session = await requireUser();
  const supabase = await createClient();

  const [profile, studentProfile, consents, reports, assignments, bookings] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", session.id).maybeSingle(),
      supabase
        .from("student_profiles")
        .select("*")
        .eq("id", session.id)
        .maybeSingle(),
      supabase.from("consents").select("*").eq("user_id", session.id),
      supabase.from("student_reports").select("*").eq("student_id", session.id),
      supabase.from("assignments").select("*").eq("student_id", session.id),
      supabase.from("bookings").select("*").eq("student_id", session.id),
    ]);

  return {
    exported_at: new Date().toISOString(),
    profile: profile.data,
    student_profile: studentProfile.data,
    consents: consents.data,
    reports: reports.data,
    assignments: assignments.data,
    bookings: bookings.data,
  };
}
