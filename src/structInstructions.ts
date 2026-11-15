import type { Diagnostic, SourceRange } from './translate.ts';
import { parseNumericExpression } from './numericExpression.ts';
import type { NumericExpression, NumericType } from './numericExpression.ts';

/** A field type is either one of the five scalar types already taught, or
 * another structure named by its tag. No bit-field, no anonymous member. */
export type FieldType = { kind: 'scalar'; type: NumericType } | { kind: 'struct'; tag: string };
/** A field may be a pointer to either shape. One level of indirection, as
 * decision D3 of the domain 5 settled, and the star stays on the declarator. */
export type Field = { type: FieldType; pointer: boolean };
/** `objet.champ` or `objet->champ` as the target of an envelope. `arrow` is
 * what the sentence said; no form is ever rewritten into the other. */
export type MemberTarget = { object: string; objectRange: SourceRange; member: string; memberRange: SourceRange; arrow: boolean };

export type StructInstruction =
  | { kind: 'STRUCT_DECL'; parameters: { tag: string; tagRange: SourceRange } }
  | { kind: 'STRUCT_FIELD'; parameters: { type: FieldType; pointer: boolean; name: string; nameRange: SourceRange } }
  | { kind: 'STRUCT_VAR'; parameters: { tag: string; tagRange: SourceRange; name: string; nameRange: SourceRange } }
  | { kind: 'STRUCT_POINTER'; parameters: { tag: string; tagRange: SourceRange; name: string; nameRange: SourceRange } }
  | { kind: 'MEMBER_ASSIGN_INT'; parameters: { target: MemberTarget; value: string } }
  | { kind: 'MEMBER_ASSIGN_CHAR'; parameters: { target: MemberTarget; literal: string; literalRange: SourceRange } }
  | { kind: 'MEMBER_ASSIGN_EXPRESSION'; parameters: { target: MemberTarget; expression: NumericExpression } }
  | { kind: 'MEMBER_PRINT'; parameters: { target: MemberTarget } }
  /** Lot 24: `typedef struct Tag Alias;`. An alias, not a new type, and the
   * tag may be named before the structure is defined — which is exactly what
   * a self-referential structure needs. */
  | { kind: 'TYPE_ALIAS'; parameters: { alias: string; aliasRange: SourceRange; tag: string; tagRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: StructInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const SCALARS = ['int', 'unsigned int', 'float', 'double', 'char'];
const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the eight new fixed prefixes are intercepted, and a sentence whose
 * type is not « structure » is declined untouched, so the numeric and pointer
 * declarations of lots 7 and 17 keep it with their own diagnostics.
 */
export function analyzeStructInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
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
  /** `champ {nom} de {objet}` or `champ {nom} pointé par {objet}`. */
  function target(i: number): { target: MemberTarget; next: number } | undefined {
    const member = identifier(i, 'Il manque le nom du champ.');
    if (!member) return undefined;
    if (word(i + 1) === 'de') {
      const object = identifier(i + 2, 'Il manque le nom de la structure.');
      if (!object) return undefined;
      return { target: { object: object.text, objectRange: { ...object.range },
        member: member.text, memberRange: { ...member.range }, arrow: false }, next: i + 3 };
    }
    if (word(i + 1) === 'pointée' || word(i + 1) === 'pointé') {
      if (!expect(i + 2, 'par', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « par » attendu.')) return undefined;
      const object = identifier(i + 3, 'Il manque le nom du pointeur.');
      if (!object) return undefined;
      return { target: { object: object.text, objectRange: { ...object.range },
        member: member.text, memberRange: { ...member.range }, arrow: true }, next: i + 4 };
    }
    const token = tokens[i + 1];
    return token ? fail('UNKNOWN_FORMULATION', UNKNOWN, token.range)
      : fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » ou « pointé par » attendu.', { start: end, end });
  }
  /** `de type {scalaire}` or `de type structure {tag}`. */
  function fieldType(i: number): { type: FieldType; next: number } | undefined {
    if (!expect(i, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de » attendu.')) return undefined;
    if (!expect(i + 1, 'type', 'MISSING_NUMERIC_TYPE', 'Il manque le type du champ.')) return undefined;
    if (word(i + 2) === 'structure') {
      const tag = identifier(i + 3, 'Il manque le nom de la structure.');
      if (!tag) return undefined;
      return { type: { kind: 'struct', tag: tag.text }, next: i + 4 };
    }
    const first = tokens[i + 2];
    if (!first || same('nommé', first.text) || same('nommée', first.text)) {
      const at = first?.range.start ?? end;
      return fail('MISSING_NUMERIC_TYPE', 'Il manque le type du champ.', { start: at, end: at });
    }
    let text = first.text.toLowerCase();
    let last = first;
    let next = i + 3;
    while (TYPE_WORDS.includes(word(next) ?? '')) { last = tokens[next++]!; text += ' ' + last.text.toLowerCase(); }
    if (!SCALARS.includes(text)) return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
      { start: first.range.start, end: last.range.end });
    return { type: { kind: 'scalar', type: text as NumericType }, next };
  }
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

  let instruction: StructInstruction | undefined;
  if (word(0) === 'déclare' && word(1) === 'une' && word(2) === 'structure') {
    if (!expect(3, 'nommée', 'MISSING_STRUCT_TAG', 'Il manque le nom de la structure.')) return { status: 'rejected', diagnostic: diagnostic! };
    const tag = identifier(4, 'Il manque le nom de la structure.');
    if (tag && finish(5)) instruction = { kind: 'STRUCT_DECL', parameters: { tag: tag.text, tagRange: { ...tag.range } } };
  } else if (word(0) === 'ajoute' && word(1) === 'un' && word(2) === 'champ') {
    // « un champ pointeur de type … » is the self-referential form a linked
    // structure needs; the star belongs to the declarator, not to the type.
    const pointer = word(3) === 'pointeur';
    const read = fieldType(pointer ? 4 : 3);
    if (read) {
      const article = word(read.next);
      if (article !== 'nommé' && article !== 'nommée') {
        const token = tokens[read.next];
        if (token) fail('UNKNOWN_FORMULATION', UNKNOWN, token.range);
        else fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommé » attendu.', { start: end, end });
      } else {
        const name = identifier(read.next + 1, 'Il manque le nom du champ.');
        if (name && finish(read.next + 2)) {
          instruction = { kind: 'STRUCT_FIELD', parameters: { type: read.type, pointer, name: name.text, nameRange: { ...name.range } } };
        }
      }
    }
  } else if (['déclare', 'crée'].includes(word(0) ?? '') && word(1) === 'une' && word(2) === 'variable'
    && word(3) === 'de' && word(4) === 'type' && word(5) === 'structure') {
    const tag = identifier(6, 'Il manque le nom de la structure.');
    if (tag && expect(7, 'nommée', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommée » attendu.')) {
      const name = identifier(8, 'Il manque le nom de la variable.');
      if (name && finish(9)) {
        instruction = { kind: 'STRUCT_VAR', parameters: { tag: tag.text, tagRange: { ...tag.range },
          name: name.text, nameRange: { ...name.range } } };
      }
    }
  } else if (word(0) === 'déclare' && word(1) === 'un' && word(2) === 'pointeur'
    && word(3) === 'de' && word(4) === 'type' && word(5) === 'structure') {
    const tag = identifier(6, 'Il manque le nom de la structure.');
    if (tag && expect(7, 'nommé', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommé » attendu.')) {
      const name = identifier(8, 'Il manque le nom du pointeur.');
      if (name && finish(9)) {
        instruction = { kind: 'STRUCT_POINTER', parameters: { tag: tag.text, tagRange: { ...tag.range },
          name: name.text, nameRange: { ...name.range } } };
      }
    }
  } else if (word(0) === 'affecte' && word(1) === 'la' && word(2) === 'valeur' && word(4) === 'au' && word(5) === 'champ') {
    const value = tokens[3]!;
    if (!/^(?:0|-?[1-9][0-9]*)$/u.test(value.text)) {
      fail('INVALID_INTEGER', 'Un entier décimal sans signe + ni zéro initial est attendu.', value.range);
    } else {
      const read = target(6);
      if (read && finish(read.next)) {
        instruction = { kind: 'MEMBER_ASSIGN_INT', parameters: { target: read.target, value: value.text } };
      }
    }
  } else if (word(0) === 'affecte' && word(1) === 'au' && word(2) === 'champ') {
    const read = target(3);
    if (read) {
      let i = read.next;
      let ok = true;
      for (const expected of ['le', 'résultat', 'numérique', 'de']) {
        if (!expect(i, expected, 'INCOMPLETE_INSTRUCTION', `Instruction incomplète : « ${expected} » attendu.`)) { ok = false; break; }
        i++;
      }
      if (ok) {
        const parsed = expression(i);
        if (parsed) instruction = { kind: 'MEMBER_ASSIGN_EXPRESSION', parameters: { target: read.target, expression: parsed } };
      }
    }
  } else if (word(0) === 'déclare' && word(1) === 'le' && word(2) === 'synonyme') {
    const alias = identifier(3, 'Il manque le nom du synonyme.');
    if (alias && expect(4, 'pour', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « pour la structure » attendu.')
      && expect(5, 'la', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « la structure » attendu.')
      && expect(6, 'structure', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « structure » attendu.')) {
      const tag = identifier(7, 'Il manque le nom de la structure.');
      if (tag && finish(8)) {
        instruction = { kind: 'TYPE_ALIAS', parameters: { alias: alias.text, aliasRange: { ...alias.range },
          tag: tag.text, tagRange: { ...tag.range } } };
      }
    }
  } else if (word(0) === 'affiche' && word(1) === 'le' && word(2) === 'champ') {
    const read = target(3);
    if (read && finish(read.next)) instruction = { kind: 'MEMBER_PRINT', parameters: { target: read.target } };
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction de structure analysée absente.');
  return { status: 'recognized', instruction };
}

/** The C spelling of a member target, written as the sentence asked. */
export function renderMemberTarget(target: MemberTarget): string {
  return target.object + (target.arrow ? '->' : '.') + target.member;
}
