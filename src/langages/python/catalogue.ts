/** Le catalogue pédagogique **natif** de Python : une table, et un moteur.
 *
 * Lot P5. Le lot P4 avait écrit ses quatorze intentions à la main, chacune
 * avec son parcours de jetons. À quarante de plus, ce n'était plus tenable :
 * ce module remplace les deux par **une** table déclarative et **un** moteur,
 * et les trente-huit tests du lot P4 prouvent que le remplacement est neutre.
 *
 * Trois tables, et rien d'autre :
 *
 *   - `MOTIFS` : une forme française ancrée, le genre d'intention qu'elle
 *     produit, et l'ordre de ses captures ;
 *   - `PROCHES` : les formes **incomplètes** les plus probables, avec leur
 *     diagnostic précis. Sans elles, « Crée une liste nommée notes. » ne
 *     recevrait qu'un « formulation inconnue », qui n'apprend rien ;
 *   - `AMORCES` : les premiers mots qui font entrer une phrase dans ce
 *     catalogue. Hors de cette liste, le module **décline**, et le diagnostic
 *     du catalogue partagé survit.
 *
 * Les garanties du lot P4 sont inchangées, et leurs tests aussi :
 *   - les captures sont **recopiées telles quelles** ;
 *   - un nom est validé comme identifiant **Python** — mots réservés compris ;
 *   - aucune information absente n'est devinée ;
 *   - ce module n'est appelé par personne dans `src/translate.ts`, et une
 *     phrase écrite dans un `.c` ne peut donc pas l'atteindre.
 */
import { parseNumericExpression } from '../../numericExpression.ts';
import type { NumericExpression } from '../../numericExpression.ts';
import { parseStringLiteral } from '../../stringLiteral.ts';
import { MOTS_RESERVES_PYTHON } from './expression.ts';
import type { AnalysePython, DiagnosticPy, InstructionPython } from './instructions.ts';

/** Les formes de capture. Chaque placeholder devient un groupe, dans l'ordre
 * où il apparaît dans la forme. */
const CAPTURES: Readonly<Record<string, string>> = {
  NOM: '([A-Za-z][A-Za-z0-9_]*)',
  ENTIER: '(-?[0-9]+)',
  EXPR: '"([^"]*)"',
  TEXTE: '"([^"]*)"',
  CAR: '(\'(?:\\\\.|[^\'\\\\])\')',
  BOOL: '(vrai|faux)',
  /** `entier`, `réel` ou `texte` : la conversion demandée. */
  CONV: '(entier|r[ée]el|texte)',
  /** Une énumération d'expressions : `"1", "2" et "3"`, ou `"1"` seule. */
  EXPRS: '("[^"]*"(?:[ \\t]*,?[ \\t]*(?:et[ \\t]+)?"[^"]*")*)',
  /** Une énumération de textes. Même forme que `EXPRS` : c'est le mot
   * « textes » de la phrase qui les distingue, pas leur écriture. */
  TEXTES: '("[^"]*"(?:[ \\t]*,?[ \\t]*(?:et[ \\t]+)?"[^"]*")*)',
  /** Un type Python annoté : les quatre que le catalogue écrit. */
  TYPE: '(int|float|str|bool)',
  /** N'importe quel mot. Réservé aux formes PROCHES : il sert à reconnaître
   * une phrase presque juste pour en dire ce qui cloche, jamais à accepter. */
  MOT: '([^\\s.]+)',
};

type GenrePython = InstructionPython['kind'];

type Motif = {
  /** La forme française. Les espaces valent « un ou plusieurs blancs », et
   * les apostrophes acceptent les deux caractères. */
  readonly forme: string;
  readonly kind: GenrePython;
  /** Une phrase qui la démontre. Un test exige qu'elle soit reconnue. */
  readonly demonstration: string;
};

/** Les premiers mots qui font entrer une phrase dans ce catalogue. */
const AMORCES: readonly string[] = [
  'crée', 'créé', 'ajoute', 'insère', 'retire', 'affecte', 'affiche', 'lis',
  'importe', 'joins', 'découpe', 'nettoie', 'lève', 'vérifie', 'appelle',
  'retourne', 'ouvre', 'essaie', 'parcours',
  // Fin du catalogue : l'affectation augmentee, et les deux formes proches
  // qui refusent faute de pas ecrit.
  'incrémente', 'incrémenter', 'décrémente', 'décrémenter', 'augmente', 'diminue',
  // L'ecriture dans un fichier, trouvee manquante par l'exercice de cloture.
  'écris', 'écrire',
];

