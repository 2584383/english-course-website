import { Card, EmptyState, SectionTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AdminOverview, TeacherActivity } from "@/lib/database.types";

export const metadata = { title: "Vue d'ensemble" };

export default async function AdminOverviewPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ data: overview }, { data: activity }] = await Promise.all([
    supabase.from("admin_overview").select("*").maybeSingle(),
    supabase.from("teacher_activity").select("*"),
  ]);

  const stats = (overview as AdminOverview | null) ?? {
    students: 0,
    teachers: 0,
    active_students: 0,
    lessons_completed: 0,
    lessons_upcoming: 0,
    reports_published: 0,
    active_last_7_days: 0,
  };

  const teachers = (activity ?? []) as TeacherActivity[];

  const tiles = [
    { label: "Leçons terminées", value: stats.lessons_completed },
    { label: "Séances à venir", value: stats.lessons_upcoming },
    { label: "Étudiants actifs", value: stats.active_students },
    { label: "Enseignants", value: stats.teachers },
    { label: "Comptes-rendus publiés", value: stats.reports_published },
    { label: "Actifs sur 7 jours", value: stats.active_last_7_days },
  ];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Vue d&apos;ensemble
        </h1>
        <p className="text-sm text-muted">
          Volume de leçons et activité globale du service.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="flex flex-col gap-1">
            <span className="font-display text-3xl font-extrabold text-brand-800">
              {tile.value}
            </span>
            <span className="text-xs font-semibold uppercase tracking-wide text-muted">
              {tile.label}
            </span>
          </Card>
        ))}
      </div>

      <section className="flex flex-col gap-3">
        <SectionTitle>Activité par enseignant</SectionTitle>

        {teachers.length === 0 ? (
          <EmptyState
            title="Aucun enseignant"
            description="Crée un premier compte enseignant depuis la console utilisateurs."
          />
        ) : (
          <Card className="overflow-x-auto p-0">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-muted">
                  <th className="p-3 font-semibold">Enseignant</th>
                  <th className="p-3 font-semibold">Étudiants</th>
                  <th className="p-3 font-semibold">Leçons faites</th>
                  <th className="p-3 font-semibold">CR en attente</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr
                    key={teacher.teacher_id}
                    className="border-b border-line last:border-0"
                  >
                    <td className="p-3">
                      <span className="block font-semibold text-ink">
                        {teacher.full_name ?? "—"}
                      </span>
                      <span className="block text-xs text-muted">
                        {teacher.email}
                      </span>
                    </td>
                    <td className="p-3 text-brand-600">
                      {teacher.student_count}
                    </td>
                    <td className="p-3 text-brand-600">
                      {teacher.lessons_completed}
                    </td>
                    <td className="p-3 text-brand-600">
                      {teacher.reports_pending}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}
      </section>
    </div>
  );
}
