// Lot P4 — le catalogue NATIF de Python.
//
// Ce que ces tests doivent établir :
//   1. l'exactitude du Python produit, caractère par caractère ;
//   2. qu'AUCUNE formulation native n'est acceptée par le catalogue partagé —
//      sinon elle serait masquée, et un `.c` l'accepterait ;
//   3. qu'aucune information manquante n'est devinée ;
//   4. qu'aucune intention déclarée n'est morte, et qu'aucune n'est rendue
//      sans être déclarée ;
//   5. que le programme d'exercice est encore ce que le moteur écrit.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { PYTHON } from '../src/langages/python/langage.ts';
import { analyserCataloguePython, EXEMPLES_NATIFS } from '../src/langages/python/instructions.ts';
import { rendrePythonNatif, NATIVES_PYTHON, EN_TETES_NATIFS } from '../src/langages/python/renduNatif.ts';
import { expliquerNatifPython } from '../src/langages/python/informations.ts';

const natif = phrase => PYTHON.natif(phrase);
function code(phrase) {
  const resultat = natif(phrase);
  assert.ok(resultat !== undefined, 'phrase déclinée par le catalogue natif : ' + phrase);
  assert.equal(resultat.status, 'rendu', 'refus inattendu : ' + (resultat.message ?? ''));
  return resultat.code;
}

/** Les quatorze formulations exactes, avec leur Python exact. */
const EXACTS = [
  ['Crée une liste vide nommée notes.', 'notes: list = []\n', 'PY_LISTE_VIDE'],
  ['Crée une liste nommée notes avec les valeurs "12", "15" et "9".', 'notes: list = [12, 15, 9]\n', 'PY_LISTE_VALEURS'],
  ['Crée une liste nommée notes avec les valeurs "12".', 'notes: list = [12]\n', 'PY_LISTE_VALEURS'],
  ['Ajoute "12" à la fin de notes.', 'notes.append(12)\n', 'PY_AJOUTER'],
  ['Affecte à n le nombre d’éléments de notes.', 'n = len(notes)\n', 'PY_LONGUEUR'],
  ['Crée une boucle pour i de "0" jusqu’avant "10".', 'for i in range(0, 10):\n', 'PY_POUR_INTERVALLE'],
  ['Crée une boucle pour chaque note de notes.', 'for note in notes:\n', 'PY_POUR_CHAQUE'],
  ['Affecte à q le quotient entier de "a" par "b".', 'q = (a // b)\n', 'PY_DIV_ENTIERE'],
  ['Affecte à q le quotient réel de "a" par "b".', 'q = (a / b)\n', 'PY_DIV_REELLE'],
  ['Affecte à r le reste entier de "a" par "b".', 'r = (a % b)\n', 'PY_MODULO'],
  ['Crée une chaîne nommée nom avec le texte "Ada".', 'nom: str = "Ada"\n', 'PY_INIT_STR'],
  ['Crée un booléen nommé actif de valeur vrai.', 'actif: bool = True\n', 'PY_INIT_BOOL'],
  ['Crée un booléen nommé actif de valeur faux.', 'actif: bool = False\n', 'PY_INIT_BOOL'],
  ['Affecte à n l’entier obtenu de texte.', 'n = int(texte)\n', 'PY_CONVERSION'],
  ['Affecte à x le réel obtenu de texte.', 'x = float(texte)\n', 'PY_CONVERSION'],
  ['Affecte à s le texte obtenu de n.', 's = str(n)\n', 'PY_CONVERSION'],
  ['Lis une saisie dans reponse.', 'reponse = input()\n', 'PY_INPUT'],
  ['Crée le point d’entrée principal.', 'if __name__ == "__main__":\n', 'PY_SI_PRINCIPAL'],
];

for (const [phrase, attendu, kind] of EXACTS) {
  test(`P4 exactitude : ${phrase}`, () => {
    assert.equal(code(phrase), attendu);
    assert.equal(natif(phrase).kind, kind);
  });
}

