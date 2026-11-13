import type { Condition } from './condition.ts';
import type { SourceRange, TranslationResult } from './translate.ts';
import { instructionCondition } from './translate.ts';

export type PedagogicalInformation = {
  code: 'SHORT_CIRCUIT_AND' | 'SHORT_CIRCUIT_OR' | 'LOGICAL_NOT'
    | 'WHILE_PRETEST' | 'DO_WHILE_POSTTEST' | 'FOR_CLAUSE_ORDER'
    | 'FUNCTION_SCOPE' | 'RETURN_ENDS_FUNCTION' | 'PARAMETERS_BY_VALUE' | 'CALL_NOT_RESOLVED'
    | 'CHARACTER_IS_INTEGER' | 'CHARACTER_STORAGE' | 'CHARACTER_FORMAT'
    | 'INDEX_NOT_CHECKED' | 'ARRAY_NOT_ASSIGNABLE' | 'CHAR_ARRAY_NOT_STRING';
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

export function explainInstruction(result: TranslationResult): PedagogicalInformation[] {
  if (result.status !== 'translated') return [];
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
  const bracket = firstIndexRange(result.instruction.parameters);
  if (!bracket) return explainStructure(result);
  return [{ code: 'INDEX_NOT_CHECKED', severity: 'information', range: { ...bracket },
    message: 'C-A ne vérifie pas les bornes de ce tableau : ni sa dimension, ni la valeur de cet indice ne sont '
      + 'connues ici. En C17, lire ou écrire hors des bornes a un comportement indéfini, et rien ne le signale à '
      + 'l’exécution. Aucun dépassement n’est ici détecté ni exclu.' }, ...explainStructure(result)];
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
