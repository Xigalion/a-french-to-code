import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';

const phrases = [
  'Crée la fonction principale', 'Déclare un entier nommé age',
  'Crée un entier nommé age de valeur 20', 'Affecte la valeur 25 à age',
];

function request(text = '', cursorOffset = text.length, phrase = phrases[0], extra = {}) {
  return { document: { id: 'document.c', revision: 0, text }, cursorOffset, translation: translate(phrase), ...extra };
}

// In-memory test adapter only; production returns a plan and never applies edits.
function apply(plan, document) {
  assert.equal(validatePlan(plan, document).status, 'current');
  assert.equal(plan.edits.length, 1);
  const edit = plan.edits[0];
  assert.match(document.text.slice(edit.range.start, edit.range.end), /^[ \t]*(?:\r\n|\n)?$/u);
  const result = document.text.slice(0, edit.range.start) + edit.newText + document.text.slice(edit.range.end);
  assert.equal(result.slice(0, edit.range.start), document.text.slice(0, edit.range.start));
  assert.equal(result.slice(edit.range.start + edit.newText.length), document.text.slice(edit.range.end));
  assert.ok(Number.isInteger(plan.cursorAfter) && plan.cursorAfter >= 0 && plan.cursorAfter <= result.length);
  assert.equal(plan.placedFragments.length, 1);
  assert.ok(result.slice(plan.placedFragments[0].range.start, plan.placedFragments[0].range.end).includes('// ' + plan.source.text));
  return { ...document, revision: Number(document.revision) + 1, text: result };
}

function planned(input) {
  const original = structuredClone(input);
  const result = planPlacement(input);
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.deepEqual(input, original);
  assert.deepEqual(result.diagnostics, []);
  assert.deepEqual(result.plan.base, { documentId: input.document.id, revision: input.document.revision, text: input.document.text });
  return { plan: result.plan, document: apply(result.plan, input.document) };
}

function rejected(input, code, reason, range) {
  const original = structuredClone(input);
  const result = planPlacement(input);
  assert.deepEqual(input, original);
  assert.equal(result.status, 'rejected', JSON.stringify(result));
  assert.deepEqual(Object.keys(result).sort(), ['diagnostics', 'status']);
  assert.equal(result.diagnostics.length, 1);
  const diagnostic = result.diagnostics[0];
  assert.equal(diagnostic.code, code);
  assert.equal(diagnostic.category, 'placement');
  assert.equal(diagnostic.severity, 'error');
  assert.equal(diagnostic.reason, reason);
  if (range) assert.deepEqual(diagnostic.range, range);
  return result;
}

test('MAIN dans un fichier vide : sortie et curseur exacts', () => {
  const { plan, document } = planned(request());
  const expected = '// Crée la fonction principale\nint main(void) {\n    \n}\n';
  assert.equal(document.text, expected);
  assert.equal(plan.cursorAfter, expected.indexOf('    ') + 4);
  assert.deepEqual(plan.edits[0].range, { start: 0, end: 0 });
  assert.deepEqual(plan.placedFragments[0].range, { start: 0, end: expected.length });
  assert.ok(!document.text.includes('return') && !document.text.includes('#include'));
});

for (const phrase of phrases.slice(1)) {
  test(`fragment simple dans un fichier vide : ${phrase}`, () => {
    const { plan, document } = planned(request('', 0, phrase));
    const fragment = translate(phrase).fragments[0];
    assert.equal(document.text, fragment.text + '\n');
    assert.equal(plan.cursorAfter, fragment.text.length);
    assert.equal(plan.placedFragments[0].range.end, fragment.text.length);
  });
}

