import { test } from 'node:test';
import assert from 'node:assert/strict';
import { INTEGER_CAPABILITIES, NUMERIC_CAPABILITIES, CONDITION_CAPABILITIES } from '../src/expressionCore.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';

const RESERVED = new Set(['int', 'char', 'unsigned', 'double', 'float', 'void', 'for', 'while', 'return', 'if', 'else']);
const validate = (token) => RESERVED.has(token.text)
  ? { code: 'C_KEYWORD_IDENTIFIER', category: 'understanding', severity: 'error', message: 'Mot-clé du langage C.', range: token.range }
  : undefined;

const PROFILES = [
  ['entier', (source, budget) => parseExpression(source, 0, source.length, validate, undefined, budget)],
  ['numérique', (source, budget) => parseNumericExpression(source, 0, source.length, validate, undefined, budget)],
  ['condition', (source, budget) => parseCondition(source, 0, source.length, validate, undefined, budget)],
];

// The capability records are the lot 13 contract. A future lot that needs a new
// capability must add a field; it must never silently widen an existing profile.
test('capacités déclarées des trois profils historiques', () => {
  assert.deepEqual(INTEGER_CAPABILITIES, {
    literals: 'integer', casts: false, castTypes: [], logic: false,
    invalidTokenMessage: 'Cet élément n’appartient pas à une expression entière prise en charge.',
    invariantMessage: 'Invariant interne : expression analysée absente.',
  });
  // `char` entered castTypes at lot 14 by decision D2; it is the only change
  // this record has undergone since lot 13 sealed it.
  assert.deepEqual(NUMERIC_CAPABILITIES, {
    literals: 'numeric', casts: true, castTypes: ['int', 'unsigned int', 'float', 'double', 'char'], logic: false,
    invalidTokenMessage: 'Cet élément n’appartient pas à une expression numérique prise en charge.',
    invariantMessage: 'Invariant interne : expression numérique analysée absente.',
  });
  assert.deepEqual(CONDITION_CAPABILITIES, {
    literals: 'numeric', casts: true, castTypes: ['int', 'unsigned int', 'float', 'double', 'char'], logic: true,
    invalidTokenMessage: 'Cet élément n’appartient pas à une expression numérique prise en charge.',
    invariantMessage: 'Invariant interne : expression numérique analysée absente.',
  });
});

// Domain 5 constructions must still be refused, with the historical codes, until
// the lot that introduces each one is itself contracted and approved.
const REFUSED = [
  ['a[0]', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ['t[i] + 1', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ['a & b', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['&a', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['* a', 'MISSING_OPERAND', 'MISSING_OPERAND', 'MISSING_OPERAND'],
  ['a * * b', 'MISSING_OPERAND', 'MISSING_OPERAND', 'MISSING_OPERAND'],
  ["'A'", 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ['"texte"', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ['p->x', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
];
for (const [source, ...codes] of REFUSED) {
  test(`domaine 5 encore refusé : ${JSON.stringify(source)}`, () => {
    PROFILES.forEach(([name, parse], index) => {
      const result = parse(source, { count: 0 });
      assert.equal(result.status, 'rejected', `${name} devrait refuser ${source}`);
      assert.equal(result.diagnostic.code, codes[index], `${name} / ${source}`);
    });
  });
}

// Lot 13 locked this refusal; lot 14 lifted it by decision D2. The cast is now
// accepted in both profiles that declare the capability, and nowhere else.
test('char est une conversion acceptée depuis le lot 14', () => {
  for (const parse of [parseNumericExpression, parseCondition]) {
    const source = '(char) a';
    const result = parse(source, 0, source.length, validate);
    assert.equal(result.status, 'parsed');
    const node = result.expression ?? result.condition.expression;
    assert.equal(node.kind, 'cast');
    assert.equal(node.type, 'char');
  }
  // The integer profile declares no cast capability at all, so `char` is read
  // as a name and refused by the validator — exactly as before lot 14.
  const source = '(char) a';
  const integer = parseExpression(source, 0, source.length, validate);
  assert.equal(integer.status, 'rejected');
  assert.equal(integer.diagnostic.code, 'C_KEYWORD_IDENTIFIER');
});

// Compound char types stay out: only the bare designation is supported.
for (const type of ['unsigned char', 'signed char', 'long', 'short']) {
  test(`conversion hors catalogue : ${type}`, () => {
    const source = `(${type}) a`;
    for (const parse of [parseNumericExpression, parseCondition]) {
      const result = parse(source, 0, source.length, validate);
      assert.equal(result.status, 'rejected', `${type} devrait être refusé`);
      assert.equal(result.diagnostic.code, 'UNSUPPORTED_NUMERIC_TYPE');
    }
  });
}

// A capability a profile does not declare can produce no node: this is what
// makes the narrowing in each wrapper sound rather than merely convenient.
test('le profil entier ne construit aucun nœud hors de son propre type', () => {
  const kinds = new Set();
  const walk = (node) => {
    kinds.add(node.kind);
    for (const child of [node.operand, node.left, node.right, node.expression]) if (child) walk(child);
  };
  for (const source of ['1', 'a', '-a', 'a + b * (c - 2) % 3', '((a))']) {
    const result = parseExpression(source, 0, source.length, validate);
    assert.equal(result.status, 'parsed', source);
    walk(result.expression);
  }
  assert.deepEqual([...kinds].sort(), ['binary', 'integer', 'name', 'negation']);
});

// The token allowance is global to one instruction and never reset between
// sibling expressions; depth stays per-expression.
test('budget de jetons partagé entre expressions sœurs', () => {
  for (const parse of [parseNumericExpression, parseCondition]) {
    const budget = { count: 0 };
    parse('a + b', 0, 5, validate, undefined, budget);
    const afterFirst = budget.count;
    parse('c + d', 0, 5, validate, undefined, budget);
    assert.equal(afterFirst, 3);
    assert.equal(budget.count, 6);
  }
});

test('dépassement du budget : même code dans les trois profils', () => {
  const source = Array.from({ length: 1100 }, (_, index) => 'n' + index).join(' + ');
  for (const [, parse] of PROFILES) {
    const result = parse(source, { count: 0 });
    assert.equal(result.status, 'rejected');
    assert.equal(result.diagnostic.code, 'EXPRESSION_TOO_COMPLEX');
  }
});
