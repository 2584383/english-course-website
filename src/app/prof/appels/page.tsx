import { DiscoveryCallForm } from "@/components/teacher/DiscoveryCallForm";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getDiscoveryCalls } from "@/lib/queries/teacher";
import { formatDate } from "@/lib/utils";
import type { DiscoveryStatus } from "@/lib/database.types";

export const metadata = { title: "Appels de découverte" };

const STATUS: Record<
  DiscoveryStatus,
  { label: string; tone: "neutral" | "brand" | "accent" | "success" | "warn" }
> = {
  to_qualify: { label: "À qualifier", tone: "neutral" },
  scheduled: { label: "Appel prévu", tone: "brand" },
  confirmed: { label: "A confirmé", tone: "accent" },
  thinking: { label: "Réfléchit", tone: "warn" },
  converted: { label: "Converti", tone: "success" },
  lost: { label: "Perdu", tone: "neutral" },
};

export default async function DiscoveryCallsPage() {
  const { id } = await requireTeacher();
  const calls = await getDiscoveryCalls(id);

  const open = calls.filter(
    (call) => call.status !== "converted" && call.status !== "lost",
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Appels de découverte
        </h1>
        <p className="text-sm text-muted">
          {open.length} prospect{open.length > 1 ? "s" : ""} en cours de
          qualification
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-2">
          {calls.length === 0 ? (
            <EmptyState
              title="Aucun appel enregistré"
              description="Note ici les constats de tes premiers échanges : ils deviendront la fiche de l'étudiant."
            />
          ) : (
            calls.map((call) => (
              <Card key={call.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-display text-base font-bold text-ink">
                    {call.full_name}
                  </span>
                  <Badge tone={STATUS[call.status].tone}>
                    {STATUS[call.status].label}
                  </Badge>
                </div>

                <p className="text-xs text-muted">
                  {[
                    call.scheduled_at ? formatDate(call.scheduled_at) : null,
                    call.email,
                    call.phone,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "Coordonnées à compléter"}
                </p>

                {call.notes ? (
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-brand-600">
                    {call.notes}
                  </p>
                ) : null}
              </Card>
            ))
          )}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Nouvel appel</SectionTitle>
            <DiscoveryCallForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
