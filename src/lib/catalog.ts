import type {
  AgendaItem,
  HomeworkItem,
  ModuleKind,
  Scenario,
} from "@/lib/database.types";

/*
 * Catalogue de gabarits intégrés à la plateforme.
 * L'enseignant en copie un dans ses gabarits (« Utiliser ce modèle »),
 * l'ajuste, puis l'attribue. Séances d'1 h ; les devoirs d'une séance sont
 * ceux à préparer AVANT elle (distribués à la publication du compte-rendu
 * de la séance précédente).
 */

export type CatalogSession = {
  title: string;
  module: ModuleKind;
  goal: string;
  agenda: AgendaItem[];
  homework: HomeworkItem[];
};

export type CatalogTemplate = {
  key: string;
  name: string;
  scenario: Scenario;
  level: string;
  description: string;
  sessions: CatalogSession[];
};

function s(
  title: string,
  module: ModuleKind,
  goal: string,
  agenda: [string, string][],
  homework: [string, string?][] = [],
): CatalogSession {
  return {
    title,
    module,
    goal,
    agenda: agenda.map(([duration, label]) => ({ duration, label })),
    homework: homework.map(([hwTitle, instructions]) => ({
      title: hwTitle,
      instructions: instructions ?? null,
    })),
  };
}

/* -------------------------------------------------------------------------- */
/* Entretien d'embauche — 13 séances (parcours des prototypes)                */
/* -------------------------------------------------------------------------- */

