"use client";

import { useCallback, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/** Événement Chromium (Android, Chrome/Edge desktop) absent des types DOM. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "android" | "ios";

/** Délai avant l'apparition, pour ne pas couvrir la page dès son ouverture. */
const SHOW_DELAY_MS = 2500;
/** Durée d'affichage avant disparition automatique (sauf si l'on interagit). */
const AUTO_HIDE_MS: Record<Platform, number> = { android: 12000, ios: 20000 };
/** Après un refus explicite (croix), on ne repropose pas avant une semaine. */
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SNOOZE_KEY = "ewl-install-snoozed-until";
/** Déjà proposé dans cet onglet : on attend la prochaine visite. */
const SEEN_KEY = "ewl-install-seen";

function readStorage(storage: () => Storage, key: string) {
  try {
    return storage().getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(storage: () => Storage, key: string, value: string) {
  try {
    storage().setItem(key, value);
  } catch {
    // Navigation privée ou stockage bloqué : la bannière reste fonctionnelle.
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function detectIOS() {
  const ua = navigator.userAgent;
  // iPadOS se présente comme un Mac : on le reconnaît à son écran tactile.
  return (
    /iPhone|iPad|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function isIOSSafari() {
  return !/CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(navigator.userAgent);
}

function shouldOffer() {
  if (isStandalone()) return false;
  if (readStorage(() => sessionStorage, SEEN_KEY)) return false;
  const snoozedUntil = Number(readStorage(() => localStorage, SNOOZE_KEY));
  return !(snoozedUntil > Date.now());
}

/**
 * Bannière qui propose d'installer la PWA à l'ouverture du site :
 * bouton d'installation natif sur Android, mode d'emploi pas à pas sur iOS.
 * Elle disparaît d'elle-même au bout de quelques secondes.
 */
export function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const [safari, setSafari] = useState(true);

  useEffect(() => {
    if (!shouldOffer()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const show = (p: Platform) => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        if (p === "ios") setSafari(isIOSSafari());
        setPlatform(p);
        setVisible(true);
        writeStorage(() => sessionStorage, SEEN_KEY, "1");
      }, SHOW_DELAY_MS);
    };

    if (detectIOS()) {
      show("ios");
      return () => clearTimeout(timer);
    }

    // Android : le navigateur annonce que l'app est installable.
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      show("android");
    };
    const onInstalled = () => {
      setVisible(false);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    writeStorage(() => localStorage, SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
  }, []);

  const install = useCallback(async () => {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    // L'événement ne peut servir qu'une fois.
    setDeferred(null);
    setVisible(false);
    if (outcome === "dismissed") {
      writeStorage(() => localStorage, SNOOZE_KEY, String(Date.now() + SNOOZE_MS));
    }
  }, [deferred]);

  if (!visible || !platform) return null;
  if (platform === "android" && !deferred) return null;

  // Une fois le mode d'emploi ouvert, on laisse le temps de le suivre.
  const autoHide = !stepsOpen;

  return (
    <aside
      aria-label="Installer l'application"
      aria-live="polite"
      className={cn(
        "group animate-pop fixed inset-x-3 z-50 mx-auto max-w-md overflow-hidden rounded-[var(--radius-card)] border border-line bg-white shadow-[var(--shadow-float)]",
        "top-[calc(env(safe-area-inset-top,0px)+0.75rem)]",
        "lg:inset-x-auto lg:right-6 lg:top-auto lg:bottom-6 lg:w-[380px]",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/icons/icon-192.png"
          alt=""
          width={44}
          height={44}
          className="size-11 shrink-0 rounded-xl"
        />
        <div className="min-w-0 flex-1">
          <p className="font-display text-[15px] font-bold leading-snug text-ink">
            Installe English with Lea
          </p>
          <p className="mt-0.5 text-[13px] leading-snug text-body">
            {platform === "android"
              ? "Ajoute l'application sur ton écran d'accueil pour y accéder en un geste."
              : "Ajoute l'application sur ton écran d'accueil en trois étapes."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {platform === "android" ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex items-center gap-2 rounded-[var(--radius-field)] bg-brand-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-900"
              >
                <DownloadIcon className="size-4" />
                Installer
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setStepsOpen((open) => !open)}
                aria-expanded={stepsOpen}
                aria-controls="install-ios-steps"
                className="inline-flex items-center gap-2 rounded-[var(--radius-field)] bg-brand-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-900"
              >
                {stepsOpen ? "Masquer les étapes" : "Voir comment faire"}
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={dismiss}
          aria-label="Fermer et ne plus proposer pendant 7 jours"
          className="-mr-1 -mt-1 grid size-8 shrink-0 place-items-center rounded-full text-muted transition hover:bg-brand-100 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden className="size-4">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      {platform === "ios" && stepsOpen && (
        <ol
          id="install-ios-steps"
          className="space-y-3 border-t border-line bg-brand-50 px-4 py-4 text-[13px] leading-snug text-body"
        >
          {!safari && (
            <li className="rounded-[var(--radius-field)] bg-accent-soft px-3 py-2 text-accent-ink">
              Pour un résultat optimal, ouvre ce site dans <strong>Safari</strong>.
            </li>
          )}
          <Step n={1} icon={<ShareIcon className="size-5" />}>
            Touche le bouton <strong>Partager</strong> (carré avec une flèche vers le
            haut), dans la barre de Safari. Si tu ne le vois pas, touche d&apos;abord{" "}
            <strong>•••</strong>.
          </Step>
          <Step n={2} icon={<AddIcon className="size-5" />}>
            Fais défiler la liste et touche <strong>Sur l&apos;écran d&apos;accueil</strong>.
          </Step>
          <Step n={3} icon={<CheckIcon className="size-5" />}>
            Laisse <strong>Ouvrir en tant qu&apos;app web</strong> activé si l&apos;option
            apparaît, puis touche <strong>Ajouter</strong> en haut à droite.
          </Step>
        </ol>
      )}

      {/* Compte à rebours visible ; se met en pause au survol ou au focus. */}
      {autoHide && (
        <div aria-hidden className="h-1 bg-brand-100">
          <div
            onAnimationEnd={() => setVisible(false)}
            style={{ animationDuration: `${AUTO_HIDE_MS[platform]}ms` }}
            className="h-full origin-left animate-countdown bg-accent group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]"
          />
        </div>
      )}
    </aside>
  );
}

function Step({
  n,
  icon,
  children,
}: {
  n: number;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex items-start gap-3">
      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-800 text-[11px] font-bold text-white">
        {n}
      </span>
      <span className="min-w-0 flex-1 pt-0.5">{children}</span>
      <span className="shrink-0 text-brand-700">{icon}</span>
    </li>
  );
}

function Icon({ d, className }: { d: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      <path d={d} />
    </svg>
  );
}

const ShareIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M12 3v12M8 7l4-4 4 4M7 10H5.5A1.5 1.5 0 0 0 4 11.5v8A1.5 1.5 0 0 0 5.5 21h13a1.5 1.5 0 0 0 1.5-1.5v-8a1.5 1.5 0 0 0-1.5-1.5H17" />
);
const AddIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M12 8v8M8 12h8M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z" />
);
const CheckIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M5 12.5l4.5 4.5L19 7.5" />
);
const DownloadIcon = ({ className }: { className?: string }) => (
  <Icon className={className} d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" />
);
