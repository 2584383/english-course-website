"use client";

import { useActionState } from "react";

import { inviteStudent } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";

const EMPTY: ActionState = {};

/**
 * Le prospect se lance après l'appel : un clic crée son compte, le rattache
 * au prof et lui envoie l'email pour choisir son mot de passe.
 */
export function InviteFromCallButton({
  email,
  fullName,
}: {
  email: string;
  fullName: string;
}) {
  const [state, action, pending] = useActionState(inviteStudent, EMPTY);

  if (state.success) {
    return <span className="text-xs font-bold text-emerald-800">Invitation envoyée ✓</span>;
  }

  return (
    <form action={action} className="flex flex-col items-end gap-1">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="fullName" value={fullName} />
      <button
        type="submit"
        disabled={pending}
        className="rounded-[var(--radius-field)] bg-brand-800 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-900 disabled:opacity-60"
      >
        {pending ? "Envoi…" : "Inviter à créer son compte"}
      </button>
      {state.error ? <span className="text-xs text-red-700">{state.error}</span> : null}
    </form>
  );
}
