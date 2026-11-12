import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { MAX_PARAMETERS, MAX_ARGUMENTS } from '../src/functionInstructions.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.equal(result.fragments[0].comment, '// ' + source);
  return result;
}
function refused(source, code, token) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('fragments' in result) && !('instruction' in result));
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  if (token) assert.equal(source.slice(result.diagnostics[0].range.start, result.diagnostics[0].range.end), token);
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// 12B — Paramètres : chaque paramètre est écrit en entier.
// ---------------------------------------------------------------------------

const definitions = [
  ['Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.',
    'int somme(int a, int b) {'],
  ['Crée une fonction nommée affiche qui ne retourne rien et prend un double nommé x.',
    'void affiche(double x) {'],
  ['Crée une fonction nommée mesure qui retourne un double et prend un unsigned int nommé n et un float nommé pas.',
    'double mesure(unsigned int n, float pas) {'],
  ['Crée une fonction nommée f qui retourne un int.', 'int f(void) {'],
  ['Crée une fonction nommée g qui ne retourne rien.', 'void g(void) {'],
];
for (const [source, header] of definitions) {
  for (const suffix of ['.', '']) {
    test(`FUNC_DEF ${header}${JSON.stringify(suffix)}`, () => {
      const phrase = suffix === '.' ? source : source.slice(0, -1);
      const result = translated(phrase);
      assert.equal(result.fragments[0].code, `${header}\n    \n}\n`);
      assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset), '\n}\n');
      // « (void) » is written when there is no parameter; an empty list is
      // never produced, because it means something else in C.
      assert.ok(!header.includes('()'));
      assert.ok(!/return|;/u.test(header.replace(/\(.*\)/u, '')));
    });
  }
}

test('FUNC_DEF : aucun type n’est partagé entre deux paramètres', () => {
  // Each parameter is written in full: « un int nommé a et un int nommé b ».
  refused('Crée une fonction nommée f qui retourne un int et prend un int nommé a et nommé b.', 'UNKNOWN_FORMULATION', 'nommé');
  refused('Crée une fonction nommée f qui retourne un int et prend un int nommé a et b.', 'UNKNOWN_FORMULATION', 'b');
  assert.equal(translated('Crée une fonction nommée f qui retourne un int et prend un int nommé a et un int nommé b.')
    .fragments[0].code, 'int f(int a, int b) {\n    \n}\n');
});

