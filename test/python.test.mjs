// Lot P3 — les premières intentions Python.
//
// Ce que ces tests doivent établir :
//   1. la PARTITION : chacun des 84 genres est soit porté, soit refusé avec
//      une raison écrite. Ni trou, ni doublon, ni nom fantôme ;
//   2. l'EXACTITUDE : le Python produit, caractère par caractère ;
//   3. les REFUS : une construction dont le sens change est refusée, pas
//      traduite — et le refus nomme la construction native équivalente ;
//   4. l'ABSENCE D'AJOUT : aucun `pass`, aucun séparateur, aucune valeur.
import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { GENRES, langagePour, rendre } from '../src/langages/registre.ts';
import { PYTHON } from '../src/langages/python/langage.ts';
import { PORTEES_PYTHON, EN_TETES_PYTHON } from '../src/langages/python/rendu.ts';
import { RAISONS_PYTHON } from '../src/langages/python/raisons.ts';
import { MOTS_RESERVES_PYTHON } from '../src/langages/python/expression.ts';
import { expliquerPython } from '../src/langages/python/informations.ts';
import { planifierPython } from '../src/langages/python/placement.ts';
import { readFileSync } from 'node:fs';

/** Rend une phrase française en Python, par le registre. */
function py(phrase) {
  const resultat = translate(phrase);
  assert.equal(resultat.status, 'translated', 'phrase refusée par le moteur : ' + phrase);
  return rendre(PYTHON, resultat.instruction);
}
const code = phrase => {
  const rendu = py(phrase);
  assert.equal(rendu.status, 'rendu', 'refus inattendu : ' + (rendu.raison ?? ''));
  return rendu.code;
};

test('P3 : les 84 genres sont partitionnés, sans trou, sans doublon, sans fantôme', () => {
  const manquants = [...GENRES].filter(g => !PORTEES_PYTHON.has(g) && !RAISONS_PYTHON.has(g));
  assert.deepEqual(manquants, [], 'genres sans décision de portage');
  const doubles = [...GENRES].filter(g => PORTEES_PYTHON.has(g) && RAISONS_PYTHON.has(g));
  assert.deepEqual(doubles, [], 'genres à la fois portés et refusés');
  // Un nom dans les raisons qui n'est pas un genre est un fantôme : c'est
  // exactement ce que le lot P3 a trouvé avec NUMERIC_CONVERT.
  const fantomes = [...RAISONS_PYTHON.keys()].filter(g => !GENRES.has(g));
  assert.deepEqual(fantomes, [], 'raisons écrites pour des noms qui ne sont pas des genres');
  assert.equal(PORTEES_PYTHON.size, 32);
  assert.equal(RAISONS_PYTHON.size, 52);
  assert.equal(PORTEES_PYTHON.size + RAISONS_PYTHON.size, 84);
});

test('P3 : chaque refus nomme la construction native, et n’interdit rien', () => {
  for (const [genre, raison] of RAISONS_PYTHON) {
    assert.ok(raison.length > 120, 'raison trop courte pour apprendre quoi que ce soit : ' + genre);
    assert.ok(/^(ATTENTE|NOTION_ABSENTE|FORME_AUTRE)/u.test(raison), 'refus sans sorte : ' + genre);
    // Consigne du fondateur : un refus de portage n'est pas une interdiction
    // d'enseigner. Chaque raison doit donc dire par quoi la compétence passe.
    assert.ok(/s’enseigne|s’enseignera|recevra|recevront|seront écrites|s’écrit/u.test(raison),
      'raison qui refuse sans nommer la suite : ' + genre);
  }
});

test('P3 : Python s’inscrit au registre par son module, et par son extension', () => {
  assert.equal(langagePour('.py'), PYTHON);
  assert.equal(langagePour('.PY'), PYTHON);
  assert.equal(PYTHON.blocs, 'indentation');
  assert.equal(langagePour('.c').nom, 'c17', 'inscrire Python ne doit pas déplacer C17');
});

