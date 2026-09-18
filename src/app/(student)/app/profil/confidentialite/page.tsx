import Link from "next/link";

import { DeleteAccountForm } from "@/components/student/DeleteAccountForm";
import { Badge, Card, Eyebrow, SectionTitle } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Confidentialité" };

const CONSENT_LABELS: Record<string, string> = {
  terms: "Conditions générales d'utilisation",
  privacy: "Politique de confidentialité",
  pedagogical_data: "Conservation des bilans pédagogiques",
  marketing: "Communications commerciales",
};

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

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <Link href="/app/profil" className="text-xs font-bold text-brand-800">
        ← Mon profil
      </Link>

      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          Mes données
        </h1>
        <p className="text-[13px] text-muted">
          Tu gardes la main sur ce que la plateforme conserve.
        </p>
      </header>

      <Card className="flex flex-col gap-3">
        <SectionTitle>Consentements</SectionTitle>
        <ul className="flex flex-col gap-2">
          {[...latest.values()].map((consent) => (
            <li
              key={consent.id}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="flex-1 text-brand-600">
                {CONSENT_LABELS[consent.kind] ?? consent.kind}
                <span className="block text-xs text-muted-soft">
                  {formatDate(consent.granted_at)}
                </span>
              </span>
              <Badge tone={consent.granted ? "success" : "neutral"}>
                {consent.granted ? "Accordé" : "Refusé"}
              </Badge>
            </li>
          ))}
          {latest.size === 0 ? (
            <li className="text-sm text-muted">Aucun consentement enregistré.</li>
          ) : null}
        </ul>
      </Card>

      <Card className="flex flex-col gap-2">
        <Eyebrow>Portabilité</Eyebrow>
        <p className="text-[13px] leading-relaxed text-muted">
          Télécharge l&apos;ensemble de tes données — profil, réservations,
          comptes-rendus et devoirs — au format JSON.
        </p>
        <a
          href="/api/compte/export"
          className="text-sm font-bold text-brand-800"
          download
        >
          Exporter mes données →
        </a>
      </Card>

      <Card className="flex flex-col gap-3 border-red-200">
        <SectionTitle>Supprimer mon compte</SectionTitle>
        <p className="text-[13px] leading-relaxed text-muted">
          Cette action est définitive : profil, réservations, comptes-rendus,
          devoirs et auto-évaluations sont effacés. Elle ne peut pas être
          annulée.
        </p>
        <DeleteAccountForm />
      </Card>
    </div>
  );
}
