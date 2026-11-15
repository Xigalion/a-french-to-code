import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const PREFIX = 'Crée une boucle avec test final tant que';
const doWhile = condition => `${PREFIX} "${condition}".`;
const loop = condition => `Crée une boucle tant que "${condition}".`;

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

test('11B : le préfixe fixe a la longueur attendue', () => {
  // The UTF-16 oracles below are expressed against this exact prefix.
  assert.equal(PREFIX.length, 40);
});

// ---------------------------------------------------------------------------
// Traduction : structure complète, condition après la fermeture.
// ---------------------------------------------------------------------------

const renderings = [
  ['i < limite', 'i < limite'],
  ['actif', 'actif'],
  ['0', '0'],
  ['1', '1'],
  ['i + 1 < limite', '(i + 1) < limite'],
  ['i < limite && !suspendu', '((i < limite) && (!suspendu))'],
  ['a || b && c', '(a || (b && c))'],
  ['!a == b', '(!a) == b'],
  ['!(a == b)', '(!(a == b))'],
  ['(double) total / nombre > 2.5', '(((double) total) / nombre) > 2.5'],
  ['i % 2 == 0', '(i % 2) == 0'],
];
for (const [condition, rendered] of renderings) {
  for (const suffix of ['', '.']) {
    test(`DO_WHILE rendu : ${condition.slice(0, 50)} / ${JSON.stringify(suffix)}`, () => {
      const source = `${PREFIX} "${condition}"${suffix}`;
      const result = translated(source);
      assert.equal(result.instruction.kind, 'DO_WHILE');
      const code = `do {\n    \n} while (${rendered});\n`;
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
      // Cursor inside the empty body, after the four spaces.
      assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset), `\n} while (${rendered});\n`);
      // The single semicolon is the one C requires after the final condition.
      assert.equal((code.match(/;/gu) ?? []).length, 1);
      assert.ok(code.endsWith(');\n'));
      assert.ok(!/#include|int main|return|\+\+|--|else|for /u.test(code));
    });
  }
}

test('DO_WHILE : la condition est donnée à la création, pas retrouvée plus tard', () => {
  // No request ever asks the engine to close an already open « do ».
  refused('Ferme la boucle avec test final.', 'UNKNOWN_FORMULATION');
  refused('Ajoute la condition finale "i < 3".', 'UNKNOWN_FORMULATION');
  refused(`${PREFIX}.`, 'MISSING_CONDITION');
});

test('DO_WHILE préserve espaces, casse, accents et tabulations', () => {
  const source = '\tCRÉE\tune BOUCLE avec\tTEST\tfinal tant\tque "I\t<\tLimite". \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  assert.equal(result.fragments[0].code, 'do {\n    \n} while (I < Limite);\n');
});

test('DO_WHILE : accents exigés et synonymes refusés', () => {
  refused('Cree une boucle avec test final tant que "i < 3".', 'UNKNOWN_FORMULATION');
  refused('Crée une boucle avec test finale tant que "i < 3".', 'UNKNOWN_FORMULATION');
  refused('Crée une boucle avec test final jusqu’à "i == 3".', 'UNKNOWN_FORMULATION');
  refused('Crée une boucle do while "i < 3".', 'UNKNOWN_FORMULATION');
});

const incomplete = [
  ['Crée une boucle avec', '« test » attendu'],
  ['Crée une boucle avec test', '« final » attendu'],
  ['Crée une boucle avec test final', '« tant » attendu'],
  ['Crée une boucle avec test final tant', '« que » attendu'],
];
for (const [source, expected] of incomplete) {
  test(`DO_WHILE incomplet : ${source}`, () => {
    const diagnostic = refused(source, 'INCOMPLETE_INSTRUCTION', { start: source.length, end: source.length });
    assert.ok(diagnostic.message.includes(expected), diagnostic.message);
  });
}