const JOB_INTERVIEW: CatalogTemplate = {
  key: "job-interview",
  name: "Job Interview — 13 séances",
  scenario: "job_interview",
  level: "B1 → B2",
  description:
    "Préparer un entretien d'embauche en anglais : se présenter, raconter ses expériences avec la méthode STAR, gérer les questions pièges et négocier.",
  sessions: [
    s(
      "Se présenter en 90 secondes",
      "simulation",
      "Te présenter en 90 secondes, avec un fil clair : qui tu es, ce que tu as fait, ce que tu cherches.",
      [
        ["10 min", "Diagnostic : ton pitch actuel, à froid"],
        ["20 min", "Structure passé / présent / futur et expressions clés"],
        ["20 min", "3 pitchs chronométrés, feedback après chacun"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Lister 3 expériences dont tu es fier",
          "Une ligne par expérience, en français ou en anglais : on s'en sert pour construire ton pitch.",
        ],
      ],
    ),
    s(
      "Écoute : entretiens réels",
      "listening",
      "Comprendre les questions d'un recruteur natif du premier coup, même posées vite.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["25 min", "Extraits d'entretiens réels : écoute active et reformulation"],
        ["20 min", "Relever les formulations types des recruteurs"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Enregistrer ton pitch de 90 s",
          "Un seul enregistrement audio, sans le réécouter dix fois : on l'analyse ensemble.",
        ],
      ],
    ),
    s(
      "Méthode STAR",
      "simulation",
      "Raconter une expérience professionnelle avec la méthode STAR : Situation, Task, Action, Result.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "La méthode STAR et ses connecteurs"],
        ["30 min", "Construire et dire 2 récits STAR"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Préparer une situation où tu as résolu un problème",
          "Quelques mots-clés seulement, pas un texte rédigé.",
        ],
      ],
    ),
    s(
      "Parler de ses échecs",
      "simulation",
      "Répondre à « Tell me about a failure » avec honnêteté, en montrant ce que tu en as appris.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Les pièges de la question et le vocabulaire de l'apprentissage"],
        ["30 min", "Simulations : échec, faiblesse, conflit"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "2 exemples au format STAR",
          "Un exemple où ça a marché, un où ça a échoué — le second est souvent le plus utile.",
        ],
      ],
    ),
    s(
      "Phone calls & visios",
      "listening",
      "Gérer un entretien téléphonique ou en visio : faire répéter, reformuler, relancer sans stress.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Expressions pour clarifier et gagner du temps"],
        ["25 min", "Mise en situation : appel de pré-sélection"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Redire à voix haute les formulations de recruteurs relevées",
          "Celles de la séance 2 : entraîne-toi à les comprendre et à y répondre.",
        ],
      ],
    ),
    s(
      "Vocabulaire du recrutement",
      "vocabulary",
      "Maîtriser les 30 termes clés des offres d'emploi et des entretiens RH, et les placer naturellement.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Le lexique : offre, missions, compétences, avantages"],
        ["25 min", "Réemploi en situation : décrire ton poste idéal"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Lire une offre d'emploi en anglais qui te plaît",
          "Surligne les mots inconnus et apporte-la en séance.",
        ],
      ],
    ),
    s(
      "Questions ouvertes",
      "simulation",
      "Répondre aux questions ouvertes (« Why should we hire you? ») avec des réponses structurées et concrètes.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Les 8 questions ouvertes les plus fréquentes"],
        ["30 min", "Réponses chronométrées avec la méthode STAR"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer ta réponse à « Why this company? »", "3 arguments, avec des mots-clés."]],
    ),
    s(
      "Storytelling",
      "simulation",
      "Raconter un projet en 90 secondes, avec un début, une tension et une fin — sans notes.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Construire un récit : situation, tension, résolution"],
        ["30 min", "3 récits chronométrés, feedback après chacun"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Écouter un podcast ou un talk de 5 à 10 min",
          "Relève 3 techniques que l'orateur utilise pour captiver.",
        ],
        ["Préparer 3 phrases sur ton dernier projet", "À dire à l'oral en début de séance."],
      ],
    ),
    s(
      "Simulation d'entretien complet",
      "simulation",
      "Tenir un entretien complet de 30 minutes en anglais, sans blanc et sans perdre le fil.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["30 min", "Entretien complet, en continu, sans interruption"],
        ["15 min", "Questions de salaire & négociation"],
        ["10 min", "Débrief à chaud"],
      ],
      [
        ["2 exemples au format STAR", "Pris dans des expériences différentes de celles déjà travaillées."],
        [
          "Réviser les temps du passé",
          "Reprends les erreurs notées dans tes derniers comptes-rendus : present perfect ou simple past ?",
        ],
      ],
    ),
    s(
      "Négocier son salaire",
      "simulation",
      "Annoncer une fourchette de salaire et la défendre sans t'excuser.",
      [
        ["10 min", "Le vocabulaire de la négociation"],
        ["25 min", "Annoncer un chiffre et le défendre"],
        ["15 min", "Répondre à une contre-proposition"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Définir ta fourchette de salaire",
          "Ton minimum, ta cible, et 2 arguments pour la justifier.",
        ],
      ],
    ),
    s(
      "Le suivi après entretien",
      "vocabulary",
      "Relancer après un entretien, remercier et poser tes questions finales avec le bon registre.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Questions à poser en fin d'entretien"],
        ["25 min", "Relance orale et message de remerciement"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer 3 questions à poser au recruteur", "Sur l'équipe, les missions ou la suite du process."]],
    ),
    s(
      "Entretien final avec le CEO",
      "simulation",
      "Convaincre un décideur pressé : aller à l'essentiel, parler vision et impact.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["35 min", "Simulation d'entretien final, rythme soutenu"],
        ["10 min", "Questions déstabilisantes"],
        ["10 min", "Débrief à chaud"],
      ],
      [["Te renseigner sur l'entreprise visée", "Actualité, produits, valeurs : 5 points à citer."]],
    ),
    s(
      "Bilan & plan de vol",
      "other",
      "Mesurer le chemin parcouru et repartir avec un plan concret pour tes vrais entretiens.",
      [
        ["10 min", "Ton pitch aujourd'hui, comparé à la séance 1"],
        ["25 min", "Dernière simulation sur tes points faibles"],
        ["15 min", "Plan d'entraînement autonome"],
        ["10 min", "Bilan du parcours"],
      ],
      [["Réécouter ton pitch de la séance 2", "Note ce qui a changé depuis."]],
    ),
  ],
};

/* -------------------------------------------------------------------------- */
/* Communication professionnelle — 10 séances                                  */
/* -------------------------------------------------------------------------- */

