"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { STUDENT_TABS, TabIcon } from "@/components/student/nav";
import { cn } from "@/lib/utils";

/** Barre d'onglets mobile (prototype 390 px) — masquée en desktop. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-brand-800 bg-brand-800 lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-5 px-1.5 pb-3.5 pt-2">
        {STUDENT_TABS.map((tab) => {
          const active = tab.match(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-[5px] py-[3px] text-[10.5px] font-bold no-underline transition",
                  active ? "text-accent" : "text-white/70",
                )}
              >
                <TabIcon d={tab.icon} className="size-[22px]" />
                {tab.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
