import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui";

export const metadata = { title: "Compte suspendu" };

export default function SuspendedPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-2xl font-extrabold text-ink">
        Ton accès est suspendu
      </h1>
      <p className="text-sm text-muted">
        Contacte ton enseignant pour réactiver ton compte. Tes données et ton
        historique de parcours sont conservés.
      </p>
      <form action={signOut}>
        <Button tone="ghost" type="submit">
          Se déconnecter
        </Button>
      </form>
    </main>
  );
}
