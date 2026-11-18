import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { GENRES, LANGAGES, langagePour, rendre } from '../src/langages/registre.ts';
import { JAVA } from '../src/langages/java/langage.ts';
// Importer un module de langage l'INSCRIT : sans cette ligne, Python n'est pas
// dans le registre et le test de non-regression ne prouverait rien.
import '../src/langages/python/langage.ts';
import { PORTEES_JAVA, EN_TETES_JAVA, rendreJava } from '../src/langages/java/rendu.ts';
import { RAISONS_JAVA } from '../src/langages/java/raisons.ts';
import { rendreExpressionJava, nomJavaValide, MOTS_RESERVES_JAVA } from '../src/langages/java/expression.ts';

// Lot J1 — le socle de Java-A.
//
// Ce que ces tests doivent etablir :
//   1. la partition des 84 genres est EXACTEMENT celle du document approuve,
//      et les deux inventaires ne peuvent pas diverger ;
//   2. toute intention non portee a une raison ECRITE ;
//   3. aucune intention portee ne produit un code vide ;
//   4. le Java produit est celui de la specification, pour un echantillon
//      choisi parce qu'il porte une decision ;
//   5. ce que Java ne peut pas ecrire est refuse, pas approxime ;
//   6. C17 et Python ne bougent pas.

const CLASSEMENT = JSON.parse(
  readFileSync(new URL('../docs/phase3/classement-java.json', import.meta.url), 'utf8'));
const SPEC = JSON.parse(
  readFileSync(new URL('../docs/phase3/catalogue-java.json', import.meta.url), 'utf8'));

const REPRISES = Object.keys(CLASSEMENT.classes.reprise.intentions);
const ADAPTATIONS = Object.keys(CLASSEMENT.classes.adaptation.intentions);
const REFUS = Object.keys(CLASSEMENT.classes.refus.intentions);

test('J1 : la partition du document et celle du code sont la MEME', () => {
  // Le document est approuve ; le code doit s'y conformer, pas l'inverse.
  assert.equal(CLASSEMENT.total, 84);
  assert.equal(REPRISES.length + ADAPTATIONS.length + REFUS.length, 84);
  assert.deepEqual([...PORTEES_JAVA].sort(), [...REPRISES, ...ADAPTATIONS].sort());
  assert.deepEqual([...RAISONS_JAVA.keys()].sort(), [...REFUS].sort());
  // Et la partition couvre la partition du moteur, sans en inventer un genre.
  for (const genre of [...PORTEES_JAVA, ...RAISONS_JAVA.keys()]) {
    assert.ok(GENRES.has(genre), 'genre inconnu du moteur : ' + genre);
  }
  assert.equal(PORTEES_JAVA.size + RAISONS_JAVA.size, GENRES.size);
});

test('J1 : chaque refus porte une raison ecrite, et nomme un remplacement', () => {
  for (const [genre, raison] of RAISONS_JAVA) {
    assert.ok(raison.length > 80, 'raison trop courte pour apprendre quelque chose : ' + genre);
    // Un refus sans remplacement est permis, mais UN SEUL l'est : la garde
    // d'en-tete, parce que le probleme qu'elle resout n'existe pas en Java.
    const nomme = /«|Java|classe|liste|tableau|visibilité|interface/u.test(raison);
    assert.ok(nomme, 'refus qui ne designe rien : ' + genre);
  }
  assert.equal(RAISONS_JAVA.size, 27);
});

test('J1 : Java est inscrit, et seul .java lui revient', () => {
  assert.equal(LANGAGES.get('java'), JAVA);
  assert.equal(langagePour('.java'), JAVA);
  assert.equal(langagePour('.c')?.nom, 'c17');
  assert.equal(langagePour('.py')?.nom, 'python');
  assert.equal(langagePour('.jav'), undefined);
  assert.equal(JAVA.blocs, 'accolades');
  assert.equal(JAVA.commentaire('Crée un entier nommé age de valeur 20.'),
    '// Crée un entier nommé age de valeur 20.');
});

