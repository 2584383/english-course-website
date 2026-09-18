"use client";

import { useActionState, useState } from "react";

import { deleteUser } from "@/app/actions/admin";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Input } from "@/components/ui";

const EMPTY: ActionState = {};

export function DeleteUserButton({
  userId,
  name,
}: {
  userId: string;
  name: string;
}) {
  const [state, action, pending] = useActionState(deleteUser, EMPTY);
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-[var(--radius-field)] border border-red-200 px-3 py-2 text-xs font-bold text-red-700"
      >
        Supprimer
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-1 flex-col gap-2">
      <input type="hidden" name="userId" value={userId} />

      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <p className="text-xs text-muted">
        Supprimer définitivement le compte de <strong>{name}</strong> et toutes
        ses données. Saisis SUPPRIMER pour confirmer.
      </p>

      <div className="flex flex-wrap gap-2">
        <Input
          name="confirmation"
          required
          placeholder="SUPPRIMER"
          className="w-40"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-[var(--radius-field)] bg-red-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"
        >
          {pending ? "Suppression…" : "Confirmer"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
