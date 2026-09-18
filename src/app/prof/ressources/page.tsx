import { deleteResource } from "@/app/actions/teacher";
import { ResourceForm } from "@/components/teacher/ResourceForm";
import { ShareResourceForm } from "@/components/teacher/ShareResourceForm";
import { Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getResources, getTeacherStudents } from "@/lib/queries/teacher";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import type { ResourceKind } from "@/lib/database.types";

export const metadata = { title: "Ressources" };

const KIND_LABELS: Record<ResourceKind, string> = {
  pdf: "PDF",
  audio: "AUDIO",
  video: "VIDÉO",
  link: "LIEN",
  doc: "DOC",
};

export default async function ResourcesPage() {
  const { id } = await requireTeacher();

  const [resources, students] = await Promise.all([
    getResources(id),
    getTeacherStudents(id),
  ]);

  const supabase = await createClient();
  const { data: shares } = await supabase
    .from("resource_shares")
    .select("resource_id, student_id")
    .in("resource_id", resources.length ? resources.map((r) => r.id) : [""]);

  const shareCount = new Map<string, number>();
  for (const share of shares ?? []) {
    shareCount.set(
      share.resource_id,
      (shareCount.get(share.resource_id) ?? 0) + 1,
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Ressources
        </h1>
        <p className="text-sm text-muted">
          Supports de cours, fiches d&apos;exercices, audios et liens utiles.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_360px]">
        <section className="flex flex-col gap-2">
          {resources.length === 0 ? (
            <EmptyState
              title="Bibliothèque vide"
              description="Dépose ton premier support : il restera privé tant que tu ne l'auras pas partagé."
            />
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="brand">{KIND_LABELS[resource.kind]}</Badge>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-ink">
                      {resource.title}
                    </p>
                    <p className="text-xs text-muted">
                      {[
                        resource.duration_label,
                        resource.description,
                        `partagé à ${shareCount.get(resource.id) ?? 0} étudiant(s)`,
                        formatDate(resource.created_at),
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>

                  <a
                    href={`/api/ressources/${resource.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[var(--radius-field)] border border-line px-3 py-1.5 text-xs font-bold text-brand-600 no-underline"
                  >
                    Ouvrir
                  </a>

                  <form action={deleteResource}>
                    <input
                      type="hidden"
                      name="resourceId"
                      value={resource.id}
                    />
                    <button
                      type="submit"
                      aria-label={`Supprimer ${resource.title}`}
                      className="rounded-md border border-line px-2 py-1.5 text-xs text-muted"
                    >
                      ✕
                    </button>
                  </form>
                </div>

                {students.length > 0 ? (
                  <ShareResourceForm
                    resourceId={resource.id}
                    students={students.map((row) => ({
                      id: row.profile.id,
                      name: row.profile.full_name ?? row.profile.email,
                    }))}
                  />
                ) : null}
              </Card>
            ))
          )}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Ajouter une ressource</SectionTitle>
            <ResourceForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