for (const eol of ['\n', '\r\n']) {
  test(`parcours complet et 20 insertions successives en ${JSON.stringify(eol)}`, () => {
    let { plan, document } = planned(request(eol, 0));
    let cursor = plan.cursorAfter;
    const instructions = [phrases[2], phrases[3], phrases[1], ...Array.from({ length: 17 }, (_, i) => `Affecte la valeur ${i} à age`)];
    for (const phrase of instructions) {
      ({ plan, document } = planned(request(document.text, cursor, phrase, { document })));
      cursor = plan.cursorAfter;
      assert.equal(document.text.slice(cursor, cursor + eol.length), eol);
      assert.ok(document.text.slice(0, cursor).endsWith(eol + '    '));
      assert.ok(!document.text.includes(eol + '    ' + eol + '    //'));
    }
    assert.equal(document.text.split('    // ').length - 1, 20);
    assert.equal(document.text.split(eol + '    ' + eol).length - 1, 1);
    assert.equal(document.text.split('int main(void)').length - 1, 1);
    assert.ok(document.text.endsWith(eol + '}'+ eol));
  });
}

test('exemple complet : texte exact après MAIN, déclaration, initialisation et affectation', () => {
  let { plan, document } = planned(request());
  for (const phrase of ['Déclare un entier nommé age', 'Crée un entier nommé limite de valeur 30', 'Affecte la valeur 25 à age']) {
    ({ plan, document } = planned(request(document.text, plan.cursorAfter, phrase, { document })));
  }
  assert.equal(document.text, '// Crée la fonction principale\nint main(void) {\n'
    + '    // Déclare un entier nommé age\n    int age;\n'
    + '    // Crée un entier nommé limite de valeur 30\n    int limite = 30;\n'
    + '    // Affecte la valeur 25 à age\n    age = 25;\n    \n}\n');
});

for (const indent of ['', '    ', '\t', '\t  \t']) {
  test(`tous les curseurs sur la même ligne blanche donnent le même plan : ${JSON.stringify(indent)}`, () => {
    let expected;
    for (let offset = 0; offset <= indent.length; offset++) {
      const { plan, document } = planned(request(indent + '\nint tail;', offset, phrases[1]));
      expected ??= plan;
      assert.deepEqual(plan, expected);
      assert.equal(document.text, indent + '// ' + phrases[1] + '\n' + indent + 'int age;\n' + indent + '\nint tail;');
    }
  });
}

for (const indentUnit of ['  ', '\t', '        ']) {
  test(`indentation relative MAIN ${JSON.stringify(indentUnit)}`, () => {
    const { plan, document } = planned(request('\t\n', 1, phrases[0], { indentUnit }));
    assert.equal(document.text, '\t// ' + phrases[0] + '\n\tint main(void) {\n\t' + indentUnit + '\n\t}\n');
    assert.equal(plan.cursorAfter, document.text.indexOf('\n\t' + indentUnit + '\n') + 2 + indentUnit.length);
  });
}

for (const text of ['int x;', '// commentaire', 'int main(void) {}', ' \tX', '/* fermé */']) {
  test(`ligne occupée refusée même à EOF : ${text}`, () => {
    for (const offset of [0, text.length]) rejected(request(text, offset), 'TARGET_LINE_NOT_BLANK', 'unsafe-location', { start: 0, end: text.length });
  });
}

for (const text of [' \t', 'int x;\n \t', 'int x;\r\n \t', 'int x;\n', 'int x;\r\n']) {
  test(`EOF sur ligne blanche, avec ou sans terminaison : ${JSON.stringify(text)}`, () => {
    const { plan, document } = planned(request(text, text.length, phrases[3]));
    assert.ok(document.text.endsWith(plan.eol));
    assert.ok(document.text.includes('age = 25;' + plan.eol));
    assert.equal(plan.eol, text.includes('\r\n') ? '\r\n' : '\n');
  });
}

test('première ligne vide à offset zéro ne sélectionne pas la deuxième ligne', () => {
  const { plan, document } = planned(request('\nint tail;', 0, phrases[1]));
  assert.deepEqual(plan.edits[0].range, { start: 0, end: 1 });
  assert.ok(document.text.endsWith('\nint tail;'));
});

