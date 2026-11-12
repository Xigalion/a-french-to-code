import test from 'node:test';
import assert from 'node:assert/strict';
import { parseExpression, renderExpression, MAX_EXPRESSION_TOKENS, MAX_EXPRESSION_DEPTH } from '../src/expression.ts';
import { translate } from '../src/translate.ts';

function validateName(token) {
  const historical = translate(`Déclare un entier nommé ${token.text}`);
  return historical.status === 'rejected' ? { ...historical.diagnostics[0], range: token.range } : undefined;
}
function parse(input) { return parseExpression(input, 0, input.length, validateName); }
const valid = [
  ['a', 'a'], ['0', '0'], ['Age_2', 'Age_2'], ['-0', '(-0)'],
  ['-a', '(-a)'], ['-(a + b)', '(-(a + b))'], ['a * -b', '(a * (-b))'],
  ['- -a', '(-(-a))'], ['a - -b', '(a - (-b))'], ['a*-b', '(a * (-b))'],
  ['a+-b', '(a + (-b))'], ['2 + 3 * 4', '(2 + (3 * 4))'],
  ['(2 + 3) * 4', '((2 + 3) * 4)'], ['20 / 3 / 2', '((20 / 3) / 2)'],
  ['20 / (3 / 2)', '(20 / (3 / 2))'], ['10 - 3 - 2', '((10 - 3) - 2)'],
  ['10 - (3 - 2)', '(10 - (3 - 2))'], ['a % b * c / d', '(((a % b) * c) / d)'],
  ['((a))', 'a'], ['\t a\t+\t(b*3) \t', '(a + (b * 3))'],
  ['9'.repeat(4096), '9'.repeat(4096)],
];
for (const [input, expected] of valid) {
  test(`expression : rendu exact ${JSON.stringify(input.slice(0, 80))}`, () => {
    const result = parse(input);
    assert.equal(result.status, 'parsed', JSON.stringify(result));
    assert.equal(renderExpression(result.expression), expected);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    assert.deepEqual(parse(input), result);
  });
}
test('AST et intervalles absolus UTF-16, y compris les regroupements', () => {
  const source = 'é😀 "a + (b * 3)"';
  const start = source.indexOf('a');
  const end = source.lastIndexOf('"');
  const result = parseExpression(source, start, end, validateName);
  assert.deepEqual(result, { status: 'parsed', expression: {
    kind: 'binary', operator: '+', range: { start, end },
    left: { kind: 'name', name: 'a', range: { start, end: start + 1 } },
    right: { kind: 'binary', operator: '*', range: { start: start + 4, end },
      left: { kind: 'name', name: 'b', range: { start: start + 5, end: start + 6 } },
      right: { kind: 'integer', value: '3', range: { start: start + 9, end: start + 10 } },
    },
  } });
});
const messages = {
  MISSING_EXPRESSION: 'Il manque l’expression à calculer.',
  MISSING_OPERAND: 'Il manque un opérande.',
  MISSING_OPERATOR: 'Il manque un opérateur.',
  MISSING_CLOSING_PARENTHESIS: 'Il manque une parenthèse fermante.',
  UNEXPECTED_CLOSING_PARENTHESIS: 'Cette parenthèse fermante n’a pas de parenthèse ouvrante.',
  UNSUPPORTED_EXPRESSION_OPERATOR: 'Cet opérateur n’est pas pris en charge.',
  INVALID_EXPRESSION_TOKEN: 'Cet élément n’appartient pas à une expression entière prise en charge.',
  EXPRESSION_TOO_COMPLEX: 'Cette expression dépasse les limites de complexité prises en charge.',
};
const invalid = [
  ['', 'MISSING_EXPRESSION', 0, 0], ['  ', 'MISSING_EXPRESSION', 2, 2],
  ['a +', 'MISSING_OPERAND', 3, 3], ['* a', 'MISSING_OPERAND', 0, 0],
  ['()', 'MISSING_OPERAND', 1, 1], ['a + )', 'MISSING_OPERAND', 4, 4],
  ['(a + )', 'MISSING_OPERAND', 5, 5], ['a + * b', 'MISSING_OPERAND', 4, 4],
  ['a b', 'MISSING_OPERATOR', 2, 2], ['2 (a + 1)', 'MISSING_OPERATOR', 2, 2],
  ['(a + b', 'MISSING_CLOSING_PARENTHESIS', 6, 6],
  ['a + b)', 'UNEXPECTED_CLOSING_PARENTHESIS', 5, 6],
  ['f(a)', 'MISSING_OPERATOR', 1, 1], ['a;', 'INVALID_EXPRESSION_TOKEN', 1, 2],
];
for (const word of ['020', '00', '0x10', '1.2', '1e3', '12age', '2u', '2,5', '😀', '\ud800', '"', '\\']) {
  // Commas delimit unsupported expression content; reject the first comma.
  invalid.push([word, 'INVALID_EXPRESSION_TOKEN', word === '2,5' ? 1 : 0, word === '2,5' ? 2 : word.length]);
}
for (const operator of ['==', '**', '++', '--', '+=', '-=', '*=', '/=', '%=', '&&', '||', '!=', '<=', '>=', '<<', '>>', '>>=', '<<=', '&=', '|=', '^=', '->', '=', '&', '|', '^', '~', '!', '?', ':', '//', '/*', '*/']) {
  invalid.push([`a ${operator} b`, 'UNSUPPORTED_EXPRESSION_OPERATOR', 2, 2 + operator.length]);
}
for (const [input, code, start, end] of invalid) {
  test(`expression : diagnostic exact ${JSON.stringify(input)}`, () => {
    const result = parse(input);
    assert.deepEqual(result, { status: 'rejected', diagnostic: {
      code, category: 'understanding', severity: 'error', message: messages[code], range: { start, end },
    } });
    assert.deepEqual(parse(input), result);
  });
}
test('caractère astral invalide après un préfixe astral : offsets absolus', () => {
  const source = 'pré😀 "a + 😀"';
  const result = parseExpression(source, source.indexOf('a'), source.lastIndexOf('"'), validateName);
  assert.equal(result.diagnostic.code, 'INVALID_EXPRESSION_TOKEN');
  assert.deepEqual(result.diagnostic.range, { start: source.lastIndexOf('😀'), end: source.lastIndexOf('😀') + 2 });
});
for (const count of [63, 64, 65]) {
  for (const form of ['parentheses', 'negations', 'mixed']) {
    test(`profondeur ${form} ${count}`, () => {
      assert.equal(MAX_EXPRESSION_DEPTH, 64);
      const groups = form === 'parentheses' ? count : form === 'mixed' ? 32 : 0;
      const negations = count - groups;
      const input = '('.repeat(groups) + '- '.repeat(negations) + 'a' + ')'.repeat(groups);
      const result = parse(input);
      if (count <= 64) assert.equal(result.status, 'parsed');
      else {
        const at = form === 'parentheses' ? 64 : groups + 2 * (64 - groups);
        assert.deepEqual(result, { status: 'rejected', diagnostic: {
          code: 'EXPRESSION_TOO_COMPLEX', category: 'understanding', severity: 'error',
          message: messages.EXPRESSION_TOO_COMPLEX, range: { start: at, end: at + 1 },
        } });
      }
    });
  }
}
for (const count of [1023, 1024, 1025]) {
  test(`longueur ${count} tokens et AST binaire profond sans exception`, () => {
    assert.equal(MAX_EXPRESSION_TOKENS, 1024);
    const input = (count === 1024 ? '-' : '') + Array(count === 1025 ? 513 : 512).fill('1').join('+');
    const result = parse(input);
    if (count <= 1024) {
      assert.equal(result.status, 'parsed');
      assert.ok(renderExpression(result.expression).length > input.length);
    } else assert.deepEqual(result, { status: 'rejected', diagnostic: {
      code: 'EXPRESSION_TOO_COMPLEX', category: 'understanding', severity: 'error',
      message: messages.EXPRESSION_TOO_COMPLEX, range: { start: 1024, end: 1025 },
    } });
  });
}
test('une erreur antérieure reste prioritaire sur une limite ultérieure', () => {
  const result = parse('a b ' + '+1'.repeat(1024));
  assert.equal(result.diagnostic.code, 'MISSING_OPERATOR');
  assert.deepEqual(result.diagnostic.range, { start: 2, end: 2 });
});
