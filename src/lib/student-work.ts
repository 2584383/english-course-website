import type { Assignment, Booking, PathSession } from "@/lib/database.types";
import { formatShortDate } from "@/lib/utils";

export type WorkItem = {
  id: string;
  title: string;
  meta: string;
  done: boolean;
};

export type WorkGroups = {
  /** Devoirs à faire d'ici la prochaine séance (cochés récemment inclus). */
  now: WorkItem[];
  later: WorkItem[];
  done: WorkItem[];
  /** Vrai si une séance est réservée : « avant mardi » a un sens. */
  hasNextSession: boolean;
};

export function workMeta(assignment: Assignment) {
  const given = `donné le ${formatShortDate(assignment.created_at)}`;
  return assignment.due_label ? `${assignment.due_label} · ${given}` : given;
}

function toItem(assignment: Assignment): WorkItem {
  return {
    id: assignment.id,
    title: assignment.title,
    meta: workMeta(assignment),
    done: assignment.status === "done",
  };
}

/**
 * Groupement par échéance, pas par séance (wireframe 3b) : la seule question
 * de l'étudiant est « qu'est-ce que je dois faire avant ma prochaine séance ? ».
 *
 * - rattaché à une séance postérieure à la prochaine → plus tard ;
 * - échéance datée après la prochaine séance → plus tard ;
 * - sinon → avant la prochaine séance.
 * Un devoir coché depuis la dernière séance reste visible (barré) dans son
 * groupe, pour que la progression « 1 / 2 » ait un sens ; les plus anciens
 * passent dans « Terminés ».
 */
export function groupWork({
  assignments,
  sessions,
  nextBooking,
  lastBooking,
}: {
  assignments: Assignment[];
  sessions: PathSession[];
  nextBooking: Booking | null;
  lastBooking: Booking | null;
}): WorkGroups {
  const positions = new Map(sessions.map((s) => [s.id, s.position]));
  const nextPosition = nextBooking?.path_session_id
    ? (positions.get(nextBooking.path_session_id) ?? null)
    : null;
  const nextStart = nextBooking ? new Date(nextBooking.starts_at) : null;
  const cutoff = lastBooking ? new Date(lastBooking.starts_at) : null;

  const isLater = (a: Assignment) => {
    if (!nextBooking) return false;
    const position = a.path_session_id ? positions.get(a.path_session_id) : null;
    if (position != null && nextPosition != null) return position > nextPosition;
    if (a.due_at && nextStart) return new Date(a.due_at) > nextStart;
    return false;
  };

  const isRecent = (a: Assignment) =>
    !cutoff || (a.completed_at != null && new Date(a.completed_at) > cutoff);

  const groups: WorkGroups = {
    now: [],
    later: [],
    done: [],
    hasNextSession: Boolean(nextBooking),
  };

  for (const assignment of assignments) {
    const item = toItem(assignment);
    if (item.done && !isRecent(assignment)) groups.done.push(item);
    else if (isLater(assignment)) {
      if (item.done) groups.done.push(item);
      else groups.later.push(item);
    } else groups.now.push(item);
  }

  return groups;
}
