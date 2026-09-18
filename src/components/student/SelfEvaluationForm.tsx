"use client";

import { useActionState, useState } from "react";

import { useRouter } from "next/navigation";

import { submitSelfEvaluation } from "@/app/actions/student";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Card, Field, ProgressBar, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

const EMPTY: ActionState = {};

type Question = { question: string; options: string[] };

export function SelfEvaluationForm({ questions }: { questions: Question[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState(submitSelfEvaluation, EMPTY);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const current = questions[step];
  const complete = step >= questions.length;

  const pick = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [current.question]: answer }));
    setStep((prev) => prev + 1);
  };

  if (state.success) {
    return (
      <div className="flex flex-col gap-3">
        <Alert tone="success">{state.success}</Alert>
        <Button tone="ghost" onClick={() => router.push("/app")}>
          Retour à l&apos;accueil
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <ProgressBar
        value={(Math.min(step, questions.length) / questions.length) * 100}
        sublabel={
          complete
            ? "Dernière étape"
            : `Question ${step + 1} sur ${questions.length}`
        }
      />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      {!complete ? (
        <Card className="flex flex-col gap-3">
          <p className="font-display text-lg font-bold leading-snug text-ink">
            {current.question}
          </p>
          <div className="flex flex-col gap-2">
            {current.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => pick(option)}
                className={cn(
                  "rounded-[var(--radius-field)] border border-line bg-white px-4 py-3 text-left text-sm font-semibold text-brand-600 transition",
                  "hover:border-brand-800 hover:bg-brand-100",
                )}
              >
                {option}
              </button>
            ))}
          </div>
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => prev - 1)}
              className="text-center text-[13px] font-bold text-brand-800"
            >
              Revenir à la question précédente
            </button>
          ) : null}
        </Card>
      ) : (
        <form action={action} className="flex flex-col gap-4">
          <input
            type="hidden"
            name="answers"
            value={JSON.stringify(
              questions.map((q) => ({
                question: q.question,
                answer: answers[q.question] ?? "",
              })),
            )}
          />

          <Card className="flex flex-col gap-3">
            <Field
              label="Quelque chose à ajouter ?"
              hint="Optionnel — mais souvent le plus utile."
            >
              <Textarea
                name="comment"
                placeholder="Ce que j'aimerais travailler davantage…"
              />
            </Field>
          </Card>

          <Button type="submit" tone="accent" disabled={pending}>
            {pending ? "Envoi…" : "Envoyer à mon enseignant"}
          </Button>
        </form>
      )}
    </div>
  );
}
