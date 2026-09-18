"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { z } from "zod";

import { HOME_BY_ROLE } from "@/lib/supabase/session";
import { createClient } from "@/lib/supabase/server";

export type ActionState = { error?: string; success?: string };

const credentials = z.object({
  email: z.string().email("Adresse email invalide."),
  password: z.string().min(8, "Le mot de passe doit faire au moins 8 caractères."),
});

export async function signIn(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = credentials.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email ou mot de passe incorrect." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Session introuvable, réessaie." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", user.id);

  const next = String(formData.get("next") ?? "");
  revalidatePath("/", "layout");
  redirect(next || HOME_BY_ROLE[profile?.role ?? "student"]);
}

const signUpSchema = credentials.extend({
  fullName: z.string().min(2, "Indique ton prénom et ton nom."),
});

export async function signUp(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = signUpSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Consentement CGU + politique de confidentialité obligatoire (RGPD, CDC 4.3)
  if (formData.get("terms") !== "on" || formData.get("privacy") !== "on") {
    return {
      error:
        "Tu dois accepter les conditions d'utilisation et la politique de confidentialité.",
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName, role: "student" },
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (!data.session) {
    return {
      success:
        "Compte créé. Confirme ton adresse depuis l'email que nous venons de t'envoyer, puis connecte-toi.",
    };
  }

  const userId = data.user!.id;
  await supabase.from("consents").insert([
    { user_id: userId, kind: "terms", granted: true },
    { user_id: userId, kind: "privacy", granted: true },
    {
      user_id: userId,
      kind: "pedagogical_data",
      granted: formData.get("pedagogical") === "on",
    },
  ]);

  revalidatePath("/", "layout");
  redirect("/bienvenue");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/connexion");
}
