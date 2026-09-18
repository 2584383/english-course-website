import { CalendlyBooking } from "@/components/student/CalendlyBooking";
import { Alert, Card, EmptyState, Eyebrow } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { getStudentDashboard } from "@/lib/queries/student";
import { encodeBookingContext } from "@/lib/calendly";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Réserver" };

export default async function BookingPage() {
  const { profile, studentProfile } = await requireStudent();
  const { sessions, nextBooking } = await getStudentDashboard(profile.id);

  // Prochaine séance réservable du parcours
  const target = sessions.find((session) => session.status === "open");

  if (!profile.booking_enabled) {
    return (
      <EmptyState
        title="Réservation pas encore ouverte"
        description="Ton enseignant ouvre l'accès à l'agenda une fois les modalités réglées. Tu recevras un email dès que c'est fait."
      />
    );
  }

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          Réserver une séance
        </h1>
        <p className="text-[13px] text-muted">
          {target
            ? `Prochaine séance : ${target.position}. ${target.title}`
            : "Choisis le créneau qui te convient."}
        </p>
      </header>

      {nextBooking ? (
        <Alert tone="info">
          Tu as déjà une séance le{" "}
          <strong className="capitalize">
            {formatDateTime(nextBooking.starts_at)}
          </strong>
          . Réserver ici ajoutera un créneau supplémentaire.
        </Alert>
      ) : null}

      {profile.booking_credits > 0 ? (
        <Card tone="soft" className="flex items-center justify-between gap-3">
          <div>
            <Eyebrow>Séances restantes</Eyebrow>
            <p className="mt-1 font-display text-lg font-bold text-ink">
              {profile.booking_credits}
            </p>
          </div>
          {studentProfile?.availability?.length ? (
            <p className="max-w-[55%] text-right text-xs text-brand-600">
              Tes disponibilités : {studentProfile.availability.join(" · ")}
            </p>
          ) : null}
        </Card>
      ) : null}

      <CalendlyBooking
        url={publicEnv.calendlyUrl}
        studentName={profile.full_name ?? ""}
        studentEmail={profile.email}
        bookingContext={encodeBookingContext(profile.id, target?.id)}
        sessionTitle={target?.title}
      />
    </div>
  );
}
