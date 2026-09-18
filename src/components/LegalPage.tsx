import type { ReactNode } from "react";

import Link from "next/link";

/** Gabarit commun aux pages légales (CGU, confidentialité). */
export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-5 py-10">
      <Link href="/" className="text-xs font-bold text-brand-800">
        ← Accueil
      </Link>

      <h1 className="mt-5 font-display text-3xl font-extrabold text-ink">
        {title}
      </h1>
      <p className="mt-1 text-xs text-muted-soft">
        Dernière mise à jour :{" "}
        {new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric",
        }).format(new Date())}
      </p>

      <div
        className={[
          "mt-8 flex flex-col gap-4 text-sm leading-relaxed text-brand-600",
          "[&_h2]:mt-4 [&_h2]:font-display [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-ink",
          "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5",
          "[&_strong]:text-brand-900",
        ].join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
