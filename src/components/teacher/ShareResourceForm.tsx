import { shareResource } from "@/app/actions/teacher";

/** Partage une ressource avec un apprenant : elle apparaît alors dans son espace. */
export function ShareResourceForm({
  resourceId,
  students,
}: {
  resourceId: string;
  students: { id: string; name: string }[];
}) {
  return (
    <form
      action={shareResource}
      className="flex flex-wrap items-center gap-2 border-t border-line pt-3"
    >
      <input type="hidden" name="resourceId" value={resourceId} />

      <label className="flex-1">
        <span className="sr-only">Partager avec</span>
        <select
          name="studentId"
          required
          defaultValue=""
          className="w-full rounded-[var(--radius-field)] border border-line bg-white px-3 py-2 text-xs text-ink outline-none"
        >
          <option value="" disabled>
            Partager avec…
          </option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="rounded-[var(--radius-field)] bg-brand-800 px-3.5 py-2 text-xs font-bold text-white"
      >
        Partager
      </button>
    </form>
  );
}
