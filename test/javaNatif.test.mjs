import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JAVA } from '../src/langages/java/langage.ts';
import { MOTIFS, EXEMPLES_JAVA, analyserCatalogueJava } from '../src/langages/java/catalogue.ts';
import { EN_TETES_NATIFS_JAVA, rendreJavaNatif } from '../src/langages/java/renduNatif.ts';
import { CODES_JAVA, expliquerJava } from '../src/langages/java/informations.ts';
import { porteesDe } from '../src/langages/java/portees.ts';
import { classeEnglobante } from '../src/langages/java/placement.ts';
import { translate } from '../src/translate.ts';

// Lots J3 a J8 — le catalogue NATIF de Java.
//
// 82 notions qu'aucune phrase du catalogue partage ne porte : l'objet,
// l'interface, l'exception, la collection typee. Ce que les tests doivent
// etablir :
//   1. chaque forme publiee est reconnue, et produit le genre annonce ;
//   2. le rendu est EXACTEMENT celui de la specification approuvee ;
//   3. aucune intention n'est MORTE, et aucune information n'est orpheline ;
//   4. ce qui manque est refuse avec un diagnostic qui APPREND quelque chose ;
//   5. rien de tout cela n'atteint un .c ni un .py.

const SPEC = JSON.parse(
  readFileSync(new URL('../docs/phase3/catalogue-java.json', import.meta.url), 'utf8'));
const CONTEXTE = { classeEnglobante: 'Eleve' };

test('J3-J8 : les 82 formes natives sont reconnues et rendues', () => {
  const natives = SPEC.formulations.filter(f => f.origine === 'native');
  assert.equal(natives.length, 86, 'la specification a bouge sans que le test le dise');
  for (const { phrase, kind } of EXEMPLES_JAVA) {
    const resultat = JAVA.natif(phrase, CONTEXTE);
    assert.notEqual(resultat, undefined, 'declinee par le catalogue : ' + phrase);
    assert.equal(resultat.status, 'rendu',
      phrase + ' → ' + JSON.stringify(resultat).slice(0, 180));
    assert.equal(resultat.kind, kind, phrase);
    assert.ok(resultat.code.endsWith('\n'), 'fragment sans fin de ligne : ' + phrase);
    assert.ok(resultat.code.trim() !== '', 'code vide : ' + phrase);
  }
  assert.equal(EXEMPLES_JAVA.length, MOTIFS.length);
});

