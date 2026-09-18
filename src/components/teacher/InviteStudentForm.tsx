"use client";

import { useActionState } from "react";

import { inviteStudent } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

const EMPTY: ActionState = {};

export function InviteStudentForm() {
  const [state, action, pending] = useActionState(inviteStudent, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Prénom et nom">
        <Input name="fullName" required placeholder="Amina B." />
      </Field>

      <Field label="Email">
        <Input
          name="email"
          type="email"
          required
          placeholder="amina@exemple.fr"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </Button>
    </form>
  );
}
