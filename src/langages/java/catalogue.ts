/** Le catalogue pédagogique **natif** de Java : une table, et un moteur.
 *
 * Lots J3 à J8. La forme est celle du catalogue natif Python, et ce n'est pas
 * de la paresse : elle a été corrigée trois fois par des défauts réels, et
 * repartir d'une page blanche aurait été repayer ces trois corrections.
 *
 * Trois tables, et rien d'autre :
 *
 *   - `MOTIFS` : une forme française **ancrée**, le genre qu'elle produit ;
 *   - `PROCHES` : les formes **incomplètes** les plus probables, avec leur
 *     diagnostic précis. Sans elles, « Crée une classe. » ne recevrait qu'un
 *     « formulation inconnue », qui n'apprend rien ;
 *   - `AMORCES` : les premiers mots qui font entrer une phrase dans ce
 *     catalogue. Hors de cette liste, le module **décline**, et le diagnostic
 *     du catalogue partagé survit.
 *
 * Les trois leçons du patron Python, reprises telles quelles :
 *   1. les motifs sont compilés avec le drapeau **`d`**. Localiser une capture
 *      par `indexOf` avait résolu un texte `" "` sur la première espace de la
 *      phrase ;
 *   2. une seule entrée publique, parce que pour une intention native la
 *      phrase française et le code produit appartiennent au même module ;
 *   3. la règle de **texte en trop** est générale, pas une par motif. Deux
 *      diagnostics avaient été perdus en la particularisant.
 */
import { parseNumericExpression } from '../../numericExpression.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import { parseStringLiteral } from '../../stringLiteral.ts';
import { MOTS_RESERVES_JAVA } from './expression.ts';
import type { AnalyseJava, DiagnosticJv, GenreJava, InstructionJava, TypeJava } from './instructions.ts';

const CAPTURES: Readonly<Record<string, string>> = {
  NOM: '([A-Za-z][A-Za-z0-9_]*)',
  /** Un nom de classe, d'interface ou d'exception. Les points sont admis :
   * `java.util.List` est un nom de classe qualifié, pas deux noms. */
  CLASSE: '([A-Za-z][A-Za-z0-9_]*(?:\\.[A-Za-z][A-Za-z0-9_]*)*)',
  ENTIER: '(-?[0-9]+)',
  EXPR: '"([^"]*)"',
  TEXTE: '"([^"]*)"',
  CAR: '(\'(?:\\\\.|[^\'\\\\])\')',
  /** Les sept types que le catalogue natif écrit. `chaîne` est dedans parce
   * qu'une collection de chaînes ne s'écrit pas comme une d'entiers. */
  TYPE: '(int|long|float|double|char|bool[ée]en|cha[îi]ne)',
  /** N'importe quel mot. Réservé aux formes PROCHES : il sert à reconnaître
   * une phrase presque juste pour en dire ce qui cloche, jamais à accepter. */
  MOT: '([^\\s.]+)',
};

type Motif = {
  readonly forme: string;
  readonly kind: GenreJava;
  /** Une phrase qui la démontre. Un test exige qu'elle soit reconnue, et que
   * son rendu soit exactement celui de la spécification. */
  readonly demonstration: string;
};

/** Les premiers mots qui font entrer une phrase dans ce catalogue. */
const AMORCES: readonly string[] = [
  'crée', 'créé', 'déclare', 'ajoute', 'affecte', 'affiche', 'lis', 'retire',
  'importe', 'lance', 'appelle', 'retourne', 'associe', 'incrémente', 'décrémente',
  // Les deux formes PROCHES qui refusent faute de pas écrit.
  'augmente', 'diminue',
];

