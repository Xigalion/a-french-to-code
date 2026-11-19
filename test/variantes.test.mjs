import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { BUDGET, LEXIQUE, normaliser, zonesProtegees } from '../src/langue/variantes.ts';
// Le lexique sert desormais TROIS langages : une entree vivante en Java seul
// n'est pas une entree morte, et ce test doit pouvoir le voir.
import { JAVA } from '../src/langages/java/langage.ts';
import { SQL } from '../src/langages/sql/langage.ts';

// Souplesse linguistique — la couche est DÉSACTIVÉE par défaut : rien dans le
// moteur ne l'appelle. Ces tests vérifient qu'elle est juste quand on
// l'appelle, et surtout qu'elle ne peut pas franchir la frontière entre
// souplesse linguistique et complétion implicite.
//
// Les cinq points que le fondateur a demandé de vérifier particulièrement :
// ambiguïtés, identifiants, expressions, chaînes littérales, informations
// manquantes. Un test nommé pour chacun.

const verdict = (phrase) => normaliser(phrase).verdict;
const code = (phrase) => {
  const v = normaliser(phrase);
  assert.ok(v.resultat !== undefined, phrase + ' : ' + JSON.stringify(v));
  return v.resultat.fragments[0].code.replace(/\n$/u, '');
};

test('souplesse : le mode strict passe sans aucune réécriture', () => {
  const v = normaliser('Crée un entier nommé age de valeur 20.');
  assert.equal(v.verdict, 'strict');
  assert.equal(v.canonique, 'Crée un entier nommé age de valeur 20.');
});

test('souplesse : variantes grammaticales et synonymes', () => {
  assert.equal(code('Créer un entier nommé age de valeur 20.'), 'int age = 20;');
  assert.equal(code('Créez un entier nommé age de valeur 20.'), 'int age = 20;');
  assert.equal(code('Crée un entier appelé age de valeur 20.'), 'int age = 20;');
  assert.equal(code('Crée un entier nommé age valant 20.'), 'int age = 20;');
  assert.equal(code('Crée un entier nommé age initialisé à 20.'), 'int age = 20;');
  assert.equal(code('Crée un nombre entier nommé age de valeur 20.'), 'int age = 20;');
  assert.equal(code('Afficher la valeur de age.'), 'printf("%d", age);');
  assert.equal(code('Sors de la boucle.'), 'break;');
});

test('souplesse : un homonyme tranché par le contexte, parce qu’une seule lecture parse', () => {
  assert.equal(verdict('Mets la valeur 5 à x.'), 'resolu');
  assert.equal(code('Mets la valeur 5 à x.'), 'x = 5;');
  assert.equal(verdict('Mets une branche sinon.'), 'resolu');
  assert.equal(code('Mets une branche sinon.'), 'else {\n    \n}');
});

// --- 1. AMBIGUÏTÉS ---------------------------------------------------------

test('souplesse : une ambiguïté de sens est refusée, les deux lectures montrées', () => {
  const v = normaliser('Montre c.');
  assert.equal(v.verdict, 'ambigu');
  assert.equal(v.code, 'AMBIGUITE_NON_RESOLUE');
  assert.equal(v.lectures.length, 2);
  const codes = v.lectures.map(lecture => lecture.code).sort();
  assert.deepEqual(codes, ['printf("%c", c);', 'printf("%d", c);']);
  assert.match(v.message, /ne choisit pas/u);
});

test('souplesse : deux lectures de MÊME sens ne sont pas une ambiguïté', () => {
  // « valant » et « initialisé à » mènent tous deux à « de valeur » : si une
  // phrase portait les deux, le sens resterait unique.
  const v = normaliser('Créer un entier appelé age valant 20.');
  assert.ok(['normalise', 'resolu'].includes(v.verdict), v.verdict);
  assert.equal(v.resultat.fragments[0].code, 'int age = 20;\n');
});

// --- 2. IDENTIFIANTS -------------------------------------------------------

test('souplesse : un identifiant qui porte un mot du lexique n’est PAS substitué', () => {
  // Une variable peut s'appeler « mets », « montre » ou « valant ».
  assert.equal(code('Crée un entier nommé mets de valeur 1.'), 'int mets = 1;');
  assert.equal(code('Crée un entier nommé montre de valeur 2.'), 'int montre = 2;');
  assert.equal(code('Déclare un entier nommé valant.'), 'int valant;');
  assert.equal(code('Affiche la valeur de mets.'), 'printf("%d", mets);');
});

