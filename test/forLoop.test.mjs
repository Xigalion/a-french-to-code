import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const forLoop = (name, initial, condition, update) =>
  `Crée une boucle pour ${name} de valeur initiale "${initial}" tant que "${condition}" avec mise à jour "${update}".`;
const standard = forLoop('i', '0', 'i < 3', 'i + 1');

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.equal(result.fragments.length, 1);
  assert.equal(result.fragments[0].comment, '// ' + source);
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('fragments' in result) && !('instruction' in result));
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].category, 'understanding');
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  if (range) assert.deepEqual(result.diagnostics[0].range, range, JSON.stringify(result.diagnostics[0]));
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// Traduction : trois clauses explicites, aucune valeur par défaut.
// ---------------------------------------------------------------------------

const renderings = [
  [['i', '0', 'i < 3', 'i + 1'], 'for (i = 0; i < 3; i = (i + 1)) {'],
  [['i', '1', 'i <= limite', 'i + 1'], 'for (i = 1; i <= limite; i = (i + 1)) {'],
  [['i', 'limite', 'i > 0', 'i - 1'], 'for (i = limite; i > 0; i = (i - 1)) {'],
  [['compteur', '0', 'compteur < n && actif', 'compteur + pas'],
    'for (compteur = 0; ((compteur < n) && actif); compteur = (compteur + pas)) {'],
  [['i', '0', '!fini', 'i + 1'], 'for (i = 0; (!fini); i = (i + 1)) {'],
  [['i', '-1', 'i < 0', 'i + 1'], 'for (i = (-1); i < 0; i = (i + 1)) {'],
  [['i', '0', 'i < 10', 'i * 2'], 'for (i = 0; i < 10; i = (i * 2)) {'],
  [['x', '0.0', 'x < 1.0', 'x + 0.25'], 'for (x = 0.0; x < 1.0; x = (x + 0.25)) {'],
  [['i', '(int) 0.0', 'i < 3', '(int) (i + 1)'], 'for (i = ((int) 0.0); i < 3; i = ((int) (i + 1))) {'],
  [['i', '0', 'i % 2 == 0', 'i + 2'], 'for (i = 0; (i % 2) == 0; i = (i + 2)) {'],
  [['i', '0', '1', 'i + 1'], 'for (i = 0; 1; i = (i + 1)) {'],
];
for (const [[name, initial, condition, update], header] of renderings) {
  for (const suffix of ['.', '']) {
    test(`FOR rendu : ${header.slice(0, 56)} / ${JSON.stringify(suffix)}`, () => {
      const base = forLoop(name, initial, condition, update);
      const source = suffix === '.' ? base : base.slice(0, -1);
      const result = translated(source);
      assert.equal(result.instruction.kind, 'FOR');
      const code = `${header}\n    \n}\n`;
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset), '\n}\n');
      // Exactly the two semicolons of a C for header, no ++ and no --.
      assert.equal((code.match(/;/gu) ?? []).length, 2);
      assert.ok(!/\+\+|--|#include|int main|return|while|else/u.test(code));
      // No declaration is generated in the header: no type is ever invented.
      assert.ok(!/for \((?:int|unsigned|float|double|char|long|short) /u.test(code));
    });
  }
}

test('FOR : le compteur garde son nom et sa casse, sans déclaration ajoutée', () => {
  assert.equal(translated(forLoop('Compteur_1', '0', 'Compteur_1 < N', 'Compteur_1 + 1')).fragments[0].code,
    'for (Compteur_1 = 0; Compteur_1 < N; Compteur_1 = (Compteur_1 + 1)) {\n    \n}\n');
  // The counter need not be declared for the sentence to translate: that is a
  // C error for the student to see, not a placement impossibility.
  assert.equal(translated(forLoop('jamais_declare', '0', 'jamais_declare < 3', 'jamais_declare + 1')).instruction.kind, 'FOR');
});

test('FOR préserve espaces, casse, accents et tabulations de la phrase', () => {
  const source = '\tCRÉE\tune BOUCLE pour\ti DE\tvaleur\tINITIALE "0" tant que "i < 3" AVEC\tmise\tà\tJOUR "i + 1". \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  assert.equal(result.fragments[0].code, 'for (i = 0; i < 3; i = (i + 1)) {\n    \n}\n');
});

