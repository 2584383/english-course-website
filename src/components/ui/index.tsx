import type { ComponentPropsWithoutRef, ReactNode } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/* Carte                                                                      */
/* -------------------------------------------------------------------------- */

export function Card({
  className,
  tone = "plain",
  ...props
}: ComponentPropsWithoutRef<"div"> & { tone?: "plain" | "soft" | "accent" }) {
  const tones = {
    plain: "bg-white border-line",
    soft: "bg-soft border-soft-border",
    accent: "bg-accent-soft border-accent/40",
  } as const;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border p-4 sm:p-5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-lg font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
      {children}
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/* Boutons                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonTone = "primary" | "accent" | "ghost" | "danger";

const BUTTON_TONES: Record<ButtonTone, string> = {
  primary: "bg-brand-800 text-white hover:bg-brand-900",
  accent: "bg-accent text-ink hover:brightness-95",
  ghost: "bg-white text-brand-600 border border-line hover:bg-brand-100",
  danger: "bg-white text-red-700 border border-red-200 hover:bg-red-50",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-field)] px-5 py-3 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50";

export function Button({
  tone = "primary",
  className,
  ...props
}: ComponentPropsWithoutRef<"button"> & { tone?: ButtonTone }) {
  return (
    <button
      className={cn(BUTTON_BASE, BUTTON_TONES[tone], className)}
      {...props}
    />
  );
}

export function ButtonLink({
  tone = "primary",
  className,
  ...props
}: ComponentPropsWithoutRef<typeof Link> & { tone?: ButtonTone }) {
  return (
    <Link className={cn(BUTTON_BASE, BUTTON_TONES[tone], className)} {...props} />
  );
}

/* -------------------------------------------------------------------------- */
/* Champs de formulaire                                                       */
/* -------------------------------------------------------------------------- */

const FIELD =
  "w-full rounded-[var(--radius-field)] border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none placeholder:text-muted-soft focus:border-brand-300";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-bold text-brand-600">{label}</span>
      {children}
      {hint ? <span className="text-xs text-muted-soft">{hint}</span> : null}
    </label>
  );
}

export function Input({
  className,
  ...props
}: ComponentPropsWithoutRef<"input">) {
  return <input className={cn(FIELD, className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: ComponentPropsWithoutRef<"textarea">) {
  return (
    <textarea className={cn(FIELD, "min-h-24 resize-y", className)} {...props} />
  );
}

export function Select({
  className,
  ...props
}: ComponentPropsWithoutRef<"select">) {
  return <select className={cn(FIELD, "pr-8", className)} {...props} />;
}

/* -------------------------------------------------------------------------- */
/* Indicateurs                                                                */
/* -------------------------------------------------------------------------- */

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "accent" | "success" | "warn";
}) {
  const tones = {
    neutral: "bg-brand-100 text-brand-600",
    brand: "bg-soft text-brand-800 border border-soft-border",
    accent: "bg-accent-soft text-accent-ink",
    success: "bg-emerald-50 text-emerald-800",
    warn: "bg-amber-50 text-amber-900",
  } as const;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  label,
  sublabel,
}: {
  value: number;
  label?: string;
  sublabel?: string;
}) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex flex-col gap-2">
      {label ? (
        <div className="flex items-baseline justify-between">
          <span className="font-display text-2xl font-extrabold text-ink">
            {safe} %
          </span>
          <span className="text-xs text-muted">{label}</span>
        </div>
      ) : null}
      <div
        className="h-2 overflow-hidden rounded-full bg-brand-200"
        role="progressbar"
        aria-valuenow={safe}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? "Progression du parcours"}
      >
        <div
          className="h-full rounded-full bg-brand-800 transition-[width] duration-500"
          style={{ width: `${safe}%` }}
        />
      </div>
      {sublabel ? <p className="text-xs text-muted">{sublabel}</p> : null}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action}
    </Card>
  );
}

export function Alert({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
}) {
  const tones = {
    info: "bg-soft border-soft-border text-brand-800",
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
  } as const;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn("rounded-[var(--radius-field)] border p-3 text-sm", tones[tone])}
    >
      {children}
    </div>
  );
}

export function Avatar({
  label,
  size = 44,
}: {
  label: string;
  size?: number;
}) {
  return (
    <span
      aria-hidden
      className="inline-flex flex-none items-center justify-center rounded-full border border-soft-border bg-soft font-display font-extrabold text-brand-800"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
    >
      {label}
    </span>
  );
}
