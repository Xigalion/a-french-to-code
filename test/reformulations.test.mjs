// Lot S5 — les reformulations syntaxiques.
//
// Ce que ces tests doivent établir :
//   1. le mode strict est intact : une phrase du catalogue ne traverse rien ;
//   2. aucune reformulation n'invente une information absente — et c'est le
//      défaut que ce lot a trouvé dans sa propre table ;
//   3. les captures sont recopiées telles quelles : rien n'est relu, rien
//      n'est réordonné à l'intérieur d'une capture ;
//   4. une ambiguïté est refusée, et les lectures sont nommées ;
//   5. aucune entrée morte dans la table ;
//   6. les deux corpus donnent leurs chiffres, et le gelé n'a pas bougé.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { normaliser } from '../src/langue/variantes.ts';
import { reformuler, REFORMULATIONS } from '../src/langue/reformulations.ts';

const verdict = phrase => normaliser(phrase).verdict;
const accepte = v => ['strict', 'normalise', 'resolu'].includes(v.verdict);
function code(phrase) {
  const v = normaliser(phrase);
  assert.ok(accepte(v), phrase + ' → ' + v.verdict + ' ' + (v.message ?? ''));
  return v.resultat.fragments[0].code.replace(/\n$/u, '');
}

// --------------------------------------------------------------------------
// 1. Le mode strict
// --------------------------------------------------------------------------
const CATALOGUE = readFileSync(new URL('../docs/CATALOGUE.md', import.meta.url), 'utf8');
const PHRASES = CATALOGUE.split('\n').filter(ligne => ligne.startsWith('| `'))
  .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1]).filter(phrase => phrase !== undefined);

test('S5 : tout le catalogue traverse en mode strict, sans une réécriture', () => {
  let verifiees = 0;
  for (const phrase of PHRASES) {
    if (translate(phrase).status !== 'translated') continue;
    const v = normaliser(phrase);
    assert.equal(v.verdict, 'strict', phrase + ' a traversé la couche');
    assert.equal(v.canonique, phrase);
    verifiees++;
  }
  assert.ok(verifiees >= 130, 'phrases vérifiées : ' + verifiees);
});

test('S5 : une reformulation ne s’applique qu’à la phrase ENTIÈRE', () => {
  // Un motif non ancré aurait réécrit un morceau et laissé le reste : c'est
  // ce que l'ancrage interdit.
  assert.deepEqual(reformuler('Affiche la valeur de age et mets 5 dans x.'), []);
  assert.deepEqual(reformuler('Je pense que age vaut 20 depuis hier.'), []);
  assert.deepEqual(reformuler('Mets 20 dans age puis affiche age.'), []);
});

// --------------------------------------------------------------------------
// 2. Aucune invention
// --------------------------------------------------------------------------
test('S5 : « age vaut 20. » n’a qu’UNE lecture, parce que l’autre inventerait le type', () => {
  // Le défaut que ce lot a trouvé chez lui : la lecture « créer » produisait
  // « Crée un entier nommé age de valeur 20. », et le mot « entier » n'est
  // nulle part dans la phrase.
  const candidates = reformuler('age vaut 20.');
  assert.equal(candidates.length, 1);
  assert.equal(candidates[0].phrase, 'Affecte la valeur 20 à age.');
  assert.equal(code('age vaut 20.'), 'age = 20;');
  for (const candidate of candidates) assert.ok(!/entier|int /u.test(candidate.phrase));
});