// ---------------------------------------------------------------------------
// Refus et plages UTF-16, comptés sur le préfixe de 40 unités.
// ---------------------------------------------------------------------------

const oracles = [
  [PREFIX, 'MISSING_CONDITION', { start: 40, end: 40 }],
  [`${PREFIX} "".`, 'MISSING_CONDITION', { start: 42, end: 42 }],
  [`${PREFIX} "i &&".`, 'MISSING_OPERAND', { start: 46, end: 46 }],
  [`${PREFIX} "i = 3".`, 'ASSIGNMENT_IN_CONDITION', { start: 44, end: 45 }],
  [`${PREFIX} "A\u{1F600}B < 3".`, 'INVALID_IDENTIFIER', { start: 42, end: 46 }],
  [`${PREFIX} "i < 3`, 'UNTERMINATED_CONDITION', { start: 41, end: 47 }],
];
for (const [source, code, range] of oracles) {
  test(`DO_WHILE oracle ${code}`, () => {
    refused(source, code, range);
    assert.ok(range.end <= source.length);
  });
}

test('DO_WHILE : message de condition absente propre à la boucle', () => {
  assert.match(refused(PREFIX, 'MISSING_CONDITION').message, /condition de la boucle/u);
  assert.match(refused(`${PREFIX} "".`, 'MISSING_CONDITION').message, /condition de la boucle/u);
});

test('DO_WHILE : exactement les mêmes exclusions que WHILE et IF', () => {
  for (const condition of ['i = 3', 'a < b < c', 'i++', 'i & 1', 'a ? b : c', '(i < 3', 'i < 3)', '0x10 < 3', 'i, j']) {
    const codes = [doWhile(condition), loop(condition), `Crée un bloc si "${condition}".`].map(source => {
      const result = translate(source);
      assert.equal(result.status, 'rejected', source);
      return result.diagnostics[0].code;
    });
    assert.equal(codes[0], codes[1], condition);
    assert.equal(codes[0], codes[2], condition);
  }
});

test('DO_WHILE : budgets partagés, sans remise à zéro', () => {
  translated(doWhile('('.repeat(64) + 'i >= 0' + ')'.repeat(64)));
  refused(doWhile('('.repeat(65) + 'i >= 0' + ')'.repeat(65)), 'EXPRESSION_TOO_COMPLEX');
  const term = Array(171).fill('a').join('+');
  translated(doWhile([term, term].join('&&')));
  refused(doWhile([term, term, term].join('&&')), 'EXPRESSION_TOO_COMPLEX');
});

// ---------------------------------------------------------------------------
// Placement : la fermeture porte la condition et le point-virgule.
// ---------------------------------------------------------------------------

function input(text, source = doWhile('i < limite'), unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'dowhile.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
}
function planned(request) {
  const original = structuredClone(request);
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(request, original);
  assert.deepEqual(planPlacement(request), result);
  const plan = result.plan;
  assert.equal(validatePlan(plan, request.document).status, 'current');
  assert.equal(plan.edits.length, 1);
  const edit = plan.edits[0];
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
    test(`DO_WHILE placement et curseur ${JSON.stringify([eol, unit])}`, () => {
      const prefix = 'int main(void) {' + eol + unit;
      const suffix = eol + '}' + eol;
      const { plan, text } = planned(input(prefix + suffix, doWhile('i < limite'), unit, eol, prefix.length));
      assert.equal(text, prefix + '// ' + doWhile('i < limite') + eol
        + unit + 'do {' + eol
        + unit + unit + eol
        + unit + '} while (i < limite);' + suffix);
      assert.equal(text.slice(plan.cursorAfter - unit.length * 2, plan.cursorAfter), unit + unit);
      assert.equal(text.slice(plan.cursorAfter, plan.cursorAfter + eol.length), eol);
      // No input line is created after the closing line.
      assert.ok(text.endsWith(unit + '} while (i < limite);' + suffix));
      assert.equal(plan.attachment, undefined);
    });
  }
}

