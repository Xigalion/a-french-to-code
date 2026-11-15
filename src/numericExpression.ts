import type { Diagnostic, SourceRange } from './translate.ts';
import { INDEX_CAPABILITIES, NUMERIC_CAPABILITIES, parseCore } from './expressionCore.ts';
import type { CoreNameValidator, Token } from './expressionCore.ts';

export type NumericType = 'int' | 'unsigned int' | 'float' | 'double' | 'char';
export type NumericExpression =
  | { kind: 'literal'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'character'; value: string; range: SourceRange }
  | { kind: 'address'; operand: NumericName | IndexedElement; range: SourceRange; operatorRange: SourceRange }
  | { kind: 'dereference'; operand: NumericName | PointerSum; range: SourceRange; operatorRange: SourceRange }
  | { kind: 'pointer-sum'; pointer: NumericName; offset: NumericExpression; range: SourceRange; operatorRange: SourceRange }
  | MemberAccess
  /** Only a name is indexable, which is why `array` is not the whole union. */
  | { kind: 'index'; array: NumericName; index: NumericExpression; range: SourceRange; bracketRange: SourceRange }
  | { kind: 'negation'; operand: NumericExpression; range: SourceRange }
  | { kind: 'cast'; type: NumericType; operand: NumericExpression; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: NumericExpression; right: NumericExpression; range: SourceRange };

export type NumericName = { kind: 'name'; name: string; range: SourceRange };
export type PointerSum = Extract<NumericExpression, { kind: 'pointer-sum' }>;
export type MemberAccess = { kind: 'member'; object: NumericName | IndexedElement | MemberAccess;
  member: string; arrow: boolean; range: SourceRange; operatorRange: SourceRange };
export type IndexedElement = Extract<NumericExpression, { kind: 'index' }>;
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

/** Subscript grammar alone, for an envelope that designates an element
 * outside any enclosing expression. Integer-only, as C17 requires. */
export function parseIndexExpression(source: string, start: number, end: number, validateName: NameValidator,
  missingIndexMessage = 'Il manque l’indice de l’élément.', budget: { count: number } = { count: 0 }): NumericExpressionResult {
  const result = parseCore(source, start, end, validateName, INDEX_CAPABILITIES, missingIndexMessage, budget);
  if (result.status === 'rejected') return result;
  return { status: 'parsed', expression: result.node as unknown as NumericExpression };
}

export function renderNumericExpression(expression: NumericExpression): string {
  switch (expression.kind) {
    case 'literal': return expression.value;
    case 'name': return expression.name;
    // The spelling the student wrote, never its numeric code.
    case 'character': return expression.value;
    // Parenthesized like the negation since lot 6: the priority the student
    // reads is the priority that applies, so `*p + 1` can never be `*(p + 1)`.
    case 'address': return `(&${renderNumericExpression(expression.operand)})`;
    case 'dereference': return expression.operand.kind === 'name'
      ? `(*${expression.operand.name})` : `(*${renderNumericExpression(expression.operand)})`;
    // Written exactly as the student wrote it: no access is ever rewritten
    // from one form into the other.
    case 'member': return renderNumericExpression(expression.object) + (expression.arrow ? '->' : '.') + expression.member;
    case 'pointer-sum': return `(${expression.pointer.name} + ${renderNumericExpression(expression.offset)})`;
    // No parentheses: `t[i]` is already a postfix designation in C17.
    case 'index': return `${expression.array.name}[${renderNumericExpression(expression.index)}]`;
    case 'negation': return `(-${renderNumericExpression(expression.operand)})`;
    case 'cast': return `((${expression.type}) ${renderNumericExpression(expression.operand)})`;
    case 'binary': return `(${renderNumericExpression(expression.left)} ${expression.operator} ${renderNumericExpression(expression.right)})`;
  }
}
