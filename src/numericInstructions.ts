import type { Diagnostic } from './translate.ts';
import { parseNumericExpression } from './numericExpression.ts';
import type { NumericType, NumericExpression, NameValidator } from './numericExpression.ts';

export type NumericInstruction =
  | { kind: 'NUMERIC_DECL'; parameters: { type: NumericType; name: string } }
  | { kind: 'NUMERIC_INIT'; parameters: { type: NumericType; name: string; expression: NumericExpression } }
  | { kind: 'NUMERIC_ASSIGN'; parameters: { name: string; expression: NumericExpression } }
  | { kind: 'NUMERIC_PRINT'; parameters: { name: string; format: 'unsigned' } | { name: string; format: 'fixed' | 'scientific'; precision: string } };
type Token = { text: string; range: { start: number; end: number } };
type Analysis = { status: 'recognized'; instruction: NumericInstruction } | { status: 'rejected'; diagnostic: Diagnostic };

/** Only explicit new prefixes are intercepted; all historical branches stay intact. */
export function analyzeNumericInstruction(source: string, tokens: Token[], end: number, validateName: NameValidator): Analysis | undefined {
  const word = (index: number): string | undefined => tokens[index]?.text.toLowerCase();
  const declaration = ['déclare', 'crée'].includes(word(0) ?? '') && word(1) === 'une' && word(2) === 'variable';
  const assignment = word(0) === 'affecte' && word(1) === 'à' && word(3) === 'le' && word(4) === 'résultat' && word(5) === 'numérique';
  const display = word(0) === 'affiche' && word(2) === 'en' && (word(3) === 'notation' || (word(3) === 'décimal' && word(4) === 'non'));
  if (!declaration && !assignment && !display) return undefined;
  let i = 0;
  let diagnostic: Diagnostic | undefined;
  function fail(code: Diagnostic['code'], message: string, token?: Token): undefined {
    diagnostic ??= { code, category: 'understanding', severity: 'error', message, range: token?.range ?? { start: end, end } };
    return undefined;
  }
  function absent(code: Diagnostic['code'], message: string, token = tokens[i]): undefined {
    const at = token?.range.start ?? end;
    return fail(code, message, { text: '', range: { start: at, end: at } });
  }
  function expect(expected: string, code: Diagnostic['code'] = 'INCOMPLETE_INSTRUCTION', message = `Instruction incomplète : « ${expected} » attendu.`): boolean {
    const token = tokens[i];
    if (!token) { absent(code, message); return false; }
    if (word(i) !== expected) { fail('UNKNOWN_FORMULATION', 'Cette formulation n’appartient pas au catalogue C-A.', token); return false; }
    i++;
    return true;
  }
  function name(): string | undefined {
    const token = tokens[i];
    if (!token) return absent('INCOMPLETE_INSTRUCTION', 'Il manque le nom de la variable.');
    diagnostic = validateName(token);
    i++;
    return diagnostic ? undefined : token.text;
  }
  function numericType(): NumericType | undefined {
    const first = tokens[i];
    if (!first || word(i) === 'nommée') return absent('MISSING_NUMERIC_TYPE', 'Il manque le type numérique.');
    let text = word(i)!;
    let last = first;
    i++;
    while (['unsigned', 'signed', 'short', 'long', 'int', 'float', 'double'].includes(word(i) ?? '')) {
      last = tokens[i++]!;
      text += ' ' + last.text.toLowerCase();
    }
    if (['int', 'unsigned int', 'float', 'double', 'char'].includes(text)) return text as NumericType;
    return fail('UNSUPPORTED_NUMERIC_TYPE', 'Ce type numérique n’est pas pris en charge.', { text, range: { start: first.range.start, end: last.range.end } });
  }
  function finish(): boolean {
    const extra = tokens[i];
    if (!extra) return true;
    fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { text: '', range: { start: extra.range.start, end } });
    return false;
  }
  function expression(): NumericExpression | undefined {
    const opening = tokens[i]?.range.start ?? end;
    if (opening === end) return absent('MISSING_EXPRESSION', 'Il manque l’expression à calculer.');
    if (source.charAt(opening) !== '"') return absent('MISSING_EXPRESSION_DELIMITER', 'Il manque le guillemet ouvrant de l’expression.');
    const closing = source.indexOf('"', opening + 1);
    if (closing === -1 || closing >= end) return fail('UNTERMINATED_EXPRESSION', 'Il manque le guillemet fermant de l’expression.',
      { text: '', range: { start: opening, end } });
    const result = parseNumericExpression(source, opening + 1, closing, validateName);
    if (result.status === 'rejected') { diagnostic = result.diagnostic; return undefined; }
    let suffixEnd = source.length;
    while (suffixEnd > closing && /[ \t]/u.test(source.charAt(suffixEnd - 1))) suffixEnd--;
    if (suffixEnd === closing + 2 && source.charAt(closing + 1) === '.') suffixEnd--;
    let position = closing + 1;
    while (position < suffixEnd && /[ \t]/u.test(source.charAt(position))) position++;
    if (position < suffixEnd) return fail('UNEXPECTED_TEXT', 'Ce texte supplémentaire n’est pas accepté.', { text: '', range: { start: position, end: suffixEnd } });
    return result.expression;
  }
  function analyze(): NumericInstruction | undefined {
    if (declaration) {
      i = 3;
      if (!tokens[i] || word(i) === 'nommée') return absent('MISSING_NUMERIC_TYPE', 'Il manque le type numérique.');
      if (!expect('de')) return undefined;
      if (!expect('type', 'MISSING_NUMERIC_TYPE', 'Il manque le type numérique.')) return undefined;
      const type = numericType();
      if (!type || !expect('nommée', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom de la variable.')) return undefined;
      const target = name();
      if (!target) return undefined;
      if (word(0) === 'déclare') return finish() ? { kind: 'NUMERIC_DECL', parameters: { type, name: target } } : undefined;
      for (const expected of ['avec', 'le', 'résultat', 'de']) {
        if (!expect(expected, 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.')) return undefined;
      }
      const value = expression();
      return value && { kind: 'NUMERIC_INIT', parameters: { type, name: target, expression: value } };
    }
    if (assignment) {
      i = 2;
      const target = name();
      if (!target) return undefined;
      for (const expected of ['le', 'résultat', 'numérique', 'de']) {
        if (!expect(expected, 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.')) return undefined;
      }
      const value = expression();
      return value && { kind: 'NUMERIC_ASSIGN', parameters: { name: target, expression: value } };
    }
    i = 1;
    const target = name();
    if (!target) return undefined;
    i = 4;
    if (word(3) === 'décimal') {
      i = 5;
      if (!expect('signé', 'INCOMPLETE_INSTRUCTION', 'Il manque la qualification du format entier.')) return undefined;
      return finish() ? { kind: 'NUMERIC_PRINT', parameters: { name: target, format: 'unsigned' } } : undefined;
    }
    if (!tokens[i]) return absent('MISSING_DISPLAY_FORMAT', 'Il manque le format d’affichage.');
    const notation = word(i++);
    if (notation !== 'fixe' && notation !== 'scientifique') return fail('UNSUPPORTED_DISPLAY_FORMAT', 'Ce format d’affichage n’est pas pris en charge.', tokens[i - 1]);
    if (!expect('avec', 'MISSING_DISPLAY_PRECISION', 'Il manque la précision d’affichage.')) return undefined;
    const precision = tokens[i];
    if (!precision || word(i) === 'décimales') return absent('MISSING_DISPLAY_PRECISION', 'Il manque la précision d’affichage.');
    if (!/^(?:[0-9]|1[0-9]|20)$/u.test(precision.text)) return fail('INVALID_DISPLAY_PRECISION',
      'La précision d’affichage doit être un entier entre 0 et 20.', precision);
    i++;
    if (!expect('décimales', 'INCOMPLETE_INSTRUCTION', 'Il manque l’unité de précision d’affichage.')) return undefined;
    return finish() ? { kind: 'NUMERIC_PRINT', parameters: { name: target, format: notation === 'fixe' ? 'fixed' : 'scientific', precision: precision.text } } : undefined;
  }
  const instruction = analyze();
  if (diagnostic) return { status: 'rejected', diagnostic };
  if (!instruction) throw new Error('Invariant interne : instruction numérique analysée absente.');
  return { status: 'recognized', instruction };
}