test('DO_WHILE : fichier vide, aucun main implicite', () => {
  // Lot 26 : refus à la portée fichier, puis le même rendu dans un corps.
  placementRefused(input('', doWhile('1'), '    ', '\n', 0), 'STATEMENT_AT_FILE_SCOPE');
  const head = 'int main(void) {\n';
  const { text } = planned(input(head, doWhile('1'), '    ', '\n', head.length));
  assert.equal(text, head + '// ' + doWhile('1') + '\ndo {\n    \n} while (1);\n');
});

test('DO_WHILE : ligne non blanche et EOF occupée refusées', () => {
  placementRefused(input('int x;\n', doWhile('x'), '    ', '\n', 0), 'TARGET_LINE_NOT_BLANK');
  placementRefused(input('int x;', doWhile('x'), '    ', '\n', 6), 'TARGET_LINE_NOT_BLANK');
});

// A do/while closing line ends with « ; », so it can never be read as the tail
// of an if chain: no else attaches to it, and no neighbouring if is used.
const branchRefused = [
  'do {\n} while (a);\n\n',
  'if (a) {\n}\ndo {\n} while (b);\n\n',
  'do {\n    if (b) {\n    }\n} while (a);\n\n',
];
for (const text of branchRefused) {
  for (const source of ['Ajoute une branche sinon.', 'Ajoute une branche sinon si "b".']) {
    test(`DO_WHILE : branche refusée après la fermeture ${JSON.stringify(text.slice(0, 20))}`, () => {
      placementRefused(input(text, source, '    ', '\n', text.length));
    });
  }
}

test('DO_WHILE : imbrications et préservation du code existant', () => {
  const eol = '\n';
  const unit = '    ';
  const text = 'int main(void) {' + eol + unit + 'int manuel = 1;' + eol + unit + eol + unit + 'int apres = 9;' + eol + '}' + eol;
  const outer = planned(input(text, doWhile('i < limite'), unit, eol, text.indexOf(unit + eol) + unit.length));
  assert.ok(outer.text.includes(unit + 'int manuel = 1;'));
  assert.ok(outer.text.endsWith(unit + 'int apres = 9;' + eol + '}' + eol));
  // A while inside the do body, then an if inside that while.
  const inner = planned({ ...input(outer.text, loop('j < 2'), unit, eol, outer.plan.cursorAfter - unit.length * 2 + unit.length * 2) });
  assert.ok(inner.text.includes(unit.repeat(2) + 'while (j < 2) {'));
  assert.ok(inner.text.includes(unit + '} while (i < limite);'));
  assert.equal((inner.text.match(/\} while/gu) ?? []).length, 1);
});

for (const field of ['code', 'source', 'cursor', 'instruction']) {
  test(`DO_WHILE : traduction falsifiée refusée (${field})`, () => {
    const request = input('int main(void) {\n    \n}\n', doWhile('i < 3'), '    ', '\n', 17);
    if (field === 'code') request.translation.fragments[0].code = 'do {\n    \n} while (1);\n';
    if (field === 'source') request.translation.source.text = doWhile('i < 4');
    if (field === 'cursor') request.translation.fragments[0].cursor.offset++;
    if (field === 'instruction') request.translation.instruction.kind = 'WHILE';
    placementRefused(request, 'INVALID_TRANSLATION_RESULT');
  });
}

// ---------------------------------------------------------------------------
// Pédagogie : test final distingué du test initial.
// ---------------------------------------------------------------------------

test('DO_WHILE_POSTTEST : information passive sur la plage de la condition', () => {
  const source = doWhile('i < limite');
  const result = translated(source);
  const information = explainInstruction(result);
  assert.equal(information.length, 1);
  assert.equal(information[0].code, 'DO_WHILE_POSTTEST');
  assert.equal(information[0].severity, 'information');
  assert.equal(source.slice(information[0].range.start, information[0].range.end), 'i < limite');
  assert.match(information[0].message, /testée après chaque itération/u);
  assert.match(information[0].message, /exécuté au moins une fois/u);
  assert.match(information[0].message, /Aucune progression ni terminaison n’est déduite/u);
  assert.ok(!/boucle infinie|arrêt garanti|itérations prévues/u.test(information[0].message));
});

