/** Les informations pédagogiques **passives** de Java-A.
 *
 * Lots J3 à J8. Elles ne bloquent rien, n'incrémentent aucun compteur
 * d'avertissement, et ne corrigent rien. Elles disent ce que le langage fait,
 * et ce que **A ne vérifie pas**.
 *
 * Trois d'entre elles **corrigent une règle apprise ailleurs**, et c'est leur
 * raison d'être : un élève qui arrive du C17 ou de Python a des réflexes qui
 * sont faux ici, et le silence les laisserait intacts.
 *
 *   - `JAVA_PRINTLN_ADDS_A_LINE` : en C, `printf` n'ajoute rien ;
 *   - `JAVA_SWITCH_FALLS_THROUGH` : en Python, `match` ne traverse pas ;
 *   - `JAVA_TRY_WITH_RESOURCES_CLOSES` : en C, il **faut** fermer.
 *
 * Et deux disent une **lacune de A**, pas une propriété de Java :
 * `JAVA_STATIC_CANNOT_CALL_INSTANCE` et `JAVA_PRIVATE_IS_NOT_CHECKED_BY_A`.
 * Les écrire est le seul honnête : A est sans état, et il ne saura pas.
 */
import type { InformationLangage } from '../registre.ts';

type Intervalle = { start: number; end: number };

