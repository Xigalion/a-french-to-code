import type { Diagnostic, SourceRange } from './translate.ts';

export const MAX_EXPRESSION_TOKENS = 1024;
export const MAX_EXPRESSION_DEPTH = 64;

export type CoreNumericType = 'int' | 'unsigned int' | 'float' | 'double';
export type ComparisonOperator = '==' | '!=' | '<' | '>' | '<=' | '>=';

/** Superset of every node the bounded profiles can build. A profile that does
 * not declare a capability can never produce the nodes that capability guards,
 * which is what lets each caller narrow this union to its published type. */
export type CoreNode =
  | { kind: 'integer'; value: string; range: SourceRange }
  | { kind: 'literal'; value: string; range: SourceRange }
  | { kind: 'name'; name: string; range: SourceRange }
  | { kind: 'negation'; operand: CoreNode; range: SourceRange }
  | { kind: 'cast'; type: CoreNumericType; operand: CoreNode; range: SourceRange }
  | { kind: 'binary'; operator: '+' | '-' | '*' | '/' | '%'; left: CoreNode; right: CoreNode; range: SourceRange }
  | { kind: 'numeric-test'; expression: CoreNode; range: SourceRange }
  | { kind: 'comparison'; operator: ComparisonOperator; left: CoreNode; right: CoreNode; range: SourceRange }
  | { kind: 'logical-not'; operand: CoreNode; range: SourceRange; operatorRange: SourceRange }
  | { kind: 'logical-binary'; operator: '&&' | '||'; left: CoreNode; right: CoreNode; range: SourceRange; operatorRange: SourceRange };

export type Token = { text: string; range: SourceRange };
export type CoreNameValidator = (token: Token) => Diagnostic | undefined;
export type CoreResult = { status: 'parsed'; node: CoreNode } | { status: 'rejected'; diagnostic: Diagnostic };

/** Explicit capability record. Every field names one historical difference
 * between the published profiles; nothing is inferred from another field. */
export type ExpressionCapabilities = {
  /** `integer`: the lot 6 grammar. `numeric`: lot 7 literals and tokenizing. */
  readonly literals: 'integer' | 'numeric';
  /** Parenthesized conversions `(type) operand`. */
  readonly casts: boolean;
  /** Comparisons, `!`, `&&`, `||` and their dedicated diagnostics. */
  readonly logic: boolean;
  readonly invalidTokenMessage: string;
  readonly invariantMessage: string;
};

export const INTEGER_CAPABILITIES: ExpressionCapabilities = {
  literals: 'integer',
  casts: false,
  logic: false,
  invalidTokenMessage: 'Cet élément n’appartient pas à une expression entière prise en charge.',
  invariantMessage: 'Invariant interne : expression analysée absente.',
};

export const NUMERIC_CAPABILITIES: ExpressionCapabilities = {
  literals: 'numeric',
  casts: true,
  logic: false,
  invalidTokenMessage: 'Cet élément n’appartient pas à une expression numérique prise en charge.',
  invariantMessage: 'Invariant interne : expression numérique analysée absente.',
};

export const CONDITION_CAPABILITIES: ExpressionCapabilities = {
  literals: 'numeric',
  casts: true,
  logic: true,
  invalidTokenMessage: 'Cet élément n’appartient pas à une expression numérique prise en charge.',
  invariantMessage: 'Invariant interne : expression numérique analysée absente.',
};

const CAST_WORDS = new Set(['int', 'unsigned', 'float', 'double', 'signed', 'short', 'long', 'char', 'void', '_Bool', '_Complex', '_Imaginary', '_Atomic', 'const', 'volatile', 'restrict']);

export function isComparison(text: string): text is ComparisonOperator {
  return ['==', '!=', '<', '>', '<=', '>='].includes(text);
}

/** Pure, bounded syntax analysis shared by every profile. Offsets are absolute
 * UTF-16 source positions. `budget` lets several sibling expressions of one
 * instruction share a single token allowance, so a multi-clause envelope cannot
 * reset the global limit; depth stays per-expression. */