test('LF/CRLF mixtes : convention locale, suffixe et préfixe inchangés', () => {
  const prefix = '// début é😀\n';
  const suffix = 'int tail;\n// fin\r\n';
  const { plan, document } = planned(request(prefix + '\t\r\n' + suffix, prefix.length + 1, phrases[1]));
  assert.equal(plan.eol, '\r\n');
  assert.equal(document.text, prefix + '\t// ' + phrases[1] + '\r\n\tint age;\r\n\t\r\n' + suffix);
  assert.equal(plan.cursorAfter, prefix.length + ('\t// ' + phrases[1] + '\r\n\tint age;\r\n\t').length);
});

for (const text of ['\r', '\r\n\r', '\nint x;\r']) {
  test(`CR isolé refusé : ${JSON.stringify(text)}`, () => {
    rejected(request(text, 0), 'UNSUPPORTED_LINE_ENDING', 'unsupported-construct');
  });
}

for (const offset of [-1, 0.5, 10, NaN, Infinity, -Infinity]) {
  test(`curseur invalide ${offset}`, () => { rejected(request('', offset), 'INVALID_CURSOR', 'invalid-request'); });
}

test('curseur ne coupe ni CRLF ni une paire de surrogates', () => {
  rejected(request('\r\n', 1), 'INVALID_CURSOR', 'invalid-request', { start: 1, end: 1 });
  rejected(request('😀\n', 1), 'INVALID_CURSOR', 'invalid-request', { start: 1, end: 1 });
  planned(request('\r\n', 0));
  planned(request('\r\n', 2));
});

for (const indentUnit of ['', '\t\t', ' \t', '\n', 'x', null]) {
  test(`configuration d'indentation refusée ${JSON.stringify(indentUnit)}`, () => {
    rejected(request('', 0, phrases[0], { indentUnit }), 'INVALID_INDENT_UNIT', 'invalid-request');
  });
}

for (const document of [{ id: '', revision: 0, text: '' }, { id: 'x', revision: NaN, text: '' }, { id: 'x', revision: 0, text: null }]) {
  test(`instantané invalide ${JSON.stringify(document)}`, () => {
    rejected(request('', 0, phrases[0], { document }), 'INVALID_DOCUMENT', 'invalid-request');
  });
}

for (const prefix of ['/* ouvert\n', '/* début\r\n// encore dedans\r\n', 'int x; /* ouvert\n', '/* un /* deux */\n/* ouvert\n']) {
  test(`ligne blanche dans commentaire multiligne : ${JSON.stringify(prefix)}`, () => {
    const result = rejected(request(prefix + '    \n*/', prefix.length), 'TARGET_IN_COMMENT', 'unsafe-location');
    assert.equal(result.diagnostics[0].range.start, prefix.lastIndexOf('/*'));
  });
}

for (const prefix of [
  '// terminé\n', '/* fermé */\n', '/* sur\nplusieurs lignes */\n',
  '/* #define X */\n', '// #if X\n',
  String.raw`const char *s = "{ /* // #define X } \" fin";` + '\n',
  String.raw`char slash = '\\'; char quote = '\'';` + '\n',
]) {
  test(`contexte lexical fermé accepté : ${JSON.stringify(prefix)}`, () => { planned(request(prefix)); });
}

for (const prefix of ['char *s = "non terminé\n', "char c = 'x\n"]) {
  test(`littéral mal terminé avant cible : ${JSON.stringify(prefix)}`, () => {
    rejected(request(prefix), 'LEXICAL_CONTEXT_UNDETERMINED', 'unsafe-location');
  });
}

test('un suffixe mal terminé ne bloque pas une cible sûre antérieure', () => {
  const text = '\nchar *s = "non terminé';
  planned(request(text, 0, phrases[1]));
});

for (const ending of ['\\\n', '\\\r\n', '\\  \t\n']) {
  for (const beginning of ['// commentaire ', 'const char *s = "', '#define X ', '/* commentaire ']) {
    test(`continuation brute refusée ${JSON.stringify(beginning + ending)}`, () => {
      rejected(request(beginning + ending), 'UNSUPPORTED_LINE_CONTINUATION', 'unsupported-construct', { start: beginning.length, end: beginning.length + ending.length });
    });
  }
}