test('le moment du test distingue les deux formes de boucle', () => {
  const pre = explainInstruction(translated(loop('i < limite')))[0];
  const post = explainInstruction(translated(doWhile('i < limite')))[0];
  assert.equal(pre.code, 'WHILE_PRETEST');
  assert.equal(post.code, 'DO_WHILE_POSTTEST');
  assert.match(pre.message, /avant chaque itération/u);
  assert.match(post.message, /après chaque itération/u);
  // A condition that is false from the start: only the post-test form runs once.
  assert.match(pre.message, /peut ne jamais être exécuté/u);
  assert.match(post.message, /au moins une fois/u);
});

test('DO_WHILE_POSTTEST précède les informations d’opérateurs', () => {
  const information = explainInstruction(translated(doWhile('!suspendu && (i < limite || forcer)')));
  assert.deepEqual(information.map(entry => entry.code),
    ['DO_WHILE_POSTTEST', 'LOGICAL_NOT', 'SHORT_CIRCUIT_AND', 'SHORT_CIRCUIT_OR']);
  assert.ok(information.every(entry => entry.severity === 'information'));
});

for (const [condition, code] of [['i < 10 / 0', 'INTEGER_ZERO_DIVISOR'], ['7.5 % 2 > 0', 'FLOAT_REMAINDER_OPERAND'], ['0 && 7 / 0', 'INTEGER_ZERO_DIVISOR']]) {
  test(`DO_WHILE : avis du lot 8 conservé (${condition})`, () => {
    const result = translated(doWhile(condition));
    const advisories = analyzeCalculations(result).advisories;
    assert.ok(advisories.some(advice => advice.code === code), JSON.stringify(advisories));
    assert.ok(advisories.every(advice => advice.severity === 'warning'));
    assert.equal(explainInstruction(result)[0].code, 'DO_WHILE_POSTTEST');
  });
}

test('DO_WHILE : aucun avertissement de terminaison', () => {
  for (const condition of ['1', '0', 'i < limite']) {
    assert.deepEqual(analyzeCalculations(translated(doWhile(condition))).advisories, []);
    assert.equal(explainInstruction(translated(doWhile(condition))).length, 1);
  }
});

test('DO_WHILE : session, information passive et confirmation unique', () => {
  const text = 'int main(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: 17, singleCursor: true,
    indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, doWhile('i < limite'));
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.equal(session.advisories.length, 0);
  assert.equal(session.information.length, 1);
  assert.equal(session.information[0].code, 'DO_WHILE_POSTTEST');
  assert.ok(prepared.preview.after.includes('    } while (i < limite);'));
  assert.equal(prepared.preview.before, text);
  session.reviewReady(prepared.preview.token, target);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'error');
});

// ---------------------------------------------------------------------------
// Non-régression.
// ---------------------------------------------------------------------------

test('11B : switch reste non livré', () => {
  for (const source of ['Crée un bloc selon "i".', 'Choisis selon "i".']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('11B : les sorties du lot 11A et des lots historiques sont inchangées', () => {
  assert.equal(translated(loop('i < limite')).fragments[0].code, 'while (i < limite) {\n    \n}\n');
  assert.equal(translated('Crée un bloc si "age >= 18".').fragments[0].code, 'if (age >= 18) {\n    \n}\n');
  assert.equal(translated('Ajoute une branche sinon.').fragments[0].code, 'else {\n    \n}\n');
  assert.equal(translated('Crée la fonction principale.').fragments[0].code, 'int main(void) {\n    \n}\n');
  assert.equal(explainInstruction(translate('Crée un bloc si "a && b".')).length, 1);
});
