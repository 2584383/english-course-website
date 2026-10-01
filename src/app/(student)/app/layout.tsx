import { redirect } from "next/navigation";

import { BottomNav } from "@/components/student/BottomNav";
import { StudentSidebar } from "@/components/student/StudentSidebar";
import { requireStudent, touchLastSeen } from "@/lib/auth";
import { getPathProgress } from "@/lib/queries/student";
import { initials } from "@/lib/utils";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { id, profile, studentProfile } = await requireStudent();

  // L'onboarding doit être terminé avant d'entrer dans l'application
  if (!studentProfile?.onboarded_at) redirect("/bienvenue");

  const [progress] = await Promise.all([
    getPathProgress(id),
    touchLastSeen(id),
  ]);

  return (
    <div className="min-h-dvh bg-white lg:flex">
      <StudentSidebar
        name={profile.full_name ?? profile.email}
        email={profile.email}
        initial={initials(profile.full_name, "?").slice(0, 1)}
        progress={progress}
      />

      {/* Mobile : colonne de 390 px, marges 20 px. Desktop : 32 / 40 px. */}
      <main className="min-w-0 flex-1 px-5 pb-32 pt-4 lg:px-10 lg:pb-11 lg:pt-8">
        <div className="mx-auto max-w-lg lg:mx-0 lg:max-w-[1180px]">
          {children}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}
