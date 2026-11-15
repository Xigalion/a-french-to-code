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
function refused(source, code) {
  const result = translate(source);
  assert.equal(result.status, 'rejected', `${source} aurait dû être refusée`);
  assert.equal(result.diagnostics[0].code, code, source);
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
// 1. Les trois manques syntaxiques comblés
// ---------------------------------------------------------------------------

const EXACT = [
  ['Déclare le synonyme Noeud pour la structure Noeud.', 'typedef struct Noeud Noeud;\n', 'TYPE_ALIAS'],
  ['Ajoute un champ pointeur de type structure Noeud nommé suivant.', 'struct Noeud *suivant;\n', 'STRUCT_FIELD'],
  ['Ajoute un champ pointeur de type int nommé donnees.', 'int *donnees;\n', 'STRUCT_FIELD'],
  ['Déclare un tableau de type structure Point nommé t de dimension 10.', 'struct Point t[10];\n', 'ARRAY_DECL'],
];
for (const [source, code, kind] of EXACT) {
  test(`lot 24 sortie exacte : ${source.slice(0, 50)}`, () => {
    const result = translated(source);
    assert.equal(result.instruction.kind, kind);
    assert.equal(result.fragments[0].code, code);
    assert.equal(result.fragments[0].text, `// ${source}\n${code}`);
    assert.equal(result.fragments[0].cursor, undefined);
  });
  test(`lot 24 sortie exacte sans point final : ${source.slice(0, 50)}`, () => {
    assert.equal(translated(source.slice(0, -1)).fragments[0].code, code);
  });
}

test('le champ pointeur garde la convention D2 du lot 17', () => {
  for (const [type, spelling] of [['int', 'int'], ['char', 'char'], ['double', 'double'],
    ['unsigned int', 'unsigned int'], ['structure Point', 'struct Point']]) {
    const code = translated(`Ajoute un champ pointeur de type ${type} nommé p.`).fragments[0].code;
    assert.equal(code, `${spelling} *p;\n`);
    assert.ok(!code.includes('* p'), code);
  }
});

test('le champ non pointeur du lot 20 est inchangé', () => {
  assert.equal(translated('Ajoute un champ de type int nommé valeur.').fragments[0].code, 'int valeur;\n');
  assert.equal(translated('Ajoute un champ de type structure Point nommé origine.').fragments[0].code,
    'struct Point origine;\n');
});

test('les tableaux scalaires et de chaînes du lot 15 et du lot 16 sont inchangés', () => {
  assert.equal(translated('Déclare un tableau de type int nommé u de dimension 3.').fragments[0].code, 'int u[3];\n');
  assert.equal(translated('Crée un tableau de type char nommé s de dimension 6 avec le texte "hello".').fragments[0].code,
    'char s[6] = "hello";\n');
  // A text still initialises only a char array, never a struct array.
  refused('Crée un tableau de type structure Point nommé t de dimension 2 avec le texte "a".', 'STRING_REQUIRES_CHAR');
});

test('diagnostics des trois formes nouvelles', () => {
  refused('Déclare le synonyme Noeud pour la structure.', 'INCOMPLETE_INSTRUCTION');
  refused('Déclare le synonyme Noeud pour la structure 1N.', 'INVALID_IDENTIFIER');
  refused('Déclare le synonyme 1N pour la structure Noeud.', 'INVALID_IDENTIFIER');
  refused('Déclare le synonyme Noeud de la structure Noeud.', 'UNKNOWN_FORMULATION');
  refused('Déclare le synonyme Noeud pour la structure Noeud encore.', 'UNEXPECTED_TEXT');
  refused('Déclare le synonyme.', 'INCOMPLETE_INSTRUCTION');
  refused('Ajoute un champ pointeur de type long nommé p.', 'UNSUPPORTED_NUMERIC_TYPE');
  refused('Ajoute un champ pointeur de type nommé p.', 'MISSING_NUMERIC_TYPE');
  refused('Ajoute un champ pointeur de type structure nommé p.', 'INVALID_IDENTIFIER');
  refused('Déclare un tableau de type structure nommé t de dimension 3.', 'INVALID_IDENTIFIER');
  refused('Déclare un tableau de type structure Point nommé t de dimension 0.', 'INVALID_ARRAY_DIMENSION');
  refused('Déclare un tableau de type structure Point nommé t.', 'MISSING_ARRAY_DIMENSION');
});

// ---------------------------------------------------------------------------
// 2. Informations pédagogiques
// ---------------------------------------------------------------------------

test('TYPEDEF_IS_AN_ALIAS dit alias, pas type nouveau', () => {
  const source = 'Déclare le synonyme Noeud pour la structure Noeud.';
  const [entry] = explainInstruction(translated(source));
  assert.equal(entry.code, 'TYPEDEF_IS_AN_ALIAS');
  assert.equal(entry.severity, 'information');
  assert.match(entry.message, /second nom au même type/u);
  assert.match(entry.message, /il n’en crée pas un nouveau/u);
  // It names the reason a linked structure needs it.
  assert.match(entry.message, /avant que la structure soit définie/u);
  assert.match(entry.message, /ne vérifie pas que cette structure existe/u);
});

test('POINTER_FIELD_OWNS_NOTHING ne porte que sur un champ pointeur', () => {
  const [entry] = explainInstruction(translated('Ajoute un champ pointeur de type structure Noeud nommé suivant.'));
  assert.equal(entry.code, 'POINTER_FIELD_OWNS_NOTHING');
  assert.match(entry.message, /contient une adresse, pas un objet/u);
  assert.match(entry.message, /ne possède pas la mémoire visée/u);
  assert.match(entry.message, /sa taille ne compte que le pointeur/u);
  assert.match(entry.message, /rien n’est alloué ici/u);
  // A plain field carries none of it.
  assert.deepEqual(explainInstruction(translated('Ajoute un champ de type int nommé v.')), []);
});

test('STRUCT_ARRAY_LAYOUT ne porte que sur un tableau de structures', () => {
  const [entry] = explainInstruction(translated('Déclare un tableau de type structure Point nommé t de dimension 10.'));
  assert.equal(entry.code, 'STRUCT_ARRAY_LAYOUT');
  assert.match(entry.message, /contient les objets eux-mêmes/u);
  assert.match(entry.message, /son remplissage éventuel/u);
  assert.match(entry.message, /aucun des deux indices n’est vérifié/u);
  // A scalar array keeps the lot 15 informations instead.
  const scalar = explainInstruction(translated('Déclare un tableau de type int nommé u de dimension 3.'))
    .map(entry => entry.code);
  assert.deepEqual(scalar, ['ARRAY_NOT_ASSIGNABLE']);
  assert.ok(!scalar.includes('STRUCT_ARRAY_LAYOUT'));
});

test('aucune information du lot 24 sur les instructions voisines', () => {
  for (const source of ['Déclare une structure nommée Point.', 'Déclare un entier nommé x.',
    'Déclare un pointeur de type int nommé p.', 'Affiche le champ x de p.']) {
    const codes = explainInstruction(translated(source)).map(entry => entry.code);
    for (const forbidden of ['TYPEDEF_IS_AN_ALIAS', 'POINTER_FIELD_OWNS_NOTHING', 'STRUCT_ARRAY_LAYOUT']) {
      assert.ok(!codes.includes(forbidden), `${source} ne doit pas porter ${forbidden}`);
    }
  }
});

// ---------------------------------------------------------------------------
// 3. Ce que le domaine 8 compose avec l’existant
// ---------------------------------------------------------------------------

test('une liste chaînée s’écrit entièrement avec les formulations livrées', () => {
  // The whole declaration of a linked list, with nothing added by this lot
  // beyond the three forms above.
  let document = applied('\n', 'Déclare le synonyme Noeud pour la structure Noeud.', 0);
  document += '\n';
  document = applied(document, 'Déclare une structure nommée Noeud.', document.length - 1);
  let at = document.indexOf('\n    \n') + 1 + 4;
  for (const source of ['Ajoute un champ de type int nommé valeur.',
    'Ajoute un champ pointeur de type structure Noeud nommé suivant.']) {
    document = applied(document, source, at);
    at = document.indexOf('\n    \n') + 1 + 4;
  }
  assert.equal(document, '// Déclare le synonyme Noeud pour la structure Noeud.\ntypedef struct Noeud Noeud;\n\n'
    + '// Déclare une structure nommée Noeud.\nstruct Noeud {\n'
    + '    // Ajoute un champ de type int nommé valeur.\n    int valeur;\n'
    + '    // Ajoute un champ pointeur de type structure Noeud nommé suivant.\n    struct Noeud *suivant;\n'
    + '    \n};\n');
});

test('une recherche séquentielle se compose sans formulation nouvelle', () => {
  // Nothing in this test is new: the point is that the domain is reachable.
  for (const [source, code] of [
    ['Crée une fonction nommée chercher qui retourne un int et prend un int nommé cible.', 'int chercher(int cible) {\n    \n}\n'],
    ['Déclare un entier nommé i.', 'int i;\n'],
    ['Affecte la valeur 0 à i.', 'i = 0;\n'],
    ['Crée une boucle tant que "i < 10".', 'while (i < 10) {\n    \n}\n'],
    ['Crée un bloc si "t[i] == cible".', 'if (t[i] == cible) {\n    \n}\n'],
    ['Retourne le résultat numérique de "i".', 'return i;\n'],
    ['Affecte à i le résultat numérique de "i + 1".', 'i = (i + 1);\n'],
    ['Retourne la valeur -1.', 'return -1;\n'],
  ]) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});

test('un échange de deux éléments se compose, sans variable inventée', () => {
  // C-A never invents the temporary a swap needs: the student declares it.
  for (const [source, code] of [
    ['Déclare un entier nommé temporaire.', 'int temporaire;\n'],
    ['Affecte à temporaire le résultat numérique de "t[i]".', 'temporaire = t[i];\n'],
    ['Affecte à l’élément "i" de t le résultat numérique de "t[j]".', 't[i] = t[j];\n'],
    ['Affecte à l’élément "j" de t le résultat numérique de "temporaire".', 't[j] = temporaire;\n'],
  ]) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
  // And no formulation does it in one go.
  refused('Échange les éléments "i" et "j" de t.', 'UNKNOWN_FORMULATION');
  refused('Trie le tableau t.', 'UNKNOWN_FORMULATION');
  refused('Cherche la valeur 5 dans le tableau t.', 'UNKNOWN_FORMULATION');
});

test('un parcours de liste chaînée se compose avec les lots 17 et 20', () => {
  for (const [source, code] of [
    ['Déclare un pointeur de type structure Noeud nommé courant.', 'struct Noeud *courant;\n'],
    ['Affecte l’adresse de premier à courant.', 'courant = &premier;\n'],
    ['Crée une boucle tant que "courant != 0".', 'while (courant != 0) {\n    \n}\n'],
    ['Affiche le champ valeur pointée par courant.', 'printf("%d", courant->valeur);\n'],
    ['Affecte à courant le résultat numérique de "courant->suivant".', 'courant = courant->suivant;\n'],
  ]) {
    assert.equal(translated(source).fragments[0].code, code, source);
  }
});

test('un tableau de structures s’utilise avec les accès du lot 20', () => {
  assert.equal(translated('Affecte à n le résultat numérique de "t[i].x".').fragments[0].code, 'n = t[i].x;\n');
  assert.equal(translated('Crée un bloc si "t[i].x > t[j].x".').fragments[0].code,
    'if (t[i].x > t[j].x) {\n    \n}\n');
});

// ---------------------------------------------------------------------------
// 4. Hors périmètre
// ---------------------------------------------------------------------------

test('aucun synonyme hors structure, aucun type fonction', () => {
  refused('Déclare le synonyme Entier pour le type int.', 'UNKNOWN_FORMULATION');
  refused('Déclare le synonyme Liste pour le pointeur de structure Noeud.', 'UNKNOWN_FORMULATION');
  refused('Déclare le synonyme Action pour la fonction f.', 'UNKNOWN_FORMULATION');
});

test('ni tableau de pointeurs, ni pointeur de tableau, ni double indirection', () => {
  refused('Déclare un tableau de pointeurs de type int nommé t de dimension 3.', 'UNKNOWN_FORMULATION');
  refused('Ajoute un champ pointeur pointeur de type int nommé p.', 'UNKNOWN_FORMULATION');
  refused('Déclare un pointeur de tableau de type int nommé p.', 'UNKNOWN_FORMULATION');
});

test('aucune vérification de structure récursive ni de cohérence', () => {
  // A pointer field to a structure that does not exist is translated.
  assert.equal(translated('Ajoute un champ pointeur de type structure Inconnue nommé p.').fragments[0].code,
    'struct Inconnue *p;\n');
  // An alias for a structure never defined is translated.
  assert.equal(translated('Déclare le synonyme X pour la structure Inconnue.').fragments[0].code,
    'typedef struct Inconnue X;\n');
  // An array of a structure never defined is translated.
  assert.equal(translated('Déclare un tableau de type structure Inconnue nommé t de dimension 2.').fragments[0].code,
    'struct Inconnue t[2];\n');
});

// ---------------------------------------------------------------------------
// 5. Non-régressions
// ---------------------------------------------------------------------------

for (const [source, code] of [
  ['Déclare une structure nommée Point.', 'struct Point {\n    \n};\n'],
  ['Déclare une variable de type structure Point nommée p.', 'struct Point p;\n'],
  ['Déclare un pointeur de type structure Point nommé q.', 'struct Point *q;\n'],
  ['Affiche le champ x de p.', 'printf("%d", p.x);\n'],
  ['Affiche l’élément "0" de t.', 'printf("%d", t[0]);\n'],
  ['Affecte à p l’allocation de 4 éléments de type structure Point.', 'p = malloc(4 * sizeof(struct Point));\n'],
  ['Affiche la taille du type structure Point.', 'printf("%zu", sizeof(struct Point));\n'],
  ['Déclare le prototype d’une fonction nommée f qui retourne un int.', 'int f(void);\n'],
]) {
  test(`non-régression : ${source.slice(0, 55)}`, () => {
    assert.equal(translated(source).fragments[0].code, code);
  });
}