// Le rendu exact, pour les formes qui portent une DECISION. Les 87 sont
// verifiees ci-dessus ; celles-ci le sont a la lettre, parce qu'un ecart y
// serait un changement de sens et non un detail de forme.
const EXACTS = [
  // J1 : une seule classe publique par fichier.
  ['Crée une classe nommée Eleve.', 'public class Eleve {\n    \n}\n'],
  ['Crée une classe interne nommée Noeud.', 'class Noeud {\n    \n}\n'],
  // Les suffixes que Java EXIGE : sans eux le compilateur refuse le litteral.
  ['Crée un entier long nommé grand de valeur 10000000000.', 'long grand = 10000000000L;\n'],
  ['Crée un réel simple nommé x de valeur "1.5".', 'float x = 1.5f;\n'],
  // ... mais jamais sur une expression.
  ['Crée un réel simple nommé x de valeur "a + b".', 'float x = (a + b);\n'],
  // J2 : les deux affichages sont DEUX phrases.
  ['Affiche la valeur de n et passe à la ligne.', 'System.out.println(n);\n'],
  // J3 : `+= 1` et non `++`, et `equals` et non `==`.
  ['Incrémente n.', 'n += 1;\n'],
  ['Décrémente n.', 'n -= 1;\n'],
  ['Affecte à egal la comparaison des chaînes a et b.', 'egal = a.equals(b);\n'],
  // J6 : les generiques EMBALLENT. `List<int>` n'existe pas.
  ['Crée une liste de type int nommée notes.', 'List<Integer> notes = new ArrayList<>();\n'],
  ['Crée une table de type int nommée notes avec des clés textuelles.',
    'Map<String, Integer> notes = new HashMap<>();\n'],
  ['Crée un ensemble de type chaîne nommé vus.', 'Set<String> vus = new HashSet<>();\n'],
  // J10 : le mot « tableau » et le mot « liste » donnent deux codes.
  ['Affiche l’élément "0" du tableau notes.', 'System.out.print(notes[0]);\n'],
  ['Affecte à n l’élément "0" de la liste notes.', 'n = notes.get(0);\n'],
  ['Affecte à n la taille du tableau notes.', 'n = notes.length;\n'],
  ['Affecte à n la taille de la liste notes.', 'n = notes.size();\n'],
  // J7 : le constructeur prend le nom de sa CLASSE, lu du contexte.
  ['Crée un constructeur qui ne prend rien.', 'public Eleve() {\n    \n}\n'],
  ['Crée un constructeur qui prend un int nommé age.', 'public Eleve(int age) {\n    \n}\n'],
  ['Affecte au champ age la valeur du paramètre age.', 'this.age = age;\n'],
  // J8 : une methode attendue est une LIGNE, pas un bloc.
  ['Ajoute une méthode attendue nommée afficher qui ne retourne rien.', 'void afficher();\n'],
  ['Ajoute une méthode abstraite nommée aire qui retourne un int.', 'abstract int aire();\n'],
  ['Crée une variable de type Affichable nommée a comme un objet de la classe Eleve.',
    'Affichable a = new Eleve();\n'],
  // @Override est VERIFIE par javac : deux lignes, une intention.
  ['Crée une méthode redéfinie nommée afficher qui ne retourne rien.',
    '@Override\npublic void afficher() {\n    \n}\n'],
  // J9 : le bloc essaie avec ressource ferme tout seul.
  ['Crée un bloc essaie avec un lecteur nommé f sur le fichier "notes.txt".',
    'try (BufferedReader f = new BufferedReader(new FileReader("notes.txt"))) {\n    \n}\n'],
  ['Importe java.util.List.', 'import java.util.List;\n'],
  ['Lance une exception IllegalArgumentException avec le texte "âge négatif".',
    'throw new IllegalArgumentException("âge négatif");\n'],
];

test('J3-J8 : le rendu exact des formes qui portent une decision', () => {
  for (const [phrase, attendu] of EXACTS) {
    const resultat = JAVA.natif(phrase, CONTEXTE);
    assert.notEqual(resultat, undefined, 'declinee : ' + phrase);
    assert.equal(resultat.status, 'rendu', phrase + ' → ' + JSON.stringify(resultat).slice(0, 150));
    assert.equal(resultat.code, attendu, phrase);
  }
});

test('J3-J8 : un constructeur SANS classe englobante est refuse, pas devine', () => {
  // Regle 3 : A n'invente pas le nom de la classe. Le refus est nomme et ne
  // produit aucun fragment.
  for (const phrase of ['Crée un constructeur qui ne prend rien.',
    'Crée un constructeur qui prend un int nommé age.']) {
    const resultat = JAVA.natif(phrase);
    assert.equal(resultat.status, 'refus', phrase);
    assert.equal(resultat.code, 'CONSTRUCTION_NON_PORTEE');
    assert.ok(resultat.message.includes('nom de sa classe'), resultat.message);
  }
  // Et le contexte est LU du document, pas demande dans la phrase.
  const doc = 'public class Eleve {\n\n}\n';
  assert.equal(classeEnglobante(doc, doc.indexOf('\n\n') + 1), 'Eleve');
  assert.equal(classeEnglobante('\n', 0), undefined);
  const imbrique = 'public class A {\n    class B {\n\n    }\n}\n';
  assert.equal(classeEnglobante(imbrique, imbrique.indexOf('{\n\n') + 2), 'B',
    'la classe la plus PROCHE, pas la plus exterieure');
});

