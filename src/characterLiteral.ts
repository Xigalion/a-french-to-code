import type { Diagnostic, SourceRange } from './translate.ts';

/** The finite escape grammar of lot 14. `\0` is deliberately absent: the null
 * character belongs to lot 16, where it is the subject being taught. */
const ESCAPES: Readonly<Record<string, true>> = { "'": true, '\\': true, n: true, t: true };

export type CharacterLiteral = {
  /** The exact C spelling, apostrophes included. Never evaluated: `'A'` is
   * never replaced by its numeric code, here or anywhere downstream. */
  text: string;
  range: SourceRange;
};
export type CharacterLiteralResult =
  | { status: 'parsed'; literal: CharacterLiteral; end: number }
  | { status: 'rejected'; diagnostic: Diagnostic };

function reject(code: Diagnostic['code'], message: string, range: SourceRange): CharacterLiteralResult {
  return { status: 'rejected', diagnostic: { code, category: 'understanding', severity: 'error', message, range } };
}

/** Pure, bounded scan of one character constant. Offsets are absolute UTF-16
 * positions in the original sentence; nothing is normalized.
 *
 * This is a literal scanner, not an expression parser: it recognizes one
 * terminal and stops. A character constant inside an expression is refused by
 * the expression profiles, unchanged, until a later lot opens it.
 */
export function parseCharacterLiteral(source: string, start: number, end: number): CharacterLiteralResult {
  let position = start;
  while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
  if (position === end) return reject('MISSING_CHARACTER', 'Il manque le caractère.', { start: end, end });
  if (source.charAt(position) !== "'") {
    const width = source.codePointAt(position)! > 0xffff ? 2 : 1;
    return reject('MISSING_CHARACTER_DELIMITER', 'Le caractère doit être entouré d’apostrophes ASCII droites.',
      { start: position, end: position + width });
  }
  const opening = position++;
  if (position === end) return reject('UNTERMINATED_CHARACTER', 'Il manque l’apostrophe fermante du caractère.', { start: opening, end });
  if (source.charAt(position) === "'") {
    return reject('INVALID_CHARACTER', 'Un caractère exactement est attendu entre les apostrophes.',
      { start: opening, end: position + 1 });
  }

  let contentEnd: number;
  if (source.charAt(position) === '\\') {
    const escape = source.charAt(position + 1);
    if (position + 1 >= end) return reject('UNTERMINATED_CHARACTER', 'Il manque l’apostrophe fermante du caractère.', { start: opening, end });
    if (!ESCAPES[escape]) {
      const width = (source.codePointAt(position + 1) ?? 0) > 0xffff ? 2 : 1;
      return reject('INVALID_CHARACTER_ESCAPE', 'Échappement attendu : \\\' , \\\\ , \\n ou \\t.',
        { start: position, end: Math.min(position + 1 + width, end) });
    }
    contentEnd = position + 2;
  } else {
    const point = source.codePointAt(position)!;
    const width = point > 0xffff ? 2 : 1;
    // Printable ASCII only. A non-ASCII character written between apostrophes
    // in a UTF-8 source is a multi-character constant whose value C17 leaves
    // implementation-defined: it is refused rather than silently translated.
    if (point < 0x20 || point > 0x7e) {
      return reject('UNSUPPORTED_CHARACTER_CONTENT',
        'Seuls les caractères ASCII imprimables sont pris en charge entre apostrophes.',
        { start: position, end: position + width });
    }
    contentEnd = position + width;
  }

  if (contentEnd >= end) return reject('UNTERMINATED_CHARACTER', 'Il manque l’apostrophe fermante du caractère.', { start: opening, end });
  if (source.charAt(contentEnd) !== "'") {
    // Everything up to the closing apostrophe, if any, is one literal that
    // holds more than one character; otherwise the literal is unterminated.
    const closing = source.indexOf("'", contentEnd);
    if (closing === -1 || closing >= end) return reject('UNTERMINATED_CHARACTER', 'Il manque l’apostrophe fermante du caractère.', { start: opening, end });
    return reject('INVALID_CHARACTER', 'Un caractère exactement est attendu entre les apostrophes.', { start: opening, end: closing + 1 });
  }
  const range = { start: opening, end: contentEnd + 1 };
  return { status: 'parsed', literal: { text: source.slice(range.start, range.end), range }, end: range.end };
}
