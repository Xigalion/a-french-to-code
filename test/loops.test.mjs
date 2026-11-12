import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainConditions } from '../src/conditionInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const loop = condition => `Crée une boucle tant que "${condition}".`;

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.equal(result.diagnostics.length, 0);
  assert.equal(result.fragments.length, 1);
  assert.equal(result.fragments[0].role, 'primary');
  assert.equal(result.fragments[0].comment, '// ' + source);
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('fragments' in result) && !('instruction' in result));
  assert.equal(result.diagnostics.length, 1);
  assert.equal(result.diagnostics[0].category, 'understanding');
  assert.equal(result.diagnostics[0].severity, 'error');
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  if (range) assert.deepEqual(result.diagnostics[0].range, range, JSON.stringify(result.diagnostics[0]));
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// Traduction : les sorties exactes du contrat 11A, §3.
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
  ...['==', '!=', '<', '>', '<=', '>='].map(op => [`i ${op} limite`, `i ${op} limite`]),
  ['-1', '(-1)'],
  ['0.5', '0.5'],
  ['1u', '1u'],
  ['(double) total / nombre > 2.5', '(((double) total) / nombre) > 2.5'],
  ['(unsigned int) -1 < 1u', '((unsigned int) (-1)) < 1u'],
  ['!!actif', '(!(!actif))'],
  ['i < limite && j < 2', '((i < limite) && (j < 2))'],
  ['((i < limite))', 'i < limite'],
  ['i % 2 == 0', '(i % 2) == 0'],
  ['1' + '0'.repeat(4096), '1' + '0'.repeat(4096)],
];
for (const [condition, rendered] of renderings) {
  for (const suffix of ['', '.']) {
    test(`WHILE rendu : ${condition.slice(0, 60)} / ${JSON.stringify(suffix)}`, () => {
      const source = `Crée une boucle tant que "${condition}"${suffix}`;
      const result = translated(source);
      assert.equal(result.instruction.kind, 'WHILE');
      const code = `while (${rendered}) {\n    \n}\n`;
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
      // Cursor lands inside the empty body, after the four spaces.
      assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset), '\n}\n');
      // No implicit main, header, counter, initialisation, progression or exit.
      assert.ok(!/#include|int main|return|;|\+\+|--|else|do |for /u.test(code));
    });
  }
}

test('WHILE : un nom inconnu ou une condition constante reste traduisible', () => {
  for (const condition of ['1', '0', 'jamais_declare', 'x == y']) {
    assert.equal(translated(loop(condition)).instruction.kind, 'WHILE');
  }
});

test('WHILE préserve espaces, casse, accents et tabulations de la phrase', () => {
  const source = '\tCRÉE\tune BOUCLE\ttant\tque "I\t<\tLimite". \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  assert.equal(result.fragments[0].code, 'while (I < Limite) {\n    \n}\n');
});

test('WHILE : point final facultatif, attaché au guillemet fermant', () => {
  const code = 'while (i < 3) {\n    \n}\n';
  assert.equal(translated('Crée une boucle tant que "i < 3"').fragments[0].code, code);
  assert.equal(translated('Crée une boucle tant que "i < 3".').fragments[0].code, code);
  assert.equal(translated('Crée une boucle tant que "i < 3"  ').fragments[0].code, code);
  refused('Crée une boucle tant que "i < 3" .', 'UNEXPECTED_TEXT');
});

