import Link from "next/link";

import { DeleteAccountForm } from "@/components/student/DeleteAccountForm";
import {
  BackLink,
  Kicker,
  Panel,
  PageHeader,
  actionClass,
} from "@/components/student/kit";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Confidentialité" };

const CONSENT_LABELS: Record<string, { granted: string; refused: string }> = {
  terms: { granted: "CGU acceptées", refused: "CGU refusées" },
  privacy: {
    granted: "Politique de confidentialité acceptée",
    refused: "Politique de confidentialité refusée",
  },
  pedagogical_data: {
    granted: "Traitement des données pédagogiques accepté",
    refused: "Traitement des données pédagogiques refusé",
  },
  marketing: {
    granted: "Communications commerciales acceptées",
    refused: "Communications commerciales refusées",
  },
};

/** Mes données (wireframe 2b, écran 2) : consentements, export, droit à l'oubli. */
export default async function PrivacyPage() {
  const session = await requireUser();

  const supabase = await createClient();
  const { data: consents } = await supabase
    .from("consents")
    .select("*")
    .eq("user_id", session.id)
    .order("granted_at", { ascending: false });

  // Une seule ligne par type : la plus récente fait foi
  type ConsentRow = NonNullable<typeof consents>[number];
  const latest = new Map<string, ConsentRow>();
  for (const consent of consents ?? []) {
    if (!latest.has(consent.kind)) latest.set(consent.kind, consent);
  }

  const body = "text-sm leading-[1.45] text-brand-600 lg:text-[14.5px] lg:leading-normal";

  return (
    <div className="flex max-w-[940px] flex-col gap-3.5 animate-pop lg:gap-[18px]">
      <BackLink href="/app/profil">Profil</BackLink>

      <PageHeader title="Mes données" />

      <div className="grid items-start gap-3.5 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:gap-4">
        <Panel className="flex flex-col gap-[9px]">
          <Kicker>Consentements</Kicker>
          {latest.size === 0 ? (
            <p className={body}>Aucun consentement enregistré.</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {[...latest.values()].map((consent) => {
                const labels = CONSENT_LABELS[consent.kind];
                const label = labels
                  ? consent.granted
                    ? labels.granted
                    : labels.refused
                  : consent.kind;
                return (
                  <li key={consent.id} className={body}>
                    {label} le {formatDate(consent.granted_at, { year: "numeric" })}
                  </li>
                );
              })}
            </ul>
          )}
          <div className="flex gap-3 text-[13px] font-bold">
            <Link href="/cgu" className="text-brand-800 no-underline">
              Relire les CGU
            </Link>
            <Link href="/confidentialite" className="text-brand-800 no-underline">
              La politique
            </Link>
          </div>
        </Panel>

        <Panel className="flex flex-col gap-[9px]">
          <Kicker>Ce qui est stocké</Kicker>
          <p className={body}>
            Ton profil, tes réservations, tes comptes-rendus, tes devoirs et tes
            auto-évaluations.
          </p>
        </Panel>

        <Panel className="flex flex-col gap-[11px]">
          <Kicker>Exporter</Kicker>
          <p className={body}>
            Télécharger une copie complète de tes données (format JSON).
          </p>
          <a
            href="/api/compte/export"
            download
            className={actionClass(
              "outline",
              "px-[18px] py-[11px] lg:self-start",
            )}
          >
            Télécharger mes données
          </a>
        </Panel>
      </div>

      <Panel tone="danger" className="flex flex-col gap-[11px] lg:max-w-[640px]">
        <Kicker tone="danger">Droit à l&apos;oubli</Kicker>
        <p className="text-sm leading-[1.45] text-danger-body lg:text-[14.5px] lg:leading-normal">
          Supprime définitivement ton compte, tes bilans et tes comptes-rendus.
          Cette action ne peut pas être annulée.
        </p>
        <DeleteAccountForm />
      </Panel>
    </div>
  );
}
