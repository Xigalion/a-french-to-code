import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { resolveFunctionContext } from '../src/functionContext.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const define = (name, retour) => retour === 'void'
  ? `Crée une fonction nommée ${name} qui ne retourne rien.`
  : `Crée une fonction nommée ${name} qui retourne un ${retour}.`;

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', JSON.stringify(result));
  assert.deepEqual(result, translate(source));
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  assert.equal(result.fragments.length, 1);
  assert.equal(result.fragments[0].comment, '// ' + source);
  return result;
}
function refused(source, code, token) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.ok(!('fragments' in result) && !('instruction' in result));
  assert.equal(result.diagnostics[0].category, 'understanding');
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  if (token) assert.equal(source.slice(result.diagnostics[0].range.start, result.diagnostics[0].range.end), token);
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// Définition de fonction : en-tête explicite, corps vide.
// ---------------------------------------------------------------------------

const definitions = [
  ['calcule', 'void', 'void calcule(void) {'],
  ['somme', 'int', 'int somme(void) {'],
  ['taille', 'unsigned int', 'unsigned int taille(void) {'],
  ['ratio', 'float', 'float ratio(void) {'],
  ['moyenne', 'double', 'double moyenne(void) {'],
  ['Calcule_1', 'int', 'int Calcule_1(void) {'],
];
for (const [name, retour, header] of definitions) {
  for (const suffix of ['.', '']) {
    test(`FUNC_DEF ${header} ${JSON.stringify(suffix)}`, () => {
      const base = define(name, retour);
      const source = suffix === '.' ? base : base.slice(0, -1);
      const result = translated(source);
      assert.equal(result.instruction.kind, 'FUNC_DEF');
      assert.equal(result.instruction.parameters.returnType, retour);
      assert.equal(result.instruction.parameters.name, name);
      const code = `${header}\n    \n}\n`;
      assert.equal(result.fragments[0].code, code);
      // The body is empty: no return, no declaration, no parameter invented.
      assert.equal(result.fragments[0].text.slice(result.fragments[0].cursor.offset), '\n}\n');
      assert.ok(!/return|int main|#include|;/u.test(code));
      assert.ok(code.includes('(void)'));
    });
  }
}

test('FUNC_DEF préserve espaces, casse et accents de la phrase', () => {
  const source = '\tCRÉE\tune FONCTION nommée\tsomme QUI\tretourne\tun INT. \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  // Only the fixed words are case-insensitive; the C type is written in C.
  assert.equal(result.fragments[0].code, 'int somme(void) {\n    \n}\n');
});

test('FUNC_DEF n’est pas « Crée la fonction principale »', () => {
  assert.equal(translated('Crée la fonction principale.').instruction.kind, 'MAIN');
  assert.equal(translated('Crée la fonction principale.').fragments[0].code, 'int main(void) {\n    \n}\n');
  assert.equal(translated(define('main', 'int')).fragments[0].code, 'int main(void) {\n    \n}\n');
});

const definitionRefusals = [
  ['Crée une fonction.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée f.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée f qui.', 'INCOMPLETE_INSTRUCTION'],
  ['Crée une fonction nommée f qui retourne.', 'MISSING_NUMERIC_TYPE'],
  ['Crée une fonction nommée f qui retourne un.', 'MISSING_NUMERIC_TYPE'],
  ['Crée une fonction nommée f qui retourne un char.', 'UNSUPPORTED_NUMERIC_TYPE', 'char'],
  ['Crée une fonction nommée f qui retourne un long.', 'UNSUPPORTED_NUMERIC_TYPE', 'long'],
  ['Crée une fonction nommée f qui ne retourne pas.', 'UNKNOWN_FORMULATION', 'pas'],
  ['Crée une fonction nommée f qui ne rend rien.', 'UNKNOWN_FORMULATION', 'rend'],
  ['Crée une fonction nommée int qui retourne un int.', 'C_KEYWORD_IDENTIFIER', 'int'],
  ['Crée une fonction nommée 1f qui retourne un int.', 'INVALID_IDENTIFIER', '1f'],
  ['Crée une fonction nomme f qui retourne un int.', 'UNKNOWN_FORMULATION', 'nomme'],
  ['Crée une fonction nommée f qui retourne un int plus.', 'UNKNOWN_FORMULATION', 'plus'],
  ['Crée une fonction nommée f qui retourne un int et plus.', 'UNKNOWN_FORMULATION', 'plus'],
  ['Cree une fonction nommée f qui retourne un int.', 'UNKNOWN_FORMULATION'],
];
for (const [source, code, token] of definitionRefusals) {
  test(`FUNC_DEF refus ${code} ${JSON.stringify(source.slice(16, 56))}`, () => refused(source, code, token));
}

// ---------------------------------------------------------------------------
// Retours : quatre formulations, calquées sur les précédents historiques.
// ---------------------------------------------------------------------------

const returns = [
  ['Retourne.', 'return;\n', 'RETURN'],
  ['Retourne la valeur 0.', 'return 0;\n', 'RETURN_INT'],
  ['Retourne la valeur -1.', 'return -1;\n', 'RETURN_INT'],
  ['Retourne la valeur 42.', 'return 42;\n', 'RETURN_INT'],
  ['Retourne le résultat de "a + b * 2".', 'return (a + (b * 2));\n', 'RETURN_EXPRESSION'],
  ['Retourne le résultat de "total".', 'return total;\n', 'RETURN_EXPRESSION'],
  ['Retourne le résultat de "(2 + 3) * 4".', 'return ((2 + 3) * 4);\n', 'RETURN_EXPRESSION'],
  ['Retourne le résultat numérique de "(double) total / nombre".', 'return (((double) total) / nombre);\n', 'RETURN_NUMERIC'],
  ['Retourne le résultat numérique de "7.0 / 2".', 'return (7.0 / 2);\n', 'RETURN_NUMERIC'],
];
for (const [source, code, kind] of returns) {
  test(`${kind} ${JSON.stringify(source.slice(0, 46))}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    // A simple statement: no block, so no inner cursor.
    assert.equal(result.fragments[0].cursor, undefined);
    assert.ok(!/goto|break|continue/u.test(code));
  });
}

test('les deux profils d’expression de retour suivent la convention historique', () => {
  // « le résultat de » is the integer profile; « le résultat numérique de »
  // is the numeric one, exactly as for the assignment envelopes.
  refused('Retourne le résultat de "7.0 / 2".', 'INVALID_EXPRESSION_TOKEN');
  translated('Retourne le résultat numérique de "7.0 / 2".');
  refused('Affecte à r le résultat de "7.0 / 2".', 'INVALID_EXPRESSION_TOKEN');
});

const returnRefusals = [
  ['Retourne la.', 'INCOMPLETE_INSTRUCTION'],
  ['Retourne la valeur.', 'INCOMPLETE_INSTRUCTION'],
  ['Retourne la valeur x.', 'INVALID_INTEGER', 'x'],
  ['Retourne la valeur 007.', 'INVALID_INTEGER', '007'],
  ['Retourne la valeur 0 et plus.', 'UNEXPECTED_TEXT'],
  ['Retourne le.', 'INCOMPLETE_INSTRUCTION'],
  ['Retourne le résultat.', 'INCOMPLETE_INSTRUCTION'],
  ['Retourne le résultat de.', 'MISSING_EXPRESSION'],
  ['Retourne le résultat de "".', 'MISSING_EXPRESSION'],
  ['Retourne le résultat de "a +".', 'MISSING_OPERAND'],
  ['Retourne le résultat de "a = 1".', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['Retourne le résultat de "a < b".', 'UNSUPPORTED_EXPRESSION_OPERATOR'],
  ['Retourne le résultat de a + b.', 'MISSING_EXPRESSION_DELIMITER'],
  ['Retourne le résultat de "a + b', 'UNTERMINATED_EXPRESSION'],
  ['Retourne rien.', 'UNKNOWN_FORMULATION', 'rien'],
  ['Retourne 0.', 'UNKNOWN_FORMULATION', '0'],
  ['Retourne le résultat de "a + b" et stop.', 'UNEXPECTED_TEXT'],
];
for (const [source, code, token] of returnRefusals) {
  test(`retour refusé ${code} ${JSON.stringify(source.slice(0, 44))}`, () => refused(source, code, token));
}

test('les retours gardent les budgets et les avis historiques', () => {
  const term = Array(512).fill('a').join('+');
  translated(`Retourne le résultat de "${term}".`);
  refused(`Retourne le résultat de "${Array(513).fill('a').join('+')}".`, 'EXPRESSION_TOO_COMPLEX');
  const advisories = analyzeCalculations(translated('Retourne le résultat de "10 / 0".')).advisories;
  assert.equal(advisories.length, 1);
  assert.equal(advisories[0].code, 'INTEGER_ZERO_DIVISOR');
});

// ---------------------------------------------------------------------------
// Contrat de retour : vérifié au placement, pas à la traduction.
// ---------------------------------------------------------------------------

function input(text, source, unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'fonctions.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
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

test('la traduction d’un retour ne dépend d’aucun document', () => {
  // The sentence alone is always translatable; only placement knows the
  // enclosing function, exactly as for branches and transfers.
  for (const source of ['Retourne.', 'Retourne la valeur 0.']) {
    assert.equal(translate(source).status, 'translated');
  }
});

const contracts = [
  ['int main(void) {\n', 'Retourne la valeur 0.', 'int'],
  ['void f(void) {\n', 'Retourne.', 'void'],
  ['double moyenne(void) {\n', 'Retourne le résultat numérique de "(double) t / n".', 'double'],
  ['unsigned int taille(void) {\n', 'Retourne le résultat de "a + 1".', 'unsigned int'],
  ['float r(void) {\n', 'Retourne le résultat numérique de "1.5".', 'float'],
  ['int main(void) {\n    while (a) {\n', 'Retourne la valeur 0.', 'int'],
  ['int main(void) {\n    if (a) {\n', 'Retourne la valeur 0.', 'int'],
  ['int main(void) {\n    for (i = 0; i < 3; i = (i + 1)) {\n', 'Retourne la valeur 1.', 'int'],
  // A return never depends on which loop encloses it, so an unbraced loop
  // body is a legitimate position, unlike for a transfer.
  ['void f(void) {\n    while (a)\n', 'Retourne.', 'void'],
];
for (const [text, source, returnType] of contracts) {
  test(`contrat de retour ${returnType} respecté ${JSON.stringify(text.slice(0, 30))}`, () => {
    const { plan } = planned(input(text, source));
    assert.equal(plan.functionContext.returnType, returnType);
    assert.equal(text.slice(plan.functionContext.nameRange.start, plan.functionContext.nameRange.end).length > 0, true);
  });
}

const contractRefusals = [
  ['int main(void) {\n', 'Retourne.', 'RETURN_NEEDS_VALUE'],
  ['double f(void) {\n', 'Retourne.', 'RETURN_NEEDS_VALUE'],
  ['int main(void) {\n    if (a) {\n', 'Retourne.', 'RETURN_NEEDS_VALUE'],
  ['void f(void) {\n', 'Retourne la valeur 0.', 'RETURN_IN_VOID_FUNCTION'],
  ['void f(void) {\n', 'Retourne le résultat de "a".', 'RETURN_IN_VOID_FUNCTION'],
  ['void f(void) {\n', 'Retourne le résultat numérique de "1.5".', 'RETURN_IN_VOID_FUNCTION'],
  ['', 'Retourne la valeur 0.', 'NO_ENCLOSING_FUNCTION'],
  ['int x;\n\n', 'Retourne.', 'NO_ENCLOSING_FUNCTION'],
  ['while (a) {\n', 'Retourne la valeur 0.', 'NO_ENCLOSING_FUNCTION'],
  ['char* f(void) {\n', 'Retourne la valeur 0.', 'UNSUPPORTED_RETURN_TYPE'],
  ['long f(void) {\n', 'Retourne la valeur 0.', 'UNSUPPORTED_RETURN_TYPE'],
  ['static int f(void) {\n', 'Retourne la valeur 0.', 'UNSUPPORTED_RETURN_TYPE'],
  ['f(void) {\n', 'Retourne la valeur 0.', 'UNSUPPORTED_RETURN_TYPE'],
  ['int main(void) {\n    int x =\n', 'Retourne la valeur 0.', 'NOT_A_STATEMENT_POSITION'],
  ['int main(void) {\n    struct P { int x;\n', 'Retourne la valeur 0.', 'UNSUPPORTED_ENCLOSING_CONTEXT'],
  ['/* ouvert\nint main(void) {\n', 'Retourne la valeur 0.', 'TARGET_IN_COMMENT'],
  ['#define X 1\nint main(void) {\n', 'Retourne la valeur 0.', 'UNSUPPORTED_DIRECTIVE'],
];
for (const [text, source, code] of contractRefusals) {
  test(`contrat de retour refusé ${code} ${JSON.stringify(text.slice(0, 26))}`, () => {
    placementRefused(input(text, source), code);
  });
}

test('le type de retour est lu tel qu’écrit, sans analyse de type', () => {
  // The declared type is read from one header; nothing checks that the
  // returned expression actually has that type.
  const { plan } = planned(input('int f(void) {\n', 'Retourne le résultat numérique de "1".'));
  assert.equal(plan.functionContext.returnType, 'int');
  // An int function returning a float expression is accepted and translated:
  // that is a C matter for the student, not a placement impossibility.
  planned(input('int f(void) {\n', 'Retourne le résultat numérique de "1.5".'));
});

test('la fonction englobante est la plus proche, jamais une fonction refermée', () => {
  const text = 'int premier(void) {\n}\nvoid second(void) {\n';
  const { plan } = planned(input(text, 'Retourne.'));
  assert.equal(plan.functionContext.returnType, 'void');
  assert.equal(text.slice(plan.functionContext.nameRange.start, plan.functionContext.nameRange.end), 'second');
});

test('resolveFunctionContext est pur et déterministe', () => {
  const text = 'int main(void) {\n    \n}\n';
  const first = resolveFunctionContext(text, text.indexOf('    \n'));
  assert.deepEqual(first, resolveFunctionContext(text, text.indexOf('    \n')));
  assert.equal(first.context.returnType, 'int');
});

test('contrat de retour : plan périmé si le type déclaré change', () => {
  const text = 'int main(void) {\n    \n}\n';
  const request = input(text, 'Retourne la valeur 0.', '    ', '\n', text.indexOf('    \n'));
  const { plan } = planned(request);
  const altered = { ...request.document, revision: 1, text: text.replace('int main', 'void main') };
  const validation = validatePlan(plan, altered);
  assert.equal(validation.status, 'rejected');
  assert.equal(validation.diagnostics[0].code, 'STALE_PLAN');
});

// ---------------------------------------------------------------------------
// Placement de la définition et du retour.
// ---------------------------------------------------------------------------

for (const eol of ['\n', '\r\n']) {
  for (const unit of ['  ', '    ', '\t']) {
    test(`FUNC_DEF placement et curseur ${JSON.stringify([eol, unit])}`, () => {
      const { plan, text } = planned(input('', define('somme', 'int'), unit, eol, 0));
      assert.equal(text, '// ' + define('somme', 'int') + eol + 'int somme(void) {' + eol + unit + eol + '}' + eol);
      assert.equal(text.slice(plan.cursorAfter - unit.length, plan.cursorAfter), unit);
      assert.equal(plan.functionContext, undefined);
    });
    test(`retour placé comme une instruction simple ${JSON.stringify([eol, unit])}`, () => {
      const prefix = 'int somme(void) {' + eol + unit;
      const suffix = eol + '}' + eol;
      const { plan, text } = planned(input(prefix + suffix, 'Retourne la valeur 0.', unit, eol, prefix.length));
      assert.equal(text, prefix + '// Retourne la valeur 0.' + eol + unit + 'return 0;' + eol + unit + suffix);
      // A simple statement leaves an ordinary input line after itself.
      assert.equal(text.slice(plan.cursorAfter - unit.length, plan.cursorAfter), unit);
      assert.ok(text.endsWith('}' + eol));
    });
  }
}

// ---------------------------------------------------------------------------
// C17 n'a pas de fonction imbriquée : une nouvelle définition n'est placée
// qu'à la portée fichier. Vérification locale et structurelle, pas un
// analyseur de portées ; tout contexte non classifiable est refusé.
// ---------------------------------------------------------------------------

const fileScope = [
  ['', 'fichier vide'],
  ['int x;\n', 'après une déclaration'],
  ['#include <stdio.h>\n', 'après une inclusion simple'],
  ['int g(void) {\n}\n', 'après une fonction refermée'],
  ['int g(void) {\n}\n\n', 'sur une ligne blanche après une fonction refermée'],
  ['void g(void) {\n}\nint h(void) {\n}\n', 'après deux fonctions refermées'],
  ['// commentaire\n', 'après un commentaire de ligne'],
  ['/* bloc */\n', 'après un commentaire de bloc fermé'],
];
for (const [text, label] of fileScope) {
  test(`FUNC_DEF accepté à la portée fichier : ${label}`, () => {
    const { text: after } = planned(input(text, define('f', 'int')));
    assert.ok(after.includes('int f(void) {'));
    // Nothing before the target line was touched.
    assert.ok(after.startsWith(text.slice(0, text.length - (text.endsWith('\n') ? 0 : 0))));
  });
}

const nested = [
  ['int main(void) {\n', 'directement dans main'],
  ['int main(void) {\n    \n', 'sur une ligne indentée dans main'],
  ['void g(void) {\n', 'dans une fonction void'],
  ['void g(void) {\n    while (a) {\n', 'dans une boucle dans une fonction'],
  ['void g(void) {\n    if (a) {\n', 'dans un bloc si dans une fonction'],
  ['void g(void) {\n    switch (x) {\n    case 1:\n', 'dans un switch dans une fonction'],
  ['int g(void) {\n}\nint h(void) {\n', 'dans la seconde de deux fonctions'],
];
for (const [text, label] of nested) {
  test(`FUNC_DEF refusé car imbriqué : ${label}`, () => {
    const result = planPlacement(input(text, define('f', 'int')));
    assert.equal(result.status, 'rejected', JSON.stringify(result));
    assert.equal(result.diagnostics[0].code, 'FUNCTION_DEFINITION_NESTED');
    assert.equal(result.diagnostics[0].category, 'placement');
    assert.equal(result.diagnostics[0].reason, 'unsafe-location');
    assert.match(result.diagnostics[0].message, /ne peut pas être imbriquée/u);
    // The range points at the enclosing function's name, which is the
    // innermost one, not some outer or already closed function.
    assert.equal(text.slice(result.diagnostics[0].range.start, result.diagnostics[0].range.end),
      text.includes('int h(void)') ? 'h' : text.includes('void g(void)') ? 'g' : 'main');
  });
}

const ambiguous = [
  ['struct P { int x;\n', 'définition de type ouverte'],
  ['{\n', 'bloc nu à la portée fichier'],
  ['} } {\n', 'accolades déséquilibrées'],
  ['int t[2] = {\n', 'initialisateur ouvert'],
  ['enum E {\n', 'énumération ouverte'],
];
for (const [text, label] of ambiguous) {
  test(`FUNC_DEF refusé car contexte non établi : ${label}`, () => {
    const result = planPlacement(input(text, define('f', 'int')));
    assert.equal(result.status, 'rejected', JSON.stringify(result));
    assert.equal(result.diagnostics[0].code, 'UNSUPPORTED_ENCLOSING_CONTEXT');
    assert.equal(result.diagnostics[0].reason, 'unsupported-construct');
    // Either the brace could not be classified, or the delimiters do not
    // pair up at all. Both are refusals, never an assumed-valid position.
    assert.match(result.diagnostics[0].message, /ne peut pas être établie|n’a pas d’ouvrante/u);
  });
}

test('FUNC_DEF : position hors instruction et contextes lexicaux refusés', () => {
  for (const [text, code] of [
    ['int x =\n', 'NOT_A_STATEMENT_POSITION'],
    ['/* ouvert\n', 'TARGET_IN_COMMENT'],
    ['#define X 1\n', 'UNSUPPORTED_DIRECTIVE'],
    ['??/\n', 'UNSUPPORTED_TRIGRAPH'],
  ]) {
    const result = planPlacement(input(text, define('f', 'int')));
    assert.equal(result.status, 'rejected', text);
    assert.equal(result.diagnostics[0].code, code, text);
  }
});

test('FUNC_DEF : accolades dans un commentaire ou une chaîne ne ferment rien', () => {
  // A brace that only looks closed must not make the position seem valid.
  for (const text of ['int g(void) { // }\n', 'int g(void) { /* } */\n', 'int g(void) { char c = \'}\';\n']) {
    const result = planPlacement(input(text, define('f', 'int')));
    assert.equal(result.status, 'rejected', text);
    assert.equal(result.diagnostics[0].code, 'FUNCTION_DEFINITION_NESTED', text);
  }
});

test('la traduction d’une définition ne dépend d’aucun document', () => {
  // The sentence alone stays translatable: only placement knows the context,
  // exactly as for branches, transfers and returns.
  assert.equal(translate(define('f', 'int')).status, 'translated');
});

test('FUNC_DEF : plan périmé si la ligne devient intérieure à une fonction', () => {
  const text = 'int x;\n\n';
  const request = input(text, define('f', 'int'), '    ', '\n', text.length - 1);
  const { plan } = planned(request);
  const altered = { ...request.document, revision: 1, text: 'int g(void) {\n\n' };
  const validation = validatePlan(plan, altered);
  assert.equal(validation.status, 'rejected');
  assert.equal(validation.diagnostics[0].code, 'STALE_PLAN');
});

test('MAIN conserve son comportement historique, inchangé', () => {
  // Lot 2 decided deliberately that braces are not checked for MAIN, and
  // test/placement.test.mjs asserts it under « erreurs C et accolades non
  // contrôlées ». That approved contract is left untouched by this fix.
  for (const text of ['int main(void) {\n', '} } {\n', 'int main(void) {}\n', 'int age;\n']) {
    const result = planPlacement(input(text, 'Crée la fonction principale.'));
    assert.equal(result.status, 'planned', text);
  }
});

test('les retours et les transferts ne sont pas affectés par ce correctif', () => {
  assert.equal(planPlacement(input('int main(void) {\n', 'Retourne la valeur 0.')).status, 'planned');
  assert.equal(planPlacement(input('void g(void) {\n', 'Retourne.')).status, 'planned');
  assert.equal(planPlacement(input('while (a) {\n', 'Sors de la boucle la plus intérieure.')).status, 'planned');
  const chain = 'if (a) {\n}\n\n';
  assert.equal(planPlacement(input(chain, 'Ajoute une branche sinon.', '    ', '\n', chain.length - 1)).status, 'planned');
});

test('définition puis retour : séquence complète, rien d’implicite', () => {
  const eol = '\n';
  const unit = '    ';
  let document = { id: 'projet.c', revision: 0, text: '' };
  let cursor = 0;
  for (const source of [define('somme', 'int'), 'Déclare un entier nommé total.',
    'Affecte la valeur 7 à total.', 'Retourne le résultat de "total".']) {
    const { plan, text } = planned(input(document.text, source, unit, eol, cursor));
    document = { ...document, revision: document.revision + 1, text };
    cursor = plan.cursorAfter;
  }
  assert.equal(document.text, [
    '// ' + define('somme', 'int'),
    'int somme(void) {',
    '    // Déclare un entier nommé total.',
    '    int total;',
    '    // Affecte la valeur 7 à total.',
    '    total = 7;',
    '    // Retourne le résultat de "total".',
    '    return total;',
    '    ',
    '}',
    '',
  ].join(eol));
  assert.equal((document.text.match(/return/gu) ?? []).length, 1);
});

// ---------------------------------------------------------------------------
// Pédagogie passive.
// ---------------------------------------------------------------------------

test('FUNCTION_SCOPE : information passive sur le nom de la fonction', () => {
  const source = define('somme', 'int');
  const result = translated(source);
  const information = explainInstruction(result);
  assert.equal(information.length, 1);
  assert.equal(information[0].code, 'FUNCTION_SCOPE');
  assert.equal(information[0].severity, 'information');
  assert.equal(source.slice(information[0].range.start, information[0].range.end), 'somme');
  assert.match(information[0].message, /corps est créé vide/u);
  assert.match(information[0].message, /aucun return n’y est ajouté/u);
  assert.match(information[0].message, /Aucune portée n’est vérifiée/u);
  assert.deepEqual(analyzeCalculations(result).advisories, []);
});

test('RETURN_ENDS_FUNCTION : information passive sur le mot Retourne', () => {
  for (const source of ['Retourne.', 'Retourne la valeur 0.',
    'Retourne le résultat de "a + 1".', 'Retourne le résultat numérique de "1.5".']) {
    const information = explainInstruction(translated(source));
    assert.equal(information.length, 1);
    assert.equal(information[0].code, 'RETURN_ENDS_FUNCTION');
    assert.equal(information[0].severity, 'information');
    assert.equal(source.slice(information[0].range.start, information[0].range.end), 'Retourne');
    assert.match(information[0].message, /termine immédiatement l’exécution de la fonction/u);
    assert.match(information[0].message, /Aucune accessibilité n’est analysée/u);
    // Never a claim about reachability or about the value being correct.
    assert.ok(!/garanti|toujours|prouvé/u.test(information[0].message));
  }
});

test('les informations historiques restent inchangées', () => {
  assert.deepEqual(explainInstruction(translate('Crée un bloc si "a && b".')).map(e => e.code), ['SHORT_CIRCUIT_AND']);
  assert.deepEqual(explainInstruction(translate('Crée une boucle tant que "i < 3".')).map(e => e.code), ['WHILE_PRETEST']);
  assert.deepEqual(explainInstruction(translate('Sors de la boucle la plus intérieure.')).map(e => e.code), []);
  assert.deepEqual(explainInstruction(translate('Déclare un entier nommé age.')).map(e => e.code), []);
});

test('session : définition puis retour, information passive sans Warning', () => {
  const text = 'int somme(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: text.indexOf('    \n') + 4,
    singleCursor: true, indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, 'Retourne la valeur 0.');
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.equal(session.advisories.length, 0);
  assert.equal(session.information.length, 1);
  assert.equal(session.information[0].code, 'RETURN_ENDS_FUNCTION');
  assert.match(session.attachmentLabel, /ligne 1/);
  assert.ok(prepared.preview.after.includes('    return 0;'));
  session.reviewReady(prepared.preview.token, target);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'error');
});

test('session : retour refusé par le contrat, aucune insertion', () => {
  const text = 'void f(void) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: text.indexOf('    \n') + 4,
    singleCursor: true, indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, 'Retourne la valeur 0.');
  const diagnostic = session.diagnose(target);
  assert.equal(diagnostic.stage, 'placement');
  assert.equal(diagnostic.code, 'RETURN_IN_VOID_FUNCTION');
  assert.equal(session.prepare(target).status, 'error');
});

// ---------------------------------------------------------------------------
// Non-régression.
// ---------------------------------------------------------------------------

test('12A : les sorties des lots précédents sont inchangées', () => {
  const historical = [
    ['Crée la fonction principale.', 'int main(void) {\n    \n}\n'],
    ['Déclare un entier nommé age.', 'int age;\n'],
    ['Crée un entier nommé age de valeur 20.', 'int age = 20;\n'],
    ['Affecte la valeur 25 à age.', 'age = 25;\n'],
    ['Affecte à resultat le résultat de "2 + 3 * 4".', 'resultat = (2 + (3 * 4));\n'],
    ['Crée une variable de type double nommée x avec le résultat de "1.5".', 'double x = 1.5;\n'],
    ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
    ['Affiche la valeur de age.', 'printf("%d", age);\n'],
    ['Affiche le texte "Bonjour".', 'printf("%s", "Bonjour");\n'],
    ['Crée un bloc si "age >= 18".', 'if (age >= 18) {\n    \n}\n'],
    ['Ajoute une branche sinon.', 'else {\n    \n}\n'],
    ['Crée une boucle tant que "i < 3".', 'while (i < 3) {\n    \n}\n'],
    ['Crée une boucle avec test final tant que "i < 3".', 'do {\n    \n} while (i < 3);\n'],
    ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".',
      'for (i = 0; i < 3; i = (i + 1)) {\n    \n}\n'],
    ['Sors de la boucle la plus intérieure.', 'break;\n'],
    ['Passe à l’itération suivante de la boucle la plus intérieure.', 'continue;\n'],
  ];
  for (const [source, code] of historical) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});

test('12A : les chaînes de branches et les transferts fonctionnent encore', () => {
  const chain = 'if (a) {\n}\n\n';
  const branch = planPlacement(input(chain, 'Ajoute une branche sinon.', '    ', '\n', chain.length - 1));
  assert.equal(branch.status, 'planned');
  assert.ok(branch.plan.attachment);
  const loop = planPlacement(input('while (a) {\n', 'Sors de la boucle la plus intérieure.'));
  assert.equal(loop.status, 'planned');
  assert.equal(loop.plan.loopTarget.form, 'while');
  assert.equal(loop.plan.functionContext, undefined);
});

test('12 : switch et les types non numériques restent non livrés', () => {
  for (const source of ['Crée un bloc selon "i".', 'Choisis selon "i".',
    'Crée une fonction nommée f qui retourne un pointeur.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});
