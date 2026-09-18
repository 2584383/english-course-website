"use client";

import { useActionState } from "react";

import { addTemplateSession } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { MODULE_LABELS } from "@/lib/utils";

const EMPTY: ActionState = {};

export function TemplateSessionForm({ templateId }: { templateId: string }) {
  const [state, action, pending] = useActionState(addTemplateSession, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="templateId" value={templateId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Titre">
        <Input name="title" required placeholder="Se présenter en 90 secondes" />
      </Field>

      <Field label="Module">
        <Select name="module" defaultValue="simulation">
          {Object.entries(MODULE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Objectif de la séance">
        <Textarea
          name="goal"
          rows={2}
          placeholder="Raconter un projet en 90 secondes, sans notes."
        />
      </Field>

      <Field
        label="Ordre du jour"
        hint="Une ligne par temps fort, au format « 15 min | Intitulé »."
      >
        <Textarea
          name="agenda"
          rows={5}
          placeholder={"5 min | Retour sur les devoirs\n30 min | 3 récits chronométrés\n10 min | Bilan & devoirs"}
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Ajout…" : "Ajouter la séance"}
      </Button>
    </form>
  );
}
