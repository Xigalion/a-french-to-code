/** Informations pédagogiques **passives** propres à Python.
 *
 * Lot P3, et volontairement incomplet : l'inventaire en prévoit une
 * trentaine, et c'est le lot P5 qui les écrira toutes. Celles-ci sont les
 * informations que les décisions **déjà validées** exigent — une décision qui
 * dit « avec une explication de son fonctionnement réel » n'est pas appliquée
 * tant que l'explication n'existe pas.
 *
 * Mêmes règles que le canal C17 :
 *   - `severity: 'information'`, jamais un avertissement déguisé ;
 *   - passives : elles n'empêchent rien, ne corrigent rien, ne proposent
 *     aucune formulation à recopier ;
 *   - elles énoncent ce que le langage fait, jamais ce que le programme fait.
 *
 * La portée est, à ce lot, la phrase entière. Pointer le mot exact demande les
 * intervalles de chaque enveloppe française : c'est du travail de P5, et le
 * dire vaut mieux que poser un intervalle approximatif.
 */
import type { SourceRange, TranslationResult } from '../../translate.ts';

export type InformationPython = {
  code: 'PY_CHAR_IS_A_STRING' | 'PY_NO_SEPARATOR_ADDED' | 'PY_BLOCK_NEEDS_A_BODY'
  | 'PY_TRUTHINESS' | 'PY_ANNOTATION_NOT_CHECKED' | 'PY_INT_IS_UNBOUNDED'
  | 'PY_NAME_REBINDS'
  // Lot P4 : les intentions natives.
  | 'PY_LIST_GROWS' | 'PY_LIST_IS_MUTABLE' | 'PY_RANGE_EXCLUDES_THE_END'
  | 'PY_LOOP_VARIABLE_SURVIVES' | 'PY_FLOOR_DIVISION_ROUNDS_DOWN'
  | 'PY_REAL_DIVISION_IS_ALWAYS_REAL' | 'PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN'
  | 'PY_LEN_IS_NOT_SIZEOF' | 'PY_INPUT_IS_ALWAYS_A_STRING'
  | 'PY_CONVERSION_CAN_RAISE' | 'PY_BOOL_IS_AN_INT' | 'PY_MAIN_IS_A_CONVENTION'
  | 'PY_ITERATING_WHILE_MODIFYING'
  // Lot P5 : les quarante intentions natives de plus.
  | 'PY_NONE_IS_A_VALUE' | 'PY_CONSTANT_IS_ONLY_A_CONVENTION' | 'PY_ALIASING_IS_NOT_A_COPY'
  | 'PY_TUPLE_IS_IMMUTABLE' | 'PY_DEL_SHIFTS_THE_REST' | 'PY_SLICE_COPIES'
  | 'PY_INDEX_CAN_BE_NEGATIVE' | 'PY_MULTIPLE_RETURN_IS_A_TUPLE'
  | 'PY_EMPTY_BRACES_IS_A_DICT' | 'PY_MISSING_KEY_RAISES' | 'PY_SET_REMOVES_DUPLICATES'
  | 'PY_JOIN_IS_ON_THE_SEPARATOR' | 'PY_CASE_IS_NOT_REVERSIBLE' | 'PY_STRING_IS_IMMUTABLE'
  | 'PY_FSTRING_IS_EVALUATED_NOW' | 'PY_IS_IS_IDENTITY' | 'PY_MATCH_DOES_NOT_FALL_THROUGH'
  | 'PY_WITH_CLOSES_FOR_YOU' | 'PY_EXCEPT_NEEDS_A_TYPE' | 'PY_RAISE_STOPS_THE_FUNCTION'
  | 'PY_IMPORT_RUNS_THE_MODULE' | 'PY_MEMBERSHIP_IS_LINEAR' | 'PY_TYPE_IS_NOT_A_CHECK'
  | 'PY_SEPARATOR_IS_EXPLICIT' | 'PY_POWER_IS_EXACT_ON_INTEGERS';
  severity: 'information';
  range: SourceRange;
  message: string;
};