test('FOR : aucune clause vide interprétée comme vraie', () => {
  refused(forLoop('i', '', 'i < 3', 'i + 1'), 'MISSING_EXPRESSION');
  refused(forLoop('i', '0', '', 'i + 1'), 'MISSING_CONDITION');
  refused(forLoop('i', '0', 'i < 3', ''), 'MISSING_EXPRESSION');
  // The messages name the missing field, without offering a phrase to copy.
  assert.match(refused(forLoop('i', '', 'i < 3', 'i + 1')).message, /valeur initiale du compteur/u);
  assert.match(refused(forLoop('i', '0', '', 'i + 1')).message, /condition de la boucle/u);
  assert.match(refused(forLoop('i', '0', 'i < 3', '')).message, /mise à jour du compteur/u);
});

const incomplete = [
  ['Crée une boucle pour', 'Il manque le nom du compteur.'],
  ['Crée une boucle pour i', '« de » attendu'],
  ['Crée une boucle pour i de', '« valeur » attendu'],
  ['Crée une boucle pour i de valeur', '« initiale » attendu'],
  ['Crée une boucle pour i de valeur initiale', 'valeur initiale du compteur'],
  ['Crée une boucle pour i de valeur initiale "0"', '« tant » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant', '« que » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant que', 'condition de la boucle'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3"', '« avec » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec', '« mise » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise', '« à » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à', '« jour » attendu'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour', 'mise à jour du compteur'],
];
for (const [source, expected] of incomplete) {
  test(`FOR incomplet : ${source.slice(16, 80)}`, () => {
    const diagnostic = refused(source);
    assert.ok(['INCOMPLETE_INSTRUCTION', 'MISSING_EXPRESSION', 'MISSING_CONDITION'].includes(diagnostic.code), diagnostic.code);
    assert.deepEqual(diagnostic.range, { start: source.length, end: source.length });
    assert.ok(diagnostic.message.includes(expected), `${diagnostic.message} / ${expected}`);
  });
}

const wrongWords = [
  ['Crée une boucle pour i de valeur depart "0" tant que "i < 3" avec mise à jour "i + 1".', 'depart'],
  ['Crée une boucle pour i de valeur initiale "0" jusqu’à "i == 3" avec mise à jour "i + 1".', 'jusqu’à'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise a jour "i + 1".', 'a'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec incrément "i + 1".', 'incrément'],
  ['Cree une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".', undefined],
];
for (const [source, token] of wrongWords) {
  test(`FOR : mot fixe refusé ${JSON.stringify(token ?? 'Cree')}`, () => {
    const diagnostic = refused(source, 'UNKNOWN_FORMULATION');
    if (token) assert.equal(source.slice(diagnostic.range.start, diagnostic.range.end), token);
  });
}

const otherRefusals = [
  [forLoop('int', '0', 'i < 3', 'i + 1'), 'C_KEYWORD_IDENTIFIER'],
  [forLoop('1i', '0', 'i < 3', 'i + 1'), 'INVALID_IDENTIFIER'],
  [forLoop('i', '0', 'i = 3', 'i + 1'), 'ASSIGNMENT_IN_CONDITION'],
  [forLoop('i', '0', 'a < b < c', 'i + 1'), 'CHAINED_COMPARISON'],
  [forLoop('i', '0', 'i < 3', 'i++'), 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  [forLoop('i', '0', 'i < 3', 'i = i + 1'), 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  [forLoop('i', '0', 'i < 3', 'i < 3'), 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  [forLoop('i', 'i < 3', 'i < 3', 'i + 1'), 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  [forLoop('i', '0x10', 'i < 3', 'i + 1'), 'UNSUPPORTED_NUMERIC_LITERAL'],
  [forLoop('i', '0', 'i < 3', '0x10'), 'UNSUPPORTED_NUMERIC_LITERAL'],
  ['Crée une boucle pour i de valeur initiale 0 tant que "i < 3" avec mise à jour "i + 1".', 'MISSING_EXPRESSION_DELIMITER'],
  // Quotes are read pairwise: a clause left open mid-sentence surfaces as the
  // next word being unexpected. C-A does not guess which quote was forgotten.
  ['Crée une boucle pour i de valeur initiale "0 tant que "i < 3" avec mise à jour "i + 1".', 'UNKNOWN_FORMULATION'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3 avec mise à jour "i + 1".', 'UNKNOWN_FORMULATION'],
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1', 'UNTERMINATED_EXPRESSION'],
  [forLoop('i', '0', 'i < 3', 'i + 1') + ' Et arrête.', 'UNEXPECTED_TEXT'],
  [standard.slice(0, -1) + ' .', 'UNEXPECTED_TEXT'],
  [standard.replace('.', '\n'), 'INVALID_SEPARATOR'],
];
for (const [source, code] of otherRefusals) {
  test(`FOR refus ${code} ${JSON.stringify(source.slice(16, 60))}`, () => refused(source, code));
}

test('FOR : les trois clauses partagent un seul budget de 1 024 tokens', () => {
  const term = count => Array(count).fill('a').join('+');
  // 170 names = 339 tokens per clause; three clauses reach 1 017, then 1 020.
  translated(forLoop('i', term(170), `${term(170)} < 3`, term(170)));
  // One more name in a single clause pushes the shared total past the limit.
  refused(forLoop('i', term(170), `${term(170)} < 3`, term(175)), 'EXPRESSION_TOO_COMPLEX');
  // A clause that alone fits would still be refused once the budget is spent.
  refused(forLoop('i', term(512), `${term(512)} < 3`, 'i + 1'), 'EXPRESSION_TOO_COMPLEX');
});

test('FOR : la profondeur de 64 niveaux reste propre à chaque clause', () => {
  const deep = n => '('.repeat(n) + 'i' + ')'.repeat(n);
  translated(forLoop('i', deep(64), 'i < 3', deep(64)));
  refused(forLoop('i', deep(65), 'i < 3', 'i + 1'), 'EXPRESSION_TOO_COMPLEX');
  refused(forLoop('i', '0', 'i < 3', deep(65)), 'EXPRESSION_TOO_COMPLEX');
});

test('FOR : littéraux longs conservés textuellement', () => {
  const digits = '9'.repeat(2048);
  assert.equal(translated(forLoop('i', '0', `i < ${digits}`, 'i + 1')).fragments[0].code,
    `for (i = 0; i < ${digits}; i = (i + 1)) {\n    \n}\n`);
});

// ---------------------------------------------------------------------------
// Placement.
// ---------------------------------------------------------------------------

function input(text, source = standard, unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'for.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
}
function planned(request) {
  const original = structuredClone(request);
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(request, original);
  assert.deepEqual(planPlacement(request), result);
  const plan = result.plan;
  assert.equal(validatePlan(plan, request.document).status, 'current');
  const edit = plan.edits[0];
  assert.equal(plan.edits.length, 1);
  assert.match(request.document.text.slice(edit.range.start, edit.range.end), /^[ \t]*(?:\r\n|\n)?$/u);
  const text = request.document.text.slice(0, edit.range.start) + edit.newText + request.document.text.slice(edit.range.end);
  assert.equal(text.slice(0, edit.range.start), request.document.text.slice(0, edit.range.start));
  assert.equal(text.slice(edit.range.start + edit.newText.length), request.document.text.slice(edit.range.end));
  return { plan, text };
}
function placementRefused(request, code) {
  const result = planPlacement(request);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('plan' in result));
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
}

for (const eol of ['\n', '\r\n']) {
  for (const unit of ['  ', '    ', '\t']) {
    test(`FOR placement et curseur ${JSON.stringify([eol, unit])}`, () => {
      const prefix = 'int main(void) {' + eol + unit + 'int i;' + eol + unit;
      const suffix = eol + '}' + eol;
      const { plan, text } = planned(input(prefix + suffix, standard, unit, eol, prefix.length));
      assert.equal(text, prefix + '// ' + standard + eol
        + unit + 'for (i = 0; i < 3; i = (i + 1)) {' + eol
        + unit + unit + eol
        + unit + '}' + suffix);
      assert.equal(text.slice(plan.cursorAfter - unit.length * 2, plan.cursorAfter), unit + unit);
      assert.equal(text.slice(plan.cursorAfter, plan.cursorAfter + eol.length), eol);
      assert.ok(text.includes(unit + 'int i;'));
      assert.equal(plan.attachment, undefined);
    });
  }
}

test('FOR : fichier vide, aucun main ni déclaration implicite', () => {
  // Lot 26 : refus à la portée fichier, puis vérification que dans un corps
  // valide la boucle n'invente toujours ni main ni déclaration de i.
  placementRefused(input('', standard, '    ', '\n', 0), 'STATEMENT_AT_FILE_SCOPE');
  const head = 'int main(void) {\n';
  const { text } = planned(input(head, standard, '    ', '\n', head.length));
  assert.equal(text, head + '// ' + standard + '\nfor (i = 0; i < 3; i = (i + 1)) {\n    \n}\n');
  assert.ok(!text.includes('int i;'));
});

test('FOR : cible non blanche refusée', () => {
  placementRefused(input('int i;\n', standard, '    ', '\n', 0), 'TARGET_LINE_NOT_BLANK');
  placementRefused(input('int i;', standard, '    ', '\n', 6), 'TARGET_LINE_NOT_BLANK');
});

const branchRefused = [
  'for (i = 0; i < 3; i = (i + 1)) {\n}\n\n',
  'if (a) {\n}\nfor (i = 0; i < 3; i = (i + 1)) {\n}\n\n',
];
for (const text of branchRefused) {
  for (const source of ['Ajoute une branche sinon.', 'Ajoute une branche sinon si "b".']) {
    test(`FOR : branche refusée après la boucle ${JSON.stringify(text.slice(0, 12))}`, () => {
      placementRefused(input(text, source, '    ', '\n', text.length));
    });
  }
}

test('FOR : imbrication et préservation du code existant', () => {
  const eol = '\n';
  const unit = '    ';
  const text = 'int main(void) {' + eol + unit + 'int i;' + eol + unit + 'int j;' + eol + unit + eol + unit + 'int apres = 9;' + eol + '}' + eol;
  const outer = planned(input(text, standard, unit, eol, text.indexOf(unit + eol) + unit.length));
  const inner = planned(input(outer.text, forLoop('j', '0', 'j < 2', 'j + 1'), unit, eol, outer.plan.cursorAfter));
  assert.ok(inner.text.includes(unit + 'for (i = 0; i < 3; i = (i + 1)) {'));
  assert.ok(inner.text.includes(unit.repeat(2) + 'for (j = 0; j < 2; j = (j + 1)) {'));
  assert.ok(inner.text.includes(unit + 'int i;'));
  assert.ok(inner.text.endsWith(unit + 'int apres = 9;' + eol + '}' + eol));
  assert.equal((inner.text.match(/for \(/gu) ?? []).length, 2);
});

test('FOR dans un bloc si, et bloc si dans un for', () => {
  // Lot 26 : contextes écrits à la main placés dans une fonction.
  const inIf = 'int main(void) {\nif (a) {\n    \n}\n}\n';
  assert.ok(planned(input(inIf, standard, '    ', '\n', inIf.indexOf('    \n'))).text.includes('    for (i = 0;'));
  const inFor = 'int main(void) {\nfor (i = 0; i < 3; i = (i + 1)) {\n    \n}\n}\n';
  assert.ok(planned(input(inFor, 'Crée un bloc si "i == 0".', '    ', '\n', inFor.indexOf('    \n'))).text.includes('    if (i == 0) {'));
});

for (const field of ['code', 'source', 'cursor', 'instruction']) {
  test(`FOR : traduction falsifiée refusée (${field})`, () => {
    const request = input('int main(void) {\n    \n}\n', standard, '    ', '\n', 17);
    if (field === 'code') request.translation.fragments[0].code = 'for (i = 0; i < 4; i = (i + 1)) {\n    \n}\n';
    if (field === 'source') request.translation.source.text = forLoop('i', '0', 'i < 4', 'i + 1');
    if (field === 'cursor') request.translation.fragments[0].cursor.offset++;
    if (field === 'instruction') request.translation.instruction.name = 'j';
    placementRefused(request, 'INVALID_TRANSLATION_RESULT');
  });
}

// ---------------------------------------------------------------------------
// Pédagogie : ordre des trois clauses, avis sur les trois clauses.
// ---------------------------------------------------------------------------

test('FOR_CLAUSE_ORDER : information passive sur l’ordre d’exécution', () => {
  const result = translated(standard);
  const information = explainInstruction(result);
  assert.equal(information.length, 1);
  assert.equal(information[0].code, 'FOR_CLAUSE_ORDER');
  assert.equal(information[0].severity, 'information');
  assert.equal(standard.slice(information[0].range.start, information[0].range.end), 'i < 3');
  assert.match(information[0].message, /initialisation est exécutée une fois avant le premier test/u);
  assert.match(information[0].message, /testée avant chaque itération/u);
  assert.match(information[0].message, /mise à jour est exécutée après le corps/u);
  assert.match(information[0].message, /Aucune progression ni terminaison n’est déduite/u);
  assert.ok(!/boucle infinie|arrêt garanti|3 itérations/u.test(information[0].message));
});

test('les trois formes de boucle ont trois informations de moment distinctes', () => {
  const codes = [
    'Crée une boucle tant que "i < 3".',
    'Crée une boucle avec test final tant que "i < 3".',
    standard,
  ].map(source => explainInstruction(translated(source))[0].code);
  assert.deepEqual(codes, ['WHILE_PRETEST', 'DO_WHILE_POSTTEST', 'FOR_CLAUSE_ORDER']);
});

test('FOR_CLAUSE_ORDER précède les informations d’opérateurs', () => {
  const information = explainInstruction(translated(forLoop('i', '0', '!fini && (i < 3 || forcer)', 'i + 1')));
  assert.deepEqual(information.map(entry => entry.code),
    ['FOR_CLAUSE_ORDER', 'LOGICAL_NOT', 'SHORT_CIRCUIT_AND', 'SHORT_CIRCUIT_OR']);
});

const advisoryCases = [
  [['i', '10 / 0', 'i < 3', 'i + 1'], 'INTEGER_ZERO_DIVISOR', 'valeur initiale'],
  [['i', '0', 'i < 10 / 0', 'i + 1'], 'INTEGER_ZERO_DIVISOR', 'condition'],
  [['i', '0', 'i < 3', 'i + 10 / 0'], 'INTEGER_ZERO_DIVISOR', 'mise à jour'],
  [['i', '0', 'i < 3', '7.5 % 2'], 'FLOAT_REMAINDER_OPERAND', 'mise à jour'],
];
for (const [[name, initial, condition, update], code, where] of advisoryCases) {
  test(`FOR : avis du lot 8 dans la clause « ${where} »`, () => {
    const result = translated(forLoop(name, initial, condition, update));
    const advisories = analyzeCalculations(result).advisories;
    assert.ok(advisories.some(advice => advice.code === code), JSON.stringify(advisories));
    assert.ok(advisories.every(advice => advice.severity === 'warning' && advice.category === 'calculation'));
    assert.equal(explainInstruction(result)[0].code, 'FOR_CLAUSE_ORDER');
  });
}

test('FOR : un avis par clause fautive, triés par position', () => {
  const result = translated(forLoop('i', '1 / 0', 'i < 2 / 0', 'i + 3 / 0'));
  const advisories = analyzeCalculations(result).advisories;
  assert.equal(advisories.length, 3);
  assert.ok(advisories.every(advice => advice.code === 'INTEGER_ZERO_DIVISOR'));
  for (let index = 1; index < advisories.length; index++) {
    assert.ok(advisories[index - 1].range.start < advisories[index].range.start);
  }
});

test('FOR : aucun avertissement de terminaison ou de nombre de tours', () => {
  for (const source of [standard, forLoop('i', '0', '1', 'i + 0'), forLoop('i', '0', 'i > 0', 'i + 1')]) {
    assert.deepEqual(analyzeCalculations(translated(source)).advisories, []);
    assert.equal(explainInstruction(translated(source)).length, 1);
  }
});

test('FOR : session, information passive et confirmation unique', () => {
  const text = 'int main(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: 17, singleCursor: true,
    indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, standard);
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.equal(session.advisories.length, 0);
  assert.equal(session.information.length, 1);
  assert.equal(session.information[0].code, 'FOR_CLAUSE_ORDER');
  assert.ok(prepared.preview.after.includes('    for (i = 0; i < 3; i = (i + 1)) {'));
  session.reviewReady(prepared.preview.token, target);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'error');
});

// ---------------------------------------------------------------------------
// Non-régression.
// ---------------------------------------------------------------------------

test('11C : switch reste non livré', () => {
  for (const source of ['Crée un bloc selon "i".', 'Choisis selon "i".']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('11C : les sorties des lots 11A, 11B et historiques sont inchangées', () => {
  assert.equal(translated('Crée une boucle tant que "i < 3".').fragments[0].code, 'while (i < 3) {\n    \n}\n');
  assert.equal(translated('Crée une boucle avec test final tant que "i < 3".').fragments[0].code,
    'do {\n    \n} while (i < 3);\n');
  assert.equal(translated('Crée un bloc si "age >= 18".').fragments[0].code, 'if (age >= 18) {\n    \n}\n');
  assert.equal(translated('Affecte à resultat le résultat de "2 + 3 * 4".').fragments[0].code, 'resultat = (2 + (3 * 4));\n');
  assert.equal(translated('Crée un entier nommé age de valeur 20.').fragments[0].code, 'int age = 20;\n');
});

test('11C : le budget partagé ne change pas les instructions à une seule expression', () => {
  // 512 names = 1 023 tokens for a bare expression; a condition adds « < » and
  // « 3 », so 511 names is its exact limit. Both bounds are the historical ones.
  translated(`Affecte à r le résultat de "${Array(512).fill('a').join('+')}".`);
  refused(`Affecte à r le résultat de "${Array(513).fill('a').join('+')}".`, 'EXPRESSION_TOO_COMPLEX');
  translated(`Crée un bloc si "${Array(511).fill('a').join('+')} < 3".`);
  refused(`Crée un bloc si "${Array(512).fill('a').join('+')} < 3".`, 'EXPRESSION_TOO_COMPLEX');
});