test('S5 : aucune reformulation n’introduit un type ni une valeur absents', () => {
  // La liste couvre les noms de type ET leurs synonymes francais : si le mot
  // est dans la phrase libre, la reformulation ne l'invente pas.
  // Frontiere UNICODE, pas \b : \b est ASCII, et « int » y est un mot entier
  // au milieu de « interieure » des que la lettre suivante est accentuee.
  const MOTS = 'entier|entiers|entière|caractère|flottant|réel|chaîne|texte|tableau|float|double|int|char|unsigned';
  const TYPES = new RegExp('(?<!\\p{L})(?:' + MOTS + ')(?!\\p{L})', 'iu');
  // Une forme qui porte PLUSIEURS reformulations ne produit jamais de code
  // seule : ses lectures se contredisent, et la phrase est refusée comme
  // ambiguë. C'est le cas de « Affiche {NOM} », dont les trois lectures
  // nomment trois formats. L'exemption est donc vérifiée, pas accordée.
  const parForme = new Map();
  for (const entree of REFORMULATIONS) {
    const liste = parForme.get(entree.forme) ?? [];
    liste.push(entree);
    parForme.set(entree.forme, liste);
  }
  for (const [forme, entrees] of parForme) {
    if (entrees.length > 1) {
      const v = normaliser(entrees[0].demonstration);
      assert.equal(v.verdict, 'ambigu',
        'forme à plusieurs lectures qui ne finit pas en ambiguïté : ' + forme);
      continue;
    }
    const entree = entrees[0];
    if (TYPES.test(entree.forme)) continue;
    assert.ok(!TYPES.test(entree.canonique),
      'reformulation qui invente un type : ' + entree.forme + ' → ' + entree.canonique);
  }
  // Et aucune ne fabrique un nombre qui n'est pas une capture.
  for (const entree of REFORMULATIONS) {
    const litteraux = entree.canonique.replace(/\$[1-9]/gu, '').match(/\b\d+\b/gu) ?? [];
    assert.deepEqual(litteraux, [], 'reformulation qui invente un nombre : ' + entree.forme);
  }
});

test('S5 : les formulations dont l’information manque restent refusées', () => {
  for (const phrase of ['Incrémente compteur.', 'Incrémenter compteur.', 'Décrémente compteur.',
    'Double total.', 'Déclarer un réel nommé moyenne.', 'Crée un entier nommé age.',
    'Affiche.', 'Crée une boucle.']) {
    const v = normaliser(phrase);
    assert.ok(!accepte(v), 'acceptée alors qu’une information manque : ' + phrase);
    // Et le refus ne montre aucune valeur fabriquée.
    assert.ok(!/ \+ 1|= 0| 2\b/u.test(v.message ?? ''), phrase + ' : ' + v.message);
  }
});

// --------------------------------------------------------------------------
// 3. Les captures sont recopiées telles quelles
// --------------------------------------------------------------------------
test('S5 : une expression entre guillemets n’est jamais relue ni réécrite', () => {
  assert.equal(code('Calcule "a + b * c" dans total.'), 'total = (a + (b * c));');
  // Un mot du lexique DANS l'expression ne doit pas être substitué.
  assert.equal(code('Calcule "mets + 1" dans total.'), 'total = (mets + 1);');
  assert.equal(code('Évalue "montre * 2" dans total.'), 'total = (montre * 2);');
});

test('S5 : un texte affiché traverse intact, mots du lexique compris', () => {
  assert.equal(code('Écris le texte "Créer un entier valant 20".'),
    'printf("%s", "Créer un entier valant 20");');
  assert.equal(code('Écrire le texte "Mets 20 dans age".'), 'printf("%s", "Mets 20 dans age");');
});

test('S5 : un identifiant qui porte un mot du lexique ou un verbe reformulé survit', () => {
  assert.equal(code('Mets 20 dans mets.'), 'mets = 20;');
  assert.equal(code('Fixe montre à 20.'), 'montre = 20;');
  assert.equal(code('Déclare l’entier affiche.'), 'int affiche;');
});

test('S5 : un littéral caractère est protégé, et une apostrophe française ne l’est pas', () => {
  // Le défaut corrigé par ce lot : « l'itération » ouvrait une zone protégée.
  assert.equal(code('Passe à l\'itération suivante.'), 'continue;');
  assert.equal(code('Passe à l’itération suivante.'), 'continue;');
  // Et le vrai littéral reste intouchable.
  assert.equal(verdict('Crée un caractère nommé c de valeur \'A\'.'), 'strict');
  assert.equal(code('Crée un caractère lettre de valeur \'A\'.'), "char lettre = 'A';");
});

// --------------------------------------------------------------------------
// 4. Les ambiguïtés
// --------------------------------------------------------------------------
test('S5 : « Affiche x. » a trois lectures, et elles sont nommées', () => {
  const v = normaliser('Affiche x.');
  assert.equal(v.verdict, 'ambigu');
  assert.equal(v.lectures.length, 3);
  const codes = v.lectures.map(lecture => lecture.code).join(' ');
  assert.match(codes, /%d/u);
  assert.match(codes, /%c/u);
  assert.match(codes, /%s/u);
  // Aucune n'est présentée comme LA bonne : les trois sont montrées.
  assert.match(v.message, /ne choisit pas/u);
});

test('S5 : « Montre x. » garde ses deux lectures du lexique', () => {
  const v = normaliser('Montre x.');
  assert.equal(v.verdict, 'ambigu');
  assert.equal(v.lectures.length, 2);
});

