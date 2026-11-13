import type { Diagnostic, SourceRange } from './translate.ts';
import { INTEGER_CAPABILITIES, parseCore } from './expressionCore.ts';
import type { CoreNameValidator } from './expressionCore.ts';

export { MAX_EXPRESSION_TOKENS, MAX_EXPRESSION_DEPTH } from './expressionCore.ts';

export type Expression =
  | { kind: 'integer'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'negation'; operand: Expression; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: Expression; right: Expression; range: SourceRange };

type NameValidator = CoreNameValidator;
export type ExpressionResult = { status: 'parsed'; expression: Expression } | { status: 'rejected'; diagnostic: Diagnostic };

/** Pure, bounded syntax analysis. Offsets are absolute UTF-16 source positions.
 * The integer profile declares neither numeric literals, nor casts, nor logic,
 * so the shared core cannot build any node outside `Expression`; the narrowing
 * below is guaranteed by `INTEGER_CAPABILITIES`, not assumed. */
export function parseExpression(source: string, start: number, end: number, validateName: NameValidator): ExpressionResult {
  const result = parseCore(source, start, end, validateName, INTEGER_CAPABILITIES, 'Il manque l’expression à calculer.');
  if (result.status === 'rejected') return result;
  return { status: 'parsed', expression: result.node as unknown as Expression };
}

/** Each operation is parenthesized; no evaluation or constant folding. */
export function renderExpression(expression: Expression): string {
  switch (expression.kind) {
    case 'integer': return expression.value;
    case 'name': return expression.name;
    case 'negation': return `(-${renderExpression(expression.operand)})`;
    case 'binary': return `(${renderExpression(expression.left)} ${expression.operator} ${renderExpression(expression.right)})`;
  }
}
