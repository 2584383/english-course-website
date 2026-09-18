import { createClient } from "@/lib/supabase/server";
import type {
  Assignment,
  Booking,
  LearningPath,
  PathSession,
  Resource,
  StudentReport,
} from "@/lib/database.types";

export type StudentDashboard = {
  path: LearningPath | null;
  sessions: PathSession[];
  nextBooking: (Booking & { session: PathSession | null }) | null;
  latestReport: StudentReport | null;
  assignments: Assignment[];
  needsSelfEvaluation: boolean;
  progress: { total: number; done: number; pct: number };
};

/** Charge en une passe tout ce dont l'accueil étudiant a besoin. */
export async function getStudentDashboard(
  studentId: string,
): Promise<StudentDashboard> {
  const supabase = await createClient();

  const { data: path } = await supabase
    .from("learning_paths")
    .select("*")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .maybeSingle();

  const [sessionsRes, bookingRes, reportRes, assignmentsRes, evalRes] =
    await Promise.all([
      path
        ? supabase
            .from("path_sessions")
            .select("*")
            .eq("path_id", path.id)
            .order("position")
        : Promise.resolve({ data: [] as PathSession[] }),
      supabase
        .from("bookings")
        .select("*")
        .eq("student_id", studentId)
        .eq("status", "scheduled")
        .gte("starts_at", new Date().toISOString())
        .order("starts_at")
        .limit(1)
        .maybeSingle(),
      supabase
        .from("student_reports")
        .select("*")
        .eq("student_id", studentId)
        .order("published_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("assignments")
        .select("*")
        .eq("student_id", studentId)
        .order("due_at", { ascending: true, nullsFirst: false })
        .order("created_at"),
      supabase
        .from("self_evaluations")
        .select("id")
        .eq("student_id", studentId)
        .limit(1),
    ]);

  const sessions = (sessionsRes.data ?? []) as PathSession[];
  const done = sessions.filter((s) => s.status === "done").length;

  const nextBooking = bookingRes.data
    ? {
        ...(bookingRes.data as Booking),
        session:
          sessions.find((s) => s.id === bookingRes.data!.path_session_id) ??
          null,
      }
    : null;

  // Auto-évaluation proposée à mi-parcours (CDC 3.1)
  const midway = sessions.length > 0 && done >= Math.floor(sessions.length / 2);

  return {
    path: (path as LearningPath | null) ?? null,
    sessions,
    nextBooking,
    latestReport: (reportRes.data as StudentReport | null) ?? null,
    assignments: (assignmentsRes.data ?? []) as Assignment[],
    needsSelfEvaluation: midway && (evalRes.data ?? []).length === 0,
    progress: {
      total: sessions.length,
      done,
      pct: sessions.length ? Math.round((done / sessions.length) * 100) : 0,
    },
  };
}

export async function getStudentReports(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("student_reports")
    .select("*")
    .eq("student_id", studentId)
    .order("published_at", { ascending: false });

  return (data ?? []) as StudentReport[];
}

export async function getSharedResources(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resource_shares")
    .select("shared_at, resources(*)")
    .eq("student_id", studentId)
    .order("shared_at", { ascending: false });

  return (data ?? [])
    .map((row) => row.resources as unknown as Resource | null)
    .filter((resource): resource is Resource => Boolean(resource));
}

export async function getStudentBookings(studentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*")
    .eq("student_id", studentId)
    .order("starts_at", { ascending: false });

  return (data ?? []) as Booking[];
}