test('continuation détectée même si précédée d’un autre antislash échappé', () => {
  const prefix = 'char *s = "\\\\\n';
  rejected(request(prefix), 'UNSUPPORTED_LINE_CONTINUATION', 'unsupported-construct', { start: prefix.length - 2, end: prefix.length });
});

for (const last of ['=', '/', "'", '(', ')', '!', '<', '>', '-']) {
  test(`trigraphe refusé même dans commentaire : ??${last}`, () => {
    rejected(request('// ??' + last + '\n'), 'UNSUPPORTED_TRIGRAPH', 'unsupported-construct', { start: 3, end: 6 });
  });
}

test('contrôles préprocesseur limités au préfixe : suffixe intact', () => {
  planned(request('\n#define X \\\n??/\n', 0));
});

for (const directive of ['#include <stdio.h>', '  # include "local.h"', '\t#\tinclude\t<dir/header.h> // origine']) {
  test(`inclusion simple conservée : ${directive}`, () => {
    const prefix = directive + '\n';
    const { document } = planned(request(prefix));
    assert.ok(document.text.startsWith(prefix));
  });
}

// `#ifndef X`, `#define X` without a replacement list, and `#endif` left this
// list at lot 23, which needed them to place the two halves of a header guard.
// Everything else stays refused, and `#define X 1` above all: C-A does not
// expand macros, and must not read code whose tokens a macro could change.
for (const directive of [
  '#define X 1', '#undef X', '#if 0', '#ifdef X', '#elif X', '#else',
  '#pragma once', '#line 3', '#error test', '#include HEADER', '#include <x.h> /* fin */',
  '#include ""', '#include "dir\\x.h"', '%:include <stdio.h>', '/* avant */ #include <stdio.h>',
  '#define X (1)', '#define X Y', '#ifndef', '#endif X', '#ifndef 1X',
]) {
  test(`directive non prise en charge : ${directive}`, () => {
    rejected(request(directive + '\n'), 'UNSUPPORTED_DIRECTIVE', 'unsupported-construct');
  });
}

// Lot 2 deliberately checked no brace for any intent. By the exception the
// founder approved on 12 November 2026, a C17 function definition — MAIN
// included — is placed at file scope only. Every other historical intention
// keeps the lot 2 behaviour untouched: braces are still not checked for them.
const openBefore = ['int main(void) {\n', '} } {\n'];
for (const prefix of [...openBefore, 'int main(void) {}\n', 'int age;\n']) {
  test(`erreurs C et accolades non contrôlées : ${prefix.trim()}`, () => {
    if (openBefore.includes(prefix)) {
      rejected(request(prefix, prefix.length, phrases[0]),
        prefix === '} } {\n' ? 'UNSUPPORTED_ENCLOSING_CONTEXT' : 'FUNCTION_DEFINITION_NESTED',
        prefix === '} } {\n' ? 'unsupported-construct' : 'unsafe-location');
    } else {
      planned(request(prefix, prefix.length, phrases[0]));
    }
    planned(request(prefix, prefix.length, phrases[3]));
  });
}

const mutations = [
  ['code', value => { value.fragments[0].code = 'int injected;\n'; }],
  ['commentaire', value => { value.fragments[0].comment = '// autre'; }],
  ['rendu', value => { value.fragments[0].text += '\\'; }],
  ['LF final', value => { value.fragments[0].code = value.fragments[0].code.trimEnd(); }],
  ['curseur relatif', value => { value.fragments[0].cursor.offset++; }],
  ['rôle', value => { value.fragments[0].role = 'include'; }],
  ['identifiant', value => { value.fragments[0].id = 'autre'; }],
  ['intention', value => { value.instruction.kind = 'DECL_INT'; }],
  ['paramètres', value => { value.instruction.parameters.name = 'injected'; }],
  ['source', value => { value.source.text = phrases[1]; }],
  ['diagnostics', value => { value.diagnostics.push({ code: 'erreur' }); }],
  ['fragment supplémentaire', value => { value.fragments.push(value.fragments[0]); }],
  ['champ supplémentaire', value => { value.fragments[0].unknown = true; }],
  ['aucun fragment', value => { value.fragments.length = 0; }],
];
for (const [name, mutate] of mutations) {
  test(`invariant du résultat vérifié : ${name}`, () => {
    const input = request();
    mutate(input.translation);
    rejected(input, 'INVALID_TRANSLATION_RESULT', 'invalid-request');
  });
}

