import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';
import { explainInstruction } from '../src/pedagogicalInformation.ts';

// Lot 32 — le champ d'un élément de tableau de structures.
//
// Lacune démontrée par l'exercice de clôture : `promo[i].total` se LISAIT
// dans une condition et dans un argument d'appel depuis le lot 20, mais ne
// pouvait pas être ÉCRIT. Un tableau de structures était donc déclarable et
// jamais remplissable, comme le prototype interne du lot 23 sans la
// définition du lot 31.
//
// Aucune enveloppe nouvelle : une troisième forme d'objet pour les quatre
// enveloppes MEMBER_* du lot 20.

const CORPS = 'int main(void) {\n';

function traduire(phrase) {
  const resultat = translate(phrase);
  assert.equal(resultat.status, 'translated', phrase + ' : ' + JSON.stringify(resultat.diagnostics ?? []));
  return resultat;
}
function code(phrase) {
  return traduire(phrase).fragments.map(fragment => fragment.code).join('').replace(/\n$/u, '');
}
function refus(phrase) {
  const resultat = translate(phrase);
  assert.equal(resultat.status, 'rejected', phrase + ' aurait dû être refusée');
  return resultat.diagnostics[0];
}

test('lot 32 : les quatre enveloppes acceptent un élément comme objet', () => {
  assert.equal(code('Affecte la valeur 5 au champ total de l’élément "0" de promo.'), 'promo[0].total = 5;');
  assert.equal(code('Affecte le caractère \'A\' au champ initiale de l’élément "i" de promo.'), 'promo[i].initiale = \'A\';');
  assert.equal(code('Affecte au champ total de l’élément "i" de promo le résultat numérique de "total".'),
    'promo[i].total = total;');
  assert.equal(code('Affiche le champ total de l’élément "meilleur" de promo.'), 'printf("%d", promo[meilleur].total);');
});

test('lot 32 : l’indice est une expression, parenthésée comme ailleurs', () => {
  assert.equal(code('Affecte au champ total de l’élément "i + 1" de promo le résultat numérique de "0".'),
    'promo[(i + 1)].total = 0;');
  assert.equal(code('Affecte au champ total de l’élément "i * 3" de promo le résultat numérique de "notes[i]".'),
    'promo[(i * 3)].total = notes[i];');
});

test('lot 32 : l’indice obéit au profil d’indice du lot 15, pas davantage', () => {
  // Les trois formes que le profil d'indice ferme depuis le lot 15 : un
  // littéral caractère, un déréférencement, une adresse.
  assert.equal(refus('Affiche le champ total de l’élément "\'A\'" de promo.').code, 'INVALID_EXPRESSION_TOKEN');
  // Les codes diffèrent parce que le profil d'indice ne connait ni l'un ni
  // l'autre comme opérateur UNAIRE : « * » est alors lu comme binaire, donc
  // privé de son opérande gauche, et « & » comme un opérateur non pris en
  // charge. Ce sont exactement les codes du lot 15, non reproduits ici.
  assert.equal(refus('Affiche le champ total de l’élément "*p" de promo.').code, 'MISSING_OPERAND');
  assert.equal(refus('Affiche le champ total de l’élément "&x" de promo.').code, 'UNSUPPORTED_EXPRESSION_OPERATOR');
});

test('lot 32 : les refus de forme de la désignation sont ceux du lot 15', () => {
  assert.equal(refus('Affiche le champ total de l’élément "" de promo.').code, 'MISSING_INDEX');
  assert.equal(refus('Affiche le champ total de l’élément 0 de promo.').code, 'MISSING_EXPRESSION_DELIMITER');
  assert.equal(refus('Affiche le champ total de l’élément "0 de promo.').code, 'UNTERMINATED_EXPRESSION');
  assert.equal(refus('Affiche le champ total de l’élément "0" promo.').code, 'UNKNOWN_FORMULATION');
  assert.equal(refus('Affiche le champ total de l’élément "0" de 3promo.').code, 'INVALID_IDENTIFIER');
  assert.equal(refus('Affiche le champ total de l’élément "0" de promo trop.').code, 'UNEXPECTED_TEXT');
});

