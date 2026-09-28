"use client";

import { useActionState, useState } from "react";

import { submitSelfEvaluation } from "@/app/actions/student";
import type { ActionState } from "@/app/actions/auth";
import {
  ActionButton,
  ActionLink,
  DoneBadge,
  Kicker,
} from "@/components/student/kit";
import { Alert } from "@/components/ui";

const EMPTY: ActionState = {};

type Question = { question: string; options: string[] };

/** Auto-évaluation guidée, une question par écran (prototype hi-fi). */
export function SelfEvaluationForm({
  questions,
  teacher,
}: {
  questions: Question[];
  teacher: string;
}) {
  const [state, action, pending] = useActionState(submitSelfEvaluation, EMPTY);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const total = questions.length;
  const current = questions[step];
  const onComment = step >= total;

  const pick = (answer: string) => {
    setAnswers((prev) => ({ ...prev, [current.question]: answer }));
    setStep((prev) => prev + 1);
  };

  const bar = (
    <div className="h-1.5 overflow-hidden rounded-[5px] bg-track">
      <div
        className="h-full rounded-[5px] bg-brand-800 transition-[width] duration-300"
        style={{
          width: `${state.success ? 100 : Math.round((Math.min(step, total) / (total + 1)) * 100)}%`,
        }}
      />
    </div>
  );

  if (state.success) {
    return (
      <>
        {bar}
        <div className="flex flex-col items-center gap-3.5 pt-10 text-center animate-pop lg:pt-[50px]">
          <DoneBadge />
          <p className="font-display text-[23px] font-extrabold leading-[1.2] text-ink lg:text-[25px]">
            Merci, c&apos;est envoyé
          </p>
          <p className="max-w-[380px] text-sm leading-normal text-body lg:text-[15px] lg:leading-[1.55]">
            {teacher} lira tes réponses avant la prochaine séance pour ajuster
            la suite du parcours.
          </p>
          <ActionLink href="/app" className="mt-1.5 px-[26px]">
            Retour à l&apos;accueil
          </ActionLink>
        </div>
      </>
    );
  }

  return (
    <>
      {bar}

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      {!onComment ? (
        <div key={step} className="flex flex-col gap-4 animate-pop lg:gap-[18px]">
          <Kicker>
            Question {step + 1} sur {total}
          </Kicker>
          <p className="font-display text-[23px] font-extrabold leading-[1.25] text-ink lg:text-[26px] lg:leading-[1.3]">
            {current.question}
          </p>
          <div className="flex flex-col gap-[9px] lg:gap-2.5">
            {current.options.map((option) => {
              const chosen = answers[current.question] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => pick(option)}
                  className={
                    chosen
                      ? "rounded-[14px] border border-brand-800 bg-soft px-4 py-3.5 text-left text-[14.5px] font-semibold leading-[1.35] text-brand-800 transition lg:px-[18px] lg:py-4 lg:text-[15px]"
                      : "rounded-[14px] border border-line bg-white px-4 py-3.5 text-left text-[14.5px] font-semibold leading-[1.35] text-brand-600 transition hover:border-soft-border hover:bg-brand-50 lg:px-[18px] lg:py-4 lg:text-[15px]"
                  }
                >
                  {option}
                </button>
              );
            })}
          </div>
          <div className="flex items-center justify-between gap-3">
            <p className="text-[12.5px] leading-[1.45] text-muted-soft lg:text-[13px]">
              Tes réponses partent à {teacher} pour ajuster la suite du parcours.
            </p>
            {step > 0 ? (
              <button
                type="button"
                onClick={() => setStep((prev) => prev - 1)}
                className="flex-none text-[13px] font-bold text-brand-800"
              >
                ← Précédente
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <form action={action} className="flex flex-col gap-4 animate-pop lg:gap-[18px]">
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
          <Kicker>Dernière étape · facultatif</Kicker>
          <p className="font-display text-[23px] font-extrabold leading-[1.25] text-ink lg:text-[26px] lg:leading-[1.3]">
            Un exemple concret, ou quelque chose à ajouter ?
          </p>
          <textarea
            name="comment"
            placeholder="ex. j'ai pris la parole en réunion mardi, sans notes"
            className="min-h-24 w-full resize-none rounded-xl border border-line bg-white p-3 text-sm leading-[1.45] text-ink outline-none placeholder:text-muted-soft focus:border-soft-border lg:min-h-[110px] lg:p-3.5 lg:text-[14.5px]"
          />
          <div className="flex gap-2.5">
            <ActionButton
              type="button"
              tone="quiet"
              onClick={() => setStep(total - 1)}
            >
              Retour
            </ActionButton>
            <ActionButton type="submit" disabled={pending} className="flex-1 disabled:opacity-60">
              {pending ? "Envoi…" : `Envoyer à ${teacher}`}
            </ActionButton>
          </div>
        </form>
      )}
    </>
  );
}
