"use client";

import { useActionState } from "react";

import { updateTemplateSession } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { ModuleKind } from "@/lib/database.types";
import { MODULE_LABELS } from "@/lib/utils";

const EMPTY: ActionState = {};

/** Édition complète d'une séance du gabarit, repliée par défaut. */
export function TemplateSessionEditor({
  sessionId,
  templateId,
  title,
  module,
  goal,
  agendaText,
  homeworkText,
}: {
  sessionId: string;
  templateId: string;
  title: string;
  module: ModuleKind;
  goal: string | null;
  agendaText: string;
  homeworkText: string;
}) {
  const [state, action, pending] = useActionState(updateTemplateSession, EMPTY);

  return (
    <details className="mt-2">
      <summary className="cursor-pointer list-none text-xs font-bold text-brand-800 [&::-webkit-details-marker]:hidden">
        Modifier la séance
      </summary>
      <form action={action} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="sessionId" value={sessionId} />
        <input type="hidden" name="templateId" value={templateId} />

        {state.error ? <Alert tone="error">{state.error}</Alert> : null}
        {state.success ? <Alert tone="success">{state.success}</Alert> : null}

        <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
          <Field label="Titre">
            <Input name="title" required defaultValue={title} />
          </Field>
          <Field label="Module">
            <Select name="module" defaultValue={module}>
              {Object.entries(MODULE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Ce que l'apprenant saura faire">
          <Textarea name="goal" rows={2} defaultValue={goal ?? ""} />
        </Field>

        <Field label="Ordre du jour" hint="Une ligne par temps fort : « 15 min | Intitulé ».">
          <Textarea name="agenda" rows={5} defaultValue={agendaText} />
        </Field>

        <Field
          label="Devoirs à préparer avant cette séance"
          hint="Une ligne par devoir : « Intitulé | consigne ». Répercutés sur les parcours déjà attribués qui ne les ont pas encore reçus."
        >
          <Textarea name="homework" rows={3} defaultValue={homeworkText} />
        </Field>

        <Button type="submit" disabled={pending} className="self-start py-2.5">
          {pending ? "Enregistrement…" : "Enregistrer la séance"}
        </Button>
      </form>
    </details>
  );
}