export const MOTIFS: readonly Motif[] = [
  // ============================ J1 — types, classes =====================
  { forme: 'Crée une classe nommée {CLASSE}', kind: 'JAVA_CLASSE',
    demonstration: 'Crée une classe nommée Eleve.' },
  { forme: 'Crée une classe interne nommée {CLASSE}', kind: 'JAVA_CLASSE_INTERNE',
    demonstration: 'Crée une classe interne nommée Noeud.' },
  { forme: 'Crée un entier long nommé {NOM} de valeur {ENTIER}', kind: 'JAVA_LONG',
    demonstration: 'Crée un entier long nommé grand de valeur 10000000000.' },
  { forme: 'Crée un réel simple nommé {NOM} de valeur {EXPR}', kind: 'JAVA_FLOAT',
    demonstration: 'Crée un réel simple nommé x de valeur "1.5".' },
  { forme: 'Crée un booléen nommé {NOM} de valeur vrai', kind: 'JAVA_BOOLEEN',
    demonstration: 'Crée un booléen nommé fini de valeur vrai.' },
  { forme: 'Crée un booléen nommé {NOM} de valeur faux', kind: 'JAVA_BOOLEEN',
    demonstration: 'Crée un booléen nommé fini de valeur faux.' },
  { forme: 'Déclare un booléen nommé {NOM}', kind: 'JAVA_DECL_BOOLEEN',
    demonstration: 'Déclare un booléen nommé fini.' },
  { forme: 'Déclare une chaîne nommée {NOM}', kind: 'JAVA_DECL_CHAINE',
    demonstration: 'Déclare une chaîne nommée nom.' },
  { forme: 'Crée une constante entière de classe nommée {NOM} de valeur {ENTIER}',
    kind: 'JAVA_CONSTANTE_CLASSE',
    demonstration: 'Crée une constante entière de classe nommée MAX de valeur 100.' },

  // ============================ J2 — affichage, saisie ==================
  { forme: 'Affiche la valeur de {NOM} et passe à la ligne', kind: 'JAVA_AFFICHE_LIGNE',
    demonstration: 'Affiche la valeur de n et passe à la ligne.' },
  { forme: 'Affiche le texte {TEXTE} et passe à la ligne', kind: 'JAVA_AFFICHE_TEXTE_LIGNE',
    demonstration: 'Affiche le texte "bonjour" et passe à la ligne.' },
  // Pas de « Affiche {NOM} en hexadecimal » : c'est EXACTEMENT la phrase de
  // PRINT_FORMATTED du catalogue partage, qui est consulte d'abord. Le motif
  // natif etait donc une intention MORTE, et un test l'a dit.
  { forme: 'Crée un lecteur de saisie nommé {NOM}', kind: 'JAVA_LECTEUR_SAISIE',
    demonstration: 'Crée un lecteur de saisie nommé lecteur.' },
  { forme: 'Lis un entier depuis le lecteur de saisie {NOM} dans {NOM}', kind: 'JAVA_LIRE_ENTIER_SAISIE',
    demonstration: 'Lis un entier depuis le lecteur de saisie lecteur dans n.' },
  { forme: 'Lis une ligne depuis le lecteur de saisie {NOM} dans {NOM}', kind: 'JAVA_LIRE_LIGNE_SAISIE',
    demonstration: 'Lis une ligne depuis le lecteur de saisie lecteur dans ligne.' },

  // ============================ J3 — expressions, chaînes ===============
  { forme: 'Affecte le texte {TEXTE} à {NOM}', kind: 'JAVA_AFFECTE_TEXTE',
    demonstration: 'Affecte le texte "Ada" à s.' },
  { forme: 'Incrémente {NOM}', kind: 'JAVA_INCREMENTE', demonstration: 'Incrémente n.' },
  { forme: 'Décrémente {NOM}', kind: 'JAVA_DECREMENTE', demonstration: 'Décrémente n.' },
  { forme: 'Affecte à {NOM} le résultat converti en entier de {EXPR}', kind: 'JAVA_CONVERTI_ENTIER',
    demonstration: 'Affecte à n le résultat converti en entier de "x".' },
  { forme: 'Affecte à {NOM} le résultat converti en réel de {EXPR}', kind: 'JAVA_CONVERTI_REEL',
    demonstration: 'Affecte à x le résultat converti en réel de "n".' },
  { forme: 'Affecte à {NOM} la concaténation de {NOM} et {TEXTE}', kind: 'JAVA_CONCATENE',
    demonstration: 'Affecte à s la concaténation de s et "!".' },
  { forme: 'Affecte à {NOM} la longueur de la chaîne {NOM}', kind: 'JAVA_LONGUEUR_CHAINE',
    demonstration: 'Affecte à n la longueur de la chaîne s.' },
  { forme: 'Affecte à {NOM} le caractère d’indice {EXPR} de la chaîne {NOM}', kind: 'JAVA_CARACTERE_INDICE',
    demonstration: 'Affecte à c le caractère d’indice "i" de la chaîne s.' },
  { forme: 'Affecte à {NOM} la comparaison des chaînes {NOM} et {NOM}', kind: 'JAVA_COMPARE_CHAINES',
    demonstration: 'Affecte à egal la comparaison des chaînes a et b.' },
  { forme: 'Affecte à {NOM} la conversion en entier de la chaîne {NOM}', kind: 'JAVA_CHAINE_VERS_ENTIER',
    demonstration: 'Affecte à n la conversion en entier de la chaîne s.' },

  // ============================ J4 — contrôle ===========================
  { forme: 'Crée une boucle pour chaque {TYPE} nommé {NOM} du tableau {NOM}',
    kind: 'JAVA_POUR_CHAQUE_TABLEAU',
    demonstration: 'Crée une boucle pour chaque int nommé v du tableau notes.' },
  { forme: 'Crée une boucle pour chaque {TYPE} nommé {NOM} de la liste {NOM}',
    kind: 'JAVA_POUR_CHAQUE_LISTE',
    demonstration: 'Crée une boucle pour chaque int nommé v de la liste notes.' },
  { forme: 'Ajoute un cas pour le texte {TEXTE}', kind: 'JAVA_CAS_TEXTE',
    demonstration: 'Ajoute un cas pour le texte "lundi".' },

  // ============================ J5 — méthodes ===========================
  { forme: 'Crée une méthode de classe nommée {NOM} qui ne retourne rien',
    kind: 'JAVA_METHODE_STATIQUE_VIDE',
    demonstration: 'Crée une méthode de classe nommée afficher qui ne retourne rien.' },
  { forme: 'Crée une méthode publique nommée {NOM} qui retourne un {TYPE}',
    kind: 'JAVA_METHODE_PUBLIQUE',
    demonstration: 'Crée une méthode publique nommée getAge qui retourne un int.' },
  { forme: 'Crée une méthode publique nommée {NOM} qui ne retourne rien',
    kind: 'JAVA_METHODE_PUBLIQUE_VIDE',
    demonstration: 'Crée une méthode publique nommée afficher qui ne retourne rien.' },
  { forme: 'Crée une méthode privée nommée {NOM} qui ne retourne rien', kind: 'JAVA_METHODE_PRIVEE',
    demonstration: 'Crée une méthode privée nommée verifier qui ne retourne rien.' },
  { forme: 'Crée une méthode redéfinie nommée {NOM} qui ne retourne rien', kind: 'JAVA_METHODE_REDEFINIE',
    demonstration: 'Crée une méthode redéfinie nommée afficher qui ne retourne rien.' },
  { forme: 'Crée une méthode de classe nommée {NOM} qui ne retourne rien et peut lancer {CLASSE}',
    kind: 'JAVA_METHODE_LANCE',
    demonstration: 'Crée une méthode de classe nommée lire qui ne retourne rien et peut lancer IOException.' },
  { forme: 'Retourne le texte {TEXTE}', kind: 'JAVA_RETOURNE_TEXTE',
    demonstration: 'Retourne le texte "fini".' },
  { forme: 'Retourne la chaîne {NOM}', kind: 'JAVA_RETOURNE_CHAINE',
    demonstration: 'Retourne la chaîne nom.' },
  { forme: 'Appelle la méthode {NOM} de {NOM}', kind: 'JAVA_APPELLE_METHODE',
    demonstration: 'Appelle la méthode afficher de e.' },
  { forme: 'Affecte à {NOM} le résultat de l’appel de la méthode {NOM} de {NOM}',
    kind: 'JAVA_APPELLE_METHODE_ASSIGNE',
    demonstration: 'Affecte à n le résultat de l’appel de la méthode getAge de e.' },

  // ============================ J6 — tableaux, collections ==============
  // Décision J10 : le mot « tableau » est dans la phrase. Les phrases
  // historiques du catalogue partagé — « de t » — restent valides, règle 7.
  { forme: 'Déclare un tableau de type {TYPE} nommé {NOM}', kind: 'JAVA_DECL_TABLEAU',
    demonstration: 'Déclare un tableau de type int nommé notes.' },
  { forme: 'Affecte la valeur {ENTIER} à l’élément {EXPR} du tableau {NOM}', kind: 'JAVA_TABLEAU_ASSIGNE',
    demonstration: 'Affecte la valeur 5 à l’élément "0" du tableau notes.' },
  { forme: 'Affecte le caractère {CAR} à l’élément {EXPR} du tableau {NOM}', kind: 'JAVA_TABLEAU_ASSIGNE_CAR',
    demonstration: 'Affecte le caractère \'A\' à l’élément "0" du tableau lettres.' },
  { forme: 'Affecte à l’élément {EXPR} du tableau {NOM} le résultat numérique de {EXPR}',
    kind: 'JAVA_TABLEAU_ASSIGNE_EXPR',
    demonstration: 'Affecte à l’élément "i" du tableau notes le résultat numérique de "a + 1".' },
  { forme: 'Affiche l’élément {EXPR} du tableau {NOM}', kind: 'JAVA_TABLEAU_AFFICHE',
    demonstration: 'Affiche l’élément "0" du tableau notes.' },
  { forme: 'Affiche le caractère de l’élément {EXPR} du tableau {NOM}', kind: 'JAVA_TABLEAU_AFFICHE_CAR',
    demonstration: 'Affiche le caractère de l’élément "i" du tableau lettres.' },
  { forme: 'Affecte à {NOM} la taille du tableau {NOM}', kind: 'JAVA_TAILLE_TABLEAU',
    demonstration: 'Affecte à n la taille du tableau notes.' },
  { forme: 'Crée une liste de type {TYPE} nommée {NOM}', kind: 'JAVA_LISTE',
    demonstration: 'Crée une liste de type int nommée notes.' },
  { forme: 'Ajoute {EXPR} à la fin de la liste {NOM}', kind: 'JAVA_LISTE_AJOUTE',
    demonstration: 'Ajoute "15" à la fin de la liste notes.' },
  { forme: 'Ajoute le texte {TEXTE} à la fin de la liste {NOM}', kind: 'JAVA_LISTE_AJOUTE_TEXTE',
    demonstration: 'Ajoute le texte "Ada" à la fin de la liste noms.' },
  { forme: 'Affecte à {NOM} l’élément {EXPR} de la liste {NOM}', kind: 'JAVA_LISTE_ELEMENT',
    demonstration: 'Affecte à n l’élément "0" de la liste notes.' },
  { forme: 'Affecte à {NOM} la taille de la liste {NOM}', kind: 'JAVA_LISTE_TAILLE',
    demonstration: 'Affecte à n la taille de la liste notes.' },
  { forme: 'Retire l’élément {EXPR} de la liste {NOM}', kind: 'JAVA_LISTE_RETIRE',
    demonstration: 'Retire l’élément "0" de la liste notes.' },
  { forme: 'Crée une table de type {TYPE} nommée {NOM} avec des clés textuelles', kind: 'JAVA_TABLE',
    demonstration: 'Crée une table de type int nommée notes avec des clés textuelles.' },
  { forme: 'Associe {EXPR} à la clé {TEXTE} dans la table {NOM}', kind: 'JAVA_TABLE_ASSOCIE',
    demonstration: 'Associe "15" à la clé "ada" dans la table notes.' },
  { forme: 'Affecte à {NOM} la valeur de la clé {TEXTE} dans la table {NOM}', kind: 'JAVA_TABLE_VALEUR',
    demonstration: 'Affecte à n la valeur de la clé "ada" dans la table notes.' },
  { forme: 'Crée un ensemble de type {TYPE} nommé {NOM}', kind: 'JAVA_ENSEMBLE',
    demonstration: 'Crée un ensemble de type int nommé vus.' },
  { forme: 'Ajoute {EXPR} à l’ensemble {NOM}', kind: 'JAVA_ENSEMBLE_AJOUTE',
    demonstration: 'Ajoute "3" à l’ensemble vus.' },
  { forme: 'Crée une boucle pour chaque clé textuelle nommée {NOM} de la table {NOM}',
    kind: 'JAVA_POUR_CHAQUE_CLE',
    demonstration: 'Crée une boucle pour chaque clé textuelle nommée cle de la table notes.' },

  // ============================ J7 — objets =============================
  { forme: 'Ajoute un champ privé de type {TYPE} nommé {NOM}', kind: 'JAVA_CHAMP_PRIVE',
    demonstration: 'Ajoute un champ privé de type int nommé age.' },
  { forme: 'Ajoute un champ de type chaîne nommé {NOM}', kind: 'JAVA_CHAMP_CHAINE',
    demonstration: 'Ajoute un champ de type chaîne nommé nom.' },
  { forme: 'Ajoute un champ tableau de type {TYPE} nommé {NOM} de dimension {ENTIER}',
    kind: 'JAVA_CHAMP_TABLEAU',
    demonstration: 'Ajoute un champ tableau de type int nommé notes de dimension 10.' },
  { forme: 'Crée un constructeur qui ne prend rien', kind: 'JAVA_CONSTRUCTEUR',
    demonstration: 'Crée un constructeur qui ne prend rien.' },
  { forme: 'Crée un constructeur qui prend un {TYPE} nommé {NOM}', kind: 'JAVA_CONSTRUCTEUR_PARAMETRE',
    demonstration: 'Crée un constructeur qui prend un int nommé age.' },
  { forme: 'Affecte au champ {NOM} la valeur du paramètre {NOM}', kind: 'JAVA_CHAMP_PARAMETRE',
    demonstration: 'Affecte au champ age la valeur du paramètre age.' },
  { forme: 'Crée un objet nommé {NOM} de la classe {CLASSE} avec {EXPR}', kind: 'JAVA_OBJET_ARGUMENT',
    demonstration: 'Crée un objet nommé e de la classe Eleve avec "20".' },
  { forme: 'Affecte à {NOM} le champ {NOM} de {NOM}', kind: 'JAVA_LIT_CHAMP_OBJET',
    demonstration: 'Affecte à n le champ age de e.' },

  // ============================ J8 — héritage ===========================
  { forme: 'Crée une classe nommée {CLASSE} qui hérite de {CLASSE}', kind: 'JAVA_CLASSE_HERITE',
    demonstration: 'Crée une classe nommée Etudiant qui hérite de Personne.' },
  { forme: 'Crée une classe abstraite nommée {CLASSE}', kind: 'JAVA_CLASSE_ABSTRAITE',
    demonstration: 'Crée une classe abstraite nommée Forme.' },
  { forme: 'Crée une interface nommée {CLASSE}', kind: 'JAVA_INTERFACE',
    demonstration: 'Crée une interface nommée Affichable.' },
  { forme: 'Crée une classe nommée {CLASSE} qui implémente {CLASSE}', kind: 'JAVA_CLASSE_IMPLEMENTE',
    demonstration: 'Crée une classe nommée Eleve qui implémente Affichable.' },
  { forme: 'Ajoute une méthode attendue nommée {NOM} qui ne retourne rien', kind: 'JAVA_METHODE_ATTENDUE',
    demonstration: 'Ajoute une méthode attendue nommée afficher qui ne retourne rien.' },
  { forme: 'Ajoute une méthode attendue nommée {NOM} qui retourne un {TYPE}',
    kind: 'JAVA_METHODE_ATTENDUE_RETOUR',
    demonstration: 'Ajoute une méthode attendue nommée taille qui retourne un int.' },
  { forme: 'Ajoute une méthode abstraite nommée {NOM} qui retourne un {TYPE}', kind: 'JAVA_METHODE_ABSTRAITE',
    demonstration: 'Ajoute une méthode abstraite nommée aire qui retourne un int.' },
  { forme: 'Appelle le constructeur de la classe parente', kind: 'JAVA_SUPER',
    demonstration: 'Appelle le constructeur de la classe parente.' },
  { forme: 'Appelle le constructeur de la classe parente avec {EXPR}', kind: 'JAVA_SUPER_ARGUMENT',
    demonstration: 'Appelle le constructeur de la classe parente avec "20".' },
  { forme: 'Appelle la méthode {NOM} de la classe parente', kind: 'JAVA_SUPER_METHODE',
    demonstration: 'Appelle la méthode afficher de la classe parente.' },
  { forme: 'Déclare une variable de type {CLASSE} nommée {NOM}', kind: 'JAVA_DECL_TYPE_CLASSE',
    demonstration: 'Déclare une variable de type Affichable nommée a.' },
  { forme: 'Crée une variable de type {CLASSE} nommée {NOM} comme un objet de la classe {CLASSE}',
    kind: 'JAVA_OBJET_POLYMORPHE',
    demonstration: 'Crée une variable de type Affichable nommée a comme un objet de la classe Eleve.' },
  // Manque trouve par l'exercice de cloture : des qu'une classe a un
  // constructeur a parametre, son constructeur sans argument CESSE d'exister,
  // et la forme sans argument ne compile plus.
  { forme: 'Crée une variable de type {CLASSE} nommée {NOM} comme un objet de la classe {CLASSE} avec {EXPR}',
    kind: 'JAVA_OBJET_POLYMORPHE_ARG',
    demonstration: 'Crée une variable de type Affichable nommée a comme un objet de la classe Eleve avec "12".' },

  // ============================ J9 — exceptions, fichiers ===============
  { forme: 'Déclare le paquetage {NOM}', kind: 'JAVA_PAQUETAGE',
    demonstration: 'Déclare le paquetage ecole.' },
  { forme: 'Importe {CLASSE}', kind: 'JAVA_IMPORT', demonstration: 'Importe java.util.List.' },
  { forme: 'Crée un bloc essaie', kind: 'JAVA_ESSAIE', demonstration: 'Crée un bloc essaie.' },
  { forme: 'Ajoute une branche attrape {CLASSE} nommée {NOM}', kind: 'JAVA_ATTRAPE',
    demonstration: 'Ajoute une branche attrape IOException nommée e.' },
  { forme: 'Ajoute une branche finalement', kind: 'JAVA_FINALEMENT',
    demonstration: 'Ajoute une branche finalement.' },
  { forme: 'Lance une exception {CLASSE} avec le texte {TEXTE}', kind: 'JAVA_LANCE',
    demonstration: 'Lance une exception IllegalArgumentException avec le texte "âge négatif".' },
  { forme: 'Affiche le message de l’exception {NOM}', kind: 'JAVA_MESSAGE_EXCEPTION',
    demonstration: 'Affiche le message de l’exception e.' },
  { forme: 'Crée un bloc essaie avec un lecteur nommé {NOM} sur le fichier {TEXTE}',
    kind: 'JAVA_ESSAIE_LECTEUR',
    demonstration: 'Crée un bloc essaie avec un lecteur nommé lecteur sur le fichier "notes.txt".' },
  { forme: 'Crée un bloc essaie avec un écrivain nommé {NOM} sur le fichier {TEXTE}',
    kind: 'JAVA_ESSAIE_ECRIVAIN',
    demonstration: 'Crée un bloc essaie avec un écrivain nommé f sur le fichier "sortie.txt".' },
  { forme: 'Lis une ligne depuis le lecteur {NOM} dans {NOM}', kind: 'JAVA_LIRE_LIGNE_FICHIER',
    demonstration: 'Lis une ligne depuis le lecteur lecteur dans ligne.' },
];

