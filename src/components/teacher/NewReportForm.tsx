"use client";

import { useActionState, useState } from "react";

import { createReportSession } from "@/app/actions/teacher";
import type { ActionState } from "@/app/actions/auth";
import { Alert, Button, Card, Field, Input, Select } from "@/components/ui";

const EMPTY: ActionState = {};

const DURATIONS = [30, 45, 60, 90];

export type ReportStudentOption = {
  id: string;
  name: string;
  sessions: { id: string; label: string }[];
};

export function NewReportForm({
  students,
  defaultStudentId,
  defaultDate,
  defaultTime,
}: {
  students: ReportStudentOption[];
  defaultStudentId?: string;
  defaultDate: string;
  defaultTime: string;
}) {
  const [state, action, pending] = useActionState(createReportSession, EMPTY);
  const [studentId, setStudentId] = useState(
    defaultStudentId ?? students[0]?.id ?? "",
  );
  const sessions = students.find((s) => s.id === studentId)?.sessions ?? [];

  // La date saisie est locale au navigateur : on l'envoie en ISO (UTC).
  function submit(formData: FormData) {
    const date = formData.get("date");
    const time = formData.get("time");
    const local = new Date(`${date}T${time}`);
    formData.set(
      "startsAt",
      Number.isNaN(local.getTime()) ? "" : local.toISOString(),
    );
    action(formData);
  }

  return (
    <form action={submit} className="flex flex-col gap-4">
      {state.error ? <Alert tone="error">{state.error}</Alert> : null}

      <Card className="flex flex-col gap-3">
        <Field label="Apprenant">
          <Select
            name="studentId"
            required
            value={studentId}
            onChange={(event) => setStudentId(event.target.value)}
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Date">
            <Input
              type="date"
              name="date"
              required
              defaultValue={defaultDate}
              max={defaultDate}
            />
          </Field>
          <Field label="Heure de début">
            <Input type="time" name="time" required defaultValue={defaultTime} />
          </Field>
          <Field label="Durée">
            <Select name="duration" defaultValue="60">
              {DURATIONS.map((minutes) => (
                <option key={minutes} value={minutes}>
                  {minutes} min
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field
          label="Séance du parcours"
          hint={
            sessions.length > 0
              ? "À la publication, elle passe en « faite » et la suivante se déverrouille."
              : "Aucun parcours actif pour cet apprenant."
          }
        >
          <Select
            key={studentId}
            name="pathSessionId"
            defaultValue={sessions[0]?.id ?? ""}
            disabled={sessions.length === 0}
          >
            <option value="">Hors parcours</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.label}
              </option>
            ))}
          </Select>
        </Field>
      </Card>

      <Button type="submit" tone="accent" disabled={pending || !studentId}>
        {pending ? "Création…" : "Continuer vers la rédaction"}
      </Button>
    </form>
  );
}
