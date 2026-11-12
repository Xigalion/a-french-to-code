import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement, validatePlan } from '../src/planPlacement.ts';
import { explainConditions } from '../src/conditionInformation.ts';
import { analyzeCalculations } from '../src/calculationAdvisories.ts';
import { resolveLoopTarget, MAX_TRANSFER_UNITS, MAX_TRANSFER_TOKENS, MAX_TRANSFER_DEPTH } from '../src/loopTarget.ts';
import { TranslationSession } from '../extension/out/extension/src/session.js';

const BREAK = 'Sors de la boucle la plus intérieure.';
const CONTINUE = 'Passe à l’itération suivante de la boucle la plus intérieure.';

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
  if (code) assert.equal(result.diagnostics[0].code, code, JSON.stringify(result));
  if (token) assert.equal(source.slice(result.diagnostics[0].range.start, result.diagnostics[0].range.end), token);
  assert.deepEqual(result, translate(source));
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// Traduction : deux instructions simples, pas des blocs.
// ---------------------------------------------------------------------------

for (const [source, code, kind] of [[BREAK, 'break;\n', 'BREAK'], [CONTINUE, 'continue;\n', 'CONTINUE']]) {
  for (const suffix of ['', '.']) {
    test(`${kind} rendu ${JSON.stringify(suffix)}`, () => {
      const phrase = (suffix === '.' ? source : source.slice(0, -1));
      const result = translated(phrase);
      assert.equal(result.instruction.kind, kind);
      assert.equal(result.fragments[0].code, code);
      assert.equal(result.fragments[0].text, `// ${phrase}\n${code}`);
      // A simple statement: no block, so no inner cursor.
      assert.equal(result.fragments[0].cursor, undefined);
      // Neither has the meaning of return, and neither is a goto.
      assert.ok(!/return|goto|\{|\}/u.test(code));
    });
  }
}

test('les transferts préservent espaces, casse et accents de la phrase', () => {
  const source = '\tSORS\tde LA\tboucle la PLUS\tintérieure. \t';
  const result = translated(source);
  assert.equal(result.fragments[0].comment, '// ' + source);
  assert.equal(result.fragments[0].code, 'break;\n');
});

test('les deux apostrophes typographiques sont acceptées', () => {
  assert.equal(translated(CONTINUE).fragments[0].code, 'continue;\n');
  assert.equal(translated(CONTINUE.replace('’', "'")).fragments[0].code, 'continue;\n');
  // The sentence is still kept verbatim, with the apostrophe actually typed.
  assert.ok(translated(CONTINUE.replace('’', "'")).fragments[0].comment.includes("l'itération"));
});

const refusals = [
  // A sentence that stops early is incomplete; a wrong word is unknown. The
  // optional final period is never part of the reported range.
  ['Sors de la boucle.', 'INCOMPLETE_INSTRUCTION'],
  ['Sors de la boucle la plus extérieure.', 'UNKNOWN_FORMULATION', 'extérieure'],
  ['Sors de la boucle la plus interieure.', 'UNKNOWN_FORMULATION', 'interieure'],
  ['Sors de la boucle la plus', 'INCOMPLETE_INSTRUCTION'],
  ['Sors de la boucle la plus intérieure maintenant.', 'UNEXPECTED_TEXT'],
  ['Sors de la boucle 2 la plus intérieure.', 'UNKNOWN_FORMULATION', '2'],
  ['Sors.', 'INCOMPLETE_INSTRUCTION'],
  ['Passe à l’itération suivante.', 'INCOMPLETE_INSTRUCTION'],
  ['Passe à l’itération suivante de la boucle.', 'INCOMPLETE_INSTRUCTION'],
  ['Passe à l’itération suivante de la boucle la plus', 'INCOMPLETE_INSTRUCTION'],
  ['Passe a l’itération suivante de la boucle la plus intérieure.', 'UNKNOWN_FORMULATION', 'a'],
  ['Retourne de la boucle la plus intérieure.', 'UNKNOWN_FORMULATION', 'Retourne'],
  ['Sors du switch.', 'UNKNOWN_FORMULATION'],
  ['Sors de la fonction.', 'UNKNOWN_FORMULATION'],
];
for (const [source, code, token] of refusals) {
  test(`transfert refusé ${code} ${JSON.stringify(source.slice(0, 44))}`, () => refused(source, code, token));
}

test('les transferts n’ont ni condition ni avis ni information', () => {
  for (const source of [BREAK, CONTINUE]) {
    const result = translated(source);
    assert.deepEqual(explainConditions(result), []);
    assert.deepEqual(analyzeCalculations(result).advisories, []);
  }
});

