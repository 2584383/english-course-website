import Link from "next/link";

import { signOut } from "@/app/actions/auth";
import { updateNotificationPreferences } from "@/app/actions/student";
import {
  Avatar,
  Button,
  Card,
  Eyebrow,
  SectionTitle,
} from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { SCENARIO_LABELS, initials, levelLabel } from "@/lib/utils";

export const metadata = { title: "Profil" };

const PREFERENCES = [
  { name: "session_reminders", label: "Rappels de séance par notification" },
  { name: "email_reminders", label: "Rappels par email (J-3, J-1, H-1)" },
  { name: "report_published", label: "Nouveau compte-rendu publié" },
] as const;

export default async function ProfilePage() {
  const { profile, studentProfile } = await requireStudent();

  const supabase = await createClient();
  const [{ data: prefs }, { data: teacher }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle(),
    studentProfile?.teacher_id
      ? supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", studentProfile.teacher_id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header className="flex items-center gap-3">
        <Avatar label={initials(profile.full_name)} size={54} />
        <div>
          <h1 className="font-display text-xl font-extrabold text-ink">
            {profile.full_name}
          </h1>
          <p className="text-[13px] text-muted">{profile.email}</p>
        </div>
      </header>

      <Card tone="soft" className="flex flex-col gap-2">
        <Eyebrow>Mon suivi</Eyebrow>
        <dl className="flex flex-col gap-1.5 text-[13px]">
          <Row
            label="Niveau"
            value={levelLabel(
              studentProfile?.initial_level ?? null,
              studentProfile?.target_level ?? null,
            )}
          />
          {studentProfile?.scenario ? (
            <Row
              label="Objectif"
              value={SCENARIO_LABELS[studentProfile.scenario]}
            />
          ) : null}
          {teacher ? (
            <Row label="Enseignant" value={teacher.full_name ?? teacher.email} />
          ) : null}
          {studentProfile?.availability?.length ? (
            <Row
              label="Disponibilités"
              value={studentProfile.availability.join(" · ")}
            />
          ) : null}
        </dl>
      </Card>

      <Card className="flex flex-col gap-3">
        <SectionTitle>Notifications</SectionTitle>
        <form action={updateNotificationPreferences} className="flex flex-col gap-3">
          {PREFERENCES.map((pref) => (
            <label
              key={pref.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-brand-600">{pref.label}</span>
              <input
                type="checkbox"
                name={pref.name}
                defaultChecked={prefs?.[pref.name] ?? true}
                className="size-5 flex-none accent-[#0e474c]"
              />
            </label>
          ))}
          <Button type="submit" tone="ghost">
            Enregistrer mes préférences
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-2">
        <SectionTitle>Mes données</SectionTitle>
        <p className="text-[13px] leading-relaxed text-muted">
          Consulte les consentements donnés, exporte tes données ou demande la
          suppression complète de ton compte.
        </p>
        <Link
          href="/app/profil/confidentialite"
          className="text-sm font-bold text-brand-800"
        >
          Confidentialité et suppression →
        </Link>
      </Card>

      <form action={signOut}>
        <Button type="submit" tone="ghost" className="w-full">
          Se déconnecter
        </Button>
      </form>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-brand-600">{label}</dt>
      <dd className="text-right font-semibold text-brand-900">{value}</dd>
    </div>
  );
}
