import Link from "next/link";
import { notFound } from "next/navigation";

import { ReportEditor } from "@/components/teacher/ReportEditor";
import { Badge, Card, Eyebrow } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import type { AgendaItem } from "@/lib/database.types";

export const metadata = { title: "Rédiger un compte-rendu" };

export default async function ReportEditorPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;
  await requireTeacher();

  const supabase = await createClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", bookingId)
    .maybeSingle();

  if (!booking) notFound();

  const [{ data: student }, { data: report }, { data: session }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("id", booking.student_id)
        .maybeSingle(),
      supabase
        .from("session_reports")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle(),
      booking.path_session_id
        ? supabase
            .from("path_sessions")
            .select("*")
            .eq("id", booking.path_session_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const agenda = (session?.agenda ?? []) as AgendaItem[];

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/prof/comptes-rendus"
        className="text-xs font-bold text-brand-800"
      >
        ← Comptes-rendus
      </Link>

      <header className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            {student?.full_name ?? "Étudiant"}
          </h1>
          <p className="text-sm capitalize text-muted">
            {formatDateTime(booking.starts_at)}
            {session ? ` · ${session.position}. ${session.title}` : ""}
          </p>
        </div>
        {report?.status === "published" ? (
          <Badge tone="success">Publié</Badge>
        ) : report ? (
          <Badge tone="warn">Brouillon</Badge>
        ) : null}
      </header>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <ReportEditor
          bookingId={bookingId}
          studentId={booking.student_id}
          report={report ?? null}
          defaultTheme={session?.goal ?? ""}
        />

        <aside className="flex flex-col gap-4">
          {session?.goal ? (
            <Card tone="soft" className="flex flex-col gap-1.5">
              <Eyebrow>Objectif prévu</Eyebrow>
              <p className="text-sm leading-relaxed text-brand-900">
                {session.goal}
              </p>
            </Card>
          ) : null}

          {agenda.length > 0 ? (
            <Card className="flex flex-col gap-2">
              <Eyebrow>Ordre du jour</Eyebrow>
              <ul className="flex flex-col gap-1.5">
                {agenda.map((item, index) => (
                  <li key={index} className="flex gap-2 text-[13px]">
                    <span className="w-14 flex-none font-bold text-brand-700">
                      {item.duration}
                    </span>
                    <span className="text-muted">{item.label}</span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          <Card className="flex flex-col gap-2">
            <Eyebrow>Rappel</Eyebrow>
            <p className="text-[13px] leading-relaxed text-muted">
              Publier le compte-rendu marque la séance comme faite, déverrouille
              la suivante dans le parcours et notifie l&apos;apprenant par email.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