const TEXTES: Readonly<Record<InformationPython['code'], string>> = {
  // Décision D8, validée : « avec une explication de son fonctionnement réel ».
  PY_CHAR_IS_A_STRING:
    'Python n’a pas de type caractère : ceci est une chaîne de longueur 1. '
    + '« \'A\' + 1 » y est une erreur, pas 66, et « \'A\' + \'B\' » vaut « \'AB\' ». '
    + 'L’annotation écrite est donc « str ».',
  // Décision D10, validée : aucun séparateur implicite.
  PY_NO_SEPARATOR_ADDED:
    'print ajoute normalement un saut de ligne à la fin. C-A l’a désactivé avec « end="" » '
    + 'parce que personne ne l’a demandé : pour obtenir un saut de ligne, il faut l’afficher.',
  PY_BLOCK_NEEDS_A_BODY:
    'En Python, un bloc ne peut pas rester vide : le fichier est incomplet, et donc invalide, '
    + 'jusqu’à ce que vous écriviez au moins une instruction indentée dessous. C-A n’écrit pas '
    + '« pass » à votre place : ce serait une instruction que vous n’avez pas demandée.',
  PY_TRUTHINESS:
    'Une valeur numérique nulle est fausse, comme en C17. Mais en Python, une chaîne vide, '
    + 'une liste vide et None sont fausses aussi : la règle est plus large que « différent de zéro ».',
  PY_ANNOTATION_NOT_CHECKED:
    'L’annotation de type n’est pas vérifiée à l’exécution : Python l’enregistre et la laisse '
    + 'aux outils de lecture. Elle dit votre intention, elle ne la garantit pas.',
  PY_INT_IS_UNBOUNDED:
    'Les entiers Python n’ont pas de taille fixe : ils grandissent avec la valeur, et il n’y a '
    + 'donc ni débordement ni entier non signé. Ce que C17 enseigne sur les bornes ne s’y applique pas.',
  PY_NAME_REBINDS:
    'Affecter un nom ne modifie pas l’objet précédent : le nom désigne désormais un autre objet. '
    + 'Deux noms peuvent désigner le même objet, et c’est par là que l’aliasing s’enseigne.',
  PY_LIST_GROWS:
    'Une liste Python n’a pas de taille fixe : « append » l’agrandit, et le langage s’occupe de la '
    + 'mémoire. Il n’y a donc ni dimension à prévoir, ni débordement de tableau — mais un indice hors '
    + 'bornes lève une erreur, il ne lit pas n’importe quoi.',
  PY_LIST_IS_MUTABLE:
    'Une liste est modifiable : affecter un élément change la liste elle-même. Si deux noms désignent '
    + 'la même liste, les deux voient le changement.',
  PY_RANGE_EXCLUDES_THE_END:
    'La borne de « range » est EXCLUE : de 0 jusqu’avant 10, la variable prend les valeurs 0 à 9, et '
    + 'jamais 10. C’est la raison de la formulation « jusqu’avant », qui est lourde exprès.',
  PY_LOOP_VARIABLE_SURVIVES:
    'La variable de parcours existe encore après la boucle, et garde sa dernière valeur. Si la '
    + 'collection est vide, elle n’est jamais créée, et la lire après la boucle est alors une erreur.',
  PY_FLOOR_DIVISION_ROUNDS_DOWN:
    'Le quotient entier de Python arrondit vers le BAS, pas vers zéro : -7 // 2 vaut -4, là où le C17 '
    + 'écrirait -3. La différence n’apparaît que sur un opérande négatif, et c’est ce qui la rend '
    + 'coûteuse à découvrir.',
  PY_REAL_DIVISION_IS_ALWAYS_REAL:
    'Le quotient réel donne toujours un nombre à virgule, même quand la division est exacte : 4 / 2 '
    + 'vaut 2.0, et non 2. Les deux quotients de Python ne sont pas deux écritures du même calcul.',
  PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN:
    'Le reste de Python prend le signe du DIVISEUR : -7 % 2 vaut 1, là où le C17 donne -1. Le reste et '
    + 'le quotient entier vont ensemble — Python arrondit vers le bas, et son reste suit.',
  PY_LEN_IS_NOT_SIZEOF:
    '« len » donne un nombre d’éléments, pas une taille en octets. Ce n’est pas l’équivalent de '
    + '« sizeof » : la notion de place occupée en mémoire n’est pas exposée par le langage.',
  PY_INPUT_IS_ALWAYS_A_STRING:
    'Une saisie est TOUJOURS lue comme une chaîne, même si l’utilisateur tape des chiffres. Pour la '
    + 'calculer, il faut la convertir, et la conversion est une phrase à part.',
  PY_CONVERSION_CAN_RAISE:
    'Une conversion échoue sur un texte qui ne la permet pas, et l’erreur ARRÊTE le programme : elle ne '
    + 'rend pas zéro. L’absence d’avertissement ici ne garantit donc pas que la conversion réussira.',
  PY_BOOL_IS_AN_INT:
    'En Python, un booléen EST un entier : True vaut 1 et False vaut 0, et « True + True » vaut 2. '
    + 'C-A écrit l’annotation « bool » parce que la phrase le dit, pas parce que le langage sépare les '
    + 'deux types.',
  PY_MAIN_IS_A_CONVENTION:
    'Ce bloc est une CONVENTION, pas une exigence du langage : le code d’un module s’exécute dès qu’il '
    + 'est lu. Le bloc sert à distinguer « lancé directement » de « importé par un autre module », et '
    + 'rien ne l’appelle automatiquement.',
  PY_ITERATING_WHILE_MODIFYING:
    'Modifier une collection pendant qu’on la parcourt donne un résultat difficile à prévoir : des '
    + 'éléments peuvent être sautés. C-A ne le détecte pas — il ne sait pas ce que fait le corps de la '
    + 'boucle.',
  PY_NONE_IS_A_VALUE:
    'La phrase dit « sans valeur », et c’est l’intuition à corriger : « None » EST une valeur, l’objet '
    + 'qui représente l’absence. Le nom existe donc, et il désigne quelque chose — ce n’est pas la même '
    + 'chose qu’un nom qui n’existe pas.',
  PY_CONSTANT_IS_ONLY_A_CONVENTION:
    'Python n’a pas de constante : rien n’empêche de réaffecter ce nom. Les majuscules sont une '
    + 'convention de lecture entre programmeurs, et C-A ne les impose pas — il écrit le nom que vous '
    + 'avez donné.',
  PY_ALIASING_IS_NOT_A_COPY:
    'Les deux noms désignent LA MÊME liste : modifier l’une modifie l’autre, parce qu’il n’y en a '
    + 'qu’une. C’est la notion qui remplace les pointeurs du C, et c’est exactement la même leçon.',
  PY_TUPLE_IS_IMMUTABLE:
    'Un tuple ne se modifie pas : on ne peut ni affecter un de ses éléments, ni en ajouter. C’est ce '
    + 'qui le distingue d’une liste, et ce n’est pas une restriction arbitraire — un tuple peut servir '
    + 'de clé de dictionnaire, une liste non.',
  PY_DEL_SHIFTS_THE_REST:
    'Retirer une position DÉCALE tous les éléments suivants : après « del t[0] », l’ancien deuxième '
    + 'élément est en position 0. Retirer dans une boucle qui compte est donc un piège.',
  PY_SLICE_COPIES:
    'Une tranche produit une NOUVELLE liste : modifier la tranche ne modifie pas l’originale. C’est '
    + 'l’inverse de l’aliasing, et la différence vaut d’être vue une fois.',
  PY_INDEX_CAN_BE_NEGATIVE:
    'L’indice -1 désigne le dernier élément, -2 l’avant-dernier. En C17, un indice négatif lit hors '
    + 'du tableau sans prévenir ; en Python, c’est une façon normale de compter depuis la fin.',
  PY_MULTIPLE_RETURN_IS_A_TUPLE:
    'Python ne retourne pas deux valeurs : il retourne UN tuple de deux valeurs. L’appelant peut le '
    + 'dépaqueter en deux noms, ou le garder tel quel.',
  PY_EMPTY_BRACES_IS_A_DICT:
    'Les accolades vides « {} » font un DICTIONNAIRE, pas un ensemble. Un ensemble vide s’écrit '
    + '« set() », et C-A n’a pas de phrase pour lui : la confusion est trop coûteuse pour être écrite '
    + 'sans être dite.',
  PY_MISSING_KEY_RAISES:
    'Lire une clé absente ARRÊTE le programme avec une erreur. C-A n’écrit pas « get », qui rendrait '
    + '« None » en silence : une valeur absente doit se voir.',
  PY_SET_REMOVES_DUPLICATES:
    'Un ensemble ne garde pas les doublons, et il n’a pas d’ordre : deux valeurs identiques n’en font '
    + 'qu’une, et l’ordre d’affichage n’est pas celui de l’écriture.',
  PY_JOIN_IS_ON_THE_SEPARATOR:
    'En Python, c’est le SÉPARATEUR qui joint la liste : « " ".join(mots) », et non « mots.join(" ") ». '
    + 'La phrase française met les éléments en premier parce que c’est l’ordre où on y pense ; le code '
    + 'les met en second parce que c’est l’ordre du langage.',
  PY_CASE_IS_NOT_REVERSIBLE:
    'Le passage en majuscules n’est pas réversible dans toutes les langues : « ß » devient « SS », et '
    + 'revenir en arrière ne redonne pas le texte de départ.',
  PY_STRING_IS_IMMUTABLE:
    'Une chaîne ne se modifie pas : chaque opération en produit une NOUVELLE. « phrase.upper() » ne '
    + 'change pas « phrase » — il faut affecter le résultat, et c’est ce que fait cette phrase.',
  PY_FSTRING_IS_EVALUATED_NOW:
    'Le champ est remplacé au moment où la ligne s’exécute, avec la valeur que le nom a À CE '
    + 'MOMENT-LÀ. Ce n’est pas un gabarit réutilisable : c’est un texte construit une fois.',
  PY_IS_IS_IDENTITY:
    '« is » demande si c’est le MÊME objet, « == » s’il a la même valeur. Pour « None », les deux '
    + 'marchent, et « is » est la forme employée — mais la différence est réelle, et elle surprend.',
  PY_MATCH_DOES_NOT_FALL_THROUGH:
    'Un motif de « match » ne traverse PAS vers le suivant : dès qu’un motif correspond, son bloc '
    + 'est exécuté et le filtrage s’arrête. C’est l’inverse exact du « switch » de C17, où il faut '
    + 'écrire « break » pour sortir — si vous venez du C, c’est la règle à oublier.',
  PY_WITH_CLOSES_FOR_YOU:
    'Le fichier est fermé automatiquement à la sortie du bloc, même en cas d’erreur. C’est un ajout '
    + 'du LANGAGE, pas de C-A — et cela ne veut pas dire que fermer un fichier n’existe pas : hors '
    + 'd’un bloc « with », il faut le faire.',
  PY_EXCEPT_NEEDS_A_TYPE:
    'Le type d’erreur est exigé. Un « except » nu attrape tout, interruption au clavier comprise, et '
    + 'ne se diagnostique pas : C-A n’en écrit jamais.',
  PY_RAISE_STOPS_THE_FUNCTION:
    'Lever une erreur interrompt la fonction immédiatement : les lignes suivantes ne sont pas '
    + 'exécutées. L’erreur remonte jusqu’à un bloc qui l’attrape, ou arrête le programme.',
  PY_IMPORT_RUNS_THE_MODULE:
    'Importer EXÉCUTE le module, une seule fois, à son premier import. Ce n’est pas une copie de '
    + 'texte comme « #include » : c’est une instruction du langage.',
  PY_MEMBERSHIP_IS_LINEAR:
    '« in » sur une liste regarde les éléments un par un : le coût grandit avec la liste. Sur un '
    + 'ensemble ou un dictionnaire, il est immédiat — c’est la raison d’être de ces collections.',
  PY_TYPE_IS_NOT_A_CHECK:
    'Afficher le type renseigne, il ne vérifie rien : le programme continue quel que soit le type. '
    + 'Python ne contrôle pas les types avant d’exécuter.',
  PY_SEPARATOR_IS_EXPLICIT:
    'Le séparateur est celui que vous avez écrit. « print » en met une espace par défaut, et C-A ne '
    + 'laisse pas ce défaut s’appliquer : un séparateur non demandé est un ajout.',
  PY_POWER_IS_EXACT_ON_INTEGERS:
    'Sur deux entiers, « ** » donne un entier exact, aussi grand qu’il faut : 2 ** 100 s’écrit en '
    + 'entier, sans débordement. Avec un exposant négatif ou réel, le résultat est un nombre à virgule.',
};

