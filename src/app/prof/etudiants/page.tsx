import Link from "next/link";

import { InviteStudentForm } from "@/components/teacher/InviteStudentForm";
import { Avatar, Badge, Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { getTeacherStudents } from "@/lib/queries/teacher";
import { formatDate, initials, levelLabel, relativeLabel } from "@/lib/utils";

export const metadata = { title: "Mes étudiants" };

export default async function StudentsPage() {
  const { id } = await requireTeacher();
  const students = await getTeacherStudents(id);

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink">
            Mes étudiants
          </h1>
          <p className="text-sm text-muted">
            {students.length} apprenant{students.length > 1 ? "s" : ""} suivi
            {students.length > 1 ? "s" : ""}
          </p>
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-2">
          {students.length === 0 ? (
            <EmptyState
              title="Aucun étudiant pour l'instant"
              description="Invite ton premier apprenant après l'appel de découverte."
            />
          ) : (
            students.map((row) => (
              <Link
                key={row.profile.id}
                href={`/prof/etudiants/${row.profile.id}`}
                className="block no-underline"
              >
                <Card className="flex flex-wrap items-center gap-3 transition hover:border-brand-300">
                  <Avatar label={initials(row.profile.full_name)} size={40} />

                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-bold text-ink">
                      {row.profile.full_name}
                      {row.pendingReport ? (
                        <Badge tone="accent">CR à rédiger</Badge>
                      ) : null}
                      {!row.profile.booking_enabled ? (
                        <Badge tone="warn">Réservation fermée</Badge>
                      ) : null}
                    </p>
                    <p className="text-xs text-muted">
                      {levelLabel(
                        row.studentProfile.initial_level,
                        row.studentProfile.target_level,
                      )}
                      {row.path ? ` · ${row.path.name}` : ""}
                    </p>
                  </div>

                  <div className="w-28 flex-none">
                    <div className="h-1.5 overflow-hidden rounded-full bg-brand-200">
                      <div
                        className="h-full rounded-full bg-brand-800"
                        style={{ width: `${row.progress.pct}%` }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] text-muted-soft">
                      {row.progress.done} / {row.progress.total}
                    </p>
                  </div>

                  <div className="w-36 flex-none text-right">
                    <p className="text-xs font-semibold text-brand-800">
                      {row.nextBooking
                        ? formatDate(row.nextBooking.starts_at, {
                            weekday: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "Aucune séance"}
                    </p>
                    <p className="text-[11px] text-muted-soft">
                      {row.profile.last_seen_at
                        ? `vu ${relativeLabel(row.profile.last_seen_at)}`
                        : "jamais connecté"}
                    </p>
                  </div>
                </Card>
              </Link>
            ))
          )}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Inviter un étudiant</SectionTitle>
            <p className="text-xs leading-relaxed text-muted">
              Le compte est créé et rattaché à toi. L&apos;apprenant reçoit un
              email pour définir son mot de passe.
            </p>
            <InviteStudentForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
