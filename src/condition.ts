import type { Diagnostic, SourceRange } from './translate.ts';
import { CONDITION_CAPABILITIES, asCondition, parseCore } from './expressionCore.ts';
import type { CoreNameValidator } from './expressionCore.ts';

import { renderNumericExpression } from './numericExpression.ts';
import type { NumericExpression } from './numericExpression.ts';
export type { ComparisonOperator } from './expressionCore.ts';
import type { ComparisonOperator } from './expressionCore.ts';
export type Condition =
  | { kind: 'numeric-test'; expression: NumericExpression; range: SourceRange }
  | { kind: 'comparison'; operator: ComparisonOperator; left: ConditionValue; right: ConditionValue; range: SourceRange }
  | { kind: 'logical-not'; operand: Condition; range: SourceRange; operatorRange: SourceRange }
  | { kind: 'logical-binary'; operator: '&&' | '||'; left: Condition; right: Condition; range: SourceRange; operatorRange: SourceRange };
type ConditionValue = NumericExpression | Extract<Condition, { kind: 'logical-not' }>;
export type NameValidator = CoreNameValidator;
export type ConditionResult = { status: 'parsed'; condition: Condition } | { status: 'rejected'; diagnostic: Diagnostic };

/** Condition profile of the shared core: numeric literals, casts and logic.
 * Only the empty-condition wording varies per envelope: the grammar, budgets,
 * codes and ranges are identical for every intent that reuses this profile.
 */
export function parseCondition(source: string, start: number, end: number, validateName: NameValidator,
  missingConditionMessage = 'Il manque la condition du bloc.', budget: { count: number } = { count: 0 }): ConditionResult {
  const result = parseCore(source, start, end, validateName, CONDITION_CAPABILITIES, missingConditionMessage, budget);
  if (result.status === 'rejected') return result;
  return { status: 'parsed', condition: asCondition(result.node) as unknown as Condition };
}

export function renderCondition(condition: Condition): string {
  switch (condition.kind) {
    case 'numeric-test': return renderNumericExpression(condition.expression);
    case 'comparison': return renderValue(condition.left) + ' ' + condition.operator + ' ' + renderValue(condition.right);
    case 'logical-not': return `(!${logicalOperand(condition.operand)})`;
    case 'logical-binary': return `(${logicalOperand(condition.left)} ${condition.operator} ${logicalOperand(condition.right)})`;
  }
}

function renderValue(value: ConditionValue): string {
  return value.kind === 'logical-not' ? renderCondition(value) : renderNumericExpression(value);
}
function logicalOperand(value: Condition): string {
  const text = renderCondition(value);
  return value.kind === 'comparison' ? `(${text})` : text;
}

/** Numeric trees only; logic controls neither suppression nor evaluation. */
export function conditionNumericRoots(condition: Condition): NumericExpression[] {
  const roots: NumericExpression[] = [];
  const stack: (Condition | NumericExpression)[] = [condition];
  while (stack.length) {
    const node = stack.pop()!;
    if (node.kind === 'numeric-test') stack.push(node.expression);
    else if (node.kind === 'logical-not') stack.push(node.operand);
    else if (node.kind === 'comparison' || node.kind === 'logical-binary') stack.push(node.right, node.left);
    else roots.push(node);
  }
  return roots;
}
