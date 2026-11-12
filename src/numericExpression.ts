import type { Diagnostic, SourceRange } from './translate.ts';
import { MAX_EXPRESSION_DEPTH, MAX_EXPRESSION_TOKENS } from './expression.ts';

export type NumericType = 'int' | 'unsigned int' | 'float' | 'double';
export type NumericExpression =
  | { kind: 'literal'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'negation'; operand: NumericExpression; range: SourceRange }
  | { kind: 'cast'; type: NumericType; operand: NumericExpression; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: NumericExpression; right: NumericExpression; range: SourceRange };

type Token = { text: string; range: SourceRange };
export type NameValidator = (token: Token) => Diagnostic | undefined;
export type NumericExpressionResult = { status: 'parsed'; expression: NumericExpression } | { status: 'rejected'; diagnostic: Diagnostic };
const CAST_WORDS = new Set(['int', 'unsigned', 'float', 'double', 'signed', 'short', 'long', 'char', 'void', '_Bool', '_Complex', '_Imaginary', '_Atomic', 'const', 'volatile', 'restrict']);

/** Independent syntax profile: never changes the integer parser or evaluates values.
 * `budget` lets several sibling expressions of one instruction share a single
 * token allowance, so a multi-clause envelope cannot reset the global limit.
 */
export function parseNumericExpression(source: string, start: number, end: number, validateName: NameValidator,
  missingExpressionMessage = 'Il manque l’expression à calculer.', budget: { count: number } = { count: 0 }): NumericExpressionResult {
  let position = start;
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
    if (unsupported && !numeric) return fail('UNSUPPORTED_EXPRESSION_OPERATOR', 'Cet opérateur n’est pas pris en charge.', token.range);
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
    const operand = unary(depth + 1);
    return operand && { kind: 'cast', type: typeText as NumericType, operand, range: { start: opening.range.start, end: operand.range.end } };
  }
  function unary(depth: number): NumericExpression | undefined {
    const token = peek();
    if (diagnostic) return undefined;
    if (!token || ['+', '*', '/', '%', ')'].includes(token.text)) {
      const at = token?.range.start ?? end;
      return fail('MISSING_OPERAND', 'Il manque un opérande.', { start: at, end: at });
    }
    take();
    if (token.text === '-' || token.text === '(') {
      if (depth === MAX_EXPRESSION_DEPTH) return tooComplex(token);
      if (token.text === '-') {
        const operand = unary(depth + 1);
        return operand && { kind: 'negation', operand, range: { start: token.range.start, end: operand.range.end } };
      }
      const next = peek();
      if (diagnostic) return undefined;
      if (next && CAST_WORDS.has(next.text)) return cast(token, depth);
      const inner = sum(depth + 1);
      if (!inner) return undefined;
      const closing = peek();
      if (diagnostic) return undefined;
      if (!closing) return fail('MISSING_CLOSING_PARENTHESIS', 'Il manque une parenthèse fermante.', { start: end, end });
      if (closing.text !== ')') return missingOperator(closing);
      take();
      return { ...inner, range: { start: token.range.start, end: closing.range.end } };
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
  function product(depth: number): NumericExpression | undefined {
    let left = unary(depth);
    while (left && !diagnostic) {
      const operator = peek()?.text;
      if (operator !== '*' && operator !== '/' && operator !== '%') break;
      take();
      const right = unary(depth);
      if (!right) return undefined;
      left = { kind: 'binary', operator, left, right, range: { start: left.range.start, end: right.range.end } };
    }
    return left;
  }
  function sum(depth: number): NumericExpression | undefined {
    let left = product(depth);
    while (left && !diagnostic) {
      const operator = peek()?.text;
      if (operator !== '+' && operator !== '-') break;
      take();
      const right = product(depth);
      if (!right) return undefined;
      left = { kind: 'binary', operator, left, right, range: { start: left.range.start, end: right.range.end } };
    }
    return left;
  }
  function missingOperator(token: Token): undefined {
    if (!/^(?:[A-Za-z_0-9.]|\()/u.test(token.text)) return fail('INVALID_EXPRESSION_TOKEN',
      'Cet élément n’appartient pas à une expression numérique prise en charge.', token.range);
    return fail('MISSING_OPERATOR', 'Il manque un opérateur.', { start: token.range.start, end: token.range.start });
  }

  const first = peek();
  if (!first && !diagnostic) fail('MISSING_EXPRESSION', missingExpressionMessage, { start: end, end });
  const expression = diagnostic ? undefined : sum(0);
  const extra = diagnostic ? undefined : peek();
  if (extra) {
    if (extra.text === ')') fail('UNEXPECTED_CLOSING_PARENTHESIS', 'Cette parenthèse fermante n’a pas de parenthèse ouvrante.', extra.range);
    else missingOperator(extra);
  }
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!expression) throw new Error('Invariant interne : expression numérique analysée absente.');
  return { status: 'parsed', expression };
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
