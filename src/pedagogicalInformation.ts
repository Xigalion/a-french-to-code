import type { Condition } from './condition.ts';
import type { SourceRange, TranslationResult } from './translate.ts';
import { instructionCondition } from './translate.ts';

export type PedagogicalInformation = {
  code: 'SHORT_CIRCUIT_AND' | 'SHORT_CIRCUIT_OR' | 'LOGICAL_NOT'
    | 'WHILE_PRETEST' | 'DO_WHILE_POSTTEST' | 'FOR_CLAUSE_ORDER'
    | 'FUNCTION_SCOPE' | 'RETURN_ENDS_FUNCTION' | 'PARAMETERS_BY_VALUE' | 'CALL_NOT_RESOLVED'
    | 'CHARACTER_IS_INTEGER' | 'CHARACTER_STORAGE' | 'CHARACTER_FORMAT'
    | 'INDEX_NOT_CHECKED' | 'ARRAY_NOT_ASSIGNABLE' | 'CHAR_ARRAY_NOT_STRING'
    | 'NULL_TERMINATOR' | 'ARRAY_SIZE_VS_LENGTH' | 'STRING_TERMINATOR_NOT_CHECKED'
    | 'ELEMENT_CHARACTER_FORMAT'
    | 'ADDRESS_OF' | 'POINTER_VS_OBJECT' | 'DEREFERENCE_MEANING'
    | 'UNINITIALIZED_POINTER' | 'ADDRESS_NOT_CHECKED'
    | 'ARRAY_POINTER_EQUIVALENCE' | 'POINTER_ARITHMETIC_LIMITS'
    | 'OUT_OF_BOUNDS_UNDEFINED' | 'OFFSET_TYPE_NOT_CHECKED'
    | 'SWITCH_INTEGER_ONLY' | 'SWITCH_FALLTHROUGH' | 'CASE_NEEDS_STATEMENT'
    | 'DEFAULT_OPTIONAL' | 'BREAK_LEAVES_SWITCH'
    | 'STRUCT_TAG_NEEDS_KEYWORD' | 'STRUCT_LAYOUT' | 'MEMBER_ACCESS_FORM' | 'MEMBER_NOT_CHECKED'
    | 'SIZEOF_IS_BYTES' | 'ALLOCATION_CAN_FAIL' | 'ALLOCATION_NOT_INITIALIZED'
    | 'REALLOC_MAY_MOVE' | 'FREE_ONCE' | 'HEADER_DECLARES_ONLY'
    | 'FOPEN_CAN_FAIL' | 'FILE_MODE_MEANING' | 'FILE_MUST_BE_CLOSED'
    | 'SCANF_NEEDS_ADDRESS' | 'EOF_AFTER_READ';
  severity: 'information';
  range: SourceRange;
  message: string;
};

/** When each loop form evaluates its condition. Deliberately not a
 * termination, progression or iteration-count claim.
 */
const MOMENT: Readonly<Record<string, { code: PedagogicalInformation['code']; message: string }>> = {
  WHILE: { code: 'WHILE_PRETEST',
    message: 'La condition est testée avant chaque itération ; le corps peut ne jamais être exécuté. '
      + 'Aucune progression ni terminaison n’est déduite.' },
  DO_WHILE: { code: 'DO_WHILE_POSTTEST',
    message: 'La condition est testée après chaque itération ; si la boucle est atteinte, le corps est exécuté '
      + 'au moins une fois. Aucune progression ni terminaison n’est déduite.' },
  FOR: { code: 'FOR_CLAUSE_ORDER',
    message: 'L’initialisation est exécutée une fois avant le premier test ; la condition est testée avant chaque '
      + 'itération ; la mise à jour est exécutée après le corps, avant le test suivant. '
      + 'Aucune progression ni terminaison n’est déduite.' },
};

/** Structural explanations, never a safety or reachability analysis.
 * The loop entries state when the condition is evaluated and stay on the
 * passive information channel: they never become warnings.
 */
/** The first subscript delimiters found in an instruction's parameters, in
 * source order. Walked structurally rather than per intent, so an envelope
 * that later accepts an expression cannot silently lose the information. */