export function parseCore(source: string, start: number, end: number, validateName: CoreNameValidator,
  capabilities: ExpressionCapabilities, missingMessage: string, budget: { count: number } = { count: 0 }): CoreResult {
  let position = start;
  const comparisonRanges = new Map<CoreNode, SourceRange>();
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
    const numeric = capabilities.literals === 'numeric' && /[0-9.]/u.test(source.charAt(position));
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
      // Keep malformed numeric/name tokens whole, including astral characters.
      while (position < end && !/[ \t()+\-*/%=<>!&|^~?:,;[\]{}"\\]/u.test(source.charAt(position))) position++;
      if (position === beginning) position += source.codePointAt(position)! > 0xffff ? 2 : 1;
    }
    const token = { text: source.slice(beginning, position), range: { start: beginning, end: position } };
    if (++budget.count > MAX_EXPRESSION_TOKENS) return tooComplex(token);
    if (unsupported && !numeric) {
      if (!capabilities.logic) return fail('UNSUPPORTED_EXPRESSION_OPERATOR', 'Cet opérateur n’est pas pris en charge.', token.range);
      if (!isComparison(token.text) && !['&&', '||', '!'].includes(token.text)) {
        return fail(token.text === '=' ? 'ASSIGNMENT_IN_CONDITION' : 'UNSUPPORTED_CONDITION_OPERATOR',
          token.text === '=' ? 'L’opérateur = effectue une affectation ; aucune affectation n’est prise en charge dans cette condition.'
            : 'Cet opérateur n’est pas pris en charge dans les conditions du lot 9.', token.range);
      }
    }
    cached = token;
    return token;
  }
  function take(): Token | undefined {
    const token = peek();
    cached = undefined;
    return token;
  }
  function cast(opening: Token, depth: number): CoreNode | undefined {
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
    return operand && { kind: 'cast', type: typeText as CoreNumericType, operand, range: { start: opening.range.start, end: operand.range.end } };
  }
  function unary(depth: number): CoreNode | undefined {
    const token = peek();
    if (diagnostic) return undefined;
    const blocking = !token || ['+', '*', '/', '%', ')'].includes(token.text)
      || (capabilities.logic && (['&&', '||'].includes(token.text) || isComparison(token.text)));
    if (blocking || !token) {
      const at = token?.range.start ?? end;
      return fail('MISSING_OPERAND', 'Il manque un opérande.', { start: at, end: at });
    }
    take();
    if (token.text === '-' || token.text === '(' || (capabilities.logic && token.text === '!')) {
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
      if (capabilities.casts && next && CAST_WORDS.has(next.text)) return cast(token, depth);
      const inner = capabilities.logic ? logicalOr(depth + 1) : sum(depth + 1);
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
    if (capabilities.literals === 'integer') {
      if (/^(?:0|[1-9][0-9]*)$/u.test(token.text)) return { kind: 'integer', value: token.text, range: token.range };
    } else if (/^[0-9.]/u.test(token.text)) {
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
    return fail('INVALID_EXPRESSION_TOKEN', capabilities.invalidTokenMessage, token.range);
  }
  function product(depth: number): CoreNode | undefined {
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
  function sum(depth: number): CoreNode | undefined {
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
    if (capabilities.logic && isComparison(token.text)) return fail('CHAINED_COMPARISON',
      'Les comparaisons chaînées ne sont pas prises en charge.', token.range);
    const continues = capabilities.literals === 'numeric' ? /^(?:[A-Za-z_0-9.]|\()/u : /^(?:[A-Za-z_0-9]|\()/u;
    if (!continues.test(token.text)) return fail('INVALID_EXPRESSION_TOKEN', capabilities.invalidTokenMessage, token.range);
    return fail('MISSING_OPERATOR', 'Il manque un opérateur.', { start: token.range.start, end: token.range.start });
  }
  function asNumeric(node: CoreNode | undefined): CoreNode | undefined {
    if (node && ['comparison', 'logical-not', 'logical-binary'].includes(node.kind)) {
      fail('CONDITION_FORM_NOT_SUPPORTED', 'Ce résultat logique ou comparatif ne peut pas servir d’opérande numérique dans ce lot.', node.range);
      return undefined;
    }
    return node;
  }
  function asComparable(node: CoreNode | undefined, operatorRange?: SourceRange): CoreNode | undefined {
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
  function comparison(depth: number): CoreNode | undefined {
    const left = sum(depth);
    const token = peek();
    if (!left || !token || !isComparison(token.text) || diagnostic) return left;
    take();
    const numericLeft = asComparable(left, token.range);
    const right = asComparable(sum(depth));
    if (!numericLeft || !right) return undefined;
    const result: CoreNode = { kind: 'comparison', operator: token.text, left: numericLeft, right,
      range: { start: numericLeft.range.start, end: right.range.end } };
    comparisonRanges.set(result, token.range);
    return result;
  }
  function logicalAnd(depth: number): CoreNode | undefined {
    return logical(depth, '&&', comparison);
  }
  function logicalOr(depth: number): CoreNode | undefined {
    return logical(depth, '||', logicalAnd);
  }
  function logical(depth: number, operator: '&&' | '||', next: (depth: number) => CoreNode | undefined): CoreNode | undefined {
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
  if (!first && !diagnostic) fail(capabilities.logic ? 'MISSING_CONDITION' : 'MISSING_EXPRESSION', missingMessage, { start: end, end });
  const node = diagnostic ? undefined : (capabilities.logic ? logicalOr(0) : sum(0));
  const extra = diagnostic ? undefined : peek();
  if (extra) {
    if (capabilities.logic && isComparison(extra.text)) fail('CHAINED_COMPARISON', 'Les comparaisons chaînées ne sont pas prises en charge.', extra.range);
    else if (extra.text === ')') fail('UNEXPECTED_CLOSING_PARENTHESIS', 'Cette parenthèse fermante n’a pas de parenthèse ouvrante.', extra.range);
    else missingOperator(extra);
  }
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!node) throw new Error(capabilities.invariantMessage);
  return { status: 'parsed', node };
}

/** A bare numeric tree becomes an explicit test; no value is evaluated. */
export function asCondition(node: CoreNode): CoreNode {
  return node.kind === 'comparison' || node.kind === 'logical-not' || node.kind === 'logical-binary' ? node
    : { kind: 'numeric-test', expression: node, range: { ...node.range } };
}