/** Les genres qui ouvrent un bloc : leur corps reste à écrire. */
const EN_TETES = new Set(['IF', 'ELSE_IF', 'ELSE', 'WHILE', 'FUNC_DEF']);
const AFFICHAGES = new Set(['PRINT_INT', 'PRINT_TEXT', 'PRINT_NEWLINE', 'PRINT_FORMATTED',
  'NUMERIC_PRINT', 'PRINT_CHAR', 'PRINT_STRING', 'ARRAY_PRINT', 'ARRAY_PRINT_CHAR']);
const CARACTERES = new Set(['INIT_CHAR', 'ASSIGN_CHAR', 'ARRAY_ASSIGN_CHAR', 'PRINT_CHAR']);
const ANNOTATIONS = new Set(['NUMERIC_INIT', 'INIT_CHAR', 'FUNC_DEF']);
const AFFECTATIONS = new Set(['ASSIGN_INT', 'ASSIGN_EXPRESSION', 'NUMERIC_ASSIGN']);

/** Les informations des intentions NATIVES, par genre. Table explicite : une
 * intention sans information n'est pas un oubli silencieux, c'est une ligne
 * vide qu'un test voit. */
const NATIVES: Readonly<Record<string, readonly InformationPython['code'][]>> = {
  PY_LISTE_VIDE: ['PY_LIST_GROWS', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_LISTE_VALEURS: ['PY_LIST_IS_MUTABLE', 'PY_LIST_GROWS', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_AJOUTER: ['PY_LIST_GROWS', 'PY_ITERATING_WHILE_MODIFYING'],
  PY_AJOUTER_TEXTE: ['PY_LIST_GROWS', 'PY_STRING_IS_IMMUTABLE'],
  PY_LONGUEUR: ['PY_LEN_IS_NOT_SIZEOF'],
  PY_POUR_INTERVALLE: ['PY_BLOCK_NEEDS_A_BODY', 'PY_RANGE_EXCLUDES_THE_END', 'PY_LOOP_VARIABLE_SURVIVES'],
  PY_POUR_CHAQUE: ['PY_BLOCK_NEEDS_A_BODY', 'PY_LOOP_VARIABLE_SURVIVES', 'PY_ITERATING_WHILE_MODIFYING'],
  PY_DIV_ENTIERE: ['PY_FLOOR_DIVISION_ROUNDS_DOWN'],
  PY_DIV_REELLE: ['PY_REAL_DIVISION_IS_ALWAYS_REAL'],
  PY_MODULO: ['PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN', 'PY_FLOOR_DIVISION_ROUNDS_DOWN'],
  PY_INIT_STR: ['PY_ANNOTATION_NOT_CHECKED'],
  PY_INIT_BOOL: ['PY_BOOL_IS_AN_INT', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_CONVERSION: ['PY_CONVERSION_CAN_RAISE'],
  PY_INPUT: ['PY_INPUT_IS_ALWAYS_A_STRING'],
  PY_SI_PRINCIPAL: ['PY_BLOCK_NEEDS_A_BODY', 'PY_MAIN_IS_A_CONVENTION'],
  // --- lot P5 ---------------------------------------------------------
  PY_INIT_NONE: ['PY_NONE_IS_A_VALUE'],
  PY_CONSTANTE_PAR_CONVENTION: ['PY_CONSTANT_IS_ONLY_A_CONVENTION'],
  PY_ALIAS_DE_LISTE: ['PY_ALIASING_IS_NOT_A_COPY', 'PY_LIST_IS_MUTABLE'],
  PY_TUPLE: ['PY_TUPLE_IS_IMMUTABLE', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_PUISSANCE: ['PY_POWER_IS_EXACT_ON_INTEGERS'],
  PY_TYPE_DE: ['PY_TYPE_IS_NOT_A_CHECK', 'PY_NO_SEPARATOR_ADDED'],
  PY_PRINT_PLUSIEURS: ['PY_SEPARATOR_IS_EXPLICIT', 'PY_NO_SEPARATOR_ADDED'],
  PY_INSERER: ['PY_LIST_IS_MUTABLE', 'PY_DEL_SHIFTS_THE_REST'],
  PY_RETIRER: ['PY_DEL_SHIFTS_THE_REST', 'PY_LIST_IS_MUTABLE'],
  PY_TRANCHE: ['PY_SLICE_COPIES'],
  PY_INDICE_NEGATIF: ['PY_INDEX_CAN_BE_NEGATIVE', 'PY_NO_SEPARATOR_ADDED'],
  PY_DEPAQUETER: ['PY_MULTIPLE_RETURN_IS_A_TUPLE'],
  PY_DICT_VIDE: ['PY_EMPTY_BRACES_IS_A_DICT', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_DICT_PAIRES: ['PY_EMPTY_BRACES_IS_A_DICT', 'PY_ANNOTATION_NOT_CHECKED'],
  PY_DICT_LIRE: ['PY_MISSING_KEY_RAISES'],
  PY_DICT_ECRIRE: ['PY_MISSING_KEY_RAISES'],
  PY_DICT_PARCOURIR: ['PY_BLOCK_NEEDS_A_BODY', 'PY_LOOP_VARIABLE_SURVIVES'],
  PY_ENSEMBLE: ['PY_SET_REMOVES_DUPLICATES', 'PY_EMPTY_BRACES_IS_A_DICT'],
  PY_CONCATENER: ['PY_STRING_IS_IMMUTABLE'],
  PY_DECOUPER: ['PY_STRING_IS_IMMUTABLE'],
  PY_JOINDRE: ['PY_JOIN_IS_ON_THE_SEPARATOR', 'PY_STRING_IS_IMMUTABLE'],
  PY_MAJUSCULES: ['PY_CASE_IS_NOT_REVERSIBLE', 'PY_STRING_IS_IMMUTABLE'],
  PY_NETTOYER: ['PY_STRING_IS_IMMUTABLE'],
  PY_FORMATER: ['PY_FSTRING_IS_EVALUATED_NOW'],
  PY_APPARTIENT: ['PY_BLOCK_NEEDS_A_BODY', 'PY_MEMBERSHIP_IS_LINEAR'],
  PY_EST_NONE: ['PY_BLOCK_NEEDS_A_BODY', 'PY_IS_IS_IDENTITY', 'PY_NONE_IS_A_VALUE'],
  PY_MATCH: ['PY_BLOCK_NEEDS_A_BODY', 'PY_MATCH_DOES_NOT_FALL_THROUGH'],
  PY_CAS: ['PY_BLOCK_NEEDS_A_BODY', 'PY_MATCH_DOES_NOT_FALL_THROUGH'],
  PY_CAS_DEFAUT: ['PY_BLOCK_NEEDS_A_BODY', 'PY_MATCH_DOES_NOT_FALL_THROUGH'],
  PY_POUR_INDICE_ET_VALEUR: ['PY_BLOCK_NEEDS_A_BODY', 'PY_LOOP_VARIABLE_SURVIVES'],
  PY_PARAM_NOMME: ['PY_ANNOTATION_NOT_CHECKED'],
  PY_RETOUR_MULTIPLE: ['PY_MULTIPLE_RETURN_IS_A_TUPLE'],
  PY_AVEC_FICHIER: ['PY_BLOCK_NEEDS_A_BODY', 'PY_WITH_CLOSES_FOR_YOU'],
  PY_LIRE_LIGNES: ['PY_BLOCK_NEEDS_A_BODY', 'PY_LOOP_VARIABLE_SURVIVES'],
  PY_ESSAYER: ['PY_BLOCK_NEEDS_A_BODY'],
  PY_SAUF: ['PY_BLOCK_NEEDS_A_BODY', 'PY_EXCEPT_NEEDS_A_TYPE'],
  PY_LEVER: ['PY_RAISE_STOPS_THE_FUNCTION'],
  PY_IMPORTER: ['PY_IMPORT_RUNS_THE_MODULE'],
  PY_IMPORTER_DE: ['PY_IMPORT_RUNS_THE_MODULE'],
};

/** Les informations d'une intention NATIVE. L'appelant fournit la portée :
 * la phrase entière, comme pour les intentions portées. */
export function expliquerNatifPython(kind: string, range: SourceRange): InformationPython[] {
  return (NATIVES[kind] ?? []).map(code => ({ code, severity: 'information', range, message: TEXTES[code] }));
}

/** Les informations passives d'une intention rendue en Python. Ordre stable :
 * il est lu par un humain dans un canal de sortie. */
export function expliquerPython(resultat: TranslationResult): InformationPython[] {
  if (resultat.status !== 'translated') return [];
  const kind = resultat.instruction.kind;
  const range: SourceRange = { start: 0, end: resultat.source.text.length };
  const codes: InformationPython['code'][] = [];

  if (CARACTERES.has(kind)) codes.push('PY_CHAR_IS_A_STRING');
  if (AFFICHAGES.has(kind)) codes.push('PY_NO_SEPARATOR_ADDED');
  if (EN_TETES.has(kind)) codes.push('PY_BLOCK_NEEDS_A_BODY');
  if (kind === 'IF' || kind === 'ELSE_IF' || kind === 'WHILE') codes.push('PY_TRUTHINESS');
  if (ANNOTATIONS.has(kind)) codes.push('PY_ANNOTATION_NOT_CHECKED');
  if (kind === 'INIT_INT' || kind === 'NUMERIC_INIT') codes.push('PY_INT_IS_UNBOUNDED');
  if (AFFECTATIONS.has(kind)) codes.push('PY_NAME_REBINDS');

  return codes.map(code => ({ code, severity: 'information', range, message: TEXTES[code] }));
}