function firstIndexRange(value: unknown): SourceRange | undefined {
  if (Array.isArray(value)) {
    for (const item of value) { const found = firstIndexRange(item); if (found) return found; }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const node = value as { kind?: unknown; bracketRange?: unknown };
  const bracket = node.bracketRange as SourceRange | undefined;
  if (node.kind === 'index' && bracket && typeof bracket.start === 'number' && typeof bracket.end === 'number') return bracket;
  for (const child of Object.values(value)) { const found = firstIndexRange(child); if (found) return found; }
  return undefined;
}

/** The first node of a given kind written inside an expression, with the
 * range the pedagogy should point at. Walked structurally, like the subscripts
 * and the character constants, so a later envelope cannot lose it. */
function firstNodeRange(value: unknown, kind: string, field: 'range' | 'operatorRange'): SourceRange | undefined {
  if (Array.isArray(value)) {
    for (const item of value) { const found = firstNodeRange(item, kind, field); if (found) return found; }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const node = value as Record<string, unknown>;
  const range = node[field] as SourceRange | undefined;
  if (node.kind === kind && range && typeof range.start === 'number') return range;
  for (const child of Object.values(value)) { const found = firstNodeRange(child, kind, field); if (found) return found; }
  return undefined;
}

const POINTER_MESSAGES = {
  ADDRESS_OF: 'Une adresse désigne l’emplacement d’un objet en mémoire, pas sa valeur. L’écrire ne copie rien : '
    + 'le pointeur qui la reçoit et la variable visée restent deux objets distincts.',
  POINTER_VS_OBJECT: 'Un pointeur et l’objet pointé sont deux choses différentes : « p » contient une adresse, '
    + '« *p » désigne l’objet rangé à cette adresse. Modifier l’un n’est pas modifier l’autre.',
  DEREFERENCE_MEANING: 'Le déréférencement désigne l’objet dont ce pointeur contient l’adresse, en lecture comme '
    + 'en écriture : écrire dans « *p » écrit dans cet objet, pas dans le pointeur.',
  UNINITIALIZED_POINTER: 'Aucune adresse n’est écrite ici : la valeur de ce pointeur est indéterminée tant qu’il '
    + 'n’en reçoit pas une. Le déréférencer avant cela a, en C17, un comportement indéfini.',
  ADDRESS_NOT_CHECKED: 'C-A ne vérifie ni que ce pointeur a reçu une adresse, ni qu’elle est encore valide, ni '
    + 'qu’elle désigne bien le type attendu. Aucune mémoire n’est analysée ici.',
  ARRAY_POINTER_EQUIVALENCE: 'En C17, « t[i] » et « *(t + i) » désignent le même élément. Dans une expression, le '
    + 'nom d’un tableau est converti en pointeur vers son premier élément ; un tableau et un pointeur ne sont pas '
    + 'pour autant du même type.',
  POINTER_ARITHMETIC_LIMITS: 'L’addition se compte en éléments, pas en octets. Elle n’est définie qu’à l’intérieur '
    + 'du tableau et jusqu’à une position au-delà du dernier élément : cette position peut être formée, mais elle '
    + 'ne doit pas être déréférencée.',
  OUT_OF_BOUNDS_UNDEFINED: 'Lire ou écrire hors des limites a, en C17, un comportement indéfini, et rien ne le '
    + 'signale à l’exécution. C-A ne vérifie ni les bornes, ni la validité de l’adresse formée.',
  OFFSET_TYPE_NOT_CHECKED: 'Cette forme est syntaxiquement celle d’un décalage, et rien de plus : C-A ne vérifie ni '
    + 'que ce nom désigne un tableau ou un pointeur, ni que le décalage est bien un entier. Une forme acceptée ici '
    + 'ne garantit pas que le C produit soit correct.',
} as const;

/** The first character constant written inside an expression. Walked the same
 * structural way as the subscripts, and for the same reason. */
function firstCharacterRange(value: unknown): SourceRange | undefined {
  if (Array.isArray(value)) {
    for (const item of value) { const found = firstCharacterRange(item); if (found) return found; }
    return undefined;
  }
  if (typeof value !== 'object' || value === null) return undefined;
  const node = value as { kind?: unknown; range?: unknown };
  const range = node.range as SourceRange | undefined;
  if (node.kind === 'character' && range && typeof range.start === 'number') return range;
  for (const child of Object.values(value)) { const found = firstCharacterRange(child); if (found) return found; }
  return undefined;
}

const SWITCH_MESSAGES = {
  SWITCH_INTEGER_ONLY: 'En C17, l’expression d’un switch doit être entière, et chaque étiquette exige une constante '
    + 'entière distincte. C-A ne relit pas le document : il ne vérifie ni l’unicité des valeurs, ni la couverture.',
  SWITCH_FALLTHROUGH: 'Sans « break », l’exécution continue dans l’étiquette suivante. Ce n’est pas une erreur en '
    + 'C17 : c’est le comportement par défaut, et il doit être voulu.',
  CASE_NEEDS_STATEMENT: 'En C17, une étiquette doit être suivie d’une instruction : une étiquette seule avant « } » '
    + 'ne compile pas. C-A crée les blocs vides et n’ajoute aucune instruction ici.',
  DEFAULT_OPTIONAL: '« default » est facultatif. Sans lui, une valeur qui ne correspond à aucune étiquette ne '
    + 'déclenche rien, et l’exécution se poursuit après l’aiguillage.',
  BREAK_LEAVES_SWITCH: '« break » quitte l’aiguillage, pas la fonction, et pas une boucle qui l’englobe. Pour '
    + 'sortir d’une boucle, la phrase est « Sors de la boucle la plus intérieure. ».',
} as const;

const STRUCT_MESSAGES = {
  STRUCT_TAG_NEEDS_KEYWORD: 'En C17, ce nom est une étiquette : le type s’écrit « struct » suivi de l’étiquette, pas '
    + 'l’étiquette seule. Les champs sont ajoutés un par un ; aucun n’est créé ici.',
  STRUCT_LAYOUT: 'Les champs sont rangés dans l’ordre de leur déclaration, mais l’implémentation peut insérer du '
    + 'remplissage entre eux : la taille d’une structure n’est pas la somme des tailles de ses champs.',
  MEMBER_ACCESS_FORM: 'Le point s’applique à une structure, la flèche à un pointeur vers une structure : « p->x » '
    + 'est exactement « (*p).x ». C-A écrit la forme demandée et n’en substitue jamais une à l’autre.',
  MEMBER_NOT_CHECKED: 'C-A ne vérifie ni que cette structure existe, ni qu’elle possède ce champ, ni le type de ce '
    + 'champ. Aucune déclaration n’est relue ici.',
} as const;

const MEMORY_MESSAGES = {
  SIZEOF_IS_BYTES: 'sizeof donne une taille en octets, de type size_t, qui s’affiche avec « %zu ». Ce n’est pas un '
    + 'nombre d’éléments, et ce n’est pas la somme des tailles des champs pour une structure.',
  ALLOCATION_CAN_FAIL: 'malloc renvoie NULL si l’allocation échoue. C-A n’ajoute aucun test : il revient à '
    + 'l’étudiant d’écrire « Crée un bloc si "p == NULL". » avant d’utiliser ce pointeur.',
  ALLOCATION_NOT_INITIALIZED: 'malloc ne donne aucune valeur à la mémoire obtenue. Lire un élément avant de l’avoir '
    + 'écrit a, en C17, un comportement indéfini.',
  REALLOC_MAY_MOVE: 'realloc peut déplacer le bloc : seule l’adresse qu’il renvoie est valide ensuite, et l’ancienne '
    + 'ne doit plus être utilisée. En cas d’échec il renvoie NULL sans libérer l’ancien bloc : écraser le pointeur '
    + 'd’origine avec le résultat ferait perdre ce bloc.',
  FREE_ONCE: 'free rend la mémoire une fois et une seule. Après cet appel, le pointeur ne désigne plus rien de '
    + 'valide : le libérer deux fois ou l’utiliser encore a un comportement indéfini. C-A ne suit aucune durée de vie.',
  HEADER_DECLARES_ONLY: 'Cet en-tête déclare malloc, realloc, free et NULL. L’inclure ne fait rien d’autre : aucune '
    + 'allocation n’a lieu ici, et C-A n’ajoute jamais un en-tête de lui-même.',
} as const;

const FILE_MESSAGES = {
  FOPEN_CAN_FAIL: 'fopen renvoie NULL si le fichier ne peut pas être ouvert — chemin absent, droits refusés, autre '
    + 'raison. C-A n’ajoute aucun test : écrire « Crée un bloc si "f == NULL". » avant d’utiliser ce flux revient à '
    + 'l’étudiant.',
  FILE_MODE_MEANING: 'Le mode choisi décide de tout : « r » échoue si le fichier n’existe pas, « w » le crée et '
    + 'efface son contenu existant, « a » écrit à la fin. Le suffixe « b » demande le mode binaire, qui ne traduit '
    + 'pas les fins de ligne.',
  FILE_MUST_BE_CLOSED: 'Un flux ouvert doit être fermé. Avant fclose, des données écrites peuvent n’être encore que '
    + 'dans le tampon : sans fermeture, elles peuvent ne jamais atteindre le fichier. C-A ne suit aucun flux.',
  SCANF_NEEDS_ADDRESS: 'fscanf écrit dans la variable, il lui faut donc son adresse : c’est le rôle du « & ». La '
    + 'valeur renvoyée dit combien de conversions ont réussi, et C-A ne la teste pas.',
  EOF_AFTER_READ: 'feof ne regarde pas devant : il devient vrai seulement après une lecture qui a échoué parce que '
    + 'la fin était atteinte. Tester feof avant de lire fait lire une fois de trop.',
} as const;

export function explainInstruction(result: TranslationResult): PedagogicalInformation[] {
  if (result.status !== 'translated') return [];
  if (result.instruction.kind === 'FILE_OPEN') {
    return [
      { code: 'FOPEN_CAN_FAIL', severity: 'information', range: { ...result.instruction.parameters.nameRange },
        message: FILE_MESSAGES.FOPEN_CAN_FAIL },
      { code: 'FILE_MODE_MEANING', severity: 'information', range: { ...result.instruction.parameters.modeRange },
        message: FILE_MESSAGES.FILE_MODE_MEANING },
    ];
  }
  if (result.instruction.kind === 'FILE_DECL' || result.instruction.kind === 'FILE_CLOSE') {
    return [{ code: 'FILE_MUST_BE_CLOSED', severity: 'information',
      range: { ...result.instruction.parameters.nameRange }, message: FILE_MESSAGES.FILE_MUST_BE_CLOSED }];
  }
  if (result.instruction.kind === 'FILE_READ_INT') {
    return [{ code: 'SCANF_NEEDS_ADDRESS', severity: 'information',
      range: { ...result.instruction.parameters.targetRange }, message: FILE_MESSAGES.SCANF_NEEDS_ADDRESS }];
  }
  if (result.instruction.kind === 'FILE_AT_END') {
    return [{ code: 'EOF_AFTER_READ', severity: 'information',
      range: { ...result.instruction.parameters.nameRange }, message: FILE_MESSAGES.EOF_AFTER_READ }];
  }
  if (result.instruction.kind === 'INCLUDE_STDLIB') {
    return [{ code: 'HEADER_DECLARES_ONLY', severity: 'information', range: { start: 0, end: 0 },
      message: MEMORY_MESSAGES.HEADER_DECLARES_ONLY }];
  }
  if (result.instruction.kind === 'SIZEOF_PRINT' || result.instruction.kind === 'SIZEOF_ASSIGN') {
    return [{ code: 'SIZEOF_IS_BYTES', severity: 'information',
      range: { ...result.instruction.parameters.typeRange }, message: MEMORY_MESSAGES.SIZEOF_IS_BYTES }];
  }
  if (result.instruction.kind === 'ALLOCATE' || result.instruction.kind === 'REALLOCATE') {
    const anchor = result.instruction.parameters.nameRange;
    const entries: PedagogicalInformation[] = [
      { code: 'ALLOCATION_CAN_FAIL', severity: 'information', range: { ...anchor }, message: MEMORY_MESSAGES.ALLOCATION_CAN_FAIL },
      { code: 'SIZEOF_IS_BYTES', severity: 'information', range: { ...result.instruction.parameters.typeRange },
        message: MEMORY_MESSAGES.SIZEOF_IS_BYTES },
    ];
    if (result.instruction.kind === 'REALLOCATE') {
      return [...entries, { code: 'REALLOC_MAY_MOVE', severity: 'information',
        range: { ...result.instruction.parameters.sourceRange }, message: MEMORY_MESSAGES.REALLOC_MAY_MOVE }];
    }
    return [...entries, { code: 'ALLOCATION_NOT_INITIALIZED', severity: 'information', range: { ...anchor },
      message: MEMORY_MESSAGES.ALLOCATION_NOT_INITIALIZED }];
  }
  if (result.instruction.kind === 'FREE') {
    return [{ code: 'FREE_ONCE', severity: 'information',
      range: { ...result.instruction.parameters.nameRange }, message: MEMORY_MESSAGES.FREE_ONCE }];
  }
  if (result.instruction.kind === 'STRUCT_DECL') {
    const anchor = result.instruction.parameters.tagRange;
    return [
      { code: 'STRUCT_TAG_NEEDS_KEYWORD', severity: 'information', range: { ...anchor }, message: STRUCT_MESSAGES.STRUCT_TAG_NEEDS_KEYWORD },
      { code: 'STRUCT_LAYOUT', severity: 'information', range: { ...anchor }, message: STRUCT_MESSAGES.STRUCT_LAYOUT },
    ];
  }
  if (result.instruction.kind === 'MEMBER_ASSIGN_INT' || result.instruction.kind === 'MEMBER_ASSIGN_CHAR'
    || result.instruction.kind === 'MEMBER_ASSIGN_EXPRESSION' || result.instruction.kind === 'MEMBER_PRINT') {
    const anchor = result.instruction.parameters.target.memberRange;
    return [
      { code: 'MEMBER_ACCESS_FORM', severity: 'information', range: { ...anchor }, message: STRUCT_MESSAGES.MEMBER_ACCESS_FORM },
      { code: 'MEMBER_NOT_CHECKED', severity: 'information', range: { ...anchor }, message: STRUCT_MESSAGES.MEMBER_NOT_CHECKED },
    ];
  }
  if (result.instruction.kind === 'SWITCH') {
    return [{ code: 'SWITCH_INTEGER_ONLY', severity: 'information',
      range: { ...result.instruction.parameters.expressionRange }, message: SWITCH_MESSAGES.SWITCH_INTEGER_ONLY }];
  }
  if (result.instruction.kind === 'CASE_INT' || result.instruction.kind === 'CASE_CHAR'
    || result.instruction.kind === 'CASE_DEFAULT') {
    const anchor = result.instruction.kind === 'CASE_INT' ? result.instruction.parameters.valueRange
      : result.instruction.kind === 'CASE_CHAR' ? result.instruction.parameters.literalRange
        : result.instruction.parameters.keywordRange;
    const entries: PedagogicalInformation[] = [
      { code: 'SWITCH_FALLTHROUGH', severity: 'information', range: { ...anchor }, message: SWITCH_MESSAGES.SWITCH_FALLTHROUGH },
      { code: 'CASE_NEEDS_STATEMENT', severity: 'information', range: { ...anchor }, message: SWITCH_MESSAGES.CASE_NEEDS_STATEMENT },
    ];
    if (result.instruction.kind !== 'CASE_DEFAULT') return entries;
    return [...entries, { code: 'DEFAULT_OPTIONAL', severity: 'information', range: { ...anchor }, message: SWITCH_MESSAGES.DEFAULT_OPTIONAL }];
  }
  if (result.instruction.kind === 'BREAK_SWITCH') {
    return [{ code: 'BREAK_LEAVES_SWITCH', severity: 'information',
      range: { ...result.instruction.parameters.keywordRange }, message: SWITCH_MESSAGES.BREAK_LEAVES_SWITCH }];
  }
  // A text initialiser IS a string, so CHAR_ARRAY_NOT_STRING must not fire
  // here: the two declarations teach opposite halves of the same fact.
  if (result.instruction.kind === 'STRING_INIT') {
    const parameters = result.instruction.parameters;
    return [
      { code: 'NULL_TERMINATOR', severity: 'information', range: { ...parameters.textRange },
        message: 'Le compilateur ajoute un caractère nul, de code zéro, à la fin de ce texte. C’est lui, et non la '
          + 'dimension, qui marque la fin de la chaîne : toute fonction qui lit une chaîne s’arrête dessus.' },
      { code: 'ARRAY_SIZE_VS_LENGTH', severity: 'information', range: { ...parameters.dimensionRange },
        message: `La dimension ${parameters.dimension} est la place réservée ; la longueur de la chaîne est le nombre `
          + `de caractères avant le nul, ici ${parameters.text.length}. Les deux ne sont pas la même chose, et C-A `
          + 'ne recalcule ni l’une ni l’autre par la suite.' },
    ];
  }
  if (result.instruction.kind === 'PRINT_STRING') {
    return [{ code: 'STRING_TERMINATOR_NOT_CHECKED', severity: 'information',
      range: { ...result.instruction.parameters.nameRange },
      message: '%s lit les caractères un à un jusqu’au premier caractère nul. C-A ne vérifie ni que ce tableau '
        + 'existe, ni qu’il en contient un : sans terminateur, la lecture dépasse le tableau, et C17 n’en définit '
        + 'alors pas le comportement.' }];
  }
  if (result.instruction.kind === 'ARRAY_DECL') {
    const parameters = result.instruction.parameters;
    const declared: PedagogicalInformation[] = [{ code: 'ARRAY_NOT_ASSIGNABLE', severity: 'information',
      range: { ...parameters.nameRange },
      message: 'Un tableau ne s’affecte pas globalement en C17 : après cette déclaration, « ' + parameters.name
        + ' = … » n’existe pas, et chaque élément se remplit séparément. Aucune valeur initiale n’est écrite ici.' }];
    if (parameters.type !== 'char') return declared;
    return [...declared, { code: 'CHAR_ARRAY_NOT_STRING', severity: 'information',
      range: { ...parameters.nameRange },
      message: 'Un tableau de char contient des codes de caractères : il ne devient une chaîne C que si un caractère '
        + 'nul en marque la fin, et aucun n’est écrit ici. C-A ne traite ce tableau comme une chaîne à aucun moment.' }];
  }
  const entries: PedagogicalInformation[] = [];
  const kind = result.instruction.kind;
  const parameters: unknown = result.instruction.parameters;
  if (kind === 'DECL_POINTER' || kind === 'INIT_POINTER' || kind === 'ASSIGN_ADDRESS') {
    const anchor = (result.instruction.parameters as { nameRange: SourceRange }).nameRange;
    const object: PedagogicalInformation = { code: 'POINTER_VS_OBJECT', severity: 'information',
      range: { ...anchor }, message: POINTER_MESSAGES.POINTER_VS_OBJECT };
    if (kind === 'DECL_POINTER') {
      return [{ code: 'UNINITIALIZED_POINTER', severity: 'information', range: { ...anchor },
        message: POINTER_MESSAGES.UNINITIALIZED_POINTER }, object];
    }
    const target = (result.instruction.parameters as { targetRange: SourceRange }).targetRange;
    return [{ code: 'ADDRESS_OF', severity: 'information', range: { ...target },
      message: POINTER_MESSAGES.ADDRESS_OF }, object];
  }
  if (kind === 'PRINT_POINTED' || kind === 'ASSIGN_POINTED_INT' || kind === 'ASSIGN_POINTED_EXPRESSION') {
    const anchor = (result.instruction.parameters as { nameRange: SourceRange }).nameRange;
    return [
      { code: 'DEREFERENCE_MEANING', severity: 'information', range: { ...anchor }, message: POINTER_MESSAGES.DEREFERENCE_MEANING },
      { code: 'ADDRESS_NOT_CHECKED', severity: 'information', range: { ...anchor }, message: POINTER_MESSAGES.ADDRESS_NOT_CHECKED },
      ...explainStructure(result),
    ];
  }
  const bracket = firstIndexRange(result.instruction.parameters);
  if (bracket) {
    entries.push({ code: 'INDEX_NOT_CHECKED', severity: 'information', range: { ...bracket },
      message: 'C-A ne vérifie pas les bornes de ce tableau : ni sa dimension, ni la valeur de cet indice ne sont '
        + 'connues ici. En C17, lire ou écrire hors des bornes a un comportement indéfini, et rien ne le signale à '
        + 'l’exécution. Aucun dépassement n’est ici détecté ni exclu.' });
  }
  if (result.instruction.kind === 'ARRAY_PRINT_CHAR') {
    entries.push({ code: 'ELEMENT_CHARACTER_FORMAT', severity: 'information',
      range: { ...result.instruction.parameters.element.bracketRange },
      message: '%c affiche le caractère dont le code est rangé dans cet élément ; %d afficherait ce code en '
        + 'décimal. C-A ne vérifie ni que ce tableau est de type char, ni que cet élément a été écrit.' });
  }
  // The two unary operators written inside an expression carry the same facts
  // as the dedicated envelopes do. A `*(nom + décalage)` carries four more,
  // and replaces ADDRESS_NOT_CHECKED with the more precise bounds statement.
  const dereferenced = firstNodeRange(parameters, 'dereference', 'operatorRange');
  const offset = firstNodeRange(parameters, 'pointer-sum', 'operatorRange');
  if (dereferenced) {
    entries.push({ code: 'DEREFERENCE_MEANING', severity: 'information', range: { ...dereferenced },
      message: POINTER_MESSAGES.DEREFERENCE_MEANING });
    if (!offset) {
      entries.push({ code: 'ADDRESS_NOT_CHECKED', severity: 'information', range: { ...dereferenced },
        message: POINTER_MESSAGES.ADDRESS_NOT_CHECKED });
    }
  }
  if (offset) {
    for (const code of ['ARRAY_POINTER_EQUIVALENCE', 'POINTER_ARITHMETIC_LIMITS',
      'OUT_OF_BOUNDS_UNDEFINED', 'OFFSET_TYPE_NOT_CHECKED'] as const) {
      entries.push({ code, severity: 'information', range: { ...offset }, message: POINTER_MESSAGES[code] });
    }
  }
  const addressed = firstNodeRange(parameters, 'address', 'operatorRange');
  if (addressed) {
    entries.push({ code: 'ADDRESS_OF', severity: 'information', range: { ...addressed },
      message: POINTER_MESSAGES.ADDRESS_OF });
  }
  // A character constant written inside an expression carries the same fact
  // as one written in a dedicated envelope: its type is int.
  // Member access written inside an expression carries the same two facts.
  const accessed = firstNodeRange(parameters, 'member', 'operatorRange');
  if (accessed) {
    entries.push({ code: 'MEMBER_ACCESS_FORM', severity: 'information', range: { ...accessed }, message: STRUCT_MESSAGES.MEMBER_ACCESS_FORM });
    entries.push({ code: 'MEMBER_NOT_CHECKED', severity: 'information', range: { ...accessed }, message: STRUCT_MESSAGES.MEMBER_NOT_CHECKED });
  }
  const character = firstCharacterRange(result.instruction.parameters);
  if (character) {
    entries.push({ code: 'CHARACTER_IS_INTEGER', severity: 'information', range: { ...character },
      message: 'En C17, une constante caractère comme celle-ci a le type int, pas char : sa valeur est le code du '
        + 'caractère dans le jeu d’exécution, que le standard ne fixe pas. Aucune valeur n’est calculée ici.' });
  }
  return [...entries, ...explainStructure(result)];
}

function explainStructure(result: TranslationResult): PedagogicalInformation[] {
  const entries: PedagogicalInformation[] = [];
  if (result.status !== 'translated') return entries;
  const instruction = result.instruction;
  if (instruction.kind === 'FUNC_DEF') {
    const scope: PedagogicalInformation = { code: 'FUNCTION_SCOPE', severity: 'information',
      range: { ...instruction.parameters.nameRange },
      message: 'Le corps est créé vide : aucun return n’y est ajouté. Les variables qui y seront déclarées '
        + 'n’existeront que pendant une exécution de cette fonction. Aucune portée n’est vérifiée.' };
    if (!instruction.parameters.params.length) return [scope];
    return [scope, { code: 'PARAMETERS_BY_VALUE', severity: 'information', range: { ...instruction.parameters.nameRange },
      message: 'En C, un paramètre reçoit une copie de la valeur passée à l’appel : le modifier dans le corps '
        + 'ne modifie pas la variable de l’appelant. Aucun type d’argument n’est vérifié.' }];
  }
  // The three sides of the same fact: the constant, the variable that stores
  // it, and the format that reads it back. None of them computes a value.
  if (instruction.kind === 'INIT_CHAR' || instruction.kind === 'ASSIGN_CHAR') {
    return [{ code: 'CHARACTER_IS_INTEGER', severity: 'information', range: { ...instruction.parameters.literalRange },
      message: 'En C17, une constante caractère comme celle-ci a le type int, pas char : sa valeur est le code du '
        + 'caractère dans le jeu d’exécution, que le standard ne fixe pas. Aucune valeur n’est calculée ici.' }];
  }
  if (instruction.kind === 'DECL_CHAR') {
    return [{ code: 'CHARACTER_STORAGE', severity: 'information', range: { ...instruction.parameters.nameRange },
      message: 'Une variable char occupe exactement un octet et contient un code numérique, pas un symbole. '
        + 'C17 laisse à l’implémentation le soin de dire si ce type est signé. Aucune valeur initiale n’est écrite ici.' }];
  }
  if (instruction.kind === 'PRINT_CHAR') {
    return [{ code: 'CHARACTER_FORMAT', severity: 'information', range: { ...instruction.parameters.nameRange },
      message: '%c affiche le caractère correspondant au code stocké ; %d afficherait ce même code en décimal. '
        + 'C-A ne vérifie ni que cette variable existe, ni qu’elle est de type char.' }];
  }
  if (instruction.kind === 'CALL' || instruction.kind === 'CALL_ASSIGN') {
    return [{ code: 'CALL_NOT_RESOLVED', severity: 'information', range: { ...instruction.parameters.nameRange },
      message: 'Les arguments sont évalués avant l’entrée dans la fonction, dans un ordre non spécifié par C17. '
        + 'C-A ne recherche ni la déclaration de cette fonction, ni son nombre de paramètres, ni leurs types.' }];
  }
  if (instruction.kind === 'RETURN' || instruction.kind === 'RETURN_INT'
    || instruction.kind === 'RETURN_EXPRESSION' || instruction.kind === 'RETURN_NUMERIC') {
    return [{ code: 'RETURN_ENDS_FUNCTION', severity: 'information', range: { ...instruction.parameters.keywordRange },
      message: 'return termine immédiatement l’exécution de la fonction et rend la main à l’appelant ; '
        + 'les instructions suivantes de son corps ne sont pas exécutées. Aucune accessibilité n’est analysée.' }];
  }
  const condition = instructionCondition(result.instruction);
  if (!condition) return entries;
  const moment = MOMENT[result.instruction.kind];
  const envelope: PedagogicalInformation[] = moment
    ? [{ code: moment.code, severity: 'information', range: { ...condition.range }, message: moment.message }]
    : [];
  const stack: Condition[] = [condition];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.kind === 'logical-binary') {
      stack.push(node.right, node.left);
      entries.push({ code: node.operator === '&&' ? 'SHORT_CIRCUIT_AND' : 'SHORT_CIRCUIT_OR', severity: 'information',
        range: { ...node.operatorRange }, message: node.operator === '&&'
          ? '&& : la droite est évaluée seulement si la gauche est non nulle. Cela ne garantit pas la sûreté générale.'
          : '|| : la droite est évaluée seulement si la gauche est nulle. Cela ne garantit pas la sûreté générale.' });
    } else if (node.kind === 'logical-not') {
      stack.push(node.operand);
      entries.push({ code: 'LOGICAL_NOT', severity: 'information', range: { ...node.operatorRange },
        message: '! : inversion de la valeur logique ; zéro devient 1, non-zéro devient 0. Aucune garantie de sûreté.' });
    } else if (node.kind === 'comparison') {
      for (const value of [node.right, node.left]) if (value.kind === 'logical-not') stack.push(value);
    }
  }
  // The envelope-level explanation comes first; operator entries stay ordered
  // by position, as the historical IF/ELSE_IF output already is.
  return [...envelope, ...entries.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end)];
}
