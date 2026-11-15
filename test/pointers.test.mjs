import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression, parseIndexExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';
import { MAX_EXPRESSION_TOKENS } from '../src/expressionCore.ts';

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', `${source} aurait dû être traduite : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
  if (range) assert.deepEqual(result.diagnostics[0].range, range, source);
  return result.diagnostics[0];
}
const PROFILES = [['numérique', parseNumericExpression], ['condition', parseCondition]];
function parsed(parse, source) {
  const result = parse(source, 0, source.length, () => undefined);
  assert.equal(result.status, 'parsed', `${source} aurait dû être analysée : `
    + (result.status === 'rejected' ? result.diagnostic.code : ''));
  return result;
}

// ---------------------------------------------------------------------------
// 1. Les six enveloppes et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare un pointeur de type int nommé p.', 'int *p;\n', 'DECL_POINTER'],
  ['Crée un pointeur de type int nommé p avec l’adresse de x.', 'int *p = &x;\n', 'INIT_POINTER'],
  ['Affecte l’adresse de x à p.', 'p = &x;\n', 'ASSIGN_ADDRESS'],
  ['Affiche la valeur pointée par p.', 'printf("%d", *p);\n', 'PRINT_POINTED'],
  ['Affecte la valeur 5 à la valeur pointée par p.', '*p = 5;\n', 'ASSIGN_POINTED_INT'],
  ['Affecte à la valeur pointée par p le résultat numérique de "a + 1".', '*p = (a + 1);\n', 'ASSIGN_POINTED_EXPRESSION'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 17 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 17 sortie exacte sans point final : ${source}`, () => {
    const without = source.slice(0, -1);
    assert.equal(translated(without).fragments[0].text, `// ${without}\n${code}`);
  });
}

test('D2 : le déclarateur s’écrit « int *p », jamais « int* p »', () => {
  for (const type of ['int', 'unsigned int', 'float', 'double', 'char']) {
    const code = translated(`Déclare un pointeur de type ${type} nommé p.`).fragments[0].code;
    assert.equal(code, `${type} *p;\n`);
    assert.ok(!code.includes('* p'), code);
    assert.ok(!code.includes('*;'), code);
  }
});