const BUSINESS: CatalogTemplate = {
  key: "business",
  name: "Communication pro — 10 séances",
  scenario: "business",
  level: "B1 → B2",
  description:
    "Être à l'aise en anglais au travail : small talk, réunions, présentations, calls et négociations avec des collègues internationaux.",
  sessions: [
    s(
      "Diagnostic & objectifs",
      "other",
      "Identifier les situations pro où l'anglais te coûte le plus, et fixer tes priorités.",
      [
        ["15 min", "Échange libre : ton poste, tes interlocuteurs"],
        ["20 min", "Mises en situation courtes pour évaluer"],
        ["15 min", "Priorités et objectifs du parcours"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Noter 3 situations récentes en anglais au travail",
          "Ce qui s'est bien passé, ce qui t'a mis en difficulté.",
        ],
      ],
    ),
    s(
      "Small talk qui ouvre des portes",
      "simulation",
      "Lancer et entretenir une conversation informelle avec un collègue ou un client, sans blanc.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Sujets sûrs, questions de relance, formules de sortie"],
        ["30 min", "Mises en situation : café, début de call, salon"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer 3 questions de relance", "Qui marchent avec n'importe quel interlocuteur."]],
    ),
    s(
      "Prendre la parole en réunion",
      "simulation",
      "Intervenir en réunion au bon moment : donner ton avis, interrompre poliment, rebondir.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Expressions pour intervenir, nuancer, reformuler"],
        ["25 min", "Réunion simulée à plusieurs points de vue"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer un point à défendre en réunion", "Un sujet réel de ton équipe, 3 arguments."]],
    ),
    s(
      "Structurer une présentation",
      "simulation",
      "Présenter un sujet en 5 minutes avec une introduction claire, des transitions et une conclusion.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Plan type et phrases de transition"],
        ["25 min", "Présentation de 5 min + questions"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Choisir un sujet de présentation", "Un projet, un résultat ou un process que tu connais bien."]],
    ),
    s(
      "Écoute : réunions et accents",
      "listening",
      "Suivre une réunion avec des accents variés et en extraire les décisions et actions.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["25 min", "Extraits de réunions : accents US, UK, indien, non natifs"],
        ["20 min", "Résumer décisions et prochaines étapes"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer ta présentation de 5 min", "Des notes-clés, pas un texte à lire."]],
    ),
    s(
      "Écrire des messages clairs",
      "vocabulary",
      "Écrire des emails et messages courts, polis et directs, avec le bon niveau de formalité.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Registres, formules d'ouverture et de clôture"],
        ["25 min", "Réécriture de tes vrais messages"],
        ["10 min", "Bilan & devoirs"],
      ],
      [
        [
          "Apporter 2 emails en anglais que tu as écrits",
          "Anonymisés si besoin : on les améliore ensemble.",
        ],
      ],
    ),
    s(
      "Négocier et gérer le désaccord",
      "simulation",
      "Exprimer un désaccord sans froisser et chercher un compromis.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Adoucir, contre-proposer, conclure"],
        ["30 min", "Négociation simulée sur un cas de ton quotidien"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Identifier un désaccord récent au travail", "Qui, sur quoi, comment ça s'est terminé."]],
    ),
    s(
      "Conference calls : relancer, clarifier",
      "listening",
      "Animer ou suivre un call à distance : vérifier la compréhension, recadrer, conclure.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Expressions de call : son, tour de parole, récapitulatif"],
        ["25 min", "Call simulé avec incidents techniques"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Écouter un podcast business de 10 min", "Note 5 expressions à réutiliser."]],
    ),
    s(
      "Prononciation : être compris du premier coup",
      "pronunciation",
      "Travailler l'accent tonique et les sons qui gênent la compréhension de tes interlocuteurs.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Diagnostic de tes sons et accents toniques"],
        ["25 min", "Entraînement ciblé sur ton vocabulaire métier"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Lister 15 mots de ton métier", "Ceux que tu utilises le plus souvent à l'oral."]],
    ),
    s(
      "Présentation finale & bilan",
      "simulation",
      "Faire une présentation complète avec questions, et mesurer tes progrès depuis le début.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["30 min", "Présentation finale + séance de questions"],
        ["15 min", "Comparaison avec le diagnostic de départ"],
        ["10 min", "Plan pour continuer en autonomie"],
      ],
      [["Préparer ta présentation finale", "Sujet libre, 8 à 10 minutes."]],
    ),
  ],
};

/* -------------------------------------------------------------------------- */
/* Intégration académique — 10 séances                                        */
/* -------------------------------------------------------------------------- */

