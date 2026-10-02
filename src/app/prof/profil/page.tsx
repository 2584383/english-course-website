import { AvatarUploader } from "@/components/AvatarUploader";
import { TeacherProfileForm } from "@/components/teacher/TeacherProfileForm";
import { Badge, Card, SectionTitle } from "@/components/ui";
import { requireTeacher } from "@/lib/auth";
import { initials } from "@/lib/utils";

export const metadata = { title: "Mon profil" };

export default async function TeacherProfilePage() {
  const { profile } = await requireTeacher();
  const listed = Boolean(profile.discovery_url);

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-2xl font-extrabold text-ink">Mon profil</h1>
        <p className="text-sm text-muted">
          Ce que voient les nouveaux inscrits quand ils choisissent leur prof.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Card className="flex flex-col gap-3">
            <SectionTitle>Photo de profil</SectionTitle>
            <AvatarUploader
              src={profile.avatar_url}
              label={initials(profile.full_name)}
            />
            <p className="text-xs text-muted">
              Visible par tes étudiants et par les nouveaux inscrits qui
              choisissent leur prof.
            </p>
          </Card>

          <Card className="flex flex-col gap-3">
            <SectionTitle
              action={
                listed ? (
                  <Badge tone="success">Proposé aux inscrits</Badge>
                ) : (
                  <Badge tone="warn">Non proposé</Badge>
                )
              }
            >
              Appel de découverte
            </SectionTitle>
            <TeacherProfileForm bio={profile.bio} discoveryUrl={profile.discovery_url} />
          </Card>
        </div>

        <aside>
          <Card tone="soft" className="flex flex-col gap-2 text-xs leading-relaxed text-brand-600">
            <SectionTitle>Comment ça marche</SectionTitle>
            <p>
              Crée dans Calendly un événement dédié à l&apos;appel de découverte
              (par exemple 20 min), puis colle ici son lien public.
            </p>
            <p>
              Après leur inscription, les apprenants choisissent leur prof et
              réservent ce créneau. L&apos;appel apparaît alors dans
              « Appels de découverte » et l&apos;apprenant t&apos;est rattaché.
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
