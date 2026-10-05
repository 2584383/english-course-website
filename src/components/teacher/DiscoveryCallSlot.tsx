import Link from "next/link";

import type { DiscoveryCall } from "@/lib/database.types";
import { formatTime } from "@/lib/utils";

/**
 * Appel de découverte dans le planning : teinte « accent » pour le distinguer
 * des séances, et accès direct à la visio.
 */
export function DiscoveryCallSlot({ call }: { call: DiscoveryCall }) {
  return (
    <div className="flex flex-col gap-1 rounded-[var(--radius-field)] border border-accent/50 bg-accent-soft p-2.5">
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-accent-ink">
          {formatTime(call.scheduled_at!)}
          {call.duration_minutes ? ` · ${call.duration_minutes} min` : ""}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wide text-accent-ink">
          Découverte
        </span>
      </span>
      <Link
        href="/prof/appels"
        className="block text-[13px] font-semibold text-ink no-underline"
      >
        {call.full_name}
      </Link>
      <MeetLink url={call.meet_url} />
    </div>
  );
}

/** Bouton « Rejoindre » ; rien si Calendly n'a pas généré de lien. */
export function MeetLink({
  url,
  className = "self-start rounded-[var(--radius-field)] bg-brand-800 px-3 py-1.5 text-xs font-bold text-white no-underline hover:bg-brand-900",
}: {
  url: string | null;
  className?: string;
}) {
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="noreferrer" className={className}>
      Rejoindre
    </a>
  );
}
