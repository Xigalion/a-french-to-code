import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { planPlacement } from '../src/planPlacement.ts';

// Les énoncés du test utilisateur citent des phrases ET le code C attendu.
// Un cahier d'exercices dont les sorties ont vieilli enseigne le faux, et
// l'étudiant n'a aucun moyen de s'en apercevoir : ce test relit donc les
// documents et redemande au moteur, à chaque `npm test`.
const DOCUMENTS = ['../docs/TEST_PARCOURS_DECOUVERTE.md', '../docs/TEST_EXERCICES_PALIER1.md'];

/** Contextes essayés pour un refus de placement : la portée fichier, puis un
 * corps de fonction. Le document d'énoncé dit lequel en toutes lettres ; le
 * test accepte qu'un seul des deux refuse, et exige le code annoncé. */
const CONTEXTES = ['', 'int main(void) {\n'];

function normaliser(code) {
  return code.replace(/⏎/gu, ' ').replace(/\s+/gu, ' ').trim();
}

const acceptees = new Map();
const refusees = new Map();
const malPlacees = new Map();

for (const chemin of DOCUMENTS) {
  const texte = readFileSync(new URL(chemin, import.meta.url), 'utf8');
  for (const ligne of texte.split('\n')) {
    const marque = /^\|\s*(✓|✗|⊘)\s*\|/u.exec(ligne);
    if (marque === null) continue;
    const cellules = [...ligne.matchAll(/`([^`]+)`/gu)].map(trouve => trouve[1]);
    if (cellules.length < 2) continue; // ligne de légende, sans phrase
    // La phrase est la premiere cellule, l'attendu la DERNIERE : une ligne
    // peut porter entre les deux une precision entre parentheses, elle-meme
    // citee entre accents graves.
    const phrase = cellules[0];
    const attendu = cellules[cellules.length - 1];
    const cible = marque[1] === '✓' ? acceptees : marque[1] === '✗' ? refusees : malPlacees;
    cible.set(phrase, attendu);
  }
}

test('les énoncés du test utilisateur citent des phrases réelles', () => {
  // Garde-fou : si le format des tableaux change, le test doit échouer au
  // lieu de ne plus rien vérifier en silence.
  assert.ok(acceptees.size >= 50, 'phrases acceptées trouvées : ' + acceptees.size);
  assert.ok(refusees.size >= 8, 'refus de traduction trouvés : ' + refusees.size);
  assert.ok(malPlacees.size >= 5, 'refus de placement trouvés : ' + malPlacees.size);
});

test('chaque phrase ✓ produit exactement le code C annoncé', () => {
  for (const [phrase, attendu] of acceptees) {
    const resultat = translate(phrase);
    assert.equal(resultat.status, 'translated', 'refusée alors que l’énoncé l’annonce acceptée : ' + phrase);
    const produit = resultat.fragments.map(fragment => fragment.code).join('\n');
    assert.equal(normaliser(produit), normaliser(attendu), 'code produit ≠ code annoncé pour : ' + phrase);
  }
});

test('chaque phrase ✗ est refusée avec le code de diagnostic annoncé', () => {
  for (const [phrase, code] of refusees) {
    const resultat = translate(phrase);
    assert.equal(resultat.status, 'rejected', 'acceptée alors que l’énoncé annonce un refus : ' + phrase);
    assert.equal(resultat.diagnostics[0].code, code, 'code de refus ≠ code annoncé pour : ' + phrase);
  }
});

test('chaque phrase ⊘ est comprise, et refusée au placement avec le code annoncé', () => {
  for (const [phrase, code] of malPlacees) {
    const traduction = translate(phrase);
    assert.equal(traduction.status, 'translated', 'un ⊘ annonce une phrase comprise : ' + phrase);
    const obtenus = CONTEXTES.map(texte => {
      const plan = planPlacement({
        document: { id: 'enonce.c', revision: 0, text: texte },
        cursorOffset: texte.length,
        translation: traduction,
      });
      return plan.status === 'rejected' ? plan.diagnostics[0].code : 'planned';
    });
    assert.ok(obtenus.includes(code),
      'aucun des deux contextes ne refuse avec ' + code + ' pour : ' + phrase + ' → ' + obtenus.join(', '));
  }
});
