import Link from "next/link";

import { DiscoveryBooking } from "@/components/DiscoveryBooking";
import { Card, EmptyState, Eyebrow } from "@/components/ui";
import { getDiscoveryTeachers } from "@/lib/discovery";

export const metadata = { title: "Appel découverte" };

// La liste des profs (photo, présentation, lien) change sans redéploiement
export const dynamic = "force-dynamic";

/**
 * Réservation de l'appel de découverte, sans compte : le prospect choisit son
 * prof et un créneau. Le compte n'est créé que s'il se lance ensuite.
 */
export default async function DiscoveryCallPage() {
  const teachers = await getDiscoveryTeachers();

  return (
    <main className="min-h-dvh bg-brand-50">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link href="/" className="font-display text-base font-extrabold text-ink no-underline">
          English with Lea
        </Link>
        <Link href="/connexion" className="text-sm font-bold text-brand-800">
          Se connecter
        </Link>
      </header>

      <section className="mx-auto max-w-xl px-5 pb-16 pt-4">
        <Eyebrow>Gratuit · sans engagement · en visio</Eyebrow>
        <h1 className="mt-3 font-display text-3xl font-extrabold leading-[1.15] text-ink">
          Réserve ton appel découverte
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted">
          On fait le point sur ton niveau, ton objectif et ton échéance. Pas
          besoin de créer de compte : tu le feras seulement si tu décides de te
          lancer.
        </p>

        <div className="mt-6">
          {teachers.length ? (
            <DiscoveryBooking teachers={teachers} />
          ) : (
            <EmptyState
              title="Réservation bientôt disponible"
              description="Les créneaux d'appel découverte ne sont pas encore ouverts. Reviens dans quelques jours."
            />
          )}
        </div>

        <Card tone="soft" className="mt-6 flex flex-col gap-1 text-sm">
          <p className="font-bold text-ink">Tu as déjà fait ton appel ?</p>
          <p className="text-brand-600">
            <Link href="/inscription" className="font-bold text-brand-800">
              Crée ton compte
            </Link>{" "}
            avec l&apos;adresse email utilisée pour l&apos;appel : tu seras
            directement rattaché à ton prof.
          </p>
        </Card>
      </section>
    </main>
  );
}
