import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { Avatar } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { initials } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/utilisateurs", label: "Utilisateurs" },
  { href: "/prof", label: "Espace enseignant" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await requireAdmin();

  return (
    <div className="min-h-dvh bg-brand-50">
      <header className="border-b border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-5 py-3">
          <span className="font-display text-base font-extrabold text-ink">
            Administration
          </span>

          <nav className="flex flex-1 gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-[var(--radius-field)] px-3 py-2 text-sm font-semibold text-brand-600 no-underline hover:bg-brand-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <Avatar label={initials(profile.full_name)} size={36} />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
            >
              Quitter
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl p-5 lg:p-7">{children}</main>
    </div>
  );
}
