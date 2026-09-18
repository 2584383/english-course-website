"use client";

import { useActionState } from "react";

import { saveReport } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Card, Field, Textarea } from "@/components/ui";
import type { SessionReport } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const EMPTY: ActionState = {};

/** Checklist des compétences abordées pendant la leçon (CDC 3.2). */
const SKILLS = [
  "Fluidité / débit",
  "Structures grammaticales clés",
  "Prononciation",
  "Vocabulaire professionnel",
  "Compréhension orale",
  "Gestion du stress / posture",
];

export function ReportEditor({
  bookingId,
  studentId,
  report,
  defaultTheme,
}: {
  bookingId: string;
  studentId: string;
  report: SessionReport | null;
  defaultTheme: string;
}) {
  const [state, action, pending] = useActionState(saveReport, EMPTY);
  const checked = new Set(report?.skills ?? []);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="bookingId" value={bookingId} />
      <input type="hidden" name="studentId" value={studentId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Card className="flex flex-col gap-3">
        <Field label="Thème abordé">
          <Textarea
            name="theme"
            rows={2}
            defaultValue={report?.theme ?? defaultTheme}
            placeholder="Répondre à une question ouverte en entretien avec la méthode STAR."
          />
        </Field>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-xs font-bold text-brand-600">
            Compétences travaillées
          </legend>
          <div className="flex flex-wrap gap-2">
            {SKILLS.map((skill) => (
              <label
                key={skill}
                className={cn(
                  "cursor-pointer rounded-full border px-3.5 py-2 text-xs font-bold transition",
                  "border-line bg-white text-brand-600",
                  "has-[:checked]:border-brand-800 has-[:checked]:bg-brand-800 has-[:checked]:text-white",
                )}
              >
                <input
                  type="checkbox"
                  name="skills"
                  value={skill}
                  defaultChecked={checked.has(skill)}
                  className="sr-only"
                />
                {skill}
              </label>
            ))}
          </div>
        </fieldset>
      </Card>

      <Card className="flex flex-col gap-3">
        <Field
          label="Points forts"
          hint="Ce que l'apprenant lira en premier — sois concret."
        >
          <Textarea
            name="strengths"
            rows={4}
            defaultValue={report?.strengths ?? ""}
            placeholder="Tu enchaînes sans chercher tes mots sur les sujets préparés…"
          />
        </Field>

        <Field label="Axes d'amélioration">
          <Textarea
            name="improvements"
            rows={4}
            defaultValue={report?.improvements ?? ""}
            placeholder="Les temps du passé : present perfect et simple past se mélangent…"
          />
        </Field>

        <Field
          label="Notes privées"
          hint="Pour toi uniquement : jamais exposées à l'apprenant."
        >
          <Textarea
            name="privateNotes"
            rows={3}
            defaultValue={report?.private_notes ?? ""}
          />
        </Field>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="intent"
          value="draft"
          tone="ghost"
          disabled={pending}
        >
          Enregistrer le brouillon
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          tone="accent"
          disabled={pending}
          className="flex-1"
        >
          {pending ? "Publication…" : "Publier sur l'espace de l'apprenant"}
        </Button>
      </div>
    </form>
  );
}
