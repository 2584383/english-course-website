const ICONS = {
  home: "M3.5 10.6 12 3.8l8.5 6.8V19a1.6 1.6 0 0 1-1.6 1.6h-4.2v-5.4H9.3v5.4H5.1A1.6 1.6 0 0 1 3.5 19z",
  path: "M6 3.5v4.9a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v5.1M6 3.5 4 6m2-2.5L8 6m10 14.5 2-2.5m-2 2.5-2-2.5",
  cal: "M4.5 7.6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10.9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM4.5 10.4h15M8.6 3.6v3.4m6.8-3.4v3.4M12 13.2v4.2m-2.1-2.1h4.2",
  check: "M4.2 6.4h9.4M4.2 12h7.3M4.2 17.6h5.2M14.6 16.9l2.2 2.2 4.2-4.6",
  user: "M12 11.8a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8ZM4.8 20.2a7.2 7.2 0 0 1 14.4 0",
} as const;

/**
 * Les 5 onglets de l'espace étudiant. Libellés courts sur mobile, longs sur
 * desktop (« Parcours » / « Mon parcours »), comme dans les prototypes.
 * Les comptes-rendus vivent sous Parcours (wireframe 2a), l'auto-évaluation
 * sous Accueil.
 */
export const STUDENT_TABS = [
  {
    href: "/app",
    short: "Accueil",
    long: "Accueil",
    icon: ICONS.home,
    match: (p: string) => p === "/app" || p.startsWith("/app/evaluation"),
  },
  {
    href: "/app/parcours",
    short: "Parcours",
    long: "Mon parcours",
    icon: ICONS.path,
    match: (p: string) =>
      p.startsWith("/app/parcours") || p.startsWith("/app/comptes-rendus"),
  },
  {
    href: "/app/reserver",
    short: "Réserver",
    long: "Réserver",
    icon: ICONS.cal,
    match: (p: string) => p.startsWith("/app/reserver"),
  },
  {
    href: "/app/devoirs",
    short: "Devoirs",
    long: "Mon travail",
    icon: ICONS.check,
    match: (p: string) => p.startsWith("/app/devoirs"),
  },
  {
    href: "/app/profil",
    short: "Profil",
    long: "Profil",
    icon: ICONS.user,
    match: (p: string) => p.startsWith("/app/profil"),
  },
] as const;

export function TabIcon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
    </svg>
  );
}
