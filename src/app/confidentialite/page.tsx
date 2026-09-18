import { LegalPage } from "@/components/LegalPage";

export const metadata = { title: "Politique de confidentialité" };

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Politique de confidentialité">
      <h2>Données collectées</h2>
      <ul>
        <li>
          <strong>Identité et contact</strong> : nom, adresse email, fuseau
          horaire.
        </li>
        <li>
          <strong>Données pédagogiques</strong> : niveau CECRL estimé,
          objectifs, parcours, comptes-rendus de séance, devoirs et
          auto-évaluations.
        </li>
        <li>
          <strong>Données de réservation</strong> : créneaux réservés, liens de
          visioconférence, historique des séances.
        </li>
        <li>
          <strong>Données techniques</strong> : date de dernière connexion.
        </li>
      </ul>

      <h2>Finalités et base légale</h2>
      <p>
        Ces données sont traitées pour exécuter la prestation pédagogique
        (exécution du contrat) et, pour la conservation des bilans de
        progression, sur la base de votre consentement explicite recueilli à la
        création du compte.
      </p>

      <h2>Sous-traitants</h2>
      <ul>
        <li>
          <strong>Supabase</strong> — hébergement de la base de données, de
          l&apos;authentification et des fichiers (Union européenne).
        </li>
        <li>
          <strong>Vercel</strong> — hébergement de l&apos;application.
        </li>
        <li>
          <strong>Calendly</strong> et <strong>Google Meet</strong> —
          réservation des créneaux et visioconférence.
        </li>
        <li>
          <strong>Resend</strong> — envoi des emails transactionnels.
        </li>
      </ul>

      <h2>Durée de conservation</h2>
      <p>
        Les données sont conservées pendant la durée de la relation pédagogique,
        puis 12 mois, sauf demande de suppression anticipée.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;opposition, de portabilité et d&apos;effacement. Ces droits
        s&apos;exercent directement depuis votre espace, rubrique{" "}
        <em>Profil → Confidentialité</em> : l&apos;export de vos données et la
        suppression intégrale de votre compte y sont disponibles en un clic.
      </p>

      <h2>Sécurité</h2>
      <p>
        Les accès sont cloisonnés par rôle au niveau de la base de données
        (Row Level Security). Les supports de cours sont stockés dans un espace
        privé accessible uniquement via des liens signés à durée limitée. Les
        notes privées de l&apos;enseignant ne sont jamais exposées à
        l&apos;apprenant.
      </p>
    </LegalPage>
  );
}
