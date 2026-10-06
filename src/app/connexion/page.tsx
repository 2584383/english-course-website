import Link from "next/link";

import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";
import { Alert } from "@/components/ui";

export const metadata = { title: "Connexion" };

const LINK_ERRORS: Record<string, string> = {
  "lien-invalide": "Ce lien n'est pas valide.",
  "lien-expire":
    "Ce lien a expiré ou a déjà servi. Les liens reçus par email ne fonctionnent qu'une fois, pendant une heure.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string; erreur?: string }>;
}) {
  const { suivant, erreur } = await searchParams;
  const linkError = erreur ? LINK_ERRORS[erreur] : null;

  return (
    <AuthShell
      eyebrow="Bon retour"
      title="Se connecter"
      subtitle="Retrouve ton parcours, tes comptes-rendus et tes prochaines séances."
    >
      {linkError ? (
        <div className="mb-4">
          <Alert tone="error">
            {linkError}{" "}
            <Link href="/mot-de-passe-oublie" className="font-bold underline">
              Recevoir un nouveau lien
            </Link>
          </Alert>
        </div>
      ) : null}
      <SignInForm next={suivant} />
    </AuthShell>
  );
}
