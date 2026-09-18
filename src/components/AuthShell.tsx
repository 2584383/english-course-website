import type { ReactNode } from "react";

import Link from "next/link";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col items-center bg-brand-50 px-5 py-10">
      <Link
        href="/"
        className="font-display text-base font-extrabold text-ink no-underline"
      >
        English with Lea
      </Link>

      <div className="mt-8 w-full max-w-sm">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">
          {eyebrow}
        </p>
        <h1 className="mt-2 font-display text-[25px] font-extrabold leading-tight text-ink">
          {title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-muted">{subtitle}</p>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
