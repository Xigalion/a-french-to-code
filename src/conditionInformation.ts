import type { Condition } from './condition.ts';
import type { SourceRange, TranslationResult } from './translate.ts';

export type ConditionInformation = {
  code: 'SHORT_CIRCUIT_AND' | 'SHORT_CIRCUIT_OR' | 'LOGICAL_NOT';
  severity: 'information';
  range: SourceRange;
  message: string;
};

/** Structural explanations, never a safety or reachability analysis. */
export function explainConditions(result: TranslationResult): ConditionInformation[] {
  const entries: ConditionInformation[] = [];
  if (result.status !== 'translated' || (result.instruction.kind !== 'IF' && result.instruction.kind !== 'ELSE_IF')) return entries;
  const stack: Condition[] = [result.instruction.parameters.condition];
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
  return entries.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end);
}
