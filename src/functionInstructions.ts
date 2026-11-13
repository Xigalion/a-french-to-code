import type { Diagnostic, SourceRange } from './translate.ts';
import { parseExpression } from './expression.ts';
import type { Expression } from './expression.ts';
import { parseNumericExpression } from './numericExpression.ts';
import type { NumericExpression, NumericType, NameValidator } from './numericExpression.ts';

export type ReturnType = 'void' | NumericType;
export type Parameter = { type: NumericType; name: string };
/** Documented bounds of the two lists. They are not reset between items. */
export const MAX_PARAMETERS = 16;
export const MAX_ARGUMENTS = 16;
/** Ranges are kept so the passive pedagogical channel can point at the exact
 * words of the sentence, as every other information entry does.
 */
export type FunctionInstruction =
  | { kind: 'FUNC_DEF'; parameters: { returnType: ReturnType; name: string; nameRange: SourceRange; params: Parameter[] } }
  | { kind: 'CALL'; parameters: { name: string; nameRange: SourceRange; args: NumericExpression[] } }
  | { kind: 'CALL_ASSIGN'; parameters: { target: string; name: string; nameRange: SourceRange; args: NumericExpression[] } }
  | { kind: 'RETURN'; parameters: { keywordRange: SourceRange } }
  | { kind: 'RETURN_INT'; parameters: { value: string; keywordRange: SourceRange } }
  | { kind: 'RETURN_EXPRESSION'; parameters: { expression: Expression; keywordRange: SourceRange } }
  | { kind: 'RETURN_NUMERIC'; parameters: { expression: NumericExpression; keywordRange: SourceRange } };

