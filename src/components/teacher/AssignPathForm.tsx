"use client";

import { useActionState } from "react";

import Link from "next/link";

import { assignTemplateToStudent } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select } from "@/components/ui";
import type { PathTemplate } from "@/lib/database.types";

const EMPTY: ActionState = {};

export function AssignPathForm({
  studentId,
  templates,
}: {
  studentId: string;
  templates: PathTemplate[];
}) {
  const [state, action, pending] = useActionState(
    assignTemplateToStudent,
    EMPTY,
  );

  if (templates.length === 0) {
    return (
      <p className="text-sm text-muted">
        Aucun gabarit disponible.{" "}
        <Link href="/prof/parcours" className="font-bold text-brand-800">
          Crée ton premier parcours type
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Gabarit">
        <Select name="templateId" required>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name} ({template.session_count} séances)
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Nom du parcours"
        hint="Laisse vide pour reprendre le nom du gabarit."
      >
        <Input name="name" placeholder="Job Interview — Amina" />
      </Field>

      <Button type="submit" tone="accent" disabled={pending}>
        {pending ? "Assignation…" : "Assigner le parcours"}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-soft">
        Le parcours actif en cours sera archivé et remplacé.
      </p>
    </form>
  );
}
