import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { planPlacement } from '../src/planPlacement.ts';

const numeric = expression => `Affecte à r le résultat numérique de "${expression}".`;
const integer = expression => `Affecte à r le résultat de "${expression}".`;
const init = expression => `Crée une variable de type double nommée r avec le résultat de "${expression}".`;
const messages = {
  INTEGER_ZERO_DIVISOR: 'Le diviseur entier est nul. Si cette opération est exécutée, son comportement est indéfini.',
  FLOAT_REMAINDER_OPERAND: 'L’opérateur % exige des opérandes entiers ; cet opérande est flottant.',
  floating: 'Le diviseur est nul. Les garanties de cette division flottante dépendent du profil C17 de l’implémentation.',
  unknown: 'Le diviseur est nul. Les types réels des opérandes sont nécessaires pour préciser les conséquences.',
};
function check(source, expected) {
  const translation = translate(source);
  assert.equal(translation.status, 'translated', JSON.stringify(translation));
  const original = structuredClone(translation);
  const report = analyzeCalculations(translation);
  assert.deepEqual(report.source, { text: source });
  assert.deepEqual(translation, original);
  assert.deepEqual(analyzeCalculations(translation), report);
  assert.deepEqual(report.advisories.map(a => [a.code, a.assessment, source.slice(a.range.start, a.range.end)]), expected);
  for (const a of report.advisories) {
    assert.equal(a.category, 'calculation');
    assert.equal(a.severity, 'warning');
    assert.equal(a.message, messages[a.code] ?? messages[a.assessment === 'possible-risk' ? 'floating' : 'unknown']);
    assert.ok(a.range.start >= 0 && a.range.end <= source.length && a.range.start < a.range.end);
  }
  // Side-channel analysis must not alter canonical placement or its exact edits.
  const request = { document: { id: 'file:///study.c', revision: 1, text: '' }, cursorOffset: 0,
    indentUnit: '    ', fallbackEol: '\n', translation };
  const before = planPlacement(request);
  analyzeCalculations(translation);
  assert.deepEqual(planPlacement(request), before);
  return report;
}

for (const envelope of [integer, numeric, init]) {
  for (const operator of ['/', '%']) {
    for (const zero of ['0', '-0', '(0)', '(-0)', '-(0)']) {
      test(`integer zero ${envelope.name} ${operator} ${zero}`, () => {
        check(envelope(`7 ${operator} ${zero}`), [['INTEGER_ZERO_DIVISOR', 'certain-error', zero]]);
      });
    }
  }
}
for (const zero of ['0u', '0U', '-0u', '(-0U)']) {
  test(`unsigned literal zero ${zero}`, () => check(numeric(`7u % ${zero}`), [['INTEGER_ZERO_DIVISOR', 'certain-error', zero]]));
}
for (const zero of ['0.0', '.0', '00.0', '0.', '0e-999', '0E+999', '-0.0', '(-.0)', '0.0f', '0.F']) {
  for (const numerator of ['a', '7', '1.0']) {
    test(`floating zero ${numerator}/${zero}`, () => check(numeric(`${numerator} / ${zero}`), [['ZERO_DIVISOR', 'possible-risk', zero]]));
  }
}
for (const expression of ['a / 0', 'a % 0', '(a + b) / 0', '(double)a / 0', '(int)7 / 0']) {
  test(`unknown actual types ${expression}`, () => check(numeric(expression), [['ZERO_DIVISOR', 'undetermined', '0']]));
}
test('integer grammar does not establish the actual type of a variable', () => check(integer('a / 0'), [['ZERO_DIVISOR', 'undetermined', '0']]));
test('direct floating numerator and integer zero', () => check(numeric('(-1.0) / (-0)'), [['ZERO_DIVISOR', 'possible-risk', '(-0)']]));

