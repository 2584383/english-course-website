"use client";

import { useActionState } from "react";

import { updateTeacherProfile } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

const EMPTY: ActionState = {};

/** Ce que voit le nouvel inscrit au moment de choisir son prof. */
export function TeacherProfileForm({
  bio,
  discoveryUrl,
}: {
  bio: string | null;
  discoveryUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateTeacherProfile, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Présentation (quelques lignes)">
        <Textarea
          name="bio"
          defaultValue={bio ?? ""}
          maxLength={400}
          rows={4}
          placeholder="Professeure d'anglais certifiée, spécialisée dans la préparation aux entretiens d'embauche."
        />
      </Field>

      <Field label="Lien Calendly de l'appel de découverte">
        <Input
          name="discoveryUrl"
          type="url"
          inputMode="url"
          defaultValue={discoveryUrl ?? ""}
          placeholder="https://calendly.com/ton-nom/appel-decouverte"
        />
      </Field>

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </Button>
    </form>
  );
}
