"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { InlineWidget, useCalendlyEventListener } from "react-calendly";

import { Alert, Card } from "@/components/ui";

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
      <Alert tone="error">
        Le calendrier n&apos;est pas encore configuré. Renseigne
        <code className="mx-1">NEXT_PUBLIC_CALENDLY_EVENT_URL</code>
        dans les variables d&apos;environnement.
      </Alert>
    );
  }

  if (scheduled) {
    return (
      <Alert tone="success">
        Créneau réservé. Tu vas recevoir la confirmation et le lien Google Meet
        par email — ta séance apparaîtra ici dans quelques secondes.
      </Alert>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <InlineWidget
        url={url}
        prefill={{ name: studentName, email: studentEmail }}
        utm={{ utmContent: bookingContext, utmCampaign: sessionTitle }}
        pageSettings={{
          backgroundColor: "ffffff",
          primaryColor: "0e474c",
          textColor: "123338",
          hideEventTypeDetails: false,
          hideGdprBanner: true,
        }}
        styles={{ height: "720px", width: "100%" }}
      />
    </Card>
  );
}
