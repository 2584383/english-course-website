"use client";

import { useOptimistic, useTransition } from "react";

import {
  setNotificationPreference,
  type PreferenceKey,
} from "@/app/actions/student";
import { Kicker, Panel } from "@/components/student/kit";
import { cn } from "@/lib/utils";

const PREFERENCES: { key: PreferenceKey; label: string }[] = [
  { key: "session_reminders", label: "Rappels de séance par notification" },
  { key: "email_reminders", label: "Rappels par email" },
  { key: "report_published", label: "Nouveau compte-rendu publié" },
];

/** Interrupteurs du profil : chaque bascule est enregistrée immédiatement. */
export function NotificationToggles({
  values,
}: {
  values: Record<PreferenceKey, boolean>;
}) {
  const [, startTransition] = useTransition();
  const [optimistic, setOptimistic] = useOptimistic(
    values,
    (state, { key, value }: { key: PreferenceKey; value: boolean }) => ({
      ...state,
      [key]: value,
    }),
  );

  const toggle = (key: PreferenceKey) => {
    const value = !optimistic[key];
    startTransition(async () => {
      setOptimistic({ key, value });
      await setNotificationPreference(key, value);
    });
  };

  return (
    <Panel className="flex flex-col gap-3.5 lg:gap-4">
      <Kicker>Notifications</Kicker>
      <ul className="flex flex-col gap-3.5 lg:gap-4">
        {PREFERENCES.map(({ key, label }) => {
          const on = optimistic[key];
          return (
            <li key={key}>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                onClick={() => toggle(key)}
                className="flex w-full items-center gap-3 text-left"
              >
                <span className="flex-1 text-sm font-semibold leading-[1.3] text-brand-600 lg:text-[14.5px] lg:leading-[1.35]">
                  {label}
                </span>
                <span
                  aria-hidden
                  className={cn(
                    "flex h-[26px] w-11 flex-none rounded-[14px] p-[3px] transition-colors",
                    on ? "justify-end bg-brand-800" : "justify-start bg-[#d3e3df]",
                  )}
                >
                  <span className="size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(14,71,76,.25)]" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
