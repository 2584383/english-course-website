import Link from "next/link";

import { Badge, Card, EmptyState, ProgressBar } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries/student";
import { MODULE_LABELS, cn } from "@/lib/utils";
import type { PathSessionStatus } from "@/lib/database.types";

export const metadata = { title: "Mon parcours" };

const STATUS_BADGE: Record<
  PathSessionStatus,
  { label: string; tone: "neutral" | "brand" | "accent" | "success" }
> = {
  done: { label: "Faite", tone: "success" },
  booked: { label: "Réservée", tone: "accent" },
  open: { label: "À réserver", tone: "brand" },
  locked: { label: "À venir", tone: "neutral" },
};

export default async function PathPage() {
  const { profile } = await requireStudent();
  const { path, sessions, progress } = await getStudentDashboard(profile.id);

  if (!path) {
    return (
      <EmptyState
        title="Pas encore de parcours"
        description="Ton enseignant construit ton parcours après l'appel de découverte. Tu recevras un email dès qu'il est prêt."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          {path.name}
        </h1>
        <p className="text-[13px] text-muted">
          {progress.total} séances · {progress.done} terminées
        </p>
      </header>

      <Card>
        <ProgressBar value={progress.pct} label="de ton parcours" />
      </Card>

      <ol className="flex flex-col gap-2">
        {sessions.map((session) => {
          const badge = STATUS_BADGE[session.status];
          const locked = session.status === "locked";

          const content = (
            <Card
              className={cn(
                "flex items-start gap-3",
                locked && "opacity-60",
                !locked && "transition hover:border-brand-300",
              )}
            >
              <span
                className={cn(
                  "flex size-9 flex-none items-center justify-center rounded-full font-display text-sm font-extrabold",
                  session.status === "done"
                    ? "bg-brand-800 text-white"
                    : "border border-soft-border bg-soft text-brand-800",
                )}
              >
                {session.position}
              </span>

              <span className="flex-1">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-[15px] font-bold text-ink">
                    {session.title}
                  </span>
                  <Badge tone={badge.tone}>{badge.label}</Badge>
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {MODULE_LABELS[session.module]}
                </span>
                {session.goal && !locked ? (
                  <span className="mt-1.5 block text-[13px] leading-relaxed text-brand-600">
                    {session.goal}
                  </span>
                ) : null}
              </span>
            </Card>
          );

          return (
            <li key={session.id}>
              {locked ? (
                content
              ) : (
                <Link
                  href={`/app/parcours/${session.position}`}
                  className="block no-underline"
                >
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
