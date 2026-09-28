import type { ReactNode } from "react";

import Link from "next/link";

import { cn } from "@/lib/utils";

const STEPS = [
  "Créer ton compte",
  "Vérifier ton profil",
  "Accéder à ton parcours",
] as const;

/**
 * Coquille des écrans d'entrée (prototypes hi-fi, onboarding).
 * Mobile : colonne unique, segments de progression en haut.
 * Desktop : panneau vert à gauche avec les étapes, formulaire à droite.
 */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  step,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Étape de l'onboarding (1 à 3) ; absent pour la connexion. */
  step?: 1 | 2 | 3;
  children: ReactNode;
}) {
  const current = step ? step - 1 : -1;

  return (
    <main className="flex min-h-dvh bg-white">
      <aside className="hidden w-[400px] flex-none flex-col justify-between bg-brand-800 px-10 py-11 text-white lg:flex">
        <Link href="/" className="flex items-center gap-2.5 no-underline">
          <span className="flex size-[30px] flex-none items-center justify-center rounded-[10px] bg-white font-display text-sm font-extrabold text-brand-800">
            L
          </span>
          <span className="font-display text-[15px] font-extrabold leading-tight text-white">
            English with Lea
          </span>
        </Link>

        <div className="flex flex-col gap-3.5">
          <p className="font-display text-[28px] font-extrabold leading-[1.25] text-white">
            {step ? "Bienvenue — ton parcours t'attend." : "Content de te revoir."}
          </p>
          <p className="text-[15px] leading-[1.6] text-[#bfdde2]">
            {step
              ? "Après votre appel de découverte, ton enseignant a préparé un parcours sur mesure. Trois étapes et tu y es."
              : "Retrouve ton parcours, tes comptes-rendus et tes prochaines séances."}
          </p>
        </div>

        {step ? (
          <ol className="flex flex-col gap-3">
            {STEPS.map((label, index) => (
              <li key={label} className="flex items-center gap-[11px]">
                <span
                  className={cn(
                    "flex size-[22px] flex-none items-center justify-center rounded-full border-[1.5px] text-[11px] font-bold",
                    index < current
                      ? "border-white bg-white text-brand-800"
                      : index === current
                        ? "border-white text-white"
                        : "border-white/40 text-white",
                  )}
                >
                  {index < current ? "✓" : index + 1}
                </span>
                <span
                  className={cn(
                    "text-[13.5px] font-semibold",
                    index <= current ? "text-white" : "text-[#cfe0d9]/75",
                  )}
                >
                  {label}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <span />
        )}
      </aside>

      <div className="flex min-w-0 flex-1 items-start justify-center px-5 py-8 lg:items-center lg:px-10 lg:py-12">
        <div className="w-full max-w-sm animate-pop lg:max-w-[480px]">
          <Link
            href="/"
            className="mb-6 block text-center font-display text-base font-extrabold text-ink no-underline lg:hidden"
          >
            English with Lea
          </Link>

          {step ? (
            <div className="mb-4 flex gap-1.5 lg:hidden" aria-hidden>
              {STEPS.map((label, index) => (
                <span
                  key={label}
                  className={cn(
                    "h-[5px] flex-1 rounded",
                    index <= current ? "bg-brand-800" : "bg-track",
                  )}
                />
              ))}
            </div>
          ) : null}

          <p className="text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-brand-500">
            {eyebrow}
          </p>
          <h1 className="mt-2 font-display text-[25px] font-extrabold leading-[1.2] text-ink lg:text-[27px]">
            {title}
          </h1>
          <p className="mt-1.5 text-sm leading-normal text-brand-500 lg:text-[14.5px]">
            {subtitle}
          </p>

          <div className="mt-[18px]">{children}</div>
        </div>
      </div>
    </main>
  );
}
