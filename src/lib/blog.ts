// src/lib/blog.ts — Articles du blog Mandat (SEO)
// Contenu éditorial statique orienté transparence démocratique.

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO
  readingMinutes: number;
  tags: string[];
  author: string;
  content: string; // Markdown-lite (paragraphes séparés par \n\n, ##, -)
};

export const POSTS: BlogPost[] = [
  {
    slug: "comment-lire-un-scrutin-assemblee-nationale",
    title: "Comment lire un scrutin à l'Assemblée nationale",
    description:
      "Décoder un scrutin public : quorum, majorité, abstentions, non-votants. Un guide clair pour comprendre les votes des députés en 2026.",
    date: "2026-06-10",
    readingMinutes: 6,
    tags: ["Guide", "Assemblée nationale", "Scrutin"],
    author: "Équipe Mandat",
    content: `## Qu'est-ce qu'un scrutin public ?

Un scrutin public est un vote nominatif : le nom de chaque député présent est associé à sa position — Pour, Contre, Abstention ou Non-votant. C'est la seule forme de vote qui permet de retracer précisément qui a soutenu ou rejeté un texte.

## Les quatre positions expliquées

- **Pour** : le député approuve le texte.
- **Contre** : le député rejette le texte.
- **Abstention** : le député refuse de trancher. Elle n'est pas comptée dans la majorité.
- **Non-votant** : présent mais volontairement absent du vote, ou en mission officielle.

## Comment se calcule l'adoption

Un texte est adopté si le nombre de "Pour" est strictement supérieur au nombre de "Contre". Les abstentions ne pèsent pas. À l'Assemblée, la majorité relative suffit dans la plupart des cas — sauf pour les lois organiques ou les révisions constitutionnelles.

## Pourquoi tous les députés ne votent pas

Sur 577 sièges, il est rare que les 577 votent. Entre missions, commissions parallèles, déplacements et absences, un scrutin réunit souvent 200 à 500 votants. C'est légal, mais l'assiduité reste un indicateur démocratique fort — c'est pourquoi Mandat l'affiche sur chaque fiche.

## Aller plus loin

Sur [Mandat](/), chaque scrutin est enrichi de la répartition par groupe politique, du sort réel du texte, et de la liste nominative complète. Le tout gratuit, sans publicité, sans étiquette partisane.`,
  },
  {
    slug: "17e-legislature-ce-quil-faut-savoir",
    title: "17e législature : ce qu'il faut savoir",
    description:
      "Élue en juillet 2024, la 17e législature marque une recomposition inédite de l'Assemblée. Groupes, équilibres et enjeux — le point complet.",
    date: "2026-05-22",
    readingMinutes: 7,
    tags: ["17e législature", "Politique"],
    author: "Équipe Mandat",
    content: `## Une Assemblée sans majorité absolue

La dissolution de juin 2024 a débouché sur une Assemblée fragmentée en trois blocs de taille comparable : gauche unie (NFP), centre présidentiel et droite / extrême droite. Aucun n'atteint les 289 sièges nécessaires à la majorité absolue.

## Les groupes en présence

La 17e législature compte une dizaine de groupes politiques déclarés. Cette pluralité impose la négociation permanente : chaque texte majeur nécessite une coalition ad hoc, et les scrutins deviennent plus imprévisibles qu'à la législature précédente.

## Pourquoi les votes comptent plus que jamais

En l'absence de majorité stable, la position individuelle d'un député pèse davantage. Un ou deux votes peuvent faire basculer un texte. Suivre les scrutins nominatifs n'est plus un exercice de spécialiste — c'est devenu un enjeu citoyen.

## L'usage du 49.3 sous contrainte

Un gouvernement minoritaire peut recourir au 49.3, mais s'expose immédiatement à une motion de censure. Chaque motion devient un scrutin décisif que Mandat archive et documente.

## Ce que Mandat apporte

Nous rendons visible ce que la retransmission télévisée efface : le vote nominatif, groupe par groupe, département par département. Pour se faire une opinion, il faut d'abord accéder à l'information brute.`,
  },
  {
    slug: "transparence-democratique-open-data-parlementaire",
    title: "Transparence démocratique : la révolution de l'open data parlementaire",
    description:
      "De data.assemblee-nationale.fr à Mandat, comment l'open data transforme le rapport des citoyens à leurs élus.",
    date: "2026-04-15",
    readingMinutes: 8,
    tags: ["Open data", "Transparence", "Démocratie"],
    author: "Équipe Mandat",
    content: `## Le tournant de 2013

En 2013, l'Assemblée nationale ouvre progressivement ses données : scrutins, amendements, questions écrites, agendas. Ce basculement, discret mais historique, met à disposition du public un matériau brut jusque-là réservé aux journalistes accrédités.

## Ce que change l'open data

Avant 2013, savoir comment votre député avait voté sur un texte demandait un accès direct au compte rendu intégral. Aujourd'hui, une API renvoie la même information en quelques millisecondes. C'est cette matière première qui alimente Mandat.

## Les limites persistantes

L'open data ne résout pas tout. Les données brutes sont techniques, mal indexées, parfois incohérentes entre législatures. Notre travail consiste à les nettoyer, les recroiser, et surtout à les rendre lisibles à un public non-spécialiste.

## Le rôle des projets citoyens

Nosdeputes.fr, Regards Citoyens, CLAIR, CIVIX, Mandat : autant d'initiatives complémentaires. Aucune ne remplace le journalisme parlementaire ; toutes le prolongent en donnant au citoyen les moyens de vérifier par lui-même.

## Vers une démocratie continue

L'ambition n'est pas de remplacer le vote tous les cinq ans — c'est de le prolonger. Un mandat n'est plus un chèque en blanc : c'est un contrat consultable, mesurable, discutable jour après jour.`,
  },
  {
    slug: "assiduite-deputes-comment-la-mesurer",
    title: "Assiduité des députés : comment la mesurer honnêtement",
    description:
      "Le taux de présence brut ne dit pas tout. Missions, commissions, circonscription : décryptage d'un indicateur trop souvent caricaturé.",
    date: "2026-03-08",
    readingMinutes: 5,
    tags: ["Assiduité", "Députés", "Méthodologie"],
    author: "Équipe Mandat",
    content: `## Le piège du taux brut

"Ce député n'a voté qu'à 30 % des scrutins." La phrase claque, mais elle est presque toujours trompeuse. Un député en mission officielle, en commission parallèle ou hospitalisé n'est pas absent — il est ailleurs, souvent au service du mandat.

## Ce que mesure vraiment un vote manqué

Un vote raté peut signifier : une absence pure, une abstention volontaire, un déplacement autorisé, une mission gouvernementale. Sans contexte, le chiffre ne dit rien de sérieux.

## Notre méthode sur Mandat

Nous affichons trois indicateurs distincts :

- **Votes exprimés** : nombre de scrutins où le député a pris position.
- **Alignement de groupe** : fréquence à laquelle son vote suit la ligne majoritaire de son groupe.
- **Scrutins clés** : votes emblématiques identifiés éditorialement, souvent plus révélateurs que les statistiques agrégées.

## Le meilleur juge, c'est vous

Aucun indicateur ne remplace la lecture attentive des positions prises sur les textes qui vous concernent. Mandat vous donne les données ; l'interprétation reste souverainement citoyenne.`,
  },
];

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
