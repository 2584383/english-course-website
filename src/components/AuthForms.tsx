"use client";

import { useActionState, useState } from "react";

import Link from "next/link";

import { signIn, signUp, type ActionState } from "@/app/actions/auth";
import { Alert, Button, Field, Input } from "@/components/ui";

const EMPTY: ActionState = {};

export function SignInForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(signIn, EMPTY);

  return (
    <form action={action} className="flex flex-col gap-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="amina@exemple.fr"
        />
      </Field>

      <Field label="Mot de passe">
        <Input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          placeholder="8 caractères minimum"
        />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </Button>

      <p className="text-center text-xs text-muted-soft">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-bold text-brand-800">
          Créer mon compte
        </Link>
      </p>
    </form>
  );
}

/** Indicateur de robustesse, repris du prototype d'onboarding. */
function strength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[^a-zA-Z0-9]/.test(password) || /\d/.test(password)) score++;
  const labels = ["Trop court", "Correct", "Bien", "Solide"];
  return { score, label: labels[score], width: `${(score / 3) * 100}%` };
}

export function SignUpForm() {
  const [state, action, pending] = useActionState(signUp, EMPTY);
  const [password, setPassword] = useState("");
  const meter = strength(password);

  return (
    <form action={action} className="flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}
      {state.success ? <Alert tone="success">{state.success}</Alert> : null}

      <Field label="Prénom et nom">
        <Input name="fullName" required placeholder="Amina B." autoComplete="name" />
      </Field>

      <Field label="Email">
        <Input
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="amina@exemple.fr"
        />
      </Field>

      <Field label="Mot de passe">
        <Input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </Field>

      <div className="-mt-2 flex items-center gap-2">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-brand-200">
          <div
            className="h-full rounded-full bg-brand-800 transition-[width]"
            style={{ width: meter.width }}
          />
        </div>
        <span className="text-[11px] font-semibold text-muted-soft">
          {password ? meter.label : ""}
        </span>
      </div>

      <fieldset className="flex flex-col gap-3 rounded-[var(--radius-card)] border border-line bg-white p-4">
        <legend className="px-1 text-xs font-bold text-brand-600">
          Consentements
        </legend>

        <Consent name="terms" required label="J'accepte les conditions d'utilisation">
          <Link href="/cgu" className="underline">
            Lire les CGU
          </Link>
        </Consent>

        <Consent
          name="privacy"
          required
          label="J'ai lu la politique de confidentialité"
        >
          <Link href="/confidentialite" className="underline">
            Comment mes données sont traitées
          </Link>
        </Consent>

        <Consent
          name="pedagogical"
          label="Mon enseignant peut conserver mes bilans de progression"
        >
          Révocable à tout moment depuis ton profil.
        </Consent>
      </fieldset>

      <Button type="submit" tone="accent" disabled={pending}>
        {pending ? "Création…" : "Créer mon compte"}
      </Button>

      <p className="text-center text-xs text-muted-soft">
        Déjà un compte ?{" "}
        <Link href="/connexion" className="font-bold text-brand-800">
          Se connecter
        </Link>
      </p>
    </form>
  );
}

function Consent({
  name,
  label,
  required,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input
        type="checkbox"
        name={name}
        required={required}
        className="mt-0.5 size-5 flex-none accent-[#0e474c]"
      />
      <span>
        <span className="font-semibold text-ink">{label}</span>
        <span className="mt-0.5 block text-xs text-muted-soft">{children}</span>
      </span>
    </label>
  );
}
