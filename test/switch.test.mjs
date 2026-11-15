import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { resolveSwitchTarget } from '../src/switchTarget.ts';

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
function planned(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  if (result.status !== 'planned') return { refused: result.diagnostics[0].code };
  const [edit] = result.plan.edits;
  return { text: text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end) };
}
function applied(text, source, cursorOffset) {
  const result = planned(text, source, cursorOffset);
  assert.ok(result.text, `${source} aurait dû être plaçable : ${result.refused}`);
  return result.text;
}

// ---------------------------------------------------------------------------
// 1. Les cinq formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Crée un aiguillage sur "jour".', 'switch (jour) {\n    \n}\n', 'SWITCH'],
  ['Ajoute un cas pour la valeur 5.', 'case 5:\n', 'CASE_INT'],
  [`Ajoute un cas pour le caractère 'A'.`, "case 'A':\n", 'CASE_CHAR'],
  ['Ajoute le cas par défaut.', 'default:\n', 'CASE_DEFAULT'],
  ['Sors de l’aiguillage.', 'break;\n', 'BREAK_SWITCH'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 19 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
  });
  test(`lot 19 sortie exacte sans point final : ${source}`, () => {
    const without = source.slice(0, -1);
    assert.equal(translated(without).fragments[0].code, code);
  });
}

test('l’aiguillage est un bloc : corps vide, curseur à l’intérieur', () => {
  const fragment = translated('Crée un aiguillage sur "jour".').fragments[0];
  assert.ok(fragment.cursor, 'le curseur doit être placé dans le bloc');
  assert.equal(fragment.text.charAt(fragment.cursor.offset - 1), ' ');
  // The labels and the exit are plain statements, with no cursor.
  for (const [source] of EXACT.slice(1)) assert.equal(translated(source).fragments[0].cursor, undefined);
});

