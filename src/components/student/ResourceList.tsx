import { Badge, Card, EmptyState } from "@/components/ui";
import type { Resource } from "@/lib/database.types";

const KIND_LABELS: Record<Resource["kind"], string> = {
  pdf: "PDF",
  audio: "AUDIO",
  video: "VIDÉO",
  link: "LIEN",
  doc: "DOC",
};

/**
 * Ouvre la ressource : lien externe, ou fichier privé servi par l'API, qui
 * répond par une URL signée à durée limitée.
 */
function hrefFor(resource: Resource) {
  return resource.external_url ?? `/api/ressources/${resource.id}`;
}

export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <EmptyState
        title="Aucune ressource partagée"
        description="Ton enseignant déposera ici les fiches, audios et supports de cours."
      />
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {resources.map((resource) => (
        <li key={resource.id}>
          <a
            href={hrefFor(resource)}
            target="_blank"
            rel="noreferrer"
            className="block no-underline"
          >
            <Card className="flex items-center gap-3 transition hover:border-brand-300">
              <Badge tone="brand">{KIND_LABELS[resource.kind]}</Badge>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink">
                  {resource.title}
                </p>
                {resource.description || resource.duration_label ? (
                  <p className="text-xs text-muted-soft">
                    {[resource.duration_label, resource.description]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </div>
              <span aria-hidden className="text-brand-400">
                ↗
              </span>
            </Card>
          </a>
        </li>
      ))}
    </ul>
  );
}