// --- le Java produit, pour un echantillon qui porte une decision -----------
const ATTENDUS = [
  // J1 : le point d'entree est EXPLICITE, et sa signature est celle que la
  // machine virtuelle exige.
  ['Crée la fonction principale.', 'public static void main(String[] args) {\n    \n}\n'],
  // J2 : `print`, qui n'ajoute rien. `println` a sa propre phrase (lot J3).
  ['Affiche la valeur de n.', 'System.out.print(n);\n'],
  ['Affiche le texte "bonjour".', 'System.out.print("bonjour");\n'],
  ['Affiche un retour à la ligne.', 'System.out.println();\n'],
  ['Affiche n en hexadécimal.', 'System.out.printf("%x", n);\n'],
  // Le parenthesage du lot 6 est conserve, et `/` ne demande AUCUNE
  // adaptation : meme troncature qu'en C17.
  ['Affecte à n le résultat de "a / b".', 'n = (a / b);\n'],
  ['Affecte à n le résultat de "a % b".', 'n = (a % b);\n'],
  // Aucune declaration de la variable de boucle.
  ['Crée une boucle pour i de valeur initiale "0" tant que "i < 10" avec mise à jour "i + 1".',
    'for (i = 0; i < 10; i = (i + 1)) {\n    \n}\n'],
  // Une dimension EST une allocation en Java, et tout y est mis a zero.
  ['Déclare un tableau de type int nommé notes de dimension 10.',
    'int[] notes = new int[10];\n'],
  // Une chaine est un OBJET : la dimension de la phrase n'a pas d'equivalent.
  ['Crée un tableau de type char nommé s de dimension 32 avec le texte "Ada".',
    'String s = "Ada";\n'],
  // Une structure devient une classe, un champ reste un champ.
  ['Déclare une structure nommée Point.', 'class Point {\n    \n}\n'],
  ['Ajoute un champ de type int nommé x.', 'int x;\n'],
  ['Ajoute un champ de type char nommé nom de dimension 32.', 'char[] nom = new char[32];\n'],
  // Une variable de type structure devient un objet, et un objet naît.
  ['Déclare une variable de type structure Point nommée p.', 'Point p = new Point();\n'],
  ['Affecte la valeur 5 au champ x de p.', 'p.x = 5;\n'],
  ['Affiche le champ x de p.', 'System.out.print(p.x);\n'],
  // J3 : `static`, parce que la phrase du catalogue partage decrit une
  // fonction libre, et qu'une methode appelee depuis `main` doit l'etre.
  ['Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.',
    'static int somme(int a, int b) {\n    \n}\n'],
  ['Retourne le résultat de "a + b".', 'return (a + b);\n'],
  ['Appelle somme avec "1" et "2".', 'somme(1, 2);\n'],
  // Le suffixe `f` : Java refuse `float x = 1.5;`, C17 l'accepte.
  ['Crée une variable de type float nommée x avec le résultat de "1.5".', 'float x = 1.5f;\n'],
  ['Crée une variable de type double nommée y avec le résultat de "1.5".', 'double y = 1.5;\n'],
  // ... mais jamais sur une expression : `a + b` ne recoit pas de suffixe.
  ['Affecte à x le résultat numérique de "a + b".', 'x = (a + b);\n'],
  ['Affiche x en notation fixe avec 2 décimales.', 'System.out.printf("%.2f", x);\n'],
  ['Déclare une constante de type int nommée MAX avec le résultat de "100".', 'final int MAX = 100;\n'],
  ['Vérifie que "x > 0".', 'assert x > 0;\n'],
];

test('J1 : le Java produit est celui de la specification', () => {
  for (const [phrase, attendu] of ATTENDUS) {
    const resultat = translate(phrase);
    assert.equal(resultat.status, 'translated', 'phrase refusee par le moteur : ' + phrase);
    const rendu = rendre(JAVA, resultat.instruction);
    assert.equal(rendu.status, 'rendu', phrase + ' → ' + JSON.stringify(rendu));
    assert.equal(rendu.code, attendu, phrase);
  }
});

