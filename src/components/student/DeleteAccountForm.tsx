"use client";

import { useActionState, useState } from "react";

import { deleteMyAccount } from "@/app/actions/rgpd";
import type { ActionState } from "@/app/actions/auth";
import { ActionButton } from "@/components/student/kit";
import { Alert, Field, Input, Textarea } from "@/components/ui";

const EMPTY: ActionState = {};

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState(deleteMyAccount, EMPTY);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <ActionButton
        type="button"
        tone="danger"
        onClick={() => setOpen(true)}
        className="w-full lg:w-auto lg:self-start"
      >
        Supprimer mon compte
      </ActionButton>
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
        <ActionButton
          type="button"
          tone="quiet"
          onClick={() => setOpen(false)}
          className="px-[18px] py-[11px] text-[13px]"
        >
          Annuler
        </ActionButton>
        <ActionButton
          type="submit"
          tone="danger"
          disabled={pending}
          className="flex-1 disabled:opacity-50"
        >
          {pending ? "Suppression…" : "Supprimer définitivement"}
        </ActionButton>
      </div>
    </form>
  );
}