// ---------------------------------------------------------------------------
// Reconnaissance de la structure englobante.
// ---------------------------------------------------------------------------

function input(text, source = BREAK, unit = '    ', eol = '\n', cursorOffset = text.length) {
  return { document: { id: 'transfer.c', revision: 0, text }, cursorOffset, translation: translated(source), indentUnit: unit, fallbackEol: eol };
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

const accepted = [
  ['while (a) {\n', BREAK, 'while', 0],
  ['while (a) {\n', CONTINUE, 'while', 0],
  ['for (i = 0; i < 3; i = (i + 1)) {\n', BREAK, 'for', 0],
  ['for (i = 0; i < 3; i = (i + 1)) {\n', CONTINUE, 'for', 0],
  ['do {\n', BREAK, 'do', 0],
  ['do {\n', CONTINUE, 'do', 0],
  ['while (a) {\n    if (b) {\n', BREAK, 'while', 0],
  ['while (a) {\n    if (b) {\n    } else {\n', CONTINUE, 'while', 0],
  ['while (a) {\n    if (b)\n', BREAK, 'while', 0],
  ['while (a) {\n    {\n', BREAK, 'while', 0],
  ['int main(void) {\n    while (a) {\n        for (i = 0; i < 2; i = (i + 1)) {\n', BREAK, 'for', 0],
  ['while (a) {\n    while (b) {\n    }\n', BREAK, 'while', 0],
  ['while (a) {\n    switch (x) {\n    case 1:\n', CONTINUE, 'while', 1],
  ['do {\n    switch (x) {\n    default:\n', CONTINUE, 'do', 1],
  ['struct P { int x; };\nwhile (a) {\n', BREAK, 'while', 0],
  ['while (a) { /* } */\n', BREAK, 'while', 0],
  ['while (a) { // }\n', BREAK, 'while', 0],
  ['while (a) { char c = \'}\';\n', BREAK, 'while', 0],
  ['while (a) { const char* s = "} while (z) {";\n', BREAK, 'while', 0],
  ['#include <stdio.h>\nint main(void) {\n    while (a) {\n', BREAK, 'while', 0],
];
for (const [text, source, form, switches] of accepted) {
  test(`cible ${form} établie (${source === BREAK ? 'break' : 'continue'}) ${JSON.stringify(text.slice(0, 40))}`, () => {
    const { plan } = planned(input(text, source));
    assert.equal(plan.loopTarget.form, form);
    assert.equal(plan.loopTarget.switchesCrossed, switches);
    assert.equal(text.slice(plan.loopTarget.keywordRange.start, plan.loopTarget.keywordRange.end),
      form === 'do' ? 'do' : form);
  });
}

const rejected = [
  // A switch intercepts break: the sentence would be false, so it is refused.
  ['while (a) {\n    switch (x) {\n    case 1:\n', BREAK, 'BREAK_TARGET_IS_SWITCH'],
  ['do {\n    switch (x) {\n    default:\n', BREAK, 'BREAK_TARGET_IS_SWITCH'],
  ['for (i = 0; i < 3; i = (i + 1)) {\n    switch (x) {\n    case 1:\n', BREAK, 'BREAK_TARGET_IS_SWITCH'],
  ['switch (x) {\n    case 1:\n', BREAK, 'BREAK_TARGET_IS_SWITCH'],
  // No enclosing loop at all.
  ['', BREAK, 'LOOP_TARGET_NOT_FOUND'],
  ['', CONTINUE, 'LOOP_TARGET_NOT_FOUND'],
  ['int main(void) {\n', BREAK, 'LOOP_TARGET_NOT_FOUND'],
  ['int main(void) {\n', CONTINUE, 'LOOP_TARGET_NOT_FOUND'],
  ['switch (x) {\n    case 1:\n', CONTINUE, 'LOOP_TARGET_NOT_FOUND'],
  ['if (a) {\n', BREAK, 'LOOP_TARGET_NOT_FOUND'],
  ['while (a) {\n}\n', BREAK, 'LOOP_TARGET_NOT_FOUND'],
  // An unbraced body is the enclosing structure, and carries no brace.
  ['while (a)\n', BREAK, 'UNBRACED_LOOP_BODY'],
  ['while (a)\n', CONTINUE, 'UNBRACED_LOOP_BODY'],
  ['for (i = 0; i < 3; i = (i + 1))\n', BREAK, 'UNBRACED_LOOP_BODY'],
  ['switch (x)\n', BREAK, 'UNBRACED_LOOP_BODY'],
  ['while (a) {\n    do\n', BREAK, 'UNBRACED_LOOP_BODY'],
  // Not a statement position.
  ['int x =\n', BREAK, 'NOT_A_STATEMENT_POSITION'],
  ['while (a) {\n    f(\n', BREAK, 'UNSUPPORTED_LOOP_CONTEXT'],
  ['while (a) {\n    int t[2] = {\n', BREAK, 'UNSUPPORTED_LOOP_CONTEXT'],
  ['int t[2] = {\n', BREAK, 'UNSUPPORTED_LOOP_CONTEXT'],
  ['while (a) {\n}\n}\n', BREAK, 'UNSUPPORTED_LOOP_CONTEXT'],
  ['while (a) {\n    )\n', BREAK, 'UNSUPPORTED_LOOP_CONTEXT'],
  // Lexical constructs outside the supported subset.
  ['while (a) {\n??/\n', BREAK, 'UNSUPPORTED_TRIGRAPH'],
  ['while (a) {\\\n', BREAK, 'UNSUPPORTED_LINE_CONTINUATION'],
  ['#define X 1\nwhile (a) {\n', BREAK, 'UNSUPPORTED_DIRECTIVE'],
  ['/* ouvert\nwhile (a) {\n', BREAK, 'TARGET_IN_COMMENT'],
];
for (const [text, source, code] of rejected) {
  test(`transfert refusé au placement ${code} ${JSON.stringify(text.slice(0, 34))}`, () => {
    placementRefused(input(text, source), code);
  });
}

test('la cible n’est jamais déduite de l’indentation', () => {
  // The inner loop is closed, so the enclosing loop is the outer one, whatever
  // the indentation of the target line suggests.
  const text = 'while (outer) {\n    while (inner) {\n    }\n        \n';
  const { plan } = planned(input(text, BREAK, '    ', '\n', text.length - 1));
  assert.equal(text.slice(plan.loopTarget.keywordRange.start, plan.loopTarget.keywordRange.end), 'while');
  assert.equal(plan.loopTarget.keywordRange.start, text.indexOf('while (outer)'));
});

test('la cible n’est pas le dernier mot « while » rencontré', () => {
  // A closed inner loop, a comment and a string all mention while; the target
  // is the still-open for loop.
  const text = 'for (i = 0; i < 3; i = (i + 1)) {\n    while (b) {\n    }\n    // while (c)\n    char* s = "while (d) {";\n';
  const { plan } = planned(input(text, CONTINUE));
  assert.equal(plan.loopTarget.form, 'for');
});

const adversarial = [
  // A closed inner loop does not hide the enclosing do.
  ['int main(void) {\n    do {\n        while (b) {\n        }\n', CONTINUE, 'do'],
  ['while (a) { if (b) { } else if (c) { } else { }\n', BREAK, 'while'],
  ['while (a) {\n    for (;;) {\n', BREAK, 'for'],
  ['while(a){\n', BREAK, 'while'],
  ['while (a) {\n    x = y > 0 ? 1 : 2;\n', BREAK, 'while'],
  ['while (a) {\n    /* note */ if (b) {\n', CONTINUE, 'while'],
  ['while (a) {\n    // }\n    if (b) {\n    }\n', BREAK, 'while'],
  ['﻿while (a) {\n', BREAK, 'while'],
  // Labels and goto do not change targeting: it is purely syntactic.
  ['while (a) {\n    goto fin;\n', BREAK, 'while'],
  ['fin:\nwhile (a) {\n', BREAK, 'while'],
  ['while (a) {\n    fin:\n', BREAK, 'while'],
];
for (const [text, source, form] of adversarial) {
  test(`contexte adverse résolu en ${form} ${JSON.stringify(text.slice(0, 32))}`, () => {
    assert.equal(planned(input(text, source)).plan.loopTarget.form, form);
  });
}

test('une boucle refermée, puis un else : aucune cible', () => {
  placementRefused(input('while (a) {\n  } else {\n', BREAK), 'LOOP_TARGET_NOT_FOUND');
});

test('une définition de type ouverte dans un corps de boucle est refusée', () => {
  placementRefused(input('while (a) { struct P { int x;\n', BREAK), 'UNSUPPORTED_LOOP_CONTEXT');
});

test('un do sans son while final est quand même une cible syntaxique', () => {
  // Incomplete C, but break/continue targeting is purely syntactic.
  const { plan } = planned(input('do {\n', BREAK));
  assert.equal(plan.loopTarget.form, 'do');
});

test('bornes du reconnaisseur de transfert', () => {
  assert.equal(resolveLoopTarget(' '.repeat(MAX_TRANSFER_UNITS + 1), MAX_TRANSFER_UNITS + 1, 'break').diagnostic.code, 'TRANSFER_SCAN_LIMIT');
  placementRefused(input('while (a) {\n' + ';'.repeat(MAX_TRANSFER_TOKENS) + '\n'), 'TRANSFER_SCAN_LIMIT');
  placementRefused(input('while (a) {\n' + '{'.repeat(MAX_TRANSFER_DEPTH) + '\n'), 'TRANSFER_SCAN_LIMIT');
  planned(input('while (a) {\n' + ';'.repeat(MAX_TRANSFER_TOKENS - 10) + '\n'));
});

test('le reconnaisseur de transfert est indépendant de celui des branches', () => {
  // An if chain tail is a branch target but never a transfer target.
  placementRefused(input('if (a) {\n}\n', BREAK), 'LOOP_TARGET_NOT_FOUND');
  // A loop body is a transfer target but never a branch target.
  planned(input('while (a) {\n', BREAK));
  placementRefused(input('while (a) {\n', 'Ajoute une branche sinon.'));
});

// ---------------------------------------------------------------------------
// Placement : instruction simple, ligne de saisie suivante, préservation.
// ---------------------------------------------------------------------------

for (const eol of ['\n', '\r\n']) {
  for (const unit of ['  ', '    ', '\t']) {
    test(`transfert placé comme une instruction simple ${JSON.stringify([eol, unit])}`, () => {
      const prefix = 'while (a) {' + eol + unit + 'if (b) {' + eol + unit.repeat(2);
      const suffix = eol + unit + '}' + eol + '}' + eol;
      const { plan, text } = planned(input(prefix + suffix, BREAK, unit, eol, prefix.length));
      assert.equal(text, prefix.slice(0, prefix.length - unit.length * 2)
        + unit.repeat(2) + '// ' + BREAK + eol
        + unit.repeat(2) + 'break;' + eol
        + unit.repeat(2) + suffix);
      // A simple statement leaves an ordinary input line after itself.
      assert.equal(text.slice(plan.cursorAfter - unit.length * 2, plan.cursorAfter), unit.repeat(2));
      assert.ok(text.endsWith(unit + '}' + eol + '}' + eol));
      assert.equal(plan.loopTarget.form, 'while');
    });
  }
}

test('transfert : aucun code adjacent absorbé ni accolade déplacée', () => {
  const text = 'while (a) {\n    int manuel = 1;\n    \n    int apres = 9;\n}\n';
  const { text: after } = planned(input(text, CONTINUE, '    ', '\n', text.indexOf('    \n    int apres')));
  assert.ok(after.includes('    int manuel = 1;\n'));
  assert.ok(after.includes('    continue;\n'));
  assert.ok(after.includes('    int apres = 9;\n}\n'));
  assert.equal((after.match(/\{/gu) ?? []).length, 1);
  assert.equal((after.match(/\}/gu) ?? []).length, 1);
});

test('transfert : plan périmé si la structure englobante change', () => {
  const text = 'while (a) {\n    \n}\n';
  const request = input(text, BREAK, '    ', '\n', text.indexOf('    \n'));
  const { plan } = planned(request);
  // Turning the loop into a switch must invalidate the confirmed plan.
  const altered = { ...request.document, revision: 1, text: text.replace('while (a)', 'switch (a)') };
  const validation = validatePlan(plan, altered);
  assert.equal(validation.status, 'rejected');
  assert.equal(validation.diagnostics[0].code, 'STALE_PLAN');
});

for (const field of ['code', 'source', 'instruction', 'target']) {
  test(`transfert : plan ou traduction falsifié refusé (${field})`, () => {
    const text = 'while (a) {\n    \n}\n';
    const request = input(text, BREAK, '    ', '\n', text.indexOf('    \n'));
    if (field === 'target') {
      const { plan } = planned(request);
      plan.loopTarget.form = 'for';
      assert.equal(validatePlan(plan, request.document).status, 'rejected');
      return;
    }
    if (field === 'code') request.translation.fragments[0].code = 'continue;\n';
    if (field === 'source') request.translation.source.text = CONTINUE;
    if (field === 'instruction') request.translation.instruction.kind = 'CONTINUE';
    placementRefused(request, 'INVALID_TRANSLATION_RESULT');
  });
}

// ---------------------------------------------------------------------------
// Les trois points de reprise, construits puis vérifiés structurellement.
// ---------------------------------------------------------------------------

test('continue est accepté dans les trois formes de boucle', () => {
  for (const [text, form] of [['while (a) {\n', 'while'],
    ['do {\n', 'do'], ['for (i = 0; i < 3; i = (i + 1)) {\n', 'for']]) {
    assert.equal(planned(input(text, CONTINUE)).plan.loopTarget.form, form);
  }
});

test('continue placé avant une progression manuelle : C-A ne la déplace pas', () => {
  // The student put the progression at the end of a while body; a continue
  // above it would skip it. C-A neither moves it nor adds one before.
  const text = 'while (i < limite) {\n    \n    i = (i + 1);\n}\n';
  const { text: after } = planned(input(text, CONTINUE, '    ', '\n', text.indexOf('    \n')));
  assert.ok(after.includes('    continue;\n'));
  // The progression is still exactly where the student wrote it, after.
  assert.ok(after.indexOf('continue;') < after.indexOf('i = (i + 1);'));
  assert.equal((after.match(/i = \(i \+ 1\);/gu) ?? []).length, 1);
});

test('sortir de la boucle extérieure par un break intérieur est impossible', () => {
  // The inner loop intercepts the transfer: the resolved target is the inner
  // loop, never the outer one.
  const text = 'while (outer) {\n    while (inner) {\n        \n    }\n}\n';
  const { plan } = planned(input(text, BREAK, '    ', '\n', text.indexOf('        \n')));
  assert.equal(plan.loopTarget.keywordRange.start, text.indexOf('while (inner)'));
  assert.notEqual(plan.loopTarget.keywordRange.start, text.indexOf('while (outer)'));
});

test('transfert : session, aucune information et confirmation unique', () => {
  const text = 'while (a) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: text.indexOf('    \n') + 4,
    singleCursor: true, indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, BREAK);
  const prepared = session.prepare(target);
  assert.equal(prepared.status, 'preview', JSON.stringify(prepared));
  assert.deepEqual(session.information, []);
  assert.deepEqual(session.advisories, []);
  assert.ok(prepared.preview.after.includes('    break;'));
  assert.match(session.attachmentLabel, /ligne 1/);
  session.reviewReady(prepared.preview.token, target);
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'apply');
  assert.equal(session.beginApply(prepared.preview.token, target).status, 'error');
});

