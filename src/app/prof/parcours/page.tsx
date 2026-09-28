import Link from "next/link";

import { installCatalogTemplate } from "@/app/actions/teacher";
import { TemplateForm } from "@/components/teacher/TemplateForm";
import { Badge, Button, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { TEMPLATE_CATALOG } from "@/lib/catalog";
import { getTemplates } from "@/lib/queries/teacher";
import { SCENARIO_LABELS } from "@/lib/utils";

export const metadata = { title: "Parcours & gabarits" };

export default async function TemplatesPage() {
  const { id } = await requireTeacher();
  const templates = await getTemplates(id);
  const installed = new Set(templates.map((t) => t.name));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Parcours & gabarits
        </h1>
        <p className="text-sm text-muted">
          Pars d&apos;un modèle prêt à l&apos;emploi, ajuste-le, puis
          attribue-le à tes apprenants.
        </p>
      </header>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-6">
          <section className="flex flex-col gap-2">
            <SectionTitle>Mes gabarits</SectionTitle>
            {templates.length === 0 ? (
              <EmptyState
                title="Aucun gabarit pour l'instant"
                description="Choisis un modèle du catalogue ci-dessous : il sera copié ici, prêt à être ajusté et attribué."
              />
            ) : (
              templates.map((template) => (
                <Link
                  key={template.id}
                  href={`/prof/parcours/${template.id}`}
                  className="block no-underline"
                >
                  <Card className="flex flex-wrap items-center gap-3 transition hover:border-brand-300">
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-base font-bold text-ink">
                        {template.name}
                      </p>
                      {template.description ? (
                        <p className="line-clamp-1 text-xs text-muted">
                          {template.description}
                        </p>
                      ) : null}
                    </div>
                    {template.scenario ? (
                      <Badge tone="brand">{SCENARIO_LABELS[template.scenario]}</Badge>
                    ) : null}
                    <Badge>{template.session_count} séances</Badge>
                  </Card>
                </Link>
              ))
            )}
          </section>

          <section className="flex flex-col gap-2">
            <SectionTitle>Catalogue intégré</SectionTitle>
            <p className="text-[13px] text-muted">
              Des parcours complets — objectifs, ordres du jour et devoirs — à
              copier dans tes gabarits puis à adapter.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              {TEMPLATE_CATALOG.map((template) => {
                const already = installed.has(template.name);
                return (
                  <Card key={template.key} className="flex flex-col gap-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="brand">{SCENARIO_LABELS[template.scenario]}</Badge>
                      <Badge>{template.level}</Badge>
                    </div>
                    <p className="font-display text-base font-bold text-ink">
                      {template.name}
                    </p>
                    <p className="flex-1 text-[13px] leading-relaxed text-brand-600">
                      {template.description}
                    </p>
                    <p className="line-clamp-2 text-xs text-muted-soft">
                      {template.sessions.map((s) => s.title).join(" · ")}
                    </p>
                    <form action={installCatalogTemplate}>
                      <input type="hidden" name="key" value={template.key} />
                      <Button
                        type="submit"
                        tone={already ? "ghost" : "primary"}
                        className="w-full py-2.5"
                      >
                        {already ? "Déjà ajouté · en créer une copie" : "Utiliser ce modèle"}
                      </Button>
                    </form>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <SectionTitle>Nouveau gabarit vide</SectionTitle>
            <p className="text-[13px] leading-relaxed text-brand-600">
              Un besoin qui ne rentre dans aucun modèle ? Pars d&apos;une page
              blanche et ajoute tes séances une à une.
            </p>
            <TemplateForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