test('refus de compréhension reçu au lieu d’un succès : aucune modification', () => {
  rejected(request('', 0, 'inconnue'), 'INVALID_TRANSLATION_RESULT', 'invalid-request');
});

test('comparaison du résultat indépendante de l’ordre des clés', () => {
  const input = request();
  input.translation = Object.fromEntries(Object.entries(input.translation).reverse());
  planned(input);
});

test('plan périmé détecté par identité, révision et contenu indépendamment', () => {
  const input = request();
  const { plan } = planned(input);
  assert.deepEqual(validatePlan(plan, structuredClone(input.document)), { status: 'current', diagnostics: [] });
  for (const changed of [
    { ...input.document, id: 'autre.c' }, { ...input.document, revision: 1 },
    { ...input.document, revision: '0' }, { ...input.document, text: ' ' },
  ]) {
    const result = validatePlan(plan, changed);
    assert.equal(result.status, 'rejected');
    assert.equal(result.diagnostics[0].code, 'STALE_PLAN');
    assert.equal(result.diagnostics[0].reason, 'stale-plan');
  }
  const changed = apply(plan, input.document);
  assert.equal(validatePlan(plan, changed).status, 'rejected');
});

test('nouveau placement après édition manuelle : source actuelle respectée', () => {
  const { plan, document } = planned(request());
  const manuallyEdited = { ...document, revision: 7, text: document.text.replace('main(void)', 'main(int argc, char **argv)') };
  assert.equal(validatePlan(plan, manuallyEdited).status, 'rejected');
  const cursor = manuallyEdited.text.indexOf('    \n') + 4;
  const next = planned(request(manuallyEdited.text, cursor, phrases[1], { document: manuallyEdited }));
  assert.ok(next.document.text.includes('main(int argc, char **argv)'));
});

test('plan indépendant des mutations ultérieures des entrées', () => {
  const input = request();
  const { plan } = planned(input);
  const copy = structuredClone(plan);
  input.document.text = 'modifié';
  input.translation.instruction.kind = 'autre';
  input.translation.fragments[0].text = 'modifié';
  assert.deepEqual(plan, copy);
});

test('plans et refus purs, déterministes, sérialisables, sans mutation des entrées gelées', () => {
  function freeze(value) {
    if (value && typeof value === 'object') {
      for (const item of Object.values(value)) freeze(item);
      Object.freeze(value);
    }
    return value;
  }
  for (const input of [request(), request('/* ouvert\n'), request('int x;'), request('// é😀\r\n\t', 10, phrases[1])]) {
    freeze(input);
    const result = planPlacement(input);
    assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    for (let i = 0; i < 5; i++) assert.deepEqual(planPlacement(input), result);
  }
});

for (const whitespace of ['\v', '\f', ' \t\v\f']) {
  test(`continuation avec espace de contrôle refusée ${JSON.stringify(whitespace)}`, () => {
    rejected(request('// texte \\' + whitespace + '\n'), 'UNSUPPORTED_LINE_CONTINUATION', 'unsupported-construct');
  });
}

for (const prefix of ['\0#define X 1\n', '// texte\0\n', '/* texte\0 */\n', 'char *s="\0";\n', '#include <x.h> // \0\n', '#include <\0.h>\n', 'char *s="\\\0";\n']) {
  test(`NUL avant la cible : refus conservateur ${JSON.stringify(prefix)}`, () => {
    rejected(request(prefix), 'LEXICAL_CONTEXT_UNDETERMINED', 'unsupported-construct');
  });
}

