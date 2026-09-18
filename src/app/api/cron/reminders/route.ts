import { NextResponse, type NextRequest } from "next/server";

import { sendSessionReminder, type ReminderOffset } from "@/lib/email/send";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Fenêtres de rappel (CDC 3.1 : J-3, J-1, H-1).
 * Chaque fenêtre couvre une heure : le cron tourne toutes les heures et la
 * table `booking_reminders` garantit qu'un rappel n'est jamais envoyé deux fois.
 */
const WINDOWS: { offset: ReminderOffset; hours: number }[] = [
  { offset: "d3", hours: 72 },
  { offset: "d1", hours: 24 },
  { offset: "h1", hours: 1 },
];

const WINDOW_WIDTH_MS = 60 * 60 * 1000;

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

  return NextResponse.json({ ok: true, sent: results });
}
