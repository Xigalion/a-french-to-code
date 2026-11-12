import type { Condition } from './condition.ts';
import type { SourceRange, TranslationResult } from './translate.ts';
import { instructionCondition } from './translate.ts';

export type ConditionInformation = {
  code: 'SHORT_CIRCUIT_AND' | 'SHORT_CIRCUIT_OR' | 'LOGICAL_NOT' | 'WHILE_PRETEST' | 'DO_WHILE_POSTTEST';
  severity: 'information';
  range: SourceRange;
  message: string;
};

/** When each loop form evaluates its condition. Deliberately not a
 * termination, progression or iteration-count claim.
 */
const MOMENT: Readonly<Record<string, { code: ConditionInformation['code']; message: string }>> = {
  WHILE: { code: 'WHILE_PRETEST',
    message: 'La condition est testée avant chaque itération ; le corps peut ne jamais être exécuté. '
      + 'Aucune progression ni terminaison n’est déduite.' },
  DO_WHILE: { code: 'DO_WHILE_POSTTEST',
    message: 'La condition est testée après chaque itération ; si la boucle est atteinte, le corps est exécuté '
      + 'au moins une fois. Aucune progression ni terminaison n’est déduite.' },
};

/** Structural explanations, never a safety or reachability analysis.
 * The loop entries state when the condition is evaluated and stay on the
 * passive information channel: they never become warnings.
 */
export function explainConditions(result: TranslationResult): ConditionInformation[] {
  const entries: ConditionInformation[] = [];
  if (result.status !== 'translated') return entries;
  const condition = instructionCondition(result.instruction);
  if (!condition) return entries;
  const moment = MOMENT[result.instruction.kind];
  const envelope: ConditionInformation[] = moment
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
