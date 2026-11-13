import type { Diagnostic, SourceRange } from './translate.ts';
import { NUMERIC_CAPABILITIES, parseCore } from './expressionCore.ts';
import type { CoreNameValidator, Token } from './expressionCore.ts';

export type NumericType = 'int' | 'unsigned int' | 'float' | 'double';
export type NumericExpression =
  | { kind: 'literal'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'negation'; operand: NumericExpression; range: SourceRange }
  | { kind: 'cast'; type: NumericType; operand: NumericExpression; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: NumericExpression; right: NumericExpression; range: SourceRange };

export type NameValidator = CoreNameValidator;
export type NumericExpressionResult = { status: 'parsed'; expression: NumericExpression } | { status: 'rejected'; diagnostic: Diagnostic };
export type { Token };

/** Numeric profile of the shared core: numeric literals and casts, no logic.
 * The core can therefore build no node outside `NumericExpression`.
 * `budget` lets several sibling expressions of one instruction share a single
 * token allowance, so a multi-clause envelope cannot reset the global limit.
 */
export function parseNumericExpression(source: string, start: number, end: number, validateName: NameValidator,
  missingExpressionMessage = 'Il manque l’expression à calculer.', budget: { count: number } = { count: 0 }): NumericExpressionResult {
  const result = parseCore(source, start, end, validateName, NUMERIC_CAPABILITIES, missingExpressionMessage, budget);
  if (result.status === 'rejected') return result;
  return { status: 'parsed', expression: result.node as unknown as NumericExpression };
}

export function renderNumericExpression(expression: NumericExpression): string {
  switch (expression.kind) {
    case 'literal': return expression.value;
    case 'name': return expression.name;
    case 'negation': return `(-${renderNumericExpression(expression.operand)})`;
    case 'cast': return `((${expression.type}) ${renderNumericExpression(expression.operand)})`;
    case 'binary': return `(${renderNumericExpression(expression.left)} ${expression.operator} ${renderNumericExpression(expression.right)})`;
  }
}
