import type { Expression } from './expression.ts';
import type { NumericExpression } from './numericExpression.ts';
import type { SourceRange, TranslationResult } from './translate.ts';
import { instructionCondition } from './translate.ts';
import { conditionNumericRoots } from './condition.ts';

export type CalculationAdvisory = {
  code: 'INTEGER_ZERO_DIVISOR' | 'ZERO_DIVISOR' | 'FLOAT_REMAINDER_OPERAND';
  category: 'calculation';
  severity: 'warning';
  assessment: 'certain-error' | 'possible-risk' | 'undetermined';
  message: string;
  range: SourceRange;
};
export type CalculationReport = { source: { text: string }; advisories: CalculationAdvisory[] };
type Node = Expression | NumericExpression;

// Only parentheses (already represented by ranges) and negations are transparent.
// In particular, casts, names and compound expressions never establish a fact.
function literal(node: Node): { floating: boolean; zero: boolean } | undefined {
  while (node.kind === 'negation') node = node.operand;
  if (node.kind !== 'integer' && node.kind !== 'literal') return undefined;
  const floating = /[.eEfF]/.test(node.value);
  const mantissa = node.value.replace(/[uUfF]$/, '').split(/[eE]/)[0] ?? '';
  return { floating, zero: /^0+$/.test(mantissa.replace(/\./g, '')) };
}

/** Limited local facts, never an evaluator or a guarantee of safe execution.
 * Translation and placement data are neither enriched nor mutated.
 */
export function analyzeCalculations(translation: TranslationResult): CalculationReport {
  const report: CalculationReport = { source: { text: translation.source.text }, advisories: [] };
  if (translation.status !== 'translated') return report;
  const instruction = translation.instruction;
  let stack: Node[];
  const condition = instructionCondition(instruction);
  if (instruction.kind === 'FOR') {
    // All three clauses are inspected, not just the condition.
    stack = [instruction.parameters.update, ...conditionNumericRoots(instruction.parameters.condition).reverse(),
      instruction.parameters.initial];
  } else if (condition) {
    stack = conditionNumericRoots(condition).reverse();
  } else if (instruction.kind === 'CALL' || instruction.kind === 'CALL_ASSIGN') {
    // Every argument is inspected; the final sort puts the advisories back in
    // source order whatever the evaluation order C17 leaves unspecified.
    stack = [...instruction.parameters.args].reverse();
  } else if (instruction.kind === 'ARRAY_ASSIGN_EXPRESSION') {
    stack = [instruction.parameters.expression, instruction.parameters.element];
  } else if (instruction.kind === 'ARRAY_ASSIGN_INT' || instruction.kind === 'ARRAY_ASSIGN_CHAR'
    || instruction.kind === 'ARRAY_PRINT') stack = [instruction.parameters.element];
  else if (instruction.kind === 'RETURN_EXPRESSION' || instruction.kind === 'RETURN_NUMERIC'
    || instruction.kind === 'ASSIGN_EXPRESSION' || instruction.kind === 'NUMERIC_INIT'
    || instruction.kind === 'NUMERIC_ASSIGN') stack = [instruction.parameters.expression];
  else return report;
  while (stack.length) {
    const node = stack.pop();
    if (!node) break;
    if (node.kind === 'negation' || node.kind === 'cast') { stack.push(node.operand); continue; }
    // An index is an ordinary integer expression: a division by zero written
    // inside it is the same local fact as anywhere else.
    if (node.kind === 'index') { stack.push(node.index); continue; }
    if (node.kind !== 'binary') continue;
    stack.push(node.right, node.left);
    if (node.operator !== '/' && node.operator !== '%') continue;
    const left = literal(node.left);
    const right = literal(node.right);
    let advice: Pick<CalculationAdvisory, 'code' | 'assessment' | 'message'>;
    let range = node.right.range;
    if (node.operator === '%' && (left?.floating || right?.floating)) {
      range = left?.floating ? node.left.range : node.right.range;
      advice = { code: 'FLOAT_REMAINDER_OPERAND', assessment: 'certain-error',
        message: 'L’opérateur % exige des opérandes entiers ; cet opérande est flottant.' };
    } else if (right?.zero) {
      if (left && !left.floating && !right.floating) {
        advice = { code: 'INTEGER_ZERO_DIVISOR', assessment: 'certain-error',
          message: 'Le diviseur entier est nul. Si cette opération est exécutée, son comportement est indéfini.' };
      } else if (left?.floating || right.floating) {
        advice = { code: 'ZERO_DIVISOR', assessment: 'possible-risk',
          message: 'Le diviseur est nul. Les garanties de cette division flottante dépendent du profil C17 de l’implémentation.' };
      } else {
        advice = { code: 'ZERO_DIVISOR', assessment: 'undetermined',
          message: 'Le diviseur est nul. Les types réels des opérandes sont nécessaires pour préciser les conséquences.' };
      }
    } else continue;
    report.advisories.push({ ...advice, category: 'calculation', severity: 'warning', range: { ...range } });
  }
  report.advisories.sort((a, b) => a.range.start - b.range.start || a.range.end - b.range.end
    || (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  return report;
}
