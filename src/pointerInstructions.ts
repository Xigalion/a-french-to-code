import type { Diagnostic, SourceRange } from './translate.ts';
import { parseNumericExpression } from './numericExpression.ts';
import type { NumericExpression, NumericType } from './numericExpression.ts';

/** One level of indirection only, and the declarator is written `int *p`
 * (decision D2): the star belongs to the declarator, not to the type, and the
 * produced C is what the student reads. */
export type PointerInstruction =
  | { kind: 'DECL_POINTER'; parameters: { type: NumericType; name: string; nameRange: SourceRange } }
  | { kind: 'INIT_POINTER'; parameters: { type: NumericType; name: string; nameRange: SourceRange; target: string; targetRange: SourceRange } }
  | { kind: 'ASSIGN_ADDRESS'; parameters: { name: string; nameRange: SourceRange; target: string; targetRange: SourceRange } }
  | { kind: 'PRINT_POINTED'; parameters: { name: string; nameRange: SourceRange } }
  | { kind: 'ASSIGN_POINTED_INT'; parameters: { name: string; nameRange: SourceRange; value: string } }
  | { kind: 'ASSIGN_POINTED_EXPRESSION'; parameters: { name: string; nameRange: SourceRange; expression: NumericExpression } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: PointerInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const SUPPORTED_TYPES = ['int', 'unsigned int', 'float', 'double', 'char'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the six new fixed prefixes are intercepted; a sentence that does not
 * name a pointer is declined untouched, so the historical assignment, display
 * and array branches keep it with their own diagnostics.
 */
export function analyzePointerInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  const address = (index: number): boolean => same('l’adresse', tokens[index]?.text ?? '');
  /** `la valeur pointée par` — the indirect target shared by three forms. */
  const pointed = (index: number): boolean => word(index) === 'la' && word(index + 1) === 'valeur'
    && word(index + 2) === 'pointée' && word(index + 3) === 'par';

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
  /** `de type {type}`, with the star already consumed by the French word
   * « pointeur » : a second star would be a second level of indirection. */
  function pointerType(i: number): { type: NumericType; next: number } | undefined {
    if (!expect(i, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) return undefined;
    if (!expect(i + 1, 'type', 'MISSING_NUMERIC_TYPE', 'Il manque le type pointé.')) return undefined;
    const first = tokens[i + 2];
    if (!first || same('nommé', first.text)) {
      const at = first?.range.start ?? end;
      return fail('MISSING_NUMERIC_TYPE', 'Il manque le type pointé.', { start: at, end: at });
    }
    let text = first.text.toLowerCase();
    let last = first;
    let next = i + 3;
    while (TYPE_WORDS.includes(word(next) ?? '')) { last = tokens[next++]!; text += ' ' + last.text.toLowerCase(); }
    if (text.endsWith('*') || word(next) === '*') return fail('UNSUPPORTED_INDIRECTION_LEVEL',
      'Un seul niveau d’indirection est pris en charge.', { start: first.range.start, end: (tokens[next] ?? last).range.end });
    if (!SUPPORTED_TYPES.includes(text)) return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
      { start: first.range.start, end: last.range.end });
    return { type: text as NumericType, next };
  }
  /** The quoted expression of the indirect assignment. */
  function expression(i: number): NumericExpression | undefined {
    const opening = tokens[i]?.range.start ?? end;
    if (opening === end) return fail('MISSING_EXPRESSION', 'Il manque l’expression à calculer.', { start: end, end });
    if (source.charAt(opening) !== '"') return fail('MISSING_EXPRESSION_DELIMITER',
      'Il manque le guillemet ouvrant de l’expression.', { start: opening, end: opening });
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION',
      'Il manque le guillemet fermant de l’expression.', { start: opening, end });
    const parsed = parseNumericExpression(source, opening + 1, closing, validateName);
    if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
    let after = closing + 1;
    while (after < end && /[ \t]/u.test(source.charAt(after))) after++;
    if (after < end) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: after, end });
    return parsed.expression;
  }

  function declaration(initialised: boolean): PointerInstruction | undefined {
    const read = pointerType(3);
    if (!read) return undefined;
    let i = read.next;
    if (!expect(i, 'nommé', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommé » attendu.')) return undefined;
    const name = identifier(i + 1, 'Il manque le nom du pointeur.');
    if (!name) return undefined;
    i += 2;
    if (!initialised) {
      return finish(i) ? { kind: 'DECL_POINTER', parameters: { type: read.type, name: name.text, nameRange: { ...name.range } } } : undefined;
    }
    if (!expect(i, 'avec', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « avec » attendu.')) return undefined;
    if (!address(i + 1)) {
      const token = tokens[i + 1];
      return token ? fail('UNKNOWN_FORMULATION', UNKNOWN, token.range)
        : fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « l’adresse » attendu.', { start: end, end });
    }
    if (!expect(i + 2, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) return undefined;
    // No target is ever invented: the variable whose address is taken is named.
    const target = identifier(i + 3, 'Il manque le nom de la variable dont prendre l’adresse.');
    if (!target) return undefined;
    return finish(i + 4) ? { kind: 'INIT_POINTER', parameters: { type: read.type, name: name.text,
      nameRange: { ...name.range }, target: target.text, targetRange: { ...target.range } } } : undefined;
  }

  function assignAddress(): PointerInstruction | undefined {
    if (!expect(2, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) return undefined;
    const target = identifier(3, 'Il manque le nom de la variable dont prendre l’adresse.');
    if (!target) return undefined;
    if (!expect(4, 'à', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « à » attendu.')) return undefined;
    const name = identifier(5, 'Il manque le nom du pointeur.');
    if (!name) return undefined;
    return finish(6) ? { kind: 'ASSIGN_ADDRESS', parameters: { name: name.text, nameRange: { ...name.range },
      target: target.text, targetRange: { ...target.range } } } : undefined;
  }

  function display(): PointerInstruction | undefined {
    const name = identifier(5, 'Il manque le nom du pointeur.');
    if (!name) return undefined;
    return finish(6) ? { kind: 'PRINT_POINTED', parameters: { name: name.text, nameRange: { ...name.range } } } : undefined;
  }

  function assignInteger(): PointerInstruction | undefined {
    const value = tokens[3]!;
    if (!/^(?:0|-?[1-9][0-9]*)$/u.test(value.text)) return fail('INVALID_INTEGER',
      'Un entier décimal sans signe + ni zéro initial est attendu.', value.range);
    const name = identifier(9, 'Il manque le nom du pointeur.');
    if (!name) return undefined;
    return finish(10) ? { kind: 'ASSIGN_POINTED_INT', parameters: { name: name.text,
      nameRange: { ...name.range }, value: value.text } } : undefined;
  }

  function assignExpression(): PointerInstruction | undefined {
    const name = identifier(6, 'Il manque le nom du pointeur.');
    if (!name) return undefined;
    for (const [offset, expected] of ['le', 'résultat', 'numérique', 'de'].entries()) {
      if (!expect(7 + offset, expected, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${expected} » attendu.`)) return undefined;
    }
    const parsed = expression(11);
    if (!parsed) return undefined;
    return { kind: 'ASSIGN_POINTED_EXPRESSION', parameters: { name: name.text, nameRange: { ...name.range }, expression: parsed } };
  }

  let instruction: PointerInstruction | undefined;
  if (['déclare', 'crée'].includes(word(0) ?? '') && word(1) === 'un' && word(2) === 'pointeur') {
    instruction = declaration(word(0) === 'crée');
  } else if (word(0) === 'affecte' && address(1)) instruction = assignAddress();
  else if (word(0) === 'affiche' && pointed(1)) instruction = display();
  else if (word(0) === 'affecte' && word(1) === 'la' && word(2) === 'valeur' && word(4) === 'à' && pointed(5)) {
    instruction = assignInteger();
  } else if (word(0) === 'affecte' && word(1) === 'à' && pointed(2)) instruction = assignExpression();
  else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction pointeur analysée absente.');
  return { status: 'recognized', instruction };
}