// --------------------------------------------------------------------------
// Exactitude
// --------------------------------------------------------------------------
const EXACTS = [
  ['Crée un entier nommé age de valeur 20.', 'age = 20\n'],
  ['Affecte la valeur 5 à compteur.', 'compteur = 5\n'],
  ['Affecte à total le résultat de "a + b".', 'total = (a + b)\n'],
  ['Affecte à total le résultat numérique de "a * 2".', 'total = (a * 2)\n'],
  ['Crée une variable de type double nommée moyenne avec le résultat de "1.5".', 'moyenne: float = 1.5\n'],
  ['Crée un caractère nommé c de valeur \'A\'.', "c: str = 'A'\n"],
  ['Affecte le caractère \'B\' à c.', "c = 'B'\n"],
  ['Affiche la valeur de age.', 'print(age, end="")\n'],
  ['Affiche le caractère c.', 'print(c, end="")\n'],
  ['Affiche la chaîne nom.', 'print(nom, end="")\n'],
  ['Affiche le texte "Bonjour".', 'print("Bonjour", end="")\n'],
  ['Affiche un retour à la ligne.', 'print("\\n", end="")\n'],
  ['Affiche age en décimal.', 'print(age, end="")\n'],
  ['Affiche age en hexadécimal.', 'print(f"{age:x}", end="")\n'],
  ['Affiche age en octal.', 'print(f"{age:o}", end="")\n'],
  ['Affecte la valeur 5 à l’élément "0" de notes.', 'notes[0] = 5\n'],
  ['Affiche l’élément "0" de notes.', 'print(notes[0], end="")\n'],
  ['Crée un bloc si "age >= 18".', 'if age >= 18:\n'],
  ['Ajoute une branche sinon si "age >= 13".', 'elif age >= 13:\n'],
  ['Ajoute une branche sinon.', 'else:\n'],
  ['Crée une boucle tant que "i < 3".', 'while i < 3:\n'],
  ['Sors de la boucle la plus intérieure.', 'break\n'],
  ['Passe à l’itération suivante de la boucle la plus intérieure.', 'continue\n'],
  ['Retourne.', 'return\n'],
  ['Retourne la valeur 0.', 'return 0\n'],
  ['Retourne le résultat numérique de "a + b".', 'return (a + b)\n'],
  ['Appelle somme avec "1" et "2".', 'somme(1, 2)\n'],
  ['Affecte à total le résultat de l’appel de somme avec "1".', 'total = somme(1)\n'],
  ['Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.',
    'def somme(a: int, b: int) -> int:\n'],
  ['Crée une fonction nommée afficher qui ne retourne rien.', 'def afficher() -> None:\n'],
];
for (const [phrase, attendu] of EXACTS) {
  test(`P3 exactitude : ${phrase}`, () => assert.equal(code(phrase), attendu));
}

test('P3 : le parenthésage du C est conservé, parce que la priorité lue doit s’appliquer', () => {
  assert.equal(code('Affecte à r le résultat de "a + b * c".'), 'r = (a + (b * c))\n');
  assert.equal(code('Crée un bloc si "a < b && c > d".'), 'if ((a < b) and (c > d)):\n');
  assert.equal(code('Crée un bloc si "!actif".'), 'if (not actif):\n');
  assert.equal(code('Crée un bloc si "actif || pret".'), 'if (actif or pret):\n');
});

test('P3 : une expression numérique employée comme condition n’est pas réécrite', () => {
  // Zéro est faux dans les deux langages : aucune comparaison n'est ajoutée.
  assert.equal(code('Crée un bloc si "reste".'), 'if reste:\n');
});

// --------------------------------------------------------------------------
// Refus : le sens avant la commodité
// --------------------------------------------------------------------------
test('P3 : la division est refusée, et le refus explique pourquoi', () => {
  const rendu = py('Affecte à r le résultat numérique de "a / b".');
  assert.equal(rendu.status, 'refus');
  assert.equal(rendu.code, 'CONSTRUCTION_NON_PORTEE');
  assert.match(rendu.raison, /7 \/ 2 vaut 3/u);
  assert.match(rendu.raison, /D3/u);
});

test('P3 : le modulo est refusé aussi — trouvé par le lot P3, pas par une décision', () => {
  const rendu = py('Affecte à r le résultat numérique de "a % b".');
  assert.equal(rendu.status, 'refus');
  assert.match(rendu.raison, /-7 % 2 vaut -1/u);
  assert.match(rendu.raison, /D13/u);
});

test('P3 : un pointeur dans une expression est refusé, pas déréférencé', () => {
  for (const phrase of ['Affecte à r le résultat numérique de "*p".',
    'Affecte à r le résultat numérique de "&x".']) {
    const rendu = py(phrase);
    assert.equal(rendu.status, 'refus', phrase);
    assert.match(rendu.raison, /aliasing/u);
  }
});

test('P3 : un entier non signé est refusé, et le refus dit ce qui serait perdu', () => {
  const rendu = py('Crée une fonction nommée taille qui retourne un unsigned int.');
  assert.equal(rendu.status, 'refus');
  assert.match(rendu.raison, /précision arbitraire/u);
});

test('P3 : un nom réservé en Python est refusé, même s’il est valide en C17', () => {
  // `lambda` est un identifiant C17 parfaitement légal : le moteur l'accepte,
  // et c'est au langage cible de le refuser.
  assert.equal(translate('Crée un entier nommé lambda de valeur 1.').status, 'translated');
  const rendu = py('Crée un entier nommé lambda de valeur 1.');
  assert.equal(rendu.status, 'refus');
  assert.match(rendu.raison, /mot réservé/u);
  assert.ok(MOTS_RESERVES_PYTHON.has('lambda'));
  // Et un nom ordinaire passe, pour que le test ne prouve pas un refus global.
  assert.equal(code('Crée un entier nommé total de valeur 1.'), 'total = 1\n');
});

