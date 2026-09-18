import { serverEnv } from "@/lib/env";

/* -------------------------------------------------------------------------- */
/* Types du webhook Calendly (v2)                                             */
/* -------------------------------------------------------------------------- */

export type CalendlyQuestionAnswer = { question: string; answer: string };

export type CalendlyPayload = {
  uri?: string;
  email?: string;
  name?: string;
  cancel_url?: string;
  reschedule_url?: string;
  questions_and_answers?: CalendlyQuestionAnswer[];
  tracking?: Record<string, string | null>;
  cancellation?: { reason?: string | null };
  scheduled_event?: {
    uri?: string;
    start_time?: string;
    end_time?: string;
    location?: { type?: string; join_url?: string | null; location?: string | null };
  };
};

export type CalendlyWebhookEvent = {
  event: "invitee.created" | "invitee.canceled" | string;
  payload: CalendlyPayload;
};

/* -------------------------------------------------------------------------- */
/* Vérification de signature                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Valide l'en-tête `Calendly-Webhook-Signature` (`t=<ts>,v1=<hmac>`).
 * Sans clé configurée, la vérification est désactivée (utile en local).
 */
export async function verifyCalendlySignature(
  rawBody: string,
  header: string | null,
): Promise<boolean> {
  const secret = serverEnv.calendlyWebhookSecret;
  if (!secret) return true;
  if (!header) return false;

  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");
      return [key, rest.join("=")];
    }),
  );

  const timestamp = parts.t;
  const signature = parts.v1;
  if (!timestamp || !signature) return false;

  // Rejette les requêtes rejouées de plus de 5 minutes
  const ageSeconds = Math.abs(Date.now() / 1000 - Number(timestamp));
  if (!Number.isFinite(ageSeconds) || ageSeconds > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${rawBody}`),
  );

  const expected = Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(expected, signature);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

/* -------------------------------------------------------------------------- */
/* Extraction du lien de visioconférence                                      */
/* -------------------------------------------------------------------------- */

/** Récupère le lien Google Meet généré par Calendly (CDC 4.2). */
export function extractMeetUrl(payload: CalendlyPayload): string | null {
  const location = payload.scheduled_event?.location;
  if (!location) return null;

  const candidate = location.join_url ?? location.location ?? null;
  if (!candidate) return null;

  return /^https?:\/\//.test(candidate) ? candidate : null;
}

/**
 * Identifiants passés au widget via `utm_content`.
 * Ils permettent de rattacher l'événement Calendly à la bonne séance du parcours.
 */
export function encodeBookingContext(studentId: string, pathSessionId?: string) {
  return pathSessionId ? `${studentId}:${pathSessionId}` : studentId;
}

export function decodeBookingContext(value: string | null | undefined) {
  if (!value) return { studentId: null, pathSessionId: null };
  const [studentId, pathSessionId] = value.split(":");
  return { studentId: studentId || null, pathSessionId: pathSessionId || null };
}
