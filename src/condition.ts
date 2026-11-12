import type { Diagnostic, SourceRange } from './translate.ts';
import { MAX_EXPRESSION_DEPTH, MAX_EXPRESSION_TOKENS } from './expression.ts';

import { renderNumericExpression } from './numericExpression.ts';
import type { NumericExpression, NumericType } from './numericExpression.ts';
export type ComparisonOperator = '==' | '!=' | '<' | '>' | '<=' | '>=';
export type Condition =
  | { kind: 'numeric-test'; expression: NumericExpression; range: SourceRange }
  | { kind: 'comparison'; operator: ComparisonOperator; left: ConditionValue; right: ConditionValue; range: SourceRange }
  | { kind: 'logical-not'; operand: Condition; range: SourceRange; operatorRange: SourceRange }
  | { kind: 'logical-binary'; operator: '&&' | '||'; left: Condition; right: Condition; range: SourceRange; operatorRange: SourceRange };
type ConditionValue = NumericExpression | Extract<Condition, { kind: 'logical-not' }>;
type Comparison = Extract<Condition, { kind: 'comparison' }>;
type Node = NumericExpression | Exclude<Condition, { kind: 'numeric-test' }>;
type Token = { text: string; range: SourceRange };
export type NameValidator = (token: Token) => Diagnostic | undefined;
export type ConditionResult = { status: 'parsed'; condition: Condition } | { status: 'rejected'; diagnostic: Diagnostic };
const CAST_WORDS = new Set(['int', 'unsigned', 'float', 'double', 'signed', 'short', 'long', 'char', 'void', '_Bool', '_Complex', '_Imaginary', '_Atomic', 'const', 'volatile', 'restrict']);

/** Dedicated bounded condition profile; historical numeric and integer parsers stay unchanged.
 * Only the empty-condition wording varies per envelope: the grammar, budgets,
 * codes and ranges are identical for every intent that reuses this profile.
 */