export const MOTIFS: readonly Motif[] = [
  // ======================= valeurs et noms ==============================
  { forme: 'Crée une liste vide nommée {NOM}', kind: 'PY_LISTE_VIDE',
    demonstration: 'Crée une liste vide nommée notes.' },
  { forme: 'Crée une liste nommée {NOM} avec les valeurs {EXPRS}', kind: 'PY_LISTE_VALEURS',
    demonstration: 'Crée une liste nommée notes avec les valeurs "12", "15" et "9".' },
  { forme: 'Crée une chaîne nommée {NOM} avec le texte {TEXTE}', kind: 'PY_INIT_STR',
    demonstration: 'Crée une chaîne nommée nom avec le texte "Ada".' },
  { forme: 'Crée un booléen nommé {NOM} de valeur {BOOL}', kind: 'PY_INIT_BOOL',
    demonstration: 'Crée un booléen nommé actif de valeur vrai.' },
  { forme: 'Crée un nom appelé {NOM} sans valeur', kind: 'PY_INIT_NONE',
    demonstration: 'Crée un nom appelé resultat sans valeur.' },
  { forme: 'Crée une valeur fixe par convention nommée {NOM} de valeur {ENTIER}',
    kind: 'PY_CONSTANTE_PAR_CONVENTION',
    demonstration: 'Crée une valeur fixe par convention nommée TAILLE de valeur 10.' },
  { forme: 'Crée un nom appelé {NOM} qui désigne la même liste que {NOM}', kind: 'PY_ALIAS_DE_LISTE',
    demonstration: 'Crée un nom appelé copie qui désigne la même liste que notes.' },
  { forme: 'Crée un tuple nommé {NOM} avec les valeurs {EXPRS}', kind: 'PY_TUPLE',
    demonstration: 'Crée un tuple nommé point avec les valeurs "1" et "2".' },
  { forme: 'Crée le point d’entrée principal', kind: 'PY_SI_PRINCIPAL',
    demonstration: 'Crée le point d’entrée principal.' },

  // ======================= calcul et conversion =========================
  { forme: 'Affecte à {NOM} le quotient entier de {EXPR} par {EXPR}', kind: 'PY_DIV_ENTIERE',
    demonstration: 'Affecte à q le quotient entier de "total" par "nombre".' },
  { forme: 'Affecte à {NOM} le quotient réel de {EXPR} par {EXPR}', kind: 'PY_DIV_REELLE',
    demonstration: 'Affecte à q le quotient réel de "total" par "nombre".' },
  { forme: 'Affecte à {NOM} le reste entier de {EXPR} par {EXPR}', kind: 'PY_MODULO',
    demonstration: 'Affecte à r le reste entier de "total" par "nombre".' },
  { forme: 'Affecte à {NOM} le résultat de {EXPR} élevé à la puissance {EXPR}', kind: 'PY_PUISSANCE',
    demonstration: 'Affecte à p le résultat de "a" élevé à la puissance "b".' },
  { forme: 'Affecte à {NOM} le nombre d’éléments de {NOM}', kind: 'PY_LONGUEUR',
    demonstration: 'Affecte à nombre le nombre d’éléments de notes.' },
  { forme: 'Affecte à {NOM} l’{CONV} obtenu de {NOM}', kind: 'PY_CONVERSION',
    demonstration: 'Affecte à n l’entier obtenu de texte.' },
  { forme: 'Affecte à {NOM} le {CONV} obtenu de {NOM}', kind: 'PY_CONVERSION',
    demonstration: 'Affecte à x le réel obtenu de texte.' },
  { forme: 'Lis une saisie dans {NOM}', kind: 'PY_INPUT',
    demonstration: 'Lis une saisie dans reponse.' },
  { forme: 'Affiche le type de {NOM}', kind: 'PY_TYPE_DE',
    demonstration: 'Affiche le type de valeur.' },
  { forme: 'Affiche {NOM} et {NOM} séparés par le texte {TEXTE}', kind: 'PY_PRINT_PLUSIEURS',
    demonstration: 'Affiche a et b séparés par le texte " ".' },

  // ======================= séquences ====================================
  // Les formes TEXTE sont placees avant leurs soeurs en expression : « le
  // texte » / « les textes » les designe sans ambiguite, et sans ce mot le
  // contenu serait lu comme une expression — « "15" » vaudrait l'entier 15.
  { forme: 'Ajoute le texte {TEXTE} à la fin de {NOM}', kind: 'PY_AJOUTER_TEXTE',
    demonstration: 'Ajoute le texte "cleo" à la fin de noms.' },
  { forme: 'Insère le texte {TEXTE} à la position {EXPR} de {NOM}', kind: 'PY_INSERER_TEXTE',
    demonstration: 'Insère le texte "cleo" à la position "0" de noms.' },
  { forme: 'Crée une liste nommée {NOM} avec les textes {TEXTES}', kind: 'PY_LISTE_TEXTES',
    demonstration: 'Crée une liste nommée noms avec les textes "ada" et "bob".' },
  { forme: 'Crée un ensemble nommé {NOM} avec les textes {TEXTES}', kind: 'PY_ENSEMBLE_TEXTES',
    demonstration: 'Crée un ensemble nommé vus avec les textes "ada" et "bob".' },
  { forme: 'Crée un tuple nommé {NOM} avec les textes {TEXTES}', kind: 'PY_TUPLE_TEXTES',
    demonstration: 'Crée un tuple nommé paire avec les textes "ada" et "bob".' },
  { forme: 'Crée un dictionnaire nommé {NOM} avec la clé {TEXTE} valant le texte {TEXTE}',
    kind: 'PY_DICT_PAIRES_TEXTE',
    demonstration: 'Crée un dictionnaire nommé index avec la clé "ada" valant le texte "quinze".' },
  { forme: 'Affecte le texte {TEXTE} à la clé {TEXTE} de {NOM}', kind: 'PY_DICT_ECRIRE_TEXTE',
    demonstration: 'Affecte le texte "absente" à la clé "zoe" de index.' },
  // L'affectation augmentee : la forme NATIVE de Python, et elle modifie sur
  // place un objet mutable. « Augmente compteur. » n'est PAS ici : le pas n'y
  // est pas ecrit, et deviner « 1 » serait une complétion implicite.
  { forme: 'Incrémente {NOM}', kind: 'PY_INCREMENTER',
    demonstration: 'Incrémente compteur.' },
  { forme: 'Décrémente {NOM}', kind: 'PY_DECREMENTER',
    demonstration: 'Décrémente compteur.' },
  { forme: 'Crée une fonction nommée {NOM} qui ne retourne rien et prend un {TYPE} nommé {NOM} valant le texte {TEXTE}',
    kind: 'PY_FONCTION_DEFAUT',
    demonstration: 'Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant le texte "Ada".' },
  { forme: 'Ajoute {EXPR} à la fin de {NOM}', kind: 'PY_AJOUTER',
    demonstration: 'Ajoute "18" à la fin de notes.' },
  { forme: 'Insère {EXPR} à la position {EXPR} de {NOM}', kind: 'PY_INSERER',
    demonstration: 'Insère "12" à la position "0" de notes.' },
  { forme: 'Retire l’élément à la position {EXPR} de {NOM}', kind: 'PY_RETIRER',
    demonstration: 'Retire l’élément à la position "0" de notes.' },
  { forme: 'Affecte à {NOM} la tranche de {NOM} de {EXPR} jusqu’avant {EXPR}', kind: 'PY_TRANCHE',
    demonstration: 'Affecte à debut la tranche de notes de "0" jusqu’avant "3".' },
  { forme: 'Affiche le dernier élément de {NOM}', kind: 'PY_INDICE_NEGATIF',
    demonstration: 'Affiche le dernier élément de notes.' },
  { forme: 'Affecte à {NOM} et {NOM} les valeurs de {NOM}', kind: 'PY_DEPAQUETER',
    demonstration: 'Affecte à x et y les valeurs de point.' },

  // ======================= dictionnaires et ensembles ===================
  { forme: 'Crée un dictionnaire vide nommé {NOM}', kind: 'PY_DICT_VIDE',
    demonstration: 'Crée un dictionnaire vide nommé notes.' },
  { forme: 'Crée un dictionnaire nommé {NOM} avec la clé {TEXTE} valant {EXPR}', kind: 'PY_DICT_PAIRES',
    demonstration: 'Crée un dictionnaire nommé notes avec la clé "ada" valant "15".' },
  { forme: 'Affecte à {NOM} la valeur de la clé {TEXTE} de {NOM}', kind: 'PY_DICT_LIRE',
    demonstration: 'Affecte à n la valeur de la clé "ada" de notes.' },
  { forme: 'Affecte {EXPR} à la clé {TEXTE} de {NOM}', kind: 'PY_DICT_ECRIRE',
    demonstration: 'Affecte "15" à la clé "ada" de notes.' },
  { forme: 'Crée une boucle pour la clé {NOM} et la valeur {NOM} de {NOM}', kind: 'PY_DICT_PARCOURIR',
    demonstration: 'Crée une boucle pour la clé nom et la valeur note de notes.' },
  { forme: 'Crée un ensemble nommé {NOM} avec les valeurs {EXPRS}', kind: 'PY_ENSEMBLE',
    demonstration: 'Crée un ensemble nommé vus avec les valeurs "1" et "2".' },

  // ======================= chaînes ======================================
  { forme: 'Affecte à {NOM} le texte de {NOM} suivi de {NOM}', kind: 'PY_CONCATENER',
    demonstration: 'Affecte à phrase le texte de debut suivi de fin.' },
  { forme: 'Affecte à {NOM} les morceaux de {NOM} séparés par le texte {TEXTE}', kind: 'PY_DECOUPER',
    demonstration: 'Affecte à mots les morceaux de phrase séparés par le texte " ".' },
  { forme: 'Affecte à {NOM} les éléments de {NOM} joints par le texte {TEXTE}', kind: 'PY_JOINDRE',
    demonstration: 'Affecte à phrase les éléments de mots joints par le texte " ".' },
  { forme: 'Affecte à {NOM} le texte de {NOM} en majuscules', kind: 'PY_MAJUSCULES',
    demonstration: 'Affecte à cri le texte de phrase en majuscules.' },
  { forme: 'Affecte à {NOM} le texte de {NOM} sans les espaces des extrémités', kind: 'PY_NETTOYER',
    demonstration: 'Affecte à propre le texte de phrase sans les espaces des extrémités.' },
  { forme: 'Affecte à {NOM} le texte {TEXTE} avec le champ {NOM} valant {NOM}', kind: 'PY_FORMATER',
    demonstration: 'Affecte à ligne le texte "Bonjour {nom}" avec le champ nom valant nom.' },

  // ======================= décisions ====================================
  { forme: 'Crée un bloc si {EXPR} appartient à {NOM}', kind: 'PY_APPARTIENT',
    demonstration: 'Crée un bloc si "x" appartient à notes.' },
  { forme: 'Crée un bloc si {NOM} est sans valeur', kind: 'PY_EST_NONE',
    demonstration: 'Crée un bloc si resultat est sans valeur.' },
  { forme: 'Crée un filtrage sur {EXPR}', kind: 'PY_MATCH',
    demonstration: 'Crée un filtrage sur "jour".' },
  { forme: 'Ajoute un motif pour la valeur {ENTIER}', kind: 'PY_CAS',
    demonstration: 'Ajoute un motif pour la valeur 5.' },
  { forme: 'Ajoute le motif qui accepte tout', kind: 'PY_CAS_DEFAUT',
    demonstration: 'Ajoute le motif qui accepte tout.' },

  // ======================= boucles ======================================
  { forme: 'Crée une boucle pour chaque {NOM} de {NOM}', kind: 'PY_POUR_CHAQUE',
    demonstration: 'Crée une boucle pour chaque note de notes.' },
  { forme: 'Crée une boucle pour l’indice {NOM} et la valeur {NOM} de {NOM}',
    kind: 'PY_POUR_INDICE_ET_VALEUR',
    demonstration: 'Crée une boucle pour l’indice i et la valeur note de notes.' },
  { forme: 'Crée une boucle pour {NOM} de {EXPR} jusqu’avant {EXPR}', kind: 'PY_POUR_INTERVALLE',
    demonstration: 'Crée une boucle pour i de "0" jusqu’avant "10".' },

  // ======================= fonctions ====================================
  { forme: 'Appelle {NOM} avec le paramètre {NOM} valant {EXPR} et le paramètre {NOM} valant {EXPR}',
    kind: 'PY_PARAM_NOMME',
    demonstration: 'Appelle somme avec le paramètre a valant "1" et le paramètre b valant "2".' },
  // Un seul parametre nomme. Trouve manquant par l'exercice de cloture : la
  // forme a deux parametres obligeait a repeter le meme nom, et Python refuse
  // « salue(nom=cri, nom=cri) » a l'analyse.
  { forme: 'Appelle {NOM} avec le paramètre {NOM} valant {EXPR}', kind: 'PY_PARAM_NOMME',
    demonstration: 'Appelle salue avec le paramètre nom valant "cri".' },
  { forme: 'Retourne les résultats de {EXPR} et {EXPR}', kind: 'PY_RETOUR_MULTIPLE',
    demonstration: 'Retourne les résultats de "a" et "b".' },

  // ======================= fichiers, erreurs, modules ===================
  { forme: 'Crée un bloc avec le fichier {TEXTE} ouvert en lecture nommé {NOM}', kind: 'PY_AVEC_FICHIER',
    demonstration: 'Crée un bloc avec le fichier "notes.txt" ouvert en lecture nommé f.' },
  { forme: 'Crée un bloc avec le fichier {TEXTE} ouvert en écriture nommé {NOM}', kind: 'PY_AVEC_FICHIER_ECRITURE',
    demonstration: 'Crée un bloc avec le fichier "notes.txt" ouvert en écriture nommé f.' },
  { forme: 'Crée une boucle pour chaque ligne {NOM} de {NOM}', kind: 'PY_LIRE_LIGNES',
    demonstration: 'Crée une boucle pour chaque ligne ligne de f.' },
  { forme: 'Écris la chaîne {NOM} dans le fichier {NOM}', kind: 'PY_ECRIRE_CHAINE',
    demonstration: 'Écris la chaîne nom dans le fichier f.' },
  { forme: 'Crée un bloc à essayer', kind: 'PY_ESSAYER',
    demonstration: 'Crée un bloc à essayer.' },
  { forme: 'Ajoute une branche en cas d’erreur de type {NOM}', kind: 'PY_SAUF',
    demonstration: 'Ajoute une branche en cas d’erreur de type ValueError.' },
  { forme: 'Lève une erreur de type {NOM} avec le texte {TEXTE}', kind: 'PY_LEVER',
    demonstration: 'Lève une erreur de type ValueError avec le texte "note invalide".' },
  { forme: 'Importe le module {NOM}', kind: 'PY_IMPORTER',
    demonstration: 'Importe le module math.' },
  { forme: 'Importe {NOM} du module {NOM}', kind: 'PY_IMPORTER_DE',
    demonstration: 'Importe sqrt du module math.' },
];

