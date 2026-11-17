// Lot P6 — l'exercice de clôture Python est relu à chaque `npm test`.
//
// Les six programmes vivent dans `exercice/python/cloture/`, et leur preuve
// d'exécution dans `exercice/python/journal/cloture.md`. L'exécution demande
// `python3` et reste un outil ; ce que ces tests protègent, c'est la seule
// chose qui puisse pourrir sans qu'on le voie : que le `.py` commité soit
// encore ce que le moteur écrit aujourd'hui.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PythonTranslationSession } from '../extension/out/extension/src/sessionPython.js';
import { NATIVES_PYTHON } from '../src/langages/python/renduNatif.ts';
import { PORTEES_PYTHON } from '../src/langages/python/rendu.ts';

const journal = readFileSync(new URL('../exercice/python/journal/cloture.md', import.meta.url), 'utf8');

const PROGRAMMES = ['carnet.py', 'complement-portees.py', 'complement-fichier.py',
  'complement-sequences.py', 'complement-collections.py', 'complement-chaines.py'];

for (const fichier of PROGRAMMES) {
  test(`P6 : ${fichier} est du Python plausible, et porte sa traçabilité`, () => {
    const texte = readFileSync(new URL('../exercice/python/cloture/' + fichier, import.meta.url), 'utf8');
    const lignes = texte.split('\n').filter(ligne => ligne.trim() !== '');
    const commentaires = lignes.filter(ligne => ligne.trimStart().startsWith('#'));
    const code = lignes.filter(ligne => !ligne.trimStart().startsWith('#'));
    // Une ligne de commentaire par instruction : c'est la règle 2, et elle se
    // compte.
    assert.equal(commentaires.length, code.length, fichier);
    assert.ok(commentaires.length >= 20, fichier + ' : ' + commentaires.length + ' instructions');
    // Aucun `pass`, aucun séparateur implicite, aucune valeur inventée.
    assert.ok(!texte.includes('pass'), fichier);
    for (const ligne of code) {
      if (ligne.trimStart().startsWith('print(')) assert.ok(ligne.includes('end='), ligne);
    }
    // L'indentation est un multiple de quatre : le placement par indentation
    // n'a pas le droit de produire autre chose.
    for (const ligne of lignes) {
      const marge = ligne.length - ligne.replace(/^ */u, '').length;
      assert.equal(marge % 4, 0, fichier + ' : indentation ' + marge + ' — ' + ligne);
    }
  });
}

test('P6 : le journal annonce une exécution conforme pour les six programmes', () => {
  // Le journal est engendré ; s'il annonce un écart, le test doit le dire,
  // parce qu'un bilan qui dit « conforme » pendant qu'un programme échoue est
  // exactement ce que ce projet refuse.
  assert.equal((journal.match(/\| conforme \|/gu) ?? []).length, PROGRAMMES.length);
  assert.ok(!journal.includes('**ECART**'), 'le journal annonce un écart');
  assert.match(journal, /retouches manuelles : \*\*0\*\*/u);
  assert.match(journal, /phrases refusees : \*\*0\*\*/u);
});

test('P6 : le journal annonce la couverture complète, et il dit ce qu’elle ne prouve pas', () => {
  const total = NATIVES_PYTHON.size + PORTEES_PYTHON.size;
  assert.match(journal, new RegExp('intentions EMPLOYEES par ces six programmes : \\*\\*'
    + total + '\\*\\* sur ' + total, 'u'));
  // La phrase qui empêche de lire ce chiffre comme une note.
  assert.match(journal, /n’est pas un compte de competences/u);
});

test('P6 : le carnet est reproduit par le moteur, trait pour trait', () => {
  // Les six programmes sont écrits par le même chemin ; reproduire le plus
  // gros suffit à détecter une dérive du moteur, et garde ce test lisible.
  const attendu = readFileSync(new URL('../exercice/python/cloture/carnet.py', import.meta.url), 'utf8');
  const etapes = lireEtapes('carnet.py');
  assert.ok(etapes.length >= 80, 'étapes relues : ' + etapes.length);
  let document = '';
  for (const [indentation, phrase] of etapes) {
    const avant = document + ' '.repeat(indentation);
    const courante = { document: { id: 'file:///carnet.py', revision: 1, text: avant },
      cursorOffset: avant.length, singleCursor: true, indentUnit: '    ',
      indentSignature: 'true:4', eol: '\n', open: true };
    const session = new PythonTranslationSession(courante, phrase);
    const diagnostic = session.diagnose(courante);
    assert.equal(diagnostic, undefined,
      phrase + ' → ' + (diagnostic?.code ?? '') + ' ' + (diagnostic?.message ?? ''));
    const apercu = session.prepare(courante);
    assert.equal(apercu.status, 'preview', phrase);
    document = apercu.preview.after + '\n';
  }
  assert.equal(document, attendu);
});

/** Relit les étapes du script générateur : la liste des phrases n'est pas
 * recopiée ici, pour qu'elle n'ait qu'une seule source. */
function lireEtapes(fichier) {
  const script = readFileSync(new URL('../exercice/python/cloture.mjs', import.meta.url), 'utf8');
  const debut = script.indexOf("fichier: '" + fichier + "'");
  assert.ok(debut > 0, 'programme absent du script : ' + fichier);
  const depuis = script.indexOf('etapes: [', debut);
  const jusqu = script.indexOf('\n  ],', depuis);
  const bloc = script.slice(depuis, jusqu);
  return [...bloc.matchAll(/\[(\d+), '((?:[^'\\]|\\.)*)'\]/gu)]
    .map(trouve => [Number(trouve[1]), trouve[2].replace(/\\'/gu, "'").replace(/\\\\/gu, '\\')]);
}
