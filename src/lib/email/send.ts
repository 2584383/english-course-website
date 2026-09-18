import "server-only";

import { Resend } from "resend";

import { publicEnv, serverEnv } from "@/lib/env";

/**
 * Emails transactionnels (CDC 4.4 : Resend).
 *
 * Sans clé API configurée, l'envoi est simplement journalisé : l'application
 * reste pleinement utilisable en développement.
 */
let client: Resend | null = null;

function getClient() {
  if (!serverEnv.resendApiKey) return null;
  client ??= new Resend(serverEnv.resendApiKey);
  return client;
}

const siteUrl = () => publicEnv.siteUrl.replace(/\/$/, "");

type Mail = { to: string; subject: string; html: string };

async function send({ to, subject, html }: Mail) {
  const resend = getClient();

  if (!resend) {
    console.info(`[email:simulé] → ${to} · ${subject}`);
    return { simulated: true };
  }

  const { error } = await resend.emails.send({
    from: serverEnv.emailFrom,
    to,
    subject,
    html,
  });

  if (error) {
    console.error("[email] échec de l'envoi", error);
    return { error };
  }

  return { sent: true };
}

/* -------------------------------------------------------------------------- */
/* Gabarit commun                                                             */
/* -------------------------------------------------------------------------- */

function layout({
  title,
  body,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  const cta =
    ctaLabel && ctaHref
      ? `<a href="${ctaHref}" style="display:inline-block;margin-top:24px;background:#f6b268;color:#123338;
           font-weight:700;text-decoration:none;padding:14px 24px;border-radius:12px">${ctaLabel}</a>`
      : "";

  return `<!doctype html>
<html lang="fr"><body style="margin:0;background:#f7fbfa;padding:32px 16px;
  font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:520px;background:#ffffff;
        border:1px solid #e2ece9;border-radius:20px;padding:32px">
        <tr><td>
          <p style="margin:0 0 24px;font-size:15px;font-weight:800;color:#123338">English with Lea</p>
          <h1 style="margin:0 0 12px;font-size:22px;line-height:1.25;color:#123338">${title}</h1>
          <div style="font-size:15px;line-height:1.6;color:#4d6a68">${body}</div>
          ${cta}
        </td></tr>
      </table>
      <p style="max-width:520px;margin:20px auto 0;font-size:12px;line-height:1.5;color:#8ba09e">
        Tu reçois cet email parce que tu suis un parcours sur English with Lea.
        Tu peux ajuster tes rappels depuis <a href="${siteUrl()}/app/profil"
        style="color:#0e474c">ton profil</a>.
      </p>
    </td></tr>
  </table>
</body></html>`;
}

/* -------------------------------------------------------------------------- */
/* Messages                                                                   */
/* -------------------------------------------------------------------------- */

export function sendStudentInvitation({
  to,
  studentName,
  teacherName,
}: {
  to: string;
  studentName: string;
  teacherName: string;
}) {
  return send({
    to,
    subject: "Ton parcours d'anglais t'attend",
    html: layout({
      title: `Bienvenue ${studentName.split(" ")[0]}`,
      body: `<p>${teacherName} a préparé ton parcours après votre appel de découverte.
        Crée ton mot de passe pour accéder à ton espace : tu y retrouveras ta progression,
        tes comptes-rendus de séance et tes devoirs.</p>`,
      ctaLabel: "Activer mon compte",
      ctaHref: `${siteUrl()}/connexion`,
    }),
  });
}

export function sendReportPublished({
  to,
  studentName,
  reportId,
  theme,
}: {
  to: string;
  studentName: string;
  reportId: string;
  theme: string;
}) {
  return send({
    to,
    subject: "Ton compte-rendu de séance est disponible",
    html: layout({
      title: `${studentName.split(" ")[0]}, ton bilan est en ligne`,
      body: `<p>Ton enseignant vient de publier le compte-rendu de votre dernière séance${
        theme ? ` sur <strong>${theme}</strong>` : ""
      }.</p><p>Tu y trouveras ce qui a bien fonctionné et les points à travailler d'ici la prochaine fois.</p>`,
      ctaLabel: "Lire mon compte-rendu",
      ctaHref: `${siteUrl()}/app/comptes-rendus/${reportId}`,
    }),
  });
}

const REMINDER_COPY = {
  d3: {
    subject: "Ta séance d'anglais dans 3 jours",
    lead: "C'est le bon moment pour boucler tes devoirs.",
  },
  d1: {
    subject: "Ta séance d'anglais, c'est demain",
    lead: "Relis l'ordre du jour pour arriver au clair sur l'objectif.",
  },
  h1: {
    subject: "Ta séance d'anglais dans 1 heure",
    lead: "Le lien Google Meet s'ouvre 15 minutes avant le début.",
  },
} as const;

export type ReminderOffset = keyof typeof REMINDER_COPY;

export function sendSessionReminder({
  to,
  studentName,
  when,
  offset,
  meetUrl,
}: {
  to: string;
  studentName: string;
  when: string;
  offset: ReminderOffset;
  meetUrl: string | null;
}) {
  const copy = REMINDER_COPY[offset];

  return send({
    to,
    subject: copy.subject,
    html: layout({
      title: `${studentName.split(" ")[0]}, rendez-vous ${when}`,
      body: `<p>${copy.lead}</p>${
        meetUrl
          ? `<p>Lien de la visio : <a href="${meetUrl}" style="color:#0e474c">${meetUrl}</a></p>`
          : ""
      }`,
      ctaLabel: "Voir ma séance",
      ctaHref: `${siteUrl()}/app`,
    }),
  });
}

export function sendBookingConfirmation({
  to,
  studentName,
  when,
  meetUrl,
}: {
  to: string;
  studentName: string;
  when: string;
  meetUrl: string | null;
}) {
  return send({
    to,
    subject: "Séance confirmée",
    html: layout({
      title: `C'est noté, ${studentName.split(" ")[0]}`,
      body: `<p>Ta séance est confirmée pour le <strong>${when}</strong>.</p>${
        meetUrl
          ? `<p>Elle se tiendra ici : <a href="${meetUrl}" style="color:#0e474c">${meetUrl}</a></p>`
          : "<p>Le lien Google Meet te sera communiqué avant la séance.</p>"
      }<p>Tu recevras des rappels à J-3, J-1 et une heure avant.</p>`,
      ctaLabel: "Voir mon parcours",
      ctaHref: `${siteUrl()}/app`,
    }),
  });
}