type Token = { text: string; range: { start: number; end: number } };
type Analysis = { status: 'recognized'; instruction: FunctionInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

/** Only the two new prefixes are intercepted; every historical branch stays
 * untouched. « Crée la fonction principale. » keeps its own historical rule.
 */
export function analyzeFunctionInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  // Both apostrophe characters are the same character for a reader; only the
  // keyboard layout decides which one is typed.
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase().replace(/'/gu, '’');
  const definition = word(0) === 'crée' && word(1) === 'une' && word(2) === 'fonction';
  const returning = word(0) === 'retourne';
  const calling = word(0) === 'appelle';
  const assigningCall = word(0) === 'affecte' && word(1) === 'à' && word(3) === 'le'
    && word(4) === 'résultat' && word(5) === 'de' && word(6) === 'l’appel';
  if (!definition && !returning && !calling && !assigningCall) return undefined;
  const budget = { count: 0 };
  let i = 0;
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, token?: Token): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range: token?.range ?? { start: end, end } };
    return undefined;
  }
  function expect(expected: string, code: Diagnostic['code'] = 'INCOMPLETE_INSTRUCTION',
    message = `Instruction incomplète : « ${expected} » attendu.`): boolean {
    const token = tokens[i];
    if (!token) { fail(code, message); return false; }
    if (word(i) !== expected) { fail('UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', token); return false; }
    i++;
    return true;
  }
  function finish(): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { text: '', range: { start: extra.range.start, end } });
    return false;
  }
  /** One quoted expression, with the optional attached period handled here. */
  function quoted(): { opening: number; closing: number } | undefined {
    const token = tokens[i];
    if (!token) return fail('MISSING_EXPRESSION', 'Il manque l’expression à retourner.');
    const opening = token.range.start;
    if (source.charAt(opening) !== '"') return fail('MISSING_EXPRESSION_DELIMITER',
      'Il manque le guillemet ouvrant de l’expression.', { text: '', range: { start: opening, end: opening } });
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION',
      'Il manque le guillemet fermant de l’expression.', { text: '', range: { start: opening, end } });
    let suffixEnd = source.length;
    while (suffixEnd > closing && /[ \t]/u.test(source.charAt(suffixEnd - 1))) suffixEnd--;
    if (suffixEnd === closing + 2 && source.charAt(closing + 1) === '.') suffixEnd--;
    let position = closing + 1;
    while (position < suffixEnd && /[ \t]/u.test(source.charAt(position))) position++;
    if (position < suffixEnd) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.',
      { text: '', range: { start: position, end: suffixEnd } });
    return { opening, closing };
  }
  function returnType(): ReturnType | undefined {
    const first = tokens[i];
    if (!first) return fail('MISSING_NUMERIC_TYPE', 'Il manque le type de retour.');
    let text = word(i)!;
    let last = first;
    i++;
    while (['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double', 'char', 'void'].includes(word(i) ?? '')) {
      last = tokens[i++]!;
      text += ' ' + last.text.toLowerCase();
    }
    if (['int', 'unsigned int', 'float', 'double', 'char'].includes(text)) return text as NumericType;
    return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type de retour n’est pas pris en charge.',
      { text, range: { start: first.range.start, end: last.range.end } });
  }
  /** « et prend un {type} nommé {nom} » repeated, joined by « et ». Each item
   * is written in full: no type is shared between two parameters, and no
   * parameter is ever invented.
   */
  function parameterList(): Parameter[] | undefined {
    const params: Parameter[] = [];
    if (!tokens[i]) return params;
    if (!expect('et', 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.')) return undefined;
    if (!expect('prend', 'INCOMPLETE_INSTRUCTION', 'Il manque la description des paramètres.')) return undefined;
    for (;;) {
      if (!expect('un', 'MISSING_NUMERIC_TYPE', 'Il manque le type du paramètre.')) return undefined;
      const type = parameterType();
      if (!type) return undefined;
      if (!expect('nommé', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du paramètre.')) return undefined;
      const token = tokens[i];
      if (!token) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom du paramètre.');
      diagnostic = validateName(token);
      if (diagnostic) return undefined;
      if (params.some(previous => previous.name === token.text)) {
        return fail('DUPLICATE_PARAMETER_NAME', `Le nom de paramètre « ${token.text} » est déjà utilisé dans cette liste.`, token);
      }
      params.push({ type, name: token.text });
      if (params.length > MAX_PARAMETERS) return fail('TOO_MANY_PARAMETERS',
        `Cette liste dépasse les ${MAX_PARAMETERS} paramètres pris en charge.`, token);
      i++;
      if (word(i) !== 'et') return params;
      i++;
    }
  }
  function parameterType(): NumericType | undefined {
    const first = tokens[i];
    if (!first || word(i) === 'nommé') return fail('MISSING_NUMERIC_TYPE', 'Il manque le type du paramètre.',
      first ? { text: '', range: { start: first.range.start, end: first.range.start } } : undefined);
    let text = word(i)!;
    let last = first;
    i++;
    while (['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double', 'char', 'void'].includes(word(i) ?? '')) {
      last = tokens[i++]!;
      text += ' ' + last.text.toLowerCase();
    }
    if (['int', 'unsigned int', 'float', 'double', 'char'].includes(text)) return text as NumericType;
    return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type de paramètre n’est pas pris en charge.',
      { text, range: { start: first.range.start, end: last.range.end } });
  }
  /** « avec "{expr}" et "{expr}" » repeated. All argument expressions share
   * one token budget, so splitting one across arguments cannot bypass it.
   */
  function argumentList(): NumericExpression[] | undefined {
    const args: NumericExpression[] = [];
    if (!tokens[i]) return args;
    if (!expect('avec', 'UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.')) return undefined;
    for (;;) {
      const token = tokens[i];
      if (!token) return fail('MISSING_EXPRESSION', 'Il manque l’argument de l’appel.');
      const opening = token.range.start;
      if (source.charAt(opening) !== '"') return fail('MISSING_EXPRESSION_DELIMITER',
        'Il manque le guillemet ouvrant de l’argument.', { text: '', range: { start: opening, end: opening } });
      const closing = source.indexOf('"', opening + 1);
      if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION',
        'Il manque le guillemet fermant de l’argument.', { text: '', range: { start: opening, end } });
      const parsed = parseNumericExpression(source, opening + 1, closing, validateName, 'Il manque l’argument de l’appel.', budget);
      if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
      args.push(parsed.expression);
      if (args.length > MAX_ARGUMENTS) return fail('TOO_MANY_ARGUMENTS',
        `Cet appel dépasse les ${MAX_ARGUMENTS} arguments pris en charge.`, token);
      // Advance past the token that contains the closing quote.
      while (tokens[i] && tokens[i]!.range.start <= closing) i++;
      if (word(i) !== 'et') return args;
      i++;
    }
  }
  function analyze(): FunctionInstruction | undefined {
    if (assigningCall) {
      i = 2;
      const targetToken = tokens[i];
      if (!targetToken) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom du résultat.');
      diagnostic = validateName(targetToken);
      if (diagnostic) return undefined;
      i = 7;
      if (!expect('de', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom de la fonction à appeler.')) return undefined;
      const calledToken = tokens[i];
      if (!calledToken) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la fonction à appeler.');
      diagnostic = validateName(calledToken);
      if (diagnostic) return undefined;
      i++;
      const args = argumentList();
      if (!args) return undefined;
      return finish() ? { kind: 'CALL_ASSIGN', parameters: { target: targetToken.text, name: calledToken.text,
        nameRange: { ...calledToken.range }, args } } : undefined;
    }
    if (calling) {
      i = 1;
      const nameToken = tokens[i];
      if (!nameToken) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la fonction à appeler.');
      diagnostic = validateName(nameToken);
      if (diagnostic) return undefined;
      i++;
      const args = argumentList();
      if (!args) return undefined;
      return finish() ? { kind: 'CALL', parameters: { name: nameToken.text, nameRange: { ...nameToken.range }, args } } : undefined;
    }
    if (definition) {
      i = 3;
      if (!expect('nommée', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom de la fonction.')) return undefined;
      const nameToken = tokens[i];
      if (!nameToken) return fail('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la fonction.');
      diagnostic = validateName(nameToken);
      if (diagnostic) return undefined;
      i++;
      if (!expect('qui', 'INCOMPLETE_INSTRUCTION', 'Il manque la description du retour de la fonction.')) return undefined;
      // « ne retourne rien » and « retourne un {type} » are the only two forms.
      if (word(i) === 'ne') {
        i++;
        if (!expect('retourne') || !expect('rien')) return undefined;
        const voidParams = parameterList();
        return voidParams && finish()
          ? { kind: 'FUNC_DEF', parameters: { returnType: 'void', name: nameToken.text, nameRange: { ...nameToken.range }, params: voidParams } }
          : undefined;
      }
      if (!expect('retourne', 'INCOMPLETE_INSTRUCTION', 'Il manque la description du retour de la fonction.')) return undefined;
      if (!expect('un', 'MISSING_NUMERIC_TYPE', 'Il manque le type de retour.')) return undefined;
      const type = returnType();
      if (!type) return undefined;
      const params = parameterList();
      return params && finish()
        ? { kind: 'FUNC_DEF', parameters: { returnType: type, name: nameToken.text, nameRange: { ...nameToken.range }, params } }
        : undefined;
    }
    i = 1;
    const keywordRange = { ...tokens[0]!.range };
    if (!tokens[i]) return { kind: 'RETURN', parameters: { keywordRange } };
    if (word(i) === 'la') {
      i++;
      if (!expect('valeur', 'INCOMPLETE_INSTRUCTION', 'Il manque la valeur à retourner.')) return undefined;
      const value = tokens[i];
      if (!value) return fail('INCOMPLETE_INSTRUCTION', 'Il manque la valeur à retourner.');
      if (!/^(?:0|-?[1-9][0-9]*)$/u.test(value.text)) return fail('INVALID_INTEGER',
        'Un entier décimal sans signe + ni zéro initial est attendu.', value);
      i++;
      return finish() ? { kind: 'RETURN_INT', parameters: { value: value.text, keywordRange } } : undefined;
    }
    if (!expect('le', 'UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.')) return undefined;
    if (!expect('résultat', 'INCOMPLETE_INSTRUCTION', 'Il manque l’expression à retourner.')) return undefined;
    const numeric = word(i) === 'numérique';
    if (numeric) i++;
    if (!expect('de', 'INCOMPLETE_INSTRUCTION', 'Il manque l’expression à retourner.')) return undefined;
    const part = quoted();
    if (!part) return undefined;
    if (numeric) {
      const parsed = parseNumericExpression(source, part.opening + 1, part.closing, validateName, 'Il manque l’expression à retourner.');
      if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
      return { kind: 'RETURN_NUMERIC', parameters: { expression: parsed.expression, keywordRange } };
    }
    const parsed = parseExpression(source, part.opening + 1, part.closing, validateName);
    if (parsed.status === 'rejected') { diagnostic = parsed.diagnostic; return undefined; }
    return { kind: 'RETURN_EXPRESSION', parameters: { expression: parsed.expression, keywordRange } };
  }
  const instruction = analyze();
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction de fonction analysée absente.');
  return { status: 'recognized', instruction };
}
