// Lot S4, révisé au lot S5 — le corpus écrit à la main est relu à chaque
// `npm test`.
//
// Le corpus `corpus-libre.json` est une **référence historique** : il garde
// les attentes du lot S4, et il n'est pas modifié. Le lot S5 a ajouté les
// reformulations syntaxiques, et seize de ses phrases « claires mais
// refusées » sont désormais reconnues. Ces seize gains vivent dans
// `corpus-libre-evolution.json`, avec le C vérifié à la main.
//
// Ce que les tests gèlent, et ce qu'ils ne gèlent pas :
//   - une phrase attendue ACCEPTÉE doit produire son code exact : régression ;
//   - une phrase INCOMPLÈTE doit rester refusée : c'est l'interdiction de
//     deviner, et elle ne se négocie pas ;
//   - une phrase CLAIRE refusée peut devenir reconnue : c'est un gain, pas un
//     défaut. Le nombre de gains n'est donc pas gelé — mais chaque gain
//     enregistré doit garder son sens ;
//   - le nombre de phrases claires encore refusées n'est pas gelé : c'est le
//     périmètre, et il bouge.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normaliser, LEXIQUE } from '../src/langue/variantes.ts';

const corpus = JSON.parse(readFileSync(new URL('../test-utilisateur/corpus/corpus-libre.json', import.meta.url), 'utf8'));
const evolution = JSON.parse(readFileSync(new URL('../test-utilisateur/corpus/corpus-libre-evolution.json', import.meta.url), 'utf8'));
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

const gains = new Set(evolution.gains.map(gain => gain.phrase));

for (const entree of corpus.entrees) {
  if (entree.attendu === 'accepte') {
    test(`corpus libre, sens exact : ${entree.phrase}`, () => {
      const verdict = normaliser(entree.phrase);
      assert.ok(accepte(verdict), `refusée : ${verdict.verdict}`);
      assert.equal(codeDe(verdict.resultat), entree.code);
    });
  } else if (entree.attendu === 'refuse' && entree.humain === 'claire') {
    test(`corpus libre, phrase claire : ${entree.phrase}`, () => {
      const verdict = normaliser(entree.phrase);
      // Gain enregistré : elle doit être reconnue, et son code est gelé par le
      // test de l'évolution. Sinon, elle reste hors périmètre, et c'est une
      // mesure, pas un défaut.
      if (gains.has(entree.phrase)) assert.ok(accepte(verdict), 'gain perdu : ' + entree.phrase);
      else assert.ok(!accepte(verdict), 'gain non enregistré : ajoutez-le à corpus-libre-evolution.json '
        + 'après avoir vérifié son sens — ' + entree.phrase);
    });
  } else {
    test(`corpus libre, aucune invention : ${entree.phrase}`, () => {
      const verdict = normaliser(entree.phrase);
      assert.ok(!accepte(verdict), `acceptée à tort : ${accepte(verdict) ? codeDe(verdict.resultat) : ''}`);
      // Aucune complétion : un refus ne doit jamais porter de valeur inventée.
      assert.ok(!/ = 0|valeur 0/u.test(verdict.message ?? ''));
    });
  }
}

for (const entree of corpus.entrees.filter(candidate => candidate.attendu === 'ambigu')) {
  test(`corpus libre, ambiguïté détectée : ${entree.phrase}`, () => {
    const verdict = normaliser(entree.phrase);
    assert.equal(verdict.verdict, 'ambigu');
    assert.ok(verdict.lectures.length >= 2);
  });
}

// --------------------------------------------------------------------------
// Les gains du lot S5 : chacun garde son sens
// --------------------------------------------------------------------------
test('évolution : chaque gain enregistré vient bien du corpus historique', () => {
  const claires = new Set(corpus.entrees
    .filter(entree => entree.attendu === 'refuse' && entree.humain === 'claire')
    .map(entree => entree.phrase));
  for (const gain of evolution.gains) {
    assert.ok(claires.has(gain.phrase), 'gain qui n’est pas une phrase claire du corpus : ' + gain.phrase);
  }
  assert.equal(evolution.gains.length, 19);
});

for (const gain of evolution.gains) {
  test(`évolution, sens vérifié : ${gain.phrase}`, () => {
    const verdict = normaliser(gain.phrase);
    assert.ok(accepte(verdict), 'gain perdu : ' + verdict.verdict);
    assert.equal(codeDe(verdict.resultat), gain.code);
    assert.equal(verdict.canonique, gain.canonique);
  });
}

for (const refus of evolution.toujoursRefusees) {
  test(`évolution, toujours refusée : ${refus.phrase}`, () => {
    const verdict = normaliser(refus.phrase);
    assert.ok(!accepte(verdict), 'acceptée alors qu’elle doit rester refusée : ' + refus.phrase);
    if (refus.raison.startsWith('AMBIGUITE')) assert.equal(verdict.verdict, 'ambigu');
  });
}

test('corpus libre : chaque entrée du lexique reste justifiée par un motif', () => {
  for (const entree of LEXIQUE) {
    assert.ok(entree.motif.length > 3, entree.libre);
    assert.ok(entree.formes.length >= 1, entree.libre);
  }
});
