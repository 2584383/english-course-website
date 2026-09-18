import { NextResponse, type NextRequest } from "next/server";

import {
  decodeBookingContext,
  extractMeetUrl,
  verifyCalendlySignature,
  type CalendlyWebhookEvent,
} from "@/lib/calendly";
import { sendBookingConfirmation } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * Webhook Calendly : réplique les réservations dans Supabase.
 *
 * Calendly reste la source de vérité des créneaux ; cette route matérialise
 * l'événement côté plateforme pour alimenter le tableau de bord, les rappels
 * et le rattachement à la séance du parcours.
 *
 * Abonnement à créer une fois (API Calendly v2) sur les événements
 * `invitee.created` et `invitee.canceled`.
 */
export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  const valid = await verifyCalendlySignature(
    rawBody,
    request.headers.get("calendly-webhook-signature"),
  );

  if (!valid) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
  }

  let event: CalendlyWebhookEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps illisible" }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    console.error("[calendly] SUPABASE_SERVICE_ROLE_KEY absente");
    return NextResponse.json({ error: "Non configuré" }, { status: 500 });
  }

  const { payload } = event;

  /* ------------------------------------------------------------------ */
  /* Annulation                                                         */
  /* ------------------------------------------------------------------ */
  if (event.event === "invitee.canceled") {
    const eventUri = payload.scheduled_event?.uri;
    if (!eventUri) {
      return NextResponse.json({ error: "Événement inconnu" }, { status: 400 });
    }

    const { data: booking } = await admin
      .from("bookings")
      .update({
        status: "canceled",
        canceled_reason: payload.cancellation?.reason ?? null,
      })
      .eq("calendly_event_uri", eventUri)
      .select("path_session_id")
      .maybeSingle();

    // La séance redevient réservable
    if (booking?.path_session_id) {
      await admin
        .from("path_sessions")
        .update({ status: "open" })
        .eq("id", booking.path_session_id)
        .eq("status", "booked");
    }

    return NextResponse.json({ ok: true });
  }

  /* ------------------------------------------------------------------ */
  /* Création                                                           */
  /* ------------------------------------------------------------------ */
  if (event.event !== "invitee.created") {
    return NextResponse.json({ ignored: event.event });
  }

  const scheduled = payload.scheduled_event;
  if (!scheduled?.uri || !scheduled.start_time || !scheduled.end_time) {
    return NextResponse.json({ error: "Créneau incomplet" }, { status: 400 });
  }

  // `utm_content` porte « <studentId>:<pathSessionId> », posé par le widget.
  let { studentId, pathSessionId } = decodeBookingContext(
    payload.tracking?.utm_content,
  );

  // Repli : rattachement par email de l'invité
  if (!studentId && payload.email) {
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", payload.email.toLowerCase())
      .maybeSingle();
    studentId = profile?.id ?? null;
  }

  if (!studentId) {
    console.warn("[calendly] invité non rattaché", payload.email);
    return NextResponse.json({ error: "Étudiant introuvable" }, { status: 202 });
  }

  const { data: student } = await admin
    .from("profiles")
    .select("id, email, full_name, booking_credits")
    .eq("id", studentId)
    .maybeSingle();

  if (!student) {
    return NextResponse.json({ error: "Étudiant introuvable" }, { status: 202 });
  }

  const { data: studentProfile } = await admin
    .from("student_profiles")
    .select("teacher_id")
    .eq("id", studentId)
    .maybeSingle();

  if (!studentProfile?.teacher_id) {
    console.warn("[calendly] étudiant sans enseignant affecté", studentId);
    return NextResponse.json({ error: "Enseignant non affecté" }, { status: 202 });
  }

  // Sans séance explicite, on prend la prochaine séance ouverte du parcours.
  if (!pathSessionId) {
    const { data: path } = await admin
      .from("learning_paths")
      .select("id")
      .eq("student_id", studentId)
      .eq("is_active", true)
      .maybeSingle();

    if (path) {
      const { data: nextSession } = await admin
        .from("path_sessions")
        .select("id")
        .eq("path_id", path.id)
        .eq("status", "open")
        .order("position")
        .limit(1)
        .maybeSingle();

      pathSessionId = nextSession?.id ?? null;
    }
  }

  const meetUrl = extractMeetUrl(payload);

  // `calendly_event_uri` est unique : l'upsert rend le webhook idempotent
  // face aux relivraisons de Calendly.
  const { error } = await admin.from("bookings").upsert(
    {
      student_id: studentId,
      teacher_id: studentProfile.teacher_id,
      path_session_id: pathSessionId,
      starts_at: scheduled.start_time,
      ends_at: scheduled.end_time,
      status: "scheduled",
      meet_url: meetUrl,
      calendly_event_uri: scheduled.uri,
      calendly_invitee_uri: payload.uri ?? null,
      calendly_reschedule_url: payload.reschedule_url ?? null,
      calendly_cancel_url: payload.cancel_url ?? null,
      student_note:
        payload.questions_and_answers
          ?.map((qa) => `${qa.question} : ${qa.answer}`)
          .join("\n") || null,
    },
    { onConflict: "calendly_event_uri" },
  );

  if (error) {
    console.error("[calendly] écriture impossible", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (pathSessionId) {
    await admin
      .from("path_sessions")
      .update({ status: "booked" })
      .eq("id", pathSessionId)
      .neq("status", "done");
  }

  if (student.booking_credits > 0) {
    await admin
      .from("profiles")
      .update({ booking_credits: student.booking_credits - 1 })
      .eq("id", studentId);
  }

  await sendBookingConfirmation({
    to: student.email,
    studentName: student.full_name ?? "",
    when: formatDateTime(scheduled.start_time),
    meetUrl,
  });

  return NextResponse.json({ ok: true });
}