test('diagnostic multiligne après accents et caractère astral : plage UTF-16', () => {
  const prefix = '// é😀\r\n/*\r\n';
  rejected(request(prefix), 'TARGET_IN_COMMENT', 'unsafe-location', { start: 8, end: 10 });
});

test('plusieurs antislashs textuels et échappements ne sont pas une continuation physique', () => {
  planned(request(String.raw`const char *s="\n\t\\";` + '\n'));
});

test('validatePlan reste pur sur des instantanés gelés et des révisions opaques', () => {
  const input = request('', 0, phrases[0], { document: { id: 'x', text: '', revision: 'rev-1' } });
  const { plan } = planned(input);
  Object.freeze(plan.base);
  Object.freeze(plan);
  Object.freeze(input.document);
  assert.deepEqual(validatePlan(plan, input.document), { status: 'current', diagnostics: [] });
  assert.equal(validatePlan(plan, { id: '', revision: 0, text: '' }).diagnostics[0].code, 'INVALID_DOCUMENT');
});

// This case used to place MAIN inside main. MAIN is now refused there, so the
// indentation coverage moves to a block intent that legitimately nests.
test('bloc imbriqué conserve uniquement l’indentation de la ligne cible', () => {
  const prefix = 'int main(void) {\n';
  const phrase = 'Crée un bloc si "a"';
  const { document } = planned(request(prefix + '\t\n}', prefix.length + 1, phrase));
  assert.equal(document.text, prefix + '\t// ' + phrase + '\n\tif (a) {\n\t    \n\t}\n}');
});

test('MAIN imbriqué est refusé, sans déduction d’indentation', () => {
  const prefix = 'int main(void) {\n';
  rejected(request(prefix + '\t\n}', prefix.length + 1, phrases[0]), 'FUNCTION_DEFINITION_NESTED', 'unsafe-location');
});

test('ligne vide non indentée dans un bloc : aucune indentation déduite', () => {
  const prefix = 'int main(void) {\n';
  const { document } = planned(request(prefix + '\n}', prefix.length, phrases[1]));
  assert.equal(document.text, prefix + '// ' + phrases[1] + '\nint age;\n\n}');
});

test('priorité déterministe des contrôles bruts avant analyse lexicale', () => {
  rejected(request('#define X 1\n// ??/\n'), 'UNSUPPORTED_TRIGRAPH', 'unsupported-construct');
  rejected(request('// \\\n// ??/\n'), 'UNSUPPORTED_LINE_CONTINUATION', 'unsupported-construct');
});

test('grand littéral et phrase avec tabulations conservés au placement', () => {
  const value = '-' + '9'.repeat(4096);
  const phrase = '\tCRÉE\tun entier nommé Age de valeur ' + value + '.\t';
  const { document } = planned(request('    ', 4, phrase));
  assert.ok(document.text.startsWith('    // ' + phrase + '\n'));
  assert.ok(document.text.includes('    int Age = ' + value + ';\n'));
});

test('fin de ligne de repli explicite CRLF dans un document sans fin de ligne', () => {
  for (const phrase of phrases) {
    const { document, plan } = planned(request('', 0, phrase, { fallbackEol: '\r\n' }));
    assert.equal(plan.eol, '\r\n');
    assert.ok(document.text.endsWith('\r\n'));
    assert.ok(!/(?<!\r)\n/u.test(document.text));
    assert.equal(document.text.charAt(plan.cursorAfter), '\r');
  }
});

test('les fins de ligne du texte ont priorité sur le repli de l’appelant', () => {
  assert.equal(planned(request('\n', 0, phrases[0], { fallbackEol: '\r\n' })).plan.eol, '\n');
  assert.equal(planned(request('\r\n', 2, phrases[0], { fallbackEol: '\n' })).plan.eol, '\r\n');
});

for (const fallbackEol of ['', '\r', 'x', null]) {
  test(`repli de fin de ligne invalide ${JSON.stringify(fallbackEol)}`, () => {
    rejected(request('', 0, phrases[0], { fallbackEol }), 'INVALID_EOL', 'invalid-request');
  });
}
