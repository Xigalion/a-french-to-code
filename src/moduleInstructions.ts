import type { Diagnostic, SourceRange } from './translate.ts';
import type { NumericType } from './numericExpression.ts';

/** A header guard is two instructions, not one block: the student writes the
 * opening and the closing separately, and sees that they are two directives. */
export type ModuleInstruction =
  | { kind: 'INCLUDE_LOCAL'; parameters: { path: string; pathRange: SourceRange } }
  | { kind: 'GUARD_OPEN'; parameters: { macro: string; macroRange: SourceRange } }
  | { kind: 'GUARD_CLOSE'; parameters: Record<string, never> }
  | { kind: 'LINKAGE_DECL'; parameters: { linkage: 'extern' | 'static'; type: NumericType; name: string; nameRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: ModuleInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

const SCALARS = ['int', 'unsigned int', 'float', 'double', 'char'];
const TYPE_WORDS = ['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'];
const UNKNOWN = 'Cette formulation n’appartient pas au catalogue C-A.';

function same(expected: string, written: string): boolean {
  return expected === written.toLowerCase().replace(/'/gu, '’');
}

/** Only the four new fixed prefixes are intercepted. `Inclue la bibliothèque
 * …` is untouched: a local header is a different form, with quotes, and the
 * historical rule keeps its own grammar and its frozen message.
 */
export function analyzeModuleInstruction(tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
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

  let instruction: ModuleInstruction | undefined;
  if (word(0) === 'inclue' && word(1) === 'l’en-tête' || (word(0) === 'inclue' && word(1) === "l'en-tête")) {
    const token = tokens[2];
    if (!token) {
      fail('INCOMPLETE_INSTRUCTION', 'Un chemin entre guillemets ASCII est attendu.', { start: end, end });
    } else if (!/^"[^"<>\\\r\n]+"$/u.test(token.text)) {
      // A local header path is deliberately narrow: no escape, no delimiter
      // inside, no space. It is what `#include "…"` may hold without the
      // placement recognizer losing its grip on the line.
      fail('UNSUPPORTED_LOCAL_HEADER',
        'Un chemin d’en-tête local s’écrit entre guillemets ASCII, sans espace, sans échappement.', token.range);
    } else if (finish(3)) {
      instruction = { kind: 'INCLUDE_LOCAL', parameters: { path: token.text.slice(1, -1), pathRange: { ...token.range } } };
    }
  } else if (word(0) === 'ouvre' && word(1) === 'la' && word(2) === 'protection') {
    if (expect(3, 'd’en-tête', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « d’en-tête » attendu.')
      && expect(4, 'nommée', 'MISSING_GUARD_MACRO', 'Il manque le nom de la protection.')) {
      const macro = tokens[5];
      if (!macro) fail('MISSING_GUARD_MACRO', 'Il manque le nom de la protection.', { start: end, end });
      // A guard macro is written in upper case by convention, and C-A requires
      // it: a lower-case name would collide with ordinary identifiers.
      else if (!/^[A-Z][A-Z0-9_]*$/u.test(macro.text)) {
        fail('INVALID_GUARD_MACRO',
          'Le nom d’une protection s’écrit en majuscules ASCII, chiffres et soulignements, et commence par une lettre.',
          macro.range);
      } else if (finish(6)) {
        instruction = { kind: 'GUARD_OPEN', parameters: { macro: macro.text, macroRange: { ...macro.range } } };
      }
    }
  } else if (word(0) === 'ferme' && word(1) === 'la' && word(2) === 'protection') {
    if (expect(3, 'd’en-tête', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « d’en-tête » attendu.') && finish(4)) {
      instruction = { kind: 'GUARD_CLOSE', parameters: {} };
    }
  } else if (word(0) === 'déclare' && word(1) === 'la' && word(2) === 'variable'
    && (word(3) === 'externe' || word(3) === 'interne')) {
    const linkage = word(3) === 'externe' ? 'extern' : 'static';
    if (expect(4, 'de', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « de type » attendu.')
      && expect(5, 'type', 'MISSING_NUMERIC_TYPE', 'Il manque le type de la variable.')) {
      const first = tokens[6];
      if (!first || same('nommée', first.text)) {
        const at = first?.range.start ?? end;
        fail('MISSING_NUMERIC_TYPE', 'Il manque le type de la variable.', { start: at, end: at });
      } else {
        let text = first.text.toLowerCase();
        let last = first;
        let i = 7;
        while (TYPE_WORDS.includes(word(i) ?? '')) { last = tokens[i++]!; text += ' ' + last.text.toLowerCase(); }
        if (!SCALARS.includes(text)) {
          fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.',
            { start: first.range.start, end: last.range.end });
        } else if (expect(i, 'nommée', 'INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « nommée » attendu.')) {
          const name = tokens[i + 1];
          if (!name) fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la variable.', { start: end, end });
          else {
            diagnostic = validateName(name);
            if (!diagnostic && finish(i + 2)) {
              instruction = { kind: 'LINKAGE_DECL', parameters: { linkage, type: text as NumericType,
                name: name.text, nameRange: { ...name.range } } };
            }
          }
        }
      }
    }
  } else return undefined;

  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction de module analysée absente.');
  return { status: 'recognized', instruction };
}