// --- ce que Java refuse, et il le NOMME ------------------------------------
const REFUSES = [
  // Les pointeurs, toute la famille.
  'Déclare un pointeur de type int nommé p.',
  'Affecte l’adresse de x à p.',
  'Affiche la valeur pointée par p.',
  // La memoire.
  'Libère la mémoire pointée par p.',
  'Affiche la taille du type int.',
  // Le preprocesseur.
  'Inclue la bibliothèque stdio.h.',
  'Inclue la bibliothèque limits.h.',
  // Les fichiers dont la forme n'existe pas.
  'Déclare un fichier nommé f.',
  'Ferme le fichier f.',
  // Le synonyme de type.
  'Déclare le synonyme Noeud pour la structure Noeud.',
];

test('J1 : une intention non portee est un refus NOMME, jamais un code vide', () => {
  for (const phrase of REFUSES) {
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') continue;  // phrase hors catalogue : rien a prouver ici
    const rendu = rendre(JAVA, resultat.instruction);
    assert.equal(rendu.status, 'refus', 'Java aurait du refuser : ' + phrase);
    assert.equal(rendu.code, 'INTENTION_NON_PORTEE', phrase);
    assert.ok(rendu.raison.length > 80, 'refus sans explication : ' + phrase);
  }
});

test('J1 : une CONSTRUCTION non portee est refusee dans une intention portee', () => {
  // L'intention est portee ; ce qu'elle contient ne l'est pas. C'est la
  // distinction que le registre modelise depuis le lot P3.
  const cas = [
    // Un entier n'est pas une condition en Java : `if (n)` ne compile pas, et
    // ajouter « != 0 » serait choisir un sens que personne n'a donne.
    'Crée un bloc si "n".',
    // Un pointeur dans une expression. Le profil ENTIER les refuse deja
    // depuis le lot 6 — gele —, donc c'est le profil NUMERIQUE qu'il faut
    // eprouver : la ou C17 les accepte, Java doit refuser.
    'Affecte à x le résultat numérique de "*p".',
    'Affecte à x le résultat numérique de "&y".',
    // Un mot reserve de Java, valide comme nom en C17.
    'Crée un entier nommé class de valeur 1.',
    'Crée un entier nommé final de valeur 1.',
    // La fleche n'existe pas.
    'Affecte la valeur 5 au champ x pointé par q.',
  ];
  let refuses = 0;
  for (const phrase of cas) {
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') continue;
    const rendu = rendre(JAVA, resultat.instruction);
    assert.equal(rendu.status, 'refus', 'Java aurait du refuser la construction : ' + phrase);
    assert.equal(rendu.code, 'CONSTRUCTION_NON_PORTEE', phrase);
    assert.ok(rendu.raison.length > 60, 'refus sans explication : ' + phrase);
    refuses++;
  }
  assert.ok(refuses >= 4, 'cas reellement eprouves : ' + refuses);
});

test('J1 : les mots reserves de Java sont refuses comme noms', () => {
  // C-A valide les noms contre les mots-cles de C17 : c'est au langage cible
  // de connaitre les siens.
  assert.ok(MOTS_RESERVES_JAVA.has('class'));
  assert.ok(MOTS_RESERVES_JAVA.has('new'));
  assert.ok(MOTS_RESERVES_JAVA.has('true'));
  assert.ok(!MOTS_RESERVES_JAVA.has('age'));
  assert.equal(nomJavaValide('age'), undefined);
  assert.ok((nomJavaValide('class') ?? '').includes('mot réservé'));
});

