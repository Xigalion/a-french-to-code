import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';

const phrase = expression => `Affecte à resultat le résultat de "${expression}".`;
for (const { source, result } of JSON.parse(readFileSync(new URL('./lot5-compatibility.json', import.meta.url), 'utf8'))) {
  test(`lot 6 non-régression exacte : ${JSON.stringify(source)}`, () => assert.deepEqual(translate(source), result));
}
const expressions = [
  ['a + b', '(a + b)'], ['a - b', '(a - b)'], ['a * b', '(a * b)'], ['a / b', '(a / b)'], ['a % b', '(a % b)'],
  ['-a', '(-a)'], ['-(a + b)', '(-(a + b))'], ['a * -b', '(a * (-b))'],
  ['2 + 3 * 4', '(2 + (3 * 4))'], ['(2 + 3) * 4', '((2 + 3) * 4)'],
  ['20 / 3 / 2', '((20 / 3) / 2)'], ['20 / (3 / 2)', '(20 / (3 / 2))'],
  ['10 - 3 - 2', '((10 - 3) - 2)'], ['10 - (3 - 2)', '(10 - (3 - 2))'],
  ['0', '0'], ['-0', '(-0)'], ['a', 'a'], ['resultat + 1', '(resultat + 1)'],
  ['7 / 3', '(7 / 3)'], ['7 % 3', '(7 % 3)'], ['-7 / 3', '((-7) / 3)'], ['-7 % 3', '((-7) % 3)'],
  ['7 / -3', '(7 / (-3))'], ['7 % -3', '(7 % (-3))'],
  ['0 / 1', '(0 / 1)'], ['0 % -1', '(0 % (-1))'], ['10 / 0', '(10 / 0)'], ['10 % 0', '(10 % 0)'],
  ['absent + Inconnu', '(absent + Inconnu)'], ['9'.repeat(4096), '9'.repeat(4096)],
];
for (const [expression, expected] of expressions) {
  for (const source of [phrase(expression), phrase(expression).slice(0, -1),
    `\t AFFeCTE\t À\t Age_2  LE\t RÉSULTAT DE " ${expression} \t". \t`]) {
    test(`lot 6 traduit exactement ${JSON.stringify(source.slice(0, 100))}`, () => {
      const result = translate(source);
      assert.equal(result.status, 'translated', JSON.stringify(result));
      assert.equal(result.source.text, source);
      assert.equal(result.instruction.kind, 'ASSIGN_EXPRESSION');
      const name = source.includes('Age_2') ? 'Age_2' : 'resultat';
      assert.equal(result.instruction.parameters.name, name);
      assert.deepEqual(result.fragments, [{ id: 'fragment-1', role: 'primary', comment: '// ' + source,
        code: `${name} = ${expected};\n`, text: `// ${source}\n${name} = ${expected};\n` }]);
      assert.deepEqual(result.diagnostics, []);
      assert.deepEqual(translate(source), result);
      assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    });
  }
}
const diagnostics = [
  ['Affecte à.', 'INCOMPLETE_INSTRUCTION', 'Il manque le nom du résultat.', 9, 9],
  ['Affecte à resultat le résultat de.', 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.', 33, 33],
  [phrase(''), 'MISSING_EXPRESSION', 'Il manque l’expression à calculer.', 35, 35],
  ['Affecte à resultat le résultat de a + b.', 'MISSING_EXPRESSION_DELIMITER', 'Il manque le guillemet ouvrant de l’expression.', 34, 34],
  ['Affecte à resultat le résultat de "a +', 'UNTERMINATED_EXPRESSION', 'Il manque le guillemet fermant de l’expression.', 34, 38],
];
for (const [source, code, message, start, end] of diagnostics) {
  test(`lot 6 enveloppe incomplète ${JSON.stringify(source)}`, () => {
    assert.deepEqual(translate(source), { status: 'rejected', source: { text: source }, diagnostics: [{
      code, category: 'understanding', severity: 'error', message, range: { start, end },
    }] });
  });
}
for (const [expression, code, token] of [
  ['a +', 'MISSING_OPERAND', ''], ['a b', 'MISSING_OPERATOR', 'b'],
  ['(a + b', 'MISSING_CLOSING_PARENTHESIS', ''], ['a + b)', 'UNEXPECTED_CLOSING_PARENTHESIS', ')'],
  ['a == b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '=='], ['a ** b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '**'],
  ['a + 😀', 'INVALID_EXPRESSION_TOKEN', '😀'], ['a + \ud800', 'INVALID_EXPRESSION_TOKEN', '\ud800'],
  ['a + 020', 'INVALID_EXPRESSION_TOKEN', '020'], ['a + 0x10', 'INVALID_EXPRESSION_TOKEN', '0x10'],
  ['a + 12age', 'INVALID_EXPRESSION_TOKEN', '12age'], ['a + 1.5', 'INVALID_EXPRESSION_TOKEN', '1.5'],
  ['a + 1e3', 'INVALID_EXPRESSION_TOKEN', '1e3'], ['f(a)', 'MISSING_OPERATOR', '('],
  ['a[0]', 'INVALID_EXPRESSION_TOKEN', '['], ['a; b=2', 'INVALID_EXPRESSION_TOKEN', ';'],
  ['a \\ b', 'INVALID_EXPRESSION_TOKEN', '\\'], ['a // b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '//'],
]) {
  test(`lot 6 diagnostic UTF-16 sans fragment : ${JSON.stringify(expression)}`, () => {
    const source = phrase(expression);
    const result = translate(source);
    assert.equal(result.status, 'rejected');
    assert.deepEqual(Object.keys(result).sort(), ['diagnostics', 'source', 'status']);
    assert.equal(result.diagnostics[0].code, code);
    const start = token ? source.indexOf(token, source.indexOf('"') + 1) : source.lastIndexOf('"');
    const empty = ['MISSING_OPERATOR', 'MISSING_OPERAND', 'MISSING_CLOSING_PARENTHESIS'].includes(code);
    assert.deepEqual(result.diagnostics[0].range, { start, end: start + (empty ? 0 : token.length) });
    assert.deepEqual(translate(source), result);
  });
}
const keywords = `auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Alignas _Alignof _Atomic _Bool _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local`.split(' ');
for (const name of [...keywords, '_age', '2age', 'âge', 'αge', 'Age😀']) {
  for (const role of ['destination', 'operand']) {
    test(`lot 6 identifiant ${role} : ${name}`, () => {
      const source = role === 'destination' ? `Affecte à ${name} le résultat de "a".` : phrase(`${name} + a`);
      const result = translate(source);
      assert.equal(result.status, 'rejected');
      const expected = keywords.includes(name) ? 'C_KEYWORD_IDENTIFIER' : role === 'operand' && /^[0-9]/u.test(name) ? 'INVALID_EXPRESSION_TOKEN' : 'INVALID_IDENTIFIER';
      assert.equal(result.diagnostics[0].code, expected);
      const start = source.indexOf(name, role === 'destination' ? 0 : source.indexOf('"'));
      assert.deepEqual(result.diagnostics[0].range, { start, end: start + name.length });
    });
  }
}
for (const suffix of [' .', '..', ' ensuite.', ' // commentaire', '\\', ' 😀']) {
  test(`lot 6 suffixe refusé entier ${JSON.stringify(suffix)}`, () => {
    const base = phrase('a').slice(0, -1);
    const source = base + suffix;
    const result = translate(source);
    assert.equal(result.status, 'rejected');
    assert.equal(result.diagnostics[0].code, 'UNEXPECTED_TEXT');
    const start = base.length + (suffix.startsWith(' ') ? 1 : 0);
    assert.deepEqual(result.diagnostics[0].range, { start, end: source.length });
  });
}
for (const separator of ['\n', '\r\n', '\v', '\f', '\u00a0', '\ufeff', '\u2028', '\u2029']) {
  test(`lot 6 séparateur interdit dans l'expression ${JSON.stringify(separator)}`, () => {
    const source = phrase(`a${separator}+ b`);
    const result = translate(source);
    assert.equal(result.diagnostics[0].code, 'INVALID_SEPARATOR');
    assert.deepEqual(result.diagnostics[0].range, { start: source.indexOf(separator), end: source.indexOf(separator) + 1 });
  });
}
for (const source of ['Affecte a resultat le résultat de "a".', 'Affecte à resultat le re\u0301sultat de "a".', 'Affecte à resultat le resultat de "a".']) {
  test(`lot 6 accents non réparés : ${source}`, () => assert.equal(translate(source).diagnostics[0].code, 'UNKNOWN_FORMULATION'));
}
for (const eol of ['\n', '\r\n']) {
  test(`lot 6 placement, curseur et contrôle canonique ${JSON.stringify(eol)}`, () => {
    const prefix = '// é😀' + eol + 'int main(void) {' + eol;
    let document = { id: 'calculator.c', revision: 1, text: prefix + '    ' + eol + '}' + eol };
    let cursorOffset = prefix.length + 4;
    for (const [expression, expected] of expressions.slice(0, 8)) {
      const source = phrase(expression);
      const translation = translate(source);
      const request = { document, cursorOffset, translation };
      const result = planPlacement(request);
      assert.equal(result.status, 'planned', JSON.stringify(result));
      const edit = result.plan.edits[0];
      const text = document.text.slice(0, edit.range.start) + edit.newText + document.text.slice(edit.range.end);
      assert.ok(text.includes('    // ' + source + eol + '    resultat = ' + expected + ';' + eol));
      assert.equal(text.slice(result.plan.cursorAfter), eol + '}' + eol);
      assert.ok(!text.includes('#include'));
      for (const tamper of [value => { value.instruction.parameters.expression.range.start++; },
        value => { value.fragments[0].code += 'int injection;\n'; }, value => { value.fragments[0].comment = '// autre'; }]) {
        const altered = structuredClone(translation);
        tamper(altered);
        assert.equal(planPlacement({ ...request, translation: altered }).diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
      }
      document = { ...document, revision: document.revision + 1, text };
      cursorOffset = result.plan.cursorAfter;
    }
  });
}
test('la limite de complexité conserve la plage dans la phrase complète', () => {
  const expression = Array(513).fill('a').join('+');
  const source = phrase(expression);
  const result = translate(source);
  assert.equal(result.diagnostics[0].code, 'EXPRESSION_TOO_COMPLEX');
  const start = source.indexOf('"') + 1 + 1024;
  assert.deepEqual(result.diagnostics[0].range, { start, end: start + 1 });
});
