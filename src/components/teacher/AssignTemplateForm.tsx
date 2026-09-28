"use client";

import { useActionState } from "react";

import Link from "next/link";

import { assignTemplateToStudent } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Select } from "@/components/ui";

const EMPTY: ActionState = {};

export type AssignableStudent = {
  id: string;
  name: string;
  currentPath: string | null;
};

/** Attribuer ce gabarit à un apprenant, depuis la page du gabarit. */
export function AssignTemplateForm({
  templateId,
  students,
}: {
  templateId: string;
  students: AssignableStudent[];
}) {
  const [state, action, pending] = useActionState(assignTemplateToStudent, EMPTY);

  if (students.length === 0) {
    return (
      <p className="text-sm text-muted">
        Aucun apprenant pour l&apos;instant.{" "}
        <Link href="/prof/etudiants" className="font-bold text-brand-800">
          Invite ton premier apprenant
        </Link>
        .
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="templateId" value={templateId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Apprenant">
        <Select name="studentId" required defaultValue="">
          <option value="" disabled>
            Choisir…
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
              {student.currentPath ? ` · en cours : ${student.currentPath}` : " · sans parcours"}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" tone="accent" disabled={pending}>
        {pending ? "Attribution…" : "Attribuer ce parcours"}
      </Button>
      <p className="text-[11px] leading-relaxed text-muted-soft">
        Un parcours en cours est archivé et remplacé. Les devoirs de la séance 1
        partent tout de suite.
      </p>
    </form>
  );
}
