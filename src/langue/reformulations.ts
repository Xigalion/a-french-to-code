/** Reformulations **syntaxiques** déterministes.
 *
 * Lot S5. La couche de variantes du lot S4 ne savait que substituer des mots :
 * elle couvrait les variantes *morphologiques* d'une phrase du catalogue, et
 * le corpus écrit à la main l'a mesuré — 43 phrases claires sur 94 refusées,
 * parce qu'elles ne sont pas la même phrase avec d'autres mots, mais la même
 * intention dans une autre **forme**.
 *
 * Ce module ajoute la forme. Une reformulation est une **table**, jamais une
 * inférence :
 *
 *   - son motif est **ancré sur la phrase entière**. Il ne peut donc pas
 *     s'appliquer à un morceau et laisser le reste au hasard ;
 *   - ses captures sont **recopiées telles quelles**. Un nom, un entier, une
 *     expression ou un texte passent sans être relus, et rien n'est réordonné
 *     à l'intérieur d'une capture ;
 *   - elle produit une **phrase candidate du catalogue**, et c'est le moteur
 *     strict qui l'accepte ou la refuse. La table ne décide jamais qu'une
 *     phrase est valide ;
 *   - deux reformulations qui donnent deux sens différents rendent la phrase
 *     **ambiguë**, et l'ambiguïté est refusée. C'est le cas, volontairement,
 *     de « age vaut 20. » : déclarer et affecter ne sont pas la même chose, et
 *     la phrase ne dit pas laquelle.
 *
 * Ce que ce module NE fait pas, et ne doit pas faire :
 *   - deviner une information absente. « Incrémente compteur. » n'est pas
 *     reformulable : le pas n'est pas dans la phrase ;
 *   - choisir à la place de l'étudiant. « Déclare un réel nommé x. » n'est pas
 *     reformulable : `float` et `double` sont deux types, et le mot « réel »
 *     ne dit pas lequel ;
 *   - découper une phrase en deux instructions.
 */

/** Les formes de capture. Chaque placeholder devient un groupe, dans l'ordre
 * où il apparaît, et `$1`, `$2`… du gabarit les désignent. */
const CAPTURES: Readonly<Record<string, string>> = {
  NOM: '([A-Za-z][A-Za-z0-9_]*)',
  ENTIER: '(-?[0-9]+)',
  // Le point décimal seulement : une virgule décimale produirait un C invalide,
  // et la corriger serait réparer la phrase.
  NOMBRE: '(-?[0-9]+(?:\\.[0-9]+)?)',
  EXPR: '"([^"]*)"',
  TEXTE: '"([^"]*)"',
  COND: '"([^"]*)"',
  // Un littéral caractère, guillemets simples compris. Il est recopié tel
  // quel : C-A n'évalue jamais un caractère.
  CAR: '(\'(?:\\\\.|[^\'\\\\])\')',
};

export type GenreReformulation = 'ordre' | 'synonyme' | 'courte' | 'affectation' | 'composition';

export type Reformulation = {
  /** La forme libre, avec ses placeholders. Les espaces y valent « un ou
   * plusieurs blancs », et les apostrophes acceptent les deux caractères. */
  readonly forme: string;
  /** La phrase canonique produite. `$1`… désignent les captures. */
  readonly canonique: string;
  readonly genre: GenreReformulation;
  /** Pourquoi la reformulation existe. Les mentions « corpus libre » viennent
   * des 43 phrases claires que le corpus du lot S4 a mesurées comme refusées :
   * ce sont des formulations rencontrées, pas des idées. */
  readonly raison: string;
  /** Une phrase qui la démontre. Un test exige qu'elle produise une lecture :
   * c'est la garde du lot 30 appliquée à la table. */
  readonly demonstration: string;
  /** Le MOT de la phrase libre qui porte un littéral absent des captures.
   *
   * Par défaut, une reformulation n'a pas le droit d'introduire un nombre qui
   * ne vient pas d'une capture : ce serait deviner. L'exception est le cas où
   * **le mot lui-même dit la valeur** — « incrémenter » dit un pas de 1 comme
   * « doubler » dirait un facteur 2. Elle est alors **déclarée ici**, le mot
   * est nommé, et un test vérifie qu'il figure réellement dans la forme.
   *
   * Décision du fondateur du 17 novembre 2026, qui accepte « Incrémente » et
   * « Décrémente » et laisse « Augmente » incomplet. */
  readonly litteralPorteParLeMot?: string;
};

