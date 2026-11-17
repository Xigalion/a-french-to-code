// Lot S4 — le corpus écrit à la main est relu à chaque `npm test`.
//
// Le rapport docs/phase2/MESURES_CORPUS.md est produit par un outil, et un
// outil qu'on ne relance pas ne protège de rien. Ces tests portent sur les
// deux seules classes qui sont des DÉFAUTS : une phrase acceptée que l'attente
// écrite voulait refusée, et une phrase acceptée dont le C n'est pas celui
// attendu. Le nombre de phrases refusées, lui, n'est pas un défaut : c'est le
// périmètre, et il n'est donc pas gelé par un test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normaliser } from '../src/langue/variantes.ts';

const corpus = JSON.parse(readFileSync(new URL('../test-utilisateur/corpus/corpus-libre.json', import.meta.url), 'utf8'));
const accepte = verdict => ['strict', 'normalise', 'resolu'].includes(verdict.verdict);
const codeDe = resultat => (resultat.fragments[0]?.code ?? '').replace(/\n$/u, '');

test('corpus libre : le fichier est utilisable et annonce sa limite', () => {
  assert.ok(corpus.entrees.length >= 90, 'corpus trop petit pour mesurer quoi que ce soit');
  // La limite doit rester écrite DANS le corpus : un chiffre sans sa limite
  // se cite ensuite tout seul.
  assert.ok(corpus.methode.some(ligne => ligne.includes('PAS du français spontané')));
  for (const entree of corpus.entrees) {
    assert.ok(['accepte', 'refuse', 'ambigu'].includes(entree.attendu), entree.phrase);
    if (entree.attendu === 'accepte') assert.equal(typeof entree.code, 'string', entree.phrase);
    else assert.ok(['claire', 'incomplete'].includes(entree.humain), entree.phrase);
  }
});

for (const entree of corpus.entrees) {
  if (entree.attendu === 'accepte') {
    test(`corpus libre, sens exact : ${entree.phrase}`, () => {
      const verdict = normaliser(entree.phrase);
      assert.ok(accepte(verdict), `refusée : ${verdict.verdict}`);
      assert.equal(codeDe(verdict.resultat), entree.code);
    });
  } else {
    test(`corpus libre, aucune acceptation à tort : ${entree.phrase}`, () => {
      const verdict = normaliser(entree.phrase);
      assert.ok(!accepte(verdict), `acceptée à tort : ${accepte(verdict) ? codeDe(verdict.resultat) : ''}`);
      if (entree.attendu === 'ambigu') {
        assert.equal(verdict.verdict, 'ambigu');
        assert.ok(verdict.lectures.length >= 2);
      }
      // Aucune complétion : un refus ne doit jamais porter de valeur inventée.
      if (entree.humain === 'incomplete') assert.ok(!/ = 0|valeur 0/u.test(verdict.message ?? ''));
    });
  }
}

test('corpus libre : chaque entrée du lexique reste justifiée par un motif', async () => {
  const { LEXIQUE } = await import('../src/langue/variantes.ts');
  for (const entree of LEXIQUE) {
    assert.ok(entree.motif.length > 3, entree.libre);
    assert.ok(entree.formes.length >= 1, entree.libre);
  }
});
