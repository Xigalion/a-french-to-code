import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { parseNumericExpression, renderNumericExpression } from '../src/numericExpression.ts';
import { planPlacement } from '../src/planPlacement.ts';

const assign = value => `Affecte à r le résultat numérique de "${value}".`;
function success(source, code, kind) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.equal(result.instruction.kind, kind);
  assert.deepEqual(result.diagnostics, []);
  assert.equal(result.source.text, source);
  assert.deepEqual(result.fragments, [{ id: 'fragment-1', role: 'primary', comment: '// ' + source,
    code: code + '\n', text: '// ' + source + '\n' + code + '\n' }]);
  assert.deepEqual(translate(source), result);
  assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
  return result;
}
function rejected(source, code, range, message) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.deepEqual(Object.keys(result).sort(), ['diagnostics', 'source', 'status']);
  assert.equal(result.source.text, source);
  assert.equal(result.diagnostics.length, 1);
  const diagnostic = result.diagnostics[0];
  assert.equal(diagnostic.code, code);
  assert.equal(diagnostic.category, 'understanding');
  assert.equal(diagnostic.severity, 'error');
  if (range) assert.deepEqual(diagnostic.range, range);
  if (message) assert.equal(diagnostic.message, message);
  assert.ok(diagnostic.range.start >= 0 && diagnostic.range.end >= diagnostic.range.start && diagnostic.range.end <= source.length);
  assert.deepEqual(translate(source), result);
  return diagnostic;
}
for (const { source, result } of JSON.parse(readFileSync(new URL('./lot6-compatibility.json', import.meta.url), 'utf8'))) {
  test(`lot 7 compatibilité exacte du lot 6 : ${JSON.stringify(source)}`, () => assert.deepEqual(translate(source), result));
}
for (const [type, value] of [['int', '7'], ['unsigned int', '7u'], ['float', '1.25f'], ['double', '1.25']]) {
  for (const ending of ['', '.']) {
    test(`lot 7 déclaration ${type} ${JSON.stringify(ending)}`, () => {
      const result = success(`Déclare une variable de type ${type} nommée Age_2${ending}`, `${type} Age_2;`, 'NUMERIC_DECL');
      assert.deepEqual(result.instruction.parameters, { type, name: 'Age_2' });
    });
    test(`lot 7 initialisation ${type} ${JSON.stringify(ending)}`, () => {
      const result = success(`Crée une variable de type ${type} nommée age avec le résultat de "${value}"${ending}`, `${type} age = ${value};`, 'NUMERIC_INIT');
      assert.equal(result.instruction.parameters.type, type);
      assert.equal(result.instruction.parameters.expression.value, value);
    });
  }
  test(`lot 7 casse et espaces du type ${type}`, () => {
    success(`\t DÉCLARE\tUNE variable DE TYPE ${type.toUpperCase().replace(' ', '\t')} NOMMÉE Age_2. \t`, `${type} Age_2;`, 'NUMERIC_DECL');
  });
}
const expressions = [
  ['7 / 2', '(7 / 2)'], ['7.0 / 2', '(7.0 / 2)'], ['(double) 7 / 2', '(((double) 7) / 2)'],
  ['(double) (7 / 2)', '((double) (7 / 2))'], ['a + b', '(a + b)'], ['-a', '(-a)'],
  ['-(a + b)', '(-(a + b))'], ['a * -b', '(a * (-b))'], ['a*-b', '(a * (-b))'],
  ['a - -b', '(a - (-b))'], ['- -a', '(-(-a))'], ['2 + 3 * 4', '(2 + (3 * 4))'],
  ['(2 + 3) * 4', '((2 + 3) * 4)'], ['20 / 3 / 2', '((20 / 3) / 2)'],
  ['(int) -3.75', '((int) (-3.75))'], ['(int) 3.75', '((int) 3.75)'],
  ['(unsigned int) -1', '((unsigned int) (-1))'], ['(double) (float) x', '((double) ((float) x))'],
  ['-(double) a', '(-((double) a))'], ['(double) -a', '((double) (-a))'],
  ['1.0f + 2.0f', '(1.0f + 2.0f)'], ['1.0f + 2.0', '(1.0f + 2.0)'],
  ['0u', '0u'], ['7u', '7u'], ['7U', '7U'], ['0.5f', '0.5f'], ['.5', '.5'], ['1.', '1.'],
  ['00.5', '00.5'], ['1e3', '1e3'], ['1.0e-3F', '1.0e-3F'], ['1e+03', '1e+03'],
  ['.5E-2f', '.5E-2f'], ['1.e2F', '1.e2F'], ['-0.0f', '(-0.0f)'],
  ['-0', '(-0)'], ['nan', 'nan'], ['(DOUBLE)', 'DOUBLE'], ['((a))', 'a'],
  ['absent + Inconnu', '(absent + Inconnu)'], ['10 / 0', '(10 / 0)'], ['10.0 % 2.0', '(10.0 % 2.0)'],
  ['9'.repeat(4096) + 'u', '9'.repeat(4096) + 'u'],
  ['1.' + '0'.repeat(4096) + '1f', '1.' + '0'.repeat(4096) + '1f'],
];
for (const [expression, expected] of expressions) {
  test(`lot 7 expression sans évaluation ${JSON.stringify(expression.slice(0, 80))}`, () => {
    const source = assign(expression);
    success(source, `r = ${expected};`, 'NUMERIC_ASSIGN');
    const spaces = `\t AFFECTE\tÀ R LE RÉSULTAT NUMÉRIQUE DE "\t${expression} \t" \t`;
    success(spaces, `R = ${expected};`, 'NUMERIC_ASSIGN');
    success(`Crée une variable de type double nommée r avec le résultat de "${expression}".`, `double r = ${expected};`, 'NUMERIC_INIT');
  });
}
test('aucun suffixe ou cast ajouté à une initialisation', () => {
  success('Crée une variable de type float nommée f avec le résultat de "0.1".', 'float f = 0.1;', 'NUMERIC_INIT');
  success('Crée une variable de type double nommée q avec le résultat de "7 / 2".', 'double q = (7 / 2);', 'NUMERIC_INIT');
});
for (const precision of Array.from({ length: 21 }, (_, i) => String(i))) {
  for (const [notation, format, suffix] of [['fixe', 'fixed', 'f'], ['scientifique', 'scientific', 'e']]) {
    test(`lot 7 format ${notation}, précision ${precision}`, () => {
      for (const name of ['f', 'd', 'la', 'le', 'en']) {
        const source = `Affiche ${name} en notation ${notation} avec ${precision} décimales.`;
        const result = success(source, `printf("%.${precision}${suffix}", ${name});`, 'NUMERIC_PRINT');
        assert.deepEqual(result.instruction.parameters, { name, format, precision });
      }
    });
  }
}
for (const name of ['u', 'la', 'le', 'en', 'Age_2']) {
  test(`lot 7 non signé ${name}`, () => {
    const result = success(`Affiche ${name} en décimal non signé.`, `printf("%u", ${name});`, 'NUMERIC_PRINT');
    assert.deepEqual(result.instruction.parameters, { name, format: 'unsigned' });
  });
}
test('affichage numérique : casse, tabulations, point facultatif et source originale', () => {
  success('\t AFFICHE\tAge_2 EN NOTATION FIXE AVEC 3 DÉCIMALES \t', 'printf("%.3f", Age_2);', 'NUMERIC_PRINT');
  success('\t AFFICHE\tU EN DÉCIMAL NON SIGNÉ. \t', 'printf("%u", U);', 'NUMERIC_PRINT');
});
for (const source of ['Déclare une variable.', 'Déclare une variable nommée x.', 'Déclare une variable de type.', 'Crée une variable de type nommée f.']) {
  test(`lot 7 type manquant ${source}`, () => {
    const token = source.indexOf('nommée');
    const at = token === -1 ? source.length - 1 : token;
    rejected(source, 'MISSING_NUMERIC_TYPE', { start: at, end: at }, 'Il manque le type numérique.');
  });
}
for (const type of ['long', 'unsigned', 'signed int', 'long double', 'réel']) {
  test(`lot 7 type hors catalogue ${type}`, () => {
    const source = `Déclare une variable de type ${type} nommée x.`;
    rejected(source, 'UNSUPPORTED_NUMERIC_TYPE', { start: source.indexOf(type), end: source.indexOf(type) + type.length }, 'Ce type numérique n’est pas pris en charge.');
  });
}
for (const source of ['Déclare une variable de type double nommée.', 'Crée une variable de type float nommée.']) {
  test(`lot 7 nom manquant ${source}`, () => rejected(source, 'INCOMPLETE_INSTRUCTION', { start: source.length - 1, end: source.length - 1 }, 'Il manque le nom de la variable.'));
}
for (const source of ['Crée une variable de type float nommée f.', 'Crée une variable de type float nommée f avec le résultat de.', 'Affecte à r le résultat numérique de.', assign('')]) {
  test(`lot 7 expression absente ${source}`, () => rejected(source, 'MISSING_EXPRESSION', undefined, 'Il manque l’expression à calculer.'));
}
for (const notation of ['fixe', 'scientifique']) {
  for (const suffix of ['', ' avec']) {
    test(`lot 7 précision absente ${notation}${suffix}`, () => {
      const source = `Affiche f en notation ${notation}${suffix}.`;
      rejected(source, 'MISSING_DISPLAY_PRECISION', { start: source.length - 1, end: source.length - 1 }, 'Il manque la précision d’affichage.');
    });
  }
}
for (const precision of ['-1', '+1', '02', '2.5', 'vingt', '21', '999999999999999999999', '😀']) {
  test(`lot 7 précision invalide ${precision}`, () => {
    const source = `Affiche f en notation fixe avec ${precision} décimales.`;
    const start = source.indexOf(precision, source.indexOf('avec') + 4);
    rejected(source, 'INVALID_DISPLAY_PRECISION', { start, end: start + precision.length }, 'La précision d’affichage doit être un entier entre 0 et 20.');
  });
}
test('unité de précision absente', () => {
  const source = 'Affiche d en notation fixe avec 3.';
  rejected(source, 'INCOMPLETE_INSTRUCTION', { start: source.length - 1, end: source.length - 1 }, 'Il manque l’unité de précision d’affichage.');
});
test('valeur de précision absente avant son unité, sans sélection automatique', () => {
  const source = 'Affiche f en notation fixe avec décimales.';
  const start = source.indexOf('décimales');
  rejected(source, 'MISSING_DISPLAY_PRECISION', { start, end: start }, 'Il manque la précision d’affichage.');
});
test('qualification du format entier absente', () => {
  const source = 'Affiche u en décimal non.';
  rejected(source, 'INCOMPLETE_INSTRUCTION', { start: source.length - 1, end: source.length - 1 }, 'Il manque la qualification du format entier.');
});
const failures = [
  ['', 'MISSING_EXPRESSION', '', true], ['a +', 'MISSING_OPERAND', '', true],
  ['(double)', 'MISSING_OPERAND', '', true], ['() a', 'MISSING_OPERAND', ')', true],
  ['(double a', 'MISSING_CAST_CLOSING_PARENTHESIS', 'a', true],
  ['a b', 'MISSING_OPERATOR', 'b', true], ['(a + b', 'MISSING_CLOSING_PARENTHESIS', '', true],
  ['a + b)', 'UNEXPECTED_CLOSING_PARENTHESIS', ')', false],
  ['a + 😀', 'INVALID_EXPRESSION_TOKEN', '😀', false], ['a + \ud800', 'INVALID_EXPRESSION_TOKEN', '\ud800', false],
  ['a == b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '==', false],
  ['a ** b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '**', false],
  ['a--b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '--', false],
  ['a++b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '++', false],
  ['f(a)', 'MISSING_OPERATOR', '(', true], ['a[0]', 'INVALID_EXPRESSION_TOKEN', '[', false],
  ['a; b=3', 'INVALID_EXPRESSION_TOKEN', ';', false], ['a // b', 'UNSUPPORTED_EXPRESSION_OPERATOR', '//', false],
  ['a \\ b', 'INVALID_EXPRESSION_TOKEN', '\\', false], ['(DOUBLE) a', 'MISSING_OPERATOR', 'a', true],
];
for (const value of ['020', '0x10', '0x1p2', '7l', '7ull', '1.0L', '1f', '1,5', '12age', '1_000', '.', '1.0ff']) failures.push([value, 'UNSUPPORTED_NUMERIC_LITERAL', value, false]);
for (const value of ['1e', '1e+', '1e-', '.5E+', '1.e-']) failures.push([value, 'INCOMPLETE_NUMERIC_LITERAL', '', true]);
for (const type of ['long', 'long double', 'unsigned', 'signed int', 'const double', '_Bool']) failures.push([`(${type}) a`, 'UNSUPPORTED_NUMERIC_TYPE', type, false]);
for (const [expression, code, token, empty] of failures) {
  test(`lot 7 diagnostic dans l'expression ${JSON.stringify(expression)}`, () => {
    const source = assign(expression);
    const beginning = source.indexOf('"') + 1;
    const start = token ? source.indexOf(token, beginning) : source.lastIndexOf('"');
    rejected(source, code, { start, end: start + (empty ? 0 : token.length) });
  });
}
for (const source of ['Affecte à r le résultat numérique de a.', 'Affecte à r le résultat numérique de “a”.']) {
  test(`lot 7 guillemet ouvrant absent ${source}`, () => {
    const start = source.indexOf('de ') + 3;
    rejected(source, 'MISSING_EXPRESSION_DELIMITER', { start, end: start });
  });
}
test('guillemet fermant absent prioritaire sur une erreur interne', () => {
  const source = 'Affecte à r le résultat numérique de "a +';
  rejected(source, 'UNTERMINATED_EXPRESSION', { start: source.indexOf('"'), end: source.length });
});
for (const suffix of [' .', '..', ' ensuite.', ' // commentaire', '\\', ' 😀']) {
  test(`lot 7 suffixe rejeté ${JSON.stringify(suffix)}`, () => {
    const base = assign('a').slice(0, -1);
    rejected(base + suffix, 'UNEXPECTED_TEXT', { start: base.length + (suffix.startsWith(' ') ? 1 : 0), end: base.length + suffix.length });
  });
}
for (const separator of ['\n', '\r\n', '\v', '\f', '\u00a0', '\ufeff', '\u2028', '\u2029']) {
  test(`lot 7 séparateur interdit ${JSON.stringify(separator)}`, () => {
    const source = assign(`a${separator}+ 1.0f`);
    rejected(source, 'INVALID_SEPARATOR', { start: source.indexOf(separator), end: source.indexOf(separator) + 1 });
  });
}
const keywords = `auto break case char const continue default do double else enum extern float for goto if inline int long register restrict return short signed sizeof static struct switch typedef union unsigned void volatile while _Alignas _Alignof _Atomic _Bool _Complex _Generic _Imaginary _Noreturn _Static_assert _Thread_local`.split(' ');
for (const name of [...keywords, '_age', 'âge', 'Age😀']) {
  test(`lot 7 règles des noms ${name}`, () => {
    for (const source of [`Déclare une variable de type double nommée ${name}.`, `Affiche ${name} en décimal non signé.`, assign(`${name} + 1.0`)]) {
      const start = source.indexOf(name, source.includes('"') ? source.indexOf('"') : source.includes('nommée') ? source.indexOf('nommée') + 7 : 0);
      rejected(source, keywords.includes(name) ? 'C_KEYWORD_IDENTIFIER' : 'INVALID_IDENTIFIER', { start, end: start + name.length });
    }
  });
}
function validateName(token) {
  const result = translate(`Déclare un entier nommé ${token.text}`);
  return result.status === 'rejected' ? { ...result.diagnostics[0], range: token.range } : undefined;
}
test('AST du cast : type demandé, lexème exact, plages UTF-16 absolues', () => {
  const source = 'é😀 "(double) 7 / 2"';
  const start = source.indexOf('(');
  const end = source.lastIndexOf('"');
  const result = parseNumericExpression(source, start, end, validateName);
  assert.deepEqual(result, { status: 'parsed', expression: {
    kind: 'binary', operator: '/', range: { start, end },
    left: { kind: 'cast', type: 'double', range: { start, end: start + 10 },
      operand: { kind: 'literal', value: '7', range: { start: start + 9, end: start + 10 } } },
    right: { kind: 'literal', value: '2', range: { start: start + 13, end: start + 14 } },
  } });
  assert.equal(renderNumericExpression(result.expression), '(((double) 7) / 2)');
});
for (const count of [63, 64, 65]) {
  for (const mode of ['casts', 'unsigned casts', 'parentheses', 'negations', 'mixed']) {
    test(`lot 7 profondeur ${mode} ${count}`, () => {
      let prefix = '';
      let ending = '';
      const positions = [];
      for (let i = 0; i < count; i++) {
        positions.push(prefix.length);
        const kind = mode === 'mixed' ? ['casts', 'parentheses', 'negations'][i % 3] : mode;
        prefix += kind === 'casts' ? '(double) ' : kind === 'unsigned casts' ? '(unsigned int) ' : kind === 'parentheses' ? '(' : '- ';
        if (kind === 'parentheses') ending += ')';
      }
      const source = assign(prefix + 'a' + ending);
      if (count <= 64) assert.equal(translate(source).status, 'translated');
      else {
        const start = source.indexOf('"') + 1 + positions[64];
        rejected(source, 'EXPRESSION_TOO_COMPLEX', { start, end: start + 1 });
      }
    });
  }
}
for (const literal of ['1.0', '1e-3', '7u']) {
  for (const count of [1023, 1024, 1025]) {
    test(`lot 7 longueur ${count} tokens, littéral ${literal}`, () => {
      const expression = (count === 1024 ? '-' : '') + Array(count === 1025 ? 513 : 512).fill(literal).join('+');
      const source = assign(expression);
      if (count <= 1024) assert.equal(translate(source).status, 'translated');
      else {
        const start = source.lastIndexOf(literal);
        rejected(source, 'EXPRESSION_TOO_COMPLEX', { start, end: start + literal.length });
      }
    });
  }
}
for (const [prefix, operands, accepted] of [['-(int) ', 511, false], ['(int) ', 511, true], ['(unsigned int) ', 510, true], ['(unsigned int) ', 511, false]]) {
  test(`lot 7 les mots et parenthèses du cast comptent comme tokens : ${prefix}, ${operands} opérandes`, () => {
    const source = assign(prefix + Array(operands).fill('1').join('+'));
    if (accepted) assert.equal(translate(source).status, 'translated');
    else {
      const start = source.lastIndexOf('1');
      rejected(source, 'EXPRESSION_TOO_COMPLEX', { start, end: start + 1 });
    }
  });
}
for (const eol of ['\n', '\r\n']) {
  test(`lot 7 placement et contrôle canonique ${JSON.stringify(eol)}`, () => {
    const prefix = '// é😀' + eol + 'int main(void) {' + eol;
    let document = { id: 'numeric.c', revision: 1, text: prefix + '    ' + eol + '}' + eol };
    let cursorOffset = prefix.length + 4;
    for (const source of ['Déclare une variable de type double nommée d.', 'Crée une variable de type float nommée f avec le résultat de "0.1f".',
      assign('(double) 7 / 2'), 'Affiche f en notation fixe avec 9 décimales.', 'Affiche u en décimal non signé.']) {
      const translation = translate(source);
      const request = { document, cursorOffset, translation };
      const result = planPlacement(request);
      assert.equal(result.status, 'planned', JSON.stringify(result));
      const edit = result.plan.edits[0];
      const text = document.text.slice(0, edit.range.start) + edit.newText + document.text.slice(edit.range.end);
      assert.ok(text.includes(`    // ${source}${eol}`));
      assert.equal(text.slice(result.plan.cursorAfter), eol + '}' + eol);
      assert.ok(!text.includes('#include'));
      const altered = structuredClone(translation);
      altered.instruction.parameters.name = 'injection';
      assert.equal(planPlacement({ ...request, translation: altered }).diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
      for (const key of ['type', 'expression', 'precision', 'format']) {
        const changed = structuredClone(translation);
        if (key in changed.instruction.parameters) {
          changed.instruction.parameters[key] = key === 'expression' ? { kind: 'literal', value: '0', range: { start: 0, end: 1 } } : 'altéré';
          assert.equal(planPlacement({ ...request, translation: changed }).diagnostics[0].code, 'INVALID_TRANSLATION_RESULT');
        }
      }
      document = { ...document, revision: document.revision + 1, text };
      cursorOffset = result.plan.cursorAfter;
    }
  });
}
