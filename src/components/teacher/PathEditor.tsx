import { movePathSession } from "@/app/actions/teacher";
import { Badge } from "@/components/ui";
import type { PathSession } from "@/lib/database.types";
import { MODULE_LABELS, cn } from "@/lib/utils";

const STATUS_LABEL: Record<PathSession["status"], string> = {
  done: "Faite",
  booked: "Réservée",
  open: "Ouverte",
  locked: "Verrouillée",
};

/**
 * Réordonnancement à la volée des séances du parcours (CDC 3.2).
 * Chaque bouton est un formulaire : pas de JavaScript requis côté client.
 */
export function PathEditor({
  sessions,
  studentId,
}: {
  sessions: PathSession[];
  studentId: string;
}) {
  return (
    <ol className="flex flex-col gap-1.5">
      {sessions.map((session, index) => (
        <li
          key={session.id}
          className="flex items-center gap-3 rounded-[var(--radius-field)] border border-line p-2.5"
        >
          <span
            className={cn(
              "flex size-7 flex-none items-center justify-center rounded-full font-display text-xs font-extrabold",
              session.status === "done"
                ? "bg-brand-800 text-white"
                : "bg-brand-200 text-brand-800",
            )}
          >
            {session.position}
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold text-ink">
              {session.title}
            </span>
            <span className="block text-[11px] text-muted">
              {MODULE_LABELS[session.module]}
            </span>
          </span>

          <Badge tone={session.status === "done" ? "success" : "neutral"}>
            {STATUS_LABEL[session.status]}
          </Badge>

          <span className="flex flex-none gap-1">
            <MoveButton
              sessionId={session.id}
              studentId={studentId}
              direction="up"
              disabled={index === 0}
            />
            <MoveButton
              sessionId={session.id}
              studentId={studentId}
              direction="down"
              disabled={index === sessions.length - 1}
            />
          </span>
        </li>
      ))}
    </ol>
  );
}

function MoveButton({
  sessionId,
  studentId,
  direction,
  disabled,
}: {
  sessionId: string;
  studentId: string;
  direction: "up" | "down";
  disabled: boolean;
}) {
  return (
    <form action={movePathSession}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="studentId" value={studentId} />
      <input type="hidden" name="direction" value={direction} />
      <button
        type="submit"
        disabled={disabled}
        aria-label={
          direction === "up"
            ? "Remonter cette séance"
            : "Descendre cette séance"
        }
        className="flex size-7 items-center justify-center rounded-md border border-line text-xs text-brand-600 disabled:opacity-30"
      >
        {direction === "up" ? "↑" : "↓"}
      </button>
    </form>
  );
}
