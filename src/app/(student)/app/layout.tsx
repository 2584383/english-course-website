import { redirect } from "next/navigation";

import { BottomNav } from "@/components/student/BottomNav";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { requireStudent, touchLastSeen } from "@/lib/auth";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, studentProfile } = await requireStudent();

  // L'onboarding doit être terminé avant d'entrer dans l'application
  if (!studentProfile?.onboarded_at) redirect("/bienvenue");

  await touchLastSeen(id);

  return (
    <div className="min-h-dvh bg-brand-50">
      <div className="mx-auto max-w-lg px-4 pb-28 pt-5">{children}</div>
      <BottomNav />
      <ServiceWorkerRegistration />
    </div>
  );
}
