import Link from "next/link";

import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";

export const metadata = { title: "Créer mon compte" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Étape 1 sur 3"
      step={1}
      title="Crée ton compte"
      subtitle="Utilise l'adresse email de ton appel de découverte : tu seras directement rattaché à ton prof."
    >
      <SignUpForm />
      <p className="mt-5 text-center text-[13px] text-brand-600">
        Pas encore fait ton appel ?{" "}
        <Link href="/appel-decouverte" className="font-bold text-brand-800">
          Réserve-le gratuitement
        </Link>
      </p>
    </AuthShell>
  );
}
