import { createClient } from "@/lib/supabase/server";
import type {
  Booking,
  DiscoveryCall,
  LearningPath,
  PathSession,
  PathTemplate,
  Profile,
  Resource,
  SessionReport,
  StudentProfile,
} from "@/lib/database.types";

export type StudentRow = {
  profile: Profile;
  studentProfile: StudentProfile;
  path: LearningPath | null;
  progress: { done: number; total: number; pct: number };
  nextBooking: Booking | null;
  pendingReport: boolean;
};

/** Liste des étudiants affectés à l'enseignant, avec leurs indicateurs de suivi. */
export async function getTeacherStudents(
  teacherId: string,
): Promise<StudentRow[]> {
  const supabase = await createClient();

  const { data: studentProfiles } = await supabase
    .from("student_profiles")
    .select("*")
    .eq("teacher_id", teacherId);

  const rows = (studentProfiles ?? []) as StudentProfile[];
  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);

  const [profilesRes, pathsRes, sessionsRes, bookingsRes, reportsRes] =
    await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase
        .from("learning_paths")
        .select("*")
        .in("student_id", ids)
        .eq("is_active", true),
      supabase.from("path_sessions").select("id, path_id, status"),
      supabase
        .from("bookings")
        .select("*")
        .in("student_id", ids)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at"),
      supabase
        .from("session_reports")
        .select("student_id, status")
        .in("student_id", ids)
        .eq("status", "draft"),
    ]);

  const profiles = new Map(
    ((profilesRes.data ?? []) as Profile[]).map((p) => [p.id, p]),
  );
  const paths = (pathsRes.data ?? []) as LearningPath[];
  const sessions = (sessionsRes.data ?? []) as Pick<
    PathSession,
    "id" | "path_id" | "status"
  >[];
  const bookings = (bookingsRes.data ?? []) as Booking[];
  const drafts = new Set(
    (reportsRes.data ?? []).map((report) => report.student_id),
  );

  return rows
    .map((studentProfile) => {
      const profile = profiles.get(studentProfile.id);
      if (!profile) return null;

      const path = paths.find((p) => p.student_id === studentProfile.id) ?? null;
      const pathSessions = path
        ? sessions.filter((s) => s.path_id === path.id)
        : [];
      const done = pathSessions.filter((s) => s.status === "done").length;

      return {
        profile,
        studentProfile,
        path,
        progress: {
          done,
          total: pathSessions.length,
          pct: pathSessions.length
            ? Math.round((done / pathSessions.length) * 100)
            : 0,
        },
        nextBooking:
          bookings.find((b) => b.student_id === studentProfile.id) ?? null,
        pendingReport: drafts.has(studentProfile.id),
      } satisfies StudentRow;
    })
    .filter((row): row is StudentRow => row !== null)
    .sort((a, b) =>
      (a.profile.full_name ?? "").localeCompare(b.profile.full_name ?? ""),
    );
}

/** Séances du jour, triées par heure. */
export async function getTodayBookings(teacherId: string) {
  const supabase = await createClient();

  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("teacher_id", teacherId)
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at");

  return (data ?? []) as Booking[];
}

export async function getWeekBookings(teacherId: string, weekStart: Date) {
  const supabase = await createClient();

  const end = new Date(weekStart);
  end.setDate(end.getDate() + 7);

  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("teacher_id", teacherId)
    .gte("starts_at", weekStart.toISOString())
    .lt("starts_at", end.toISOString())
    .neq("status", "canceled")
    .order("starts_at");

  return (data ?? []) as Booking[];
}

export async function getDiscoveryCalls(teacherId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("discovery_calls")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []) as DiscoveryCall[];
}

export async function getTemplates(teacherId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("path_templates")
    .select("*")
    .eq("teacher_id", teacherId)
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  return (data ?? []) as PathTemplate[];
}

export async function getResources(teacherId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resources")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("created_at", { ascending: false });

  return (data ?? []) as Resource[];
}

export type ReportRow = SessionReport & {
  booking: Booking | null;
  student: Profile | null;
};

/** Comptes-rendus, brouillons en tête : c'est la file de travail de l'enseignant. */
export async function getReportQueue(teacherId: string): Promise<ReportRow[]> {
  const supabase = await createClient();

  const { data: reports } = await supabase
    .from("session_reports")
    .select("*")
    .eq("teacher_id", teacherId)
    .order("status")
    .order("created_at", { ascending: false });

  const rows = (reports ?? []) as SessionReport[];
  if (rows.length === 0) return [];

  const [bookingsRes, profilesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .in("id", rows.map((r) => r.booking_id)),
    supabase
      .from("profiles")
      .select("*")
      .in("id", [...new Set(rows.map((r) => r.student_id))]),
  ]);

  const bookings = new Map(
    ((bookingsRes.data ?? []) as Booking[]).map((b) => [b.id, b]),
  );
  const students = new Map(
    ((profilesRes.data ?? []) as Profile[]).map((p) => [p.id, p]),
  );

  return rows.map((report) => ({
    ...report,
    booking: bookings.get(report.booking_id) ?? null,
    student: students.get(report.student_id) ?? null,
  }));
}

/** Séances passées sans compte-rendu : l'enseignant doit les traiter. */
export async function getBookingsAwaitingReport(teacherId: string) {
  const supabase = await createClient();

  const { data: bookings } = await supabase
    .from("bookings")
    .select("*")
    .eq("teacher_id", teacherId)
    .lt("starts_at", new Date().toISOString())
    .in("status", ["scheduled", "completed"])
    .order("starts_at", { ascending: false })
    .limit(30);

  const rows = (bookings ?? []) as Booking[];
  if (rows.length === 0) return [];

  const { data: reports } = await supabase
    .from("session_reports")
    .select("booking_id")
    .in("booking_id", rows.map((b) => b.id));

  const covered = new Set((reports ?? []).map((r) => r.booking_id));
  return rows.filter((booking) => !covered.has(booking.id));
}
