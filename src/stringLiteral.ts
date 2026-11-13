import type { Diagnostic, SourceRange } from './translate.ts';

/** The finite escape grammar shared by every text of the catalogue. */
const ESCAPES: Readonly<Record<string, string>> = { '"': '"', '\\': '\\', n: '\n', t: '\t' };

export type StringLiteral = {
  /** Decoded content. Its length in UTF-16 code units is the C length of the
   * string, which is what a dimension must be able to hold with its null. */
  value: string;
  range: SourceRange;
};
export type StringLiteralResult =
  | { status: 'parsed'; literal: StringLiteral; end: number }
  | { status: 'rejected'; diagnostic: Diagnostic };

function reject(code: Diagnostic['code'], message: string, range: SourceRange): StringLiteralResult {
  return { status: 'rejected', diagnostic: { code, category: 'understanding', severity: 'error', message, range } };
}

/** Pure, bounded scan of one string literal. Offsets are absolute UTF-16
 * positions in the original sentence; nothing is normalized. The scanner stops
 * at the closing quote: what may follow is the envelope's business, not its.
 */
export function parseStringLiteral(source: string, start: number, end: number): StringLiteralResult {
  let position = start;
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) {
    return reject('INCOMPLETE_INSTRUCTION', 'Un texte entre guillemets ASCII est attendu.', { start: end, end });
  }
  if (source.charAt(position) !== '"') {
    const width = source.codePointAt(position)! > 0xffff ? 2 : 1;
    return reject('UNKNOWN_FORMULATION', 'Le texte doit être entouré de guillemets ASCII.', { start: position, end: position + width });
  }
  const opening = position++;
  let value = '';
  while (position < end) {
    const current = source.charAt(position);
    if (current === '"') {
      return { status: 'parsed', literal: { value, range: { start: opening, end: position + 1 } }, end: position + 1 };
    }
    if (/^\?\?[=/'()!<>-]/u.test(source.slice(position, position + 3))) {
      return reject('UNSUPPORTED_STRING_CONTENT', 'Les trigraphes C ne sont pas pris en charge dans les textes.', { start: position, end: position + 3 });
    }
    if (current === '\\') {
      const decoded = ESCAPES[source.charAt(position + 1)];
      if (decoded === undefined) {
        const width = (source.codePointAt(position + 1) ?? 0) > 0xffff ? 2 : 1;
        return reject('INVALID_STRING_ESCAPE', 'Échappement attendu : \\" , \\\\ , \\n ou \\t.', { start: position, end: Math.min(position + 1 + width, end) });
      }
      value += decoded;
      position += 2;
      continue;
    }
    const point = source.codePointAt(position)!;
    const width = point > 0xffff ? 2 : 1;
    if (point <= 0x1f || (point >= 0x7f && point <= 0x9f) || (point >= 0xd800 && point <= 0xdfff)) {
      return reject('UNSUPPORTED_STRING_CONTENT', 'Caractère de contrôle ou Unicode invalide dans le texte.', { start: position, end: position + width });
    }
    value += source.slice(position, position + width);
    position += width;
  }
  return reject('UNTERMINATED_STRING', 'Le guillemet fermant du texte est absent.', { start: opening, end });
}

/** The C spelling of a decoded text, written back with the same finite escape
 * grammar it was read with. No other character is ever escaped. */
export function renderStringLiteral(value: string): string {
  const escaped = value.replace(/[\\"\n\t]/gu, character => {
    switch (character) {
      case '\\': return '\\\\';
      case '"': return '\\"';
      case '\n': return '\\n';
      default: return '\\t';
    }
  });
  return `"${escaped}"`;
}
