import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { DiscoveryBooking } from "@/components/student/DiscoveryBooking";
import { OnboardingForm } from "@/components/student/OnboardingForm";
import { requireStudent } from "@/lib/auth";
import { getDiscoveryState } from "@/lib/discovery";
import { levelLabel, SCENARIO_LABELS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Bienvenue" };

export default async function WelcomePage({
  searchParams,
}: {
  searchParams: Promise<{ "plus-tard"?: string }>;
}) {
  const { id, profile, studentProfile } = await requireStudent();

  if (studentProfile?.onboarded_at) redirect("/app");

  // Inscrit seul, sans appel ni parcours : on commence par l'appel de découverte
  const [discovery, { "plus-tard": later }] = await Promise.all([
    getDiscoveryState(id),
    searchParams,
  ]);

  if (discovery.offer && !later) {
    return (
      <AuthShell
        eyebrow="Étape 2 sur 3"
        step={2}
        title="Réserve ton appel découverte"
        subtitle="Un échange gratuit pour faire le point sur ton niveau et tes objectifs, avec le prof de ton choix."
      >
        <DiscoveryBooking
          teachers={discovery.teachers}
          studentName={profile.full_name ?? ""}
          studentEmail={profile.email}
          defaultTeacherId={studentProfile?.teacher_id}
          continueHref="/bienvenue"
        />
        <Link
          href="/bienvenue?plus-tard=1"
          className="mt-4 block text-center text-[13px] font-bold text-brand-700"
        >
          Je le ferai plus tard
        </Link>
      </AuthShell>
    );
  }

  const supabase = await createClient();
  const { data: path } = await supabase
    .from("learning_paths")
    .select("id, name")
    .eq("student_id", id)
    .eq("is_active", true)
    .maybeSingle();

  const { count } = path
    ? await supabase
        .from("path_sessions")
        .select("id", { count: "exact", head: true })
        .eq("path_id", path.id)
    : { count: 0 };

  const sessionCount = count ?? 0;
  const scenario = studentProfile?.scenario
    ? SCENARIO_LABELS[studentProfile.scenario]
    : null;

  return (
    <AuthShell
      eyebrow="Étape 2 sur 3"
      step={2}
      title="Vérifie ton profil"
      subtitle={
        studentProfile?.initial_level || path
          ? "Rempli par ton enseignant pendant l'appel. Tu peux corriger l'objectif."
          : "Ton prof complétera ton profil pendant l'appel. Dis-nous déjà ce que tu vises."
      }
    >
      <div className="mb-5 flex flex-col gap-1 rounded-[var(--radius-card)] border border-soft-border bg-soft p-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-brand-700">
          Défini avec ton enseignant
        </p>
        <p className="text-sm font-semibold leading-snug text-brand-900">
          Niveau estimé{" "}
          {levelLabel(
            studentProfile?.initial_level ?? null,
            studentProfile?.target_level ?? null,
          )}
        </p>
        <p className="text-[13px] leading-snug text-brand-600">
          {path?.name ?? scenario ?? "Parcours en préparation"}
          {sessionCount ? ` · ${sessionCount} séances d'1 h` : ""}
        </p>
      </div>

      <OnboardingForm
        defaultGoal={
          studentProfile?.goal_in_own_words ?? studentProfile?.goal ?? ""
        }
        defaultAvailability={studentProfile?.availability ?? []}
      />
    </AuthShell>
  );
}