test('P4 : aucune formulation native n’est acceptée par le catalogue partagé', () => {
  // C'est la propriété qui garantit qu'un fichier .c n'a pas bougé : si le
  // moteur acceptait une de ces phrases, elle serait masquée en Python ET
  // écrirait du C.
  for (const [phrase] of EXACTS) {
    assert.equal(translate(phrase).status, 'rejected',
      'le catalogue partagé accepte une formulation Python : ' + phrase);
  }
});

test('P5 : les intentions déclarées sont exactement celles qui sont rendues', () => {
  // Adapte au lot P5 : les formulations EXACTS ci-dessus couvrent le lot P4 ;
  // ce sont les EXEMPLES PUBLIÉS qui font autorité pour les cinquante-trois,
  // et un test séparé vérifie que chacun est reconnu.
  const rendues = new Set();
  for (const phrase of EXEMPLES_NATIFS) {
    const resultat = natif(phrase);
    if (resultat !== undefined && resultat.status === 'rendu') rendues.add(resultat.kind);
  }
  const mortes = [...NATIVES_PYTHON].filter(kind => !rendues.has(kind));
  assert.deepEqual(mortes, [], 'intentions déclarées qu’aucun exemple n’atteint');
  const inconnues = [...rendues].filter(kind => !NATIVES_PYTHON.has(kind));
  assert.deepEqual(inconnues, [], 'intentions rendues et non déclarées');
  assert.equal(NATIVES_PYTHON.size, 63);
  // Les dix-huit formulations du lot P4 restent toutes rendues : la refonte
  // declarative du lot P5 ne doit avoir rien perdu.
  for (const [, , kind] of EXACTS) assert.ok(NATIVES_PYTHON.has(kind), kind);
});

test('P5 : les en-têtes natifs sont exactement ceux qui finissent par « : »', () => {
  // La règle vaut pour TOUS les exemples publiés, pas seulement ceux du
  // lot P4 : un en-tête déclaré et non terminé par « : » poserait un bloc que
  // Python ne reconnaîtrait pas.
  for (const phrase of EXEMPLES_NATIFS) {
    const resultat = natif(phrase);
    if (resultat === undefined || resultat.status !== 'rendu') continue;
    assert.equal(resultat.code.trimEnd().endsWith(':'), EN_TETES_NATIFS.has(resultat.kind),
      phrase + ' → ' + resultat.kind);
  }
  assert.equal(EN_TETES_NATIFS.size, 15);
});

// --------------------------------------------------------------------------
// Aucune information devinée
// --------------------------------------------------------------------------
test('P4 : une liste sans contenu ni « vide » est refusée, et rien n’est inventé', () => {
  const resultat = natif('Crée une liste nommée notes.');
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'MISSING_LIST_CONTENT');
  assert.match(resultat.message, /n’en invente ni le contenu ni la taille/u);
  assert.ok(!/\[\]|\[0\]/u.test(resultat.message), 'le message ne doit pas montrer de contenu');
});

test('P4 : « le quotient » sans sa qualité est refusé — C-A ne choisit pas', () => {
  const resultat = natif('Affecte à q le quotient de "a" par "b".');
  assert.equal(resultat.status, 'refus');
  // Les deux quotients ne donnent pas le même résultat : choisir serait
  // décider à la place de l'étudiant.
  assert.equal(natif('Affecte à q le quotient entier de "a" par "b".').status, 'rendu');
  assert.equal(natif('Affecte à q le quotient réel de "a" par "b".').status, 'rendu');
});

test('P4 : un reste « réel » n’existe pas et est refusé', () => {
  const resultat = natif('Affecte à r le reste réel de "a" par "b".');
  assert.equal(resultat.status, 'refus');
});

test('P4 : un booléen n’accepte que vrai ou faux, sans valeur déduite', () => {
  for (const valeur of ['oui', '1', 'True']) {
    const resultat = natif(`Crée un booléen nommé actif de valeur ${valeur}.`);
    assert.equal(resultat.status, 'refus', valeur);
    assert.equal(resultat.code, 'UNSUPPORTED_BOOLEAN', valeur);
  }
  const vide = natif('Crée un booléen nommé actif de valeur.');
  assert.equal(vide.code, 'MISSING_BOOLEAN');
});

