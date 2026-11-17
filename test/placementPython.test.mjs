import test from 'node:test';
import assert from 'node:assert/strict';
import { planifierPython } from '../src/langages/python/placement.ts';

// Lot P2 — placement Python par indentation, indépendant du placement C.
//
// Ce que les tests doivent établir, et c'est l'enjeu du lot : les quatre
// différences de fond avec C sont bien des différences, et non des oublis.
//   1. l'indentation décide du bloc ;
//   2. une instruction à la portée module est VALIDE ;
//   3. un en-tête exige un corps plus indenté ;
//   4. la chaîne if/elif/else se reconnaît par la colonne.

/** Le document est écrit tel qu'un utilisateur l'aurait, « ␣ » marquant la
 * ligne blanche où se trouve le curseur. */
function poser(document, kind, code = 'x = 5', comment = '// Affecte la valeur 5 à x.') {
  const curseur = document.indexOf('␣');
  assert.notEqual(curseur, -1, 'le document de test doit porter un ␣');
  const texte = document.replace('␣', '');
  return planifierPython({ document: { text: texte }, cursorOffset: curseur, comment, code, kind });
}
const refus = (plan) => (plan.status === 'refuse' ? plan.diagnostics[0].code : 'PLANIFIE');

test('P2 : une instruction se place à la portée module — Python n’exige pas de fonction', () => {
  const plan = poser('␣\n', 'ASSIGN_INT');
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.indentation, 0);
  assert.equal(plan.edits[0].newText, '// Affecte la valeur 5 à x.\nx = 5');
});

test('P2 : l’indentation de la ligne blanche décide du bloc', () => {
  const plan = poser('if x > 0:\n    ␣\n', 'ASSIGN_INT');
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.indentation, 4);
  assert.equal(plan.edits[0].newText, '    // Affecte la valeur 5 à x.\n    x = 5');
});

test('P2 : deux niveaux d’indentation sont rendus tels quels', () => {
  const plan = poser('while a:\n    if b:\n        ␣\n', 'ASSIGN_INT');
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.indentation, 8);
  assert.ok(plan.edits[0].newText.startsWith('        //'));
});

test('P2 : une ligne non blanche est refusée — C-A ne remplace jamais du code', () => {
  const plan = planifierPython({ document: { text: 'x = 1\n' }, cursorOffset: 2,
    comment: '//', code: 'y = 2', kind: 'ASSIGN_INT' });
  assert.equal(refus(plan), 'LIGNE_NON_BLANCHE');
});

test('P2 : une indentation qui n’est pas un multiple de quatre est refusée', () => {
  const plan = poser('if x:\n  ␣\n', 'ASSIGN_INT');
  assert.equal(refus(plan), 'INDENTATION_INCONNUE');
});

test('P2 : un en-tête exige un corps plus indenté — propre à Python', () => {
  // Un bloc vide est une erreur de syntaxe en Python, là où C accepte « {} ».
  assert.equal(refus(poser('if x:\n␣\n', 'ASSIGN_INT')), 'CORPS_ATTENDU');
  assert.equal(refus(poser('def f():\n␣\n', 'ASSIGN_INT')), 'CORPS_ATTENDU');
  // Et la même phrase, indentée, est acceptée.
  assert.equal(poser('if x:\n    ␣\n', 'ASSIGN_INT').status, 'planifie');
});

test('P2 : une indentation plus profonde qu’aucun bloc ouvert est refusée', () => {
  assert.equal(refus(poser('x = 1\n    ␣\n', 'ASSIGN_INT')), 'INDENTATION_INCONNUE');
});

test('P2 : elif et else se rattachent par la COLONNE', () => {
  const chaine = 'if a:\n    x = 1\n␣\n';
  assert.equal(poser(chaine, 'ELSE_IF', 'elif b:').status, 'planifie');
  assert.equal(poser(chaine, 'ELSE', 'else:').status, 'planifie');
  // Dans le corps du if, à la mauvaise colonne : refus.
  assert.equal(refus(poser('if a:\n    x = 1\n    ␣\n', 'ELSE', 'else:')), 'BRANCHE_SANS_SI');
  // Sans aucun if : refus.
  assert.equal(refus(poser('x = 1\n␣\n', 'ELSE', 'else:')), 'BRANCHE_SANS_SI');
  // Après un while, pas un if : refus.
  assert.equal(refus(poser('while a:\n    x = 1\n␣\n', 'ELSE', 'else:')), 'BRANCHE_SANS_SI');
});

