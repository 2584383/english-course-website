import { signOut } from "@/app/actions/auth";
import { Sidebar } from "@/components/teacher/Sidebar";
import { Avatar } from "@/components/ui";
import { requireTeacher, touchLastSeen } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { initials } from "@/lib/utils";

export default async function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, profile } = await requireTeacher();
  await touchLastSeen(id);

  const supabase = await createClient();
  const [students, calls, reports] = await Promise.all([
    supabase
      .from("student_profiles")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id),
    supabase
      .from("discovery_calls")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id)
      .in("status", ["to_qualify", "scheduled", "confirmed", "thinking"]),
    supabase
      .from("session_reports")
      .select("id", { count: "exact", head: true })
      .eq("teacher_id", id)
      .eq("status", "draft"),
  ]);

  return (
    <div className="min-h-dvh bg-brand-50 lg:flex">
      <Sidebar
        counts={{
          students: students.count ?? 0,
          calls: calls.count ?? 0,
          reports: reports.count ?? 0,
        }}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-end gap-3 border-b border-line bg-white px-5 py-3">
          <div className="text-right">
            <p className="text-sm font-bold text-ink">{profile.full_name}</p>
            <p className="text-xs text-muted-soft">
              {profile.role === "super_admin" ? "Administrateur" : "Enseignant"}
            </p>
          </div>
          <Avatar label={initials(profile.full_name)} size={38} />
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
            >
              Quitter
            </button>
          </form>
        </header>

        <main className="min-w-0 flex-1 p-5 lg:p-7">{children}</main>
      </div>
    </div>
  );
}