test('J3-J8 : aucune intention native n est morte', () => {
  // Le lot 30 avait trouve une intention morte en C : atteignable par aucune
  // phrase. La garde est generale ici — chaque genre doit avoir un motif.
  const genres = new Set(MOTIFS.map(m => m.kind));
  const rendus = new Set();
  for (const { phrase } of EXEMPLES_JAVA) {
    const r = JAVA.natif(phrase, CONTEXTE);
    if (r?.status === 'rendu') rendus.add(r.kind);
  }
  assert.deepEqual([...genres].sort(), [...rendus].sort(),
    'un genre a un motif mais aucune phrase ne le rend, ou l inverse');
});

test('J3-J8 : aucune information n est orpheline, et chacune est atteignable', () => {
  const vues = new Set();
  for (const { kind } of EXEMPLES_JAVA) for (const i of expliquerJava(kind, { start: 0, end: 1 })) vues.add(i.code);
  // Les informations posees sur les intentions PARTAGEES, elles, s'atteignent
  // par le catalogue partage : on les ajoute en les demandant par leur genre.
  for (const genre of JAVA.portees) for (const i of expliquerJava(genre, { start: 0, end: 1 })) vues.add(i.code);
  const orphelines = CODES_JAVA.filter(code => !vues.has(code));
  assert.deepEqual(orphelines, [], 'informations ecrites et jamais atteintes');
  assert.equal(CODES_JAVA.length, 28);
});

test('J3-J8 : les informations ne se repetent pas, et portent la phrase entiere', () => {
  for (const { kind } of EXEMPLES_JAVA) {
    const informations = expliquerJava(kind, { start: 0, end: 10 });
    const codes = informations.map(i => i.code);
    assert.equal(new Set(codes).size, codes.length, 'information en double : ' + kind);
    for (const i of informations) {
      assert.equal(i.severity, 'information');
      assert.deepEqual(i.range, { start: 0, end: 10 });
      assert.ok(i.message.length > 80, 'information trop courte : ' + i.code);
    }
  }
});

test('J3-J8 : trois informations corrigent une regle apprise ailleurs', () => {
  // C'est leur raison d'etre : un eleve venu du C ou de Python a des reflexes
  // qui sont faux ici, et le silence les laisserait intacts.
  const trouver = (code) => {
    for (const genre of [...MOTIFS.map(m => m.kind), ...JAVA.portees]) {
      const i = expliquerJava(genre, { start: 0, end: 1 }).find(x => x.code === code);
      if (i !== undefined) return i.message;
    }
    return undefined;
  };
  assert.ok((trouver('JAVA_SWITCH_FALLS_THROUGH') ?? '').includes('Python'));
  assert.ok((trouver('JAVA_TRY_WITH_RESOURCES_CLOSES') ?? '').includes('C17'));
  assert.ok((trouver('JAVA_MODULO_FOLLOWS_DIVIDEND') ?? '').includes('Python'));
  // Et deux disent une LACUNE DE A, pas une propriete de Java.
  assert.ok((trouver('JAVA_STATIC_CANNOT_CALL_INSTANCE') ?? '').includes('SANS ÉTAT'));
  assert.ok((trouver('JAVA_PRIVATE_IS_NOT_CHECKED_BY_A') ?? '').includes('AUCUN'));
});

test('J3-J8 : une phrase incomplete recoit un diagnostic qui APPREND', () => {
  const cas = [
    ['Crée une classe.', 'MISSING_CLASS_NAME'],
    ['Crée une interface.', 'MISSING_CLASS_NAME'],
    // « Augmente » ne dit pas le pas : A ne le devine pas. Meme refus qu'en
    // Python, et pour la meme raison.
    ['Augmente compteur.', 'MISSING_STEP'],
    ['Diminue compteur.', 'MISSING_STEP'],
    // Une liste Java est TYPEE : sans type, rien a ecrire.
    ['Crée une liste nommée notes.', 'MISSING_ELEMENT_TYPE'],
    // Une methode porte une visibilite ET un « static » : A ne choisit pas.
    ['Crée une méthode nommée f qui ne retourne rien.', 'MISSING_METHOD_KIND'],
  ];
  for (const [phrase, code] of cas) {
    const resultat = JAVA.natif(phrase, CONTEXTE);
    assert.notEqual(resultat, undefined, 'declinee au lieu d etre refusee : ' + phrase);
    assert.equal(resultat.status, 'refus', phrase);
    assert.equal(resultat.code, code, phrase + ' → ' + resultat.code);
    assert.ok(resultat.message.length > 40, phrase);
  }
});