for (const [expression, operand] of [['5.0 % 2', '5.0'], ['7 % 2.0', '2.0'], ['7 % 0.0', '0.0'],
  ['(-5.0) % 0.0', '(-5.0)'], ['-(5.0) % 2', '-(5.0)'], ['5e0 % 2', '5e0'], ['5.f % 2', '5.f']]) {
  test(`floating remainder constraint ${expression}`, () => check(numeric(expression), [['FLOAT_REMAINDER_OPERAND', 'certain-error', operand]]));
}
for (const expression of ['a / b', '7 / (1 - 1)', '7 / (int)0', '7 / ((double)0)', '7 / (a * 0)',
  '(double)a % (float)b', '(1.0 + 2.0) % a', 'INT_MAX + 1', 'INT_MIN / -1', '0u - 1u', '(int)3.75',
  '0.1 + 0.2', '7 / 1e-999', '7 / 0.00001', '7 / 10', '7 / 1000u', '7 / -1', 'a / ZERO']) {
  test(`deliberate exclusion ${expression}`, () => check(numeric(expression), []));
}
test('nested casts are traversed without making their operands transparent', () => {
  check(numeric('(double)(7 / 0) / (int)0'), [['INTEGER_ZERO_DIVISOR', 'certain-error', '0']]);
});
test('independent operations sorted by original source ranges', () => {
  check(numeric('7 / (0) + 5.0 % 0.0 + a / 0'), [
    ['INTEGER_ZERO_DIVISOR', 'certain-error', '(0)'],
    ['FLOAT_REMAINDER_OPERAND', 'certain-error', '5.0'], ['ZERO_DIVISOR', 'undetermined', '0'],
  ]);
});
test('UTF-16 absolute ranges preserve accents, tabs, casing and parentheses', () => {
  const source = ' \tAFFECTE À r LE RÉSULTAT NUMÉRIQUE DE "7 / (-0.0)".  ';
  const report = check(source, [['ZERO_DIVISOR', 'possible-risk', '(-0.0)']]);
  assert.deepEqual(report.advisories[0].range, { start: source.indexOf('(-0.0)'), end: source.indexOf('(-0.0)') + 6 });
});
test('non-BMP rejected source preserves historical two-code-unit diagnostic', () => {
  const source = numeric('a + 😀 / 0');
  const result = translate(source);
  assert.equal(result.status, 'rejected');
  assert.deepEqual(result.diagnostics[0].range, { start: source.indexOf('😀'), end: source.indexOf('😀') + 2 });
  assert.deepEqual(analyzeCalculations(result).advisories, []);
});
test('range copying uses UTF-16 units even in a synthetic source/range fixture', () => {
  const result = translate(numeric('7 / 0'));
  assert.equal(result.status, 'translated');
  const root = result.instruction.parameters.expression;
  const start = result.source.text.indexOf('0');
  result.source.text = '😀' + result.source.text;
  root.right.range = { start: start + 2, end: start + 3 };
  assert.deepEqual(analyzeCalculations(result).advisories[0].range, { start: start + 2, end: start + 3 });
});
for (const source of [numeric('7 /'), integer('7.0 / 0'), numeric(''), 'Affiche age.', 'Affiche age en binaire.',
  'Affiche q en notation fixe.', numeric('a\n/0')]) {
  test(`rejection has no advisory ${JSON.stringify(source)}`, () => {
    const result = translate(source);
    assert.equal(result.status, 'rejected');
    assert.deepEqual(analyzeCalculations(result), { source: { text: source }, advisories: [] });
    assert.ok(!('fragments' in result));
  });
}
for (const source of ['Affiche le texte "7 / 0".', 'Affiche r en décimal.', 'Déclare une variable de type double nommée q.']) {
  test(`non-expression instruction ${source}`, () => check(source, []));
}
for (const count of [1023, 1024, 1025]) {
  test(`token limit ${count}`, () => {
    // 1023 tokens, or one extra unary minus, or one extra binary pair.
    const expression = count === 1024 ? '-' + '1+'.repeat(510) + '7/0' : '1+'.repeat(count === 1023 ? 510 : 511) + '7/0';
    const result = translate(numeric(expression));
    assert.equal(result.status, count <= 1024 ? 'translated' : 'rejected');
    if (result.status === 'rejected') {
      assert.equal(result.diagnostics[0].code, 'EXPRESSION_TOO_COMPLEX');
      assert.deepEqual(analyzeCalculations(result).advisories, []);
    } else assert.equal(analyzeCalculations(result).advisories.length, 1);
  });
}
for (const depth of [63, 64, 65]) {
  test(`depth including casts ${depth}`, () => {
    const result = translate(numeric('(double)'.repeat(depth) + '(7/0)'));
    // The explicit group adds one nesting level to the casts.
    assert.equal(result.status, depth < 64 ? 'translated' : 'rejected');
    if (result.status === 'rejected') assert.deepEqual(analyzeCalculations(result).advisories, []);
  });
  test(`parenthesis depth ${depth}`, () => {
    const result = translate(numeric('('.repeat(depth) + '7/0' + ')'.repeat(depth)));
    assert.equal(result.status, depth <= 64 ? 'translated' : 'rejected');
    assert.equal(analyzeCalculations(result).advisories.length, depth <= 64 ? 1 : 0);
  });
}
test('many advisories remain complete and deterministic within the token bound', () => {
  const result = translate(numeric(Array(256).fill('7/0').join('+')));
  assert.equal(result.status, 'translated');
  const first = analyzeCalculations(result);
  assert.equal(first.advisories.length, 256);
  assert.deepEqual(analyzeCalculations(result), first);
  assert.deepEqual(first.advisories.map(a => a.range.start), first.advisories.map(a => a.range.start).toSorted((a,b) => a-b));
});
test('very long literal/exponent processed lexically, without numeric underflow', () => {
  check(numeric('7 / 0e-' + '9'.repeat(20000)), [['ZERO_DIVISOR', 'possible-risk', '0e-' + '9'.repeat(20000)]]);
  check(numeric('7 / 1e-' + '9'.repeat(20000)), []);
});
