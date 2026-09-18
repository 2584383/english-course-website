"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ICONS = {
  home: "M3.5 10.6 12 3.8l8.5 6.8V19a1.6 1.6 0 0 1-1.6 1.6h-4.2v-5.4H9.3v5.4H5.1A1.6 1.6 0 0 1 3.5 19z",
  path: "M6 3.5v4.9a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v5.1M6 3.5 4 6m2-2.5L8 6m10 14.5 2-2.5m-2 2.5-2-2.5",
  cal: "M4.5 7.6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10.9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM4.5 10.4h15M8.6 3.6v3.4m6.8-3.4v3.4M12 13.2v4.2m-2.1-2.1h4.2",
  check: "M4.2 6.4h9.4M4.2 12h7.3M4.2 17.6h5.2M14.6 16.9l2.2 2.2 4.2-4.6",
  user: "M12 11.8a3.9 3.9 0 1 0 0-7.8 3.9 3.9 0 0 0 0 7.8ZM4.8 20.2a7.2 7.2 0 0 1 14.4 0",
} as const;

const TABS = [
  { href: "/app", label: "Accueil", icon: ICONS.home, exact: true },
  { href: "/app/parcours", label: "Parcours", icon: ICONS.path },
  { href: "/app/reserver", label: "Réserver", icon: ICONS.cal },
  { href: "/app/devoirs", label: "Devoirs", icon: ICONS.check },
  { href: "/app/profil", label: "Profil", icon: ICONS.user },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigation principale"
      className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-brand-900/20 bg-brand-800"
    >
      <ul className="mx-auto flex max-w-lg">
        {TABS.map((tab) => {
          const active = tab.exact
            ? pathname === tab.href
            : pathname.startsWith(tab.href);

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-bold transition",
                  active ? "text-accent" : "text-white/70",
                )}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="size-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d={tab.icon} />
                </svg>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