const ACADEMIC: CatalogTemplate = {
  key: "academic",
  name: "Intégration académique — 10 séances",
  scenario: "academic",
  level: "B1 → B2",
  description:
    "Préparer des études ou un poste de recherche en anglais : suivre les cours, participer aux séminaires, présenter et défendre son travail.",
  sessions: [
    s(
      "Diagnostic & objectifs académiques",
      "other",
      "Faire le point sur ton projet d'études et les situations académiques à préparer en priorité.",
      [
        ["15 min", "Ton programme, ton calendrier, tes inquiétudes"],
        ["20 min", "Mises en situation courtes pour évaluer"],
        ["15 min", "Priorités et objectifs du parcours"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Rassembler la description de ton programme", "Page du cursus, intitulés de cours, attendus."]],
    ),
    s(
      "Se présenter à l'université",
      "simulation",
      "Te présenter à un professeur, un superviseur ou des camarades : parcours, sujet, ambitions.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Vocabulaire du parcours académique"],
        ["30 min", "Présentations en situation : cours, labo, soirée d'accueil"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer ta présentation académique", "Formation, sujet d'intérêt, projet : 5 mots-clés."]],
    ),
    s(
      "Comprendre un cours magistral",
      "listening",
      "Suivre un cours en anglais et prendre des notes efficaces sur les idées principales.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["25 min", "Extrait de cours : écoute et prise de notes"],
        ["20 min", "Repérer structure, exemples et digressions"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Regarder une conférence de 15 min dans ton domaine", "Prends des notes, on les compare."]],
    ),
    s(
      "Participer à un séminaire",
      "simulation",
      "Intervenir dans une discussion de séminaire : réagir, citer, demander une précision.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Expressions pour réagir et argumenter"],
        ["30 min", "Séminaire simulé sur un texte court"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Lire un article court de ton domaine", "Prépare 2 questions et 1 critique."]],
    ),
    s(
      "Vocabulaire académique",
      "vocabulary",
      "Maîtriser le vocabulaire transversal des études : hypothèses, méthodes, résultats, limites.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Le lexique académique essentiel"],
        ["25 min", "Réemploi : résumer une étude à l'oral"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Résumer ton sujet d'étude en 5 phrases", "À l'écrit, en anglais, sans traducteur."]],
    ),
    s(
      "Présenter un projet de recherche",
      "simulation",
      "Présenter ton projet en 5 minutes : contexte, question, méthode, résultats attendus.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Structure d'une présentation académique"],
        ["30 min", "Présentation + questions du « jury »"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer 4 diapos sur ton projet", "Une idée par diapo, peu de texte."]],
    ),
    s(
      "Questions et défense d'un point de vue",
      "simulation",
      "Répondre aux questions difficiles et défendre ta position avec des arguments et des nuances.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Gagner du temps, reconnaître une limite, contre-argumenter"],
        ["30 min", "Séance de questions intensive"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Anticiper 5 questions sur ton projet", "Et une réponse en mots-clés pour chacune."]],
    ),
    s(
      "Prononciation & intonation",
      "pronunciation",
      "Rendre tes présentations plus claires : accent de mot, pauses et intonation.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Diagnostic sur ta présentation enregistrée"],
        ["25 min", "Entraînement : termes techniques, pauses, emphase"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Enregistrer 2 minutes de ta présentation", "On l'écoute ensemble en début de séance."]],
    ),
    s(
      "Échanges informels sur le campus",
      "simulation",
      "Te sentir à l'aise dans la vie étudiante : administration, colocation, soirées, groupes de travail.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Expressions familières et registres"],
        ["30 min", "Mises en situation de la vie courante"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Regarder un épisode d'une série campus", "Note 5 expressions familières."]],
    ),
    s(
      "Soutenance blanche & bilan",
      "simulation",
      "Présenter et défendre ton travail en conditions réelles, puis mesurer tes progrès.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["30 min", "Soutenance blanche + questions"],
        ["15 min", "Comparaison avec le diagnostic de départ"],
        ["10 min", "Plan pour continuer en autonomie"],
      ],
      [["Préparer ta soutenance blanche", "10 minutes de présentation, format réel."]],
    ),
  ],
};

/* -------------------------------------------------------------------------- */
/* Pratique & fluidité — 10 séances                                            */
/* -------------------------------------------------------------------------- */

const FLUENCY: CatalogTemplate = {
  key: "fluency",
  name: "Pratique & fluidité — 10 séances",
  scenario: "fluency",
  level: "A2 → B1+",
  description:
    "Oser parler et gagner en aisance au quotidien : parler de soi, raconter, donner son avis, voyager, sans chercher ses mots.",
  sessions: [
    s(
      "Diagnostic : où ça bloque",
      "other",
      "Comprendre ce qui te freine à l'oral et fixer des objectifs réalistes et motivants.",
      [
        ["15 min", "Conversation libre pour évaluer"],
        ["20 min", "Repérer les blocages : vocabulaire, grammaire, stress"],
        ["15 min", "Objectifs du parcours"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Noter 3 situations où tu aimerais parler anglais", "Voyage, travail, séries, amis…"]],
    ),
    s(
      "Parler de soi sans préparer",
      "simulation",
      "Parler de toi, de ton quotidien et de tes goûts pendant 3 minutes sans préparation.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Phrases utiles pour démarrer et relancer"],
        ["30 min", "Conversations sur des thèmes du quotidien"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Te décrire en 5 phrases à voix haute", "Chaque jour de la semaine, sans écrire."]],
    ),
    s(
      "Raconter une histoire au passé",
      "grammar",
      "Raconter un souvenir ou un week-end avec les bons temps du passé.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Simple past, past continuous, present perfect : les repères"],
        ["25 min", "Récits à l'oral, corrections en direct"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Préparer un souvenir de voyage", "Des mots-clés seulement, pour le raconter à l'oral."]],
    ),
    s(
      "Écoute : séries et podcasts",
      "listening",
      "Comprendre l'anglais parlé naturel, avec ses contractions et son rythme.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["25 min", "Extraits de séries : écoute globale puis détaillée"],
        ["20 min", "Contractions, liaisons et expressions courantes"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Regarder un épisode en VO sous-titrée anglais", "Note 5 expressions qui reviennent."]],
    ),
    s(
      "Donner son avis et nuancer",
      "simulation",
      "Exprimer ton opinion, être d'accord ou pas, et nuancer sans hésiter.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Expressions d'opinion et de nuance"],
        ["30 min", "Discussions sur des sujets légers puis plus engagés"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Choisir un sujet qui te passionne", "Prépare 3 arguments pour en parler."]],
    ),
    s(
      "Les phrasal verbs du quotidien",
      "vocabulary",
      "Utiliser naturellement les 20 phrasal verbs les plus courants à l'oral.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Découverte en contexte"],
        ["25 min", "Réemploi en conversation"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Relever 5 phrasal verbs dans une série ou une chanson", "Avec la phrase où tu les as entendus."]],
    ),
    s(
      "Prononciation : sons et rythme",
      "pronunciation",
      "Travailler les sons difficiles pour un francophone (th, h, voyelles longues) et le rythme de la phrase.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["20 min", "Diagnostic de tes sons"],
        ["25 min", "Exercices ciblés et répétition en contexte"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Lire un court texte à voix haute et t'enregistrer", "1 minute suffit."]],
    ),
    s(
      "Débat sur un sujet d'actualité",
      "simulation",
      "Défendre un point de vue dans un débat, relancer et réagir aux arguments.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Vocabulaire du sujet et expressions de débat"],
        ["30 min", "Débat en deux manches"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Lire un article d'actualité en anglais", "Résume-le en 3 phrases à l'oral."]],
    ),
    s(
      "Voyage & imprévus",
      "simulation",
      "Te débrouiller en voyage : hôtel, restaurant, transports, et gérer un imprévu avec calme.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["15 min", "Expressions utiles pour se faire aider"],
        ["30 min", "Jeux de rôle : retard, réclamation, demande d'aide"],
        ["10 min", "Bilan & devoirs"],
      ],
      [["Imaginer ton prochain voyage", "Où, avec qui, quelles situations te font peur."]],
    ),
    s(
      "Conversation libre & bilan",
      "other",
      "Tenir une conversation de 20 minutes sans blocage et mesurer le chemin parcouru.",
      [
        ["5 min", "Retour sur tes devoirs"],
        ["25 min", "Conversation libre sur tes sujets préférés"],
        ["20 min", "Comparaison avec le diagnostic de départ"],
        ["10 min", "Plan pour continuer en autonomie"],
      ],
      [["Noter tes 3 plus grands progrès", "Et ce que tu veux encore travailler."]],
    ),
  ],
};

export const TEMPLATE_CATALOG: CatalogTemplate[] = [
  JOB_INTERVIEW,
  BUSINESS,
  ACADEMIC,
  FLUENCY,
];

export function getCatalogTemplate(key: string) {
  return TEMPLATE_CATALOG.find((template) => template.key === key) ?? null;
}
