"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { STUDENT_TABS, TabIcon } from "@/components/student/nav";
import { cn } from "@/lib/utils";

/** Navigation latérale permanente du prototype desktop (≥ 1024 px). */
export function StudentSidebar({
  name,
  email,
  initial,
  progress,
}: {
  name: string;
  email: string;
  initial: string;
  progress: { pct: number } | null;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-[236px] flex-none flex-col justify-between bg-brand-800 px-4 py-[22px] lg:flex">
      <div className="flex flex-col gap-[22px]">
        <Link
          href="/app"
          className="flex items-center gap-2.5 px-1.5 no-underline"
        >
          <span className="flex size-[30px] flex-none items-center justify-center rounded-[10px] bg-accent font-display text-sm font-extrabold text-ink">
            L
          </span>
          <span className="font-display text-[15px] font-extrabold leading-tight text-white">
            English with Lea
          </span>
        </Link>

        <nav aria-label="Navigation principale">
          <ul className="flex flex-col gap-[3px]">
            {STUDENT_TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <li key={tab.href}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-[11px] rounded-xl px-3 py-2.5 text-sm font-bold no-underline transition",
                      active
                        ? "bg-accent text-ink"
                        : "text-white/80 hover:bg-white/[.08]",
                    )}
                  >
                    <TabIcon
                      d={tab.icon}
                      className={cn(
                        "size-[19px] flex-none",
                        !active && "text-white/60",
                      )}
                    />
                    {tab.long}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-3">
        {progress ? (
          <div className="flex flex-col gap-[7px] rounded-[14px] border border-white/[.18] bg-white/[.07] p-[13px]">
            <p className="text-[9.5px] font-bold uppercase leading-none tracking-[0.12em] text-white/65">
              Ma progression
            </p>
            <div className="h-[7px] overflow-hidden rounded-[5px] bg-white/[.18]">
              <div
                className="h-full rounded-[5px] bg-accent transition-[width] duration-500"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
            <p className="text-xs font-semibold tabular-nums text-white">
              {progress.pct} % du parcours
            </p>
          </div>
        ) : null}

        <Link
          href="/app/profil"
          className="flex items-center gap-2.5 rounded-xl px-1.5 py-2 no-underline transition hover:bg-white/[.08]"
        >
          <span className="flex size-8 flex-none items-center justify-center rounded-full border border-soft-border bg-soft font-display text-[13px] font-extrabold text-brand-800">
            {initial}
          </span>
          <span className="min-w-0">
            <span className="block font-display text-[13px] font-bold leading-tight text-white">
              {name}
            </span>
            <span className="block truncate text-[11px] leading-snug text-white/60">
              {email}
            </span>
          </span>
        </Link>
      </div>
    </aside>
  );
}
