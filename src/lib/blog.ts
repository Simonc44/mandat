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
  {
    slug: "49-3-motion-de-censure-comprendre",
    title: "49.3 et motion de censure : comprendre l'arme constitutionnelle",
    description:
      "Article 49 alinéa 3 de la Constitution : mécanique, usages, limites. Décryptage d'un outil au cœur de la Ve République et de la 17e législature.",
    date: "2026-06-25",
    readingMinutes: 6,
    tags: ["Constitution", "49.3", "Motion de censure"],
    author: "Équipe Mandat",
    content: `## Qu'est-ce que le 49.3

L'article 49 alinéa 3 de la Constitution permet au gouvernement d'engager sa responsabilité sur un texte. Le texte est alors considéré comme adopté sans vote — sauf si une motion de censure est déposée et votée dans les 24 heures.

## Une arme à double tranchant

Le 49.3 accélère l'adoption d'un texte mais expose le gouvernement à une chute immédiate. Depuis 2022, son usage systématique par les gouvernements minoritaires a ravivé le débat sur son abus.

## La motion de censure en pratique

Pour renverser le gouvernement, il faut réunir la majorité absolue des députés, soit 289 voix. Les abstentions comptent comme un soutien au gouvernement — un biais structurel de la Ve République.

## Ce que Mandat archive

Chaque motion de censure fait l'objet d'un scrutin nominatif que nous archivons. Vous pouvez retrouver le vote exact de votre député sur chaque tentative de censure de la 17e législature.`,
  },
  {
    slug: "groupes-politiques-assemblee-nationale-17e",
    title: "Les groupes politiques de la 17e législature expliqués",
    description:
      "NFP, RN, Ensemble, LR, Liot : panorama complet des groupes parlementaires, leurs poids, leurs lignes de vote et leurs recompositions.",
    date: "2026-06-18",
    readingMinutes: 8,
    tags: ["Groupes politiques", "17e législature"],
    author: "Équipe Mandat",
    content: `## Pourquoi les groupes comptent

À l'Assemblée nationale, l'action parlementaire s'organise en groupes. Un groupe donne accès à des temps de parole, des postes en commission, des moyens financiers et humains. Sans groupe, un député perd l'essentiel de son influence.

## Les blocs de la 17e législature

Trois blocs de taille comparable structurent l'hémicycle : le Nouveau Front Populaire à gauche, le bloc central présidentiel, et une droite élargie incluant Les Républicains et le Rassemblement National.

## La discipline de groupe

Chaque groupe définit une ligne de vote pour les scrutins majeurs. Mandat mesure l'alignement individuel de chaque député à cette ligne — un indicateur précieux pour repérer les votes de conscience et les dissidences.

## Le rôle pivot du groupe Liot

Groupe minoritaire mais central, Liot (Libertés, Indépendants, Outre-mer et Territoires) joue souvent l'arbitre. Ses votes peuvent faire basculer un texte, ce qui en fait un observatoire précieux pour comprendre les équilibres.`,
  },
  {
    slug: "circonscription-legislatives-comment-ca-marche",
    title: "Circonscription législative : comment ça marche",
    description:
      "577 circonscriptions, 577 députés. Comprendre le découpage électoral français, ses biais et ses réformes.",
    date: "2026-05-30",
    readingMinutes: 5,
    tags: ["Élections", "Circonscription", "Guide"],
    author: "Équipe Mandat",
    content: `## Un député, un territoire

La France est découpée en 577 circonscriptions législatives. Chacune élit un député au scrutin uninominal majoritaire à deux tours. C'est le lien direct entre un territoire et sa représentation nationale.

## Le découpage de 2010

Le dernier redécoupage majeur date de 2010. Il visait à équilibrer la population par circonscription — environ 125 000 habitants — mais des écarts subsistent, notamment en Outre-mer et pour les Français de l'étranger.

## Les 11 circonscriptions des Français de l'étranger

Créées en 2012, elles couvrent les 2 à 3 millions de Français vivant hors de France. Un député y représente parfois plus de 20 pays, un défi logistique unique.

## Retrouver son député

Sur Mandat, chaque fiche député affiche sa circonscription complète, sans abréviation, avec le numéro et le nom du département. Vous pouvez aussi explorer un département entier via notre cartogramme interactif.`,
  },
  {
    slug: "commissions-parlementaires-role-influence",
    title: "Commissions parlementaires : le vrai lieu du pouvoir",
    description:
      "Huit commissions permanentes façonnent les lois avant l'hémicycle. Découvrez leur rôle, leur composition et leur poids réel.",
    date: "2026-05-12",
    readingMinutes: 6,
    tags: ["Commissions", "Parlement", "Guide"],
    author: "Équipe Mandat",
    content: `## Huit commissions, huit domaines

L'Assemblée compte huit commissions permanentes : Affaires culturelles, Affaires économiques, Affaires étrangères, Affaires sociales, Défense, Développement durable, Finances, Lois. Chaque député en intègre une.

## Là où les textes se fabriquent

Avant tout débat en séance publique, un projet ou une proposition de loi passe en commission. C'est là que les amendements sont discutés, adoptés ou rejetés, souvent loin des caméras.

## Les rapporteurs, figures clés

Chaque texte a un rapporteur désigné par la commission. Son travail préparatoire oriente largement le débat public. Suivre les rapporteurs, c'est anticiper le contenu réel des lois.

## Les auditions publiques

Les commissions auditionnent ministres, experts, associations. Ces auditions sont publiques et retransmises. Un matériau riche, souvent sous-exploité par le grand public.`,
  },
  {
    slug: "proposition-loi-versus-projet-loi",
    title: "Proposition de loi ou projet de loi : quelle différence",
    description:
      "Origine gouvernementale ou parlementaire : deux voies d'accès à la loi qui ne pèsent pas le même poids. Explications.",
    date: "2026-04-28",
    readingMinutes: 4,
    tags: ["Loi", "Guide", "Parlement"],
    author: "Équipe Mandat",
    content: `## Deux origines

Un **projet de loi** est déposé par le gouvernement. Une **proposition de loi** émane d'un parlementaire, député ou sénateur. La différence semble mineure — elle est en réalité structurante.

## Un rapport de force inégal

L'agenda parlementaire est majoritairement gouvernemental. Les propositions de loi peinent à obtenir un créneau, sauf lors des "niches parlementaires" réservées aux groupes d'opposition.

## L'étude d'impact

Un projet de loi doit être accompagné d'une étude d'impact — un document analysant conséquences économiques, sociales, environnementales. Une proposition de loi en est dispensée, ce qui accélère mais fragilise sa qualité juridique.

## Ce que Mandat affiche

Sur chaque scrutin, nous identifions l'origine du texte. Un citoyen curieux peut ainsi distinguer les votes sur des textes gouvernementaux de ceux issus de l'initiative parlementaire.`,
  },
  {
    slug: "amendement-parlementaire-comprendre",
    title: "L'amendement parlementaire, outil silencieux du pouvoir",
    description:
      "Des dizaines de milliers d'amendements sont déposés chaque année. Décryptage d'un mécanisme central mais méconnu.",
    date: "2026-04-05",
    readingMinutes: 5,
    tags: ["Amendement", "Loi", "Guide"],
    author: "Équipe Mandat",
    content: `## Amender, c'est légiférer

Un amendement modifie, ajoute ou supprime une disposition d'un texte en discussion. C'est l'outil de base du travail parlementaire. Certains changent une virgule ; d'autres reconfigurent une réforme entière.

## Le volume, arme politique

Déposer des milliers d'amendements peut ralentir un texte jusqu'à l'obstruction. À l'inverse, un amendement rédigé avec finesse peut transformer une loi sans en changer l'esprit apparent.

## Recevabilité et article 40

Un amendement qui crée une charge nouvelle pour l'État est irrecevable au titre de l'article 40 de la Constitution. Cette règle limite fortement l'initiative parlementaire en matière budgétaire.

## Suivre les amendements

Les bases de données publiques de l'Assemblée permettent de consulter chaque amendement, son auteur, son sort. C'est une matière brute que Mandat entend rendre progressivement plus lisible.`,
  },
  {
    slug: "budget-etat-loi-de-finances-comprendre",
    title: "Loi de finances : comment se vote le budget de l'État",
    description:
      "Chaque automne, l'Assemblée vote le budget de la France. Calendrier, procédure et enjeux du texte le plus lourd du quinquennat.",
    date: "2026-03-20",
    readingMinutes: 7,
    tags: ["Budget", "Finances publiques", "Guide"],
    author: "Équipe Mandat",
    content: `## Le rite d'automne

Le projet de loi de finances (PLF) est déposé par le gouvernement au plus tard le premier mardi d'octobre. Il fixe les recettes et dépenses de l'État pour l'année suivante. C'est le texte le plus commenté, le plus amendé, le plus scruté.

## 70 jours pour trancher

Le Parlement dispose de 70 jours pour adopter la loi de finances. Passé ce délai, le gouvernement peut légiférer par ordonnances. Une épée de Damoclès qui pèse sur les débats.

## Les missions budgétaires

Le budget est découpé en missions : Éducation, Défense, Écologie, Justice, etc. Chaque mission fait l'objet d'un vote séparé. Suivre les votes mission par mission révèle les priorités réelles d'une majorité.

## Le rôle de la commission des Finances

Traditionnellement présidée par un député d'opposition, la commission des Finances contrôle l'exécution du budget. Un contre-pouvoir institutionnel précieux dans une Assemblée sans majorité stable.`,
  },
  {
    slug: "questions-au-gouvernement-utilite",
    title: "Questions au gouvernement : théâtre ou contre-pouvoir",
    description:
      "Deux séances hebdomadaires, un rituel médiatique. Analyse d'un exercice démocratique souvent caricaturé, parfois décisif.",
    date: "2026-02-28",
    readingMinutes: 4,
    tags: ["Contrôle", "Gouvernement", "Guide"],
    author: "Équipe Mandat",
    content: `## Un rituel constitutionnel

Les Questions au Gouvernement (QAG) se tiennent le mardi et le mercredi. Chaque groupe dispose d'un temps de parole proportionnel à sa taille. Deux minutes pour poser, deux minutes pour répondre.

## Théâtre ou substance

Souvent critiquées pour leur caractère théâtral, les QAG restent le principal moment de confrontation directe entre exécutif et opposition. Une question bien posée peut faire vaciller un ministre.

## Les questions écrites, l'autre voie

Moins spectaculaires, les questions écrites constituent un travail de contrôle sérieux. Un député peut interroger un ministre par écrit et obtenir une réponse publiée au Journal Officiel.

## Ce que Mandat prépare

Nous travaillons à intégrer les questions écrites et orales à chaque fiche député, pour compléter la lecture par les seuls scrutins. L'action parlementaire ne se limite pas au vote.`,
  },
];

export function getAllPosts(): BlogPost[] {
  return [...POSTS].sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return POSTS.find((p) => p.slug === slug);
}
