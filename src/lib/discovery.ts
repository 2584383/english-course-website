import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** Enseignant proposé au prospect pour son appel de découverte. */
export type TeacherCard = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  discoveryUrl: string;
};

/* -------------------------------------------------------------------------- */
/* Contexte transmis à Calendly                                               */
/* -------------------------------------------------------------------------- */

const PREFIX = "decouverte:";

/** `utm_content` du widget d'appel découverte : « decouverte:<prof> ». */
export function encodeDiscoveryContext(teacherId: string) {
  return `${PREFIX}${teacherId}`;
}

export function decodeDiscoveryContext(value: string | null | undefined) {
  if (!value?.startsWith(PREFIX)) return null;
  const teacherId = value.slice(PREFIX.length);
  return teacherId ? { teacherId } : null;
}

/* -------------------------------------------------------------------------- */
/* Lectures                                                                   */
/* -------------------------------------------------------------------------- */

/** Enseignants actifs ayant publié un lien d'appel de découverte. */
export async function listDiscoveryTeachers(admin: Admin): Promise<TeacherCard[]> {
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, bio, avatar_url, discovery_url")
    .in("role", ["teacher", "super_admin"])
    .eq("status", "active")
    .not("discovery_url", "is", null)
    .order("full_name");

  return (data ?? [])
    .filter((teacher) => teacher.discovery_url?.trim())
    .map((teacher) => ({
      id: teacher.id,
      name: teacher.full_name?.trim() || teacher.email,
      bio: teacher.bio,
      avatarUrl: teacher.avatar_url,
      discoveryUrl: teacher.discovery_url!.trim(),
    }));
}

/** Profs à afficher sur la page publique, avec le contexte Calendly de chacun. */
export async function getDiscoveryTeachers() {
  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    return [];
  }

  const teachers = await listDiscoveryTeachers(admin);
  return teachers.map((teacher) => ({
    ...teacher,
    utmContent: encodeDiscoveryContext(teacher.id),
  }));
}

/* -------------------------------------------------------------------------- */
/* Enregistrement (webhook Calendly)                                          */
/* -------------------------------------------------------------------------- */

/**
 * Inscrit l'appel réservé par un prospect dans le CRM du prof choisi.
 * Aucun compte n'est créé : il le sera à l'invitation ou à l'inscription,
 * où l'email permet de retrouver cet appel. Idempotent (URI de l'événement).
 */
export async function recordDiscoveryCall(
  admin: Admin,
  input: {
    teacherId: string;
    eventUri: string;
    name: string | null;
    email: string | null;
    startTime: string;
    endTime: string;
  },
) {
  const teachers = await listDiscoveryTeachers(admin);
  if (!teachers.some((teacher) => teacher.id === input.teacherId)) {
    return { error: "Enseignant introuvable." } as const;
  }

  const email = input.email?.trim().toLowerCase() || null;

  // Déjà inscrit (compte créé avant l'appel) : on relie l'appel à son compte
  const { data: student } = email
    ? await admin
        .from("profiles")
        .select("id")
        .eq("email", email)
        .eq("role", "student")
        .maybeSingle()
    : { data: null };

  const minutes = Math.round(
    (new Date(input.endTime).getTime() - new Date(input.startTime).getTime()) / 60000,
  );

  const { error } = await admin.from("discovery_calls").upsert(
    {
      teacher_id: input.teacherId,
      student_id: student?.id ?? null,
      full_name: input.name?.trim() || email || "Prospect",
      email,
      calendly_event_uri: input.eventUri,
      scheduled_at: input.startTime,
      duration_minutes: Number.isFinite(minutes) ? minutes : null,
      status: "scheduled",
    },
    { onConflict: "calendly_event_uri" },
  );

  return error ? ({ error: error.message } as const) : ({ ok: true } as const);
}

/** Annulation côté Calendly : l'appel repasse « à qualifier ». */
export async function cancelDiscoveryCall(admin: Admin, eventUri: string) {
  const { data } = await admin
    .from("discovery_calls")
    .update({ status: "to_qualify", scheduled_at: null })
    .eq("calendly_event_uri", eventUri)
    .select("id");

  return (data?.length ?? 0) > 0;
}
