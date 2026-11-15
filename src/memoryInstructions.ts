import type { Diagnostic, SourceRange } from './translate.ts';
import type { NumericType } from './numericExpression.ts';

/** A measured type is one of the five scalars already taught, or a structure
 * named by its tag. No pointer type, no array type: `sizeof` on those would
 * need a declarator grammar this lot does not open. */
export type MeasuredType = { kind: 'scalar'; type: NumericType } | { kind: 'struct'; tag: string };

/** The element count of an allocation: a decimal literal or a name. C-A
 * resolves no symbol, so a name is accepted as written and nothing checks that
 * it is a non-negative integer. */
export type Count = { text: string; range: SourceRange };

export type MemoryInstruction =
  | { kind: 'INCLUDE_STDLIB'; parameters: Record<string, never> }
  | { kind: 'SIZEOF_PRINT'; parameters: { type: MeasuredType; typeRange: SourceRange } }
  | { kind: 'SIZEOF_ASSIGN'; parameters: { name: string; nameRange: SourceRange; type: MeasuredType; typeRange: SourceRange } }
  | { kind: 'ALLOCATE'; parameters: { name: string; nameRange: SourceRange; count: Count; type: MeasuredType; typeRange: SourceRange } }
  | { kind: 'REALLOCATE'; parameters: { name: string; nameRange: SourceRange; source: string; sourceRange: SourceRange; count: Count; type: MeasuredType; typeRange: SourceRange } }
  | { kind: 'FREE'; parameters: { name: string; nameRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: MemoryInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const SCALARS = ['int', 'unsigned int', 'float', 'double', 'char'];
const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the six new fixed prefixes are intercepted. `Inclue la bibliothèque
 * stdlib.h.` is handled here, before the historical include rule, so that
 * rule and its `UNSUPPORTED_HEADER` message — frozen by the lot 5
 * compatibility snapshot — are left exactly as they were.
 */
export function analyzeMemoryInstruction(tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
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
  function identifier(i: number, message: string): Token | undefined {
    const token = tokens[i];
    if (!token) return fail('INCOMPLETE_INSTRUCTION', message, { start: end, end });
    diagnostic = validateName(token);
    return diagnostic ? undefined : token;
  }
  function finish(i: number): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** `de type {scalaire}` or `de type structure {tag}`, returning the words
   * exactly as C17 spells the type inside `sizeof`. */
  function measuredType(i: number): { type: MeasuredType; range: SourceRange; next: number } | undefined {
    // « du type » and « de type » are the same words in French; both read.
    const article = tokens[i];
    if (!article) return fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « du type » attendu.', { start: end, end });
    if (!same('de', article.text) && !same('du', article.text)) {
      return fail('UNKNOWN_FORMULATION', UNKNOWN, article.range);
    }
    if (!expect(i + 1, 'type', 'MISSING_NUMERIC_TYPE', 'Il manque le type mesuré.')) return undefined;
    if (word(i + 2) === 'structure') {
      const tag = identifier(i + 3, 'Il manque le nom de la structure.');
      if (!tag) return undefined;
      return { type: { kind: 'struct', tag: tag.text },
        range: { start: tokens[i + 2]!.range.start, end: tag.range.end }, next: i + 4 };
    }
    const first = tokens[i + 2];
    if (!first) return fail('MISSING_NUMERIC_TYPE', 'Il manque le type mesuré.', { start: end, end });
    let text = first.text.toLowerCase();
    let last = first;
    let next = i + 3;
    while (TYPE_WORDS.includes(word(next) ?? '')) { last = tokens[next++]!; text += ' ' + last.text.toLowerCase(); }
    if (!SCALARS.includes(text)) return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
      { start: first.range.start, end: last.range.end });
    return { type: { kind: 'scalar', type: text as NumericType },
      range: { start: first.range.start, end: last.range.end }, next };
  }
  /** `{entier|nom} élément` or `{…} éléments`. */
  function count(i: number): { count: Count; next: number } | undefined {
    const token = tokens[i];
    if (!token) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nombre d’éléments.', { start: end, end });
    if (!/^(?:0|[1-9][0-9]*)$/u.test(token.text)) {
      if (!/^[A-Za-z]/u.test(token.text)) return fail('INVALID_INTEGER',
        'Un entier décimal positif ou un nom est attendu comme nombre d’éléments.', token.range);
      diagnostic = validateName(token);
      if (diagnostic) return undefined;
    }
    const unit = word(i + 1);
    if (unit !== 'élément' && unit !== 'éléments') {
      const next = tokens[i + 1];
      return next ? fail('UNKNOWN_FORMULATION', UNKNOWN, next.range)
        : fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « éléments » attendu.', { start: end, end });
    }
    return { count: { text: token.text, range: { ...token.range } }, next: i + 2 };
  }

  let instruction: MemoryInstruction | undefined;
  if (word(0) === 'inclue' && word(1) === 'la' && word(2) === 'bibliothèque' && tokens[3]?.text === 'stdlib.h') {
    instruction = finish(4) ? { kind: 'INCLUDE_STDLIB', parameters: {} } : undefined;
  } else if (word(0) === 'affiche' && word(1) === 'la' && word(2) === 'taille') {
    const read = measuredType(3);
    if (read && finish(read.next)) {
      instruction = { kind: 'SIZEOF_PRINT', parameters: { type: read.type, typeRange: read.range } };
    }
  } else if (word(0) === 'affecte' && word(1) === 'à' && word(3) === 'la' && word(4) === 'taille') {
    const name = identifier(2, 'Il manque le nom de la variable.');
    if (name) {
      const read = measuredType(5);
      if (read && finish(read.next)) {
        instruction = { kind: 'SIZEOF_ASSIGN', parameters: { name: name.text, nameRange: { ...name.range },
          type: read.type, typeRange: read.range } };
      }
    }
  } else if (word(0) === 'affecte' && word(1) === 'à' && same('l’allocation', tokens[3]?.text ?? '')) {
    const name = identifier(2, 'Il manque le nom du pointeur.');
    if (name && expect(4, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) {
      const read = count(5);
      if (read) {
        const measured = measuredType(read.next);
        if (measured && finish(measured.next)) {
          instruction = { kind: 'ALLOCATE', parameters: { name: name.text, nameRange: { ...name.range },
            count: read.count, type: measured.type, typeRange: measured.range } };
        }
      }
    }
  } else if (word(0) === 'affecte' && word(1) === 'à' && same('la', tokens[3]?.text ?? '') && word(4) === 'réallocation') {
    const name = identifier(2, 'Il manque le nom du pointeur.');
    if (name && expect(5, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) {
      const origin = identifier(6, 'Il manque le pointeur à réallouer.');
      if (origin && expect(7, 'pour', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « pour » attendu.')) {
        const read = count(8);
        if (read) {
          const measured = measuredType(read.next);
          if (measured && finish(measured.next)) {
            instruction = { kind: 'REALLOCATE', parameters: { name: name.text, nameRange: { ...name.range },
              source: origin.text, sourceRange: { ...origin.range },
              count: read.count, type: measured.type, typeRange: measured.range } };
          }
        }
      }
    }
  } else if (word(0) === 'libère' && word(1) === 'la' && word(2) === 'mémoire') {
    if (expect(3, 'pointée', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « pointée par » attendu.')
      && expect(4, 'par', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « par » attendu.')) {
      const name = identifier(5, 'Il manque le nom du pointeur à libérer.');
      if (name && finish(6)) {
        instruction = { kind: 'FREE', parameters: { name: name.text, nameRange: { ...name.range } } };
      }
    }
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction mémoire analysée absente.');
  return { status: 'recognized', instruction };
}

/** The C spelling of a measured type, as it appears inside `sizeof`. */
export function renderMeasuredType(type: MeasuredType): string {
  return type.kind === 'scalar' ? type.type : `struct ${type.tag}`;
}
