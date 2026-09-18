"use client";

import { useActionState } from "react";

import { uploadResource } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";

const EMPTY: ActionState = {};

const KINDS = [
  ["pdf", "PDF"],
  ["audio", "Audio"],
  ["video", "Vidéo"],
  ["link", "Lien externe"],
  ["doc", "Document"],
] as const;

export function ResourceForm() {
  const [state, action, pending] = useActionState(uploadResource, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Titre">
        <Input name="title" required placeholder="Fiche past tenses" />
      </Field>

      <Field label="Type">
        <Select name="kind" defaultValue="pdf">
          {KINDS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Fichier" hint="25 Mo maximum. Stockage privé Supabase.">
        <input
          type="file"
          name="file"
          className="w-full text-xs text-brand-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-200 file:px-3 file:py-2 file:text-xs file:font-bold file:text-brand-800"
        />
      </Field>

      <Field label="… ou lien externe">
        <Input name="externalUrl" type="url" placeholder="https://…" />
      </Field>

      <Field label="Durée / repère">
        <Input name="durationLabel" placeholder="4 min" />
      </Field>

      <Field label="Description">
        <Textarea name="description" rows={2} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi…" : "Ajouter"}
      </Button>
    </form>
  );
}
