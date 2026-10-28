"use client";

import { useActionState, useState } from "react";

import { deleteStudent } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

const EMPTY: ActionState = {};

export function DeleteStudentForm({
  studentId,
  name,
}: {
  studentId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(deleteStudent, EMPTY);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button type="button" tone="danger" onClick={() => setOpen(true)}>
        Supprimer cet étudiant
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="studentId" value={studentId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <p className="text-xs leading-relaxed text-muted">
        Le compte de <strong>{name}</strong> sera supprimé avec son parcours,
        ses séances, ses comptes-rendus et ses devoirs. Cette action est
        irréversible. Pense à annuler ses éventuels rendez-vous à venir dans
        Calendly.
      </p>

      <Field label="Confirmation" hint="Saisis SUPPRIMER en majuscules.">
        <Input name="confirmation" required placeholder="SUPPRIMER" />
      </Field>

      <div className="flex gap-2">
        <Button type="button" tone="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button
          type="submit"
          tone="danger"
          disabled={pending}
          className="flex-1"
        >
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </Button>
      </div>
    </form>
  );
}