test('les deux apostrophes désignent la même adresse', () => {
  assert.equal(translate("Affecte l'adresse de x à p.").fragments[0].code, 'p = &x;\n');
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('DÉCLARE UN POINTEUR DE TYPE INT NOMMÉ p.').fragments[0].code, 'int *p;\n');
  refused('Affiche la valeur pointee par p.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. Types, noms et niveaux d’indirection
// ---------------------------------------------------------------------------

for (const type of ['long', 'short', 'unsigned char', 'signed char', 'void', 'long double']) {
  test(`type de pointeur hors catalogue : ${type}`, () => {
    refused(`Déclare un pointeur de type ${type} nommé p.`, 'UNSUPPORTED_NUMERIC_TYPE');
  });
}
test('un seul niveau d’indirection dans l’enveloppe', () => {
  refused('Déclare un pointeur de type int * nommé p.', 'UNSUPPORTED_INDIRECTION_LEVEL');
  refused('Déclare un pointeur de type pointeur nommé p.', 'UNSUPPORTED_NUMERIC_TYPE');
  refused('Déclare un pointeur de pointeur de type int nommé p.', 'UNKNOWN_FORMULATION');
});
test('nom et type sont exigés', () => {
  refused('Déclare un pointeur de type int nommé 1p.', 'INVALID_IDENTIFIER');
  refused('Déclare un pointeur de type int nommé int.', 'C_KEYWORD_IDENTIFIER');
  refused('Déclare un pointeur de type int nommé.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare un pointeur de type nommé p.', 'MISSING_NUMERIC_TYPE');
  refused('Déclare un pointeur nommé p.', 'UNKNOWN_FORMULATION');
});
test('aucune cible n’est inventée', () => {
  refused('Crée un pointeur de type int nommé p.', 'INCOMPLETE_INSTRUCTION');
  refused('Crée un pointeur de type int nommé p avec l’adresse de.', 'INCOMPLETE_INSTRUCTION');
  // The optional final period attaches to « l’adresse », so nothing follows it.
  refused('Crée un pointeur de type int nommé p avec l’adresse.', 'INCOMPLETE_INSTRUCTION');
  refused('Crée un pointeur de type int nommé p avec l’adresse de x et de y.', 'UNEXPECTED_TEXT');
  refused('Affecte l’adresse de x à.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte l’adresse à p.', 'UNKNOWN_FORMULATION');
});
test('les deux verbes gardent leur sens', () => {
  refused('Déclare un pointeur de type int nommé p avec l’adresse de x.', 'UNEXPECTED_TEXT');
  assert.equal(translated('Crée un pointeur de type int nommé p avec l’adresse de x.').fragments[0].code, 'int *p = &x;\n');
});

// ---------------------------------------------------------------------------
// 3. Les trois écritures restent distinctes
// ---------------------------------------------------------------------------

test('p, &x et *p produisent trois sorties différentes', () => {
  const pointer = translated('Affecte à n le résultat numérique de "p".').fragments[0].code;
  const address = translated('Affecte à n le résultat numérique de "&x".').fragments[0].code;
  const pointed = translated('Affecte à n le résultat numérique de "*p".').fragments[0].code;
  assert.equal(pointer, 'n = p;\n');
  assert.equal(address, 'n = (&x);\n');
  assert.equal(pointed, 'n = (*p);\n');
  assert.equal(new Set([pointer, address, pointed]).size, 3);
});

// ---------------------------------------------------------------------------
// 4. Les deux opérateurs dans les expressions
// ---------------------------------------------------------------------------

const IN_EXPRESSION = [
  ['Affecte à n le résultat numérique de "*p + 1".', 'n = ((*p) + 1);\n'],
  ['Crée un bloc si "*p > 0".', 'if ((*p) > 0) {\n    \n}\n'],
  ['Crée une boucle tant que "*p != 0".', 'while ((*p) != 0) {\n    \n}\n'],
  ['Appelle lire avec "&x".', 'lire((&x));\n'],
  ['Appelle echange avec "&a" et "&b".', 'echange((&a), (&b));\n'],
  ['Affecte à q le résultat numérique de "&t[0]".', 'q = (&t[0]);\n'],
  ['Affecte à q le résultat numérique de "&t[i + 1]".', 'q = (&t[(i + 1)]);\n'],
  ['Retourne le résultat numérique de "*p".', 'return (*p);\n'],
  ['Crée un bloc si "*p == \'A\'".', "if ((*p) == 'A') {\n    \n}\n"],
  ['Affecte à n le résultat numérique de "-*p".', 'n = (-(*p));\n'],
  ['Affecte à n le résultat numérique de "*(p)".', 'n = (*p);\n'],
];
for (const [source, code] of IN_EXPRESSION) {
  test(`opérateur unaire en expression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('priorité : *p + 1 n’est jamais *(p + 1)', () => {
  const code = translated('Affecte à n le résultat numérique de "*p + 1".').fragments[0].code;
  assert.equal(code, 'n = ((*p) + 1);\n');
  assert.ok(!code.includes('*(p'), code);
  // `*(p + 1)` became the lot 18 frame for the array/pointer relation; the
  // subtraction form is still refused, and that is what this test now fixes.
  refused('Affecte à n le résultat numérique de "*(p - 1)".', 'INVALID_POINTER_OFFSET');
});

test('les nœuds produits portent l’opérateur et son intervalle', () => {
  for (const [, parse] of PROFILES) {
    const address = parsed(parse, '&x');
    const node = address.expression ?? address.condition.expression;
    assert.equal(node.kind, 'address');
    assert.equal(node.operand.kind, 'name');
    assert.deepEqual(node.operatorRange, { start: 0, end: 1 });
    assert.deepEqual(node.range, { start: 0, end: 2 });
    const pointed = parsed(parse, '*p');
    const star = pointed.expression ?? pointed.condition.expression;
    assert.equal(star.kind, 'dereference');
    assert.equal(star.operand.name, 'p');
    assert.deepEqual(star.operatorRange, { start: 0, end: 1 });
  }
});

// ---------------------------------------------------------------------------
// 5. Les opérateurs binaires ne sont pas confondus avec les unaires
// ---------------------------------------------------------------------------

test('le & binaire garde exactement son diagnostic historique', () => {
  PROFILES.forEach(([name, parse], index) => {
    const result = parse('a & b', 0, 5, () => undefined);
    assert.equal(result.status, 'rejected', name);
    assert.equal(result.diagnostic.code,
      ['UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'][index], name);
    assert.deepEqual(result.diagnostic.range, { start: 2, end: 3 }, name);
  });
  refused('Affecte à n le résultat numérique de "a & b".', 'UNSUPPORTED_EXPRESSION_OPERATOR');
  refused('Crée un bloc si "a & b".', 'UNSUPPORTED_CONDITION_OPERATOR');
  // `&&` is still the logical and, and still refused outside conditions.
  assert.ok(parsed(parseCondition, 'a && b'));
  assert.equal(parseNumericExpression('a && b', 0, 6, () => undefined).diagnostic.code, 'UNSUPPORTED_EXPRESSION_OPERATOR');
});

test('le * binaire reste un produit', () => {
  assert.equal(translated('Affecte à n le résultat numérique de "a * b".').fragments[0].code, 'n = (a * b);\n');
  assert.equal(translated('Affecte à n le résultat numérique de "a * b * c".').fragments[0].code, 'n = ((a * b) * c);\n');
  // Extension assumed by the contract: the right operand may now be a
  // dereference, where lot 16 answered MISSING_OPERAND.
  assert.equal(translated('Affecte à n le résultat numérique de "a * *b".').fragments[0].code, 'n = (a * (*b));\n');
});

test('les jetons composés gardent leurs diagnostics d’avant le lot', () => {
  for (const [source, numeric, condition] of [
    ['**p', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
    ['a ** b', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'UNSUPPORTED_CONDITION_OPERATOR'],
    ['&&x', 'UNSUPPORTED_EXPRESSION_OPERATOR', 'MISSING_OPERAND'],
  ]) {
    PROFILES.forEach(([name, parse], index) => {
      const result = parse(source, 0, source.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, [numeric, condition][index], `${name} / ${source}`);
    });
  }
});

// ---------------------------------------------------------------------------
// 6. Diagnostics des deux opérateurs, avec plages UTF-16
// ---------------------------------------------------------------------------

for (const [source, code, start, end] of [
  ['&5', 'INVALID_ADDRESS_OPERAND', 1, 2],
  ['&(a + b)', 'INVALID_ADDRESS_OPERAND', 1, 8],
  ['&-x', 'INVALID_ADDRESS_OPERAND', 1, 3],
  ["&'A'", 'INVALID_ADDRESS_OPERAND', 1, 4],
  ['& &x', 'UNSUPPORTED_INDIRECTION_LEVEL', 0, 4],
  ['&*p', 'UNSUPPORTED_INDIRECTION_LEVEL', 0, 3],
  ['*5', 'INVALID_DEREFERENCE_OPERAND', 1, 2],
  // `*(p + 1)` left this list at lot 18, which opened `*(nom + décalage)`.
  ['*(p - 1)', 'INVALID_POINTER_OFFSET', 1, 8],
  ['*t[0]', 'INVALID_DEREFERENCE_OPERAND', 1, 5],
  ['* *p', 'UNSUPPORTED_INDIRECTION_LEVEL', 0, 4],
  ['*&x', 'UNSUPPORTED_INDIRECTION_LEVEL', 0, 3],
  ['&', 'MISSING_OPERAND', 1, 1],
  ['*', 'MISSING_OPERAND', 1, 1],
]) {
  test(`diagnostic de pointeur ${JSON.stringify(source)}`, () => {
    for (const [name, parse] of PROFILES) {
      const result = parse(source, 0, source.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, code, `${name} / ${source}`);
      assert.deepEqual(result.diagnostic.range, { start, end }, `${name} / ${source}`);
    }
  });
}

test('les plages sont absolues dans la phrase d’origine', () => {
  const source = 'Crée un bloc si "*(p - 1) > 0".';
  const diagnostic = refused(source, 'INVALID_POINTER_OFFSET');
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), '(p - 1)');
});

// ---------------------------------------------------------------------------
// 7. Profils gelés
// ---------------------------------------------------------------------------

test('le profil entier reste fermé aux deux opérateurs', () => {
  for (const [source, code] of [['&x', 'UNSUPPORTED_EXPRESSION_OPERATOR'], ['*p', 'MISSING_OPERAND'],
    ['&t[0]', 'UNSUPPORTED_EXPRESSION_OPERATOR'], ['a * *b', 'MISSING_OPERAND']]) {
    const result = parseExpression(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', source);
    assert.equal(result.diagnostic.code, code, source);
  }
  refused('Affecte à x le résultat de "*p".', 'MISSING_OPERAND');
  refused('Retourne le résultat de "&x".', 'UNSUPPORTED_EXPRESSION_OPERATOR');
});

test('le profil d’indice reste fermé : un indice n’est ni une adresse ni un pointé', () => {
  for (const source of ['*p', '&x']) {
    const result = parseIndexExpression(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', source);
  }
  refused('Affiche l’élément "*p" de t.', 'MISSING_OPERAND');
  refused('Affiche l’élément "&x" de t.', 'UNSUPPORTED_EXPRESSION_OPERATOR');
});

// ---------------------------------------------------------------------------
// 8. Rien du lot 18 ni des domaines ultérieurs
// ---------------------------------------------------------------------------

test('aucune arithmétique de pointeurs n’est produite par une formulation du lot', () => {
  // Every output of the lot is checked: none contains a pointer sum.
  for (const [, code] of EXACT) assert.ok(!/\*\s*\w+\s*[-+]/u.test(code.replace('*p = (a + 1);', '')), code);
  // The sum form is the lot 18 frame; the subtraction stays closed.
  refused('Affecte à n le résultat numérique de "*(p - 1)".', 'INVALID_POINTER_OFFSET');
  refused('Affiche la valeur pointée par p + 1.', 'UNEXPECTED_TEXT');
});

test('aucun accès membre, pointeur de fonction ou allocation', () => {
  for (const [source, numeric, condition] of [
  // `p->x` left this list at lot 20, which opened member access in the
  // numeric and condition profiles; the frozen profiles still refuse it.
    ['"texte"', 'INVALID_EXPRESSION_TOKEN', 'INVALID_EXPRESSION_TOKEN'],
  ]) {
    PROFILES.forEach(([name, parse], index) => {
      const result = parse(source, 0, source.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, [numeric, condition][index], `${name} / ${source}`);
    });
  }
  refused('Inclue la bibliothèque stddef.h.', 'UNSUPPORTED_HEADER');
  // D1 defers NULL: no formulation introduces it and no header is added. But
  // `NULL` is not a C17 keyword, so C-A reads it as an ordinary name and
  // cannot refuse it — a limit stated in the bilan rather than hidden.
  assert.equal(translated('Affecte à p le résultat numérique de "NULL".').fragments[0].code, 'p = NULL;\n');
  refused('Crée une fonction nommée f qui retourne un pointeur de type int.', 'UNSUPPORTED_NUMERIC_TYPE');
  refused('Crée une fonction nommée f qui ne retourne rien et prend un pointeur de type int nommé p.', 'UNSUPPORTED_NUMERIC_TYPE');
});

// ---------------------------------------------------------------------------
// 9. Informations pédagogiques passives
// ---------------------------------------------------------------------------

const INFORMATION = [
  ['Déclare un pointeur de type int nommé p.', ['UNINITIALIZED_POINTER', 'POINTER_VS_OBJECT'], 'p'],
  ['Crée un pointeur de type int nommé p avec l’adresse de x.', ['ADDRESS_OF', 'POINTER_VS_OBJECT'], 'x'],
  ['Affecte l’adresse de x à p.', ['ADDRESS_OF', 'POINTER_VS_OBJECT'], 'x'],
  ['Affiche la valeur pointée par p.', ['DEREFERENCE_MEANING', 'ADDRESS_NOT_CHECKED'], 'p'],
  ['Affecte la valeur 5 à la valeur pointée par p.', ['DEREFERENCE_MEANING', 'ADDRESS_NOT_CHECKED'], 'p'],
];
for (const [source, codes, anchor] of INFORMATION) {
  test(`informations de ${source}`, () => {
    const entries = explainInstruction(translated(source));
    assert.deepEqual(entries.map(entry => entry.code), codes);
    assert.equal(source.slice(entries[0].range.start, entries[0].range.end), anchor);
    for (const entry of entries) assert.equal(entry.severity, 'information');
  });
}

test('les informations des opérateurs écrits en expression pointent l’opérateur', () => {
  const source = 'Affecte à n le résultat numérique de "*p + 1".';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), ['DEREFERENCE_MEANING', 'ADDRESS_NOT_CHECKED']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), '*');
  const address = 'Appelle lire avec "&x".';
  const taken = explainInstruction(translated(address));
  assert.equal(taken[0].code, 'ADDRESS_OF');
  assert.equal(address.slice(taken[0].range.start, taken[0].range.end), '&');
});

test('UNINITIALIZED_POINTER ne porte que sur la déclaration sans adresse', () => {
  const declared = explainInstruction(translated('Déclare un pointeur de type int nommé p.'));
  assert.ok(declared.some(entry => entry.code === 'UNINITIALIZED_POINTER'));
  assert.match(declared[0].message, /valeur de ce pointeur est indéterminée/u);
  assert.match(declared[0].message, /comportement indéfini/u);
  const initialised = explainInstruction(translated('Crée un pointeur de type int nommé p avec l’adresse de x.'));
  assert.ok(!initialised.some(entry => entry.code === 'UNINITIALIZED_POINTER'));
});

test('aucune information ne prétend analyser la mémoire', () => {
  const entries = explainInstruction(translated('Affiche la valeur pointée par p.'));
  const checked = entries.find(entry => entry.code === 'ADDRESS_NOT_CHECKED');
  assert.match(checked.message, /ne vérifie ni que ce pointeur a reçu une adresse/u);
  assert.match(checked.message, /Aucune mémoire n’est analysée ici/u);
  assert.ok(!/valide\b(?!.*ni)/u.test(checked.message.replace('ni qu’elle est encore valide', '')), checked.message);
});

test('aucune information de pointeur sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche la valeur de x.', 'Affecte la valeur 5 à x.',
    'Affiche l’élément "0" de t.', 'Affiche la chaîne s.', 'Crée un bloc si "a > 0".']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['ADDRESS_OF', 'POINTER_VS_OBJECT', 'DEREFERENCE_MEANING',
      'UNINITIALIZED_POINTER', 'ADDRESS_NOT_CHECKED']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

test('une information n’est jamais un avertissement, et un calcul reste un calcul', () => {
  for (const [source] of EXACT) {
    for (const entry of explainInstruction(translated(source))) assert.equal(entry.severity, 'information');
  }
  const advisories = analyzeCalculations(translated('Affecte à la valeur pointée par p le résultat numérique de "1 / 0".')).advisories;
  assert.equal(advisories.length, 1);
  assert.equal(advisories[0].code, 'INTEGER_ZERO_DIVISOR');
  assert.equal(advisories[0].severity, 'warning');
});

// ---------------------------------------------------------------------------
// 10. Limites partagées du noyau
// ---------------------------------------------------------------------------

test('le budget de jetons compte les opérateurs unaires', () => {
  const budget = { count: 0 };
  parseNumericExpression('&x', 0, 2, () => undefined, undefined, budget);
  assert.equal(budget.count, 2);
  parseNumericExpression('*p', 0, 2, () => undefined, undefined, budget);
  assert.equal(budget.count, 4);
});

test('une indirection très répétée dépasse le budget sans boucler', () => {
  const source = Array.from({ length: MAX_EXPRESSION_TOKENS }, (_, index) => '*n' + index).join(' + ');
  for (const [name, parse] of PROFILES) {
    const result = parse(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', name);
    assert.equal(result.diagnostic.code, 'EXPRESSION_TOO_COMPLEX', name);
  }
});

// ---------------------------------------------------------------------------
// 11. Intégration et placement
// ---------------------------------------------------------------------------

function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

for (const [label, text, offset] of [
  ['document vide', '', 0],
  ['ligne blanche en fin de fichier', 'int x;\n\n', 7],
  ['dans une fonction, indentée', 'int main(void) {\n    \n}\n', 21],
  ['CRLF', 'int main(void) {\r\n    \r\n}\r\n', 22],
]) {
  test(`placement d’un pointeur ${label}`, () => {
    const result = applied(text, 'Déclare un pointeur de type int nommé p.', offset);
    assert.ok(result.includes('int *p;'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

test('les étoiles déjà présentes ne piègent pas le balayage contextuel', () => {
  const document = 'int main(void) {\n    int *q;\n    \n}\n';
  const result = applied(document, 'Affecte l’adresse de x à q.', document.lastIndexOf('\n    \n') + 1 + 4);
  assert.ok(result.includes('    q = &x;'), result);
});

test('séquence complète déclaration, adresse, écriture indirecte, affichage', () => {
  let document = 'int main(void) {\n    \n}\n';
  for (const source of [
    'Déclare un entier nommé x.',
    'Déclare un pointeur de type int nommé p.',
    'Affecte l’adresse de x à p.',
    'Affecte la valeur 5 à la valeur pointée par p.',
    'Affiche la valeur pointée par p.',
  ]) {
    document = applied(document, source, document.lastIndexOf('\n    \n') + 1 + 4);
  }
  assert.equal(document, 'int main(void) {\n'
    + '    // Déclare un entier nommé x.\n    int x;\n'
    + '    // Déclare un pointeur de type int nommé p.\n    int *p;\n'
    + '    // Affecte l’adresse de x à p.\n    p = &x;\n'
    + '    // Affecte la valeur 5 à la valeur pointée par p.\n    *p = 5;\n'
    + '    // Affiche la valeur pointée par p.\n    printf("%d", *p);\n'
    + '    \n}\n');
});

test('intégration avec boucle, tableau et chaîne', () => {
  assert.equal(translated('Crée une boucle tant que "*p != 0".').fragments[0].code, 'while ((*p) != 0) {\n    \n}\n');
  assert.equal(translated('Affecte à q le résultat numérique de "&t[i]".').fragments[0].code, 'q = (&t[i]);\n');
  assert.equal(translated('Crée un bloc si "*p == \'A\' && n > 0".').fragments[0].code,
    "if ((((*p) == 'A') && (n > 0))) {\n    \n}\n");
});

// ---------------------------------------------------------------------------
// 12. Non-régressions voisines
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Affecte la valeur 5 à x.', 'x = 5;\n'],
  ['Affiche la valeur de x.', 'printf("%d", x);\n'],
  ['Déclare un entier nommé x.', 'int x;\n'],
  ['Déclare une variable de type int nommée x.', 'int x;\n'],
  ['Déclare un tableau de type int nommé t de dimension 3.', 'int t[3];\n'],
  ['Affiche la chaîne s.', 'printf("%s", s);\n'],
  ['Affiche le caractère c.', 'printf("%c", c);\n'],
  ['Affecte à x le résultat de "a + 1".', 'x = (a + 1);\n'],
  ['Affecte à n le résultat numérique de "a * b".', 'n = (a * b);\n'],
  ['Affecte à n le résultat numérique de "(int) 1.5".', 'n = ((int) 1.5);\n'],
]) {
  test(`non-régression voisine : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