test('P3 : une fonction interne est refusée — Python n’a pas de liaison', () => {
  const rendu = py('Crée une fonction interne nommée aide qui retourne un int.');
  assert.equal(rendu.status, 'refus');
  assert.match(rendu.raison, /convention de lecture/u);
});

test('P3 : les deux accès à un champ attendent la décision D6', () => {
  for (const genre of ['MEMBER_ASSIGN_INT', 'MEMBER_ASSIGN_EXPRESSION']) {
    assert.ok(!PORTEES_PYTHON.has(genre));
    assert.match(RAISONS_PYTHON.get(genre), /D6/u);
    // Ce sont deux des 17 intentions communes : leur refus est PROVISOIRE, et
    // il est dû à une décision ouverte, pas au langage.
    assert.match(RAISONS_PYTHON.get(genre), /^ATTENTE/u);
  }
});

// --------------------------------------------------------------------------
// Aucun ajout
// --------------------------------------------------------------------------
test('P3 : aucun bloc ne reçoit de corps, et surtout aucun `pass`', () => {
  for (const phrase of ['Crée un bloc si "x > 0".', 'Ajoute une branche sinon.',
    'Crée une boucle tant que "i < 3".', 'Crée une fonction nommée f qui retourne un int.']) {
    const produit = code(phrase);
    assert.ok(!produit.includes('pass'), phrase);
    assert.equal(produit.split('\n').filter(ligne => ligne !== '').length, 1, 'une seule ligne : ' + phrase);
    assert.ok(produit.trimEnd().endsWith(':'), phrase);
  }
});

test('P3 : les en-têtes déclarés correspondent aux genres qui finissent par « : »', () => {
  for (const genre of EN_TETES_PYTHON) assert.ok(PORTEES_PYTHON.has(genre), genre);
  for (const [phrase, attendu] of EXACTS) {
    const kind = translate(phrase).instruction.kind;
    assert.equal(attendu.trimEnd().endsWith(':'), EN_TETES_PYTHON.has(kind), phrase);
  }
});

test('P3 : aucun séparateur n’est ajouté à un affichage — D10, sans exception', () => {
  for (const [phrase, attendu] of EXACTS) {
    if (!attendu.startsWith('print(')) continue;
    assert.ok(attendu.includes('end=""'), 'affichage sans end="" : ' + phrase);
  }
  // Et le retour à la ligne est écrit explicitement, pas obtenu par défaut.
  assert.equal(code('Affiche un retour à la ligne.'), 'print("\\n", end="")\n');
});

test('P3 : aucune valeur, aucun type et aucun retour ne sont inventés', () => {
  // Pas de déclaration sans valeur : refusée, et aucun zéro n'apparaît.
  const rendu = py('Déclare un entier nommé n.');
  assert.equal(rendu.status, 'refus');
  assert.ok(!/= *0/u.test(rendu.raison) || /inventerait/u.test(rendu.raison));
  // Pas d'annotation là où la phrase n'en donne pas.
  assert.equal(code('Crée un entier nommé age de valeur 20.'), 'age = 20\n');
  assert.ok(!code('Crée une fonction nommée f qui retourne un int.').includes('return'));
});

// --------------------------------------------------------------------------
// Informations pédagogiques passives — celles que les décisions validées
// exigent. Les ~30 autres sont le lot P5.
// --------------------------------------------------------------------------
test('P3 : le caractère porte son explication, parce que la décision D8 l’exige', () => {
  const codes = expliquerPython(translate('Crée un caractère nommé c de valeur \'A\'.')).map(i => i.code);
  assert.ok(codes.includes('PY_CHAR_IS_A_STRING'));
  const info = expliquerPython(translate('Affiche le caractère c.'))
    .find(i => i.code === 'PY_CHAR_IS_A_STRING');
  assert.match(info.message, /longueur 1/u);
  assert.match(info.message, /erreur, pas 66/u);
});

test('P3 : tout affichage explique pourquoi il porte end=""', () => {
  for (const phrase of ['Affiche la valeur de age.', 'Affiche le texte "x".', 'Affiche un retour à la ligne.']) {
    const codes = expliquerPython(translate(phrase)).map(i => i.code);
    assert.ok(codes.includes('PY_NO_SEPARATOR_ADDED'), phrase);
  }
});

test('P3 : un bloc dit que son corps reste à écrire, et que C-A n’écrit pas pass', () => {
  const info = expliquerPython(translate('Crée un bloc si "x > 0".'))
    .find(i => i.code === 'PY_BLOCK_NEEDS_A_BODY');
  assert.match(info.message, /n’écrit pas/u);
  assert.match(info.message, /pass/u);
});