test('J3-J8 : un mot reserve de Java est refuse comme nom', () => {
  const resultat = JAVA.natif('Déclare un booléen nommé class.', CONTEXTE);
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'JAVA_KEYWORD_IDENTIFIER');
  // L'intervalle designe le MOT, pas la phrase : un diagnostic de nom pointe
  // le nom.
  assert.ok(resultat.range.end - resultat.range.start === 'class'.length,
    JSON.stringify(resultat.range));
});

test('J3-J8 : du texte en trop est refuse, et la phrase reste complete avant', () => {
  const resultat = JAVA.natif('Crée une classe nommée Eleve et voila.', CONTEXTE);
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'UNEXPECTED_TEXT');
});

test('J3-J8 : une phrase hors catalogue est DECLINEE, pas refusee', () => {
  // La difference est capitale : decliner laisse vivre le diagnostic du
  // catalogue partage, refuser l'ecrase.
  for (const phrase of ['Crée la fonction principale.', 'Affiche la valeur de n.',
    'Bonjour tout le monde.', 'Inclue la bibliothèque stdio.h.']) {
    assert.equal(analyserCatalogueJava(phrase), undefined, 'aurait du etre declinee : ' + phrase);
  }
});

test('J3-J8 : le catalogue natif Java n atteint ni un .c ni un .py', () => {
  // Les phrases natives ne sont pas dans `translate` : un .c ne peut pas les
  // voir. C'est la meme garantie que pour Python.
  for (const { phrase } of EXEMPLES_JAVA) {
    const partage = translate(phrase);
    if (partage.status !== 'translated') continue;
    // Si le catalogue partage la reconnait, c'est que la phrase native lui est
    // IDENTIQUE : ce serait une intention morte, et le test precedent
    // l'interdit deja. On le verifie ici du cote du moteur.
    assert.fail('phrase native reconnue par le catalogue partage : ' + phrase);
  }
});

test('J3-J8 : chaque genre natif a une portee, et les quatre sont demandees', () => {
  const vues = new Set();
  for (const { kind } of EXEMPLES_JAVA) for (const p of porteesDe(kind)) vues.add(p);
  assert.deepEqual([...vues].sort(), ['classe', 'fichier', 'interface', 'methode'],
    'les quatre portees doivent etre demandees par au moins un genre natif');
});

test('J3-J8 : le rendu natif refuse ce qu il ne porte pas, sans approximer', () => {
  // Un pointeur dans une expression d'une phrase native.
  const resultat = rendreJavaNatif({ kind: 'JAVA_LISTE_AJOUTE',
    parameters: { liste: 'notes',
      expression: { kind: 'dereference', operand: { kind: 'name', name: 'p', range: { start: 0, end: 1 } }, range: { start: 0, end: 2 } } } });
  assert.equal(resultat.status, 'refus');
  assert.ok(resultat.raison.includes('pointeur'));
});

test('J3-J8 : les en-tetes natifs ouvrent un bloc, les autres non', () => {
  for (const { phrase, kind } of EXEMPLES_JAVA) {
    const resultat = JAVA.natif(phrase, CONTEXTE);
    if (resultat?.status !== 'rendu') continue;
    const ouvre = resultat.code.includes('{\n    \n}') || resultat.code.endsWith('{\n    \n');
    assert.equal(ouvre, EN_TETES_NATIFS_JAVA.has(kind),
      kind + ' : en-tete declare ' + EN_TETES_NATIFS_JAVA.has(kind) + ', rendu ' + ouvre
      + '\n' + JSON.stringify(resultat.code));
  }
});