test('transfert : session périmée refuse l’insertion', () => {
  const text = 'while (a) {\n    \n}\n';
  const target = { document: { id: 'x.c', revision: 1, text }, cursorOffset: text.indexOf('    \n') + 4,
    singleCursor: true, indentUnit: '    ', indentSignature: '4', eol: '\n', open: true };
  const session = new TranslationSession(target, BREAK);
  const prepared = session.prepare(target);
  session.reviewReady(prepared.preview.token, target);
  const next = structuredClone(target);
  next.document.text = text.replace('while (a)', 'switch (a)');
  next.document.revision++;
  assert.equal(session.beginApply(prepared.preview.token, next).status, 'error');
});

// ---------------------------------------------------------------------------
// Non-régression.
// ---------------------------------------------------------------------------

test('11D : switch, return et goto restent non livrés', () => {
  for (const source of ['Crée un bloc selon "i".', 'Retourne la valeur 0.', 'Saute à l’étiquette fin.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('11D : les sorties des lots précédents sont inchangées', () => {
  const historical = [
    ['Crée une boucle tant que "i < 3".', 'while (i < 3) {\n    \n}\n'],
    ['Crée une boucle avec test final tant que "i < 3".', 'do {\n    \n} while (i < 3);\n'],
    ['Crée une boucle pour i de valeur initiale "0" tant que "i < 3" avec mise à jour "i + 1".',
      'for (i = 0; i < 3; i = (i + 1)) {\n    \n}\n'],
    ['Crée un bloc si "age >= 18".', 'if (age >= 18) {\n    \n}\n'],
    ['Ajoute une branche sinon si "age >= 12".', 'else if (age >= 12) {\n    \n}\n'],
    ['Ajoute une branche sinon.', 'else {\n    \n}\n'],
    ['Crée la fonction principale.', 'int main(void) {\n    \n}\n'],
    ['Déclare un entier nommé age.', 'int age;\n'],
    ['Affecte la valeur 25 à age.', 'age = 25;\n'],
    ['Affiche le texte "Bonjour".', 'printf("%s", "Bonjour");\n'],
    ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
  ];
  for (const [source, code] of historical) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});

test('11D : une chaîne de branches se construit encore normalement', () => {
  const text = 'if (a) {\n}\n\n';
  const result = planPlacement(input(text, 'Ajoute une branche sinon.', '    ', '\n', text.length - 1));
  assert.equal(result.status, 'planned', JSON.stringify(result));
  assert.ok(result.plan.attachment);
  assert.equal(result.plan.loopTarget, undefined);
});