test('P3 : les informations sont passives, et aucune n’est un avertissement déguisé', () => {
  const vues = new Set();
  for (const [phrase] of EXACTS) {
    for (const info of expliquerPython(translate(phrase))) {
      assert.equal(info.severity, 'information');
      assert.ok(info.range.start === 0 && info.range.end === phrase.length);
      assert.ok(info.message.length > 60, info.code);
      // Une information n'ordonne rien et ne donne aucune phrase à recopier.
      assert.ok(!/^Utilisez|^Écrivez|^Remplacez/u.test(info.message), info.code);
      vues.add(info.code);
    }
  }
  // Le lot en écrit sept ; qu'elles soient toutes atteignables est la garde
  // du lot 30 appliquée au canal Python.
  assert.equal(vues.size, 7, 'informations jamais produites : ' + [...vues].join(', '));
});

test('P3 : le programme d’exercice est reproduit par le moteur, trait pour trait', () => {
  // La preuve d'exécution vit dans exercice/python/journal/execution.md, et
  // elle demande python3. Ce test-ci vérifie la seule chose qui puisse
  // pourrir sans qu'on le voie : que le .py commité est encore ce que le
  // moteur écrit aujourd'hui.
  const attendu = readFileSync(new URL('../exercice/python/ca/cumul.py', import.meta.url), 'utf8');
  const etapes = [[0, 'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.'],
    [4, 'Retourne le résultat numérique de "a + b".'],
    [0, 'Crée un entier nommé total de valeur 0.'],
    [0, 'Crée un entier nommé i de valeur 1.'],
    [0, 'Crée une boucle tant que "i <= 5".'],
    [4, 'Affecte à total le résultat de l’appel de somme avec "total" et "i".'],
    [4, 'Affecte à i le résultat numérique de "i + 1".'],
    [0, 'Affiche le texte "total = ".'],
    [0, 'Affiche la valeur de total.'],
    [0, 'Affiche un retour à la ligne.'],
    [0, 'Crée un bloc si "total >= 15".'],
    [4, 'Affiche le texte "assez".'],
    [4, 'Affiche un retour à la ligne.'],
    [0, 'Ajoute une branche sinon.'],
    [4, 'Affiche le texte "pas assez".'],
    [4, 'Affiche un retour à la ligne.']];
  let document = '';
  for (const [indentation, phrase] of etapes) {
    const traduction = translate(phrase);
    assert.equal(traduction.status, 'translated', phrase);
    const rendu = rendre(PYTHON, traduction.instruction);
    assert.equal(rendu.status, 'rendu', phrase);
    const avant = document + ' '.repeat(indentation);
    const plan = planifierPython({ document: { text: avant }, cursorOffset: avant.length,
      comment: PYTHON.commentaire(phrase), code: rendu.code, kind: traduction.instruction.kind });
    assert.equal(plan.status, 'planifie', phrase + ' → ' + (plan.diagnostics?.[0]?.code ?? ''));
    const edit = plan.edits[0];
    document = avant.slice(0, edit.range.start) + edit.newText + avant.slice(edit.range.end) + '\n';
  }
  assert.equal(document, attendu);
  // Et la tracabilite : une ligne de commentaire par instruction, avec la
  // phrase EXACTE, dans la syntaxe de Python.
  for (const [, phrase] of etapes) assert.ok(document.includes('# ' + phrase), phrase);
});

test('P3 : la proposition de catalogue natif et l’inventaire ne derivent pas', () => {
  // Deux documents qui se citent et qu'aucun outil ne compare finissent par se
  // contredire : l'inventaire annoncait 31 intentions nouvelles et ses propres
  // tableaux en comptaient 55. Ce test compare les NOMS, qui sont ce que les
  // deux documents ont de verifiable.
  const noms = chemin => new Set((readFileSync(new URL(chemin, import.meta.url), 'utf8')
    .match(/PY_[A-Z_]+/gu) ?? []).filter(nom => nom !== 'PY_'));
  const inventaire = noms('../docs/phase2/INVENTAIRE_PYTHON.md');
  const propose = noms('../docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md');
  const oubliees = [...inventaire].filter(nom => !propose.has(nom));
  assert.deepEqual(oubliees, [], 'nommées par l’inventaire, absentes de la proposition');
  assert.ok(inventaire.size >= 55, 'inventaire : ' + inventaire.size);
  // La proposition en nomme davantage : elle ajoute les codes d'information et
  // PY_MODULO, ouvert par la décision D13 du lot P3.
  assert.ok(propose.has('PY_MODULO'));
  assert.ok(propose.has('PY_MATCH_DOES_NOT_FALL_THROUGH'));
});
