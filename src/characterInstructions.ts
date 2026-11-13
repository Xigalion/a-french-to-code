import type { Diagnostic, SourceRange } from './translate.ts';
import { parseCharacterLiteral } from './characterLiteral.ts';

/** Ranges are kept so the passive pedagogical channel can point at the exact
 * words of the sentence, as every other information entry does.
 */
export type CharacterInstruction =
  | { kind: 'DECL_CHAR'; parameters: { name: string; nameRange: SourceRange } }
  | { kind: 'INIT_CHAR'; parameters: { name: string; literal: string; literalRange: SourceRange } }
  | { kind: 'ASSIGN_CHAR'; parameters: { name: string; literal: string; literalRange: SourceRange } }
  | { kind: 'PRINT_CHAR'; parameters: { name: string; nameRange: SourceRange } };

type Token = { text: string; range: SourceRange };
type NameValidator = (token: Token) => Diagnostic | undefined;
type Analysis = { status: 'recognized'; instruction: CharacterInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

/** Only the four new fixed prefixes are intercepted; every historical branch
 * stays untouched. A character literal is scanned from the raw source rather
 * than from the whitespace tokens, because `' '` is a valid literal that a
 * token split would cut in two.
 */
export function analyzeCharacterInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  if (word(2) !== 'caractère') return undefined;
  const kinds = { déclare: 'DECL_CHAR', crée: 'INIT_CHAR', affecte: 'ASSIGN_CHAR', affiche: 'PRINT_CHAR' } as const;
  const kind = kinds[word(0) as keyof typeof kinds];
  const article = word(0) === 'déclare' || word(0) === 'crée' ? 'un' : 'le';
  if (!kind || word(1) !== article) return undefined;

  let i = 3;
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, range: SourceRange): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range };
    return undefined;
  }
  function expect(expected: string, code: Diagnostic['code'] = 'INCOMPLETE_INSTRUCTION',
    message = `Instruction incomplète : « ${expected} » attendu.`): boolean {
    const token = tokens[i];
    if (!token) { fail(code, message, { start: end, end }); return false; }
    if (word(i) !== expected) { fail('UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', token.range); return false; }
    i++;
    return true;
  }
  function name(message: string): Token | undefined {
    const token = tokens[i];
    if (!token) return fail('INCOMPLETE_INSTRUCTION', message, { start: end, end });
    diagnostic = validateName(token);
    i++;
    return diagnostic ? undefined : token;
  }
  function finish(): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return false;
  }
  /** One raw word after a character literal, where token indices no longer
   * line up because the literal may itself contain a space. */
  function rawWord(position: number): Token | undefined {
    while (position < end && /[ \t]/u.test(source.charAt(position))) position++;
    if (position === end) return undefined;
    const start = position;
    while (position < end && !/[ \t]/u.test(source.charAt(position))) position++;
    return { text: source.slice(start, position), range: { start, end: position } };
  }
  function literal(position: number): { text: string; range: SourceRange; end: number } | undefined {
    const result = parseCharacterLiteral(source, position, end);
    if (result.status === 'rejected') { diagnostic = result.diagnostic; return undefined; }
    return { text: result.literal.text, range: result.literal.range, end: result.end };
  }

  function analyze(): CharacterInstruction | undefined {
    if (kind === 'DECL_CHAR') {
      if (!expect('nommé', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du caractère.')) return undefined;
      const target = name('Il manque le nom du caractère.');
      if (!target) return undefined;
      return finish() ? { kind, parameters: { name: target.text, nameRange: { ...target.range } } } : undefined;
    }
    if (kind === 'PRINT_CHAR') {
      const target = name('Il manque le nom du caractère à afficher.');
      if (!target) return undefined;
      return finish() ? { kind, parameters: { name: target.text, nameRange: { ...target.range } } } : undefined;
    }
    if (kind === 'INIT_CHAR') {
      if (!expect('nommé', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du caractère.')) return undefined;
      const target = name('Il manque le nom du caractère.');
      if (!target) return undefined;
      if (!expect('de', 'MISSING_CHARACTER', 'Il manque le caractère.')) return undefined;
      if (!expect('valeur', 'MISSING_CHARACTER', 'Il manque le caractère.')) return undefined;
      const value = literal(tokens[i - 1]!.range.end);
      if (!value) return undefined;
      const extra = rawWord(value.end);
      if (extra) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
      return { kind, parameters: { name: target.text, literal: value.text, literalRange: value.range } };
    }
    const value = literal(tokens[2]!.range.end);
    if (!value) return undefined;
    const connector = rawWord(value.end);
    if (!connector) return fail('INCOMPLETE_INSTRUCTION', 'Instruction incomplète : « à » attendu.', { start: end, end });
    if (connector.text.toLowerCase() !== 'à') {
      return fail('UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', connector.range);
    }
    const target = rawWord(connector.range.end);
    if (!target) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom du caractère.', { start: end, end });
    diagnostic = validateName(target);
    if (diagnostic) return undefined;
    const extra = rawWord(target.range.end);
    if (extra) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { start: extra.range.start, end });
    return { kind, parameters: { name: target.text, literal: value.text, literalRange: value.range } };
  }

  const instruction = analyze();
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction caractère analysée absente.');
  return { status: 'recognized', instruction };
}
