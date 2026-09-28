import { CalendlyBooking } from "@/components/student/CalendlyBooking";
import { Empty, Kicker, Panel, PageHeader } from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { publicEnv } from "@/lib/env";
import { getStudentDashboard, getTeacherName } from "@/lib/queries/student";
import { encodeBookingContext } from "@/lib/calendly";
import { firstName, formatSlot } from "@/lib/utils";

export const metadata = { title: "Réserver" };

/**
 * Réservation (wireframe 1d) : la séance est déjà cadrée par le parcours,
 * on entre directement dans le calendrier. Desktop : calendrier à gauche,
 * contexte pédagogique à droite.
 */
export default async function BookingPage() {
  const { profile, studentProfile } = await requireStudent();
  const [{ sessions, nextBooking }, teacherName] = await Promise.all([
    getStudentDashboard(profile.id),
    getTeacherName(studentProfile?.teacher_id),
  ]);

  const teacher = firstName(teacherName) || "Ton enseignant";

  // Prochaine séance réservable du parcours
  const target = sessions.find((session) => session.status === "open");

  if (!profile.booking_enabled) {
    return (
      <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
        <PageHeader title="Réserver" />
        <Empty
          title="Réservation pas encore ouverte"
          description={`${teacher} ouvre l'accès à l'agenda une fois les modalités réglées. Tu recevras un email dès que c'est fait.`}
        />
      </div>
    );
  }

  const context = (
    <>
      {target ? (
        <Panel tone="soft" className="flex flex-col gap-1.5">
          <Kicker tone="brand">Séance {target.position} du parcours</Kicker>
          <p className="font-display text-[17px] font-bold leading-[1.2] text-ink lg:text-[19px]">
            {target.title}
          </p>
          {target.goal ? (
            <p className="text-[13.5px] leading-[1.45] text-body lg:text-sm">
              {target.goal}
            </p>
          ) : null}
          <p className="text-[13px] text-body">1 h · avec {teacher} · Google Meet</p>
        </Panel>
      ) : null}

      {nextBooking ? (
        <Panel className="flex flex-col gap-1.5">
          <Kicker>Déjà réservée</Kicker>
          <p className="text-sm leading-[1.45] text-brand-600">
            {formatSlot(nextBooking.starts_at, nextBooking.ends_at)}. Réserver ici
            ajoute un créneau supplémentaire.
          </p>
        </Panel>
      ) : null}

      <Panel className="flex items-center justify-between gap-3">
        <div>
          <Kicker>Séances restantes</Kicker>
          <p className="mt-1.5 font-display text-lg font-bold text-ink">
            {profile.booking_credits}
          </p>
        </div>
        {studentProfile?.availability?.length ? (
          <p className="max-w-[60%] text-right text-xs leading-snug text-brand-500">
            Tes disponibilités : {studentProfile.availability.join(" · ")}
          </p>
        ) : null}
      </Panel>

      <p className="text-[12.5px] leading-[1.45] text-muted-soft">
        Fuseau Europe/Paris · le lien Google Meet arrive par email.
      </p>
    </>
  );

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
      <PageHeader
        title="Réserver"
        subtitle={
          target
            ? `Séance ${target.position} · ${target.title} · 1 h`
            : "Choisis le créneau qui te convient."
        }
      />

      <div className="grid max-w-[1100px] items-start gap-3.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-5">
        <CalendlyBooking
          url={publicEnv.calendlyUrl}
          studentName={profile.full_name ?? ""}
          studentEmail={profile.email}
          bookingContext={encodeBookingContext(profile.id, target?.id)}
          sessionTitle={target ? `Séance ${target.position} — ${target.title}` : undefined}
        />
        <div className="flex flex-col gap-3.5 lg:gap-4">{context}</div>
      </div>
    </div>
  );
}
