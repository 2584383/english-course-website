import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { NotificationToggles } from "@/components/student/NotificationToggles";
import { ActionButton, Chevron, Kicker, Panel } from "@/components/student/kit";
import { AvatarUploader } from "@/components/AvatarUploader";
import { Avatar } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getTeacher } from "@/lib/queries/student";
import { createClient } from "@/lib/supabase/server";
import { SCENARIO_LABELS, cn, firstName, initials, levelLabel } from "@/lib/utils";

export const metadata = { title: "Profil" };

/**
 * Profil (wireframe 2b) : identité, cadre pédagogique posé par l'enseignant
 * (lecture seule), notifications, accès aux données RGPD.
 */
export default async function ProfilePage() {
  const { profile, studentProfile } = await requireStudent();

  const supabase = await createClient();
  const [{ data: prefs }, { data: path }, teacherCard] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle(),
    supabase
      .from("learning_paths")
      .select("name")
      .eq("student_id", profile.id)
      .eq("is_active", true)
      .maybeSingle(),
    getTeacher(studentProfile?.teacher_id),
  ]);

  const teacherName = teacherCard?.name ?? null;
  const teacher = teacherName ? firstName(teacherName) : null;
  const level = levelLabel(
    studentProfile?.initial_level ?? null,
    studentProfile?.target_level ?? null,
  );
  const levelLine =
    studentProfile?.initial_level && studentProfile?.target_level
      ? `Niveau estimé ${studentProfile.initial_level} → objectif ${studentProfile.target_level}`
      : level;
  const pathLine = [
    path?.name ??
      (studentProfile?.scenario ? SCENARIO_LABELS[studentProfile.scenario] : null),
    teacher ? `avec ${teacher}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const goal = studentProfile?.goal_in_own_words ?? studentProfile?.goal;

  return (
    <div className="flex max-w-[1020px] flex-col gap-3.5 animate-pop lg:gap-5">
      <header className="pt-1.5 lg:pt-0">
        <h1 className="font-display text-[22px] font-extrabold leading-[1.15] text-ink lg:text-[27px]">
          {profile.full_name ?? profile.email}
        </h1>
        <p className="truncate text-[13px] leading-snug text-brand-500 lg:mt-[3px] lg:text-[13.5px]">
          {profile.email}
        </p>
      </header>

      <div className="grid items-start gap-3.5 lg:grid-cols-[repeat(auto-fit,minmax(300px,1fr))] lg:gap-4">
        <Panel className="flex flex-col gap-3">
          <Kicker>Ma photo</Kicker>
          <AvatarUploader
            src={profile.avatar_url}
            label={initials(profile.full_name).slice(0, 1)}
            size={64}
          />
          <p className="text-xs leading-[1.4] text-muted">
            Visible uniquement par ton prof. Facultatif.
          </p>
        </Panel>

        <Panel tone="soft" className="flex flex-col gap-1.5">
          <Kicker tone="brand">Mon cadre</Kicker>
          <p className="text-[14.5px] font-semibold leading-[1.45] text-deep lg:text-[15.5px]">
            {levelLine}
          </p>
          {pathLine ? (
            <p className="text-[13.5px] leading-[1.45] text-body lg:text-sm">
              {pathLine}
            </p>
          ) : null}
          {studentProfile?.availability?.length ? (
            <p className="text-[13.5px] leading-[1.45] text-body lg:text-sm">
              Disponibilités : {studentProfile.availability.join(" · ")}
            </p>
          ) : null}
          <div className="mt-[3px] flex items-center gap-2">
            {teacherCard ? (
              <Avatar
                label={initials(teacherCard.name).slice(0, 1)}
                src={teacherCard.avatarUrl}
                size={28}
              />
            ) : null}
            <p className="text-xs leading-[1.4] text-muted">
              Défini avec {teacher ?? "ton enseignant"} pendant l&apos;appel de
              découverte.
            </p>
          </div>
        </Panel>

        {goal ? (
          <Panel className="flex flex-col gap-[7px] lg:gap-2">
            <Kicker>Mon objectif</Kicker>
            <p className="text-[14.5px] leading-normal text-brand-600 lg:text-[15px] lg:leading-[1.55]">
              « {goal} »
            </p>
          </Panel>
        ) : null}
      </div>

      <div className="lg:max-w-[620px]">
        <NotificationToggles
          values={{
            session_reminders: prefs?.session_reminders ?? true,
            email_reminders: prefs?.email_reminders ?? true,
            report_published: prefs?.report_published ?? true,
          }}
        />
      </div>

      <div className="flex flex-col gap-3.5 lg:flex-row lg:flex-wrap lg:gap-3">
        <Link
          href="/app/profil/confidentialite"
          className={cn(
            "flex items-center gap-3 rounded-[18px] border border-line bg-white p-4 no-underline transition hover:border-soft-border",
            "lg:rounded-xl lg:px-[22px] lg:py-3.5",
          )}
        >
          <span className="flex-1 font-display text-[15px] font-bold leading-[1.2] text-ink lg:font-sans lg:text-sm">
            Mes données &amp; confidentialité
          </span>
          <span className="lg:hidden">
            <Chevron />
          </span>
        </Link>

        <form action={signOut}>
          <ActionButton
            type="submit"
            tone="quiet"
            className="w-full rounded-[14px] py-3.5 text-[15px] lg:w-auto lg:rounded-xl lg:px-[22px] lg:text-sm"
          >
            Se déconnecter
          </ActionButton>
        </form>
      </div>
    </div>
  );
}