test('P4 : la borne de la boucle est écrite, les deux bornes le sont', () => {
  assert.equal(code('Crée une boucle pour i de "0" jusqu’avant "nombre".'), 'for i in range(0, nombre):\n');
  // `range(n)` à un argument sous-entendrait un zéro que personne n'a demandé.
  const sansDebut = natif('Crée une boucle pour i jusqu’avant "10".');
  assert.ok(sansDebut === undefined || sansDebut.status === 'refus');
});

test('P4 : un mot réservé de Python ne peut pas nommer, même dans une phrase native', () => {
  for (const phrase of ['Crée une liste vide nommée lambda.', 'Crée une boucle pour chaque pass de notes.',
    'Lis une saisie dans None.', 'Crée une boucle pour class de "0" jusqu’avant "3".']) {
    const resultat = natif(phrase);
    assert.ok(resultat !== undefined, phrase);
    assert.equal(resultat.status, 'refus', phrase);
    assert.equal(resultat.code, 'PYTHON_KEYWORD_IDENTIFIER', phrase);
  }
});

test('P4 : une division dans une valeur native est refusée comme ailleurs', () => {
  const resultat = natif('Ajoute "a / b" à la fin de notes.');
  assert.equal(resultat.status, 'refus');
  assert.equal(resultat.code, 'CONSTRUCTION_NON_PORTEE');
  assert.match(resultat.message, /7 \/ 2 vaut 3/u);
});

test('P4 : « Affecte à … » hors de nos queues DÉCLINE, pour garder le diagnostic partagé', () => {
  // La phrase appartient au catalogue partagé : le module natif ne doit pas
  // s'en emparer, sinon le diagnostic utile disparaît.
  assert.equal(natif('Affecte à x le résultat de "a +".'), undefined);
  assert.equal(natif('Affiche la valeur de age.'), undefined);
  assert.equal(natif('Déclare un entier nommé n.'), undefined);
});

test('P5 : du texte supplémentaire est refusé, jamais ignoré, et pour TOUS les motifs', () => {
  for (const phrase of ['Crée une liste vide nommée notes maintenant.',
    'Lis une saisie dans reponse svp.', 'Crée le point d’entrée principal du programme.',
    'Importe le module math tout de suite.', 'Crée un bloc à essayer vraiment.']) {
    const resultat = natif(phrase);
    assert.ok(resultat !== undefined && resultat.status === 'refus', phrase);
    assert.equal(resultat.code, 'UNEXPECTED_TEXT', phrase);
  }
  // La règle est générale : elle s'applique à chaque exemple publié, pas à une
  // liste de cas choisis.
  for (const phrase of EXEMPLES_NATIFS) {
    const avecReste = phrase.replace(/\.?$/u, '') + ' maintenant.';
    const resultat = natif(avecReste);
    assert.ok(resultat !== undefined && resultat.status === 'refus', avecReste);
  }
});

// --------------------------------------------------------------------------
// Informations passives
// --------------------------------------------------------------------------
test('P4 : chaque intention native porte au moins une information', () => {
  for (const kind of NATIVES_PYTHON) {
    const informations = expliquerNatifPython(kind, { start: 0, end: 1 });
    assert.ok(informations.length >= 1, 'intention sans information : ' + kind);
    for (const information of informations) {
      assert.equal(information.severity, 'information');
      assert.ok(information.message.length > 80, information.code);
    }
  }
});

test('P4 : les deux informations que la décision D3 et la décision D13 exigent', () => {
  const entier = expliquerNatifPython('PY_DIV_ENTIERE', { start: 0, end: 1 });
  const arrondi = entier.find(information => information.code === 'PY_FLOOR_DIVISION_ROUNDS_DOWN');
  assert.match(arrondi.message, /vers le BAS/u);
  assert.match(arrondi.message, /-7 \/\/ 2 vaut -4/u);
  const reste = expliquerNatifPython('PY_MODULO', { start: 0, end: 1 });
  const signe = reste.find(information => information.code === 'PY_MODULO_FOLLOWS_THE_DIVISOR_SIGN');
  assert.match(signe.message, /-7 % 2 vaut 1/u);
  assert.match(signe.message, /C17 donne -1/u);
});