test('WHILE : accents exigés sur les mots fixes', () => {
  refused('Cree une boucle tant que "i < 3".', 'UNKNOWN_FORMULATION');
  refused('Crée une boucle tant qué "i < 3".', 'UNKNOWN_FORMULATION');
  // Decomposed accent is not normalised into the composed fixed word.
  refused('Crée une boucle tant que "i < 3".', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// Refus et plages UTF-16 : les six oracles du contrat 11A, §7.
// ---------------------------------------------------------------------------

const oracles = [
  ['Crée une boucle tant que', 'MISSING_CONDITION', { start: 24, end: 24 }],
  ['Crée une boucle tant que "".', 'MISSING_CONDITION', { start: 26, end: 26 }],
  ['Crée une boucle tant que "i &&".', 'MISSING_OPERAND', { start: 30, end: 30 }],
  ['Crée une boucle tant que "i = 3".', 'ASSIGNMENT_IN_CONDITION', { start: 28, end: 29 }],
  ['Crée une boucle tant que "A\u{1F600}B < 3".', 'INVALID_IDENTIFIER', { start: 26, end: 30 }],
  ['Crée une boucle tant que "i < 3', 'UNTERMINATED_CONDITION', { start: 25, end: 31 }],
];
for (const [source, code, range] of oracles) {
  test(`WHILE oracle ${code} ${JSON.stringify(source)}`, () => {
    const diagnostic = refused(source, code, range);
    // Ranges address the original UTF-16 input, never a normalised copy.
    assert.ok(range.end <= source.length);
    assert.ok(diagnostic.message.length > 0);
  });
}

test('WHILE : le message de condition absente parle de la boucle, pas du bloc', () => {
  assert.match(refused('Crée une boucle tant que', 'MISSING_CONDITION').message, /condition de la boucle/u);
  assert.match(refused('Crée une boucle tant que "".', 'MISSING_CONDITION').message, /condition de la boucle/u);
  // The historical IF wording is untouched.
  assert.match(refused('Crée un bloc si', 'MISSING_CONDITION').message, /condition du bloc/u);
  assert.match(refused('Crée un bloc si "".', 'MISSING_CONDITION').message, /condition du bloc/u);
});

const envelopeRefusals = [
  ['Crée une boucle', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une boucle tant', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une boucle jusqu’à "i == 3".', 'UNKNOWN_FORMULATION'],
  ['Crée une boucle tant "i < 3".', 'UNKNOWN_FORMULATION'],
  ['Crée une boucle tant que i < 3.', 'MISSING_CONDITION_DELIMITER'],
  ['Crée une boucle tant que «i < 3».', 'MISSING_CONDITION_DELIMITER'],
  ['Crée une boucle tant que "i < 3" puis arrête.', 'UNEXPECTED_TEXT'],
  ['Crée une boucle tant que "i < 3". Crée une boucle tant que "j < 2".', 'UNEXPECTED_TEXT'],
  ['Crée une boucle tant que "i < 3"\nCrée une boucle tant que "j < 2".', 'INVALID_SEPARATOR'],
  ['Crée une boucle tant que "i < 3 && ".', 'MISSING_OPERAND'],
  ['Crée une boucle tant que "!".', 'MISSING_OPERAND'],
  ['Crée une boucle tant que "i < < 3".', 'MISSING_OPERAND'],
  ['Crée une boucle tant que "a < b < c".', 'CHAINED_COMPARISON'],
  ['Crée une boucle tant que "i += 1".', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['Crée une boucle tant que "i++".', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['Crée une boucle tant que "i & 1".', 'UNSUPPORTED_CONDITION_OPERATOR'],
  ['Crée une boucle tant que "(i < 3".', 'MISSING_CLOSING_PARENTHESIS'],
  ['Crée une boucle tant que "i < 3)".', 'UNEXPECTED_CLOSING_PARENTHESIS'],
  ['Crée une boucle tant que "(long) i < 3".', 'UNSUPPORTED_NUMERIC_TYPE'],
  ['Crée une boucle tant que "int < 3".', 'C_KEYWORD_IDENTIFIER'],
  ['Crée une boucle tant que "while < 3".', 'C_KEYWORD_IDENTIFIER'],
  ['Crée une boucle tant que "1e < 3".', 'INCOMPLETE_NUMERIC_LITERAL'],
  ['Crée une boucle tant que "0x10 < 3".', 'UNSUPPORTED_NUMERIC_LITERAL'],
  ['Crée une boucle tant que "i < 3".', 'INVALID_SEPARATOR'],
  ['Crée une boucle tant que "\uD800 < 3".', 'INVALID_EXPRESSION_TOKEN'],
  ['Crée une boucle tant que "i, j".', 'INVALID_EXPRESSION_TOKEN'],
  ['Crée une boucle tant que "i < 3; j".', 'INVALID_EXPRESSION_TOKEN'],
  ['Crée une boucle tant que "A\u{1F600}B".', 'INVALID_IDENTIFIER'],
];
for (const [source, code] of envelopeRefusals) {
  test(`WHILE refus ${code} ${JSON.stringify(source.slice(0, 48))}`, () => refused(source, code));
}

test('WHILE : les mêmes exclusions que IF, sur les mêmes codes', () => {
  for (const condition of ['i = 3', 'a < b < c', 'i++', 'i & 1', 'a ? b : c', '(a = 1) && b']) {
    const asLoop = translate(loop(condition));
    const asBlock = translate(`Crée un bloc si "${condition}".`);
    assert.equal(asLoop.status, 'rejected');
    assert.equal(asBlock.status, 'rejected');
    assert.equal(asLoop.diagnostics[0].code, asBlock.diagnostics[0].code);
  }
});

// ---------------------------------------------------------------------------
// Budgets : 1 024 tokens et 64 niveaux, globaux à toute la condition.
// ---------------------------------------------------------------------------

for (const form of [n => '('.repeat(n) + 'i >= 0' + ')'.repeat(n), n => '- '.repeat(n) + 'i > 0', n => '(int) '.repeat(n) + 'i > 0']) {
  test('WHILE profondeur globale 64 acceptée et 65 refusée', () => {
    translated(loop(form(64)));
    refused(loop(form(65)), 'EXPRESSION_TOO_COMPLEX');
  });
}
test('WHILE : regroupements, négations et casts partagent le budget de profondeur', () => {
  translated(loop('('.repeat(32) + '(int) '.repeat(32) + 'i > 0' + ')'.repeat(32)));
  refused(loop('('.repeat(32) + '(int) '.repeat(33) + 'i > 0' + ')'.repeat(32)), 'EXPRESSION_TOO_COMPLEX');
});
test('WHILE : opérandes et comparateur partagent le budget de 1024 tokens', () => {
  const left = Array(256).fill('a').join('+');
  const right = '- ' + Array(256).fill('b').join('+');
  translated(loop(left + '<' + right));
  refused(loop('- ' + left + '<' + right), 'EXPRESSION_TOO_COMPLEX');
});
test('WHILE : aucune remise à zéro du budget entre termes logiques', () => {
  // 171 names = 341 tokens per term; three terms plus two && reach 1 025.
  const term = Array(171).fill('a').join('+');
  translated(loop([term, term].join('&&')));
  refused(loop([term, term, term].join('&&')), 'EXPRESSION_TOO_COMPLEX');
});
test('WHILE : littéral très long conservé textuellement, sans conversion', () => {
  const digits = '9'.repeat(4096);
  assert.equal(translated(loop(`i < ${digits}`)).fragments[0].code, `while (i < ${digits}) {\n    \n}\n`);
});

// ---------------------------------------------------------------------------
// Placement.
// ---------------------------------------------------------------------------

function input(text, source = loop('i < limite'), unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'loops.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
}
function planned(request) {
  const original = structuredClone(request);
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(request, original, 'planPlacement doit rester pur');
  assert.deepEqual(planPlacement(request), result, 'planPlacement doit rester déterministe');
  const plan = result.plan;
  assert.equal(validatePlan(plan, request.document).status, 'current');
  assert.equal(plan.edits.length, 1);
  const edit = plan.edits[0];
  // Only a blank line and its optional EOL may be replaced.
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
  assert.equal(result.diagnostics[0].category, 'placement');
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
}

for (const eol of ['\n', '\r\n']) {
  for (const unit of ['  ', '    ', '\t']) {
    test(`WHILE placement, indentation et curseur ${JSON.stringify([eol, unit])}`, () => {
      const prefix = 'int main(void) {' + eol + unit;
      const suffix = eol + '}' + eol;
      const text = prefix + suffix;
      const { plan, text: after } = planned(input(text, loop('i < limite'), unit, eol, prefix.length));
      const expected = prefix + '// ' + loop('i < limite') + eol
        + unit + 'while (i < limite) {' + eol
        + unit + unit + eol
        + unit + '}' + suffix;
      assert.equal(after, expected);
      // Cursor sits on the inner line, after base indent plus one unit.
      assert.equal(after.slice(plan.cursorAfter, plan.cursorAfter + eol.length), eol);
      assert.equal(after.slice(plan.cursorAfter - unit.length * 2, plan.cursorAfter), unit + unit);
      // No extra input line is created after the closing brace.
      assert.ok(after.endsWith(unit + '}' + suffix));
      assert.equal(plan.eol, eol);
      assert.equal(plan.attachment, undefined);
      assert.equal(plan.branchContext, undefined);
    });
  }
}

test('WHILE : fichier vide, aucun main implicite', () => {
  const { text } = planned(input('', loop('1'), '    ', '\n', 0));
  assert.equal(text, '// ' + loop('1') + '\nwhile (1) {\n    \n}\n');
});

for (const ending of ['', '\n', '\r\n']) {
  test(`WHILE : ligne blanche à EOF ${JSON.stringify(ending)}`, () => {
    const text = 'int x;\n' + ending;
    planned(input(text, loop('x'), '    ', '\n', text.length));
  });
}

const placementRefusals = [
  ['int x;\n', 0, 'TARGET_LINE_NOT_BLANK'],
  ['// note\n', 0, 'TARGET_LINE_NOT_BLANK'],
  ['/* ouvert\n\n', 10, 'TARGET_IN_COMMENT'],
  ['char c = \';\n\n', 12, 'LEXICAL_CONTEXT_UNDETERMINED'],
  ['#define X 1\n\n', 12, 'UNSUPPORTED_DIRECTIVE'],
  ['??/\n\n', 4, 'UNSUPPORTED_TRIGRAPH'],
  ['int x;\\\n\n', 8, 'UNSUPPORTED_LINE_CONTINUATION'],
  ['a\rb\n\n', 4, 'UNSUPPORTED_LINE_ENDING'],
];
for (const [text, cursor, code] of placementRefusals) {
  test(`WHILE refus de placement ${code} ${JSON.stringify(text)}`, () => {
    placementRefused(input(text, loop('i < 3'), '    ', '\n', cursor), code);
  });
}
test('WHILE : fin de fichier occupée refusée', () => {
  placementRefused(input('int x;', loop('x'), '    ', '\n', 6), 'TARGET_LINE_NOT_BLANK');
});

// ---------------------------------------------------------------------------
// Séquences, imbrication et préservation du code existant.
// ---------------------------------------------------------------------------

// The §9 teaching project, built one explicit request at a time. Each step
// starts from the cursor the previous plan returned: no blank line, no
// progression and no body statement is ever generated by C-A.
const project = [
  'Inclue la bibliothèque stdio.h.',
  'Crée la fonction principale.',
  'Crée un entier nommé i de valeur 0.',
  'Crée un entier nommé limite de valeur 3.',
  'Crée une boucle tant que "i < limite".',
  'Crée un bloc si "i == 0".',
  'Affiche le texte "début\\n".',
];
for (const eol of ['\n', '\r\n']) {
  test(`WHILE : séquence complète du projet pédagogique ${JSON.stringify(eol)}`, () => {
    const unit = '    ';
    let document = { id: 'projet.c', revision: 0, text: '' };
    let cursor = 0;
    for (const source of project) {
      const { plan, text } = planned(input(document.text, source, unit, eol, cursor));
      document = { ...document, revision: document.revision + 1, text };
      cursor = plan.cursorAfter;
    }
    const expected = [
      '// Inclue la bibliothèque stdio.h.',
      '#include <stdio.h>',
      '// Crée la fonction principale.',
      'int main(void) {',
      '    // Crée un entier nommé i de valeur 0.',
      '    int i = 0;',
      '    // Crée un entier nommé limite de valeur 3.',
      '    int limite = 3;',
      '    // Crée une boucle tant que "i < limite".',
      '    while (i < limite) {',
      '        // Crée un bloc si "i == 0".',
      '        if (i == 0) {',
      '            // Affiche le texte "début\\n".',
      '            printf("%s", "début\\n");',
      '            ',
      '        }',
      '    }',
      '}',
      '',
    ].join(eol);
    assert.equal(document.text, expected);
    // Each French sentence is kept verbatim, exactly once.
    for (const source of project) assert.equal(document.text.split('// ' + source).length, 2);
    // No return, no semicolon after the loop header or braces.
    assert.ok(!document.text.includes('return'));
    assert.ok(!/\{\s*;|\}\s*;/u.test(document.text));
  });
}

test('WHILE imbriqué : la fermeture extérieure et le suffixe restent intacts', () => {
  const eol = '\n';
  const unit = '    ';
  const text = 'int main(void) {' + eol + unit + 'while (i < limite) {' + eol + unit.repeat(2) + eol + unit + '}' + eol + unit + 'int apres = 9;' + eol + '}' + eol;
  const cursor = text.indexOf(unit.repeat(2) + eol) + unit.length * 2;
  const { text: after } = planned(input(text, loop('j < 2'), unit, eol, cursor));
  assert.ok(after.includes(unit.repeat(2) + 'while (j < 2) {'));
  assert.ok(after.includes(unit.repeat(3) + eol + unit.repeat(2) + '}'));
  // Outer closing brace, following statement and final brace are preserved.
  assert.ok(after.endsWith(unit + '}' + eol + unit + 'int apres = 9;' + eol + '}' + eol));
  assert.equal((after.match(/while/gu) ?? []).length, 2);
});

test('WHILE dans une branche if et if dans une boucle', () => {
  const inIf = 'if (a) {\n    \n}\n';
  const { text } = planned(input(inIf, loop('i < 3'), '    ', '\n', inIf.indexOf('    \n')));
  assert.ok(text.includes('    while (i < 3) {'));
  assert.ok(text.includes('if (a) {'));
  const inLoop = 'while (i < 3) {\n    \n}\n';
  const nested = planned(input(inLoop, 'Crée un bloc si "i == 0".', '    ', '\n', inLoop.indexOf('    \n')));
  assert.ok(nested.text.includes('    if (i == 0) {'));
  assert.ok(nested.text.includes('while (i < 3) {'));
});

test('WHILE : aucun contenu adjacent absorbé, aucune accolade déplacée', () => {
  const text = 'int main(void) {\n    int manuel = 1;\n    \n    int apres = 9;\n}\n';
  const { text: after } = planned(input(text, loop('actif'), '    ', '\n', text.indexOf('    \n    int apres')));
  assert.ok(after.includes('    int manuel = 1;\n'));
  assert.ok(after.includes('    int apres = 9;\n}\n'));
  assert.equal((after.match(/\{/gu) ?? []).length, 2);
  assert.equal((after.match(/\}/gu) ?? []).length, 2);
});

// ELSE must never attach to a loop, and must never climb to a neighbouring if.
const branchAfterLoop = [
  'while (a) {\n}\n\n',
  'if (a) {\n}\nwhile (b) {\n}\n\n',
  'while (a) {\n    if (b) {\n    }\n}\n\n',
];
for (const text of branchAfterLoop) {
  for (const source of ['Ajoute une branche sinon.', 'Ajoute une branche sinon si "b".']) {
    test(`WHILE : branche refusée après une boucle ${JSON.stringify(text.slice(0, 24))}`, () => {
      placementRefused(input(text, source, '    ', '\n', text.length));
    });
  }
}

// ---------------------------------------------------------------------------
// Invariants du plan : aucune donnée reçue n'est réparée.
// ---------------------------------------------------------------------------

for (const field of ['source', 'comment', 'code', 'cursor', 'instruction', 'id']) {
  test(`WHILE : résultat de traduction falsifié refusé (${field})`, () => {
    const request = input('int main(void) {\n    \n}\n', loop('i < 3'), '    ', '\n', 17);
    const translation = request.translation;
    if (field === 'source') translation.source.text = loop('i < 4');
    if (field === 'comment') translation.fragments[0].comment = '// autre';
    if (field === 'code') translation.fragments[0].code = 'while (1) {\n    \n}\n';
    if (field === 'cursor') translation.fragments[0].cursor.offset++;
    if (field === 'instruction') translation.instruction.kind = 'IF';
    if (field === 'id') translation.fragments[0].id = 'fragment-2';
    placementRefused(request, 'INVALID_TRANSLATION_RESULT');
  });
}
for (const mutation of ['text', 'revision', 'id']) {
  test(`WHILE : plan périmé après changement de document (${mutation})`, () => {
    const request = input('int main(void) {\n    \n}\n', loop('i < 3'), '    ', '\n', 17);
    const { plan } = planned(request);
    const next = { ...request.document };
    if (mutation === 'text') next.text += ' ';
    if (mutation === 'revision') next.revision = 1;
    if (mutation === 'id') next.id = 'autre.c';
    const validation = validatePlan(plan, next);
    assert.equal(validation.status, 'rejected');
    assert.equal(validation.diagnostics[0].code, 'STALE_PLAN');
  });
}

// ---------------------------------------------------------------------------
// Pédagogie : avertissements du lot 8 conservés, information WHILE_PRETEST
// passive, et aucune détection de terminaison.
// ---------------------------------------------------------------------------

test('WHILE_PRETEST : information passive sur la plage de la condition', () => {
  const source = loop('i < limite');
  const result = translated(source);
  const information = explainConditions(result);
  assert.equal(information.length, 1);
  const entry = information[0];
  assert.equal(entry.code, 'WHILE_PRETEST');
  assert.equal(entry.severity, 'information');
  // Range covers the condition itself, quotes excluded.
  assert.equal(source.slice(entry.range.start, entry.range.end), 'i < limite');
  assert.match(entry.message, /testée avant chaque itération/u);
  assert.match(entry.message, /Aucune progression ni terminaison n’est déduite/u);
  // It is never a warning, and never claims termination or a loop count.
  assert.ok(!/boucle infinie|progression manquante|arrêt garanti|itérations/u.test(entry.message));
  assert.equal(analyzeCalculations(result).advisories.length, 0);
});

test('WHILE_PRETEST précède les informations d’opérateurs, sans les supprimer', () => {
  const information = explainConditions(translated(loop('!suspendu && (i < limite || forcer)')));
  assert.deepEqual(information.map(entry => entry.code), ['WHILE_PRETEST', 'LOGICAL_NOT', 'SHORT_CIRCUIT_AND', 'SHORT_CIRCUIT_OR']);
  assert.ok(information.every(entry => entry.severity === 'information'));
});

test('WHILE : les informations d’IF restent inchangées', () => {
  const information = explainConditions(translate('Crée un bloc si "!suspendu && (i < limite || forcer)".'));
  assert.deepEqual(information.map(entry => entry.code), ['LOGICAL_NOT', 'SHORT_CIRCUIT_AND', 'SHORT_CIRCUIT_OR']);
});

const advisoryCases = [
  ['i < 10 / 0', 'INTEGER_ZERO_DIVISOR'],
  ['7.5 % 2 > 0', 'FLOAT_REMAINDER_OPERAND'],
  ['i < 1.0 / 0.0', 'ZERO_DIVISOR'],
  ['0 && 7 / 0', 'INTEGER_ZERO_DIVISOR'],
  ['i != 0 || 5 / 0 > 1', 'INTEGER_ZERO_DIVISOR'],
];
for (const [condition, code] of advisoryCases) {
  test(`WHILE : avis de calcul du lot 8 conservé (${condition})`, () => {
    const result = translated(loop(condition));
    const report = analyzeCalculations(result);
    assert.ok(report.advisories.some(advice => advice.code === code), JSON.stringify(report));
    assert.ok(report.advisories.every(advice => advice.severity === 'warning' && advice.category === 'calculation'));
    // A risky condition is still translated faithfully.
    assert.equal(result.instruction.kind, 'WHILE');
    // The passive loop information is never merged into the warnings.
    assert.ok(explainConditions(result).some(entry => entry.code === 'WHILE_PRETEST'));
  });
}
test('WHILE : le court-circuit ne supprime pas un avis à droite', () => {
  const left = analyzeCalculations(translated(loop('0 && 7 / 0'))).advisories;
  const right = analyzeCalculations(translated(loop('1 || 7 / 0'))).advisories;
  assert.equal(left.length, 1);
  assert.equal(right.length, 1);
});
test('WHILE : aucun avertissement de terminaison ou de progression', () => {
  for (const condition of ['1', '0', 'i < limite', 'actif']) {
    const result = translated(loop(condition));
    assert.deepEqual(analyzeCalculations(result).advisories, []);
    const information = explainConditions(result);
    assert.equal(information.length, 1);
    assert.equal(information[0].code, 'WHILE_PRETEST');
  }
});

// ---------------------------------------------------------------------------
// Session : parcours identique, information sans compteur d'avertissement.
// ---------------------------------------------------------------------------

test('WHILE : session aperçu, confirmation unique et information passive', () => {
  const text = 'int main(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: 17, singleCursor: true,
    indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, loop('i < limite'));
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.equal(session.advisories.length, 0, 'une information ne doit pas compter comme avertissement');
  assert.equal(session.information.length, 1);
  assert.equal(session.information[0].code, 'WHILE_PRETEST');
  assert.ok(prepared.preview.after.includes('    while (i < limite) {'));
  assert.equal(prepared.preview.before, text);
  assert.equal(session.reviewReady(prepared.preview.token, target), true);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'error');
});

test('WHILE : session périmée n’expose plus aucune information', () => {
  const text = 'int main(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: 17, singleCursor: true,
    indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, loop('i < limite'));
  const prepared = session.prepare(target);
  session.reviewReady(prepared.preview.token, target);
  const next = structuredClone(target);
  next.document.text += ' ';
  next.document.revision++;
  assert.equal(session.beginApply(prepared.preview.token, next).status, 'error');
  assert.deepEqual(session.information, []);
  assert.deepEqual(session.advisories, []);
});

// ---------------------------------------------------------------------------
// Non-régression : les formes non livrées restent refusées.
// ---------------------------------------------------------------------------

const notDelivered = [
  'Crée une boucle do while "i < 3".',
  'Sors de la boucle la plus intérieure.',
  'Passe à l’itération suivante de la boucle la plus intérieure.',
  'Crée un bloc selon "i".',
  'Retourne la valeur 0.',
];
for (const source of notDelivered) {
  test(`non livré au lot 11A : ${source.slice(0, 48)}`, () => {
    const result = translate(source);
    assert.equal(result.status, 'rejected', JSON.stringify(result));
    assert.ok(!('fragments' in result));
  });
}

test('non-régression : les formulations historiques produisent le même code', () => {
  const historical = [
    ['Crée la fonction principale.', 'int main(void) {\n    \n}\n'],
    ['Déclare un entier nommé age.', 'int age;\n'],
    ['Crée un entier nommé age de valeur 20.', 'int age = 20;\n'],
    ['Affecte la valeur 25 à age.', 'age = 25;\n'],
    ['Affecte à resultat le résultat de "2 + 3 * 4".', 'resultat = (2 + (3 * 4));\n'],
    ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
    ['Affiche la valeur de age.', 'printf("%d", age);\n'],
    ['Affiche age en hexadécimal.', 'printf("%x", age);\n'],
    ['Affiche le texte "Bonjour".', 'printf("%s", "Bonjour");\n'],
    ['Crée un bloc si "age >= 18".', 'if (age >= 18) {\n    \n}\n'],
    ['Ajoute une branche sinon si "age >= 12".', 'else if (age >= 12) {\n    \n}\n'],
    ['Ajoute une branche sinon.', 'else {\n    \n}\n'],
  ];
  for (const [source, code] of historical) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});