test('S5 : deux reformulations de MÊME sens ne font pas une ambiguïté', () => {
  // « Sortir de la boucle. » est atteinte par le lexique ET par une
  // reformulation : un seul sens, donc une seule lecture.
  assert.equal(code('Sortir de la boucle.'), 'break;');
  assert.equal(code('Quitter la boucle.'), 'break;');
});

// --------------------------------------------------------------------------
// 5. Aucune entrée morte
// --------------------------------------------------------------------------
test('S5 : chaque reformulation produit au moins une lecture valide', () => {
  for (const entree of REFORMULATIONS) {
    assert.ok(entree.raison.length > 5, 'reformulation sans raison : ' + entree.forme);
    assert.ok(entree.demonstration.length > 3, 'reformulation sans démonstration : ' + entree.forme);
    const candidates = reformuler(entree.demonstration);
    assert.ok(candidates.length >= 1, 'reformulation morte : ' + entree.forme);
    const v = normaliser(entree.demonstration);
    assert.ok(['normalise', 'resolu', 'ambigu'].includes(v.verdict),
      'démonstration non reconnue : ' + entree.demonstration + ' → ' + v.verdict);
  }
  assert.ok(REFORMULATIONS.length >= 90, 'table : ' + REFORMULATIONS.length);
});

test('S5 : aucune reformulation ne produit une phrase que le moteur refuse toujours', () => {
  // Une entrée dont la phrase canonique n'est jamais acceptée serait un
  // gabarit faux — c'est ce qui est arrivé à « Libère la mémoire de p. ».
  for (const entree of REFORMULATIONS) {
    const candidates = reformuler(entree.demonstration);
    const une = candidates.some(candidate => translate(candidate.phrase).status === 'translated');
    assert.ok(une, 'gabarit faux : ' + entree.forme + ' → ' + candidates.map(c => c.phrase).join(' | '));
  }
});

// --------------------------------------------------------------------------
// 6. Les deux corpus
// --------------------------------------------------------------------------
const developpement = JSON.parse(readFileSync(new URL('../test-utilisateur/corpus/corpus-developpement.json', import.meta.url), 'utf8'));
const validation = JSON.parse(readFileSync(new URL('../test-utilisateur/corpus/corpus-validation.json', import.meta.url), 'utf8'));

for (const corpus of [developpement, validation]) {
  for (const entree of corpus.entrees) {
    test(`S5 ${corpus.gele ? 'validation' : 'développement'} : ${entree.phrase}`, () => {
      const v = normaliser(entree.phrase);
      if (entree.attendu === 'accepte') {
        // Une phrase attendue acceptée et refusée est une LACUNE, pas un
        // défaut : seul le corpus de développement les gèle, parce qu'il a
        // servi à combler la table.
        if (!corpus.gele) {
          assert.ok(accepte(v), 'lacune du corpus de développement : ' + v.verdict);
          assert.equal(v.resultat.fragments[0].code.replace(/\n$/u, ''), entree.code);
        } else if (accepte(v)) {
          assert.equal(v.resultat.fragments[0].code.replace(/\n$/u, ''), entree.code,
            'ERREUR DE SENS sur le corpus gelé : ' + entree.phrase);
        }
      } else if (entree.attendu === 'ambigu') {
        assert.equal(v.verdict, 'ambigu', entree.phrase);
      } else {
        assert.ok(!accepte(v), 'acceptée à tort : ' + entree.phrase);
      }
    });
  }
}

test('S5 : le corpus de validation reste gelé et annonce sa limite', () => {
  assert.equal(validation.gele, true);
  assert.ok(validation.methode.some(ligne => ligne.includes('PAS du français spontané')));
  assert.ok(validation.methode.some(ligne => ligne.includes('ENGAGEMENT')));
  // Une seule correction y est admise, et elle porte sa raison.
  const corrigees = validation.entrees.filter(entree => entree.correction !== undefined);
  assert.equal(corrigees.length, 1);
  assert.match(corrigees[0].correction, /inventerait/u);
});

test('S5 : les deux corpus ne partagent aucune phrase', () => {
  // Sinon le corpus gelé mesurerait ce qui a servi à l'enrichir.
  const dev = new Set(developpement.entrees.map(entree => entree.phrase));
  const communes = validation.entrees.filter(entree => dev.has(entree.phrase)).map(entree => entree.phrase);
  assert.deepEqual(communes, [], 'phrases communes aux deux corpus');
});