test('P4 : la borne de range est dite exclue, parce que la formulation est lourde exprès', () => {
  const informations = expliquerNatifPython('PY_POUR_INTERVALLE', { start: 0, end: 1 });
  const borne = informations.find(information => information.code === 'PY_RANGE_EXCLUDES_THE_END');
  assert.match(borne.message, /EXCLUE/u);
  assert.match(borne.message, /jusqu’avant/u);
});

test('P4 : la saisie dit qu’elle est toujours une chaîne, et la conversion qu’elle peut échouer', () => {
  assert.match(expliquerNatifPython('PY_INPUT', { start: 0, end: 1 })[0].message, /TOUJOURS/u);
  assert.match(expliquerNatifPython('PY_CONVERSION', { start: 0, end: 1 })[0].message, /ARRÊTE le programme/u);
});

test('P4 : le point d’entrée est annoncé comme une CONVENTION', () => {
  const informations = expliquerNatifPython('PY_SI_PRINCIPAL', { start: 0, end: 1 });
  const convention = informations.find(information => information.code === 'PY_MAIN_IS_A_CONVENTION');
  assert.match(convention.message, /CONVENTION/u);
  assert.match(convention.message, /rien ne l’appelle automatiquement/u);
});

// --------------------------------------------------------------------------
// L'AST, et le rendu séparé de l'analyse
// --------------------------------------------------------------------------
test('P4 : l’analyse et le rendu sont deux étapes, et l’AST porte les paramètres', () => {
  const analyse = analyserCataloguePython('Crée une liste nommée notes avec les valeurs "12", "15" et "9".');
  assert.equal(analyse.status, 'reconnu');
  assert.equal(analyse.instruction.kind, 'PY_LISTE_VALEURS');
  assert.equal(analyse.instruction.parameters.name, 'notes');
  assert.equal(analyse.instruction.parameters.valeurs.length, 3);
  assert.equal(rendrePythonNatif(analyse.instruction).code, 'notes: list = [12, 15, 9]\n');
});

test('P4 : le programme d’exercice natif est reproduit par le moteur, trait pour trait', () => {
  // Le .py commité ne doit pas pouvoir vieillir en silence. L'exécution, elle,
  // demande python3 et reste un outil.
  const attendu = readFileSync(new URL('../exercice/python/ca/moyennes.py', import.meta.url), 'utf8');
  assert.ok(attendu.includes('notes: list = [12, 15, 9]'));
  assert.ok(attendu.includes('for note in notes:'));
  assert.ok(attendu.includes('entiere = (total // nombre)'));
  assert.ok(attendu.includes('reste = (total % nombre)'));
  assert.ok(attendu.includes('for i in range(0, nombre):'));
  // Aucun `pass`, aucun separateur implicite, aucune valeur inventee.
  assert.ok(!attendu.includes('pass'));
  for (const ligne of attendu.split('\n')) {
    if (ligne.trimStart().startsWith('print(')) assert.ok(ligne.includes('end=""'), ligne);
  }
  // Traçabilité : autant de commentaires que d'instructions.
  const commentaires = attendu.split('\n').filter(ligne => ligne.trimStart().startsWith('#')).length;
  const instructions = attendu.split('\n').filter(ligne => ligne.trim() !== '' && !ligne.trimStart().startsWith('#')).length;
  assert.equal(commentaires, instructions);
  assert.equal(commentaires, 41);
});

test('P4 : chaque intention native a un exemple publié, et chaque exemple est reconnu', () => {
  const genres = new Set();
  for (const phrase of EXEMPLES_NATIFS) {
    const resultat = natif(phrase);
    assert.ok(resultat !== undefined, 'exemple décliné : ' + phrase);
    assert.equal(resultat.status, 'rendu', 'exemple refusé : ' + phrase);
    genres.add(resultat.kind);
    // Un exemple que le catalogue partagé accepterait serait masqué.
    assert.equal(translate(phrase).status, 'rejected', phrase);
  }
  const sansExemple = [...NATIVES_PYTHON].filter(kind => !genres.has(kind));
  assert.deepEqual(sansExemple, [], 'intentions natives sans exemple publié');
  assert.equal(genres.size, NATIVES_PYTHON.size);
});