/** Les formes **incomplètes** les plus probables, et leur diagnostic précis.
 * Elles sont essayées quand aucun motif ne reconnaît la phrase, et leur rôle
 * est pédagogique : un « formulation inconnue » n'apprend rien. */
const PROCHES: readonly { forme: string; code: string; message: string }[] = [
  { forme: 'Crée une liste nommée {NOM}', code: 'MISSING_LIST_CONTENT',
    message: 'Une liste se crée vide — « Crée une liste vide nommée … » — ou avec ses valeurs écrites. '
      + 'C-A n’en invente ni le contenu ni la taille.' },
  { forme: 'Crée une liste nommée {NOM} avec les valeurs', code: 'MISSING_EXPRESSION',
    message: 'Il manque les valeurs de la liste, entre guillemets.' },
  { forme: 'Crée un dictionnaire nommé {NOM}', code: 'MISSING_DICT_CONTENT',
    message: 'Un dictionnaire se crée vide — « Crée un dictionnaire vide nommé … » — ou avec une clé et '
      + 'sa valeur écrites. Aucune paire n’est déduite.' },
  { forme: 'Crée un booléen nommé {NOM} de valeur', code: 'MISSING_BOOLEAN',
    message: 'Il manque la valeur : « vrai » ou « faux ».' },
  { forme: 'Crée un booléen nommé {NOM} de valeur {MOT}', code: 'UNSUPPORTED_BOOLEAN',
    message: 'Un booléen vaut « vrai » ou « faux ». Aucune autre valeur n’est acceptée, et aucune '
      + 'n’est déduite.' },
  { forme: 'Affecte à {NOM} le quotient de {EXPR} par {EXPR}', code: 'MISSING_QUOTIENT_KIND',
    message: 'Python a deux quotients, et ils ne donnent pas le même résultat : précisez « le quotient '
      + 'entier » ou « le quotient réel ». C-A ne choisit pas.' },
  { forme: 'Affecte à {NOM} le reste réel de {EXPR} par {EXPR}', code: 'UNSUPPORTED_REMAINDER',
    message: 'Le reste de Python est entier : « le reste entier ». Il n’existe pas de reste réel.' },
  { forme: 'Crée une boucle pour {NOM} de {EXPR} à {EXPR}', code: 'MISSING_EXCLUSIVE_BOUND',
    message: 'La borne de « range » est exclue, et « à » ne dit pas si elle l’est : écrivez '
      + '« jusqu’avant ». La formulation est lourde exprès.' },
  { forme: 'Écris la valeur de {NOM} dans le fichier {NOM}', code: 'WRITE_NEEDS_A_STRING',
    message: 'La méthode d’écriture de Python n’accepte qu’une chaîne : un nombre doit être converti '
      + 'd’abord, et C-A ne convertit pas à votre place. Écrivez la conversion, puis l’écriture.' },
  { forme: 'Augmente {NOM}', code: 'MISSING_STEP',
    message: 'De combien ? Le pas n’est pas écrit dans la phrase, et C-A n’en invente aucun. '
      + '« Incrémente » et « Décrémente » disent un pas de 1 ; pour un autre pas, écrivez le calcul.' },
  { forme: 'Diminue {NOM}', code: 'MISSING_STEP',
    message: 'De combien ? Le pas n’est pas écrit dans la phrase, et C-A n’en invente aucun. '
      + '« Incrémente » et « Décrémente » disent un pas de 1 ; pour un autre pas, écrivez le calcul.' },
  { forme: 'Crée un dictionnaire nommé {NOM} avec la clé {TEXTE} valant', code: 'MISSING_EXPRESSION',
    message: 'Il manque la valeur de la clé : une expression entre guillemets, ou « le texte "…" » '
      + 'pour une valeur textuelle.' },
  { forme: 'Ajoute un motif par défaut', code: 'UNSUPPORTED_DEFAULT_CASE',
    message: 'Le motif « _ » de Python n’est pas un défaut atteint après une traversée : il accepte '
      + 'tout. Écrivez « Ajoute le motif qui accepte tout. ».' },
];

