import type { Diagnostic, SourceRange } from './translate.ts';
import { parseIndexExpression } from './numericExpression.ts';
import type { IndexedElement } from './numericExpression.ts';

/** `"{indice}" de {nom}` — the element designation of lot 15, extracted from
 * `arrayInstructions` by lot 32 so that the structure envelopes may name an
 * element with exactly the same grammar, the same diagnostics and the same
 * ranges. One reader, one set of messages: a second copy would drift.
 *
 * Everything is read from the raw source rather than from whitespace tokens,
 * because an index may contain spaces.
 */
export type Token = { text: string; range: SourceRange };
export type NameValidator = (token: Token) => Diagnostic | undefined;
export type Designation =
  | { status: 'parsed'; element: IndexedElement; end: number }
  | { status: 'rejected'; diagnostic: Diagnostic };

const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** The next whitespace-delimited word at or after `position`, raw. */
export function rawWord(source: string, position: number, end: number): Token | undefined {
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) return undefined;
  const start = position;
  while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
  return { text: source.slice(start, position), range: { start, end: position } };
}

export function parseElementDesignation(source: string, position: number, end: number,
  validateName: NameValidator): Designation {
  function reject(code: Diagnostic['code'], message: string, range: SourceRange): Designation {
    return { status: 'rejected', diagnostic: { code, category: 'understanding', severity: 'error', message, range } };
  }

  let at = position;
  while (at < end && /[ \t]/u.test(source.charAt(at))) at++;
  if (at === end) return reject('MISSING_INDEX', 'Il manque l’indice de l’élément.', { start: end, end });
  if (source.charAt(at) !== '"') {
    return reject('MISSING_EXPRESSION_DELIMITER', 'Il manque le guillemet ouvrant de l’indice.', { start: at, end: at });
  }
  const closing = source.indexOf('"', at + 1);
  if (closing === -1 || closing >= end) {
    return reject('UNTERMINATED_EXPRESSION', 'Il manque le guillemet fermant de l’indice.', { start: at, end });
  }
  // An empty designation is a missing index, not a missing expression: the
  // code must be the one `t[]` produces inside an expression.
  if (!/[^ \t]/u.test(source.slice(at + 1, closing))) {
    return reject('MISSING_INDEX', 'Il manque l’indice de l’élément.', { start: closing, end: closing });
  }
  const parsed = parseIndexExpression(source, at + 1, closing, validateName);
  if (parsed.status === 'rejected') return { status: 'rejected', diagnostic: parsed.diagnostic };

  const after = rawWord(source, closing + 1, end);
  if (!after) return reject('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.', { start: end, end });
  if (!same('de', after.text)) return reject('UNKNOWN_FORMULATION', UNKNOWN, after.range);

  const array = rawWord(source, after.range.end, end);
  if (!array) return reject('INCOMPLETE_INSTRUCTION', 'Il manque le nom du tableau.', { start: end, end });
  const invalid = validateName(array);
  if (invalid) return { status: 'rejected', diagnostic: invalid };

  const range = { start: at, end: closing + 1 };
  return {
    status: 'parsed',
    element: {
      kind: 'index', array: { kind: 'name', name: array.text, range: { ...array.range } },
      index: parsed.expression, range: { ...range }, bracketRange: { ...range },
    },
    end: array.range.end,
  };
}