/** Les formes **incomplètes** les plus probables. Elles ne produisent jamais
 * une acceptation : seulement un refus qui dit ce qui manque. */
const PROCHES: readonly { forme: string; code: string; message: string }[] = [
  { forme: 'Crée une classe', code: 'MISSING_CLASS_NAME',
    message: 'Il manque le nom de la classe : « Crée une classe nommée Eleve. ».' },
  { forme: 'Crée une interface', code: 'MISSING_CLASS_NAME',
    message: 'Il manque le nom de l’interface : « Crée une interface nommée Affichable. ».' },
  { forme: 'Augmente {NOM}', code: 'MISSING_STEP',
    message: 'De combien ? « Augmente » ne dit pas le pas, et A ne le devine pas. Écrivez '
      + '« Incrémente n. » pour un pas de 1, ou « Affecte à n le résultat de "n + 5". ».' },
  { forme: 'Diminue {NOM}', code: 'MISSING_STEP',
    message: 'De combien ? « Diminue » ne dit pas le pas, et A ne le devine pas. Écrivez '
      + '« Décrémente n. » pour un pas de 1, ou « Affecte à n le résultat de "n - 5". ».' },
  { forme: 'Crée une liste nommée {NOM}', code: 'MISSING_ELEMENT_TYPE',
    message: 'Il manque le type des éléments : en Java, une liste est typée. Écrivez '
      + '« Crée une liste de type int nommée notes. ».' },
  { forme: 'Crée une méthode nommée {NOM} qui ne retourne rien', code: 'MISSING_METHOD_KIND',
    message: 'Une méthode Java porte une visibilité, et « static » décide si elle est appelable '
      + 'depuis main. A ne choisit ni l’une ni l’autre : écrivez « Crée une méthode de classe … », '
      + '« … publique … » ou « … privée … ».' },
  { forme: 'Crée un objet nommé {NOM} de la classe {CLASSE} avec', code: 'MISSING_EXPRESSION',
    message: 'Il manque l’argument du constructeur, entre guillemets.' },
];

