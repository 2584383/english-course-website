import "server-only";

import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";

type Admin = ReturnType<typeof createAdminClient>;

/** Enseignant proposé à l'étudiant pour son appel de découverte. */
export type TeacherCard = {
  id: string;
  name: string;
  bio: string | null;
  discoveryUrl: string;
};

/** Appel de découverte tel que l'étudiant le voit (sans les notes du prof). */
export type StudentDiscoveryCall = {
  teacherId: string;
  scheduledAt: string | null;
  status: string;
  eventUri: string | null;
};

/* -------------------------------------------------------------------------- */
/* Contexte transmis à Calendly                                               */
/* -------------------------------------------------------------------------- */

const PREFIX = "discovery:";

/** `utm_content` du widget d'appel découverte : « discovery:<étudiant>:<prof> ». */
export function encodeDiscoveryContext(studentId: string, teacherId: string) {
  return `${PREFIX}${studentId}:${teacherId}`;
}

export function decodeDiscoveryContext(value: string | null | undefined) {
  if (!value?.startsWith(PREFIX)) return null;
  const [studentId, teacherId] = value.slice(PREFIX.length).split(":");
  return studentId && teacherId ? { studentId, teacherId } : null;
}

/* -------------------------------------------------------------------------- */
/* Lectures                                                                   */
/* -------------------------------------------------------------------------- */

/** Enseignants actifs ayant publié un lien d'appel de découverte. */
export async function listDiscoveryTeachers(admin: Admin): Promise<TeacherCard[]> {
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, email, bio, discovery_url")
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
      discoveryUrl: teacher.discovery_url!.trim(),
    }));
}

/** Dernier appel de découverte réservé par l'étudiant, s'il y en a un. */
export async function getStudentDiscoveryCall(
  admin: Admin,
  studentId: string,
): Promise<StudentDiscoveryCall | null> {
  const { data } = await admin
    .from("discovery_calls")
    .select("teacher_id, scheduled_at, status, calendly_event_uri")
    .eq("student_id", studentId)
    // Un appel annulé côté Calendly repasse « à qualifier » : l'étudiant peut
    // alors en réserver un autre.
    .not("status", "in", "(lost,to_qualify)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data
    ? {
        teacherId: data.teacher_id,
        scheduledAt: data.scheduled_at,
        status: data.status,
        eventUri: data.calendly_event_uri,
      }
    : null;
}

/** L'étudiant peut encore changer de prof tant qu'aucun parcours n'est lancé. */
export async function canChooseTeacher(admin: Admin, studentId: string) {
  const { count } = await admin
    .from("learning_paths")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId)
    .eq("is_active", true);

  return (count ?? 0) === 0;
}

/**
 * Tout ce qu'il faut pour proposer l'appel de découverte à un étudiant.
 * `offer` : vrai s'il n'a ni appel réservé ni parcours, et qu'un prof est dispo.
 */
export async function getDiscoveryState(studentId: string) {
  let admin: Admin;
  try {
    admin = createAdminClient();
  } catch {
    return { teachers: [], call: null, offer: false };
  }

  const [teachers, call, free] = await Promise.all([
    listDiscoveryTeachers(admin),
    getStudentDiscoveryCall(admin, studentId),
    canChooseTeacher(admin, studentId),
  ]);

  return {
    teachers: teachers.map((teacher) => ({
      ...teacher,
      utmContent: encodeDiscoveryContext(studentId, teacher.id),
    })),
    call: call
      ? { ...call, teacherName: teachers.find((t) => t.id === call.teacherId)?.name ?? null }
      : null,
    offer: teachers.length > 0 && !call && free,
  };
}

/* -------------------------------------------------------------------------- */
/* Enregistrement                                                             */
/* -------------------------------------------------------------------------- */

/** Horaires de l'événement Calendly ; null si le jeton n'y a pas accès. */
export async function fetchCalendlyEvent(eventUri: string) {
  const token = serverEnv.calendlyToken;
  if (!token || !eventUri.startsWith("https://api.calendly.com/")) return null;

  try {
    const response = await fetch(eventUri, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) return null;
    const { resource } = (await response.json()) as {
      resource?: { start_time?: string; end_time?: string };
    };
    return resource?.start_time
      ? { startTime: resource.start_time, endTime: resource.end_time ?? null }
      : null;
  } catch {
    return null;
  }
}

/**
 * Inscrit l'appel dans le CRM du prof choisi et rattache l'étudiant à ce prof
 * (sauf s'il a déjà un parcours en cours avec quelqu'un).
 * Idempotent : le widget et le webhook peuvent l'appeler pour le même événement.
 */
export async function recordDiscoveryCall(
  admin: Admin,
  input: {
    studentId: string;
    teacherId: string;
    eventUri: string;
    startTime?: string | null;
    endTime?: string | null;
  },
) {
  const { data: student } = await admin
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", input.studentId)
    .maybeSingle();
  if (!student || student.role !== "student") {
    return { error: "Étudiant introuvable." } as const;
  }

  const teachers = await listDiscoveryTeachers(admin);
  if (!teachers.some((teacher) => teacher.id === input.teacherId)) {
    return { error: "Enseignant introuvable." } as const;
  }

  const minutes =
    input.startTime && input.endTime
      ? Math.round(
          (new Date(input.endTime).getTime() - new Date(input.startTime).getTime()) /
            60000,
        )
      : null;

  const { error } = await admin.from("discovery_calls").upsert(
    {
      teacher_id: input.teacherId,
      student_id: student.id,
      full_name: student.full_name?.trim() || student.email,
      email: student.email,
      calendly_event_uri: input.eventUri,
      status: "scheduled",
      // Ne pas effacer un horaire déjà connu quand le widget n'en a pas
      ...(input.startTime ? { scheduled_at: input.startTime } : {}),
      ...(minutes ? { duration_minutes: minutes } : {}),
    },
    { onConflict: "calendly_event_uri" },
  );
  if (error) return { error: error.message } as const;

  if (await canChooseTeacher(admin, student.id)) {
    await admin
      .from("student_profiles")
      .update({ teacher_id: input.teacherId })
      .eq("id", student.id);
  }

  return { ok: true } as const;
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
