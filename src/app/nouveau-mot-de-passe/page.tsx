import { AuthShell } from "@/components/AuthShell";
import { NewPasswordForm } from "@/components/AuthForms";
import { requireUser } from "@/lib/auth";

export const metadata = { title: "Nouveau mot de passe" };

/**
 * Atteinte par le lien « mot de passe oublié » ou par le lien d'invitation :
 * l'utilisateur est déjà connecté par ce lien et choisit son mot de passe.
 */
export default async function NewPasswordPage() {
  const { profile } = await requireUser();

  return (
    <AuthShell
      eyebrow={profile.email}
      title="Choisis ton mot de passe"
      subtitle="Tu l'utiliseras pour te connecter à ton espace, sur ordinateur comme sur mobile."
    >
      <NewPasswordForm />
    </AuthShell>
  );
}
