"use client";

import { useActionState } from "react";

import { updateStudentSheet } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Select, Textarea } from "@/components/ui";
import type { StudentProfile } from "@/lib/database.types";
import { CEFR_LEVELS, SCENARIO_LABELS } from "@/lib/utils";

const EMPTY: ActionState = {};

/** Saisie manuelle des constats de départ après le cours d'audit (CDC 3.2). */
export function StudentSheetForm({
  studentId,
  studentProfile,
}: {
  studentId: string;
  studentProfile: StudentProfile;
}) {
  const [state, action, pending] = useActionState(updateStudentSheet, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Niveau initial">
          <Select
            name="initialLevel"
            defaultValue={studentProfile.initial_level ?? ""}
          >
            <option value="">—</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Niveau visé">
          <Select
            name="targetLevel"
            defaultValue={studentProfile.target_level ?? ""}
          >
            <option value="">—</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Scénario">
          <Select name="scenario" defaultValue={studentProfile.scenario ?? ""}>
            <option value="">—</option>
            {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Objectif précis">
        <Textarea
          name="goal"
          rows={2}
          defaultValue={studentProfile.goal ?? ""}
          placeholder="Décrocher un poste de PM dans une boîte anglophone d'ici janvier."
        />
      </Field>

      <Field
        label="Notes privées"
        hint="Jamais visibles par l'apprenant."
      >
        <Textarea
          name="teacherNotes"
          rows={4}
          defaultValue={studentProfile.teacher_notes ?? ""}
          placeholder="Comprend bien, bloque à l'oral dès que c'est spontané…"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer la fiche"}
      </Button>
    </form>
  );
}