const parameterRefusals = [
  ['Crée une fonction nommée f qui retourne un int et prend un int nommé a et un int nommé a.', 'DUPLICATE_PARAMETER_NAME', 'a'],
  ['Crée une fonction nommée f qui retourne un int et prend un int.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée f qui retourne un int et prend un int nommé.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée f qui retourne un int et prend un nommé a.', 'MISSING_NUMERIC_TYPE'],
  ['Crée une fonction nommée f qui retourne un int et prend un char nommé c.', 'UNSUPPORTED_NUMERIC_TYPE', 'char'],
  ['Crée une fonction nommée f qui retourne un int et prend un void nommé v.', 'UNSUPPORTED_NUMERIC_TYPE', 'void'],
  ['Crée une fonction nommée f qui retourne un int et prend un int nomme a.', 'UNKNOWN_FORMULATION', 'nomme'],
  ['Crée une fonction nommée f qui retourne un int et prend un int nommée a.', 'UNKNOWN_FORMULATION', 'nommée'],
  ['Crée une fonction nommée f qui retourne un int et donne un int nommé a.', 'UNKNOWN_FORMULATION', 'donne'],
  ['Crée une fonction nommée f qui retourne un int et prend.', 'MISSING_NUMERIC_TYPE'],
  ['Crée une fonction nommée f qui retourne un int et prend un int nommé int.', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Crée une fonction nommée f qui retourne un int et prend un int nommé 1a.', 'INVALID_IDENTIFIER', '1a'],
];
for (const [source, code, token] of parameterRefusals) {
  test(`paramètre refusé ${code} ${JSON.stringify(source.slice(44, 80))}`, () => refused(source, code, token));
}

test(`FUNC_DEF : ${MAX_PARAMETERS} paramètres acceptés, un de plus refusé`, () => {
  const list = count => Array.from({ length: count }, (value, index) => `un int nommé p${index}`).join(' et ');
  const phrase = count => `Crée une fonction nommée f qui retourne un int et prend ${list(count)}.`;
  const result = translated(phrase(MAX_PARAMETERS));
  assert.equal(result.instruction.parameters.params.length, MAX_PARAMETERS);
  assert.ok(result.fragments[0].code.startsWith('int f(int p0, int p1,'));
  refused(phrase(MAX_PARAMETERS + 1), 'TOO_MANY_PARAMETERS');
});

test('PARAMETERS_BY_VALUE : information ajoutée seulement s’il y a un paramètre', () => {
  const none = explainInstruction(translated('Crée une fonction nommée f qui retourne un int.'));
  assert.deepEqual(none.map(entry => entry.code), ['FUNCTION_SCOPE']);
  const source = 'Crée une fonction nommée f qui retourne un int et prend un int nommé a.';
  const some = explainInstruction(translated(source));
  assert.deepEqual(some.map(entry => entry.code), ['FUNCTION_SCOPE', 'PARAMETERS_BY_VALUE']);
  assert.ok(some.every(entry => entry.severity === 'information'));
  assert.equal(source.slice(some[1].range.start, some[1].range.end), 'f');
  assert.match(some[1].message, /reçoit une copie de la valeur passée à l’appel/u);
  assert.match(some[1].message, /ne modifie pas la variable de l’appelant/u);
  assert.match(some[1].message, /Aucun type d’argument n’est vérifié/u);
});

// ---------------------------------------------------------------------------
// 12C — Appels.
// ---------------------------------------------------------------------------

const calls = [
  ['Appelle affiche.', 'affiche();\n', 'CALL'],
  ['Appelle affiche avec "total".', 'affiche(total);\n', 'CALL'],
  ['Appelle somme avec "2" et "3".', 'somme(2, 3);\n', 'CALL'],
  ['Appelle somme avec "a + 1" et "(double) b".', 'somme((a + 1), ((double) b));\n', 'CALL'],
  ['Appelle f avec "-1".', 'f((-1));\n', 'CALL'],
  ['Affecte à r le résultat de l’appel de f.', 'r = f();\n', 'CALL_ASSIGN'],
  ['Affecte à r le résultat de l’appel de somme avec "2" et "3".', 'r = somme(2, 3);\n', 'CALL_ASSIGN'],
  ['Affecte à total le résultat de l’appel de mesure avec "n" et "0.5".', 'total = mesure(n, 0.5);\n', 'CALL_ASSIGN'],
];
for (const [source, code, kind] of calls) {
  for (const suffix of ['', '.']) {
    test(`${kind} ${JSON.stringify(source.slice(0, 44))} ${JSON.stringify(suffix)}`, () => {
      const phrase = suffix === '.' ? source : source.slice(0, -1);
      const result = translated(phrase);
      assert.equal(result.instruction.kind, kind);
      assert.equal(result.fragments[0].code, code);
      // A simple statement: no block, so no inner cursor.
      assert.equal(result.fragments[0].cursor, undefined);
    });
  }
}

test('les deux apostrophes sont acceptées dans « l’appel »', () => {
  assert.equal(translated('Affecte à r le résultat de l’appel de f.').fragments[0].code, 'r = f();\n');
  assert.equal(translated("Affecte à r le résultat de l'appel de f.").fragments[0].code, 'r = f();\n');
});

test('les affectations historiques ne sont pas détournées par les appels', () => {
  assert.equal(translated('Affecte à r le résultat de "2 + 3".').fragments[0].code, 'r = (2 + 3);\n');
  assert.equal(translated('Affecte à r le résultat numérique de "1.5".').fragments[0].code, 'r = 1.5;\n');
  assert.equal(translated('Affecte la valeur 25 à age.').fragments[0].code, 'age = 25;\n');
});

const callRefusals = [
  ['Appelle.', 'INCOMPLETE_INSTRUCTION'],
  ['Appelle int.', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Appelle 1f.', 'INVALID_IDENTIFIER', '1f'],
  ['Appelle somme avec.', 'MISSING_EXPRESSION'],
  ['Appelle somme avec 2.', 'MISSING_EXPRESSION_DELIMITER'],
  ['Appelle somme avec "2" et.', 'MISSING_EXPRESSION'],
  ['Appelle somme avec "2" plus.', 'UNEXPECTED_TEXT'],
  ['Appelle somme avec "".', 'MISSING_EXPRESSION'],
  ['Appelle somme avec "2 +".', 'MISSING_OPERAND'],
  ['Appelle somme avec "a < b".', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['Appelle somme avec "2', 'UNTERMINATED_EXPRESSION'],
  ['Appelle somme plus.', 'UNKNOWN_FORMULATION', 'plus'],
  ['Affecte à r le résultat de l’appel.', 'INCOMPLETE_INSTRUCTION'],
  ['Affecte à r le résultat de l’appel de.', 'INCOMPLETE_INSTRUCTION'],
  ['Affecte à int le résultat de l’appel de f.', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Affecte à r le résultat de l’appel de int.', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Affecte à r le résultat de l’appel de f avec.', 'MISSING_EXPRESSION'],
  ['Affecte à r le résultat de l’appel de f plus.', 'UNKNOWN_FORMULATION', 'plus'],
];
for (const [source, code, token] of callRefusals) {
  test(`appel refusé ${code} ${JSON.stringify(source.slice(0, 44))}`, () => refused(source, code, token));
}

test(`appel : ${MAX_ARGUMENTS} arguments acceptés, un de plus refusé`, () => {
  const list = count => Array.from({ length: count }, (value, index) => `"${index}"`).join(' et ');
  const result = translated(`Appelle f avec ${list(MAX_ARGUMENTS)}.`);
  assert.equal(result.instruction.parameters.args.length, MAX_ARGUMENTS);
  refused(`Appelle f avec ${list(MAX_ARGUMENTS + 1)}.`, 'TOO_MANY_ARGUMENTS');
});

test('appel : les arguments partagent un seul budget de tokens', () => {
  const term = count => Array(count).fill('a').join('+');
  translated(`Appelle f avec "${term(300)}" et "${term(200)}".`);
  refused(`Appelle f avec "${term(300)}" et "${term(300)}".`, 'EXPRESSION_TOO_COMPLEX');
});

test('appel : les avis du lot 8 portent sur les arguments', () => {
  const advisories = analyzeCalculations(translated('Appelle f avec "10 / 0" et "7.5 % 2".')).advisories;
  assert.equal(advisories.length, 2);
  assert.deepEqual(advisories.map(advice => advice.code).sort(), ['FLOAT_REMAINDER_OPERAND', 'INTEGER_ZERO_DIVISOR']);
  assert.ok(advisories.every(advice => advice.severity === 'warning'));
  const assigned = analyzeCalculations(translated('Affecte à r le résultat de l’appel de f avec "1 / 0".')).advisories;
  assert.equal(assigned.length, 1);
});

test('CALL_NOT_RESOLVED : C-A ne cherche ni la déclaration ni l’arité', () => {
  for (const source of ['Appelle jamais_declaree.', 'Affecte à r le résultat de l’appel de jamais_declaree avec "1".']) {
    const information = explainInstruction(translated(source));
    assert.equal(information.length, 1);
    assert.equal(information[0].code, 'CALL_NOT_RESOLVED');
    assert.equal(information[0].severity, 'information');
    assert.match(information[0].message, /ordre non spécifié par C17/u);
    assert.match(information[0].message, /ni son nombre de paramètres, ni leurs types/u);
  }
});

test('appel : une arité incohérente est traduite, pas refusée', () => {
  // C-A resolves no symbol: a wrong argument count is a C error the student
  // must see, not a placement impossibility.
  const text = 'int somme(int a, int b) {\n}\nint main(void) {\n    \n}\n';
  const request = { document: { id: 'appels.c', revision: 0, text }, cursorOffset: text.indexOf('    \n}\n') + 4,
    translation: translated('Appelle somme avec "1".'), indentUnit: '    ', fallbackEol: '\n' };
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.equal(result.plan.functionContext, undefined);
  assert.equal(result.plan.loopTarget, undefined);
});

// ---------------------------------------------------------------------------
// Placement et séquence complète.
// ---------------------------------------------------------------------------

function input(text, source, unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'appels.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
}
function planned(request) {
  const original = structuredClone(request);
  const result = planPlacement(request);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(request, original);
  assert.deepEqual(planPlacement(request), result);
  assert.equal(validatePlan(result.plan, request.document).status, 'current');
  const edit = result.plan.edits[0];
  const text = request.document.text.slice(0, edit.range.start) + edit.newText + request.document.text.slice(edit.range.end);
  return { plan: result.plan, text };
}

for (const eol of ['\n', '\r\n']) {
  test(`appel placé comme une instruction simple ${JSON.stringify(eol)}`, () => {
    const prefix = 'int main(void) {' + eol + '    ';
    const suffix = eol + '}' + eol;
    const { plan, text } = planned(input(prefix + suffix, 'Appelle somme avec "2" et "3".', '    ', eol, prefix.length));
    assert.equal(text, prefix + '// Appelle somme avec "2" et "3".' + eol
      + '    somme(2, 3);' + eol + '    ' + suffix);
    assert.equal(text.slice(plan.cursorAfter - 4, plan.cursorAfter), '    ');
  });
}

test('décomposition complète : définition, paramètres, retour, appel', () => {
  const eol = '\n';
  const unit = '    ';
  let document = { id: 'projet.c', revision: 0, text: '' };
  let cursor = 0;
  const steps = [
    'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.',
    'Retourne le résultat de "a + b".',
  ];
  for (const source of steps) {
    const { plan, text } = planned(input(document.text, source, unit, eol, cursor));
    document = { ...document, revision: document.revision + 1, text };
    cursor = plan.cursorAfter;
  }
  // The student explicitly creates a blank line after the closing brace.
  const closing = document.text.indexOf('}' + eol);
  const offset = closing + 1 + eol.length;
  document = { ...document, revision: document.revision + 1,
    text: document.text.slice(0, offset) + eol + document.text.slice(offset) };
  cursor = offset;
  for (const source of ['Crée la fonction principale.', 'Déclare un entier nommé total.',
    'Affecte à total le résultat de l’appel de somme avec "2" et "3".', 'Retourne la valeur 0.']) {
    const { plan, text } = planned(input(document.text, source, unit, eol, cursor));
    document = { ...document, revision: document.revision + 1, text };
    cursor = plan.cursorAfter;
  }
  assert.ok(document.text.includes('int somme(int a, int b) {'));
  assert.ok(document.text.includes('    return (a + b);'));
  assert.ok(document.text.includes('int main(void) {'));
  assert.ok(document.text.includes('    int total;'));
  assert.ok(document.text.includes('    total = somme(2, 3);'));
  assert.ok(document.text.includes('    return 0;'));
  // Nothing implicit anywhere: exactly two returns, both requested.
  assert.equal((document.text.match(/return/gu) ?? []).length, 2);
  assert.equal((document.text.match(/#include/gu) ?? []).length, 0);
  // The two function definitions are at file scope, in the order requested.
  assert.ok(document.text.indexOf('int somme') < document.text.indexOf('int main'));
});

test('session : appel avec argument risqué, avertissement et information', () => {
  const text = 'int main(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: text.indexOf('    \n') + 4,
    singleCursor: true, indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, 'Appelle f avec "10 / 0".');
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.equal(session.advisories.length, 1);
  assert.equal(session.advisories[0].code, 'INTEGER_ZERO_DIVISOR');
  assert.equal(session.information.length, 1);
  assert.equal(session.information[0].code, 'CALL_NOT_RESOLVED');
  assert.ok(prepared.preview.after.includes('    f((10 / 0));'));
  session.reviewReady(prepared.preview.token, target);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
});

// ---------------------------------------------------------------------------
// Non-régression.
// ---------------------------------------------------------------------------

test('12B et 12C : les sorties précédentes sont inchangées', () => {
  const historical = [
    ['Crée une fonction nommée f qui retourne un int.', 'int f(void) {\n    \n}\n'],
    ['Crée une fonction nommée g qui ne retourne rien.', 'void g(void) {\n    \n}\n'],
    ['Retourne.', 'return;\n'],
    ['Retourne la valeur 0.', 'return 0;\n'],
    ['Retourne le résultat de "a + 1".', 'return (a + 1);\n'],
    ['Crée la fonction principale.', 'int main(void) {\n    \n}\n'],
    ['Crée une boucle tant que "i < 3".', 'while (i < 3) {\n    \n}\n'],
    ['Sors de la boucle la plus intérieure.', 'break;\n'],
    ['Affiche le texte "Bonjour".', 'printf("%s", "Bonjour");\n'],
    ['Crée une variable de type double nommée x avec le résultat de "1.5".', 'double x = 1.5;\n'],
  ];
  for (const [source, code] of historical) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});
