import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { Profile, StudentProfile, UserRole } from "@/lib/database.types";

export type SessionUser = { id: string; email: string; profile: Profile };

/** Renvoie l'utilisateur courant, ou `null` s'il n'est pas connecté. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;
  return { id: user.id, email: user.email ?? profile.email, profile };
}

/** Exige un utilisateur connecté, et éventuellement un rôle donné. */
export async function requireUser(role?: UserRole | UserRole[]) {
  const session = await getSessionUser();
  if (!session) redirect("/connexion");

  if (role) {
    const allowed = Array.isArray(role) ? role : [role];
    if (!allowed.includes(session.profile.role)) {
      redirect(
        session.profile.role === "student"
          ? "/app"
          : session.profile.role === "teacher"
            ? "/prof"
            : "/admin",
      );
    }
  }

  return session;
}

export async function requireStudent() {
  const session = await requireUser("student");
  const supabase = await createClient();
  const { data: studentProfile } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("id", session.id)
    .single();

  return { ...session, studentProfile: studentProfile as StudentProfile | null };
}

export async function requireTeacher() {
  return requireUser(["teacher", "super_admin"]);
}

export async function requireAdmin() {
  return requireUser("super_admin");
}

/** Horodate la dernière connexion (indicateur de suivi, CDC 3.2). */
export async function touchLastSeen(userId: string) {
  const supabase = await createClient();
  await supabase
    .from("profiles")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", userId);
}
