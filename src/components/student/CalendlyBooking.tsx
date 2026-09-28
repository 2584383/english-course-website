"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InlineWidget, useCalendlyEventListener } from "react-calendly";

import { ActionLink, DoneBadge, Kicker, Panel } from "@/components/student/kit";

/**
 * Widget Calendly intégré (CDC 3.1).
 *
 * Calendly reste maître des règles de disponibilité, des fuseaux horaires et
 * de la génération du lien Google Meet. La réservation est ensuite répliquée
 * dans Supabase par le webhook `invitee.created`, `utm_content` servant à
 * rattacher l'événement à l'étudiant et à la séance du parcours.
 */
export function CalendlyBooking({
  url,
  studentName,
  studentEmail,
  bookingContext,
  sessionTitle,
}: {
  url: string;
  studentName: string;
  studentEmail: string;
  bookingContext: string;
  sessionTitle?: string;
}) {
  const router = useRouter();
  const [scheduled, setScheduled] = useState(false);

  useCalendlyEventListener({
    onEventScheduled: () => {
      setScheduled(true);
      // Laisse au webhook le temps d'écrire la réservation avant de recharger
      setTimeout(() => router.refresh(), 2500);
    },
  });

  if (!url) {
    return (
      <Panel tone="danger" className="flex flex-col gap-2">
        <Kicker tone="danger">Calendrier indisponible</Kicker>
        <p className="text-sm leading-normal text-danger-body">
          Le calendrier n&apos;est pas encore configuré. Renseigne
          <code className="mx-1">NEXT_PUBLIC_CALENDLY_EVENT_URL</code>
          dans les variables d&apos;environnement.
        </p>
      </Panel>
    );
  }

  if (scheduled) {
    return (
      <div className="flex flex-col gap-4 pt-6 animate-pop lg:mx-auto lg:max-w-[620px] lg:gap-[18px] lg:pt-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <DoneBadge />
          <p className="font-display text-2xl font-extrabold leading-[1.15] text-ink lg:text-[27px]">
            C&apos;est réservé
          </p>
          {sessionTitle ? (
            <p className="text-sm leading-[1.45] text-body lg:text-[15px]">
              {sessionTitle} · 1 h
            </p>
          ) : null}
        </div>
        <Panel className="flex flex-col gap-[11px]">
          <Kicker>Visio</Kicker>
          <p className="text-sm leading-[1.45] text-body lg:text-[14.5px] lg:leading-normal">
            Ton lien Google Meet est dans l&apos;email de confirmation. Il
            apparaîtra aussi sur ton accueil dans quelques secondes.
          </p>
        </Panel>
        <ActionLink href="/app">Retour à l&apos;accueil</ActionLink>
      </div>
    );
  }

  return (
    <Panel className="overflow-hidden p-0 lg:p-0">
      <InlineWidget
        url={url}
        prefill={{ name: studentName, email: studentEmail }}
        utm={{ utmContent: bookingContext, utmCampaign: sessionTitle }}
        pageSettings={{
          backgroundColor: "ffffff",
          primaryColor: "0e474c",
          textColor: "123338",
          hideEventTypeDetails: true,
          hideGdprBanner: true,
        }}
        styles={{ height: "700px", width: "100%" }}
      />
    </Panel>
  );
}
