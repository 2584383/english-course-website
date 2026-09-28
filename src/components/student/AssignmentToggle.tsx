"use client";

import { useOptimistic, useTransition } from "react";

import { toggleAssignment } from "@/app/actions/student";
import { actionClass } from "@/components/student/kit";
import { cn } from "@/lib/utils";

/** Grand bouton du détail d'un devoir : « Marquer comme fait » / « Fait — annuler ». */
export function AssignmentToggle({ id, done }: { id: string; done: boolean }) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(done);

  const toggle = () => {
    const next = !optimistic;
    startTransition(async () => {
      setOptimistic(next);
      await toggleAssignment(id, next);
    });
  };

  return (
    <button
      type="button"
      aria-pressed={optimistic}
      onClick={toggle}
      className={cn(
        actionClass(
          optimistic ? "outline" : "accent",
          "w-full rounded-[14px] py-[15px] text-[15px] lg:w-auto lg:rounded-xl lg:px-[26px] lg:py-3.5",
        ),
        !optimistic && "border border-brand-800",
      )}
    >
      {optimistic ? "Fait — annuler" : "Marquer comme fait"}
    </button>
  );
}
