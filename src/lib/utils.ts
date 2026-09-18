import type { ModuleKind, Scenario, CefrLevel } from "@/lib/database.types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

const PARIS = "Europe/Paris";

export function formatDate(iso: string, opts?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    day: "numeric",
    month: "long",
    ...opts,
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** « dans 2 jours », « dans 3 h », « hier »… */
export function relativeLabel(iso: string, now = new Date()) {
  const diffMs = new Date(iso).getTime() - now.getTime();
  const rtf = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60_000);

  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(hours / 24);
  if (Math.abs(days) < 31) return rtf.format(days, "day");
  return rtf.format(Math.round(days / 30), "month");
}

export function initials(name: string | null | undefined, fallback = "?") {
  if (!name?.trim()) return fallback;
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export const MODULE_LABELS: Record<ModuleKind, string> = {
  listening: "Écoute",
  pronunciation: "Prononciation",
  simulation: "Simulation",
  vocabulary: "Vocabulaire",
  grammar: "Grammaire",
  other: "Divers",
};

export const SCENARIO_LABELS: Record<Scenario, string> = {
  job_interview: "Préparation d'entretien",
  academic: "Intégration académique",
  business: "Communication professionnelle",
  fluency: "Pratique & fluidité",
};

export const CEFR_LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

export function levelLabel(
  initial: CefrLevel | null,
  target: CefrLevel | null,
): string {
  if (initial && target) return `${initial} → ${target}`;
  return initial ?? target ?? "Niveau à évaluer";
}

/** Le lien Google Meet n'est révélé qu'à l'approche de la séance. */
export function isMeetOpen(startsAt: string, now = new Date()) {
  const diff = new Date(startsAt).getTime() - now.getTime();
  return diff <= 15 * 60_000 && diff > -90 * 60_000;
}

export function percent(done: number, total: number) {
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
}
