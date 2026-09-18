import Link from "next/link";

import { AssignmentList } from "@/components/student/AssignmentList";
import { ResourceList } from "@/components/student/ResourceList";
import { EmptyState, ProgressBar } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getSharedResources, getStudentDashboard } from "@/lib/queries/student";
import { cn } from "@/lib/utils";

export const metadata = { title: "Devoirs" };

export default async function HomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ vue?: string }>;
}) {
  const { vue } = await searchParams;
  const showResources = vue === "ressources";

  const { profile } = await requireStudent();
  const [{ assignments }, resources] = await Promise.all([
    getStudentDashboard(profile.id),
    getSharedResources(profile.id),
  ]);

  const done = assignments.filter((a) => a.status === "done").length;

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          Mon travail
        </h1>
        <p className="text-[13px] text-muted">
          {showResources
            ? `${resources.length} ressources partagées`
            : `${done} devoirs faits sur ${assignments.length}`}
        </p>
      </header>

      <div
        role="tablist"
        aria-label="Vue"
        className="flex gap-1 rounded-full bg-brand-200 p-1"
      >
        {[
          { label: "Devoirs", href: "/app/devoirs", active: !showResources },
          {
            label: "Ressources",
            href: "/app/devoirs?vue=ressources",
            active: showResources,
          },
        ].map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            role="tab"
            aria-selected={tab.active}
            className={cn(
              "flex-1 rounded-full py-2 text-center text-[13px] font-bold no-underline transition",
              tab.active ? "bg-white text-brand-800" : "text-muted",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {showResources ? (
        <ResourceList resources={resources} />
      ) : assignments.length === 0 ? (
        <EmptyState
          title="Rien à faire pour l'instant"
          description="Ton enseignant t'assignera des exercices après ta prochaine séance."
        />
      ) : (
        <>
          <ProgressBar
            value={assignments.length ? (done / assignments.length) * 100 : 0}
            sublabel={`${done} / ${assignments.length} terminés`}
          />
          <AssignmentList assignments={assignments} />
        </>
      )}
    </div>
  );
}
