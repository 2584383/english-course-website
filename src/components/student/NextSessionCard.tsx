import { Kicker, Panel, actionClass } from "@/components/student/kit";
import type { Booking, PathSession } from "@/lib/database.types";
import { cn, formatSlot, isMeetOpen, relativeLabel } from "@/lib/utils";

/**
 * Prochaine séance + lien Google Meet (prototype hi-fi, accueil).
 * Le lien n'est cliquable qu'à partir de 15 min avant le créneau.
 */
export function NextSessionCard({
  booking,
  teacherName,
}: {
  booking: Booking & { session: PathSession | null };
  teacherName: string | null;
}) {
  const meetOpen = isMeetOpen(booking.starts_at);
  const when = formatSlot(booking.starts_at, booking.ends_at);
  const title = booking.session?.title ?? "Séance d'anglais";

  const meet =
    booking.meet_url && meetOpen ? (
      <a
        href={booking.meet_url}
        target="_blank"
        rel="noreferrer"
        className={actionClass("accent", "lg:px-5 lg:py-[13px] lg:text-sm")}
      >
        Rejoindre sur Google Meet
      </a>
    ) : (
      <span
        aria-disabled
        className={actionClass(
          "accent",
          "cursor-default opacity-70 hover:brightness-100 lg:px-5 lg:py-[13px] lg:text-sm",
        )}
      >
        {meetOpen
          ? "Lien Meet dans ton email"
          : "Le lien s'ouvre 15 min avant"}
      </span>
    );

  const secondary = "flex-1 rounded-xl py-2.5 lg:rounded-[11px]";

  return (
    <Panel
      tone="soft"
      size="lg"
      className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center lg:gap-[26px] lg:p-[26px]"
    >
      <div className="flex min-w-0 flex-col gap-3 lg:min-w-[240px] lg:flex-1 lg:gap-[7px]">
        <div className="flex items-center justify-between gap-2.5 lg:justify-start">
          <Kicker tone="brand">Prochaine séance</Kicker>
          <span className="text-xs font-semibold text-brand-700">
            <span className="hidden lg:inline">· </span>
            {relativeLabel(booking.starts_at)}
          </span>
        </div>
        <div>
          <p className="font-display text-xl font-bold leading-[1.2] text-ink lg:text-[25px]">
            {title}
          </p>
          <p className="mt-0.5 text-sm leading-[1.45] text-body lg:mt-[7px] lg:text-[15px]">
            {when}
            {teacherName ? ` · avec ${teacherName}` : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:min-w-[220px] lg:flex-none lg:gap-[9px]">
        {meet}
        <div className="flex gap-2">
          {booking.session ? (
            <a
              href={`/app/parcours/${booking.session.position}`}
              className={actionClass("outline", secondary)}
            >
              Ordre du jour
            </a>
          ) : null}
          <a
            href={booking.calendly_reschedule_url ?? "/app/reserver"}
            {...(booking.calendly_reschedule_url
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
            className={cn(actionClass("outline", secondary))}
          >
            Reprogrammer
          </a>
        </div>
      </div>
    </Panel>
  );
}
