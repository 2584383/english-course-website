import Link from "next/link";
import { notFound } from "next/navigation";

import { setBookingAccess } from "@/app/actions/teacher";
import { AssignPathForm } from "@/components/teacher/AssignPathForm";
import { AssignHomeworkForm } from "@/components/teacher/AssignHomeworkForm";
import { PathEditor } from "@/components/teacher/PathEditor";
import { StudentSheetForm } from "@/components/teacher/StudentSheetForm";
import {
  Avatar,
  Badge,
  Button,
  Card,
  Eyebrow,
  Input,
  ProgressBar,
  SectionTitle,
} from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getResources, getTemplates } from "@/lib/queries/teacher";
import { createClient } from "@/lib/supabase/server";
import {
  formatDate,
  formatDateTime,
  initials,
  levelLabel,
  relativeLabel,
} from "@/lib/utils";
import type {
  Assignment,
  Booking,
  LearningPath,
  PathSession,
  Profile,
  SelfEvaluation,
  StudentProfile,
} from "@/lib/database.types";

export const metadata = { title: "Fiche étudiant" };

export default async function StudentSheetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: studentId } = await params;
  const teacher = await requireTeacher();

  const supabase = await createClient();
  const [{ data: profile }, { data: studentProfile }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", studentId).maybeSingle(),
    supabase
      .from("student_profiles")
      .select("*")
      .eq("id", studentId)
      .maybeSingle(),
  ]);

  if (!profile || !studentProfile) notFound();

  const { data: path } = await supabase
    .from("learning_paths")
    .select("*")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .maybeSingle();

  const [sessionsRes, bookingsRes, assignmentsRes, evalsRes, templates, resources] =
    await Promise.all([
      path
        ? supabase
            .from("path_sessions")
            .select("*")
            .eq("path_id", path.id)
            .order("position")
        : Promise.resolve({ data: [] as PathSession[] }),
      supabase
        .from("bookings")
        .select("*")
        .eq("student_id", studentId)
        .order("starts_at", { ascending: false })
        .limit(10),
      supabase
        .from("assignments")
        .select("*")
        .eq("student_id", studentId)
        .order("created_at", { ascending: false }),
      supabase
        .from("self_evaluations")
        .select("*")
        .eq("student_id", studentId)
        .order("submitted_at", { ascending: false }),
      getTemplates(teacher.id),
      getResources(teacher.id),
    ]);

  const sessions = (sessionsRes.data ?? []) as PathSession[];
  const bookings = (bookingsRes.data ?? []) as Booking[];
  const assignments = (assignmentsRes.data ?? []) as Assignment[];
  const evaluations = (evalsRes.data ?? []) as SelfEvaluation[];

  const done = sessions.filter((session) => session.status === "done").length;
  const pct = sessions.length ? Math.round((done / sessions.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <Link href="/prof/etudiants" className="text-xs font-bold text-brand-800">
        ← Mes étudiants
      </Link>

      <Header
        profile={profile as Profile}
        studentProfile={studentProfile as StudentProfile}
        path={(path as LearningPath | null) ?? null}
      />

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col gap-4">
          {path ? (
            <Card className="flex flex-col gap-4">
              <SectionTitle>Parcours · {path.name}</SectionTitle>
              <ProgressBar
                value={pct}
                label={`${done} / ${sessions.length} séances`}
              />
              <PathEditor sessions={sessions} studentId={studentId} />
            </Card>
          ) : (
            <Card className="flex flex-col gap-3">
              <SectionTitle>Aucun parcours actif</SectionTitle>
              <p className="text-sm text-muted">
                Assigne un gabarit pour générer la progression de cet apprenant.
              </p>
              <AssignPathForm studentId={studentId} templates={templates} />
            </Card>
          )}

          <Card className="flex flex-col gap-3">
            <SectionTitle>Constats de l&apos;enseignant</SectionTitle>
            <StudentSheetForm
              studentId={studentId}
              studentProfile={studentProfile as StudentProfile}
            />
          </Card>

          {evaluations.length > 0 ? (
            <Card className="flex flex-col gap-3">
              <SectionTitle>Auto-évaluations</SectionTitle>
              {evaluations.map((evaluation) => (
                <div
                  key={evaluation.id}
                  className="flex flex-col gap-2 rounded-[var(--radius-field)] border border-line p-3"
                >
                  <p className="text-xs font-bold text-brand-700">
                    {formatDate(evaluation.submitted_at)}
                  </p>
                  <dl className="flex flex-col gap-1.5 text-[13px]">
                    {evaluation.answers.map((answer, index) => (
                      <div key={index}>
                        <dt className="text-muted">{answer.question}</dt>
                        <dd className="font-semibold text-ink">
                          {answer.answer}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {evaluation.free_comment ? (
                    <p className="border-t border-line pt-2 text-[13px] italic text-brand-600">
                      « {evaluation.free_comment} »
                    </p>
                  ) : null}
                </div>
              ))}
            </Card>
          ) : null}
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <SectionTitle>Droits de réservation</SectionTitle>
            <p className="text-xs leading-relaxed text-muted">
              La facturation se fait hors plateforme : ouvre l&apos;accès une
              fois les modalités réglées.
            </p>
            <form action={setBookingAccess} className="flex flex-col gap-3">
              <input type="hidden" name="studentId" value={studentId} />
              <label className="flex items-center justify-between gap-3 text-sm">
                <span className="text-brand-600">Réservation ouverte</span>
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={profile.booking_enabled}
                  className="size-5 accent-[#0e474c]"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-brand-600">
                  Séances restantes
                </span>
                <Input
                  type="number"
                  name="credits"
                  min={0}
                  defaultValue={profile.booking_credits}
                />
              </label>
              <Button type="submit" tone="ghost">
                Mettre à jour
              </Button>
            </form>
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle>Séances</SectionTitle>
            {bookings.length === 0 ? (
              <p className="text-sm text-muted">Aucune séance enregistrée.</p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {bookings.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/prof/comptes-rendus/${booking.id}`}
                      className="flex items-center justify-between gap-2 text-[13px] no-underline"
                    >
                      <span className="capitalize text-brand-600">
                        {formatDateTime(booking.starts_at)}
                      </span>
                      <Badge
                        tone={
                          booking.status === "completed"
                            ? "success"
                            : booking.status === "canceled"
                              ? "neutral"
                              : "brand"
                        }
                      >
                        {booking.status === "completed"
                          ? "Faite"
                          : booking.status === "canceled"
                            ? "Annulée"
                            : "Prévue"}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle>Devoirs</SectionTitle>
            {assignments.length > 0 ? (
              <ul className="flex flex-col gap-1.5">
                {assignments.slice(0, 6).map((assignment) => (
                  <li
                    key={assignment.id}
                    className="flex items-start justify-between gap-2 text-[13px]"
                  >
                    <span className="flex-1 text-brand-600">
                      {assignment.title}
                    </span>
                    <Badge
                      tone={assignment.status === "done" ? "success" : "neutral"}
                    >
                      {assignment.status === "done" ? "Fait" : "À faire"}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : null}
            <AssignHomeworkForm studentId={studentId} resources={resources} />
          </Card>

          {path ? (
            <Card className="flex flex-col gap-3">
              <SectionTitle>Changer de parcours</SectionTitle>
              <AssignPathForm studentId={studentId} templates={templates} />
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}

function Header({
  profile,
  studentProfile,
  path,
}: {
  profile: Profile;
  studentProfile: StudentProfile;
  path: LearningPath | null;
}) {
  return (
    <header className="flex flex-wrap items-center gap-4">
      <Avatar label={initials(profile.full_name)} size={56} />
      <div className="flex-1">
        <h1 className="font-display text-2xl font-extrabold text-ink">
          {profile.full_name}
        </h1>
        <p className="text-sm text-muted">
          {profile.email} ·{" "}
          {levelLabel(
            studentProfile.initial_level,
            studentProfile.target_level,
          )}
          {path ? ` · ${path.name}` : ""}
        </p>
      </div>
      <div className="text-right">
        <Eyebrow>Dernière connexion</Eyebrow>
        <p className="text-sm font-semibold text-brand-800">
          {profile.last_seen_at
            ? relativeLabel(profile.last_seen_at)
            : "jamais connecté"}
        </p>
      </div>
    </header>
  );
}
