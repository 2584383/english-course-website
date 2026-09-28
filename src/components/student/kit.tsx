import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

/*
 * Kit visuel de l'espace étudiant, calqué sur les prototypes hi-fi
 * (mobile 390 px et desktop). Les valeurs — rayons, tailles de texte,
 * couleurs — reprennent celles des maquettes ; les classes `lg:` portent
 * la version desktop.
 */

/* -------------------------------------------------------------------------- */
/* Cartes                                                                     */
/* -------------------------------------------------------------------------- */

const PANEL_TONES = {
  plain: "border-line bg-white",
  soft: "border-soft-border bg-soft",
  dashed: "border-dashed border-dash bg-white",
  danger: "border-danger-line bg-danger-soft",
} as const;

export function Panel({
  tone = "plain",
  size = "md",
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  tone?: keyof typeof PANEL_TONES;
  /** `lg` : cartes de l'accueil (rayon 20). `md` : pages de détail (18). */
  size?: "md" | "lg";
}) {
  return (
    <div
      className={cn(
        "border p-4",
        size === "lg"
          ? "rounded-[20px] lg:p-[22px]"
          : "rounded-[18px] lg:p-[22px]",
        PANEL_TONES[tone],
        className,
      )}
      {...props}
    />
  );
}

/** Surtitre en petites capitales (« PROCHAINE SÉANCE »). */
export function Kicker({
  tone = "muted",
  className,
  children,
}: {
  tone?: "muted" | "brand" | "danger";
  className?: string;
  children: ReactNode;
}) {
  const tones = {
    muted: "text-brand-500",
    brand: "text-brand-700",
    danger: "text-accent-ink",
  } as const;
  return (
    <p
      className={cn(
        "text-[10px] font-bold uppercase leading-none tracking-[0.12em]",
        tones[tone],
        className,
      )}
    >
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* En-têtes de page                                                           */
/* -------------------------------------------------------------------------- */

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 pt-1.5 lg:gap-5 lg:pt-0">
      <div className="min-w-0">
        <h1 className="font-display text-[25px] font-extrabold leading-[1.1] text-ink lg:text-[30px]">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-0.5 text-[13px] leading-snug text-brand-500 lg:mt-1 lg:text-sm">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}

export function DetailHeader({
  kicker,
  title,
  meta,
  action,
}: {
  kicker?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-3 lg:gap-5">
      <div className="min-w-0">
        {kicker ? <Kicker>{kicker}</Kicker> : null}
        <h1
          className={cn(
            "font-display text-2xl font-extrabold leading-[1.15] text-ink lg:text-[28px]",
            kicker ? "mt-1.5 lg:mt-[7px]" : null,
          )}
        >
          {title}
        </h1>
        {meta ? (
          <p className="mt-0.5 text-[13px] leading-snug text-brand-500 lg:mt-1 lg:text-[13.5px]">
            {meta}
          </p>
        ) : null}
      </div>
      {action ? <div className="hidden lg:block">{action}</div> : null}
    </header>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="self-start pt-1.5 text-sm font-bold text-brand-800 no-underline hover:text-brand-900 lg:pt-0"
    >
      ← {children}
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Boutons                                                                    */
/* -------------------------------------------------------------------------- */

const ACTION_BASE =
  "inline-flex items-center justify-center text-center font-bold no-underline transition";

const ACTION_TONES = {
  accent:
    "rounded-[14px] bg-accent px-5 py-[15px] text-[15px] text-ink hover:brightness-95 lg:rounded-xl lg:py-3.5",
  outline:
    "rounded-xl border border-soft-border bg-white px-4 py-2.5 text-[13px] text-brand-800 hover:bg-brand-100",
  quiet:
    "rounded-xl border border-line bg-white px-5 py-3.5 text-[14.5px] text-brand-600 hover:bg-brand-50",
  disabled:
    "cursor-not-allowed rounded-[14px] bg-disabled px-5 py-[15px] text-[15px] text-disabled-ink lg:rounded-xl lg:py-3.5",
  danger:
    "rounded-xl border border-danger-border bg-white px-[18px] py-[11px] text-[13px] text-accent-ink hover:bg-danger-soft",
} as const;

export type ActionTone = keyof typeof ACTION_TONES;

export function actionClass(tone: ActionTone, className?: string) {
  return cn(ACTION_BASE, ACTION_TONES[tone], className);
}

export function ActionLink({
  tone = "accent",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { tone?: ActionTone }) {
  return <Link className={actionClass(tone, className)} {...props} />;
}

export function ActionButton({
  tone = "accent",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { tone?: ActionTone }) {
  return <button className={actionClass(tone, className)} {...props} />;
}

/** Lien texte « Tout voir », « Voir les 13 séances → ». */
export function TextLink({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link>) {
  return (
    <Link
      className={cn(
        "text-xs font-bold text-brand-800 no-underline hover:text-brand-900",
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/* Indicateurs                                                                */
/* -------------------------------------------------------------------------- */

export function Bar({
  value,
  tone = "plain",
  className,
  label = "Progression",
}: {
  value: number;
  /** `soft` : piste plus foncée, posée sur une carte `soft`. */
  tone?: "plain" | "soft";
  className?: string;
  label?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={safe}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "h-2 overflow-hidden rounded-md lg:h-[9px]",
        tone === "soft" ? "bg-track-soft" : "bg-track",
        className,
      )}
    >
      <div
        className="h-full rounded-md bg-brand-800 transition-[width] duration-500"
        style={{ width: `${safe}%` }}
      />
    </div>
  );
}

/** Case à cocher dessinée (les devoirs, les accords). */
export function CheckMark({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-px flex size-[21px] flex-none items-center justify-center rounded-[7px] border-[1.5px] text-xs font-bold text-white transition",
        on ? "border-brand-800 bg-brand-800" : "border-box bg-transparent",
      )}
    >
      {on ? "✓" : ""}
    </span>
  );
}

/** Vignette de type de fichier (PDF, AUDIO, LIEN…). */
export function KindTile({
  label,
  className,
}: {
  label: string;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-10 w-[34px] flex-none items-center justify-center rounded-lg border border-line bg-tile text-[9px] font-bold text-muted",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function Chevron({ glyph = "›" }: { glyph?: string }) {
  return (
    <span aria-hidden className="flex-none text-base font-bold text-chevron">
      {glyph}
    </span>
  );
}

/** Pastille de confirmation (✓ sur fond orangé). */
export function DoneBadge() {
  return (
    <span
      aria-hidden
      className="flex size-16 items-center justify-center rounded-full bg-accent text-[26px] font-bold text-ink lg:size-[70px] lg:text-[28px]"
    >
      ✓
    </span>
  );
}

export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Panel
      tone="dashed"
      className="flex flex-col items-center gap-2 px-5 py-10 text-center"
    >
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm leading-relaxed text-brand-500">
          {description}
        </p>
      ) : null}
      {action}
    </Panel>
  );
}
