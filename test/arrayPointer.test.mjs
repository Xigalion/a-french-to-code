import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { parseExpression } from '../src/expression.ts';
import { parseNumericExpression, parseIndexExpression } from '../src/numericExpression.ts';
import { parseCondition } from '../src/condition.ts';

const B = String.fromCharCode(92);

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
const numeric = (expression) => `Affecte à n le résultat numérique de "${expression}".`;

// ---------------------------------------------------------------------------
// 1. t[i] et *(t + i), côte à côte
// ---------------------------------------------------------------------------

test('les deux écritures désignent le même élément, et C-A les rend toutes deux', () => {
  assert.equal(translated(numeric('t[i]')).fragments[0].code, 'n = t[i];\n');
  assert.equal(translated(numeric('*(t + i)')).fragments[0].code, 'n = (*(t + i));\n');
  // The indexed envelope of lot 15 is untouched.
  assert.equal(translated('Affiche l’élément "i" de t.').fragments[0].code, 'printf("%d", t[i]);\n');
});

const EXACT = [
  [numeric('*(t + i)'), 'n = (*(t + i));\n'],
  [numeric('*(t + 0)'), 'n = (*(t + 0));\n'],
  [numeric('*(t + i * 2)'), 'n = (*(t + (i * 2)));\n'],
  [numeric('*(t + i + 1)'), undefined],
  [numeric('*(t + u[i])'), 'n = (*(t + u[i]));\n'],
  [numeric('*(t + -i)'), 'n = (*(t + (-i)));\n'],
  [numeric('*(t + (i))'), 'n = (*(t + i));\n'],
  [numeric('*(t + i) + 1'), 'n = ((*(t + i)) + 1);\n'],
  [numeric('*(t + i) * 2'), 'n = ((*(t + i)) * 2);\n'],
  ['Crée un bloc si "*(t + i) > 0".', 'if ((*(t + i)) > 0) {\n    \n}\n'],
  [`Crée une boucle tant que "*(s + i) != '${B}0'".`, `while ((*(s + i)) != '${B}0') {\n    \n}\n`],
  ['Retourne le résultat numérique de "*(t + i)".', 'return (*(t + i));\n'],
  ['Appelle traiter avec "*(t + i)".', 'traiter((*(t + i)));\n'],
  ['Crée une variable de type int nommée v avec le résultat de "*(t + i)".', 'int v = (*(t + i));\n'],
  ['Affecte à la valeur pointée par p le résultat numérique de "*(t + i)".', '*p = (*(t + i));\n'],
];
for (const [source, code] of EXACT) {
  if (code === undefined) continue;
  test(`lot 18 sortie exacte : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
  test(`lot 18 sortie exacte sans point final : ${source}`, () => {
    const without = source.slice(0, -1);
    assert.equal(translated(without).fragments[0].code, code);
  });
}

test('priorité : le déréférencement est parenthésé, le décalage ne fuit pas', () => {
  const code = translated(numeric('*(t + i) + 1')).fragments[0].code;
  assert.equal(code, 'n = ((*(t + i)) + 1);\n');
  assert.ok(!code.includes('*(t + i + 1)'), code);
  // And the other way round: a sum written inside stays inside.
  assert.equal(translated(numeric('*(t + i * 2)')).fragments[0].code, 'n = (*(t + (i * 2)));\n');
});

test('le nœud produit est un déréférencement d’une somme pointeur', () => {
  for (const [, parse] of PROFILES) {
    const result = parsed(parse, '*(t + i)');
    const node = result.expression ?? result.condition.expression;
    assert.equal(node.kind, 'dereference');
    assert.equal(node.operand.kind, 'pointer-sum');
    assert.equal(node.operand.pointer.name, 't');
    assert.equal(node.operand.offset.kind, 'name');
    assert.deepEqual(node.operatorRange, { start: 0, end: 1 });
    assert.deepEqual(node.range, { start: 0, end: 8 });
  }
});

// ---------------------------------------------------------------------------
// 2. Décalages acceptés
// ---------------------------------------------------------------------------

// A sum at the top of the offset must be parenthesized: `*(t + i + 1)` is
// `(t + i) + 1`, whose left member is no longer a name, and it is refused.
for (const offset of ['i', '0', '12', '2u', '(i + 1)', 'i * 2', '(i - 1)', 'i % 3', '-i', '(i)',
  'u[i]', 'u[i + 1]', '(i * j + 1)', 'i * (j + 1)']) {
  test(`décalage accepté : ${JSON.stringify(offset)}`, () => {
    for (const [name, parse] of PROFILES) assert.ok(parsed(parse, `*(t + ${offset})`), name);
  });
}

// ---------------------------------------------------------------------------
// 3. Formes refusées, avec plages UTF-16
// ---------------------------------------------------------------------------

for (const [source, code, start, end] of [
  ['*(p - i)', 'INVALID_POINTER_OFFSET', 1, 8],
  ['*(t + i + j)', 'INVALID_POINTER_OFFSET', 1, 12],
  ['*(t * i)', 'INVALID_POINTER_OFFSET', 1, 8],
  ['*(t / i)', 'INVALID_POINTER_OFFSET', 1, 8],
  ['*(t + 1.5)', 'INVALID_POINTER_OFFSET', 6, 9],
  ['*(t + 1e3)', 'INVALID_POINTER_OFFSET', 6, 9],
  ['*(t + (int) 1)', 'INVALID_POINTER_OFFSET', 6, 13],
  ["*(t + 'A')", 'INVALID_POINTER_OFFSET', 6, 9],
  ['*(t + *q)', 'INVALID_POINTER_OFFSET', 6, 8],
  ['*(t + &x)', 'INVALID_POINTER_OFFSET', 6, 8],
  ['*(t[0] + i)', 'INVALID_POINTER_OFFSET', 1, 11],
  ['*(-t + i)', 'INVALID_POINTER_OFFSET', 1, 9],
  ['*(t + i', 'MISSING_CLOSING_PARENTHESIS', 7, 7],
]) {
  test(`forme hors contrat ${JSON.stringify(source)}`, () => {
    for (const [name, parse] of PROFILES) {
      const result = parse(source, 0, source.length, () => undefined);
      assert.equal(result.status, 'rejected', `${name} / ${source}`);
      assert.equal(result.diagnostic.code, code, `${name} / ${source}`);
      assert.deepEqual(result.diagnostic.range, { start, end }, `${name} / ${source}`);
    }
  });
}

test('le message de refus nomme la forme attendue sans fournir la phrase à recopier', () => {
  const left = refused(numeric('*(p - i)'), 'INVALID_POINTER_OFFSET');
  assert.match(left.message, /Seule la forme \*\(nom \+ décalage entier\) est prise en charge/u);
  const offset = refused(numeric('*(t + 1.5)'), 'INVALID_POINTER_OFFSET');
  assert.match(offset.message, /Le décalage doit être une expression entière/u);
});

test('les plages sont absolues dans la phrase d’origine', () => {
  const source = 'Crée un bloc si "*(t + 1.5) > 0".';
  const diagnostic = refused(source, 'INVALID_POINTER_OFFSET');
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), '1.5');
});

test('les formes du lot 17 gardent leurs diagnostics', () => {
  for (const [source, code] of [['* *p', 'UNSUPPORTED_INDIRECTION_LEVEL'], ['*&x', 'UNSUPPORTED_INDIRECTION_LEVEL'],
    ['*5', 'INVALID_DEREFERENCE_OPERAND'], ['*t[0]', 'INVALID_DEREFERENCE_OPERAND'],
    ['**p', 'UNSUPPORTED_EXPRESSION_OPERATOR']]) {
    const result = parseNumericExpression(source, 0, source.length, () => undefined);
    assert.equal(result.status, 'rejected', source);
    assert.equal(result.diagnostic.code, code, source);
  }
  // `*(p)` stays accepted and stays a plain dereference.
  assert.equal(translated(numeric('*(p)')).fragments[0].code, 'n = (*p);\n');
});

// ---------------------------------------------------------------------------
// 4. Profils gelés
// ---------------------------------------------------------------------------

test('le profil entier reste fermé', () => {
  const result = parseExpression('*(t + i)', 0, 8, () => undefined);
  assert.equal(result.status, 'rejected');
  assert.equal(result.diagnostic.code, 'MISSING_OPERAND');
  refused('Affecte à x le résultat de "*(t + i)".', 'MISSING_OPERAND');
  refused('Retourne le résultat de "*(t + i)".', 'MISSING_OPERAND');
});

test('le profil d’indice reste fermé : un indice n’est pas un décalage déréférencé', () => {
  const result = parseIndexExpression('*(u + i)', 0, 8, () => undefined);
  assert.equal(result.status, 'rejected');
  refused('Affiche l’élément "*(u + i)" de t.', 'MISSING_OPERAND');
});

// ---------------------------------------------------------------------------
// 5. Informations pédagogiques
// ---------------------------------------------------------------------------

const EXPECTED = ['DEREFERENCE_MEANING', 'ARRAY_POINTER_EQUIVALENCE', 'POINTER_ARITHMETIC_LIMITS',
  'OUT_OF_BOUNDS_UNDEFINED', 'OFFSET_TYPE_NOT_CHECKED'];

test('les cinq informations du décalage, dans cet ordre', () => {
  const source = numeric('*(t + i)');
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code), EXPECTED);
  for (const entry of entries) assert.equal(entry.severity, 'information');
  // Four of them anchor on the pointer name, which is where the lesson is.
  for (const entry of entries.slice(1)) {
    assert.equal(source.slice(entry.range.start, entry.range.end), 't');
  }
});

test('ARRAY_POINTER_EQUIVALENCE enseigne la relation sans confondre les types', () => {
  const [, equivalence] = explainInstruction(translated(numeric('*(t + i)')));
  assert.match(equivalence.message, /« t\[i\] » et « \*\(t \+ i\) » désignent le même élément/u);
  assert.match(equivalence.message, /converti en pointeur vers son premier élément/u);
  assert.match(equivalence.message, /ne sont pas pour autant du même type/u);
  // It must never claim the two are the same type.
  assert.ok(!/types identiques|même chose/u.test(equivalence.message), equivalence.message);
});

test('POINTER_ARITHMETIC_LIMITS énonce la position juste après le dernier élément', () => {
  const entries = explainInstruction(translated(numeric('*(t + i)')));
  const limits = entries.find(entry => entry.code === 'POINTER_ARITHMETIC_LIMITS');
  assert.match(limits.message, /en éléments, pas en octets/u);
  assert.match(limits.message, /une position au-delà du dernier élément/u);
  assert.match(limits.message, /ne doit pas être déréférencée/u);
});

test('OUT_OF_BOUNDS_UNDEFINED n’annonce aucune vérification', () => {
  const entries = explainInstruction(translated(numeric('*(t + i)')));
  const bounds = entries.find(entry => entry.code === 'OUT_OF_BOUNDS_UNDEFINED');
  assert.match(bounds.message, /comportement indéfini/u);
  assert.match(bounds.message, /ne vérifie ni les bornes, ni la validité de l’adresse/u);
  assert.ok(!/détecté|détection/iu.test(bounds.message), bounds.message);
});

test('ADDRESS_NOT_CHECKED cède la place, mais reste sur un *p ordinaire', () => {
  const offsetCodes = explainInstruction(translated(numeric('*(t + i)'))).map(entry => entry.code);
  assert.ok(!offsetCodes.includes('ADDRESS_NOT_CHECKED'));
  const plainCodes = explainInstruction(translated(numeric('*p'))).map(entry => entry.code);
  assert.deepEqual(plainCodes, ['DEREFERENCE_MEANING', 'ADDRESS_NOT_CHECKED']);
});

test('aucune information du lot 18 sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Affiche l’élément "0" de t.',
    'Affiche la valeur pointée par p.', 'Affecte l’adresse de x à p.', 'Affiche la chaîne s.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of EXPECTED.slice(1)) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 6. Une forme acceptée ne garantit rien sémantiquement
// ---------------------------------------------------------------------------

test('la grammaire ne sait pas lequel des deux membres est le pointeur', () => {
  // `*(i + t)` is accepted: an identifier is syntactically an integer
  // expression, and C-A resolves no symbol. This is stated, not hidden.
  assert.equal(translated(numeric('*(i + t)')).fragments[0].code, 'n = (*(i + t));\n');
  const entries = explainInstruction(translated(numeric('*(i + t)')));
  const honest = entries.find(entry => entry.code === 'OFFSET_TYPE_NOT_CHECKED');
  assert.match(honest.message, /ne vérifie ni que ce nom désigne un tableau ou un pointeur/u);
  assert.match(honest.message, /ni que le décalage est bien un entier/u);
  assert.match(honest.message, /ne garantit pas que le C produit soit correct/u);
});

test('deux pointeurs additionnés passent la grammaire et produisent un C invalide', () => {
  // `p + q` with both names is accepted by the grammar and is NOT valid C if
  // both are pointers. C-A cannot know, says so, and does not pretend.
  assert.equal(translated(numeric('*(p + q)')).fragments[0].code, 'n = (*(p + q));\n');
  assert.ok(explainInstruction(translated(numeric('*(p + q)')))
    .some(entry => entry.code === 'OFFSET_TYPE_NOT_CHECKED'));
});

test('un décalage hors bornes est traduit sans un mot de plus que l’information passive', () => {
  assert.equal(translated(numeric('*(t + 999999)')).fragments[0].code, 'n = (*(t + 999999));\n');
  assert.deepEqual(analyzeCalculations(translated(numeric('*(t + 999999)'))).advisories, []);
  const codes = explainInstruction(translated(numeric('*(t + 999999)'))).map(entry => entry.code);
  assert.ok(codes.includes('OUT_OF_BOUNDS_UNDEFINED'));
});

test('un diviseur nul dans un décalage reste un avertissement de calcul', () => {
  const advisories = analyzeCalculations(translated(numeric('*(t + 1 / 0)'))).advisories;
  assert.equal(advisories.length, 1);
  assert.equal(advisories[0].code, 'INTEGER_ZERO_DIVISOR');
  assert.equal(advisories[0].severity, 'warning');
});

// ---------------------------------------------------------------------------
// 7. Intégration et placement
// ---------------------------------------------------------------------------

function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

test('parcours par décalage, document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  for (const source of [
    'Déclare un tableau de type int nommé t de dimension 3.',
    'Déclare un entier nommé i.',
    'Affecte la valeur 0 à i.',
  ]) {
    document = applied(document, source, document.lastIndexOf('\n    \n') + 1 + 4);
  }
  document = applied(document, 'Crée une boucle tant que "i < 3".', document.lastIndexOf('\n    \n') + 1 + 4);
  document = applied(document, numeric('*(t + i)'), document.indexOf('\n        \n') + 1 + 8);
  document = applied(document, 'Affecte à i le résultat numérique de "i + 1".', document.indexOf('\n        \n') + 1 + 8);
  assert.equal(document, 'int main(void) {\n'
    + '    // Déclare un tableau de type int nommé t de dimension 3.\n    int t[3];\n'
    + '    // Déclare un entier nommé i.\n    int i;\n'
    + '    // Affecte la valeur 0 à i.\n    i = 0;\n'
    + '    // Crée une boucle tant que "i < 3".\n    while (i < 3) {\n'
    + `        // ${numeric('*(t + i)')}\n        n = (*(t + i));\n`
    + '        // Affecte à i le résultat numérique de "i + 1".\n        i = (i + 1);\n'
    + '        \n    }\n}\n');
});

