"use client";

import { useActionState, useState } from "react";

import { assignHomework } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Resource } from "@/lib/database.types";

const EMPTY: ActionState = {};

export function AssignHomeworkForm({
  studentId,
  resources,
}: {
  studentId: string;
  resources: Resource[];
}) {
  const [state, action, pending] = useActionState(assignHomework, EMPTY);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button tone="ghost" onClick={() => setOpen(true)}>
        + Assigner un devoir
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Intitulé">
        <Input name="title" required placeholder="Écouter l'audio « Small talk »" />
      </Field>

      <Field label="Consigne">
        <Textarea
          name="instructions"
          rows={3}
          placeholder="Écoute-le deux fois : la première sans rien noter…"
        />
      </Field>

      <Field label="Échéance" hint="Texte libre : « avant la séance 10 ».">
        <Input name="dueLabel" placeholder="avant mardi" />
      </Field>

      {resources.length > 0 ? (
        <Field label="Ressource liée">
          <Select name="resourceId" defaultValue="">
            <option value="">Aucune</option>
            {resources.map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.title}
              </option>
            ))}
          </Select>
        </Field>
      ) : null}

      <div className="flex gap-2">
        <Button type="button" tone="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" disabled={pending} className="flex-1">
          {pending ? "Envoi…" : "Assigner"}
        </Button>
      </div>
    </form>
  );
}
