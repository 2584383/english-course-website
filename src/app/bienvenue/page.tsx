import { redirect } from "next/navigation";

import { AuthShell } from "@/components/AuthShell";
import { OnboardingForm } from "@/components/student/OnboardingForm";
import { requireStudent } from "@/lib/auth";
import { levelLabel, SCENARIO_LABELS } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Bienvenue" };

export default async function WelcomePage() {
  const { id, studentProfile } = await requireStudent();

  if (studentProfile?.onboarded_at) redirect("/app");

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
      title="Vérifie ton profil"
      subtitle="Rempli par ton enseignant pendant l'appel. Tu peux corriger l'objectif."
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