function echapper(texte: string): string {
  return texte
    .replace(/[.*+?^${}()|[\]\\]/gu, caractere => '\\' + caractere)
    // Les deux apostrophes sont acceptées : un utilisateur tape l'une ou
    // l'autre selon son clavier, et refuser la droite serait refuser une
    // phrase juste. Le défaut a été trouvé en phase 2, au lot S4.
    .replace(/['’]/gu, '[\'’]')
    .replace(/[ \t]+/gu, '[ \\t]+');
}

function compiler(forme: string): { motif: RegExp; types: string[] } {
  let corps = '';
  let position = 0;
  const types: string[] = [];
  while (position < forme.length) {
    const ouvrant = forme.indexOf('{', position);
    if (ouvrant === -1) { corps += echapper(forme.slice(position)); break; }
    corps += echapper(forme.slice(position, ouvrant));
    const fermant = forme.indexOf('}', ouvrant);
    if (fermant === -1) throw new Error('Motif mal formé : ' + forme);
    const nom = forme.slice(ouvrant + 1, fermant);
    const capture = CAPTURES[nom];
    if (capture === undefined) throw new Error('Capture inconnue dans : ' + forme);
    corps += capture;
    types.push(nom);
    position = fermant + 1;
  }
  // Le drapeau `d` donne les POSITIONS exactes des captures.
  return { motif: new RegExp('^[ \\t]*' + corps + '[ \\t]*\\.?[ \\t]*$', 'diu'), types };
}

type Compile = Motif & { motif: RegExp; types: string[] };
const COMPILES: readonly Compile[] = MOTIFS.map(entree => ({ ...entree, ...compiler(entree.forme) }));
const PROCHES_COMPILES = PROCHES.map(entree => ({ ...entree, ...compiler(entree.forme) }));

type Lues = {
  noms: string[]; classes: string[]; expressions: NumericExpression[];
  textes: string[]; entiers: string[]; types: TypeJava[];
};

const TYPES_LUS: Readonly<Record<string, TypeJava>> = {
  int: 'int', long: 'long', float: 'float', double: 'double', char: 'char',
  booleen: 'boolean', booléen: 'boolean', chaine: 'chaine', chaîne: 'chaine',
};

function minuscule(mot: string): string { return mot.toLocaleLowerCase('fr'); }

function lire(phrase: string, trouve: RegExpExecArray, types: string[]): Lues | DiagnosticJv {
  const lues: Lues = { noms: [], classes: [], expressions: [], textes: [], entiers: [], types: [] };
  const budget = { count: 0 };
  const refus = (code: string, message: string, debut: number, fin: number): DiagnosticJv =>
    ({ code, category: 'understanding', severity: 'error', message, range: { start: debut, end: fin } });

  for (const [index, type] of types.entries()) {
    const valeur = trouve[index + 1];
    const position = trouve.indices?.[index + 1];
    if (valeur === undefined || position === undefined) {
      throw new Error('Invariant interne : capture absente.');
    }
    const [debut, fin] = position;
    switch (type) {
      case 'NOM': {
        if (MOTS_RESERVES_JAVA.has(valeur)) {
          return refus('JAVA_KEYWORD_IDENTIFIER',
            `« ${valeur} » est un mot réservé de Java et ne peut pas nommer une variable, un champ `
            + 'ni une méthode.', debut, fin);
        }
        lues.noms.push(valeur);
        break;
      }
      case 'CLASSE': {
        const dernier = valeur.split('.').at(-1) ?? valeur;
        if (MOTS_RESERVES_JAVA.has(dernier)) {
          return refus('JAVA_KEYWORD_IDENTIFIER',
            `« ${dernier} » est un mot réservé de Java et ne peut pas nommer une classe.`, debut, fin);
        }
        lues.classes.push(valeur);
        break;
      }
      case 'ENTIER': lues.entiers.push(valeur); break;
      case 'TEXTE': {
        const lu = parseStringLiteral(phrase, debut - 1, fin + 1);
        if (lu.status === 'rejected') return { ...lu.diagnostic, category: 'understanding', severity: 'error' };
        lues.textes.push(lu.literal.value);
        break;
      }
      case 'EXPR': {
        const analyse = parseNumericExpression(phrase, debut, fin, () => undefined,
          'Il manque l’expression.', budget);
        if (analyse.status === 'rejected') {
          return { ...analyse.diagnostic, category: 'understanding', severity: 'error' };
        }
        lues.expressions.push(analyse.expression);
        break;
      }
      case 'CAR': lues.textes.push(valeur); break;
      case 'TYPE': {
        const lu = TYPES_LUS[minuscule(valeur)];
        if (lu === undefined) return refus('UNSUPPORTED_TYPE', 'Type non pris en charge.', debut, fin);
        lues.types.push(lu);
        break;
      }
      case 'MOT': break;
      default: throw new Error('Placeholder non traité : ' + type);
    }
  }
  return lues;
}

/** Construit l'intention. Une seule entrée par genre, et aucun genre sans
 * entrée : TypeScript le vérifie par l'exhaustivité du `switch`. */
function construire(kind: GenreJava, c: Lues, phrase: string): InstructionJava | DiagnosticJv {
  const nom = (i: number): string => {
    const valeur = c.noms[i];
    if (valeur === undefined) throw new Error('Invariant interne : nom absent.');
    return valeur;
  };
  const classe = (i: number): string => {
    const valeur = c.classes[i];
    if (valeur === undefined) throw new Error('Invariant interne : classe absente.');
    return valeur;
  };
  const texte = (i: number): string => {
    const valeur = c.textes[i];
    if (valeur === undefined) throw new Error('Invariant interne : texte absent.');
    return valeur;
  };
  const entier = (i: number): string => {
    const valeur = c.entiers[i];
    if (valeur === undefined) throw new Error('Invariant interne : entier absent.');
    return valeur;
  };
  const expr = (i: number): NumericExpression => {
    const valeur = c.expressions[i];
    if (valeur === undefined) throw new Error('Invariant interne : expression absente.');
    return valeur;
  };
  const type = (i: number): TypeJava => {
    const valeur = c.types[i];
    if (valeur === undefined) throw new Error('Invariant interne : type absent.');
    return valeur;
  };

  switch (kind) {
    case 'JAVA_CLASSE': return { kind, parameters: { classe: classe(0) } };
    case 'JAVA_CLASSE_INTERNE': return { kind, parameters: { classe: classe(0) } };
    case 'JAVA_LONG': return { kind, parameters: { nom: nom(0), valeur: entier(0) } };
    case 'JAVA_FLOAT': return { kind, parameters: { nom: nom(0), expression: expr(0) } };
    // La valeur booléenne est dans le MOT de la phrase, pas dans une capture :
    // deux motifs distincts, et c'est leur forme qui porte l'information.
    case 'JAVA_BOOLEEN':
      return { kind, parameters: { nom: nom(0), valeur: /de[ \t]+valeur[ \t]+vrai/u.test(phrase) } };
    case 'JAVA_DECL_BOOLEEN': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_DECL_CHAINE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_CONSTANTE_CLASSE': return { kind, parameters: { nom: nom(0), valeur: entier(0) } };
    case 'JAVA_AFFICHE_LIGNE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_AFFICHE_TEXTE_LIGNE': return { kind, parameters: { texte: texte(0) } };
    case 'JAVA_LECTEUR_SAISIE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_LIRE_ENTIER_SAISIE': return { kind, parameters: { lecteur: nom(0), cible: nom(1) } };
    case 'JAVA_LIRE_LIGNE_SAISIE': return { kind, parameters: { lecteur: nom(0), cible: nom(1) } };
    case 'JAVA_AFFECTE_TEXTE': return { kind, parameters: { nom: nom(0), texte: texte(0) } };
    case 'JAVA_INCREMENTE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_DECREMENTE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_CONVERTI_ENTIER': return { kind, parameters: { nom: nom(0), expression: expr(0) } };
    case 'JAVA_CONVERTI_REEL': return { kind, parameters: { nom: nom(0), expression: expr(0) } };
    case 'JAVA_CONCATENE':
      return { kind, parameters: { cible: nom(0), source: nom(1), texte: texte(0) } };
    case 'JAVA_LONGUEUR_CHAINE': return { kind, parameters: { cible: nom(0), chaine: nom(1) } };
    case 'JAVA_CARACTERE_INDICE':
      return { kind, parameters: { cible: nom(0), indice: expr(0), chaine: nom(1) } };
    case 'JAVA_COMPARE_CHAINES':
      return { kind, parameters: { cible: nom(0), gauche: nom(1), droite: nom(2) } };
    case 'JAVA_CHAINE_VERS_ENTIER': return { kind, parameters: { cible: nom(0), chaine: nom(1) } };
    case 'JAVA_POUR_CHAQUE_TABLEAU':
      return { kind, parameters: { type: type(0), nom: nom(0), tableau: nom(1) } };
    case 'JAVA_POUR_CHAQUE_LISTE':
      return { kind, parameters: { type: type(0), nom: nom(0), liste: nom(1) } };
    case 'JAVA_CAS_TEXTE': return { kind, parameters: { texte: texte(0) } };
    case 'JAVA_METHODE_STATIQUE_VIDE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_METHODE_PUBLIQUE': return { kind, parameters: { nom: nom(0), retour: type(0) } };
    case 'JAVA_METHODE_PUBLIQUE_VIDE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_METHODE_PRIVEE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_METHODE_REDEFINIE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_METHODE_LANCE': return { kind, parameters: { nom: nom(0), exception: classe(0) } };
    case 'JAVA_RETOURNE_TEXTE': return { kind, parameters: { texte: texte(0) } };
    case 'JAVA_RETOURNE_CHAINE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_APPELLE_METHODE': return { kind, parameters: { methode: nom(0), objet: nom(1) } };
    case 'JAVA_APPELLE_METHODE_ASSIGNE':
      return { kind, parameters: { cible: nom(0), methode: nom(1), objet: nom(2) } };
    case 'JAVA_DECL_TABLEAU': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_TABLEAU_ASSIGNE':
      return { kind, parameters: { valeur: entier(0), indice: expr(0), tableau: nom(0) } };
    case 'JAVA_TABLEAU_ASSIGNE_CAR':
      return { kind, parameters: { litteral: texte(0), indice: expr(0), tableau: nom(0) } };
    case 'JAVA_TABLEAU_ASSIGNE_EXPR':
      return { kind, parameters: { indice: expr(0), tableau: nom(0), expression: expr(1) } };
    case 'JAVA_TABLEAU_AFFICHE': return { kind, parameters: { indice: expr(0), tableau: nom(0) } };
    case 'JAVA_TABLEAU_AFFICHE_CAR': return { kind, parameters: { indice: expr(0), tableau: nom(0) } };
    case 'JAVA_TAILLE_TABLEAU': return { kind, parameters: { cible: nom(0), tableau: nom(1) } };
    case 'JAVA_LISTE': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_LISTE_AJOUTE': return { kind, parameters: { expression: expr(0), liste: nom(0) } };
    case 'JAVA_LISTE_AJOUTE_TEXTE': return { kind, parameters: { texte: texte(0), liste: nom(0) } };
    case 'JAVA_LISTE_ELEMENT':
      return { kind, parameters: { cible: nom(0), indice: expr(0), liste: nom(1) } };
    case 'JAVA_LISTE_TAILLE': return { kind, parameters: { cible: nom(0), liste: nom(1) } };
    case 'JAVA_LISTE_RETIRE': return { kind, parameters: { indice: expr(0), liste: nom(0) } };
    case 'JAVA_TABLE': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_TABLE_ASSOCIE':
      return { kind, parameters: { expression: expr(0), cle: texte(0), table: nom(0) } };
    case 'JAVA_TABLE_VALEUR':
      return { kind, parameters: { cible: nom(0), cle: texte(0), table: nom(1) } };
    case 'JAVA_ENSEMBLE': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_ENSEMBLE_AJOUTE': return { kind, parameters: { expression: expr(0), ensemble: nom(0) } };
    case 'JAVA_POUR_CHAQUE_CLE': return { kind, parameters: { nom: nom(0), table: nom(1) } };
    case 'JAVA_CHAMP_PRIVE': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_CHAMP_CHAINE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_CHAMP_TABLEAU':
      return { kind, parameters: { type: type(0), nom: nom(0), dimension: entier(0) } };
    case 'JAVA_CONSTRUCTEUR': return { kind, parameters: {} };
    case 'JAVA_CONSTRUCTEUR_PARAMETRE': return { kind, parameters: { type: type(0), nom: nom(0) } };
    case 'JAVA_CHAMP_PARAMETRE': return { kind, parameters: { champ: nom(0), parametre: nom(1) } };
    case 'JAVA_OBJET_ARGUMENT':
      return { kind, parameters: { nom: nom(0), classe: classe(0), expression: expr(0) } };
    // Pas de `JAVA_CHAMP_OBJET_ENTIER` : `Affecte la valeur 20 au champ age de
    // e.` est EXACTEMENT la phrase de MEMBER_ASSIGN_INT du catalogue partagé.
    // La dupliquer ici aurait créé une intention morte — le catalogue partagé
    // est consulté d'abord et aurait toujours gagné.
    case 'JAVA_LIT_CHAMP_OBJET':
      return { kind, parameters: { cible: nom(0), champ: nom(1), objet: nom(2) } };
    case 'JAVA_CLASSE_HERITE': return { kind, parameters: { classe: classe(0), parente: classe(1) } };
    case 'JAVA_CLASSE_ABSTRAITE': return { kind, parameters: { classe: classe(0) } };
    case 'JAVA_INTERFACE': return { kind, parameters: { classe: classe(0) } };
    case 'JAVA_CLASSE_IMPLEMENTE':
      return { kind, parameters: { classe: classe(0), interface: classe(1) } };
    case 'JAVA_METHODE_ATTENDUE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_METHODE_ATTENDUE_RETOUR': return { kind, parameters: { nom: nom(0), retour: type(0) } };
    case 'JAVA_METHODE_ABSTRAITE': return { kind, parameters: { nom: nom(0), retour: type(0) } };
    case 'JAVA_SUPER': return { kind, parameters: {} };
    case 'JAVA_SUPER_ARGUMENT': return { kind, parameters: { expression: expr(0) } };
    case 'JAVA_SUPER_METHODE': return { kind, parameters: { methode: nom(0) } };
    case 'JAVA_DECL_TYPE_CLASSE': return { kind, parameters: { classe: classe(0), nom: nom(0) } };
    case 'JAVA_OBJET_POLYMORPHE':
      return { kind, parameters: { declare: classe(0), nom: nom(0), concrete: classe(1) } };
    case 'JAVA_OBJET_POLYMORPHE_ARG':
      return { kind, parameters: { declare: classe(0), nom: nom(0), concrete: classe(1),
        expression: expr(0) } };
    case 'JAVA_PAQUETAGE': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_IMPORT': return { kind, parameters: { classe: classe(0) } };
    case 'JAVA_ESSAIE': return { kind, parameters: {} };
    case 'JAVA_ATTRAPE': return { kind, parameters: { exception: classe(0), nom: nom(0) } };
    case 'JAVA_FINALEMENT': return { kind, parameters: {} };
    case 'JAVA_LANCE': return { kind, parameters: { exception: classe(0), texte: texte(0) } };
    case 'JAVA_MESSAGE_EXCEPTION': return { kind, parameters: { nom: nom(0) } };
    case 'JAVA_ESSAIE_LECTEUR': return { kind, parameters: { nom: nom(0), chemin: texte(0) } };
    case 'JAVA_ESSAIE_ECRIVAIN': return { kind, parameters: { nom: nom(0), chemin: texte(0) } };
    case 'JAVA_LIRE_LIGNE_FICHIER': return { kind, parameters: { lecteur: nom(0), cible: nom(1) } };
  }
}

/**
 * Analyse une phrase du catalogue **Java**.
 *
 * `undefined` signifie « ce n'est pas une phrase de ce catalogue » : l'appelant
 * garde alors le diagnostic du catalogue partagé. C'est la différence entre
 * « je ne reconnais pas » et « je reconnais et je refuse ».
 */
export function analyserCatalogueJava(phrase: string): AnalyseJava | undefined {
  const premier = /^[ \t]*([^\s.]+)/u.exec(phrase)?.[1];
  if (premier === undefined || !AMORCES.includes(minuscule(premier))) return undefined;

  for (const { motif, types, kind } of COMPILES) {
    const trouve = motif.exec(phrase);
    if (!trouve) continue;
    const lues = lire(phrase, trouve, types);
    if ('code' in lues) return { status: 'refuse', diagnostic: lues };
    const construite = construire(kind, lues, phrase);
    if ('code' in construite) {
      return { status: 'refuse',
        diagnostic: { ...construite, range: { start: 0, end: phrase.length } } };
    }
    return { status: 'reconnu', instruction: construite };
  }
  for (const { motif, code, message } of PROCHES_COMPILES) {
    if (!motif.exec(phrase)) continue;
    return { status: 'refuse',
      diagnostic: { code, category: 'understanding', severity: 'error', message,
        range: { start: 0, end: phrase.length } } };
  }
  return texteSupplementaire(phrase);
}

/** Du texte en trop après une phrase juste. Règle **générale** : on retire les
 * mots de la fin, un par un, et si ce qui reste est reconnu, le reste est du
 * texte supplémentaire. Déterministe, borné, et cela ne produit jamais une
 * acceptation — seulement un refus mieux expliqué. */
function texteSupplementaire(phrase: string): AnalyseJava | undefined {
  const mots = [...phrase.matchAll(/[^\s]+/gu)];
  for (let garde = mots.length - 1; garde >= 2; garde--) {
    const dernier = mots[garde - 1];
    const premierEnTrop = mots[garde];
    if (dernier === undefined || premierEnTrop === undefined) continue;
    const tete = phrase.slice(0, dernier.index + dernier[0].length);
    if (!COMPILES.some(compile => compile.motif.test(tete))) continue;
    return { status: 'refuse',
      diagnostic: { code: 'UNEXPECTED_TEXT', category: 'understanding', severity: 'error',
        message: 'Ce texte supplémentaire n’est pas accepté : la phrase est complète avant lui.',
        range: { start: premierEnTrop.index, end: phrase.length } } };
  }
  return undefined;
}

/** Les phrases de démonstration, pour les tests et la génération du
 * catalogue. Un test exige que chacune soit reconnue. */
export const EXEMPLES_JAVA: readonly { phrase: string; kind: GenreJava }[] =
  MOTIFS.map(({ demonstration, kind }) => ({ phrase: demonstration, kind }));
