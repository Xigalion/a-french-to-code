import { test } from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';

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
function applied(text, source, cursorOffset) {
  const translation = translated(source);
  const result = planPlacement({ document: { id: 'd', revision: 1, text }, cursorOffset, translation });
  assert.equal(result.status, 'planned', `${source} aurait dû être plaçable : `
    + (result.status === 'rejected' ? result.diagnostics[0].code : ''));
  const [edit] = result.plan.edits;
  return text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
}

// ---------------------------------------------------------------------------
// 1. Les six formulations et leur sortie C exacte
// ---------------------------------------------------------------------------

const EXACT = [
  ['Inclue la bibliothèque stdlib.h.', '#include <stdlib.h>\n', 'INCLUDE_STDLIB'],
  ['Affiche la taille du type int.', 'printf("%zu", sizeof(int));\n', 'SIZEOF_PRINT'],
  ['Affecte à n la taille du type double.', 'n = sizeof(double);\n', 'SIZEOF_ASSIGN'],
  ['Affecte à p l’allocation de 10 éléments de type int.', 'p = malloc(10 * sizeof(int));\n', 'ALLOCATE'],
  ['Affecte à q la réallocation de p pour 20 éléments de type int.', 'q = realloc(p, 20 * sizeof(int));\n', 'REALLOCATE'],
  ['Libère la mémoire pointée par p.', 'free(p);\n', 'FREE'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 21 sortie exacte : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 21 sortie exacte sans point final : ${source}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('le contrat gelé de l’inclusion n’a pas bougé', () => {
  // The lot 4 and lot 5 snapshots freeze this kind, this output and this
  // message. `stdlib.h` is therefore handled by its own branch, before the
  // historical rule is reached, and that rule is byte-identical.
  const stdio = translated('Inclue la bibliothèque stdio.h.');
  assert.equal(stdio.instruction.kind, 'INCLUDE_STDIO');
  assert.deepEqual(stdio.instruction.parameters, {});
  assert.equal(stdio.fragments[0].code, '#include <stdio.h>\n');
  const refusal = refused('Inclue la bibliothèque string.h.', 'UNSUPPORTED_HEADER');
  assert.equal(refusal.message, 'Seul l’en-tête stdio.h, écrit exactement ainsi, est pris en charge.');
  // Known inconsistency, kept on purpose and documented: the frozen message
  // under-states what is supported now that stdlib.h is accepted.
  for (const header of ['stddef.h', 'string.h', 'math.h', 'stdlib']) {
    refused(`Inclue la bibliothèque ${header}.`, 'UNSUPPORTED_HEADER');
  }
});

test('« du type » et « de type » sont les mêmes mots', () => {
  assert.equal(translated('Affiche la taille du type int.').fragments[0].code, 'printf("%zu", sizeof(int));\n');
  assert.equal(translated('Affiche la taille de type int.').fragments[0].code, 'printf("%zu", sizeof(int));\n');
});

test('la casse est libre, les accents sont exigés', () => {
  assert.equal(translated('LIBÈRE LA MÉMOIRE POINTÉE PAR p.').fragments[0].code, 'free(p);\n');
  refused('Libere la memoire pointee par p.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 2. Types mesurés et nombres d’éléments
// ---------------------------------------------------------------------------

for (const [type, spelling] of [['int', 'int'], ['unsigned int', 'unsigned int'], ['float', 'float'],
  ['double', 'double'], ['char', 'char'], ['structure Point', 'struct Point']]) {
  test(`type mesuré : ${type}`, () => {
    assert.equal(translated(`Affiche la taille du type ${type}.`).fragments[0].code,
      `printf("%zu", sizeof(${spelling}));\n`);
    assert.equal(translated(`Affecte à p l’allocation de 4 éléments de type ${type}.`).fragments[0].code,
      `p = malloc(4 * sizeof(${spelling}));\n`);
  });
}
for (const type of ['long', 'short', 'unsigned char', 'void', 'long double']) {
  test(`type mesuré hors catalogue : ${type}`, () => {
    refused(`Affiche la taille du type ${type}.`, 'UNSUPPORTED_NUMERIC_TYPE');
    refused(`Affecte à p l’allocation de 4 éléments de type ${type}.`, 'UNSUPPORTED_NUMERIC_TYPE');
  });
}
for (const [count, spelling] of [['1', '1'], ['10', '10'], ['0', '0'], ['n', 'n'], ['taille', 'taille']]) {
  test(`nombre d’éléments : ${count}`, () => {
    assert.equal(translated(`Affecte à p l’allocation de ${count} éléments de type int.`).fragments[0].code,
      `p = malloc(${spelling} * sizeof(int));\n`);
  });
}
test('le singulier est accepté comme le pluriel', () => {
  assert.equal(translated('Affecte à p l’allocation de 1 élément de type int.').fragments[0].code,
    'p = malloc(1 * sizeof(int));\n');
});
for (const count of ['-1', '1.5', '007', '0x10', '+2']) {
  test(`nombre d’éléments refusé : ${count}`, () => {
    refused(`Affecte à p l’allocation de ${count} éléments de type int.`, 'INVALID_INTEGER');
  });
}
test('le produit est écrit, jamais replié', () => {
  // The count and the element size stay visible and separate.
  const code = translated('Affecte à p l’allocation de 4 éléments de type int.').fragments[0].code;
  assert.equal(code, 'p = malloc(4 * sizeof(int));\n');
  assert.ok(code.includes('4 * sizeof'), code);
  assert.ok(!code.includes('16'), code);
});

test('diagnostics des enveloppes', () => {
  refused('Affiche la taille du type.', 'MISSING_NUMERIC_TYPE');
  refused('Affiche la taille.', 'INCOMPLETE_INSTRUCTION');
  // The optional final period attaches to « structure », so nothing follows.
  refused('Affiche la taille du type structure.', 'INCOMPLETE_INSTRUCTION');
  refused('Affiche la taille du type structure 1Point.', 'INVALID_IDENTIFIER');
  refused('Affiche la taille du type int encore.', 'UNEXPECTED_TEXT');
  refused('Affecte à n la taille du type int encore.', 'UNEXPECTED_TEXT');
  refused('Affecte à 1n la taille du type int.', 'INVALID_IDENTIFIER');
  refused('Affecte à p l’allocation de 10 éléments.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte à p l’allocation de 10 objets de type int.', 'UNKNOWN_FORMULATION');
  refused('Affecte à p l’allocation 10 éléments de type int.', 'UNKNOWN_FORMULATION');
  refused('Affecte à p l’allocation de.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte à q la réallocation de p pour 20 éléments.', 'INCOMPLETE_INSTRUCTION');
  refused('Affecte à q la réallocation de p de 20 éléments de type int.', 'UNKNOWN_FORMULATION');
  refused('Affecte à q la réallocation pour 20 éléments de type int.', 'UNKNOWN_FORMULATION');
  refused('Libère la mémoire de p.', 'UNKNOWN_FORMULATION');
  refused('Libère la mémoire pointée par.', 'INCOMPLETE_INSTRUCTION');
  refused('Libère la mémoire pointée par p encore.', 'UNEXPECTED_TEXT');
  refused('Libère p.', 'UNKNOWN_FORMULATION');
});

// ---------------------------------------------------------------------------
// 3. Informations pédagogiques
// ---------------------------------------------------------------------------

test('SIZEOF_IS_BYTES dit l’unité, le type et le format', () => {
  const source = 'Affiche la taille du type structure Point.';
  const [entry] = explainInstruction(translated(source));
  assert.equal(entry.code, 'SIZEOF_IS_BYTES');
  assert.equal(entry.severity, 'information');
  assert.equal(source.slice(entry.range.start, entry.range.end), 'structure Point');
  assert.match(entry.message, /une taille en octets, de type size_t/u);
  assert.match(entry.message, /%zu/u);
  assert.match(entry.message, /pas un nombre d’éléments/u);
  assert.match(entry.message, /pas la somme des tailles des champs/u);
});

test('l’allocation porte les trois faits qui comptent', () => {
  const source = 'Affecte à p l’allocation de 10 éléments de type int.';
  const entries = explainInstruction(translated(source));
  assert.deepEqual(entries.map(entry => entry.code),
    ['ALLOCATION_CAN_FAIL', 'SIZEOF_IS_BYTES', 'ALLOCATION_NOT_INITIALIZED']);
  assert.equal(source.slice(entries[0].range.start, entries[0].range.end), 'p');
  assert.match(entries[0].message, /malloc renvoie NULL si l’allocation échoue/u);
  // It names the sentence the student should write, without writing it.
  assert.match(entries[0].message, /C-A n’ajoute aucun test/u);
  assert.match(entries[0].message, /p == NULL/u);
  assert.match(entries[2].message, /ne donne aucune valeur à la mémoire obtenue/u);
  assert.match(entries[2].message, /comportement indéfini/u);
  for (const entry of entries) assert.equal(entry.severity, 'information');
});

test('REALLOC_MAY_MOVE énonce le déplacement et la perte sur échec', () => {
  const entries = explainInstruction(translated('Affecte à q la réallocation de p pour 20 éléments de type int.'));
  assert.deepEqual(entries.map(entry => entry.code), ['ALLOCATION_CAN_FAIL', 'SIZEOF_IS_BYTES', 'REALLOC_MAY_MOVE']);
  const move = entries[2];
  assert.match(move.message, /peut déplacer le bloc/u);
  assert.match(move.message, /l’ancienne ne doit plus être utilisée/u);
  assert.match(move.message, /ferait perdre ce bloc/u);
  // The reallocation carries no « not initialised » claim: realloc preserves
  // the existing content, and saying otherwise would be false.
  assert.ok(!entries.some(entry => entry.code === 'ALLOCATION_NOT_INITIALIZED'));
});

test('FREE_ONCE n’annonce aucun suivi de durée de vie', () => {
  const [entry] = explainInstruction(translated('Libère la mémoire pointée par p.'));
  assert.equal(entry.code, 'FREE_ONCE');
  assert.match(entry.message, /une fois et une seule/u);
  assert.match(entry.message, /le libérer deux fois ou l’utiliser encore/u);
  assert.match(entry.message, /C-A ne suit aucune durée de vie/u);
});

test('HEADER_DECLARES_ONLY ne promet rien de plus que des déclarations', () => {
  const [entry] = explainInstruction(translated('Inclue la bibliothèque stdlib.h.'));
  assert.equal(entry.code, 'HEADER_DECLARES_ONLY');
  assert.match(entry.message, /déclare malloc, realloc, free et NULL/u);
  assert.match(entry.message, /aucune allocation n’a lieu ici/u);
  assert.match(entry.message, /n’ajoute jamais un en-tête de lui-même/u);
  // The historical include carries no information, and still does not.
  assert.deepEqual(explainInstruction(translated('Inclue la bibliothèque stdio.h.')), []);
});

test('aucune information mémoire sur les instructions voisines', () => {
  for (const source of ['Déclare un entier nommé x.', 'Déclare un pointeur de type int nommé p.',
    'Affiche la valeur pointée par p.', 'Déclare une structure nommée Point.', 'Affiche la valeur de x.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['SIZEOF_IS_BYTES', 'ALLOCATION_CAN_FAIL', 'ALLOCATION_NOT_INITIALIZED',
      'REALLOC_MAY_MOVE', 'FREE_ONCE', 'HEADER_DECLARES_ONLY']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 4. Hors périmètre, et ce qui n’est pas garanti
// ---------------------------------------------------------------------------

test('aucune autre fonction d’allocation, aucun calloc, aucun cast implicite', () => {
  refused('Affecte à p l’allocation nulle de 10 éléments de type int.', 'UNKNOWN_FORMULATION');
  // `calloc` is not a C17 keyword, so the historical call envelope reads it as
  // an ordinary function name and produces `calloc(10, 4);`. C-A knows nothing
  // about it, adds no header and makes no claim: a documented limit, not a
  // refusal, exactly as for any other name it cannot resolve.
  assert.equal(translated('Appelle calloc avec "10" et "4".').fragments[0].code, 'calloc(10, 4);\n');
  // No cast is ever added to the result of malloc: C17 does not need one.
  assert.ok(!translated('Affecte à p l’allocation de 4 éléments de type int.').fragments[0].code.includes('(int *)'));
});

test('aucune vérification de durée de vie ni de cohérence', () => {
  // Freeing something never allocated is translated and placed.
  assert.equal(translated('Libère la mémoire pointée par inconnu.').fragments[0].code, 'free(inconnu);\n');
  // Allocating zero elements is legal C17 with an implementation-defined
  // result, and is translated as written.
  assert.equal(translated('Affecte à p l’allocation de 0 éléments de type int.').fragments[0].code,
    'p = malloc(0 * sizeof(int));\n');
  // The count may be any name: nothing checks that it is a positive integer.
  assert.equal(translated('Affecte à p l’allocation de inconnu éléments de type int.').fragments[0].code,
    'p = malloc(inconnu * sizeof(int));\n');
});

test('NULL s’écrit comme un nom ordinaire, ce que la documentation dit', () => {
  // D1 defers NULL, and no formulation introduces it. It is not a C17
  // keyword, so C-A reads it as a name: the comparison works, and nothing
  // checks that stdlib.h was included.
  assert.equal(translated('Crée un bloc si "p == NULL".').fragments[0].code, 'if (p == NULL) {\n    \n}\n');
});

// ---------------------------------------------------------------------------
// 5. Placement et séquence complète
// ---------------------------------------------------------------------------

test('cycle complet : document final exact', () => {
  let document = applied('\n', 'Inclue la bibliothèque stdlib.h.', 0);
  document += '\n';
  let at = document.length - 1;
  document = applied(document, 'Crée la fonction principale.', at);
  at = document.indexOf('\n    \n') + 1 + 4;
  for (const source of [
    'Déclare un pointeur de type int nommé p.',
    'Affecte à p l’allocation de 4 éléments de type int.',
    'Affecte la valeur 7 à l’élément "0" de p.',
    'Affiche l’élément "0" de p.',
    'Libère la mémoire pointée par p.',
  ]) {
    document = applied(document, source, at);
    at = document.indexOf('\n    \n') + 1 + 4;
  }
  assert.equal(document, '// Inclue la bibliothèque stdlib.h.\n#include <stdlib.h>\n\n'
    + '// Crée la fonction principale.\nint main(void) {\n'
    + '    // Déclare un pointeur de type int nommé p.\n    int *p;\n'
    + '    // Affecte à p l’allocation de 4 éléments de type int.\n    p = malloc(4 * sizeof(int));\n'
    + '    // Affecte la valeur 7 à l’élément "0" de p.\n    p[0] = 7;\n'
    + '    // Affiche l’élément "0" de p.\n    printf("%d", p[0]);\n'
    + '    // Libère la mémoire pointée par p.\n    free(p);\n'
    + '    \n}\n');
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
  test(`placement d’une allocation ${label}`, () => {
    const result = applied(text, 'Affecte à p l’allocation de 4 éléments de type int.', offset);
    assert.ok(result.includes('p = malloc(4 * sizeof(int));'), result);
    if (text.includes('\r\n')) assert.ok(!/[^\r]\n/u.test(result), result);
  });
}

// ---------------------------------------------------------------------------
// 6. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Inclue la bibliothèque stdio.h.', '#include <stdio.h>\n'],
  ['Affiche la valeur de x.', 'printf("%d", x);\n'],
  ['Affiche la chaîne s.', 'printf("%s", s);\n'],
  ['Affiche le champ x de p.', 'printf("%d", p.x);\n'],
  ['Affiche la valeur pointée par p.', 'printf("%d", *p);\n'],
  ['Déclare un pointeur de type int nommé p.', 'int *p;\n'],
  ['Déclare une structure nommée Point.', 'struct Point {\n    \n};\n'],
  ['Crée un aiguillage sur "jour".', 'switch (jour) {\n    \n}\n'],
]) {
  test(`non-régression : ${source}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
