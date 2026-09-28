import { SelfEvaluationForm } from "@/components/student/SelfEvaluationForm";
import { BackLink } from "@/components/student/kit";
import { requireStudent } from "@/lib/auth";
import { getTeacherName } from "@/lib/queries/student";
import { firstName } from "@/lib/utils";

export const metadata = { title: "Auto-évaluation" };

/** Questionnaire guidé de mi-parcours (CDC 3.1). */
const QUESTIONS = [
  {
    question:
      "Aujourd'hui, prendre la parole en anglais en réunion, ça te fait quoi ?",
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
  const { studentProfile } = await requireStudent();
  const teacherName = await getTeacherName(studentProfile?.teacher_id);

  return (
    <div className="flex flex-col gap-4 animate-pop lg:mx-auto lg:max-w-[680px] lg:gap-5 lg:pt-5">
      <h1 className="sr-only">Auto-évaluation de mi-parcours</h1>
      <BackLink href="/app">Plus tard</BackLink>
      <SelfEvaluationForm
        questions={QUESTIONS}
        teacher={firstName(teacherName) || "ton enseignant"}
      />
    </div>
  );
}
