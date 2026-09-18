import { AuthShell } from "@/components/AuthShell";
import { SignInForm } from "@/components/AuthForms";

export const metadata = { title: "Connexion" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ suivant?: string }>;
}) {
  const { suivant } = await searchParams;

  return (
    <AuthShell
      eyebrow="Bon retour"
      title="Se connecter"
      subtitle="Retrouve ton parcours, tes comptes-rendus et tes prochaines séances."
    >
      <SignInForm next={suivant} />
    </AuthShell>
  );
}
