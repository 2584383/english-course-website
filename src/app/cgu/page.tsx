import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Conditions générales d'utilisation" };

export default function TermsPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <h2>1. Objet</h2>
      <p>
        La plateforme met à disposition des apprenants un espace de réservation
        de séances de cours d&apos;anglais oral et de suivi pédagogique. Elle est
        éditée par l&apos;enseignant qui y propose ses prestations.
      </p>

      <h2>2. Facturation</h2>
      <p>
        Aucun paiement ne transite par la plateforme. La facturation et le
        règlement des séances sont convenus directement avec l&apos;enseignant,
        hors application. L&apos;accès à la réservation est ouvert manuellement
        par l&apos;enseignant une fois les modalités réglées.
      </p>

      <h2>3. Réservation, report et annulation</h2>
      <p>
        Les créneaux sont proposés via Calendly selon les règles de
        disponibilité définies par l&apos;enseignant. Un cours peut être
        reprogrammé ou annulé depuis le lien reçu par email, dans les délais
        indiqués sur l&apos;événement.
      </p>

      <h2>4. Engagements de l&apos;apprenant</h2>
      <p>
        L&apos;apprenant s&apos;engage à fournir des informations exactes, à ne
        pas partager ses identifiants et à utiliser les ressources pédagogiques
        pour son usage personnel uniquement.
      </p>

      <h2>5. Disponibilité du service</h2>
      <p>
        L&apos;éditeur met en œuvre les moyens raisonnables pour assurer la
        disponibilité du service, sans garantie d&apos;absence
        d&apos;interruption. Les séances se tiennent en visioconférence via
        Google Meet.
      </p>

      <h2>6. Résiliation</h2>
      <p>
        L&apos;apprenant peut supprimer son compte à tout moment depuis son
        profil. L&apos;enseignant peut suspendre un compte en cas de
        non-respect des présentes conditions.
      </p>
    </LegalPage>
  );
}