test('J1 : aucune intention portee ne produit un code vide', () => {
  // Une intention annoncee portee mais inatteignable est une intention MORTE,
  // et le lot 30 en avait trouve une en C. La garde est generale ici.
  const CATALOGUE = readFileSync(new URL('../docs/CATALOGUE.md', import.meta.url), 'utf8');
  const phrases = CATALOGUE.split('\n').filter(l => l.startsWith('| `'))
    .map(l => /^\| `(.+?)` \|/u.exec(l)?.[1]).filter(p => p !== undefined);
  const vues = new Set();
  for (const phrase of phrases) {
    const resultat = translate(phrase);
    if (resultat.status !== 'translated') continue;
    const rendu = rendre(JAVA, resultat.instruction);
    if (rendu.status !== 'rendu') continue;
    assert.ok(rendu.code.trim() !== '', 'code vide : ' + phrase);
    assert.ok(rendu.code.endsWith('\n'), 'fragment sans fin de ligne : ' + phrase);
    vues.add(resultat.instruction.kind);
  }
  // Toute intention PORTEE doit etre atteignable par au moins une phrase du
  // catalogue. Celles qui ne le sont pas sont listees, avec leur raison.
  const INATTEINGNABLES = new Set([
    // `Affiche x en décimal signé` est porte par NUMERIC_PRINT, dont le
    // format `unsigned` est refuse : la phrase du catalogue tombe donc en
    // refus de CONSTRUCTION, ce que le test precedent verifie. Les deux
    // autres formats, eux, sont couverts par ATTENDUS.
  ]);
  const manquantes = [...PORTEES_JAVA].filter(k => !vues.has(k) && !INATTEINGNABLES.has(k));
  assert.deepEqual(manquantes, [], 'intentions portees qu\'aucune phrase n\'atteint');
});

test('J1 : les en-tetes de bloc ouvrent et ferment, et laissent le corps vide', () => {
  for (const genre of EN_TETES_JAVA) assert.ok(PORTEES_JAVA.has(genre), genre);
  const resultat = translate('Crée un bloc si "x > 0".');
  assert.equal(resultat.status, 'translated');
  const rendu = rendre(JAVA, resultat.instruction);
  assert.equal(rendu.code, 'if (x > 0) {\n    \n}\n');
  // Aucun `return`, aucun `break`, aucune instruction ajoutee dans le corps.
  assert.ok(!rendu.code.includes('return'));
});

test('J1 : la specification couvre les 57 intentions portees', () => {
  const couvertes = new Set(SPEC.formulations.filter(f => f.intention !== null).map(f => f.intention));
  assert.equal(couvertes.size, PORTEES_JAVA.size);
  for (const genre of PORTEES_JAVA) assert.ok(couvertes.has(genre), 'non specifiee : ' + genre);
});

test('J1 : C17 et Python ne bougent pas', () => {
  // Java est ADDITIF. Le differentiel le prouve a grande echelle ; ce test
  // tient la garde la moins chere, a chaque execution de la suite.
  const c17 = translate('Affiche la valeur de n.');
  assert.equal(c17.status, 'translated');
  assert.equal(rendre(LANGAGES.get('c17'), c17.instruction).code, 'printf("%d", n);\n');
  const python = rendre(LANGAGES.get('python'), c17.instruction);
  assert.equal(python.status, 'rendu');
  assert.equal(python.code, 'print(n, end="")\n');
});

test('J1 : le rendu d\'expression refuse les pointeurs et accepte l\'indexation', () => {
  const t = translate('Affecte à n le résultat numérique de "t[i] + 1".');
  assert.equal(t.status, 'translated');
  assert.equal(rendre(JAVA, t.instruction).code, 'n = (t[i] + 1);\n');
  const car = translate('Affecte à n le résultat numérique de "\'A\' + 1".');
  if (car.status === 'translated') {
    assert.equal(rendre(JAVA, car.instruction).code, "n = ('A' + 1);\n");
  }
  // Un arbre de pointeur, directement.
  const resultat = rendreExpressionJava({ kind: 'dereference', operand: { kind: 'name', name: 'p', range: { start: 0, end: 1 } }, range: { start: 0, end: 2 } });
  assert.equal(resultat.status, 'refus');
  assert.ok(resultat.raison.includes('pointeur'));
});