const TEXTES: Readonly<Record<string, string>> = {
  // ---- J1 ----------------------------------------------------------------
  JAVA_CLASS_NAME_IS_FILE_NAME:
    'En Java, une classe « public » doit vivre dans un fichier portant SON nom : une classe « Eleve » '
    + 'exige « Eleve.java ». A ne renomme aucun fichier et ne le vérifie pas : si les deux noms '
    + 'diffèrent, le compilateur refusera le fichier pour une raison qui n’est pas dans le code.',
  JAVA_CHAR_IS_16_BIT:
    'Le type « char » vaut 16 bits en Java, et 8 en C17. Un même programme n’y range donc pas les mêmes '
    + 'caractères, et une valeur qui débordait en C ne débordera pas ici.',
  JAVA_LONG_NEEDS_SUFFIX:
    'Un littéral entier qui dépasse la capacité d’un « int » exige le suffixe « L ». Sans lui, le '
    + 'compilateur refuse LE LITTÉRAL, et non l’affectation : l’erreur désigne le nombre, pas la variable.',
  JAVA_FLOAT_NEEDS_SUFFIX:
    'En Java, « float x = 1.5; » ne compile pas : un littéral décimal est un « double », et il faut '
    + 'écrire « 1.5f ». C17 l’acceptait en convertissant en silence.',
  // ---- J2 ----------------------------------------------------------------
  JAVA_PRINTLN_ADDS_A_LINE:
    'Deux affichages, deux phrases : « Affiche … » n’ajoute RIEN, et « Affiche … et passe à la ligne » '
    + 'ajoute un retour à la ligne. En C17, « printf » n’ajoute jamais rien, et c’est pourquoi A ne '
    + 'choisit pas pour vous.',
  JAVA_SCANNER_LEAVES_THE_NEWLINE:
    'Après la lecture d’un entier, le retour à la ligne reste dans le flux : une lecture de ligne qui '
    + 'suit immédiatement lira une ligne VIDE. C’est un piège du langage, pas un défaut de A, et il se '
    + 'contourne en lisant une ligne de plus.',
  // ---- J3 ----------------------------------------------------------------
  JAVA_INTEGER_DIVISION_TRUNCATES:
    'Entre deux entiers, « / » tronque vers zéro : 7 / 2 vaut 3. C’est le comportement de C17, et non '
    + 'celui de Python, où la même écriture donne 3.5.',
  JAVA_MODULO_FOLLOWS_DIVIDEND:
    'Le signe du reste suit celui du dividende : -7 % 2 vaut -1. C’est le comportement de C17, et non '
    + 'celui de Python, où la même écriture donne 1.',
  JAVA_EQUALS_NOT_DOUBLE_EQUAL:
    'Sur deux chaînes, « == » compare des RÉFÉRENCES et non des contenus : il peut être faux pour deux '
    + 'textes identiques. C’est pourquoi la comparaison de chaînes a sa propre phrase, qui écrit '
    + '« equals ».',
  // ---- J4 ----------------------------------------------------------------
  JAVA_SWITCH_FALLS_THROUGH:
    'Un cas sans sortie TOMBE dans le suivant, comme en C17. C’est l’inverse exact de « match » en '
    + 'Python, qui ne traverse jamais : si vous venez de Python, la sortie explicite n’est pas une '
    + 'formalité.',
  JAVA_FOREACH_HAS_NO_INDEX:
    'La boucle « pour chaque » ne donne pas d’indice : elle donne la VALEUR. Si l’indice est nécessaire, '
    + 'c’est la boucle « pour » classique qu’il faut, avec son compteur écrit.',
  // ---- J5 ----------------------------------------------------------------
  JAVA_STATIC_CANNOT_CALL_INSTANCE:
    'La méthode principale est « static », et une méthode d’instance n’y est pas appelable sans objet. '
    + 'A est SANS ÉTAT : en écrivant un appel, il ne sait pas si la méthode visée est « static », et il '
    + 'peut donc produire du code que le compilateur refusera. Cette lacune n’est pas refermée.',
  JAVA_THROWS_IS_PART_OF_THE_SIGNATURE:
    'La déclaration « peut lancer » fait partie de la SIGNATURE d’une méthode. A ne l’ajoute pas à une '
    + 'signature déjà écrite : il ne modifie jamais une ligne que vous n’avez pas désignée. Si une '
    + 'méthode doit lancer une exception vérifiée, dites-le en la créant.',
  JAVA_OVERRIDE_IS_CHECKED_BY_JAVAC:
    'L’annotation « @Override » ne CRÉE pas une redéfinition : elle demande au compilateur de vérifier '
    + 'qu’il y en a une. C’est le seul endroit du catalogue Java où le compilateur vous protège d’une '
    + 'faute que A ne voit pas.',
  // ---- J6 ----------------------------------------------------------------
  JAVA_NEW_ARRAY_IS_ZEROED:
    'Un tableau créé avec une dimension est ALLOUÉ et mis entièrement à zéro — à « false » pour des '
    + 'booléens, à « null » pour des objets. En C17, la mémoire restait indéterminée, et lire une case '
    + 'non écrite y était un défaut.',
  JAVA_COLLECTION_NEEDS_AN_IMPORT:
    'Les classes de collection et de saisie — liste, table, ensemble, lecteur — exigent un « import ». '
    + 'A ne l’ajoute pas : ce serait une ligne que vous n’avez pas demandée. Écrivez « Importe '
    + 'java.util.ArrayList. » et les autres dont vous avez besoin.',
  JAVA_GENERICS_BOX_PRIMITIVES:
    'Une collection ne peut pas contenir un type primitif : « List<int> » n’existe pas, et A écrit donc '
    + '« List<Integer> ». Java emballe et déballe tout seul, mais « == » entre deux « Integer » compare '
    + 'des références — utilisez « equals » pour comparer des valeurs emballées.',
  JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE:
    'Le mot « tableau » ou « liste » fait partie de la phrase, et ce n’est pas une lourdeur : un élément '
    + 'de tableau s’écrit « t[0] », un élément de liste « t.get(0) ». A est sans état et ne sait pas ce '
    + 'que le nom désigne — le mot que vous ajoutez EST l’information manquante.',
  JAVA_LIST_GROWS_ARRAY_DOES_NOT:
    'Une liste grandit quand on y ajoute ; un tableau a une dimension FIXE, décidée à sa création. C’est '
    + 'la raison principale de choisir l’une plutôt que l’autre.',
  // ---- J7 ----------------------------------------------------------------
  JAVA_PRIVATE_IS_NOT_CHECKED_BY_A:
    'A n’applique AUCUN contrôle de visibilité : lire ou écrire un champ « private » depuis une autre '
    + 'classe est accepté par A et refusé par le compilateur. Comme pour les types et les bornes, A ne '
    + 'vérifie rien de ce que le langage vérifie.',
  JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS:
    'Dès qu’un constructeur est écrit, le constructeur sans argument CESSE D’EXISTER : « new Eleve() » ne '
    + 'compile plus. Si vous voulez les deux, écrivez les deux — A ne sait pas lesquels existent.',
  JAVA_THIS_DISAMBIGUATES:
    '« this. » n’est pas décoratif quand le champ et le paramètre portent le même nom : sans lui, la '
    + 'ligne affecte le paramètre à lui-même et ne fait RIEN. Le compilateur ne dira rien non plus.',
  // ---- J8 ----------------------------------------------------------------
  JAVA_INTERFACE_METHOD_HAS_NO_BODY:
    'Une méthode attendue n’a pas de corps : A écrit une LIGNE, pas un bloc. Une accolade y serait une '
    + 'erreur de syntaxe, et toute classe qui implémente l’interface devra fournir le corps.',
  JAVA_DECLARED_TYPE_DECIDES_WHAT_YOU_CAN_CALL:
    'Le type DÉCLARÉ décide de ce que vous pouvez appeler ; le type CRÉÉ décide de ce qui s’exécute. '
    + 'C’est tout le polymorphisme, et c’est aussi pourquoi une méthode absente de l’interface n’est pas '
    + 'appelable, même si l’objet la possède.',
  // ---- J9 ----------------------------------------------------------------
  JAVA_TRY_WITH_RESOURCES_CLOSES:
    'Le bloc essaie AVEC ressource ferme le fichier tout seul, même si une exception survient : il n’y a '
    + 'pas de fermeture à écrire, donc pas de fermeture à oublier. C’est la même leçon que « with » en '
    + 'Python, et l’inverse de C17, où il FAUT fermer.',
  JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED:
    'Lire ou écrire un fichier peut lever une exception VÉRIFIÉE, et Java impose de la traiter : il y a '
    + 'exactement deux issues légales — l’attraper dans une branche « attrape », ou la déclarer dans la '
    + 'signature de la méthode. A ne choisit NI l’une NI l’autre : choisir pour vous reviendrait à '
    + 'décider de votre traitement d’erreur.',
  JAVA_ASSERT_IS_DISABLED_BY_DEFAULT:
    'Les assertions sont INACTIVES par défaut : sans l’option « -ea » à l’exécution, la ligne ne '
    + 'vérifie rien. Une assertion qui ne se déclenche jamais n’est donc pas une preuve que la condition '
    + 'est vraie.',
  JAVA_PACKAGE_NEEDS_A_DIRECTORY:
    'Une déclaration de paquetage exige que le fichier vive dans un répertoire du même nom, relativement '
    + 'à la racine de compilation. A ne déplace aucun fichier et ne le vérifie pas.',
};

