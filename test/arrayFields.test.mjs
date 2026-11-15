import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';

// Lot 27 — champs de structure de type tableau. Décision 2 du fondateur du
// 15 novembre 2026, et correction de rang 2 de l'évaluation du modèle 1 : la
// seule retouche manuelle que l'exercice intégrateur avait exigée.

function translated(source) {
  const result = translate(source);
  assert.equal(result.status, 'translated', source + ' : ' + JSON.stringify(result));
  assert.deepEqual(result, translate(source), 'traduction non déterministe');
  assert.deepEqual(result, JSON.parse(JSON.stringify(result)));
  return result;
}
function refused(source, code, range) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', source + ' : ' + JSON.stringify(result));
  assert.ok(!('fragments' in result), 'aucun fragment partiel');
  assert.equal(result.diagnostics[0].code, code, source + ' : ' + JSON.stringify(result.diagnostics[0]));
  assert.equal(result.diagnostics[0].category, 'understanding');
  if (range) assert.deepEqual(result.diagnostics[0].range, range);
  return result.diagnostics[0];
}

// ---------------------------------------------------------------------------
// 1. Rendu exact
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Ajoute un champ de type char nommé nom de dimension 32.', 'char nom[32];\n'],
  ['Ajoute un champ de type int nommé notes de dimension 10.', 'int notes[10];\n'],
  ['Ajoute un champ de type double nommé mesures de dimension 1.', 'double mesures[1];\n'],
  ['Ajoute un champ de type unsigned int nommé compteurs de dimension 7.', 'unsigned int compteurs[7];\n'],
  ['Ajoute un champ de type float nommé poids de dimension 256.', 'float poids[256];\n'],
  ['Ajoute un champ de type structure Point nommé sommets de dimension 4.', 'struct Point sommets[4];\n'],
]) {
  test(`lot 27 rendu : ${source}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, 'STRUCT_FIELD');
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].comment, '// ' + source);
    // The sentence is preserved exactly, as everywhere else.
    assert.equal(result.fragments[0].text, '// ' + source + '\n' + code);
  });
}

test('lot 27 : un champ sans dimension est inchangé, structure comprise', () => {
  // The structured shape of a scalar field must be byte-for-byte what it was
  // before the lot: no `dimension` key at all, not a key set to undefined.
  const result = translated('Ajoute un champ de type int nommé x.');
  assert.equal(result.fragments[0].code, 'int x;\n');
  assert.deepEqual(Object.keys(result.instruction.parameters).sort(), ['name', 'nameRange', 'pointer', 'type']);
  assert.equal('dimension' in result.instruction.parameters, false);
});

test('lot 27 : la dimension est portée par le déclarateur, pas par le type', () => {
  const parameters = translated('Ajoute un champ de type char nommé nom de dimension 32.').instruction.parameters;
  assert.deepEqual(parameters.type, { kind: 'scalar', type: 'char' });
  assert.equal(parameters.dimension, '32');
  assert.equal(parameters.pointer, false);
});

// ---------------------------------------------------------------------------
// 2. Grammaire de la dimension — celle du lot 15, sans indulgence nouvelle
// ---------------------------------------------------------------------------

for (const [bad, code] of [
  ['Ajoute un champ de type int nommé t de dimension 0.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension -1.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension 01.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension 3.5.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension n.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension trois.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension 0x10.', 'INVALID_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension.', 'MISSING_ARRAY_DIMENSION'],
  ['Ajoute un champ de type int nommé t de dimension 3 et plus.', 'UNEXPECTED_TEXT'],
]) {
  test(`lot 27 refus : ${bad}`, () => { refused(bad, code); });
}

test('lot 27 : « de » suivi d’autre chose que « dimension » est refusé', () => {
  // Le diagnostic porte sur le mot fautif lui-même, ce qui est plus précis
  // qu'un « il manque la dimension » : la dimension ne manque pas, le mot
  // « taille » n'appartient pas au catalogue.
  const diagnostic = refused('Ajoute un champ de type int nommé t de taille 3.', 'UNKNOWN_FORMULATION');
  const source = 'Ajoute un champ de type int nommé t de taille 3.';
  assert.deepEqual(diagnostic.range, { start: source.indexOf('taille'), end: source.indexOf('taille') + 6 });
});

test('lot 27 : la dimension nulle et la dimension négative ont la portée du nombre', () => {
  const zero = refused('Ajoute un champ de type int nommé t de dimension 0.', 'INVALID_ARRAY_DIMENSION');
  const source = 'Ajoute un champ de type int nommé t de dimension 0.';
  assert.deepEqual(zero.range, { start: source.indexOf('0.'), end: source.indexOf('0.') + 1 });
});

// ---------------------------------------------------------------------------
// 3. Pointeur et tableau : combinaison refusée, pas rendue en silence
// ---------------------------------------------------------------------------

test('lot 27 : un champ pointeur avec dimension est refusé', () => {
  // `int *t[10]` is an array of pointers, a construct no other formulation
  // produces. It is refused rather than rendered without a word.
  const diagnostic = refused('Ajoute un champ pointeur de type int nommé donnees de dimension 10.',
    'UNSUPPORTED_POINTER_ARRAY_FIELD');
  assert.match(diagnostic.message, /ne peut pas être à la fois un pointeur et un tableau/u);
  // Diagnostic, not correction: no sentence to copy.
  assert.ok(!/essayez|écrivez|remplacez|supprimez/iu.test(diagnostic.message));
});

test('lot 27 : un champ pointeur sans dimension reste inchangé', () => {
  assert.equal(translated('Ajoute un champ pointeur de type int nommé donnees.').fragments[0].code, 'int *donnees;\n');
  assert.equal(translated('Ajoute un champ pointeur de type structure Noeud nommé suivant.').fragments[0].code,
    'struct Noeud *suivant;\n');
});

// ---------------------------------------------------------------------------
// 4. Informations pédagogiques : passives, et jamais des avertissements
// ---------------------------------------------------------------------------

test('lot 27 : un champ tableau émet deux informations, trois pour char', () => {
  const ints = explainInstruction(translated('Ajoute un champ de type int nommé notes de dimension 10.'));
  assert.deepEqual(ints.map(item => item.code), ['ARRAY_NOT_ASSIGNABLE', 'STRUCT_ARRAY_LAYOUT']);
  const chars = explainInstruction(translated('Ajoute un champ de type char nommé nom de dimension 32.'));
  assert.deepEqual(chars.map(item => item.code), ['ARRAY_NOT_ASSIGNABLE', 'STRUCT_ARRAY_LAYOUT', 'CHAR_ARRAY_NOT_STRING']);
  for (const item of [...ints, ...chars]) assert.equal(item.severity, 'information');
});

test('lot 27 : les informations disent la dimension et la non-initialisation', () => {
  const items = explainInstruction(translated('Ajoute un champ de type char nommé nom de dimension 32.'));
  assert.match(items[1].message, /dimension 32 est fixée ici/u);
  assert.match(items[1].message, /aucun élément n’est initialisé/u);
  assert.match(items[0].message, /ne s’affecte pas globalement/u);
  assert.match(items[2].message, /pas une chaîne/u);
});

test('lot 27 : l’information sur la dimension porte sur le nombre', () => {
  const source = 'Ajoute un champ de type int nommé notes de dimension 10.';
  const items = explainInstruction(translated(source));
  assert.deepEqual(items[1].range, { start: source.indexOf('10'), end: source.indexOf('10') + 2 });
});

test('lot 27 : un champ scalaire n’émet aucune information nouvelle', () => {
  assert.deepEqual(explainInstruction(translated('Ajoute un champ de type int nommé x.')), []);
  assert.deepEqual(explainInstruction(translated('Ajoute un champ de type char nommé initiale.')), []);
});

// ---------------------------------------------------------------------------
// 5. Placement : un champ reste un champ
// ---------------------------------------------------------------------------

function input(text, source, cursorOffset = text.length) {
  return { document: { id: 'f.c', revision: 0, text }, cursorOffset, translation: translated(source) };
}

test('lot 27 : un champ tableau se place dans une structure, et nulle part ailleurs', () => {
  const source = 'Ajoute un champ de type char nommé nom de dimension 32.';
  const planned = planPlacement(input('struct Eleve {\n', source));
  assert.equal(planned.status, 'planned', JSON.stringify(planned));
  assert.ok(planned.plan.structTarget, 'la structure englobante est capturée comme pour tout champ');
  for (const [text, code] of [
    ['', 'FIELD_OUTSIDE_STRUCT'],
    ['int main(void) {\n', 'FIELD_OUTSIDE_STRUCT'],
    ['struct Eleve {\n};\n', 'FIELD_OUTSIDE_STRUCT'],
  ]) {
    const result = planPlacement(input(text, source));
    assert.equal(result.status, 'rejected', text);
    assert.equal(result.diagnostics[0].code, code, text);
  }
});

test('lot 27 : le document produit est exactement celui attendu', () => {
  const text = 'struct Eleve {\n    \n};\n';
  const source = 'Ajoute un champ de type char nommé nom de dimension 32.';
  const result = planPlacement(input(text, source, text.indexOf('    \n') + 4));
  assert.equal(result.status, 'planned', JSON.stringify(result));
  const edit = result.plan.edits[0];
  const after = text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
  assert.equal(after, 'struct Eleve {\n    // ' + source + '\n    char nom[32];\n    \n};\n');
});

// ---------------------------------------------------------------------------
// 6. La structure de l'exercice intégrateur, sans retouche manuelle
// ---------------------------------------------------------------------------

test('lot 27 : la structure Eleve de l’exercice s’écrit entièrement avec C-A', () => {
  // This is the point of the lot: `char nom[32];` was the ONE line the
  // integrator exercise had to patch by hand. It no longer is.
  let text = 'struct Eleve {\n    \n};\n';
  const sentences = [
    'Ajoute un champ de type char nommé nom de dimension 32.',
    'Ajoute un champ de type int nommé note.',
    'Ajoute un champ de type char nommé initiale.',
    'Ajoute un champ pointeur de type structure Eleve nommé suivant.',
  ];
  for (const source of sentences) {
    const cursor = text.lastIndexOf('    \n') + 4;
    const result = planPlacement(input(text, source, cursor));
    assert.equal(result.status, 'planned', source + ' : ' + JSON.stringify(result));
    const edit = result.plan.edits[0];
    text = text.slice(0, edit.range.start) + edit.newText + text.slice(edit.range.end);
  }
  assert.ok(text.includes('    char nom[32];'), text);
  assert.ok(text.includes('    int note;'), text);
  assert.ok(text.includes('    char initiale;'), text);
  assert.ok(text.includes('    struct Eleve *suivant;'), text);
  // Nothing invented: no initialiser, no padding, no comment but the sentences.
  assert.equal(text.includes('='), false);
  for (const source of sentences) assert.ok(text.includes('// ' + source), source);
});

// ---------------------------------------------------------------------------
// 7. Ce que le lot ne prétend pas faire
// ---------------------------------------------------------------------------

test('lot 27 : aucune vérification de borne, et aucune dimension retenue', () => {
  // The dimension is written once and never remembered: an index far beyond
  // it is still accepted, exactly as for a lot 15 array. Stating this is the
  // point — a valid form is not a safe program.
  assert.equal(translate('Ajoute un champ de type int nommé notes de dimension 10.').status, 'translated');
  assert.equal(translate('Affecte la valeur 1 à l’élément "999" de notes.').status, 'translated');
  const items = explainInstruction(translated('Ajoute un champ de type int nommé notes de dimension 10.'));
  assert.match(items[1].message, /ne la retient pas pour vérifier un indice plus tard/u);
});

test('lot 27 : la dimension déduite et la liste d’initialisation restent refusées', () => {
  refused('Ajoute un champ de type char nommé nom de dimension.', 'MISSING_ARRAY_DIMENSION');
  refused('Ajoute un champ de type char nommé nom avec le texte "x".', 'UNEXPECTED_TEXT');
  refused('Ajoute un champ de type int nommé t de dimension 3 avec les valeurs 1, 2, 3.', 'UNEXPECTED_TEXT');
});

test('lot 27 : pas de tableau à plusieurs dimensions', () => {
  refused('Ajoute un champ de type int nommé grille de dimension 3 de dimension 4.', 'UNEXPECTED_TEXT');
});
