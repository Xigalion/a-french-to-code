import type { Diagnostic, SourceRange } from './translate.ts';

export const MAX_EXPRESSION_TOKENS = 1024;
export const MAX_EXPRESSION_DEPTH = 64;

export type Expression =
  | { kind: 'integer'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'negation'; operand: Expression; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: Expression; right: Expression; range: SourceRange };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
export type ExpressionResult = { status: 'parsed'; expression: Expression } | { status: 'rejected'; diagnostic: Diagnostic };

/** Pure, bounded syntax analysis. Offsets are absolute UTF-16 source positions. */
export function parseExpression(source: string, start: number, end: number, validateName: NameValidator): ExpressionResult {
  let position = start;
  let count = 0;
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
    if (unsupported) position += unsupported[0].length;
    else if (/[()+\-*/%]/u.test(source.charAt(position))) position++;
    else {
      // Keep malformed numeric/name tokens whole, including astral characters.
      while (position < end && !/[ \t()+\-*/%=<>!&|^~?:,;[\]{}"\\]/u.test(source.charAt(position))) position++;
      if (position === beginning) position += source.codePointAt(position)! > 0xffff ? 2 : 1;
    }
    const token = { text: source.slice(beginning, position), range: { start: beginning, end: position } };
    if (++count > MAX_EXPRESSION_TOKENS) return tooComplex(token);
    if (unsupported) return fail('UNSUPPORTED_EXPRESSION_OPERATOR', 'Cet opérateur n’est pas pris en charge.', token.range);
    cached = token;
    return token;
  }
  function take(): Token | undefined {
    const token = peek();
    cached = undefined;
    return token;
  }
  function unary(depth: number): Expression | undefined {
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
      const inner = sum(depth + 1);
      if (!inner) return undefined;
      const closing = peek();
      if (diagnostic) return undefined;
      if (!closing) return fail('MISSING_CLOSING_PARENTHESIS', 'Il manque une parenthèse fermante.', { start: end, end });
      if (closing.text !== ')') return missingOperator(closing);
      take();
      return { ...inner, range: { start: token.range.start, end: closing.range.end } };
    }
    if (/^(?:0|[1-9][0-9]*)$/u.test(token.text)) return { kind: 'integer', value: token.text, range: token.range };
    if (/^[\p{L}_]/u.test(token.text)) {
      diagnostic = validateName(token);
      return diagnostic ? undefined : { kind: 'name', name: token.text, range: token.range };
    }
    return fail('INVALID_EXPRESSION_TOKEN', 'Cet élément n’appartient pas à une expression entière prise en charge.', token.range);
  }
  function product(depth: number): Expression | undefined {
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
  function sum(depth: number): Expression | undefined {
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
    if (!/^(?:[A-Za-z_0-9]|\()/u.test(token.text)) return fail('INVALID_EXPRESSION_TOKEN',
      'Cet élément n’appartient pas à une expression entière prise en charge.', token.range);
    return fail('MISSING_OPERATOR', 'Il manque un opérateur.', { start: token.range.start, end: token.range.start });
  }

  const first = peek();
  if (!first && !diagnostic) fail('MISSING_EXPRESSION', 'Il manque l’expression à calculer.', { start: end, end });
  const expression = diagnostic ? undefined : sum(0);
  const extra = diagnostic ? undefined : peek();
  if (extra) {
    if (extra.text === ')') fail('UNEXPECTED_CLOSING_PARENTHESIS', 'Cette parenthèse fermante n’a pas de parenthèse ouvrante.', extra.range);
    else missingOperator(extra);
  }
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!expression) throw new Error('Invariant interne : expression analysée absente.');
  return { status: 'parsed', expression };
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
