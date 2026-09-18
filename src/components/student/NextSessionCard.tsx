import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import type { Booking, PathSession } from "@/lib/database.types";
import { formatDateTime, isMeetOpen, relativeLabel } from "@/lib/utils";

/**
 * Prochaine séance + lien Google Meet.
 * Le lien n'est cliquable qu'à partir de 15 min avant le créneau.
 */
export function NextSessionCard({
  booking,
}: {
  booking: Booking & { session: PathSession | null };
}) {
  const meetOpen = isMeetOpen(booking.starts_at);

  return (
    <Card tone="soft" className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>Prochaine séance</Eyebrow>
          <p className="mt-1.5 font-display text-lg font-bold leading-tight text-ink">
            {booking.session?.title ?? "Séance d'anglais"}
          </p>
          <p className="mt-1 text-[13px] capitalize text-brand-600">
            {formatDateTime(booking.starts_at)}
          </p>
        </div>
        <Badge tone="accent">{relativeLabel(booking.starts_at)}</Badge>
      </div>

      {booking.session?.goal ? (
        <p className="text-[13px] leading-relaxed text-brand-600">
          {booking.session.goal}
        </p>
      ) : null}

      {booking.meet_url && meetOpen ? (
        <a
          href={booking.meet_url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-[var(--radius-field)] bg-brand-800 px-5 py-3 text-sm font-bold text-white no-underline"
        >
          Rejoindre sur Google Meet
        </a>
      ) : (
        <p className="rounded-[var(--radius-field)] bg-white/70 px-4 py-3 text-center text-[13px] font-semibold text-brand-600">
          Le lien Google Meet s&apos;ouvre 15 min avant la séance
        </p>
      )}

      <div className="flex gap-2">
        {booking.session ? (
          <ButtonLink
            href={`/app/parcours/${booking.session.position}`}
            tone="ghost"
            className="flex-1"
          >
            Voir l&apos;ordre du jour
          </ButtonLink>
        ) : null}
        {booking.calendly_reschedule_url ? (
          <a
            href={booking.calendly_reschedule_url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex flex-1 items-center justify-center rounded-[var(--radius-field)] border border-line bg-white px-4 py-3 text-sm font-bold text-brand-600 no-underline"
          >
            Reprogrammer
          </a>
        ) : null}
      </div>
    </Card>
  );
}