test('souplesse : la zone protégée couvre le mot qui suit « nommé » et « appelé »', () => {
  const zones = zonesProtegees('Crée un entier appelé mets de valeur 1.');
  const phrase = 'Crée un entier appelé mets de valeur 1.';
  const protege = zones.some(zone => phrase.slice(zone.debut, zone.fin) === 'mets');
  assert.ok(protege, 'l’identifiant doit être protégé : ' + JSON.stringify(zones));
});

// --- 3. EXPRESSIONS --------------------------------------------------------

test('souplesse : rien n’est substitué DANS une expression entre guillemets', () => {
  // « mets » est ici un nom de variable dans l'expression.
  assert.equal(code('Affecte à total le résultat de "mets + 1".'), 'total = (mets + 1);');
  assert.equal(code('Créer un bloc si "montre > 0".'), 'if (montre > 0) {\n    \n}');
  // Et l'indice d'un élément est une expression aussi.
  assert.equal(code('Afficher l’élément "mets" de t.'), 'printf("%d", t[mets]);');
});

// --- 4. CHAÎNES LITTÉRALES -------------------------------------------------

test('souplesse : rien n’est substitué dans un texte affiché', () => {
  assert.equal(code('Afficher le texte "Créer un entier valant 20".'),
    'printf("%s", "Créer un entier valant 20");');
  assert.equal(code('Afficher le texte "mets montre".'), 'printf("%s", "mets montre");');
});

test('souplesse : rien n’est substitué dans un littéral caractère ni un chemin', () => {
  assert.equal(code('Créer un caractère nommé c de valeur \'A\'.'), "char c = 'A';");
  assert.equal(code('Affecte à f l’ouverture du fichier "montre.txt" en lecture.'),
    'f = fopen("montre.txt", "r");');
});

// --- 5. INFORMATIONS MANQUANTES -------------------------------------------

test('souplesse : une information manquante reste manquante — aucune complétion', () => {
  for (const phrase of [
    'Créer un entier appelé age.',           // la valeur manque
    'Créer un entier nommé age valant.',     // la valeur manque après le synonyme
    'Afficher la valeur de.',                // le nom manque
    'Créer un bloc si.',                     // la condition manque
  ]) {
    const v = normaliser(phrase);
    assert.equal(v.verdict, 'refus', phrase + ' → ' + v.verdict);
    assert.ok(v.resultat === undefined, 'aucun code ne doit être produit : ' + phrase);
  }
});

test('souplesse : aucune valeur par défaut n’apparaît jamais', () => {
  const v = normaliser('Créer un entier appelé age.');
  assert.equal(v.verdict, 'refus');
  assert.ok(!JSON.stringify(v).includes('= 0'), 'aucun zéro inventé : ' + JSON.stringify(v));
});

// --- Bornes et hygiène du lexique -----------------------------------------

test('souplesse : hors lexique, rien n’est tenté', () => {
  const v = normaliser('Fabrique un entier nommé age de valeur 20.');
  assert.equal(v.verdict, 'refus');
  assert.equal(v.code, 'AUCUNE_VARIANTE_CONNUE');
});

test('souplesse : la borne de substitutions refuse au lieu de deviner', () => {
  assert.ok(BUDGET.substitutions >= 1 && BUDGET.candidates >= 2);
  // Une phrase fabriquée pour dépasser la borne : le refus est nommé.
  const trop = 'Créer un nombre entier appelé age valant 20 et créer et afficher et déclarer.';
  const v = normaliser(trop);
  assert.equal(v.verdict, 'refus');
  assert.equal(v.code, 'TROP_DE_SUBSTITUTIONS');
});