const minuscule = (valeur: string): string => valeur.toLowerCase().replace(/'/gu, '’');

function echapper(texte: string): string {
  return texte
    .replace(/[.*+?^${}()|[\]\\]/gu, caractere => '\\' + caractere)
    .replace(/ +/gu, '[ \\t]+')
    .replace(/['’]/gu, '[\'’]');
}

/** Compile une forme en motif ancré, et retient l'ordre des placeholders. */
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
  // Le drapeau `d` donne les POSITIONS exactes des captures. Sans lui, on les
  // cherchait par `indexOf`, qui trouve la premiere occurrence du texte
  // capture n'importe ou dans la phrase : un texte « " " » renvoyait la
  // premiere espace de la phrase, et le littéral était relu au mauvais
  // endroit. Trouve par les exemples publies, au lot P5.
  return { motif: new RegExp('^[ \\t]*' + corps + '[ \\t]*\\.?[ \\t]*$', 'diu'), types };
}

type Compile = { motif: RegExp; types: string[]; kind: GenrePython; forme: string };
const COMPILES: readonly Compile[] = MOTIFS.map(entree => {
  const { motif, types } = compiler(entree.forme);
  return { motif, types, kind: entree.kind, forme: entree.forme };
});
const PROCHES_COMPILES = PROCHES.map(entree => ({ ...entree, ...compiler(entree.forme) }));

/** Les captures d'une phrase reconnue, chacune lue selon son placeholder. */
type Lues = {
  readonly noms: string[];
  readonly expressions: NumericExpression[];
  readonly textes: string[];
  readonly entiers: string[];
  readonly booleens: boolean[];
  readonly conversions: ('int' | 'float' | 'str')[];
  readonly enumerations: NumericExpression[][];
  readonly enumerationsTexte: string[][];
  readonly types: string[];
};

const CONVERSIONS: Readonly<Record<string, 'int' | 'float' | 'str'>> = {
  entier: 'int', réel: 'float', reel: 'float', texte: 'str',
};

/** Lit les captures. Une capture mal formée — un nom réservé, une expression
 * invalide — produit un diagnostic, jamais une valeur réparée. */
function lire(phrase: string, trouve: RegExpExecArray, types: string[]): Lues | DiagnosticPy {
  const lues: Lues = { noms: [], expressions: [], textes: [], entiers: [], booleens: [],
    conversions: [], enumerations: [], enumerationsTexte: [], types: [] };
  const budget = { count: 0 };
  const refus = (code: string, message: string, debut: number, fin: number): DiagnosticPy =>
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
        if (MOTS_RESERVES_PYTHON.has(valeur)) {
          return refus('PYTHON_KEYWORD_IDENTIFIER',
            `« ${valeur} » est un mot réservé de Python et ne peut pas nommer une variable.`, debut, fin);
        }
        lues.noms.push(valeur);
        break;
      }
      case 'ENTIER': lues.entiers.push(valeur); break;
      case 'TEXTE': {
        // La capture est le CONTENU entre guillemets : on relit le littéral
        // complet avec le scanner partagé, pour ses échappements.
        const lu = parseStringLiteral(phrase, debut - 1, fin + 1);
        if (lu.status === 'rejected') return { ...lu.diagnostic };
        lues.textes.push(lu.literal.value);
        break;
      }
      case 'EXPR': {
        const analyse = parseNumericExpression(phrase, debut, fin, () => undefined,
          'Il manque l’expression.', budget);
        if (analyse.status === 'rejected') return { ...analyse.diagnostic };
        lues.expressions.push(analyse.expression);
        break;
      }
      case 'CAR': lues.textes.push(valeur); break;
      case 'BOOL': lues.booleens.push(minuscule(valeur) === 'vrai'); break;
      case 'CONV': {
        const conversion = CONVERSIONS[minuscule(valeur).replace(/é/gu, 'é')];
        if (conversion === undefined) {
          return refus('UNSUPPORTED_CONVERSION', 'Conversion non prise en charge.', debut, fin);
        }
        lues.conversions.push(conversion);
        break;
      }
      case 'EXPRS': {
        const valeurs: NumericExpression[] = [];
        for (const trouvee of valeur.matchAll(/"([^"]*)"/gu)) {
          const contenu = trouvee[1] ?? '';
          const depart = debut + trouvee.index + 1;
          const analyse = parseNumericExpression(phrase, depart, depart + contenu.length,
            () => undefined, 'Il manque une valeur.', budget);
          if (analyse.status === 'rejected') return { ...analyse.diagnostic };
          valeurs.push(analyse.expression);
        }
        if (valeurs.length === 0) {
          return refus('MISSING_EXPRESSION', 'Il manque les valeurs, entre guillemets.', debut, fin);
        }
        lues.enumerations.push(valeurs);
        break;
      }
      case 'TYPE': lues.types.push(valeur); break;
      case 'TEXTES': {
        const textes: string[] = [];
        for (const trouvee of valeur.matchAll(/"[^"]*"/gu)) {
          const lu = parseStringLiteral(phrase, debut + trouvee.index,
            debut + trouvee.index + trouvee[0].length);
          if (lu.status === 'rejected') return { ...lu.diagnostic };
          textes.push(lu.literal.value);
        }
        if (textes.length === 0) {
          return refus('MISSING_TEXT', 'Il manque les textes, entre guillemets.', debut, fin);
        }
        lues.enumerationsTexte.push(textes);
        break;
      }
      default: throw new Error('Placeholder non traité : ' + type);
    }
  }
  return lues;
}

