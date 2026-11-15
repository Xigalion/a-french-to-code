import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';
import { inspectPrefix } from '../src/placementLexical.ts';

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', `${source} aurait dû être traduite : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  return result;
}
function refused(source, code) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
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
// 1. Les six formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Inclue l’en-tête "calcul.h".', '#include "calcul.h"\n', 'INCLUDE_LOCAL'],
  ['Ouvre la protection d’en-tête nommée CALCUL_H.', '#ifndef CALCUL_H\n#define CALCUL_H\n', 'GUARD_OPEN'],
  ['Ferme la protection d’en-tête.', '#endif\n', 'GUARD_CLOSE'],
  ['Déclare le prototype d’une fonction nommée somme qui retourne un int et prend un int nommé a.',
    'int somme(int a);\n', 'FUNC_PROTOTYPE'],
  ['Déclare la variable externe de type int nommée compteur.', 'extern int compteur;\n', 'LINKAGE_DECL'],
  ['Déclare la variable interne de type double nommée total.', 'static double total;\n', 'LINKAGE_DECL'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 23 sortie exacte : ${source.slice(0, 50)}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 23 sortie exacte sans point final : ${source.slice(0, 50)}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('les deux apostrophes désignent le même en-tête', () => {
  assert.equal(translate('Inclue l\'en-tête "calcul.h".').fragments[0].code, '#include "calcul.h"\n');
  assert.equal(translate("Ferme la protection d'en-tête.").fragments[0].code, '#endif\n');
});

test('les deux formes d’inclusion restent distinctes', () => {
  // Quotes search next to the current file, angles search the system paths:
  // two different rules, and neither sentence is rewritten into the other.
  assert.equal(translated('Inclue l’en-tête "calcul.h".').fragments[0].code, '#include "calcul.h"\n');
  assert.equal(translated('Inclue la bibliothèque stdio.h.').fragments[0].code, '#include <stdio.h>\n');
  // And the frozen rule of lot 4 keeps its own grammar and message.
  const refusal = refused('Inclue la bibliothèque "calcul.h".', 'UNSUPPORTED_HEADER');
  assert.equal(refusal.message, 'Seul l’en-tête stdio.h, écrit exactement ainsi, est pris en charge.');
});

// ---------------------------------------------------------------------------
// 2. Prototypes : la même queue de phrase que les définitions
// ---------------------------------------------------------------------------

for (const [tail, code] of [
  ['qui retourne un int', 'int f(void);\n'],
  ['qui ne retourne rien', 'void f(void);\n'],
  ['qui retourne un char', 'char f(void);\n'],
  ['qui retourne un unsigned int', 'unsigned int f(void);\n'],
  ['qui retourne un int et prend un int nommé a', 'int f(int a);\n'],
  // Subsequent parameters are joined by « et un », as lot 12 published.
  ['qui retourne un int et prend un int nommé a et un double nommé b', 'int f(int a, double b);\n'],
  ['qui ne retourne rien et prend un char nommé c', 'void f(char c);\n'],
]) {
  test(`prototype : ${tail}`, () => {
    assert.equal(translated(`Déclare le prototype d’une fonction nommée f ${tail}.`).fragments[0].code, code);
  });
}

test('le prototype et la définition partagent exactement la même queue', () => {
  const signature = 'qui retourne un int et prend un double nommé v';
  const definition = translated(`Crée une fonction nommée calcul ${signature}.`).fragments[0].code;
  const prototype = translated(`Déclare le prototype d’une fonction nommée calcul ${signature}.`).fragments[0].code;
  assert.equal(definition, 'int calcul(double v) {\n    \n}\n');
  assert.equal(prototype, 'int calcul(double v);\n');
  // The prototype is the definition header with a semicolon instead of a body.
  assert.equal(prototype, definition.slice(0, definition.indexOf(' {')) + ';\n');
});

test('un prototype interne porte static', () => {
  assert.equal(translated('Déclare le prototype d’une fonction interne nommée aide qui retourne un int.').fragments[0].code,
    'static int aide(void);\n');
  assert.equal(translated('Déclare le prototype d’une fonction interne nommée aide qui ne retourne rien et prend un int nommé n.').fragments[0].code,
    'static void aide(int n);\n');
});

test('les diagnostics du lot 12 sont réutilisés tels quels', () => {
  refused('Déclare le prototype d’une fonction nommée f qui retourne un long.', 'UNSUPPORTED_NUMERIC_TYPE');
  refused('Déclare le prototype d’une fonction nommée 1f qui retourne un int.', 'INVALID_IDENTIFIER');
  refused('Déclare le prototype d’une fonction nommée f.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare le prototype d’une fonction nommée f qui retourne un int et prend un int nommé a et un int nommé a.',
    'DUPLICATE_PARAMETER_NAME');
  refused('Déclare le prototype d’une fonction qui retourne un int.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 3. Gardes d’en-tête
// ---------------------------------------------------------------------------

for (const macro of ['CALCUL_H', 'H', 'A1_H', 'MON_EN_TETE_H']) {
  test(`nom de protection accepté : ${macro}`, () => {
    assert.equal(translated(`Ouvre la protection d’en-tête nommée ${macro}.`).fragments[0].code,
      `#ifndef ${macro}\n#define ${macro}\n`);
  });
}
for (const macro of ['calcul_h', 'Calcul_H', '1H', '_H', 'H-1', 'É_H']) {
  test(`nom de protection refusé : ${macro}`, () => {
    const diagnostic = refused(`Ouvre la protection d’en-tête nommée ${macro}.`, 'INVALID_GUARD_MACRO');
    assert.match(diagnostic.message, /majuscules ASCII/u);
  });
}
test('diagnostics des gardes', () => {
  refused('Ouvre la protection d’en-tête.', 'MISSING_GUARD_MACRO');
  refused('Ouvre la protection d’en-tête nommée.', 'MISSING_GUARD_MACRO');
  refused('Ouvre la protection nommée H.', 'UNKNOWN_FORMULATION');
  refused('Ouvre la protection d’en-tête nommée H encore.', 'UNEXPECTED_TEXT');
  // The optional final period attaches to « protection », so nothing follows.
  refused('Ferme la protection.', 'INCOMPLETE_INSTRUCTION');
  refused('Ferme la protection du fichier.', 'UNKNOWN_FORMULATION');
  refused('Ferme la protection d’en-tête maintenant.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 4. Chemins d’en-tête local : grammaire volontairement étroite
// ---------------------------------------------------------------------------

for (const path of ['calcul.h', 'util.h', 'sous/dossier.h', 'a.h']) {
  test(`chemin local accepté : ${path}`, () => {
    assert.equal(translated(`Inclue l’en-tête "${path}".`).fragments[0].code, `#include "${path}"\n`);
  });
}
for (const path of ['mon dossier/c.h', '', 'a"b.h', 'a<b.h', 'a\\b.h']) {
  test(`chemin local refusé : ${JSON.stringify(path)}`, () => {
    const diagnostic = refused(`Inclue l’en-tête "${path}".`, 'UNSUPPORTED_LOCAL_HEADER');
    assert.match(diagnostic.message, /sans espace, sans échappement/u);
  });
}
test('un chemin sans guillemets est refusé', () => {
  refused('Inclue l’en-tête calcul.h.', 'UNSUPPORTED_LOCAL_HEADER');
  refused('Inclue l’en-tête <calcul.h>.', 'UNSUPPORTED_LOCAL_HEADER');
  refused('Inclue l’en-tête.', 'INCOMPLETE_INSTRUCTION');
  refused('Inclue l’en-tête "a.h" encore.', 'UNEXPECTED_TEXT');
});

// ---------------------------------------------------------------------------
// 5. Liaison externe et interne
// ---------------------------------------------------------------------------

for (const [mot, mot_c] of [['externe', 'extern'], ['interne', 'static']]) {
  for (const type of ['int', 'unsigned int', 'float', 'double', 'char']) {
    test(`variable ${mot} de type ${type}`, () => {
      assert.equal(translated(`Déclare la variable ${mot} de type ${type} nommée v.`).fragments[0].code,
        `${mot_c} ${type} v;\n`);
    });
  }
}
test('diagnostics de liaison', () => {
  refused('Déclare la variable externe de type long nommée v.', 'UNSUPPORTED_NUMERIC_TYPE');
  refused('Déclare la variable externe de type nommée v.', 'MISSING_NUMERIC_TYPE');
  refused('Déclare la variable externe de type int nommée 1v.', 'INVALID_IDENTIFIER');
  refused('Déclare la variable externe de type int v.', 'UNKNOWN_FORMULATION');
  refused('Déclare la variable externe de type int nommée v encore.', 'UNEXPECTED_TEXT');
  refused('Déclare la variable publique de type int nommée v.', 'UNKNOWN_FORMULATION');
});
test('la déclaration scalaire du lot 7 est intacte', () => {
  assert.equal(translated('Déclare une variable de type int nommée x.').fragments[0].code, 'int x;\n');
  assert.equal(translated('Déclare un entier nommé x.').fragments[0].code, 'int x;\n');
});

// ---------------------------------------------------------------------------
// 6. L’élargissement des directives, et ce qui reste refusé
// ---------------------------------------------------------------------------

test('les trois directives d’une garde sont acceptées avant la cible', () => {
  for (const prefix of ['#ifndef H\n', '#ifndef H\n#define H\n', '#ifndef H\n#define H\n#endif\n',
    '#ifndef H\n#define H\n#include <stdio.h>\n', '#endif\n', '#define H\n', '#ifndef H // garde\n']) {
    assert.equal(inspectPrefix(prefix), undefined, JSON.stringify(prefix));
  }
});

test('tout le reste reste refusé, et « #define X 1 » avant tout', () => {
  // C-A does not expand macros: it must not read code whose tokens a macro
  // could have changed. This refusal is a safety property, not an omission.
  for (const prefix of ['#define X 1\n', '#define X (1)\n', '#define X Y\n', '#if 0\n', '#ifdef X\n',
    '#elif X\n', '#else\n', '#undef X\n', '#pragma once\n', '#ifndef\n', '#endif X\n', '#ifndef 1X\n']) {
    const issue = inspectPrefix(prefix);
    assert.ok(issue, JSON.stringify(prefix));
    assert.equal(issue.code, 'UNSUPPORTED_DIRECTIVE', JSON.stringify(prefix));
  }
});

test('une instruction se place à l’intérieur d’une garde écrite à la main', () => {
  const document = '#ifndef CALCUL_H\n#define CALCUL_H\n\n#endif\n';
  const result = applied(document, 'Déclare le prototype d’une fonction nommée somme qui retourne un int.',
    document.indexOf('\n\n') + 1);
  assert.equal(result, '#ifndef CALCUL_H\n#define CALCUL_H\n'
    // The blank target line is kept, as every simple insertion does.
    + '// Déclare le prototype d’une fonction nommée somme qui retourne un int.\nint somme(void);\n\n#endif\n');
});

test('une instruction ne se place pas après une macro à remplacement', () => {
  assert.equal(planned('#define TAILLE 10\n\n', 'Déclare un entier nommé x.', 18).refused, 'UNSUPPORTED_DIRECTIVE');
});

// ---------------------------------------------------------------------------
// 7. Informations pédagogiques
// ---------------------------------------------------------------------------

test('LOCAL_HEADER_SEARCH distingue guillemets et chevrons', () => {
  const source = 'Inclue l’en-tête "calcul.h".';
  const [entry] = explainInstruction(translated(source));
  assert.equal(entry.code, 'LOCAL_HEADER_SEARCH');
  assert.equal(entry.severity, 'information');
  assert.equal(source.slice(entry.range.start, entry.range.end), '"calcul.h"');
  assert.match(entry.message, /à côté du fichier courant/u);
  assert.match(entry.message, /répertoires du système/u);
  assert.match(entry.message, /ne vérifie pas que ce fichier existe/u);
});

test('les deux informations d’une garde, dont l’absence d’évaluation', () => {
  const entries = explainInstruction(translated('Ouvre la protection d’en-tête nommée CALCUL_H.'));
  assert.deepEqual(entries.map(entry => entry.code),
    ['GUARD_PREVENTS_DOUBLE_INCLUSION', 'GUARD_NOT_EVALUATED']);
  assert.match(entries[0].message, /inclus deux fois déclare deux fois les mêmes choses/u);
  // It names the closing sentence, because forgetting it breaks the build.
  assert.match(entries[0].message, /Ferme la protection d’en-tête/u);
  assert.match(entries[1].message, /n’évalue aucune condition de préprocesseur/u);
  assert.match(entries[1].message, /que la région soit active ou non/u);
  assert.match(entries[1].message, /unique dans le projet/u);
  // The closing directive carries none: it states nothing new.
  assert.deepEqual(explainInstruction(translated('Ferme la protection d’en-tête.')), []);
});

test('PROTOTYPE_DECLARES_ONLY et les deux liaisons', () => {
  const [proto] = explainInstruction(translated('Déclare le prototype d’une fonction nommée f qui retourne un int.'));
  assert.equal(proto.code, 'PROTOTYPE_DECLARES_ONLY');
  assert.match(proto.message, /déclare la signature sans écrire le corps/u);
  assert.match(proto.message, /ne vérifie pas qu’une définition correspondante existe/u);
  const [ext] = explainInstruction(translated('Déclare la variable externe de type int nommée v.'));
  assert.equal(ext.code, 'EXTERNAL_LINKAGE');
  assert.match(ext.message, /définie ailleurs, sans la créer ici/u);
  assert.match(ext.message, /exactement une définition/u);
  const [sta] = explainInstruction(translated('Déclare la variable interne de type int nommée v.'));
  assert.equal(sta.code, 'INTERNAL_LINKAGE');
  assert.match(sta.message, /réserve ce nom à ce fichier/u);
  assert.match(sta.message, /C-A ne vérifie aucune portée/u);
  // An internal prototype carries both facts.
  const both = explainInstruction(translated('Déclare le prototype d’une fonction interne nommée f qui retourne un int.'));
  assert.deepEqual(both.map(entry => entry.code), ['PROTOTYPE_DECLARES_ONLY', 'INTERNAL_LINKAGE']);
});

test('aucune information de module sur les instructions voisines', () => {
  for (const source of ['Inclue la bibliothèque stdio.h.', 'Déclare un entier nommé x.',
    'Crée une fonction nommée f qui retourne un int.', 'Déclare une variable de type int nommée x.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['LOCAL_HEADER_SEARCH', 'GUARD_PREVENTS_DOUBLE_INCLUSION', 'GUARD_NOT_EVALUATED',
      'PROTOTYPE_DECLARES_ONLY', 'EXTERNAL_LINKAGE', 'INTERNAL_LINKAGE']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 8. Hors périmètre
// ---------------------------------------------------------------------------

test('aucune macro, aucun typedef, aucune compilation pilotée', () => {
  for (const source of ['Définis la constante TAILLE à 10.', 'Déclare un type nommé Entier.',
    'Compile le fichier calcul.c.', 'Ajoute le fichier calcul.c au projet.',
    'Ouvre une compilation conditionnelle si DEBUG.']) {
    assert.equal(translate(source).status, 'rejected', source);
  }
});

test('aucune vérification de projet, de définition ni d’unicité', () => {
  // Nothing is resolved across files: a prototype without definition, an
  // extern without definition, and a duplicate guard name are all translated.
  assert.equal(translated('Déclare le prototype d’une fonction nommée jamaisDefinie qui retourne un int.').fragments[0].code,
    'int jamaisDefinie(void);\n');
  assert.equal(translated('Déclare la variable externe de type int nommée jamaisDefinie.').fragments[0].code,
    'extern int jamaisDefinie;\n');
  assert.equal(translated('Ouvre la protection d’en-tête nommée H.').fragments[0].code, '#ifndef H\n#define H\n');
});

// ---------------------------------------------------------------------------
// 9. En-tête complet, document final exact
// ---------------------------------------------------------------------------

test('un en-tête complet, de la garde au prototype', () => {
  let document = applied('\n', 'Ouvre la protection d’en-tête nommée CALCUL_H.', 0);
  document += '\n';
  let at = document.length - 1;
  document = applied(document, 'Déclare le prototype d’une fonction nommée somme qui retourne un int et prend un int nommé a.', at);
  document += '\n';
  at = document.length - 1;
  document = applied(document, 'Déclare la variable externe de type int nommée total.', at);
  document += '\n';
  at = document.length - 1;
  document = applied(document, 'Ferme la protection d’en-tête.', at);
  assert.equal(document, '// Ouvre la protection d’en-tête nommée CALCUL_H.\n#ifndef CALCUL_H\n#define CALCUL_H\n\n'
    + '// Déclare le prototype d’une fonction nommée somme qui retourne un int et prend un int nommé a.\nint somme(int a);\n\n'
    + '// Déclare la variable externe de type int nommée total.\nextern int total;\n\n'
    + '// Ferme la protection d’en-tête.\n#endif\n\n');
});

// ---------------------------------------------------------------------------
// 10. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
  ['Inclue la bibliothèque stdlib.h.', '#include <stdlib.h>\n'],
  ['Crée une fonction nommée f qui retourne un int.', 'int f(void) {\n    \n}\n'],
  ['Retourne la valeur 0.', 'return 0;\n'],
  ['Appelle f avec "1".', 'f(1);\n'],
  ['Déclare un fichier nommé f.', 'FILE *f;\n'],
  ['Déclare une structure nommée Point.', 'struct Point {\n    \n};\n'],
  ['Déclare un entier nommé x.', 'int x;\n'],
]) {
  test(`non-régression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
