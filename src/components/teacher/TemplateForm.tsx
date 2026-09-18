"use client";

import { useActionState } from "react";

import { createTemplate } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { SCENARIO_LABELS } from "@/lib/utils";

const EMPTY: ActionState = {};

export function TemplateForm() {
  const [state, action, pending] = useActionState(createTemplate, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Nom du gabarit">
        <Input name="name" required placeholder="Job Interview — 13 séances" />
      </Field>

      <Field label="Scénario">
        <Select name="scenario" defaultValue="">
          <option value="">—</option>
          {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Description">
        <Textarea
          name="description"
          rows={3}
          placeholder="Pour les apprenants B1+ visant un poste en anglais sous 4 mois."
        />
      </Field>

      <Button type="submit" tone="accent" disabled={pending}>
        {pending ? "Création…" : "Créer le gabarit"}
      </Button>
    </form>
  );
}
