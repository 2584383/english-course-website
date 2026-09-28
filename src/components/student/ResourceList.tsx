import { Chevron, Empty, KindTile, Panel } from "@/components/student/kit";
import type { Resource } from "@/lib/database.types";
import { RESOURCE_KIND_LABELS } from "@/lib/utils";

/**
 * Ouvre la ressource : lien externe, ou fichier privé servi par l'API, qui
 * répond par une URL signée à durée limitée.
 */
function hrefFor(resource: Resource) {
  return resource.external_url ?? `/api/ressources/${resource.id}`;
}

function metaFor(resource: Resource) {
  const kind =
    resource.kind === "link"
      ? "Lien externe"
      : resource.kind === "audio"
        ? "Audio"
        : RESOURCE_KIND_LABELS[resource.kind];
  return [kind, resource.duration_label].filter(Boolean).join(" · ");
}

/** Bibliothèque partagée (prototype hi-fi, onglet Mon travail › Ressources). */
export function ResourceList({ resources }: { resources: Resource[] }) {
  if (resources.length === 0) {
    return (
      <Empty
        title="Aucune ressource partagée"
        description="Ton enseignant déposera ici les fiches, audios et supports de cours."
      />
    );
  }

  const audios = resources.filter((r) => r.kind === "audio");
  const files = resources.filter((r) => r.kind !== "audio" && r.kind !== "link");
  const links = resources.filter((r) => r.kind === "link");

  return (
    <div className="flex max-w-[1060px] flex-col gap-3 lg:gap-4">
      {audios.map((resource) => (
        <Panel key={resource.id} className="flex flex-col gap-[11px] p-3.5 lg:p-5">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-[46px] flex-none items-center justify-center rounded-full bg-accent text-[15px] font-bold text-ink lg:size-[52px] lg:text-base"
            >
              ▶
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-[15px] font-bold leading-[1.2] text-ink lg:text-base">
                {resource.title}
              </span>
              <span className="block text-[12.5px] leading-[1.35] text-muted">
                {metaFor(resource)}
              </span>
            </span>
          </div>
          <audio
            controls
            preload="none"
            src={hrefFor(resource)}
            className="h-10 w-full"
          >
            <a href={hrefFor(resource)}>Écouter {resource.title}</a>
          </audio>
          {resource.description ? (
            <p className="text-[13px] leading-snug text-brand-500">
              {resource.description}
            </p>
          ) : null}
        </Panel>
      ))}

      {files.length > 0 || links.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fill,minmax(230px,1fr))] lg:gap-4">
          {files.map((resource) => (
            <li key={resource.id}>
              <a
                href={hrefFor(resource)}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col overflow-hidden rounded-[18px] border border-line bg-white no-underline transition hover:border-soft-border"
              >
                <span
                  aria-hidden
                  className="flex h-[104px] items-center justify-center bg-tile font-display text-lg font-bold tracking-wide text-muted lg:h-[132px]"
                >
                  {RESOURCE_KIND_LABELS[resource.kind]}
                </span>
                <span className="flex flex-col gap-[3px] p-3 lg:p-3.5">
                  <span className="font-display text-sm font-bold leading-[1.2] text-ink lg:text-[15px]">
                    {resource.title}
                  </span>
                  <span className="text-xs text-muted-soft">{metaFor(resource)}</span>
                </span>
              </a>
            </li>
          ))}

          {links.map((resource) => (
            <li key={resource.id} className="col-span-2 lg:col-span-1">
              <a
                href={hrefFor(resource)}
                target="_blank"
                rel="noreferrer"
                className="flex h-full items-center gap-3 rounded-[18px] border border-line bg-white p-[15px] no-underline transition hover:border-soft-border lg:flex-col lg:items-start lg:justify-between lg:gap-3.5 lg:p-4"
              >
                <KindTile label="LIEN" className="lg:h-11 lg:w-[38px]" />
                <span className="min-w-0 flex-1 lg:flex-none">
                  <span className="block font-display text-sm font-bold leading-[1.2] text-ink lg:text-[15px] lg:leading-[1.25]">
                    {resource.title}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-soft lg:mt-[3px]">
                    {metaFor(resource)}
                  </span>
                </span>
                <span className="lg:hidden">
                  <Chevron glyph="↗" />
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-center text-[12.5px] leading-[1.45] text-muted-soft lg:text-left lg:text-[13px]">
        Les fichiers ouverts une fois restent lisibles hors connexion.
      </p>
    </div>
  );
}
