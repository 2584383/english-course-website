"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const ICONS = {
  home: "M3.5 10.6 12 3.8l8.5 6.8V19a1.6 1.6 0 0 1-1.6 1.6h-4.2v-5.4H9.3v5.4H5.1A1.6 1.6 0 0 1 3.5 19z",
  cal: "M4.5 7.6a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v10.9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2zM4.5 10.4h15M8.6 3.6v3.4m6.8-3.4v3.4",
  users:
    "M9 11.4a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2ZM2.9 20a6.1 6.1 0 0 1 12.2 0M16.2 11.6a3 3 0 1 0 0-6M18 14.4a5.4 5.4 0 0 1 3.2 4.9",
  phone:
    "M6.2 3.9h3l1.5 3.8-2 1.4a11.4 11.4 0 0 0 5.3 5.3l1.4-2 3.8 1.5v3a2 2 0 0 1-2.2 2C10.4 22.3 2.3 14.2 4.2 6.1a2 2 0 0 1 2-2.2Z",
  path: "M6 3.5v4.9a3 3 0 0 0 3 3h6a3 3 0 0 1 3 3v5.1M6 3.5 4 6m2-2.5L8 6m10 14.5 2-2.5m-2 2.5-2-2.5",
  folder:
    "M3.6 6.6a2 2 0 0 1 2-2h3.1l2 2.4h7.7a2 2 0 0 1 2 2v8.4a2 2 0 0 1-2 2H5.6a2 2 0 0 1-2-2z",
  check: "M4.2 6.4h9.4M4.2 12h7.3M4.2 17.6h5.2M14.6 16.9l2.2 2.2 4.2-4.6",
} as const;

export type SidebarCounts = {
  students: number;
  calls: number;
  reports: number;
};

export function Sidebar({ counts }: { counts: SidebarCounts }) {
  const pathname = usePathname();

  const items = [
    { href: "/prof", label: "Aujourd'hui", icon: ICONS.home, exact: true },
    { href: "/prof/planning", label: "Planning", icon: ICONS.cal },
    {
      href: "/prof/etudiants",
      label: "Mes étudiants",
      icon: ICONS.users,
      badge: counts.students,
    },
    {
      href: "/prof/appels",
      label: "Appels de découverte",
      icon: ICONS.phone,
      badge: counts.calls,
    },
    { href: "/prof/parcours", label: "Parcours & templates", icon: ICONS.path },
    { href: "/prof/ressources", label: "Ressources", icon: ICONS.folder },
    {
      href: "/prof/comptes-rendus",
      label: "Comptes-rendus",
      icon: ICONS.check,
      badge: counts.reports,
    },
  ];

  return (
    <nav
      aria-label="Navigation de l'espace enseignant"
      className="flex gap-1 overflow-x-auto border-b border-line bg-white p-2 lg:h-dvh lg:w-64 lg:flex-col lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-4"
    >
      <span className="hidden px-2 pb-4 font-display text-base font-extrabold text-ink lg:block">
        English with Lea
      </span>

      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-none items-center gap-2.5 rounded-[var(--radius-field)] px-3 py-2.5 text-sm font-semibold no-underline transition",
              active
                ? "bg-brand-800 text-white"
                : "text-brand-600 hover:bg-brand-100",
            )}
          >
            <svg
              viewBox="0 0 24 24"
              className="size-5 flex-none"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d={item.icon} />
            </svg>
            <span className="whitespace-nowrap">{item.label}</span>
            {item.badge ? (
              <span
                className={cn(
                  "ml-auto hidden rounded-full px-1.5 py-0.5 text-[10px] font-bold lg:inline",
                  active ? "bg-white/20 text-white" : "bg-brand-200 text-brand-800",
                )}
              >
                {item.badge}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
