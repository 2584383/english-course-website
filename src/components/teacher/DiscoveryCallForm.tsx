"use client";

import { useActionState } from "react";

import { saveDiscoveryCall } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

const EMPTY: ActionState = {};

const STATUS_OPTIONS = [
  ["to_qualify", "À qualifier"],
  ["scheduled", "Appel prévu"],
  ["confirmed", "A confirmé"],
  ["thinking", "Réfléchit"],
  ["converted", "Converti en étudiant"],
  ["lost", "Perdu"],
] as const;

export function DiscoveryCallForm() {
  const [state, action, pending] = useActionState(saveDiscoveryCall, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Nom">
        <Input name="fullName" required placeholder="Léa M." />
      </Field>

      <Field label="Email">
        <Input name="email" type="email" placeholder="lea.m@exemple.fr" />
      </Field>

      <Field label="Téléphone">
        <Input name="phone" placeholder="06 12 34 56 78" />
      </Field>

      <Field label="Date de l'appel">
        <Input name="scheduledAt" type="datetime-local" />
      </Field>

      <Field label="Statut">
        <Select name="status" defaultValue="to_qualify">
          {STATUS_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field
        label="Constats"
        hint="Niveau perçu, objectif, échéance, disponibilités, budget."
      >
        <Textarea
          name="notes"
          rows={6}
          placeholder="Cherche un poste de PM à Londres. Comprend bien, bloque à l'oral dès que c'est spontané…"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement…" : "Enregistrer l'appel"}
      </Button>
    </form>
  );
}
