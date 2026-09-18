"use client";

import { useActionState, useState } from "react";

import { completeOnboarding } from "@/app/actions/student";
import { AVAILABILITY_OPTIONS } from "@/lib/constants";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const EMPTY: ActionState = {};

export function OnboardingForm({
  defaultGoal,
  defaultAvailability,
}: {
  defaultGoal: string;
  defaultAvailability: string[];
}) {
  const [state, action, pending] = useActionState(completeOnboarding, EMPTY);
  const [picked, setPicked] = useState<string[]>(defaultAvailability);

  const toggle = (value: string) =>
    setPicked((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );

  return (
    <form action={action} className="flex flex-col gap-5">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Mon objectif, dans mes mots">
        <Textarea
          name="goal"
          defaultValue={defaultGoal}
          required
          minLength={10}
          placeholder="Décrocher un poste de PM dans une boîte anglophone d'ici janvier."
        />
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-bold text-brand-600">
          Mes disponibilités habituelles
        </span>
        <div className="flex flex-wrap gap-2">
          {AVAILABILITY_OPTIONS.map((option) => {
            const on = picked.includes(option);
            return (
              <button
                key={option}
                type="button"
                aria-pressed={on}
                onClick={() => toggle(option)}
                className={cn(
                  "rounded-full border px-3.5 py-2 text-[12.5px] font-bold transition",
                  on
                    ? "border-brand-800 bg-brand-800 text-white"
                    : "border-line bg-white text-brand-600",
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
        {picked.map((value) => (
          <input key={value} type="hidden" name="availability" value={value} />
        ))}
      </div>

      <Button type="submit" tone="accent" disabled={pending}>
        {pending ? "Enregistrement…" : "Accéder à mon parcours"}
      </Button>
    </form>
  );
}
