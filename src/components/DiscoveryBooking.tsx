"use client";

import { useState } from "react";

import { InlineWidget, useCalendlyEventListener } from "react-calendly";

import { ActionLink, DoneBadge, Kicker, Panel } from "@/components/student/kit";
import { Avatar } from "@/components/ui";
import { cn, initials } from "@/lib/utils";

export type DiscoveryTeacher = {
  id: string;
  name: string;
  bio: string | null;
  avatarUrl: string | null;
  discoveryUrl: string;
  /** `utm_content` calculé côté serveur (`encodeDiscoveryContext`). */
  utmContent: string;
};

/**
 * Choix du prof puis réservation de l'appel de découverte dans son Calendly,
 * sans compte. Le webhook Calendly (contexte `decouverte:` dans `utm_content`)
 * inscrit l'appel dans le CRM du prof choisi.
 */
export function DiscoveryBooking({ teachers }: { teachers: DiscoveryTeacher[] }) {
  const [teacherId, setTeacherId] = useState<string | null>(
    teachers.length === 1 ? teachers[0].id : null,
  );
  const [booked, setBooked] = useState(false);

  const teacher = teachers.find((t) => t.id === teacherId) ?? null;

  useCalendlyEventListener({ onEventScheduled: () => setBooked(true) });

  if (booked) {
    return (
      <div className="flex flex-col gap-4 animate-pop">
        <div className="flex flex-col items-center gap-3 text-center">
          <DoneBadge />
          <p className="font-display text-2xl font-extrabold leading-[1.15] text-ink">
            Appel réservé
          </p>
          {teacher ? (
            <p className="text-sm leading-[1.45] text-body">avec {teacher.name}</p>
          ) : null}
        </div>
        <Panel className="flex flex-col gap-2">
          <Kicker>Et ensuite ?</Kicker>
          <p className="text-sm leading-[1.45] text-body">
            Tu reçois un email de confirmation avec le lien de l&apos;appel. Si
            tu décides de te lancer après votre échange, ton prof t&apos;envoie
            une invitation pour créer ton espace et découvrir ton parcours.
          </p>
        </Panel>
        <ActionLink href="/" tone="quiet">
          Retour à l&apos;accueil
        </ActionLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-xs font-bold text-brand-600">
          {teachers.length > 1 ? "Choisis ton prof" : "Ton prof"}
        </legend>
        {teachers.map((t) => {
          const on = t.id === teacherId;
          return (
            <label
              key={t.id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-[var(--radius-card)] border p-3.5 transition",
                on
                  ? "border-brand-800 bg-soft"
                  : "border-line bg-white hover:border-soft-border",
              )}
            >
              <input
                type="radio"
                name="teacher"
                value={t.id}
                checked={on}
                onChange={() => setTeacherId(t.id)}
                className="sr-only"
              />
              <Avatar label={initials(t.name)} src={t.avatarUrl} size={48} />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-bold text-ink">
                  {t.name}
                </span>
                {t.bio ? (
                  <span className="mt-0.5 block text-[13px] leading-snug text-body">
                    {t.bio}
                  </span>
                ) : null}
              </span>
              <span
                aria-hidden
                className={cn(
                  "mt-1 size-4 flex-none rounded-full border-2",
                  on ? "border-brand-800 bg-brand-800 shadow-[inset_0_0_0_2px_white]" : "border-box",
                )}
              />
            </label>
          );
        })}
      </fieldset>

      {teacher ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-brand-600">
            Choisis un créneau avec {teacher.name}
          </p>
          <Panel className="overflow-hidden p-0 lg:p-0">
            <InlineWidget
              key={teacher.id}
              url={teacher.discoveryUrl}
              utm={{
                utmContent: teacher.utmContent,
                utmCampaign: "appel-decouverte",
              }}
              pageSettings={{
                backgroundColor: "ffffff",
                primaryColor: "0e474c",
                textColor: "123338",
                hideGdprBanner: true,
              }}
              styles={{ height: "680px", width: "100%" }}
            />
          </Panel>
        </div>
      ) : null}
    </div>
  );
}