test('les deux apostrophes désignent le même aiguillage', () => {
  assert.equal(translate("Sors de l'aiguillage.").fragments[0].code, 'break;\n');
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('CRÉE UN AIGUILLAGE SUR "jour".').fragments[0].code, 'switch (jour) {\n    \n}\n');
  refused('Cree un aiguillage sur "jour".', 'UNKNOWN_FORMULATION');
  refused('Ajoute le cas par defaut.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. L’expression contrôlée est entière
// ---------------------------------------------------------------------------

for (const [expression, code] of [['jour', 'switch (jour) {\n    \n}\n'],
  ['5', 'switch (5) {\n    \n}\n'], ['jour + 1', 'switch ((jour + 1)) {\n    \n}\n'],
  ['jour % 7', 'switch ((jour % 7)) {\n    \n}\n'], ['-jour', 'switch ((-jour)) {\n    \n}\n']]) {
  test(`expression d’aiguillage acceptée : ${JSON.stringify(expression)}`, () => {
    assert.equal(translated(`Crée un aiguillage sur "${expression}".`).fragments[0].code, code);
  });
}
for (const [expression, code] of [
  ['1.5', 'INVALID_EXPRESSION_TOKEN'],
  ['1e3', 'INVALID_EXPRESSION_TOKEN'],
  ['a > 0', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['a && b', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['(int) a', 'C_KEYWORD_IDENTIFIER'],
  ["'A'", 'INVALID_EXPRESSION_TOKEN'],
  ['t[i]', 'INVALID_EXPRESSION_TOKEN'],
  ['*p', 'MISSING_OPERAND'],
  ['', 'MISSING_EXPRESSION'],
]) {
  test(`expression d’aiguillage refusée : ${JSON.stringify(expression)}`, () => {
    refused(`Crée un aiguillage sur "${expression}".`, code);
  });
}
test('le profil entier du lot 6 n’est pas modifié par ce lot', () => {
  // The same refusals hold through the historical envelope that uses it.
  refused('Affecte à x le résultat de "1.5".', 'INVALID_EXPRESSION_TOKEN');
  refused('Affecte à x le résultat de "t[i]".', 'INVALID_EXPRESSION_TOKEN');
});
test('délimiteurs de l’expression', () => {
  refused('Crée un aiguillage sur jour.', 'MISSING_EXPRESSION_DELIMITER');
  refused('Crée un aiguillage sur "jour.', 'UNTERMINATED_EXPRESSION');
  // The optional final period attaches to « sur », so nothing follows it.
  refused('Crée un aiguillage sur.', 'MISSING_EXPRESSION');
  refused('Crée un aiguillage.', 'INCOMPLETE_INSTRUCTION');
  refused('Crée un aiguillage pour "jour".', 'UNKNOWN_FORMULATION');
  refused('Crée un aiguillage sur "jour" encore.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 3. Les étiquettes exigent une constante
// ---------------------------------------------------------------------------

for (const [value, code] of [['5', 'case 5:\n'], ['0', 'case 0:\n'], ['-1', 'case -1:\n'],
  ['2147483647', 'case 2147483647:\n']]) {
  test(`étiquette entière : ${value}`, () => {
    assert.equal(translated(`Ajoute un cas pour la valeur ${value}.`).fragments[0].code, code);
  });
}
for (const [literal, code] of [["'A'", "case 'A':\n"], ["'0'", "case '0':\n"], ["' '", "case ' ':\n"],
  [`'${B}0'`, `case '${B}0':\n`], [`'${B}n'`, `case '${B}n':\n`]]) {
  test(`étiquette caractère : ${literal}`, () => {
    assert.equal(translated(`Ajoute un cas pour le caractère ${literal}.`).fragments[0].code, code);
  });
}
test('un nom n’est pas une constante', () => {
  const source = 'Ajoute un cas pour la valeur n.';
  const diagnostic = refused(source, 'CASE_NEEDS_CONSTANT');
  assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), 'n');
  assert.match(diagnostic.message, /exige une constante/u);
  assert.match(diagnostic.message, /C-A ne résout aucun symbole/u);
  refused('Ajoute un cas pour la valeur MAX.', 'CASE_NEEDS_CONSTANT');
});
for (const [value, code] of [['1.5', 'INVALID_INTEGER'], ['+1', 'INVALID_INTEGER'], ['007', 'INVALID_INTEGER'],
  // `0x10` does not start with a letter, so it is a malformed integer rather
  // than a name: the diagnostic names the real problem.
  ['0x10', 'INVALID_INTEGER'], ['1_000', 'INVALID_INTEGER']]) {
  test(`étiquette refusée : ${JSON.stringify(value)}`, () => {
    refused(`Ajoute un cas pour la valeur ${value}.`, code);
  });
}
for (const [literal, code] of [["'ab'", 'INVALID_CHARACTER'], ["''", 'INVALID_CHARACTER'],
  [`'${B}q'`, 'INVALID_CHARACTER_ESCAPE'], ["'a", 'UNTERMINATED_CHARACTER'], ['A', 'MISSING_CHARACTER_DELIMITER']]) {
  test(`étiquette caractère refusée : ${JSON.stringify(literal)}`, () => {
    refused(`Ajoute un cas pour le caractère ${literal}.`, code);
  });
}
test('formulations d’étiquette incomplètes ou hors catalogue', () => {
  refused('Ajoute un cas pour la valeur.', 'INCOMPLETE_INSTRUCTION');
  refused('Ajoute un cas pour.', 'INCOMPLETE_INSTRUCTION');
  refused('Ajoute un cas sur la valeur 5.', 'UNKNOWN_FORMULATION');
  refused('Ajoute un cas pour le nombre 5.', 'UNKNOWN_FORMULATION');
  refused('Ajoute un cas pour la valeur 5 et 6.', 'UNEXPECTED_TEXT');
  refused('Ajoute le cas par défaut encore.', 'UNEXPECTED_TEXT');
  refused('Sors de l’aiguillage maintenant.', 'UNEXPECTED_TEXT');
});
test('aucune plage de cas, aucun cas groupé', () => {
  refused('Ajoute un cas pour les valeurs 1 à 5.', 'UNKNOWN_FORMULATION');
  refused('Ajoute un cas pour la valeur 1 ... 5.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 4. Placement contextuel, et la symétrie des deux refus
// ---------------------------------------------------------------------------

const SWITCH_DOC = 'int main(void) {\n    switch (jour) {\n        \n    }\n}\n';
const LOOP_DOC = 'int main(void) {\n    while (a) {\n        \n    }\n}\n';
const inside = (document) => document.indexOf('\n        \n') + 1 + 8;

test('une étiquette se place dans un aiguillage', () => {
  const result = applied(SWITCH_DOC, 'Ajoute un cas pour la valeur 5.', inside(SWITCH_DOC));
  assert.ok(result.includes('        case 5:'), result);
  assert.ok(applied(SWITCH_DOC, 'Ajoute le cas par défaut.', inside(SWITCH_DOC)).includes('        default:'));
});

test('une étiquette hors d’un aiguillage est refusée', () => {
  assert.equal(planned(LOOP_DOC, 'Ajoute un cas pour la valeur 5.', inside(LOOP_DOC)).refused, 'SWITCH_TARGET_NOT_FOUND');
  assert.equal(planned('int main(void) {\n    \n}\n', 'Ajoute le cas par défaut.', 21).refused, 'SWITCH_TARGET_NOT_FOUND');
  assert.equal(planned('\n', 'Ajoute un cas pour la valeur 5.', 0).refused, 'SWITCH_TARGET_NOT_FOUND');
});

test('la sortie d’aiguillage se place dans un aiguillage', () => {
  assert.ok(applied(SWITCH_DOC, 'Sors de l’aiguillage.', inside(SWITCH_DOC)).includes('        break;'));
});

test('symétrie : chaque sortie refuse quand l’autre structure est plus proche', () => {
  // Lot 11D already refused « sors de la boucle » when a switch is nearer.
  assert.equal(planned(SWITCH_DOC, 'Sors de la boucle la plus intérieure.', inside(SWITCH_DOC)).refused,
    'BREAK_TARGET_IS_SWITCH');
  // This lot is the exact mirror.
  const nested = 'int main(void) {\n    switch (jour) {\n        while (a) {\n            \n        }\n    }\n}\n';
  const at = nested.indexOf('\n            \n') + 1 + 12;
  assert.equal(planned(nested, 'Sors de l’aiguillage.', at).refused, 'BREAK_TARGET_IS_LOOP');
  // And the loop exit works there, since the loop is the nearest.
  assert.ok(applied(nested, 'Sors de la boucle la plus intérieure.', at).includes('            break;'));
});

test('une étiquette traverse une boucle sans la compter comme cible', () => {
  const nested = 'int main(void) {\n    switch (jour) {\n        while (a) {\n            \n        }\n    }\n}\n';
  const at = nested.indexOf('\n            \n') + 1 + 12;
  // A label is not a transfer: the enclosing switch is still its target.
  assert.ok(applied(nested, 'Ajoute un cas pour la valeur 5.', at).includes('            case 5:'));
  const resolution = resolveSwitchTarget(nested, at, true);
  assert.equal(resolution.status, 'resolved');
  assert.equal(resolution.target.loopsCrossed, 1);
});

test('un aiguillage imbriqué est la cible la plus intérieure', () => {
  const nested = 'int main(void) {\n    switch (a) {\n        switch (b) {\n            \n        }\n    }\n}\n';
  const at = nested.indexOf('\n            \n') + 1 + 12;
  const resolution = resolveSwitchTarget(nested, at, true);
  assert.equal(resolution.status, 'resolved');
  assert.equal(nested.slice(resolution.target.keywordRange.start, resolution.target.keywordRange.end), 'switch');
  // The inner one: its brace opens after the outer one.
  assert.ok(resolution.target.braceRange.start > nested.indexOf('switch (a)'));
});

test('un aiguillage se place comme tout autre bloc', () => {
  // Lot 26 : un bloc est une instruction composée, donc refusé à la portée
  // fichier ; le premier cas devient le corps de fonction le plus minimal.
  for (const [text, offset] of [['int main(void) {\n', 17], ['int main(void) {\n    \n}\n', 21], ['int main(void) {\r\n    \r\n}\r\n', 22]]) {
    const result = applied(text, 'Crée un aiguillage sur "jour".', offset);
    assert.ok(result.includes('switch (jour) {'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  }
});

test('aiguillage complet : document final exact', () => {
  let document = 'int main(void) {\n    \n}\n';
  document = applied(document, 'Crée un aiguillage sur "jour".', 21);
  let at = document.indexOf('\n        \n') + 1 + 8;
  for (const source of ['Ajoute un cas pour la valeur 1.', 'Affiche le texte "lundi".', 'Sors de l’aiguillage.',
    'Ajoute le cas par défaut.', 'Affiche le texte "autre".']) {
    document = applied(document, source, at);
    at = document.indexOf('\n        \n') + 1 + 8;
  }
  assert.equal(document, 'int main(void) {\n'
    + '    // Crée un aiguillage sur "jour".\n    switch (jour) {\n'
    + '        // Ajoute un cas pour la valeur 1.\n        case 1:\n'
    + '        // Affiche le texte "lundi".\n        printf("%s", "lundi");\n'
    + '        // Sors de l’aiguillage.\n        break;\n'
    + '        // Ajoute le cas par défaut.\n        default:\n'
    + '        // Affiche le texte "autre".\n        printf("%s", "autre");\n'
    + '        \n    }\n}\n');
});

// ---------------------------------------------------------------------------
// 5. Informations pédagogiques
// ---------------------------------------------------------------------------

test('SWITCH_INTEGER_ONSEUL n’annonce aucune vérification', () => {
  const source = 'Crée un aiguillage sur "jour".';
  const [entry] = explainInstruction(translated(source));
  assert.equal(entry.code, 'SWITCH_INTEGER_ONLY');
  assert.equal(entry.severity, 'information');
  assert.equal(source.slice(entry.range.start, entry.range.end), '"jour"');
  assert.match(entry.message, /doit être entière/u);
  assert.match(entry.message, /ni l’unicité des valeurs, ni la couverture/u);
});

test('SWITCH_FALLTHROUGH et CASE_NEEDS_STATEMENT sur chaque étiquette', () => {
  for (const source of ['Ajoute un cas pour la valeur 5.', `Ajoute un cas pour le caractère 'A'.`]) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    assert.deepEqual(codes, ['SWITCH_FALLTHROUGH', 'CASE_NEEDS_STATEMENT']);
  }
  const entries = explainInstruction(translated('Ajoute le cas par défaut.'));
  assert.deepEqual(entries.map(entry => entry.code),
    ['SWITCH_FALLTHROUGH', 'CASE_NEEDS_STATEMENT', 'DEFAULT_OPTIONAL']);
  assert.match(entries[0].message, /l’exécution continue dans l’étiquette suivante/u);
  assert.match(entries[0].message, /ce n’est pas une erreur en C17/iu);
  assert.match(entries[1].message, /une étiquette doit être suivie d’une instruction/u);
  assert.match(entries[1].message, /ne compile pas/u);
  assert.match(entries[2].message, /facultatif/u);
});

test('BREAK_LEAVES_SWITCH distingue les deux sorties', () => {
  const [entry] = explainInstruction(translated('Sors de l’aiguillage.'));
  assert.equal(entry.code, 'BREAK_LEAVES_SWITCH');
  assert.match(entry.message, /quitte l’aiguillage, pas la fonction/u);
  assert.match(entry.message, /Sors de la boucle la plus intérieure/u);
  // The loop exit of lot 11D carries no information, and still does not.
  assert.deepEqual(explainInstruction(translated('Sors de la boucle la plus intérieure.')), []);
});

test('aucune information d’aiguillage sur les instructions voisines', () => {
  for (const source of ['Crée un bloc si "a > 0".', 'Crée une boucle tant que "a".',
    'Déclare un entier nommé x.', 'Sors de la boucle la plus intérieure.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['SWITCH_INTEGER_ONLY', 'SWITCH_FALLTHROUGH', 'CASE_NEEDS_STATEMENT',
      'DEFAULT_OPTIONAL', 'BREAK_LEAVES_SWITCH']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 6. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Sors de la boucle la plus intérieure.', 'break;\n'],
  ['Passe à l’itération suivante de la boucle la plus intérieure.', 'continue;\n'],
  ['Crée un bloc si "a > 0".', 'if (a > 0) {\n    \n}\n'],
  ['Crée une boucle tant que "a".', 'while (a) {\n    \n}\n'],
  ['Ajoute une branche sinon.', 'else {\n    \n}\n'],
  ['Affecte à x le résultat de "a + 1".', 'x = (a + 1);\n'],
  [`Affecte le caractère 'A' à c.`, "c = 'A';\n"],
  ['Affiche l’élément "i" de t.', 'printf("%d", t[i]);\n'],
  ['Déclare un pointeur de type int nommé p.', 'int *p;\n'],
]) {
  test(`non-régression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}

test('un switch écrit à la main garde le comportement du lot 11D', () => {
  // This is the behaviour lot 11D published, and this lot must not change it.
  assert.equal(planned(SWITCH_DOC, 'Sors de la boucle la plus intérieure.', inside(SWITCH_DOC)).refused,
    'BREAK_TARGET_IS_SWITCH');
  const both = 'int main(void) {\n    while (a) {\n        switch (b) {\n            \n        }\n    }\n}\n';
  const at = both.indexOf('\n            \n') + 1 + 12;
  assert.equal(planned(both, 'Sors de la boucle la plus intérieure.', at).refused, 'BREAK_TARGET_IS_SWITCH');
  assert.ok(applied(both, 'Sors de l’aiguillage.', at).includes('            break;'));
  assert.ok(applied(both, 'Passe à l’itération suivante de la boucle la plus intérieure.', at).includes('            continue;'));
});
