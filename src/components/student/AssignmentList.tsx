"use client";

import { useOptimistic, useTransition } from "react";

import { toggleAssignment } from "@/app/actions/student";
import { Card } from "@/components/ui";
import type { Assignment } from "@/lib/database.types";
import { cn } from "@/lib/utils";

/** To-do list interactive : la case cochée bascule tout de suite (CDC 3.1). */
export function AssignmentList({ assignments }: { assignments: Assignment[] }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    assignments,
    (state, { id, done }: { id: string; done: boolean }) =>
      state.map((item) =>
        item.id === id ? { ...item, status: done ? "done" : "todo" } : item,
      ),
  );

  const toggle = (assignment: Assignment) => {
    const done = assignment.status !== "done";
    startTransition(async () => {
      setOptimistic({ id: assignment.id, done });
      await toggleAssignment(assignment.id, done);
    });
  };

  return (
    <ul className="flex flex-col gap-2">
      {optimistic.map((assignment) => {
        const done = assignment.status === "done";
        return (
          <li key={assignment.id}>
            <Card className="flex items-start gap-3 p-3.5">
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                aria-label={`Marquer « ${assignment.title} » comme ${done ? "à faire" : "fait"}`}
                onClick={() => toggle(assignment)}
                className={cn(
                  "mt-0.5 flex size-6 flex-none items-center justify-center rounded-lg border-2 text-xs font-bold text-white transition",
                  done
                    ? "border-brand-800 bg-brand-800"
                    : "border-brand-300 bg-white",
                )}
              >
                {done ? "✓" : ""}
              </button>

              <div className="flex-1">
                <p
                  className={cn(
                    "text-sm font-semibold text-ink",
                    done && "text-muted line-through",
                  )}
                >
                  {assignment.title}
                </p>
                {assignment.due_label ? (
                  <p className="mt-0.5 text-xs text-muted-soft">
                    {assignment.due_label}
                  </p>
                ) : null}
                {assignment.instructions ? (
                  <p className="mt-2 text-[13px] leading-relaxed text-brand-600">
                    {assignment.instructions}
                  </p>
                ) : null}
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
