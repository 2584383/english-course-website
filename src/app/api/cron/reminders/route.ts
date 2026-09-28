import { NextResponse, type NextRequest } from "next/server";

import {
  sendPendingReportsReminder,
  sendSessionReminder,
  type ReminderOffset,
} from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Fenêtres de rappel (CDC 3.1 : J-3, J-1).
 * Plan Vercel Hobby : le cron ne tourne qu'une fois par jour, à
 * CRON_HOUR_UTC (voir `vercel.json`). Chaque fenêtre couvre donc 24 h, décalée
 * pour tomber exactement sur le jour J-3 / J-1 (en UTC) de la séance.
 * Le rappel H-1 demande un cron horaire (plan Pro) : remettre
 * `{ offset: "h1", hours: 1 }` avec une fenêtre d'une heure le cas échéant.
 * La table `booking_reminders` garantit qu'un rappel n'est jamais envoyé deux fois.
 */
const CRON_HOUR_UTC = 7;

const WINDOWS: { offset: ReminderOffset; hours: number }[] = [
  { offset: "d3", hours: 72 - CRON_HOUR_UTC },
  { offset: "d1", hours: 24 - CRON_HOUR_UTC },
];

const WINDOW_WIDTH_MS = 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
  // Protection : Vercel Cron envoie `Authorization: Bearer <CRON_SECRET>`
  if (serverEnv.cronSecret) {
    const header = request.headers.get("authorization");
    if (header !== `Bearer ${serverEnv.cronSecret}`) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  const now = Date.now();
  const results: Record<string, number> = {};

  for (const window of WINDOWS) {
    const from = new Date(now + window.hours * 3600_000);
    const to = new Date(from.getTime() + WINDOW_WIDTH_MS);

    const { data: bookings } = await admin
      .from("bookings")
      .select("id, student_id, starts_at, meet_url")
      .eq("status", "scheduled")
      .gte("starts_at", from.toISOString())
      .lt("starts_at", to.toISOString());

    let sent = 0;

    for (const booking of bookings ?? []) {
      // Idempotence : la clé primaire (booking_id, offset_label) rejette
      // toute seconde insertion pour le même rappel.
      const { error: claimError } = await admin
        .from("booking_reminders")
        .insert({ booking_id: booking.id, offset_label: window.offset });

      if (claimError) continue;

      const [{ data: student }, { data: prefs }] = await Promise.all([
        admin
          .from("profiles")
          .select("email, full_name")
          .eq("id", booking.student_id)
          .maybeSingle(),
        admin
          .from("notification_preferences")
          .select("email_reminders")
          .eq("user_id", booking.student_id)
          .maybeSingle(),
      ]);

      if (!student || prefs?.email_reminders === false) continue;

      await sendSessionReminder({
        to: student.email,
        studentName: student.full_name ?? "",
        when: formatDateTime(booking.starts_at),
        offset: window.offset,
        meetUrl: booking.meet_url,
      });

      sent += 1;
    }

    results[window.offset] = sent;
  }

  results.report = await remindPendingReports(admin, now);

  return NextResponse.json({ ok: true, sent: results });
}

/**
 * Relance enseignant : séances terminées depuis 24 h à 7 jours sans
 * compte-rendu publié. Une ligne `booking_reminders` (label `report`) par
 * séance garantit une seule relance ; les séances d'un même enseignant sont
 * regroupées dans un seul email.
 */
async function remindPendingReports(
  admin: ReturnType<typeof createAdminClient>,
  now: number,
) {
  const { data: bookings } = await admin
    .from("bookings")
    .select("id, teacher_id, student_id, starts_at")
    .in("status", ["scheduled", "completed"])
    .lt("ends_at", new Date(now - 24 * 3600_000).toISOString())
    .gt("ends_at", new Date(now - 7 * 24 * 3600_000).toISOString());

  if (!bookings?.length) return 0;

  const { data: published } = await admin
    .from("session_reports")
    .select("booking_id")
    .eq("status", "published")
    .in("booking_id", bookings.map((b) => b.id));

  const done = new Set((published ?? []).map((r) => r.booking_id));
  const byTeacher = new Map<string, typeof bookings>();

  for (const booking of bookings) {
    if (done.has(booking.id)) continue;

    const { error: claimError } = await admin
      .from("booking_reminders")
      .insert({ booking_id: booking.id, offset_label: "report" });
    if (claimError) continue;

    byTeacher.set(booking.teacher_id, [
      ...(byTeacher.get(booking.teacher_id) ?? []),
      booking,
    ]);
  }

  if (byTeacher.size === 0) return 0;

  const ids = [
    ...byTeacher.keys(),
    ...[...byTeacher.values()].flat().map((b) => b.student_id),
  ];
  const { data: people } = await admin
    .from("profiles")
    .select("id, email, full_name")
    .in("id", [...new Set(ids)]);
  const byId = new Map((people ?? []).map((p) => [p.id, p]));

  let sent = 0;
  for (const [teacherId, pending] of byTeacher) {
    const teacher = byId.get(teacherId);
    if (!teacher) continue;

    await sendPendingReportsReminder({
      to: teacher.email,
      teacherName: teacher.full_name ?? "",
      sessions: pending.map((b) => ({
        bookingId: b.id,
        when: formatDateTime(b.starts_at),
        studentName:
          byId.get(b.student_id)?.full_name ??
          byId.get(b.student_id)?.email ??
          "Apprenant",
      })),
    });
    sent += pending.length;
  }

  return sent;
}