/** Construit l'intention depuis ses captures. Une ligne par genre : c'est le
 * seul endroit où la table rencontre l'AST typé. */
function construire(kind: GenrePython, c: Lues): InstructionPython | DiagnosticPy {
  const nom = (index: number): string => {
    const valeur = c.noms[index];
    if (valeur === undefined) throw new Error('Invariant interne : nom attendu.');
    return valeur;
  };
  const expr = (index: number): NumericExpression => {
    const valeur = c.expressions[index];
    if (valeur === undefined) throw new Error('Invariant interne : expression attendue.');
    return valeur;
  };
  const texte = (index: number): string => {
    const valeur = c.textes[index];
    if (valeur === undefined) throw new Error('Invariant interne : texte attendu.');
    return valeur;
  };
  const liste = (index: number): NumericExpression[] => {
    const valeur = c.enumerations[index];
    if (valeur === undefined) throw new Error('Invariant interne : énumération attendue.');
    return valeur;
  };
  const enumTextes = (index: number): string[] => {
    const valeur = c.enumerationsTexte[index];
    if (valeur === undefined) throw new Error('Invariant interne : énumération de textes attendue.');
    return valeur;
  };

  switch (kind) {
    case 'PY_LISTE_VIDE': return { kind, parameters: { name: nom(0) } };
    case 'PY_LISTE_VALEURS': return { kind, parameters: { name: nom(0), valeurs: liste(0) } };
    case 'PY_INIT_STR': return { kind, parameters: { name: nom(0), texte: texte(0) } };
    case 'PY_INIT_BOOL': return { kind, parameters: { name: nom(0), valeur: c.booleens[0] === true } };
    case 'PY_INIT_NONE': return { kind, parameters: { name: nom(0) } };
    case 'PY_CONSTANTE_PAR_CONVENTION':
      return { kind, parameters: { name: nom(0), valeur: c.entiers[0] ?? '0' } };
    case 'PY_ALIAS_DE_LISTE': return { kind, parameters: { name: nom(0), source: nom(1) } };
    case 'PY_TUPLE': return { kind, parameters: { name: nom(0), valeurs: liste(0) } };
    case 'PY_SI_PRINCIPAL': return { kind, parameters: {} };
    case 'PY_DIV_ENTIERE': case 'PY_DIV_REELLE': case 'PY_MODULO': case 'PY_PUISSANCE':
      return { kind, parameters: { name: nom(0), gauche: expr(0), droite: expr(1) } };
    case 'PY_LONGUEUR': return { kind, parameters: { name: nom(0), source: nom(1) } };
    case 'PY_CONVERSION':
      return { kind, parameters: { name: nom(0), conversion: c.conversions[0] ?? 'int', source: nom(1) } };
    case 'PY_INPUT': return { kind, parameters: { name: nom(0) } };
    case 'PY_TYPE_DE': return { kind, parameters: { name: nom(0) } };
    case 'PY_PRINT_PLUSIEURS':
      return { kind, parameters: { premier: nom(0), second: nom(1), separateur: texte(0) } };
    case 'PY_AJOUTER': return { kind, parameters: { name: nom(0), valeur: expr(0) } };
    case 'PY_AJOUTER_TEXTE': return { kind, parameters: { name: nom(0), texte: texte(0) } };
    case 'PY_INSERER_TEXTE':
      return { kind, parameters: { name: nom(0), position: expr(0), texte: texte(0) } };
    case 'PY_LISTE_TEXTES': case 'PY_ENSEMBLE_TEXTES': case 'PY_TUPLE_TEXTES':
      return { kind, parameters: { name: nom(0), textes: enumTextes(0) } };
    case 'PY_DICT_PAIRES_TEXTE':
      return { kind, parameters: { name: nom(0), cle: texte(0), texte: texte(1) } };
    case 'PY_DICT_ECRIRE_TEXTE':
      return { kind, parameters: { name: nom(0), cle: texte(1), texte: texte(0) } };
    case 'PY_INCREMENTER': case 'PY_DECREMENTER': return { kind, parameters: { name: nom(0) } };
    case 'PY_FONCTION_DEFAUT':
      return { kind, parameters: { name: nom(0), parametre: nom(1), type: c.types[0] ?? 'str',
        texte: texte(0) } };
    case 'PY_INSERER':
      return { kind, parameters: { name: nom(0), position: expr(1), valeur: expr(0) } };
    case 'PY_RETIRER': return { kind, parameters: { name: nom(0), position: expr(0) } };
    case 'PY_TRANCHE':
      return { kind, parameters: { name: nom(0), source: nom(1), debut: expr(0), fin: expr(1) } };
    case 'PY_INDICE_NEGATIF': return { kind, parameters: { name: nom(0) } };
    case 'PY_DEPAQUETER':
      return { kind, parameters: { premier: nom(0), second: nom(1), source: nom(2) } };
    case 'PY_DICT_VIDE': return { kind, parameters: { name: nom(0) } };
    case 'PY_DICT_PAIRES':
      return { kind, parameters: { name: nom(0), cle: texte(0), valeur: expr(0) } };
    case 'PY_DICT_LIRE':
      return { kind, parameters: { name: nom(0), cle: texte(0), source: nom(1) } };
    case 'PY_DICT_ECRIRE':
      return { kind, parameters: { name: nom(0), cle: texte(0), valeur: expr(0) } };
    case 'PY_DICT_PARCOURIR':
      return { kind, parameters: { cle: nom(0), valeur: nom(1), source: nom(2) } };
    case 'PY_ENSEMBLE': return { kind, parameters: { name: nom(0), valeurs: liste(0) } };
    case 'PY_CONCATENER':
      return { kind, parameters: { name: nom(0), gauche: nom(1), droite: nom(2) } };
    case 'PY_DECOUPER':
      return { kind, parameters: { name: nom(0), source: nom(1), separateur: texte(0) } };
    case 'PY_JOINDRE':
      return { kind, parameters: { name: nom(0), source: nom(1), separateur: texte(0) } };
    case 'PY_MAJUSCULES': case 'PY_NETTOYER':
      return { kind, parameters: { name: nom(0), source: nom(1) } };
    case 'PY_FORMATER':
      return { kind, parameters: { name: nom(0), gabarit: texte(0), champ: nom(1), source: nom(2) } };
    case 'PY_APPARTIENT': return { kind, parameters: { valeur: expr(0), collection: nom(0) } };
    case 'PY_EST_NONE': return { kind, parameters: { name: nom(0) } };
    case 'PY_MATCH': return { kind, parameters: { expression: expr(0) } };
    case 'PY_CAS': return { kind, parameters: { valeur: c.entiers[0] ?? '0' } };
    case 'PY_CAS_DEFAUT': return { kind, parameters: {} };
    case 'PY_POUR_CHAQUE': return { kind, parameters: { name: nom(0), collection: nom(1) } };
    case 'PY_POUR_INDICE_ET_VALEUR':
      return { kind, parameters: { indice: nom(0), valeur: nom(1), collection: nom(2) } };
    case 'PY_POUR_INTERVALLE':
      return { kind, parameters: { name: nom(0), debut: expr(0), fin: expr(1) } };
    case 'PY_PARAM_NOMME': {
      // Un parametre nomme par capture : la forme a un parametre et celle a
      // deux partagent ce genre, et l'arite se lit dans les captures.
      const arguments_: { nom: string; valeur: NumericExpression }[] = [];
      for (let index = 1; index < c.noms.length; index++) {
        arguments_.push({ nom: nom(index), valeur: expr(index - 1) });
      }
      // Python refuse un nom de parametre repete A L'ANALYSE. C'est une erreur
      // de FORME, visible sans rien savoir du programme : C-A la refuse, au
      // lieu d'ecrire un fichier que Python ne lira pas.
      const noms = arguments_.map(argument => argument.nom);
      if (new Set(noms).size !== noms.length) {
        return { code: 'REPEATED_PARAMETER_NAME', category: 'understanding', severity: 'error',
          message: 'Le même nom de paramètre est donné deux fois. Python refuse un appel nommé qui '
            + 'répète un nom, et C-A n’écrit pas un fichier qu’il ne lirait pas.',
          range: { start: 0, end: 0 } };
      }
      return { kind, parameters: { name: nom(0), arguments: arguments_ } };
    }
    case 'PY_RETOUR_MULTIPLE': return { kind, parameters: { valeurs: [expr(0), expr(1)] } };
    case 'PY_AVEC_FICHIER': return { kind, parameters: { chemin: texte(0), name: nom(0), mode: 'r' } };
    case 'PY_AVEC_FICHIER_ECRITURE':
      return { kind: 'PY_AVEC_FICHIER', parameters: { chemin: texte(0), name: nom(0), mode: 'w' } };
    case 'PY_LIRE_LIGNES': return { kind, parameters: { name: nom(0), fichier: nom(1) } };
    case 'PY_ECRIRE_CHAINE': return { kind, parameters: { fichier: nom(1), source: nom(0) } };
    case 'PY_ESSAYER': return { kind, parameters: {} };
    case 'PY_SAUF': return { kind, parameters: { erreur: nom(0) } };
    case 'PY_LEVER': return { kind, parameters: { erreur: nom(0), message: texte(0) } };
    case 'PY_IMPORTER': return { kind, parameters: { module: nom(0) } };
    case 'PY_IMPORTER_DE': return { kind, parameters: { nom: nom(0), module: nom(1) } };
  }
}

