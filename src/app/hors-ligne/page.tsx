export const metadata = { title: "Hors ligne" };

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
      <h1 className="font-display text-2xl font-extrabold text-ink">
        Pas de connexion
      </h1>
      <p className="text-sm text-muted">
        Ton parcours et tes comptes-rendus reviendront dès que le réseau sera de
        retour. Les pages déjà consultées restent accessibles.
      </p>
    </main>
  );
}
