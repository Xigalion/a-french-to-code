import type { Diagnostic, SourceRange } from './translate.ts';
import { parseCondition } from './condition.ts';
import { parseNumericExpression } from './numericExpression.ts';
import type { Condition } from './condition.ts';
import type { NumericExpression, NumericType } from './numericExpression.ts';

/** Lot 28 delivers `limits.h`, which lot 25 had deliberately left out
 * because the lot 6 snapshot froze its sentence as a refusal. The founder
 * authorized amending that snapshot on 15 November 2026, so the header is
 * now accepted by its own branch, exactly as `stdlib.h` is by lot 21.
 *
 * The limit MACROS need no code at all: `INT_MAX` is a valid C identifier,
 * so every expression profile has always accepted it as an ordinary name.
 * That is also the honest limit — C-A does not know those macros, does not
 * know their values, and never checks that the header was included. */

export type ReliabilityInstruction =
  | { kind: 'INCLUDE_ASSERT'; parameters: Record<string, never> }
  | { kind: 'INCLUDE_LIMITS'; parameters: Record<string, never> }
  | { kind: 'ASSERT'; parameters: { condition: Condition; conditionRange: SourceRange } }
  | { kind: 'CONST_DECL'; parameters: { type: NumericType; name: string; nameRange: SourceRange; expression: NumericExpression } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: ReliabilityInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const SCALARS = ['int', 'unsigned int', 'float', 'double', 'char'];
const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the six new fixed prefixes are intercepted. The two headers are
 * handled here, before the historical include rule, so that rule and its
 * frozen `UNSUPPORTED_HEADER` message are left exactly as they were.
 */
export function analyzeReliabilityInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  function expect(i: number, expected: string, code: Diagnostic['code'], message: string): boolean {
    const token = tokens[i];
    if (!token) { fail(code, message, { start: end, end }); return false; }
    if (!same(expected, token.text)) { fail('UNKNOWN_FORMULATION', UNKNOWN, token.range); return false; }
    return true;
  }
  function finish(i: number): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** `de type {scalaire}`, with `du` accepted as the same two words. */
  function scalarType(i: number, missing: string): { type: NumericType; range: SourceRange; next: number } | undefined {
    const article = tokens[i];
    if (!article) return fail('INCOMPLETE_INSTRUCTION', `Instruction incomplète : « du type » attendu.`, { start: end, end });
    if (!same('de', article.text) && !same('du', article.text)) return fail('UNKNOWN_FORMULATION', UNKNOWN, article.range);
    if (!expect(i + 1, 'type', 'MISSING_NUMERIC_TYPE', missing)) return undefined;
    const first = tokens[i + 2];
    if (!first || same('nommée', first.text)) {
      const at = first?.range.start ?? end;
      return fail('MISSING_NUMERIC_TYPE', missing, { start: at, end: at });
    }
    let text = first.text.toLowerCase();
    let last = first;
    let next = i + 3;
    while (TYPE_WORDS.includes(word(next) ?? '')) { last = tokens[next++]!; text += ' ' + last.text.toLowerCase(); }
    if (!SCALARS.includes(text)) return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
      { start: first.range.start, end: last.range.end });
    return { type: text as NumericType, range: { start: first.range.start, end: last.range.end }, next };
  }
  /** A quoted segment, located without tokenizing. */
  function quoted(i: number, missingCode: Diagnostic['code'], missing: string): { opening: number; closing: number } | undefined {
    const opening = tokens[i]?.range.start ?? end;
    if (opening === end) return fail(missingCode, missing, { start: end, end });
    if (source.charAt(opening) !== '"') return fail('MISSING_EXPRESSION_DELIMITER', missing, { start: opening, end: opening });
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION',
      'Il manque le guillemet fermant.', { start: opening, end });
    let after = closing + 1;
    while (after < end && /[ \t]/u.test(source.charAt(after))) after++;
    if (after < end) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: after, end });
    return { opening, closing };
  }

  let instruction: ReliabilityInstruction | undefined;
  if (word(0) === 'inclue' && word(1) === 'la' && word(2) === 'bibliothèque' && tokens[3]?.text === 'assert.h') {
    instruction = finish(4) ? { kind: 'INCLUDE_ASSERT', parameters: {} } : undefined;
  } else if (word(0) === 'inclue' && word(1) === 'la' && word(2) === 'bibliothèque' && tokens[3]?.text === 'limits.h') {
    instruction = finish(4) ? { kind: 'INCLUDE_LIMITS', parameters: {} } : undefined;
  } else if (word(0) === 'vérifie' && word(1) === 'que') {
    const quotes = quoted(2, 'MISSING_CONDITION', 'Il manque la condition à vérifier.');
    if (quotes) {
      const parsed = parseCondition(source, quotes.opening + 1, quotes.closing, validateName,
        'Il manque la condition à vérifier.');
      if (parsed.status === 'rejected') diagnostic = parsed.diagnostic;
      else {
        instruction = { kind: 'ASSERT', parameters: { condition: parsed.condition,
          conditionRange: { start: quotes.opening, end: quotes.closing + 1 } } };
      }
    }
  } else if (word(0) === 'déclare' && word(1) === 'une' && word(2) === 'constante') {
    const read = scalarType(3, 'Il manque le type de la constante.');
    if (read && expect(read.next, 'nommée', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommée » attendu.')) {
      const name = tokens[read.next + 1];
      if (!name) fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la constante.', { start: end, end });
      else {
        diagnostic = validateName(name);
        if (!diagnostic) {
          let i = read.next + 2;
          let ok = true;
          for (const expected of ['avec', 'le', 'résultat', 'de']) {
            if (!expect(i, expected, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${expected} » attendu.`)) { ok = false; break; }
            i++;
          }
          if (ok) {
            const quotes = quoted(i, 'MISSING_EXPRESSION', 'Il manque l’expression de la constante.');
            if (quotes) {
              const parsed = parseNumericExpression(source, quotes.opening + 1, quotes.closing, validateName);
              if (parsed.status === 'rejected') diagnostic = parsed.diagnostic;
              else {
                instruction = { kind: 'CONST_DECL', parameters: { type: read.type, name: name.text,
                  nameRange: { ...name.range }, expression: parsed.expression } };
              }
            }
          }
        }
      }
    }
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction de fiabilité analysée absente.');
  return { status: 'recognized', instruction };
}
