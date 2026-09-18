import { assignTeacher, changeRole, setAccountStatus } from "@/app/actions/admin";
import { CreateUserForm } from "@/components/admin/CreateUserForm";
import { DeleteUserButton } from "@/components/admin/DeleteUserButton";
import { Avatar, Badge, Card, SectionTitle } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, initials, relativeLabel } from "@/lib/utils";
import type { Profile, StudentProfile } from "@/lib/database.types";

export const metadata = { title: "Utilisateurs" };

const ROLE_LABELS = {
  super_admin: "Super administrateur",
  teacher: "Enseignant",
  student: "Étudiant",
} as const;

const STATUS_TONE = {
  active: "success",
  invited: "warn",
  suspended: "neutral",
} as const;

export default async function UsersPage() {
  await requireAdmin();

  const supabase = await createClient();
  const [{ data: profiles }, { data: studentProfiles }] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase.from("student_profiles").select("id, teacher_id"),
  ]);

  const users = (profiles ?? []) as Profile[];
  const teachers = users.filter((user) => user.role === "teacher");
  const assignments = new Map(
    ((studentProfiles ?? []) as Pick<StudentProfile, "id" | "teacher_id">[]).map(
      (row) => [row.id, row.teacher_id],
    ),
  );

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">
          Utilisateurs
        </h1>
        <p className="text-sm text-muted">
          {users.length} compte{users.length > 1 ? "s" : ""} · création,
          suspension, affectation
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <section className="flex flex-col gap-2">
          {users.map((user) => (
            <Card key={user.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar label={initials(user.full_name)} size={40} />

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">
                    {user.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-muted">{user.email}</p>
                </div>

                <Badge tone="brand">{ROLE_LABELS[user.role]}</Badge>
                <Badge tone={STATUS_TONE[user.status]}>
                  {user.status === "active"
                    ? "Actif"
                    : user.status === "invited"
                      ? "Invité"
                      : "Suspendu"}
                </Badge>

                <span className="text-xs text-muted-soft">
                  {user.last_seen_at
                    ? `vu ${relativeLabel(user.last_seen_at)}`
                    : `créé le ${formatDate(user.created_at)}`}
                </span>
              </div>

              <div className="flex flex-wrap items-end gap-2 border-t border-line pt-3">
                <form action={setAccountStatus}>
                  <input type="hidden" name="userId" value={user.id} />
                  <input
                    type="hidden"
                    name="status"
                    value={user.status === "suspended" ? "active" : "suspended"}
                  />
                  <button
                    type="submit"
                    className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
                  >
                    {user.status === "suspended" ? "Réactiver" : "Suspendre"}
                  </button>
                </form>

                <form action={changeRole} className="flex items-end gap-2">
                  <input type="hidden" name="userId" value={user.id} />
                  <label className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                      Rôle
                    </span>
                    <select
                      name="role"
                      defaultValue={user.role}
                      className="rounded-[var(--radius-field)] border border-line bg-white px-2.5 py-2 text-xs"
                    >
                      {Object.entries(ROLE_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="submit"
                    className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
                  >
                    Appliquer
                  </button>
                </form>

                {user.role === "student" ? (
                  <form action={assignTeacher} className="flex items-end gap-2">
                    <input type="hidden" name="studentId" value={user.id} />
                    <label className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted">
                        Enseignant
                      </span>
                      <select
                        name="teacherId"
                        defaultValue={assignments.get(user.id) ?? ""}
                        className="rounded-[var(--radius-field)] border border-line bg-white px-2.5 py-2 text-xs"
                      >
                        <option value="">Non affecté</option>
                        {teachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.full_name ?? teacher.email}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="submit"
                      className="rounded-[var(--radius-field)] border border-line px-3 py-2 text-xs font-bold text-brand-600"
                    >
                      Affecter
                    </button>
                  </form>
                ) : null}

                <DeleteUserButton
                  userId={user.id}
                  name={user.full_name ?? user.email}
                />
              </div>
            </Card>
          ))}
        </section>

        <aside>
          <Card className="flex flex-col gap-3">
            <SectionTitle>Créer un compte</SectionTitle>
            <p className="text-xs leading-relaxed text-muted">
              L&apos;utilisateur reçoit une invitation par email pour définir
              son mot de passe.
            </p>
            <CreateUserForm />
          </Card>
        </aside>
      </div>
    </div>
  );
}
