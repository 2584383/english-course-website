"use client";

import { useActionState, useState } from "react";

import { deleteMyAccount } from "@/app/actions/rgpd";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input, Textarea } from "@/components/ui";

const EMPTY: ActionState = {};

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteMyAccount, EMPTY);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <Button tone="danger" onClick={() => setOpen(true)}>
        Demander la suppression de mon compte
      </Button>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Pourquoi nous quittes-tu ?" hint="Optionnel.">
        <Textarea name="reason" rows={2} />
      </Field>

      <Field
        label="Confirmation"
        hint="Saisis SUPPRIMER en majuscules pour confirmer."
      >
        <Input name="confirmation" required placeholder="SUPPRIMER" />
      </Field>

      <div className="flex gap-2">
        <Button type="button" tone="ghost" onClick={() => setOpen(false)}>
          Annuler
        </Button>
        <Button type="submit" tone="danger" disabled={pending} className="flex-1">
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </Button>
      </div>
    </form>
  );
}