test('P2 : elif se rattache aussi à un elif', () => {
  const plan = poser('if a:\n    x = 1\nelif b:\n    x = 2\n␣\n', 'ELSE', 'else:');
  assert.equal(plan.status, 'planifie');
});

test('P2 : break et continue exigent une boucle englobante', () => {
  assert.equal(poser('while a:\n    ␣\n', 'BREAK', 'break').status, 'planifie');
  assert.equal(poser('while a:\n    if b:\n        ␣\n', 'CONTINUE', 'continue').status, 'planifie');
  assert.equal(refus(poser('if a:\n    ␣\n', 'BREAK', 'break')), 'TRANSFERT_HORS_BOUCLE');
  assert.equal(refus(poser('␣\n', 'BREAK', 'break')), 'TRANSFERT_HORS_BOUCLE');
});

test('P2 : une boucle HORS de la fonction n’englobe pas un break de la fonction', () => {
  // La recherche s'arrête au « def » : une boucle plus haut ne compte pas.
  const document = 'while a:\n    def f():\n        ␣\n';
  assert.equal(refus(poser(document, 'BREAK', 'break')), 'TRANSFERT_HORS_BOUCLE');
});

test('P2 : return exige une fonction englobante', () => {
  assert.equal(poser('def f():\n    ␣\n', 'RETURN_INT', 'return 0').status, 'planifie');
  assert.equal(poser('def f():\n    if a:\n        ␣\n', 'RETURN', 'return').status, 'planifie');
  assert.equal(refus(poser('␣\n', 'RETURN_INT', 'return 0')), 'RETOUR_HORS_FONCTION');
  assert.equal(refus(poser('while a:\n    ␣\n', 'RETURN', 'return')), 'RETOUR_HORS_FONCTION');
});

test('P2 : un en-tête laisse le curseur DANS le bloc, un cran plus loin', () => {
  const plan = poser('␣\n', 'IF', 'if x > 0:');
  assert.equal(plan.status, 'planifie');
  const texte = plan.edits[0].newText;
  // Le curseur tombe après le saut de ligne suivant l'en-tête, décalé de 4.
  assert.equal(plan.cursor.offset, texte.length + 1 + 4);
});

test('P2 : une instruction simple ne déplace pas le curseur', () => {
  const plan = poser('␣\n', 'ASSIGN_INT');
  assert.equal(plan.cursor, undefined);
});

test('P2 : un code vide est refusé, jamais inséré', () => {
  assert.equal(refus(poser('␣\n', 'ASSIGN_INT', '   ')), 'CODE_VIDE');
});

test('P2 : le code multiligne est indenté ligne par ligne', () => {
  const plan = poser('def f():\n    ␣\n', 'ASSIGN_INT', 'a = 1\nb = 2');
  assert.equal(plan.status, 'planifie');
  assert.equal(plan.edits[0].newText, '    // Affecte la valeur 5 à x.\n    a = 1\n    b = 2');
});

test('P2 : les lignes blanches du document ne cassent pas la reconnaissance', () => {
  // Une ligne blanche entre le if et son elif est licite en Python.
  const plan = poser('if a:\n    x = 1\n\n␣\n', 'ELSE', 'else:');
  assert.equal(plan.status, 'planifie');
});

test('P2 : aucun refus du lot 26 n’est importé — la portée module est libre', () => {
  // Les huit instructions que C refuse à la portée fichier sont ici valides,
  // sauf celles qui ont leur propre règle Python (branche, transfert, retour).
  for (const kind of ['ASSIGN_INT', 'ASSIGN_EXPRESSION', 'PRINT_INT', 'CALL', 'WHILE', 'IF', 'ASSERT']) {
    assert.equal(poser('␣\n', kind, 'x = 5').status, 'planifie', kind + ' devrait être placé à la portée module');
  }
});
