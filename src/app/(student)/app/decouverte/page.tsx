import { DiscoveryBooking } from "@/components/student/DiscoveryBooking";
import { Empty, Kicker, Panel, PageHeader } from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { getDiscoveryState } from "@/lib/discovery";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Appel découverte" };

/** Appel de découverte reporté à l'inscription (« Je le ferai plus tard »). */
export default async function DiscoveryPage() {
  const { profile, studentProfile } = await requireStudent();
  const discovery = await getDiscoveryState(profile.id);

  return (
    <div className="flex flex-col gap-3.5 animate-pop lg:gap-5">
      <PageHeader
        title="Appel découverte"
        subtitle="Un échange gratuit pour faire le point sur ton niveau et tes objectifs."
      />

      <div className="max-w-[640px]">
        {discovery.call ? (
          <Panel tone="soft" className="flex flex-col gap-1.5">
            <Kicker tone="brand">Appel réservé</Kicker>
            <p className="font-display text-[17px] font-bold leading-[1.2] text-ink">
              {discovery.call.scheduledAt
                ? formatDateTime(discovery.call.scheduledAt)
                : "Créneau confirmé par email"}
            </p>
            {discovery.call.teacherName ? (
              <p className="text-[13.5px] text-body">avec {discovery.call.teacherName}</p>
            ) : null}
          </Panel>
        ) : discovery.offer ? (
          <DiscoveryBooking
            teachers={discovery.teachers}
            studentName={profile.full_name ?? ""}
            studentEmail={profile.email}
            defaultTeacherId={studentProfile?.teacher_id}
            continueHref="/app"
          />
        ) : (
          <Empty
            title="Pas d'appel à réserver"
            description="Ton prof te suit déjà : réserve directement tes séances depuis l'onglet Réserver."
          />
        )}
      </div>
    </div>
  );
}
