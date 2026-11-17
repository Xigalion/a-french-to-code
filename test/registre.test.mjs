import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { C17, GENRES, LANGAGES, langagePour, rendre } from '../src/langages/registre.ts';

// Lot P1 — le registre de langages.
//
// Le lot est ADDITIF : rien dans le moteur ne l'appelle encore. Ce que les
// tests doivent établir est donc une identité et trois refus :
//   1. le registre rend EXACTEMENT ce que `translate` rend, pour toute phrase
//      du catalogue — sinon le registre serait un second rendu divergent ;
//   2. une intention non portée est un refus NOMMÉ, jamais un code vide ;
//   3. un fichier sans langage connu ne reçoit pas de langage par défaut ;
//   4. le registre ne tient pas son propre inventaire des genres.

const CATALOGUE = readFileSync(new URL('../docs/CATALOGUE.md', import.meta.url), 'utf8');
const PHRASES = CATALOGUE.split('\n').filter(ligne => ligne.startsWith('| `'))
  .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1]).filter(phrase => phrase !== undefined);

test('P1 : le registre rend exactement ce que translate rend', () => {
  let comparees = 0;
  for (const phrase of PHRASES) {
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') continue;
    const rendu = rendre(C17, resultat.instruction);
    assert.equal(rendu.status, 'rendu', phrase);
    assert.equal(rendu.code, resultat.fragments[0].code, 'le registre diverge de translate : ' + phrase);
    comparees++;
  }
  // Le catalogue couvre les 84 genres ; si ce nombre s'effondre, le test ne
  // vérifie plus rien et doit échouer.
  assert.ok(comparees >= 130, 'phrases comparées : ' + comparees);
});

test('P1 : C17 porte les 84 genres, et le registre ne tient pas sa propre liste', () => {
  assert.equal(C17.portees, GENRES);
  assert.equal(GENRES.size, 84);
  for (const phrase of PHRASES) {
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') continue;
    assert.ok(GENRES.has(resultat.instruction.kind), 'genre absent de la partition : ' + resultat.instruction.kind);
  }
});

test('P1 : une intention non portée est un refus nommé, jamais un code vide', () => {
  // Un langage de démonstration qui ne porte qu'une intention : c'est la
  // situation de tout second langage, et elle doit être propre.
  const minimal = {
    nom: 'demonstration', extensions: ['.demo'], blocs: 'indentation',
    portees: new Set(['ASSIGN_INT']),
    raisons: new Map([['DECL_INT', 'Ce langage ne déclare pas sans valeur.']]),
    rendre: () => ({ status: 'rendu', code: 'x = 5\n' }),
  };
  const porte = rendre(minimal, translate('Affecte la valeur 5 à x.').instruction);
  assert.equal(porte.status, 'rendu');

  const refus = rendre(minimal, translate('Déclare un entier nommé n.').instruction);
  assert.equal(refus.status, 'refus');
  assert.equal(refus.code, 'INTENTION_NON_PORTEE');
  assert.equal(refus.raison, 'Ce langage ne déclare pas sans valeur.');
  assert.ok(!('code' in refus && refus.code === ''), 'un refus ne produit pas de code');
});

test('P1 : une intention non portée SANS raison écrite est signalée comme un défaut du registre', () => {
  const bavard = {
    nom: 'sans-raison', extensions: ['.x'], blocs: 'accolades',
    portees: new Set(), raisons: new Map(),
    rendre: () => ({ status: 'rendu', code: '' }),
  };
  const refus = rendre(bavard, translate('Affecte la valeur 5 à x.').instruction);
  assert.equal(refus.status, 'refus');
  assert.match(refus.raison, /défaut du registre/u);
});

test('P1 : le langage se choisit par extension, sans repli par défaut', () => {
  assert.equal(langagePour('.c'), C17);
  assert.equal(langagePour('.h'), C17);
  assert.equal(langagePour('.C'), C17, 'la casse de l’extension ne doit pas décider');
  // Adapte au lot P3 : Python existe, mais il n’est inscrit QUE si son module
  // est importe. Ce fichier ne l’importe pas, et le registre ne doit donc
  // connaitre que C17 : un langage ne s’inscrit pas tout seul.
  assert.equal(langagePour('.py'), undefined, 'Python n’est inscrit que par son module');
  assert.equal(langagePour('.txt'), undefined);
  assert.equal(langagePour(''), undefined);
});

test('P1 : C17 déclare des accolades, et le registre expose les langages inscrits', () => {
  assert.equal(C17.blocs, 'accolades');
  assert.deepEqual([...LANGAGES.keys()], ['c17'], 'sans importer son module, Python est absent');
  assert.equal(C17.raisons.size, 0, 'C17 ne refuse aucune intention : il n’a donc aucune raison à écrire');
});

test('P3 : importer le module Python l’inscrit, et seulement alors', async () => {
  assert.equal(langagePour('.py'), undefined);
  const { PYTHON } = await import('../src/langages/python/langage.ts');
  assert.equal(langagePour('.py'), PYTHON);
  assert.equal(PYTHON.blocs, 'indentation');
  // C17 n’est pas deplace par l’arrivee d’un second langage.
  assert.equal(langagePour('.c'), C17);
  assert.deepEqual([...LANGAGES.keys()], ['c17', 'python']);
});