export const REFORMULATIONS: readonly Reformulation[] = [
  // ---- l'affectation, et ses cinq manières ------------------------------
  { forme: 'Mets {ENTIER} dans {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'affectation', raison: 'corpus libre : « Mettre 20 dans age. »',
    demonstration: 'Mets 20 dans age.' },
  { forme: 'Mettre {ENTIER} dans {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'affectation', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Mettre 20 dans age.' },
  { forme: 'Place {ENTIER} dans {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'affectation', raison: 'synonyme de « mettre », même forme',
    demonstration: 'Place 20 dans age.' },
  { forme: 'Donne à {NOM} la valeur {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'ordre', raison: 'corpus libre : « Donne à age la valeur 20. » — cible avant valeur',
    demonstration: 'Donne à age la valeur 20.' },
  { forme: 'Affecte à {NOM} la valeur {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'ordre', raison: 'la même phrase canonique, dans l’autre ordre',
    demonstration: 'Affecte à age la valeur 20.' },
  { forme: '{NOM} reçoit la valeur {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'la forme que les cours d’algorithmique emploient',
    demonstration: 'age reçoit la valeur 20.' },

  // « {NOM} vaut {ENTIER} » n'a qu'UNE lecture, et c'est une correction.
  //
  // J'avais écrit deux reformulations, pour que la phrase soit refusée comme
  // ambiguë — « déclarer ou affecter ? ». La seconde produisait « Crée un
  // entier nommé $1 de valeur $2 », et elle INVENTAIT le type : la phrase ne
  // dit rien d'un type. La règle 3 l'interdit, et la lecture « créer » est
  // donc impossible, pas ambiguë. Retirée le 17 novembre 2026.
  { forme: '{NOM} vaut {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus libre : « age vaut 20. » — seule lecture qui n’invente rien',
    demonstration: 'age vaut 20.' },

  // ---- l'affectation d'une expression -----------------------------------
  { forme: 'Donne à {NOM} le résultat de {EXPR}', canonique: 'Affecte à $1 le résultat de "$2"',
    genre: 'synonyme', raison: 'même verbe synonyme, queue inchangée',
    demonstration: 'Donne à total le résultat de "a + b".' },
  { forme: '{NOM} reçoit le résultat de {EXPR}', canonique: 'Affecte à $1 le résultat de "$2"',
    genre: 'affectation', raison: 'la forme des cours d’algorithmique, avec une expression',
    demonstration: 'total reçoit le résultat de "a + b".' },
  { forme: 'Calcule {EXPR} dans {NOM}', canonique: 'Affecte à $2 le résultat de "$1"',
    genre: 'ordre', raison: 'expression avant cible : l’ordre du calcul, pas celui de l’affectation',
    demonstration: 'Calcule "a + b" dans total.' },
  { forme: 'Affecte le résultat de {EXPR} à {NOM}', canonique: 'Affecte à $2 le résultat de "$1"',
    genre: 'ordre', raison: 'la phrase canonique, dans l’autre ordre',
    demonstration: 'Affecte le résultat de "a + b" à total.' },
  { forme: 'Affecte le résultat numérique de {EXPR} à {NOM}',
    canonique: 'Affecte à $2 le résultat numérique de "$1"',
    genre: 'ordre', raison: 'la même inversion, profil numérique',
    demonstration: 'Affecte le résultat numérique de "a / b" à q.' },

  // ---- l'opération : ce que la phrase dit, et rien de plus ---------------
  // Les deux opérandes ET la cible sont dans la phrase. Rien n'est ajouté :
  // c'est pour cela que « Incrémente compteur. » n'y est pas — le pas n'y est
  // pas écrit.
  { forme: 'Ajoute {ENTIER} à {NOM}', canonique: 'Affecte à $2 le résultat de "$2 + $1"',
    genre: 'composition', raison: 'corpus libre : « Ajouter 1 à compteur. » — cible et opérande écrits',
    demonstration: 'Ajoute 1 à compteur.' },
  { forme: 'Ajouter {ENTIER} à {NOM}', canonique: 'Affecte à $2 le résultat de "$2 + $1"',
    genre: 'composition', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Ajouter 1 à compteur.' },
  { forme: 'Retire {ENTIER} de {NOM}', canonique: 'Affecte à $2 le résultat de "$2 - $1"',
    genre: 'composition', raison: 'la symétrique de « Ajoute », mêmes garanties',
    demonstration: 'Retire 1 de compteur.' },
  // « Incrémente » et « Décrémente » DISENT un pas de 1 : le mot le porte.
  // Acceptées par le fondateur le 17 novembre 2026 ; « Augmente compteur. »
  // reste refusée, parce que celui-là ne dit aucun pas.
  //
  // En C17, la reformulation passe par l'affectation d'expression : le
  // catalogue n'a ni « ++ » ni « += ». En Python, c'est une intention NATIVE
  // qui écrit « += », la forme du langage — et les deux ne sont pas
  // équivalentes sur un objet mutable.
  { forme: 'Incrémente {NOM}', canonique: 'Affecte à $1 le résultat de "$1 + 1"',
    genre: 'composition', raison: 'acceptée par le fondateur le 17 novembre 2026 : le mot porte le pas',
    demonstration: 'Incrémente compteur.', litteralPorteParLeMot: 'Incrémente' },
  { forme: 'Incrémenter {NOM}', canonique: 'Affecte à $1 le résultat de "$1 + 1"',
    genre: 'composition', raison: 'la même, à l’infinitif',
    demonstration: 'Incrémenter compteur.', litteralPorteParLeMot: 'Incrémenter' },
  { forme: 'Décrémente {NOM}', canonique: 'Affecte à $1 le résultat de "$1 - 1"',
    genre: 'composition', raison: 'la symétrique, acceptée en même temps',
    demonstration: 'Décrémente compteur.', litteralPorteParLeMot: 'Décrémente' },
  { forme: 'Décrémenter {NOM}', canonique: 'Affecte à $1 le résultat de "$1 - 1"',
    genre: 'composition', raison: 'la même, à l’infinitif',
    demonstration: 'Décrémenter compteur.', litteralPorteParLeMot: 'Décrémenter' },
  { forme: 'Retirer {ENTIER} de {NOM}', canonique: 'Affecte à $2 le résultat de "$2 - $1"',
    genre: 'composition', raison: 'la symétrique, à l’infinitif',
    demonstration: 'Retirer 1 de compteur.' },

  // ---- la déclaration et l'initialisation --------------------------------
  { forme: 'Déclare l’entier {NOM}', canonique: 'Déclare un entier nommé $1',
    genre: 'courte', raison: 'article défini au lieu de « un … nommé »',
    demonstration: 'Déclare l’entier n.' },
  { forme: 'Déclarer l’entier {NOM}', canonique: 'Déclare un entier nommé $1',
    genre: 'courte', raison: 'la même, à l’infinitif',
    demonstration: 'Déclarer l’entier n.' },
  { forme: 'Crée un entier {NOM} de valeur {ENTIER}', canonique: 'Crée un entier nommé $1 de valeur $2',
    genre: 'courte', raison: '« nommé » omis, le nom reste à sa place',
    demonstration: 'Crée un entier age de valeur 20.' },
  { forme: 'Crée l’entier {NOM} de valeur {ENTIER}', canonique: 'Crée un entier nommé $1 de valeur $2',
    genre: 'courte', raison: 'article défini, valeur inchangée',
    demonstration: 'Crée l’entier age de valeur 20.' },
  { forme: 'Crée un entier nommé {NOM} qui vaut {ENTIER}', canonique: 'Crée un entier nommé $1 de valeur $2',
    genre: 'synonyme', raison: 'corpus libre : « Fais un entier age qui vaut 20. »',
    demonstration: 'Crée un entier nommé age qui vaut 20.' },
  { forme: 'Crée un entier nommé {NOM} égal à {ENTIER}', canonique: 'Crée un entier nommé $1 de valeur $2',
    genre: 'synonyme', raison: 'corpus libre : « Je veux un entier age égal à 20. »',
    demonstration: 'Crée un entier nommé age égal à 20.' },
  { forme: 'Crée un entier de valeur {ENTIER} nommé {NOM}', canonique: 'Crée un entier nommé $2 de valeur $1',
    genre: 'ordre', raison: 'valeur avant nom',
    demonstration: 'Crée un entier de valeur 20 nommé age.' },
  { forme: 'Déclare un entier nommé {NOM} de valeur {ENTIER}', canonique: 'Crée un entier nommé $1 de valeur $2',
    genre: 'synonyme', raison: '« déclarer » employé pour une création avec valeur',
    demonstration: 'Déclare un entier nommé age de valeur 20.' },
  // `flottant` est un synonyme SÛR de `float` ; « réel » ne l'est pas, parce
  // qu'il ne dit pas si c'est `float` ou `double`. L'un est reformulé, l'autre
  // volontairement pas.
  { forme: 'Crée un flottant nommé {NOM} de valeur {NOMBRE}',
    canonique: 'Crée une variable de type float nommée $1 avec le résultat de "$2"',
    genre: 'synonyme', raison: 'corpus libre : « Créer un flottant nommé prix de valeur 1.5. »',
    demonstration: 'Crée un flottant nommé prix de valeur 1.5.' },

  // ---- l'affichage -------------------------------------------------------
  { forme: 'Écris la valeur de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus libre : « Écrire la valeur de age. »',
    demonstration: 'Écris la valeur de age.' },
  { forme: 'Écrire la valeur de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Écrire la valeur de age.' },
  { forme: 'Imprime la valeur de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus libre : « Imprimer la valeur de age. »',
    demonstration: 'Imprime la valeur de age.' },
  { forme: 'Imprimer la valeur de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Imprimer la valeur de age.' },
  { forme: 'Montrer la valeur de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus libre : « Montrer la valeur de age. »',
    demonstration: 'Montrer la valeur de age.' },
  { forme: 'Affiche la variable {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'courte', raison: 'corpus libre : « Affiche la variable age. »',
    demonstration: 'Affiche la variable age.' },
  // « Affiche {NOM}. » a TROIS lectures, et le refus les nommera toutes les
  // trois. La différence entre %d, %c et %s est une leçon, pas un détail.
  { forme: 'Affiche {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'courte', raison: 'corpus libre : « Affiche age. » — lecture entière',
    demonstration: 'Affiche age.' },
  { forme: 'Affiche {NOM}', canonique: 'Affiche le caractère $1',
    genre: 'courte', raison: 'corpus libre : « Affiche age. » — lecture caractère, et c’est l’ambiguïté',
    demonstration: 'Affiche age.' },
  { forme: 'Affiche {NOM}', canonique: 'Affiche la chaîne $1',
    genre: 'courte', raison: 'corpus libre : « Affiche age. » — lecture chaîne, troisième lecture',
    demonstration: 'Affiche age.' },
  { forme: 'Affiche le texte de {NOM}', canonique: 'Affiche la chaîne $1',
    genre: 'synonyme', raison: '« le texte de » pour une chaîne nommée',
    demonstration: 'Affiche le texte de nom.' },

  // ---- le retour ---------------------------------------------------------
  { forme: 'Retourne {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'courte', raison: 'corpus libre : « Retourner 0. »',
    demonstration: 'Retourne 0.' },
  { forme: 'Retourner {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'courte', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Retourner 0.' },
  { forme: 'Renvoie {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'synonyme', raison: 'corpus libre : « Renvoyer 0. »',
    demonstration: 'Renvoie 0.' },
  { forme: 'Renvoyer {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Renvoyer 0.' },
  { forme: 'Renvoie la valeur {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'synonyme', raison: 'corpus libre : « Renvoyer la valeur 0. »',
    demonstration: 'Renvoie la valeur 0.' },
  { forme: 'Renvoyer la valeur {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Renvoyer la valeur 0.' },
  { forme: 'Renvoie le résultat de {EXPR}', canonique: 'Retourne le résultat de "$1"',
    genre: 'synonyme', raison: 'le même synonyme, avec une expression',
    demonstration: 'Renvoie le résultat de "a + b".' },
  { forme: 'Renvoyer le résultat de {EXPR}', canonique: 'Retourne le résultat de "$1"',
    genre: 'synonyme', raison: 'la même, à l’infinitif',
    demonstration: 'Renvoyer le résultat de "a + b".' },

  // ---- les transferts et les blocs ---------------------------------------
  { forme: 'Sortir de la boucle', canonique: 'Sors de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus libre : « Sortir de la boucle. »',
    demonstration: 'Sortir de la boucle.' },
  { forme: 'Quitte la boucle', canonique: 'Sors de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus libre : « Quitter la boucle. »',
    demonstration: 'Quitte la boucle.' },
  { forme: 'Quitter la boucle', canonique: 'Sors de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Quitter la boucle.' },
  { forme: 'Continue la boucle', canonique: 'Passe à l’itération suivante de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus libre : « Continuer la boucle. »',
    demonstration: 'Continue la boucle.' },
  { forme: 'Continuer la boucle', canonique: 'Passe à l’itération suivante de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Continuer la boucle.' },
  { forme: 'Répète tant que {COND}', canonique: 'Crée une boucle tant que "$1"',
    genre: 'synonyme', raison: 'corpus libre : « Répéter tant que "i < 3". »',
    demonstration: 'Répète tant que "i < 3".' },
  { forme: 'Répéter tant que {COND}', canonique: 'Crée une boucle tant que "$1"',
    genre: 'synonyme', raison: 'corpus libre, à l’infinitif',
    demonstration: 'Répéter tant que "i < 3".' },
  { forme: 'Crée un bloc sinon', canonique: 'Ajoute une branche sinon',
    genre: 'synonyme', raison: '« bloc » employé là où le catalogue dit « branche »',
    demonstration: 'Crée un bloc sinon.' },
  { forme: 'Si {COND} alors', canonique: 'Crée un bloc si "$1"',
    genre: 'synonyme', raison: 'corpus libre : « Si x est plus grand que 0 alors. » — avec la condition écrite',
    demonstration: 'Si "x > 0" alors.' },
  { forme: 'Si {COND}', canonique: 'Crée un bloc si "$1"',
    genre: 'courte', raison: 'la forme la plus courte d’un bloc conditionnel',
    demonstration: 'Si "x > 0".' },
  { forme: 'Tant que {COND}', canonique: 'Crée une boucle tant que "$1"',
    genre: 'courte', raison: 'la forme la plus courte d’une boucle',
    demonstration: 'Tant que "i < 3".' },

  // ---- les fichiers et la fiabilité --------------------------------------
  { forme: 'Fermer le fichier {NOM}', canonique: 'Ferme le fichier $1',
    genre: 'synonyme', raison: 'corpus libre : « Fermer le fichier f. »',
    demonstration: 'Fermer le fichier f.' },
  { forme: 'Vérifier que {COND}', canonique: 'Vérifie que "$1"',
    genre: 'synonyme', raison: 'corpus libre : « Vérifier que x n’est pas nul. » — avec la condition écrite',
    demonstration: 'Vérifier que "x > 0".' },
  // La phrase du catalogue est « Libère la mémoire POINTÉE PAR p. » : mon
  // gabarit écrivait « de p », qui n'existe pas. Trouvé par le corpus de
  // développement, qui refusait la phrase sans que rien ne le signale.
  { forme: 'Libérer la mémoire de {NOM}', canonique: 'Libère la mémoire pointée par $1',
    genre: 'synonyme', raison: 'corpus libre : « Libérer la mémoire de p. »',
    demonstration: 'Libérer la mémoire de p.' },
  { forme: 'Libère la mémoire de {NOM}', canonique: 'Libère la mémoire pointée par $1',
    genre: 'courte', raison: 'corpus de développement : « Libérer la mémoire de tampon. »',
    demonstration: 'Libère la mémoire de p.' },
  { forme: 'Inclure la bibliothèque {NOM}.h', canonique: 'Inclue la bibliothèque $1.h',
    genre: 'synonyme', raison: 'corpus libre : « Inclure la bibliothèque stdio.h. »',
    demonstration: 'Inclure la bibliothèque stdio.h.' },

  // ======================================================================
  // Lot S5, deuxième passe : les 35 formulations que le CORPUS DE
  // DÉVELOPPEMENT a mesurées comme claires, dans le périmètre, et refusées.
  // Elles sont ajoutées parce qu'elles ont été rencontrées, pas imaginées —
  // et le corpus de validation, lui, n'a servi à rien de tout cela.
  // ======================================================================

  // --- l'affectation : huit verbes de plus ------------------------------
  { forme: 'Fixe {NOM} à {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'Fixe age à 20.' },
  { forme: 'Stocke {ENTIER} dans {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'Stocke 20 dans age.' },
  { forme: 'Initialise {NOM} à {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus de développement. Aucune lecture « créer » : elle inventerait le type',
    demonstration: 'Initialise age à 20.' },
  { forme: 'Affecte {ENTIER} à {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'courte', raison: 'corpus de développement : « la valeur » omis, la valeur reste écrite',
    demonstration: 'Affecte 20 à age.' },
  { forme: 'Range {ENTIER} dans {NOM}', canonique: 'Affecte la valeur $1 à $2',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'Range 20 dans age.' },
  { forme: 'Change {NOM} en {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'Change age en 20.' },
  { forme: '{NOM} prend la valeur {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'age prend la valeur 20.' },
  { forme: '{NOM} devient {ENTIER}', canonique: 'Affecte la valeur $2 à $1',
    genre: 'affectation', raison: 'corpus de développement',
    demonstration: 'age devient 20.' },

  // --- la déclaration ---------------------------------------------------
  { forme: 'Crée une variable entière nommée {NOM}', canonique: 'Déclare un entier nommé $1',
    genre: 'synonyme', raison: 'corpus de développement : « variable entière » pour « entier »',
    demonstration: 'Crée une variable entière nommée compteur.' },
  { forme: 'Réserve un entier nommé {NOM}', canonique: 'Déclare un entier nommé $1',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Réserve un entier nommé compteur.' },
  { forme: 'Déclare le caractère {NOM}', canonique: 'Déclare un caractère nommé $1',
    genre: 'courte', raison: 'corpus de développement : article défini, comme pour l’entier',
    demonstration: 'Déclare le caractère lettre.' },
  { forme: 'Déclarer le caractère {NOM}', canonique: 'Déclare un caractère nommé $1',
    genre: 'courte', raison: 'la même, à l’infinitif',
    demonstration: 'Déclarer le caractère lettre.' },
  { forme: 'Crée un caractère {NOM} de valeur {CAR}', canonique: 'Crée un caractère nommé $1 de valeur $2',
    genre: 'courte', raison: '« nommé » omis, comme pour l’entier',
    demonstration: 'Crée un caractère lettre de valeur \'A\'.' },

  // --- l'expression -----------------------------------------------------
  { forme: 'Évalue {EXPR} dans {NOM}', canonique: 'Affecte à $2 le résultat de "$1"',
    genre: 'ordre', raison: 'corpus de développement : synonyme de « Calcule … dans … »',
    demonstration: 'Évalue "a * b" dans produit.' },

  // --- l'affichage ------------------------------------------------------
  { forme: 'Écris {NOM} à l’écran', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Écris total à l’écran.' },
  { forme: 'Affiche {NOM} à l’écran', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Affiche total à l’écran.' },
  { forme: 'Affiche le contenu de {NOM}', canonique: 'Affiche la valeur de $1',
    genre: 'synonyme', raison: 'corpus de développement : « le contenu de » nomme la valeur',
    demonstration: 'Affiche le contenu de total.' },
  { forme: 'Écris le texte {TEXTE}', canonique: 'Affiche le texte "$1"',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Écris le texte "Bonjour".' },
  { forme: 'Écrire le texte {TEXTE}', canonique: 'Affiche le texte "$1"',
    genre: 'synonyme', raison: 'la même, à l’infinitif',
    demonstration: 'Écrire le texte "Bonjour".' },
  { forme: 'Affiche une ligne vide', canonique: 'Affiche un retour à la ligne',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Affiche une ligne vide.' },
  { forme: 'Va à la ligne', canonique: 'Affiche un retour à la ligne',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Va à la ligne.' },

  // --- les décisions ----------------------------------------------------
  { forme: 'Teste si {COND}', canonique: 'Crée un bloc si "$1"',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Teste si "age >= 18".' },
  { forme: 'Ouvre un bloc si {COND}', canonique: 'Crée un bloc si "$1"',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Ouvre un bloc si "age >= 18".' },
  { forme: 'Sinon', canonique: 'Ajoute une branche sinon',
    genre: 'courte', raison: 'corpus de développement : la forme la plus courte',
    demonstration: 'Sinon.' },
  { forme: 'Autrement', canonique: 'Ajoute une branche sinon',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Autrement.' },
  { forme: 'Sinon si {COND}', canonique: 'Ajoute une branche sinon si "$1"',
    genre: 'courte', raison: 'corpus de développement',
    demonstration: 'Sinon si "age >= 12".' },

  // --- les boucles ------------------------------------------------------
  { forme: 'Boucle tant que {COND}', canonique: 'Crée une boucle tant que "$1"',
    genre: 'courte', raison: 'corpus de développement',
    demonstration: 'Boucle tant que "i < 10".' },
  { forme: 'Recommence tant que {COND}', canonique: 'Crée une boucle tant que "$1"',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Recommence tant que "i < 10".' },
  { forme: 'Arrête la boucle', canonique: 'Sors de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Arrête la boucle.' },
  { forme: 'Interrompt la boucle', canonique: 'Sors de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Interrompt la boucle.' },
  { forme: 'Saute à l’itération suivante', canonique: 'Passe à l’itération suivante de la boucle la plus intérieure',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Saute à l’itération suivante.' },

  // --- le retour et l'appel ---------------------------------------------
  { forme: 'Rends la valeur {ENTIER}', canonique: 'Retourne la valeur $1',
    genre: 'synonyme', raison: 'corpus de développement',
    demonstration: 'Rends la valeur 1.' },
  { forme: 'Sors de la fonction', canonique: 'Retourne',
    genre: 'synonyme', raison: 'corpus de développement : un retour sans valeur',
    demonstration: 'Sors de la fonction.' },
  { forme: 'Appelle la fonction {NOM}', canonique: 'Appelle $1',
    genre: 'courte', raison: 'corpus de développement : « la fonction » est redondant',
    demonstration: 'Appelle la fonction afficher.' },
  { forme: 'Appelle la fonction {NOM} avec {EXPR}', canonique: 'Appelle $1 avec "$2"',
    genre: 'courte', raison: 'corpus de développement, un argument',
    demonstration: 'Appelle la fonction somme avec "1".' },
  { forme: 'Appelle la fonction {NOM} avec {EXPR} et {EXPR}', canonique: 'Appelle $1 avec "$2" et "$3"',
    genre: 'courte', raison: 'corpus de développement, deux arguments',
    demonstration: 'Appelle la fonction somme avec "1" et "2".' },

  // --- les tableaux -----------------------------------------------------
  { forme: 'Déclare un tableau d’entiers nommé {NOM} de dimension {ENTIER}',
    canonique: 'Déclare un tableau de type int nommé $1 de dimension $2',
    genre: 'synonyme', raison: 'corpus de développement : « d’entiers » nomme le type',
    demonstration: 'Déclare un tableau d’entiers nommé notes de dimension 10.' },
  { forme: 'Mets {ENTIER} dans l’élément {EXPR} de {NOM}',
    canonique: 'Affecte la valeur $1 à l’élément "$2" de $3',
    genre: 'affectation', raison: 'corpus de développement : « mettre dans » appliqué à un élément',
    demonstration: 'Mets 5 dans l’élément "0" de notes.' },
  { forme: 'Affiche l’élément {EXPR} du tableau {NOM}', canonique: 'Affiche l’élément "$1" de $2',
    genre: 'synonyme', raison: 'corpus de développement : « du tableau » est redondant',
    demonstration: 'Affiche l’élément "0" du tableau notes.' },
];

/** Une forme compilée : son motif, son gabarit, et son entrée d'origine. */
type Compilee = { motif: RegExp; canonique: string; source: Reformulation };

/** Compile une forme en motif ancré. Les espaces deviennent « un ou plusieurs
 * blancs », les apostrophes acceptent les deux caractères, et le point final
 * est facultatif — exactement les tolérances du moteur strict. */
function compiler(entree: Reformulation): Compilee {
  let corps = '';
  let position = 0;
  const forme = entree.forme;
  while (position < forme.length) {
    const ouvrant = forme.indexOf('{', position);
    if (ouvrant === -1) { corps += echapper(forme.slice(position)); break; }
    corps += echapper(forme.slice(position, ouvrant));
    const fermant = forme.indexOf('}', ouvrant);
    if (fermant === -1) throw new Error('Reformulation mal formée : ' + forme);
    const capture = CAPTURES[forme.slice(ouvrant + 1, fermant)];
    if (capture === undefined) throw new Error('Capture inconnue dans : ' + forme);
    corps += capture;
    position = fermant + 1;
  }
  return { motif: new RegExp('^[ \\t]*' + corps + '[ \\t]*\\.?[ \\t]*$', 'iu'),
    canonique: entree.canonique, source: entree };
}

/** Échappe le texte fixe d'une forme, et y rend souples les deux tolérances
 * que le moteur strict accorde déjà : les blancs et l'apostrophe. */
function echapper(texte: string): string {
  return texte
    .replace(/[.*+?^${}()|[\]\\]/gu, caractere => '\\' + caractere)
    .replace(/ +/gu, '[ \\t]+')
    .replace(/['’]/gu, '[\'’]');
}

const COMPILEES: readonly Compilee[] = REFORMULATIONS.map(compiler);

export type Candidate = {
  /** La phrase canonique produite. */
  readonly phrase: string;
  readonly genre: GenreReformulation;
  readonly raison: string;
};

/**
 * Les phrases canoniques qu'une reformulation peut produire, dans l'ordre de
 * la table. Zéro, une, ou plusieurs — plusieurs **sens** différents feront une
 * ambiguïté, que l'appelant refusera.
 *
 * Aucune capture n'est relue : un nom, un entier, une expression ou un texte
 * sont recopiés tels quels dans le gabarit.
 */
export function reformuler(phrase: string): Candidate[] {
  const candidates: Candidate[] = [];
  const vues = new Set<string>();
  for (const { motif, canonique, source } of COMPILEES) {
    const trouve = motif.exec(phrase);
    if (!trouve) continue;
    const produite = canonique.replace(/\$([1-9])/gu, (_, chiffre: string) => trouve[Number(chiffre)] ?? '')
      + '.';
    if (vues.has(produite)) continue;
    vues.add(produite);
    candidates.push({ phrase: produite, genre: source.genre, raison: source.raison });
  }
  return candidates;
}