/** Les informations attachées à chaque genre. Un genre peut en porter
 * plusieurs ; aucune n'est posée deux fois. */
const PAR_GENRE: Readonly<Record<string, readonly string[]>> = {
  // Partagées, rendues par `rendu.ts`
  STRUCT_DECL: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  DECL_CHAR: ['JAVA_CHAR_IS_16_BIT'],
  INIT_CHAR: ['JAVA_CHAR_IS_16_BIT'],
  ASSIGN_CHAR: ['JAVA_CHAR_IS_16_BIT'],
  NUMERIC_INIT: ['JAVA_FLOAT_NEEDS_SUFFIX'],
  CONST_DECL: ['JAVA_FLOAT_NEEDS_SUFFIX'],
  PRINT_INT: ['JAVA_PRINTLN_ADDS_A_LINE'],
  PRINT_TEXT: ['JAVA_PRINTLN_ADDS_A_LINE'],
  PRINT_CHAR: ['JAVA_PRINTLN_ADDS_A_LINE'],
  PRINT_STRING: ['JAVA_PRINTLN_ADDS_A_LINE'],
  ASSIGN_EXPRESSION: ['JAVA_INTEGER_DIVISION_TRUNCATES', 'JAVA_MODULO_FOLLOWS_DIVIDEND'],
  NUMERIC_ASSIGN: ['JAVA_INTEGER_DIVISION_TRUNCATES', 'JAVA_MODULO_FOLLOWS_DIVIDEND'],
  SWITCH: ['JAVA_SWITCH_FALLS_THROUGH'],
  CASE_INT: ['JAVA_SWITCH_FALLS_THROUGH'],
  CASE_CHAR: ['JAVA_SWITCH_FALLS_THROUGH'],
  CASE_DEFAULT: ['JAVA_SWITCH_FALLS_THROUGH'],
  MAIN: ['JAVA_STATIC_CANNOT_CALL_INSTANCE'],
  FUNC_DEF: ['JAVA_STATIC_CANNOT_CALL_INSTANCE', 'JAVA_THROWS_IS_PART_OF_THE_SIGNATURE'],
  ARRAY_DECL: ['JAVA_NEW_ARRAY_IS_ZEROED', 'JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  ARRAY_ASSIGN_INT: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  ARRAY_PRINT: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  STRUCT_FIELD: ['JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'],
  STRUCT_VAR: ['JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS'],
  MEMBER_PRINT: ['JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'],
  MEMBER_ASSIGN_INT: ['JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'],
  ASSERT: ['JAVA_ASSERT_IS_DISABLED_BY_DEFAULT'],
  FILE_WRITE_TEXT: ['JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
  FILE_WRITE_INT: ['JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
  FILE_READ_STRING: ['JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
  STRING_INIT: ['JAVA_EQUALS_NOT_DOUBLE_EQUAL'],

  // Natives
  JAVA_CLASSE: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  JAVA_CLASSE_HERITE: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  JAVA_CLASSE_ABSTRAITE: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  JAVA_CLASSE_IMPLEMENTE: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  JAVA_INTERFACE: ['JAVA_CLASS_NAME_IS_FILE_NAME'],
  JAVA_LONG: ['JAVA_LONG_NEEDS_SUFFIX'],
  JAVA_FLOAT: ['JAVA_FLOAT_NEEDS_SUFFIX'],
  JAVA_AFFICHE_LIGNE: ['JAVA_PRINTLN_ADDS_A_LINE'],
  JAVA_AFFICHE_TEXTE_LIGNE: ['JAVA_PRINTLN_ADDS_A_LINE'],
  JAVA_LECTEUR_SAISIE: ['JAVA_COLLECTION_NEEDS_AN_IMPORT'],
  JAVA_LIRE_ENTIER_SAISIE: ['JAVA_SCANNER_LEAVES_THE_NEWLINE'],
  JAVA_LIRE_LIGNE_SAISIE: ['JAVA_SCANNER_LEAVES_THE_NEWLINE'],
  JAVA_COMPARE_CHAINES: ['JAVA_EQUALS_NOT_DOUBLE_EQUAL'],
  JAVA_CONVERTI_ENTIER: ['JAVA_INTEGER_DIVISION_TRUNCATES'],
  JAVA_CAS_TEXTE: ['JAVA_SWITCH_FALLS_THROUGH'],
  JAVA_POUR_CHAQUE_TABLEAU: ['JAVA_FOREACH_HAS_NO_INDEX'],
  JAVA_POUR_CHAQUE_LISTE: ['JAVA_FOREACH_HAS_NO_INDEX', 'JAVA_GENERICS_BOX_PRIMITIVES'],
  JAVA_POUR_CHAQUE_CLE: ['JAVA_FOREACH_HAS_NO_INDEX'],
  JAVA_METHODE_STATIQUE_VIDE: ['JAVA_STATIC_CANNOT_CALL_INSTANCE'],
  JAVA_METHODE_PUBLIQUE: ['JAVA_STATIC_CANNOT_CALL_INSTANCE'],
  JAVA_METHODE_PUBLIQUE_VIDE: ['JAVA_STATIC_CANNOT_CALL_INSTANCE'],
  JAVA_METHODE_PRIVEE: ['JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'],
  JAVA_METHODE_REDEFINIE: ['JAVA_OVERRIDE_IS_CHECKED_BY_JAVAC'],
  JAVA_METHODE_LANCE: ['JAVA_THROWS_IS_PART_OF_THE_SIGNATURE'],
  JAVA_DECL_TABLEAU: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE', 'JAVA_LIST_GROWS_ARRAY_DOES_NOT'],
  JAVA_TABLEAU_ASSIGNE: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  JAVA_TABLEAU_AFFICHE: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  JAVA_LISTE: ['JAVA_COLLECTION_NEEDS_AN_IMPORT', 'JAVA_GENERICS_BOX_PRIMITIVES',
    'JAVA_LIST_GROWS_ARRAY_DOES_NOT'],
  JAVA_TABLE: ['JAVA_COLLECTION_NEEDS_AN_IMPORT', 'JAVA_GENERICS_BOX_PRIMITIVES'],
  JAVA_ENSEMBLE: ['JAVA_COLLECTION_NEEDS_AN_IMPORT', 'JAVA_GENERICS_BOX_PRIMITIVES'],
  JAVA_LISTE_ELEMENT: ['JAVA_ARRAY_OR_LIST_IS_IN_THE_SENTENCE'],
  JAVA_CHAMP_PRIVE: ['JAVA_PRIVATE_IS_NOT_CHECKED_BY_A'],
  JAVA_CONSTRUCTEUR: ['JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS'],
  JAVA_CONSTRUCTEUR_PARAMETRE: ['JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS'],
  JAVA_CHAMP_PARAMETRE: ['JAVA_THIS_DISAMBIGUATES'],
  JAVA_OBJET_ARGUMENT: ['JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS'],
  JAVA_METHODE_ATTENDUE: ['JAVA_INTERFACE_METHOD_HAS_NO_BODY'],
  JAVA_METHODE_ATTENDUE_RETOUR: ['JAVA_INTERFACE_METHOD_HAS_NO_BODY'],
  JAVA_METHODE_ABSTRAITE: ['JAVA_INTERFACE_METHOD_HAS_NO_BODY'],
  JAVA_DECL_TYPE_CLASSE: ['JAVA_DECLARED_TYPE_DECIDES_WHAT_YOU_CAN_CALL'],
  JAVA_OBJET_POLYMORPHE: ['JAVA_DECLARED_TYPE_DECIDES_WHAT_YOU_CAN_CALL'],
  JAVA_OBJET_POLYMORPHE_ARG: ['JAVA_DECLARED_TYPE_DECIDES_WHAT_YOU_CAN_CALL',
    'JAVA_DEFAULT_CONSTRUCTOR_DISAPPEARS'],
  JAVA_PAQUETAGE: ['JAVA_PACKAGE_NEEDS_A_DIRECTORY'],
  JAVA_ESSAIE_LECTEUR: ['JAVA_TRY_WITH_RESOURCES_CLOSES', 'JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
  JAVA_ESSAIE_ECRIVAIN: ['JAVA_TRY_WITH_RESOURCES_CLOSES', 'JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
  JAVA_LIRE_LIGNE_FICHIER: ['JAVA_CHECKED_EXCEPTION_MUST_BE_HANDLED'],
};

/** Tous les codes publiés, pour qu'un test puisse exiger que chacun soit
 * atteignable par au moins une phrase. */
export const CODES_JAVA: readonly string[] = Object.keys(TEXTES);

/** Les informations d'un genre. Jamais de doublon, et l'intervalle est celui
 * de la phrase entière : une information passive ne désigne pas un mot. */
export function expliquerJava(kind: string, range: Intervalle): readonly InformationLangage[] {
  const codes = PAR_GENRE[kind] ?? [];
  const vus = new Set<string>();
  const informations: InformationLangage[] = [];
  for (const code of codes) {
    if (vus.has(code)) continue;
    vus.add(code);
    const message = TEXTES[code];
    if (message === undefined) throw new Error('Information sans texte : ' + code);
    informations.push({ code, severity: 'information', range, message });
  }
  return informations;
}