test('souplesse : chaque entrée du lexique produit au moins une lecture valide', () => {
  // La garde du lot 30, appliquée au lexique : une entrée morte est un défaut.
  const phrases = {
    'créer': 'Créer un entier nommé age de valeur 20.',
    'créez': 'Créez un entier nommé age de valeur 20.',
    'afficher': 'Afficher la valeur de age.',
    'affichez': 'Affichez la valeur de age.',
    'déclarer': 'Déclarer un entier nommé age.',
    'déclarez': 'Déclarez un entier nommé age.',
    'retourner': 'Retourner la valeur 0.',
    'appelé': 'Crée un entier appelé age de valeur 20.',
    'appelée': 'Déclare une variable de type double appelée x.',
    'valant': 'Crée un entier nommé age valant 20.',
    'initialisé à': 'Crée un entier nommé age initialisé à 20.',
    'nombre entier': 'Crée un nombre entier nommé age de valeur 20.',
    'sors de la boucle': 'Sors de la boucle.',
    'passe à l’itération suivante': 'Passe à l’itération suivante.',
    'mets': 'Mets la valeur 5 à x.',
    'montre': 'Montre c.',
    // Lot S4 : deux infinitifs ajoutes au lexique parce que le corpus
    // ecrit a la main les a trouves manquants.
    'affecter': 'Affecter la valeur 5 à x.',
    'inclure': 'Inclure la bibliothèque stdio.h.',
    // Lot J9 : six infinitifs trouves par le corpus JAVA. Trois ont aussi une
    // lecture en C17, trois n'en ont qu'une par le catalogue natif de Java --
    // et c'est la raison pour laquelle ce test interroge desormais DEUX
    // arbitres. Avec trois langages, le contrat d'une entree n'est plus
    // « vivante en C17 » mais « vivante dans AU MOINS UN langage ».
    'ajouter': 'Ajouter un champ de type int nommé x.',
    'appeler': 'Appeler somme avec "1" et "2".',
    'sortir': 'Sortir de la boucle la plus intérieure.',
    'importer': 'Importer java.util.List.',
    'lancer': 'Lancer une exception IllegalStateException avec le texte "non".',
    'retirer': 'Retirer l’élément "0" de la liste notes.',
    // Lot S9 : six infinitifs trouves par le corpus SQL. Aucun n'a de lecture
    // en C17 ni en Java : ils vivent par le catalogue natif de SQL seul, ce
    // qui fait passer ce test de DEUX arbitres a TROIS. Le contrat d'une
    // entree reste « vivante dans AU MOINS UN langage ».
    'supprimer': 'Supprimer la table eleves.',
    'ordonner': 'Ordonner les lignes par nom en ordre croissant.',
    'regrouper': 'Regrouper les lignes par ville.',
    'insérer': 'Insérer dans la table eleves une ligne dont nom vaut le texte "Zoe".',
    'ouvrir': 'Ouvrir une transaction.',
    'modifier': 'Modifier la table eleves en donnant à age la valeur 0 là où "id = 1".',
  };
  /** L'arbitre Java, reduit a ce dont ce test a besoin : le catalogue natif. */
  const arbitreJava = (phrase) => {
    const natif = JAVA.natif?.(phrase, { classeEnglobante: 'Eleve' });
    if (natif === undefined || natif.status !== 'rendu') return { accepte: false };
    return { accepte: true, sens: 'natif:' + natif.kind + ':' + natif.code,
      intention: natif.kind, apercu: natif.code, resultat: natif };
  };
  /** L'arbitre SQL, reduit de meme : SQL n'a QUE son catalogue natif. */
  const arbitreSql = (phrase) => {
    const natif = SQL.natif?.(phrase);
    if (natif === undefined || natif.status !== 'rendu') return { accepte: false };
    return { accepte: true, sens: 'natif:' + natif.kind + ':' + natif.code,
      intention: natif.kind, apercu: natif.code, resultat: natif };
  };
  for (const entree of LEXIQUE) {
    const phrase = phrases[entree.libre];
    assert.ok(phrase !== undefined, 'entrée sans phrase de démonstration : ' + entree.libre);
    const verdicts = [normaliser(phrase).verdict, normaliser(phrase, { arbitre: arbitreJava }).verdict,
      normaliser(phrase, { arbitre: arbitreSql }).verdict];
    assert.ok(verdicts.some(verdict => ['normalise', 'resolu', 'ambigu'].includes(verdict)),
      'entrée morte dans TOUS les langages : ' + entree.libre + ' → ' + verdicts.join(', '));
    assert.ok(entree.motif.length > 0, 'entrée sans motif : ' + entree.libre);
  }
});

test('souplesse : le mode strict est intact sur TOUT le catalogue', () => {
  const CATALOGUE = readFileSync(new URL('../docs/CATALOGUE.md', import.meta.url), 'utf8');
  const phrases = CATALOGUE.split('\n').filter(ligne => ligne.startsWith('| `'))
    .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1]).filter(Boolean);
  let traduites = 0;
  for (const phrase of phrases) {
    if (translate(phrase).status !== 'translated') continue;
    traduites++;
    const v = normaliser(phrase);
    assert.equal(v.verdict, 'strict', phrase + ' a traversé la couche');
    assert.equal(v.canonique, phrase);
  }
  assert.ok(traduites >= 130, 'phrases traduites : ' + traduites);
});
