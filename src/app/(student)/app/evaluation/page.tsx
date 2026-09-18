import { SelfEvaluationForm } from "@/components/student/SelfEvaluationForm";
import { Card, Eyebrow } from "@/components/ui";
import { requireStudent } from "@/lib/auth";

export const metadata = { title: "Auto-évaluation" };

/** Questionnaire guidé de mi-parcours (CDC 3.1). */
const QUESTIONS = [
  {
    question: "Aujourd'hui, prendre la parole en anglais, ça te fait quoi ?",
    options: [
      "Je l'évite encore",
      "J'y vais, mais je prépare tout",
      "Je me lance sans trop préparer",
      "C'est devenu naturel",
    ],
  },
  {
    question: "Qu'est-ce qui te bloque le plus, maintenant ?",
    options: [
      "Trouver mes mots",
      "Les temps et la grammaire",
      "Le stress et le regard des autres",
      "Comprendre mes interlocuteurs",
    ],
  },
  {
    question: "Et pour la suite, tu veux qu'on insiste sur quoi ?",
    options: [
      "Plus de simulations chronométrées",
      "Plus de vocabulaire métier",
      "Plus d'écoute",
      "Garder l'équilibre actuel",
    ],
  },
];

export default async function SelfEvaluationPage() {
  await requireStudent();

  return (
    <div className="flex flex-col gap-4 animate-pop">
      <header>
        <h1 className="font-display text-[25px] font-extrabold text-ink">
          Où tu en es
        </h1>
        <p className="text-[13px] text-muted">
          3 questions, une minute. Tes réponses aident ton enseignant à
          réajuster la suite du parcours.
        </p>
      </header>

      <Card tone="soft" className="flex flex-col gap-1.5">
        <Eyebrow>Confidentialité</Eyebrow>
        <p className="text-[13px] leading-relaxed text-brand-900">
          Seul ton enseignant lit ces réponses. Rien n&apos;est partagé ailleurs.
        </p>
      </Card>

      <SelfEvaluationForm questions={QUESTIONS} />
    </div>
  );
}
