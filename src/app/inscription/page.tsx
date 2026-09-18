import { AuthShell } from "@/components/AuthShell";
import { SignUpForm } from "@/components/AuthForms";

export const metadata = { title: "Créer mon compte" };

export default function SignUpPage() {
  return (
    <AuthShell
      eyebrow="Étape 1 sur 3"
      title="Crée ton compte"
      subtitle="Ton enseignant a préparé ton parcours après votre appel de découverte."
    >
      <SignUpForm />
    </AuthShell>
  );
}
