import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge, ButtonLink, Card, Eyebrow } from "@/components/ui";
import { requireStudent } from "@/lib/auth";
import { getStudentDashboard } from "@/lib/queries/student";
import { createClient } from "@/lib/supabase/server";
import { MODULE_LABELS, formatDateTime } from "@/lib/utils";
import type { AgendaItem } from "@/lib/database.types";

export const metadata = { title: "Séance" };

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ position: string }>;
}) {
  const { position } = await params;
  const { profile } = await requireStudent();
  const { sessions } = await getStudentDashboard(profile.id);

  const session = sessions.find((s) => s.position === Number(position));
  if (!session || session.status === "locked") notFound();

  const supabase = await createClient();
  const [{ data: booking }, { data: report }] = await Promise.all([
    supabase
      .from("bookings")
      .select("*")
      .eq("path_session_id", session.id)
      .eq("student_id", profile.id)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("student_reports")
      .select("id")
      .eq("student_id", profile.id)
      .eq("session_position", session.position)
      .maybeSingle(),
  ]);

  const agenda = (session.agenda ?? []) as AgendaItem[];

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <Link href="/app/parcours" className="text-xs font-bold text-brand-800">
        ← Mon parcours
      </Link>

      <header className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Badge tone="brand">Séance {session.position}</Badge>
          <Badge>{MODULE_LABELS[session.module]}</Badge>
        </div>
        <h1 className="font-display text-[25px] font-extrabold leading-tight text-ink">
          {session.title}
        </h1>
        {booking ? (
          <p className="text-[13px] capitalize text-muted">
            {formatDateTime(booking.starts_at)}
          </p>
        ) : null}
      </header>

      {session.goal ? (
        <Card tone="soft" className="flex flex-col gap-1.5">
          <Eyebrow>Objectif de la séance</Eyebrow>
          <p className="text-sm leading-relaxed text-brand-900">
            {session.goal}
          </p>
        </Card>
      ) : null}

      {agenda.length > 0 ? (
        <Card className="flex flex-col gap-3">
          <Eyebrow>Ordre du jour</Eyebrow>
          <ol className="flex flex-col gap-2.5">
            {agenda.map((item, index) => (
              <li key={index} className="flex gap-3">
                <span className="w-14 flex-none text-xs font-bold text-brand-700">
                  {item.duration}
                </span>
                <span className="flex-1 text-[13px] leading-relaxed text-brand-600">
                  {item.label}
                </span>
              </li>
            ))}
          </ol>
        </Card>
      ) : null}

      <div className="flex flex-col gap-2">
        {report ? (
          <ButtonLink href={`/app/comptes-rendus/${report.id}`} tone="primary">
            Lire le compte-rendu
          </ButtonLink>
        ) : null}
        {session.status === "open" ? (
          <ButtonLink href="/app/reserver" tone="accent">
            Réserver cette séance
          </ButtonLink>
        ) : null}
      </div>
    </div>
  );
}