// Lot 26 : une instruction exécutable n'existe que dans le corps d'une
// fonction. Le cas « document vide » de ce tableau plaçait l'instruction à
// la portée fichier ; il est remplacé par le corps de fonction le plus
// minimal, qui conserve le sujet — indentation de base vide — en rendant la
// portée légale. Le refus à la portée fichier est couvert par
// test/statementScope.test.mjs.
for (const [label, text, offset] of [
  ['corps de fonction, sans indentation', 'int main(void) {\n', 17],
  ['dans une fonction, indentée', 'int main(void) {\n    \n}\n', 21],
  ['CRLF', 'int main(void) {\r\n    \r\n}\r\n', 22],
]) {
  test(`placement d’un décalage ${label}`, () => {
    const result = applied(text, numeric('*(t + i)'), offset);
    assert.ok(result.includes('n = (*(t + i));'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

test('intégration avec fonctions, tableaux, chaînes et pointeurs', () => {
  assert.equal(translated('Crée une fonction nommée somme qui retourne un int et prend un int nommé n.').fragments[0].code,
    'int somme(int n) {\n    \n}\n');
  assert.equal(translated('Retourne le résultat numérique de "*(t + 0)".').fragments[0].code, 'return (*(t + 0));\n');
  assert.equal(translated(`Crée un bloc si "*(s + i) == '${B}0'".`).fragments[0].code,
    `if ((*(s + i)) == '${B}0') {\n    \n}\n`);
  assert.equal(translated(numeric('*(t + i) + *(u + j)')).fragments[0].code, 'n = ((*(t + i)) + (*(u + j)));\n');
});

// ---------------------------------------------------------------------------
// 8. Non-régressions voisines
// ---------------------------------------------------------------------------

for (const [source, code] of [
  [numeric('t[i]'), 'n = t[i];\n'],
  [numeric('*p'), 'n = (*p);\n'],
  [numeric('&x'), 'n = (&x);\n'],
  [numeric('a * b'), 'n = (a * b);\n'],
  [numeric('a + b * c'), 'n = (a + (b * c));\n'],
  ['Affiche l’élément "i" de t.', 'printf("%d", t[i]);\n'],
  ['Affiche la valeur pointée par p.', 'printf("%d", *p);\n'],
  ['Déclare un pointeur de type int nommé p.', 'int *p;\n'],
  ['Affecte l’adresse de x à p.', 'p = &x;\n'],
  ['Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".', 'char s[6] = "hello";\n'],
]) {
  test(`non-régression voisine : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