export function parseCondition(source: string, start: number, end: number, validateName: NameValidator,
  missingConditionMessage = 'Il manque la condition du bloc.', budget: { count: number } = { count: 0 }): ConditionResult {
  let position = start;
  const comparisonRanges = new Map<Node, SourceRange>();
  let cached: Token | undefined;
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  function tooComplex(token: Token): undefined {
    return fail('EXPRESSION_TOO_COMPLEX', 'Cette expression dépasse les limites de complexité prises en charge.', token.range);
  }
  function peek(): Token | undefined {
    if (cached || diagnostic) return cached;
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return undefined;
    const beginning = position;
    const unsupported = /^(?:>>=|<<=|->|\+\+|--|\*\*|\/\/|\/\*|\*\/|\+=|-=|\*=|\/=|%=|==|!=|<=|>=|&&|\|\||<<|>>|&=|\|=|\^=|[=<>!&|^~?:])/u.exec(source.slice(position, end));
    const numeric = /[0-9.]/u.test(source.charAt(position));
    if (numeric) {
      // Signs belong to a numeric token only immediately after an exponent marker.
      while (position < end) {
        const char = source.charAt(position);
        if ((char === '+' || char === '-') && /[eE]/u.test(source.charAt(position - 1))) { position++; continue; }
        if (/[ \t()+\-*/%=<>!&|^~?:;[\]{}"\\]/u.test(char)) break;
        position++;
      }
    } else if (unsupported) position += unsupported[0].length;
    else if (/[()+\-*/%]/u.test(source.charAt(position))) position++;
    else {
      while (position < end && !/[ \t()+\-*/%=<>!&|^~?:,;[\]{}"\\]/u.test(source.charAt(position))) position++;
      if (position === beginning) position += source.codePointAt(position)! > 0xffff ? 2 : 1;
    }
    const token = { text: source.slice(beginning, position), range: { start: beginning, end: position } };
    if (++budget.count > MAX_EXPRESSION_TOKENS) return tooComplex(token);
    if (unsupported && !numeric && !isComparison(token.text) && !['&&', '||', '!'].includes(token.text)) {
      return fail(token.text === '=' ? 'ASSIGNMENT_IN_CONDITION' : 'UNSUPPORTED_CONDITION_OPERATOR',
        token.text === '=' ? 'L’opérateur = effectue une affectation ; aucune affectation n’est prise en charge dans cette condition.'
          : 'Cet opérateur n’est pas pris en charge dans les conditions du lot 9.', token.range);
    }
    cached = token;
    return token;
  }
  function take(): Token | undefined {
    const token = peek();
    cached = undefined;
    return token;
  }
  function cast(opening: Token, depth: number): NumericExpression | undefined {
    const first = take()!;
    let last = first;
    let typeText = first.text;
    // Consume compound type designations, but not the operand of a missing ')'.
    while (peek() && CAST_WORDS.has(peek()!.text)) {
      last = take()!;
      typeText += ' ' + last.text;
    }
    if (diagnostic) return undefined;
    if (!['int', 'unsigned int', 'float', 'double'].includes(typeText)) return fail('UNSUPPORTED_NUMERIC_TYPE',
      'Ce type numérique n’est pas pris en charge.', { start: first.range.start, end: last.range.end });
    const closing = peek();
    if (diagnostic) return undefined;
    if (closing?.text !== ')') {
      const at = closing?.range.start ?? end;
      return fail('MISSING_CAST_CLOSING_PARENTHESIS', 'Il manque la parenthèse fermante du type de conversion.', { start: at, end: at });
    }
    take();
    const operand = asNumeric(unary(depth + 1));
    return operand && { kind: 'cast', type: typeText as NumericType, operand, range: { start: opening.range.start, end: operand.range.end } };
  }
  function unary(depth: number): Node | undefined {
    const token = peek();
    if (diagnostic) return undefined;
    if (!token || ['+', '*', '/', '%', ')', '&&', '||'].includes(token.text) || (token !== undefined && isComparison(token.text))) {
      const at = token?.range.start ?? end;
      return fail('MISSING_OPERAND', 'Il manque un opérande.', { start: at, end: at });
    }
    take();
    if (token.text === '-' || token.text === '(' || token.text === '!') {
      if (depth === MAX_EXPRESSION_DEPTH) return tooComplex(token);
      if (token.text === '!') {
        const operand = unary(depth + 1);
        return operand && { kind: 'logical-not', operand: asCondition(operand), operatorRange: token.range,
          range: { start: token.range.start, end: operand.range.end } };
      }
      if (token.text === '-') {
        const operand = asNumeric(unary(depth + 1));
        return operand && { kind: 'negation', operand, range: { start: token.range.start, end: operand.range.end } };
      }
      const next = peek();
      if (diagnostic) return undefined;
      if (next && CAST_WORDS.has(next.text)) return cast(token, depth);
      const inner = logicalOr(depth + 1);
      if (!inner) return undefined;
      const closing = peek();
      if (diagnostic) return undefined;
      if (!closing) return fail('MISSING_CLOSING_PARENTHESIS', 'Il manque une parenthèse fermante.', { start: end, end });
      if (closing.text !== ')') return missingOperator(closing);
      take();
      const grouped = { ...inner, range: { start: token.range.start, end: closing.range.end } };
      const operatorRange = comparisonRanges.get(inner);
      if (operatorRange) comparisonRanges.set(grouped, operatorRange);
      return grouped;
    }
    if (/^[0-9.]/u.test(token.text)) {
      if (/^(?:0|[1-9][0-9]*)[uU]?$/u.test(token.text)
        || /^(?:(?:[0-9]+\.[0-9]*|\.[0-9]+)(?:[eE][+-]?[0-9]+)?|[0-9]+[eE][+-]?[0-9]+)[fF]?$/u.test(token.text)) {
        return { kind: 'literal', value: token.text, range: token.range };
      }
      if (/^(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)[eE][+-]?$/u.test(token.text)) return fail('INCOMPLETE_NUMERIC_LITERAL',
        'Il manque l’exposant du littéral numérique.', { start: token.range.end, end: token.range.end });
      return fail('UNSUPPORTED_NUMERIC_LITERAL', 'Cette écriture de littéral numérique n’est pas prise en charge.', token.range);
    }
    if (/^[\p{L}_]/u.test(token.text)) {
      diagnostic = validateName(token);
      return diagnostic ? undefined : { kind: 'name', name: token.text, range: token.range };
    }
    return fail('INVALID_EXPRESSION_TOKEN', 'Cet élément n’appartient pas à une expression numérique prise en charge.', token.range);
  }
  function product(depth: number): Node | undefined {
    let left = unary(depth);
    while (left && !diagnostic) {
      const operator = peek()?.text;
      if (operator !== '*' && operator !== '/' && operator !== '%') break;
      take();
      const right = asNumeric(unary(depth));
      left = asNumeric(left);
      if (!left || !right) return undefined;
      left = { kind: 'binary', operator, left, right, range: { start: left.range.start, end: right.range.end } };
    }
    return left;
  }
  function sum(depth: number): Node | undefined {
    let left = product(depth);
    while (left && !diagnostic) {
      const operator = peek()?.text;
      if (operator !== '+' && operator !== '-') break;
      take();
      const right = asNumeric(product(depth));
      left = asNumeric(left);
      if (!left || !right) return undefined;
      left = { kind: 'binary', operator, left, right, range: { start: left.range.start, end: right.range.end } };
    }
    return left;
  }
  function missingOperator(token: Token): undefined {
    if (isComparison(token.text)) return fail('CHAINED_COMPARISON', 'Les comparaisons chaînées ne sont pas prises en charge.', token.range);
    if (!/^(?:[A-Za-z_0-9.]|\()/u.test(token.text)) return fail('INVALID_EXPRESSION_TOKEN',
      'Cet élément n’appartient pas à une expression numérique prise en charge.', token.range);
    return fail('MISSING_OPERATOR', 'Il manque un opérateur.', { start: token.range.start, end: token.range.start });
  }

  function asNumeric(node: Node | undefined): NumericExpression | undefined {
    if (node && ['comparison', 'logical-not', 'logical-binary'].includes(node.kind)) {
      fail('CONDITION_FORM_NOT_SUPPORTED', 'Ce résultat logique ou comparatif ne peut pas servir d’opérande numérique dans ce lot.', node.range);
      return undefined;
    }
    return node as NumericExpression | undefined;
  }
  function asComparable(node: Node | undefined, operatorRange?: SourceRange): ConditionValue | undefined {
    if (node?.kind === 'comparison') {
      fail('CHAINED_COMPARISON', 'Les comparaisons chaînées ne sont pas prises en charge.', operatorRange ?? comparisonRanges.get(node) ?? node.range);
      return undefined;
    }
    if (node?.kind === 'logical-binary') {
      fail('CONDITION_FORM_NOT_SUPPORTED', 'Ce résultat logique ne peut pas être directement comparé dans ce lot.', node.range);
      return undefined;
    }
    return node;
  }
  function comparison(depth: number): Node | undefined {
    const left = sum(depth);
    const token = peek();
    if (!left || !token || !isComparison(token.text) || diagnostic) return left;
    take();
    const numericLeft = asComparable(left, token.range);
    const right = asComparable(sum(depth));
    if (!numericLeft || !right) return undefined;
    const result: Comparison = { kind: 'comparison', operator: token.text, left: numericLeft, right,
      range: { start: numericLeft.range.start, end: right.range.end } };
    comparisonRanges.set(result, token.range);
    return result;
  }
  function logicalAnd(depth: number): Node | undefined {
    return logical(depth, '&&', comparison);
  }
  function logicalOr(depth: number): Node | undefined {
    return logical(depth, '||', logicalAnd);
  }
  function logical(depth: number, operator: '&&' | '||', next: (depth: number) => Node | undefined): Node | undefined {
    let left = next(depth);
    while (left && !diagnostic && peek()?.text === operator) {
      const token = take()!;
      const right = next(depth);
      if (!right) return undefined;
      left = { kind: 'logical-binary', operator, left: asCondition(left), right: asCondition(right),
        operatorRange: token.range, range: { start: left.range.start, end: right.range.end } };
    }
    return left;
  }
  const first = peek();
  if (!first && !diagnostic) fail('MISSING_CONDITION', missingConditionMessage, { start: end, end });
  const expression = diagnostic ? undefined : logicalOr(0);
  const extra = diagnostic ? undefined : peek();
  if (extra) {
    if (isComparison(extra.text)) fail('CHAINED_COMPARISON', 'Les comparaisons chaînées ne sont pas prises en charge.', extra.range);
    else if (extra.text === ')') fail('UNEXPECTED_CLOSING_PARENTHESIS', 'Cette parenthèse fermante n’a pas de parenthèse ouvrante.', extra.range);
    else missingOperator(extra);
  }
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!expression) throw new Error('Invariant interne : expression numérique analysée absente.');
  return { status: 'parsed', condition: asCondition(expression) };
}

function asCondition(node: Node): Condition {
  return node.kind === 'comparison' || node.kind === 'logical-not' || node.kind === 'logical-binary' ? node
    : { kind: 'numeric-test', expression: node, range: { ...node.range } };
}

function isComparison(text: string): text is ComparisonOperator {
  return ['==', '!=', '<', '>', '<=', '>='].includes(text);
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
