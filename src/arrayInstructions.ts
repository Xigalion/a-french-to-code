import type { Diagnostic, SourceRange } from './translate.ts';
import { parseCharacterLiteral } from './characterLiteral.ts';
import { parseNumericExpression } from './numericExpression.ts';
import { parseElementDesignation } from './elementDesignation.ts';
import { parseStringLiteral } from './stringLiteral.ts';
import type { IndexedElement, NumericExpression, NumericType } from './numericExpression.ts';

/** An element designation is built as the very node an indexed expression
 * would build, so the C renderer and the passive pedagogy see one shape
 * whether the index was written inside quotes or inside brackets. */
export type ArrayInstruction =
  | { kind: 'ARRAY_DECL'; parameters: { type: NumericType | { tag: string }; name: string; nameRange: SourceRange; dimension: string; dimensionRange: SourceRange } }
  | { kind: 'ARRAY_ASSIGN_INT'; parameters: { element: IndexedElement; value: string } }
  | { kind: 'ARRAY_ASSIGN_CHAR'; parameters: { element: IndexedElement; literal: string; literalRange: SourceRange } }
  | { kind: 'ARRAY_ASSIGN_EXPRESSION'; parameters: { element: IndexedElement; expression: NumericExpression } }
  | { kind: 'ARRAY_PRINT'; parameters: { element: IndexedElement } }
  | { kind: 'ARRAY_PRINT_CHAR'; parameters: { element: IndexedElement } }
  /** `text` is the decoded content; the C spelling is written back by the
   * shared encoder, so a text reads and prints the same everywhere. */
  | { kind: 'STRING_INIT'; parameters: { name: string; nameRange: SourceRange; dimension: string; dimensionRange: SourceRange; text: string; textRange: SourceRange } }
  | { kind: 'PRINT_STRING'; parameters: { name: string; nameRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: ArrayInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

/** The compound type designations the lot 7 reader already accepts. `char`
 * needs no continuation word, so it is absent here on purpose. */
const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const SUPPORTED_TYPES = ['int', 'unsigned int', 'float', 'double', 'char'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

/** Both apostrophes are the same character for a reader and depend only on
 * the keyboard layout, exactly as in the historical fixed-word comparison. */
function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the five new fixed prefixes are intercepted, and a sentence that does
 * not designate an element is declined untouched so the historical character,
 * numeric and display branches keep it. Everything after a quoted index is
 * read from the raw source rather than from the whitespace tokens, because an
 * index and a character literal may both contain spaces.
 */
export function analyzeArrayInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  const element = (index: number): boolean => same('l’élément', tokens[index]?.text ?? '');

  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  function rawWord(position: number): Token | undefined {
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return undefined;
    const start = position;
    while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
    return { text: source.slice(start, position), range: { start, end: position } };
  }
  function expectWord(position: number, expected: string, code: Diagnostic['code'], message: string): Token | undefined {
    const token = rawWord(position);
    if (!token) return fail(code, message, { start: end, end });
    if (!same(expected, token.text)) return fail('UNKNOWN_FORMULATION', UNKNOWN, token.range);
    return token;
  }
  function finish(position: number): boolean {
    const extra = rawWord(position);
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** A quoted segment, located without tokenizing: it may contain spaces. */
  function quoted(position: number, missingCode: Diagnostic['code'], missing: string, delimiter: string, unterminated: string):
  { opening: number; closing: number } | undefined {
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return fail(missingCode, missing, { start: end, end });
    if (source.charAt(position) !== '"') return fail('MISSING_EXPRESSION_DELIMITER', delimiter, { start: position, end: position });
    const closing = source.indexOf('"', position + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION', unterminated, { start: position, end });
    return { opening: position, closing };
  }

  /** `"{indice}" de {nom}` — the designation shared by four formulations.
   * Lot 32: the reader lives in `elementDesignation.ts`, because the
   * structure envelopes name an element with the very same grammar. */
  function designation(position: number): { element: IndexedElement; end: number } | undefined {
    const read = parseElementDesignation(source, position, end, validateName);
    if (read.status === 'rejected') { diagnostic ??= read.diagnostic; return undefined; }
    return { element: read.element, end: read.end };
  }

  function declaration(initialised: boolean): ArrayInstruction | undefined {
    let i = 3;
    function fixed(expected: string, code: Diagnostic['code'], message: string): boolean {
      const token = tokens[i];
      if (!token) { fail(code, message, { start: end, end }); return false; }
      if (!same(expected, token.text)) { fail('UNKNOWN_FORMULATION', UNKNOWN, token.range); return false; }
      i++;
      return true;
    }
    if (!fixed('de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) return undefined;
    if (!fixed('type', 'MISSING_NUMERIC_TYPE', 'Il manque le type du tableau.')) return undefined;
    const first = tokens[i];
    if (!first || same('nommé', first.text)) {
      const at = first?.range.start ?? end;
      return fail('MISSING_NUMERIC_TYPE', 'Il manque le type du tableau.', { start: at, end: at });
    }
    // Lot 24: an array of structures, which a data structure needs. The tag is
    // named, and no structure is ever defined implicitly by this sentence.
    let element: NumericType | { tag: string };
    let last = first;
    if (same('structure', first.text)) {
      const tag = tokens[i + 1];
      if (!tag) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la structure.', { start: end, end });
      diagnostic = validateName(tag);
      if (diagnostic) return undefined;
      element = { tag: tag.text };
      last = tag;
      i += 2;
    } else {
      let text = first.text.toLowerCase();
      i++;
      while (TYPE_WORDS.includes(word(i) ?? '')) { last = tokens[i++]!; text += ' ' + last.text.toLowerCase(); }
      if (!SUPPORTED_TYPES.includes(text)) return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
        { start: first.range.start, end: last.range.end });
      element = text as NumericType;
    }
    if (!fixed('nommé', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommé » attendu.')) return undefined;
    const name = tokens[i];
    if (!name) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom du tableau.', { start: end, end });
    diagnostic = validateName(name);
    if (diagnostic) return undefined;
    i++;
    if (!fixed('de', 'MISSING_ARRAY_DIMENSION', 'Il manque la dimension du tableau.')) return undefined;
    if (!fixed('dimension', 'MISSING_ARRAY_DIMENSION', 'Il manque la dimension du tableau.')) return undefined;
    const size = tokens[i];
    if (!size) return fail('MISSING_ARRAY_DIMENSION', 'Il manque la dimension du tableau.', { start: end, end });
    // No size is ever invented, and none is ever remembered: a dimension is
    // written in digits here and never reused to check an index later.
    if (!/^[1-9][0-9]*$/u.test(size.text)) return fail('INVALID_ARRAY_DIMENSION',
      'Une dimension entière strictement positive, écrite en chiffres, est attendue.', size.range);
    i++;
    if (!initialised) {
      const extra = tokens[i];
      if (extra) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
      return { kind: 'ARRAY_DECL', parameters: { type: element, name: name.text,
        nameRange: { ...name.range }, dimension: size.text, dimensionRange: { ...size.range } } };
    }
    if (!fixed('avec', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « avec » attendu.')) return undefined;
    if (!fixed('le', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « le » attendu.')) return undefined;
    if (!fixed('texte', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « texte » attendu.')) return undefined;
    // The type is checked only here: a text initialiser is the only thing that
    // makes a non-char array wrong, and the wrong word to point at is `char`.
    if (element !== 'char') return fail('STRING_REQUIRES_CHAR',
      'Seul un tableau de type char peut être initialisé par un texte.', { start: first.range.start, end: last.range.end });
    const scanned = parseStringLiteral(source, tokens[i - 1]!.range.end, end);
    if (scanned.status === 'rejected') { diagnostic = scanned.diagnostic; return undefined; }
    if (!finish(scanned.end)) return undefined;
    // The decoded length is what C stores: an escaped newline counts as one
    // character, not two. No dimension is ever adjusted or deduced; an
    // insufficient one is refused.
    const length = scanned.literal.value.length;
    if (Number(size.text) < length + 1) return fail('INSUFFICIENT_ARRAY_DIMENSION',
      `La dimension doit aussi loger le caractère nul final : ce texte occupe ${length} caractère${length > 1 ? 's' : ''}, `
      + `donc ${length + 1} au minimum.`, size.range);
    return { kind: 'STRING_INIT', parameters: { name: name.text, nameRange: { ...name.range },
      dimension: size.text, dimensionRange: { ...size.range },
      text: scanned.literal.value, textRange: { ...scanned.literal.range } } };
  }

  function displayCharacter(): ArrayInstruction | undefined {
    const target = designation(tokens[4]!.range.end);
    if (!target) return undefined;
    return finish(target.end) ? { kind: 'ARRAY_PRINT_CHAR', parameters: { element: target.element } } : undefined;
  }

  function displayString(): ArrayInstruction | undefined {
    const name = tokens[3];
    if (!name) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la chaîne à afficher.', { start: end, end });
    diagnostic = validateName(name);
    if (diagnostic) return undefined;
    const extra = tokens[4];
    if (extra) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return { kind: 'PRINT_STRING', parameters: { name: name.text, nameRange: { ...name.range } } };
  }

  function assignInteger(): ArrayInstruction | undefined {
    const value = tokens[3]!;
    if (!/^(?:0|-?[1-9][0-9]*)$/u.test(value.text)) return fail('INVALID_INTEGER',
      'Un entier décimal sans signe + ni zéro initial est attendu.', value.range);
    const target = designation(tokens[5]!.range.end);
    if (!target) return undefined;
    return finish(target.end) ? { kind: 'ARRAY_ASSIGN_INT', parameters: { element: target.element, value: value.text } } : undefined;
  }

  function assignCharacter(position: number, literal: { text: string; range: SourceRange }): ArrayInstruction | undefined {
    const target = designation(position);
    if (!target) return undefined;
    return finish(target.end)
      ? { kind: 'ARRAY_ASSIGN_CHAR', parameters: { element: target.element, literal: literal.text, literalRange: { ...literal.range } } }
      : undefined;
  }

  function assignExpression(): ArrayInstruction | undefined {
    const target = designation(tokens[2]!.range.end);
    if (!target) return undefined;
    let position = target.end;
    for (const expected of ['le', 'résultat', 'numérique', 'de']) {
      const token = expectWord(position, expected, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${expected} » attendu.`);
      if (!token) return undefined;
      position = token.range.end;
    }
    const quotes = quoted(position, 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.',
      'Il manque le guillemet ouvrant de l’expression.', 'Il manque le guillemet fermant de l’expression.');
    if (!quotes) return undefined;
    const parsed = parseNumericExpression(source, quotes.opening + 1, quotes.closing, validateName);
    if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
    return finish(quotes.closing + 1)
      ? { kind: 'ARRAY_ASSIGN_EXPRESSION', parameters: { element: target.element, expression: parsed.expression } }
      : undefined;
  }

  function display(): ArrayInstruction | undefined {
    const target = designation(tokens[1]!.range.end);
    if (!target) return undefined;
    return finish(target.end) ? { kind: 'ARRAY_PRINT', parameters: { element: target.element } } : undefined;
  }

  let instruction: ArrayInstruction | undefined;
  if (['déclare', 'crée'].includes(word(0) ?? '') && word(1) === 'un' && word(2) === 'tableau') instruction = declaration(word(0) === 'crée');
  else if (word(0) === 'affiche' && word(1) === 'la' && word(2) === 'chaîne') instruction = displayString();
  else if (word(0) === 'affiche' && word(1) === 'le' && word(2) === 'caractère' && word(3) === 'de' && element(4)) instruction = displayCharacter();
  else if (word(0) === 'affecte' && word(1) === 'la' && word(2) === 'valeur' && word(4) === 'à' && element(5)) instruction = assignInteger();
  else if (word(0) === 'affecte' && word(1) === 'à' && element(2)) instruction = assignExpression();
  else if (word(0) === 'affiche' && element(1)) instruction = display();
  else if (word(0) === 'affecte' && word(1) === 'le' && word(2) === 'caractère') {
    // Lookahead only: a character assignment that does not designate an
    // element is declined untouched, with its historical diagnostics.
    const scanned = parseCharacterLiteral(source, tokens[2]!.range.end, end);
    if (scanned.status !== 'parsed') return undefined;
    const connector = rawWord(scanned.end);
    if (!connector || !same('à', connector.text)) return undefined;
    const designated = rawWord(connector.range.end);
    if (!designated || !same('l’élément', designated.text)) return undefined;
    instruction = assignCharacter(designated.range.end, scanned.literal);
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction tableau analysée absente.');
  return { status: 'recognized', instruction };
}
