"use client";

import { useActionState } from "react";

import { createUser } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select } from "@/components/ui";

const EMPTY: ActionState = {};

export function CreateUserForm() {
  const [state, action, pending] = useActionState(createUser, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Prénom et nom">
        <Input name="fullName" required placeholder="Lea M." />
      </Field>

      <Field label="Email">
        <Input name="email" type="email" required placeholder="lea@exemple.fr" />
      </Field>

      <Field label="Rôle">
        <Select name="role" defaultValue="teacher">
          <option value="teacher">Enseignant</option>
          <option value="student">Étudiant</option>
          <option value="super_admin">Super administrateur</option>
        </Select>
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Envoyer l'invitation"}
      </Button>
    </form>
  );
}