test('lot 32 : la flèche n’est PAS offerte sur un élément', () => {
  // `promo[i]->x` exigerait un tableau de pointeurs, qu'aucune formulation ne
  // déclare. La phrase n'est donc pas au catalogue, et c'est volontaire.
  assert.equal(refus('Affiche le champ total pointé par l’élément "i" de promo.').code, 'INVALID_IDENTIFIER');
});

test('lot 32 : l’information de bornes du lot 15 arrive, et avant celles du champ', () => {
  const informations = explainInstruction(
    traduire('Affecte au champ total de l’élément "i" de promo le résultat numérique de "0".')).map(i => i.code);
  assert.deepEqual(informations, ['INDEX_NOT_CHECKED', 'MEMBER_ACCESS_FORM', 'MEMBER_NOT_CHECKED']);
  // L'ancre de l'information de bornes est la désignation entre guillemets.
  const [bornes] = explainInstruction(
    traduire('Affiche le champ total de l’élément "i" de promo.'));
  const phrase = 'Affiche le champ total de l’élément "i" de promo.';
  assert.equal(phrase.slice(bornes.range.start, bornes.range.end), '"i"');
});

test('lot 32 : aucune information de bornes sur un objet simple', () => {
  const simple = explainInstruction(traduire('Affecte la valeur 5 au champ x de p.')).map(i => i.code);
  assert.deepEqual(simple, ['MEMBER_ACCESS_FORM', 'MEMBER_NOT_CHECKED']);
  const pointe = explainInstruction(traduire('Affecte la valeur 5 au champ x pointé par q.')).map(i => i.code);
  assert.deepEqual(pointe, ['MEMBER_ACCESS_FORM', 'MEMBER_NOT_CHECKED']);
});

test('lot 32 : les formulations du lot 20 sont inchangées', () => {
  assert.equal(code('Affecte la valeur 5 au champ x de p.'), 'p.x = 5;');
  assert.equal(code('Affecte la valeur 5 au champ x pointé par q.'), 'q->x = 5;');
  assert.equal(code('Affecte au champ x de p le résultat numérique de "a + 1".'), 'p.x = (a + 1);');
  assert.equal(code('Affiche le champ x de p.'), 'printf("%d", p.x);');
  assert.equal(code('Affiche le champ x pointé par q.'), 'printf("%d", q->x);');
  assert.equal(code('Affecte le caractère \'A\' au champ initiale de e.'), 'e.initiale = \'A\';');
  // La lecture, elle, fonctionnait déjà : c'est l'asymétrie que le lot ferme.
  assert.equal(code('Affecte à cumul le résultat numérique de "promo[i].total".'), 'cumul = promo[i].total;');
});

test('lot 32 : placement — une instruction, donc un corps de fonction', () => {
  const traduction = traduire('Affecte au champ total de l’élément "i" de promo le résultat numérique de "0".');
  const dehors = planPlacement({ document: { id: 'x.c', revision: 0, text: '' }, cursorOffset: 0, translation: traduction });
  assert.equal(dehors.status, 'rejected');
  assert.equal(dehors.diagnostics[0].code, 'STATEMENT_AT_FILE_SCOPE');
  const dedans = planPlacement({ document: { id: 'x.c', revision: 0, text: CORPS },
    cursorOffset: CORPS.length, translation: traduction });
  assert.equal(dedans.status, 'planned');
  assert.ok(dedans.plan.edits[0].newText.includes('promo[i].total = 0;'));
});

test('lot 32 : la désignation d’élément reste refusée là où elle n’est pas livrée', () => {
  // Trois manques que l'exercice de clôture a aussi montrés, et que ce lot ne
  // comble PAS : les dire ici empêche de les croire livrés.
  assert.equal(refus('Lis un entier depuis le fichier f dans l’élément "i" de notes.').code, 'INVALID_IDENTIFIER');
  assert.equal(refus('Écris la valeur de l’élément "i" de notes dans le fichier f.').code, 'INVALID_IDENTIFIER');
  assert.equal(refus('Affecte à l’élément "i" de totaux le résultat de l’appel de somme avec "1" et "2" et "3".').code,
    'UNKNOWN_FORMULATION');
});