/**
 * Analyse une phrase du catalogue **Python**.
 *
 * `undefined` signifie « ce n'est pas une phrase de ce catalogue » : l'appelant
 * doit alors garder le diagnostic du catalogue partagé. C'est la différence
 * entre « je ne reconnais pas » et « je reconnais et je refuse ».
 */
export function analyserCatalogueNatif(phrase: string): AnalysePython | undefined {
  const premier = /^[ \t]*([^\s.]+)/u.exec(phrase)?.[1];
  if (premier === undefined || !AMORCES.includes(minuscule(premier))) return undefined;

  for (const { motif, types, kind } of COMPILES) {
    const trouve = motif.exec(phrase);
    if (!trouve) continue;
    const lues = lire(phrase, trouve, types);
    if ('code' in lues) return { status: 'refuse', diagnostic: lues };
    const construite = construire(kind, lues);
    if ('code' in construite) {
      // La portee d'un refus de construction est la phrase entiere : le defaut
      // n'est pas dans un mot, il est dans la combinaison.
      return { status: 'refuse',
        diagnostic: { ...construite, range: { start: 0, end: phrase.length } } };
    }
    return { status: 'reconnu', instruction: construite };
  }
  for (const { motif, code, message } of PROCHES_COMPILES) {
    const trouve = motif.exec(phrase);
    if (!trouve) continue;
    return { status: 'refuse',
      diagnostic: { code, category: 'understanding', severity: 'error', message,
        range: { start: 0, end: phrase.length } } };
  }
  return texteSupplementaire(phrase);
}

