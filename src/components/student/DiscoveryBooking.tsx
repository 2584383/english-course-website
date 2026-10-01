"use client";

import { useState, useTransition } from "react";

import { InlineWidget, useCalendlyEventListener } from "react-calendly";

import { confirmDiscoveryBooking } from "@/app/actions/student";
import { ActionLink, DoneBadge, Kicker, Panel } from "@/components/student/kit";
import { Alert } from "@/components/ui";
import { cn, formatDateTime, initials } from "@/lib/utils";

export type DiscoveryTeacher = {
  id: string;
  name: string;
  bio: string | null;
  discoveryUrl: string;
  /** `utm_content` calculé côté serveur (`encodeDiscoveryContext`). */
  utmContent: string;
};

/**
 * Choix du prof puis réservation de l'appel de découverte dans son Calendly.
 * L'appel est enregistré dès la confirmation du widget ; le webhook (contexte
 * `discovery:` dans `utm_content`) prend le relais si l'onglet est fermé trop tôt.
 */
export function DiscoveryBooking({
  teachers,
  studentName,
  studentEmail,
  defaultTeacherId,
  continueHref,
}: {
  teachers: DiscoveryTeacher[];
  studentName: string;
  studentEmail: string;
  defaultTeacherId?: string | null;
  continueHref: string;
}) {
  const [teacherId, setTeacherId] = useState<string | null>(
    defaultTeacherId && teachers.some((t) => t.id === defaultTeacherId)
      ? defaultTeacherId
      : teachers.length === 1
        ? teachers[0].id
        : null,
  );
  const [booked, setBooked] = useState<{ when: string | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  const teacher = teachers.find((t) => t.id === teacherId) ?? null;

  useCalendlyEventListener({
    onEventScheduled: (event) => {
      if (!teacher) return;
      const eventUri = event.data.payload.event.uri;
      startSaving(async () => {
        const result = await confirmDiscoveryBooking(teacher.id, eventUri);
        // L'appel est réservé côté Calendly quoi qu'il arrive : on confirme,
        // en signalant seulement un éventuel retard d'affichage.
        if (result.error) setError(result.error);
        setBooked({ when: result.scheduledAt ?? null });
      });
    },
  });

  if (booked) {
    return (
      <div className="flex flex-col gap-4 animate-pop">
        <div className="flex flex-col items-center gap-3 text-center">
          <DoneBadge />
          <p className="font-display text-2xl font-extrabold leading-[1.15] text-ink">
            Appel réservé
          </p>
          <p className="text-sm leading-[1.45] text-body">
            {booked.when ? `${formatDateTime(booked.when)} · ` : ""}avec{" "}
            {teacher?.name}
          </p>
        </div>
        {error ? (
          <Alert tone="error">
            Ton appel est bien réservé, mais il mettra quelques minutes à
            apparaître chez ton prof.
          </Alert>
        ) : null}
        <Panel className="flex flex-col gap-2">
          <Kicker>Et ensuite ?</Kicker>
          <p className="text-sm leading-[1.45] text-body">
            Le lien de l&apos;appel est dans l&apos;email de confirmation de
            Calendly. Après votre échange, ton prof prépare ton parcours sur
            mesure.
          </p>
        </Panel>
        <ActionLink href={continueHref}>Continuer</ActionLink>
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
              <span className="flex size-10 flex-none items-center justify-center rounded-full bg-brand-800 font-display text-sm font-extrabold text-white">
                {initials(t.name)}
              </span>
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
              prefill={{ name: studentName, email: studentEmail }}
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
          {saving ? (
            <p className="text-xs text-muted" role="status">
              Enregistrement de ton appel…
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
