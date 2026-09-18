import Link from "next/link";

import { TemplateForm } from "@/components/teacher/TemplateForm";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getTemplates } from "@/lib/queries/teacher";
import { SCENARIO_LABELS } from "@/lib/utils";

export const metadata = { title: "Parcours & templates" };

export default async function TemplatesPage() {
  const { id } = await requireTeacher();
  const templates = await getTemplates(id);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Parcours & templates
        </h1>
        <p className="text-sm text-muted">
          Des gabarits réutilisables que tu adaptes ensuite pour chaque
          apprenant.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="flex flex-col gap-2">
          {templates.length === 0 ? (
            <EmptyState
              title="Aucun gabarit"
              description="Crée ton premier parcours type : il te servira de base pour tous tes apprenants."
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
                    <Badge tone="brand">
                      {SCENARIO_LABELS[template.scenario]}
                    </Badge>
                  ) : null}
                  <Badge>{template.session_count} séances</Badge>
                </Card>
              </Link>
            ))
          )}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Nouveau gabarit</SectionTitle>
            <TemplateForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
