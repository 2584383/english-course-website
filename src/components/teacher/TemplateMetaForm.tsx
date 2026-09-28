"use client";

import { useActionState } from "react";

import { updateTemplate } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { PathTemplate } from "@/lib/database.types";
import { SCENARIO_LABELS } from "@/lib/utils";

const EMPTY: ActionState = {};

/** Nom, scénario et description du gabarit. */
export function TemplateMetaForm({ template }: { template: PathTemplate }) {
  const [state, action, pending] = useActionState(updateTemplate, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="templateId" value={template.id} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Nom">
        <Input name="name" required defaultValue={template.name} />
      </Field>
      <Field label="Scénario">
        <Select name="scenario" defaultValue={template.scenario ?? ""}>
          <option value="">—</option>
          {Object.entries(SCENARIO_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Description">
        <Textarea name="description" rows={3} defaultValue={template.description ?? ""} />
      </Field>
      <Button type="submit" tone="ghost" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