/** Du texte en trop après une phrase juste.
 *
 * Règle **générale**, et elle vaut pour les cinquante-trois motifs à la fois :
 * on retire les mots de la fin, un par un, et si ce qui reste est reconnu, le
 * reste est du texte supplémentaire. C'est deterministe, borné par le nombre
 * de mots, et cela ne produit jamais une acceptation — seulement un refus
 * mieux expliqué.
 *
 * L'analyse à la main du lot P4 donnait ce diagnostic pour les quelques formes
 * dont elle parcourait les jetons ; la refonte du lot P5 l'avait perdu, et un
 * test l'a dit.
 */
function texteSupplementaire(phrase: string): AnalysePython | undefined {
  const mots = [...phrase.matchAll(/[^\s]+/gu)];
  // Au moins deux mots doivent rester : une phrase d'un mot n'a pas de reste.
  for (let garde = mots.length - 1; garde >= 2; garde--) {
    const dernier = mots[garde - 1];
    const premierEnTrop = mots[garde];
    if (dernier === undefined || premierEnTrop === undefined) continue;
    const debut = dernier.index + dernier[0].length;
    const tete = phrase.slice(0, debut);
    if (!COMPILES.some(compile => compile.motif.test(tete))) continue;
    return { status: 'refuse',
      diagnostic: { code: 'UNEXPECTED_TEXT', category: 'understanding', severity: 'error',
        message: 'Ce texte supplémentaire n’est pas accepté : la phrase est complète avant lui.',
        range: { start: premierEnTrop.index, end: phrase.length } } };
  }
  return undefined;
}
