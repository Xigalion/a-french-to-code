import type { Diagnostic, SourceRange } from './translate.ts';
import { parseCharacterLiteral } from './characterLiteral.ts';
import { parseExpression } from './expression.ts';
import type { Expression } from './expression.ts';

/** `switch` controls an integer expression in C17, so the lot 6 integer
 * profile is the right one and is reused unchanged: no capability is added to
 * it, and it alone lets through neither a float, nor a cast, nor a comparison. */
export type SwitchInstruction =
  | { kind: 'SWITCH'; parameters: { expression: Expression; expressionRange: SourceRange } }
  | { kind: 'CASE_INT'; parameters: { value: string; valueRange: SourceRange } }
  | { kind: 'CASE_CHAR'; parameters: { literal: string; literalRange: SourceRange } }
  | { kind: 'CASE_DEFAULT'; parameters: { keywordRange: SourceRange } }
  | { kind: 'BREAK_SWITCH'; parameters: { keywordRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: SwitchInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the five new fixed prefixes are intercepted. Every historical branch,
 * including « Sors de la boucle la plus intérieure. » of lot 11D, is left
 * untouched: the two transfers are selected on different fixed words.
 */
export function analyzeSwitchInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
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

  function aiguillage(): SwitchInstruction | undefined {
    if (!expect(3, 'sur', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « sur » attendu.')) return undefined;
    const opening = tokens[4]?.range.start ?? end;
    if (opening === end) return fail('MISSING_EXPRESSION', 'Il manque l’expression de l’aiguillage.', { start: end, end });
    if (source.charAt(opening) !== '"') return fail('MISSING_EXPRESSION_DELIMITER',
      'Il manque le guillemet ouvrant de l’expression.', { start: opening, end: opening });
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION',
      'Il manque le guillemet fermant de l’expression.', { start: opening, end });
    const parsed = parseExpression(source, opening + 1, closing, validateName);
    if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
    let after = closing + 1;
    while (after < end && /[ \t]/u.test(source.charAt(after))) after++;
    if (after < end) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: after, end });
    return { kind: 'SWITCH', parameters: { expression: parsed.expression,
      expressionRange: { start: opening, end: closing + 1 } } };
  }

  /** A `case` label needs an integer constant expression in C17. A name is
   * refused: without symbol resolution C-A cannot tell an enumeration constant
   * from a variable, and a variable would not be constant. */
  function etiquette(): SwitchInstruction | undefined {
    if (word(4) === 'la' && word(5) === 'valeur') {
      const value = tokens[6];
      if (!value) return fail('INCOMPLETE_INSTRUCTION', 'Il manque la valeur du cas.', { start: end, end });
      if (!/^-?(?:0|[1-9][0-9]*)$/u.test(value.text)) {
        return fail(/^[A-Za-z_]/u.test(value.text) ? 'CASE_NEEDS_CONSTANT' : 'INVALID_INTEGER',
          /^[A-Za-z_]/u.test(value.text)
            ? 'Une étiquette de cas exige une constante : un nom n’en est pas une, et C-A ne résout aucun symbole.'
            : 'Un entier décimal sans signe + ni zéro initial est attendu.', value.range);
      }
      return finish(7) ? { kind: 'CASE_INT', parameters: { value: value.text, valueRange: { ...value.range } } } : undefined;
    }
    if (word(4) === 'le' && word(5) === 'caractère') {
      const scanned = parseCharacterLiteral(source, tokens[5]!.range.end, end);
      if (scanned.status === 'rejected') { diagnostic = scanned.diagnostic; return undefined; }
      let after = scanned.end;
      while (after < end && /[ \t]/u.test(source.charAt(after))) after++;
      if (after < end) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: after, end });
      return { kind: 'CASE_CHAR', parameters: { literal: scanned.literal.text, literalRange: { ...scanned.literal.range } } };
    }
    const token = tokens[4];
    return token ? fail('UNKNOWN_FORMULATION', UNKNOWN, token.range)
      : fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « la valeur » ou « le caractère » attendu.', { start: end, end });
  }

  let instruction: SwitchInstruction | undefined;
  if (word(0) === 'crée' && word(1) === 'un' && word(2) === 'aiguillage') instruction = aiguillage();
  else if (word(0) === 'ajoute' && word(1) === 'un' && word(2) === 'cas') {
    if (!expect(3, 'pour', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « pour » attendu.')) return { status: 'rejected', diagnostic: diagnostic! };
    instruction = etiquette();
  } else if (word(0) === 'ajoute' && word(1) === 'le' && word(2) === 'cas') {
    if (!expect(3, 'par', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « par défaut » attendu.')) return { status: 'rejected', diagnostic: diagnostic! };
    if (!expect(4, 'défaut', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « défaut » attendu.')) return { status: 'rejected', diagnostic: diagnostic! };
    instruction = finish(5) ? { kind: 'CASE_DEFAULT', parameters: { keywordRange: { ...tokens[2]!.range } } } : undefined;
  } else if (word(0) === 'sors' && same('de', tokens[1]?.text ?? '') && same('l’aiguillage', tokens[2]?.text ?? '')) {
    instruction = finish(3) ? { kind: 'BREAK_SWITCH', parameters: { keywordRange: { ...tokens[2]!.range } } } : undefined;
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction d’aiguillage analysée absente.');
  return { status: 'recognized', instruction };
}
