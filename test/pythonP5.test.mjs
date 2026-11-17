// Lot P5 — les cinquante-trois intentions natives, et leur sortie EXACTE.
//
// Instantané créé le 17 novembre 2026, après relecture des cinquante-six
// rendus un par un : chacun a été vérifié comme du Python valide et comme la
// traduction fidèle de sa phrase. Il est **figé**.
//
// Comme les instantanés `test/lot4-compatibility.json` et suivants : ne JAMAIS
// le régénérer pour faire passer un test. Un écart est une régression à
// corriger dans le code, ou un changement à documenter dans un bilan de lot.
import test from 'node:test';
import assert from 'node:assert/strict';
import { translate } from '../src/translate.ts';
import { PYTHON } from '../src/langages/python/langage.ts';
import { NATIVES_PYTHON } from '../src/langages/python/renduNatif.ts';
import { expliquerNatifPython } from '../src/langages/python/informations.ts';

const natif = phrase => PYTHON.natif(phrase);

/** La sortie exacte de chaque formulation native publiée. */
const INSTANTANE = [
  ["Crée une liste vide nommée notes.", "notes: list = []\n"],
  ["Crée une liste nommée notes avec les valeurs \"12\", \"15\" et \"9\".", "notes: list = [12, 15, 9]\n"],
  ["Crée une chaîne nommée nom avec le texte \"Ada\".", "nom: str = \"Ada\"\n"],
  ["Crée un booléen nommé actif de valeur vrai.", "actif: bool = True\n"],
  ["Crée un nom appelé resultat sans valeur.", "resultat = None\n"],
  ["Crée une valeur fixe par convention nommée TAILLE de valeur 10.", "TAILLE = 10\n"],
  ["Crée un nom appelé copie qui désigne la même liste que notes.", "copie = notes\n"],
  ["Crée un tuple nommé point avec les valeurs \"1\" et \"2\".", "point: tuple = (1, 2)\n"],
  ["Crée le point d’entrée principal.", "if __name__ == \"__main__\":\n"],
  ["Affecte à q le quotient entier de \"total\" par \"nombre\".", "q = (total // nombre)\n"],
  ["Affecte à q le quotient réel de \"total\" par \"nombre\".", "q = (total / nombre)\n"],
  ["Affecte à r le reste entier de \"total\" par \"nombre\".", "r = (total % nombre)\n"],
  ["Affecte à p le résultat de \"a\" élevé à la puissance \"b\".", "p = (a ** b)\n"],
  ["Affecte à nombre le nombre d’éléments de notes.", "nombre = len(notes)\n"],
  ["Affecte à n l’entier obtenu de texte.", "n = int(texte)\n"],
  ["Affecte à x le réel obtenu de texte.", "x = float(texte)\n"],
  ["Affecte à s le texte obtenu de n.", "s = str(n)\n"],
  ["Lis une saisie dans reponse.", "reponse = input()\n"],
  ["Affiche le type de valeur.", "print(type(valeur), end=\"\")\n"],
  ["Affiche a et b séparés par le texte \" \".", "print(a, b, sep=\" \", end=\"\")\n"],
  ["Ajoute \"18\" à la fin de notes.", "notes.append(18)\n"],
  ["Ajoute le texte \"cleo\" à la fin de noms.", "noms.append(\"cleo\")\n"],
  ["Incrémente compteur.", "compteur += 1\n"],
  ["Décrémente compteur.", "compteur -= 1\n"],
  ["Crée une liste nommée noms avec les textes \"ada\" et \"bob\".", "noms: list = [\"ada\", \"bob\"]\n"],
  ["Crée un ensemble nommé vus avec les textes \"ada\" et \"bob\".", "vus: set = {\"ada\", \"bob\"}\n"],
  ["Crée un tuple nommé paire avec les textes \"ada\" et \"bob\".", "paire: tuple = (\"ada\", \"bob\")\n"],
  ["Insère le texte \"cleo\" à la position \"0\" de noms.", "noms.insert(0, \"cleo\")\n"],
  ["Crée un dictionnaire nommé index avec la clé \"ada\" valant le texte \"quinze\".", "index: dict = {\"ada\": \"quinze\"}\n"],
  ["Affecte le texte \"absente\" à la clé \"zoe\" de index.", "index[\"zoe\"] = \"absente\"\n"],
  ["Crée une fonction nommée salue qui ne retourne rien et prend un str nommé nom valant le texte \"Ada\".", "def salue(nom: str = \"Ada\") -> None:\n"],
  ["Insère \"12\" à la position \"0\" de notes.", "notes.insert(0, 12)\n"],
  ["Retire l’élément à la position \"0\" de notes.", "del notes[0]\n"],
  ["Affecte à debut la tranche de notes de \"0\" jusqu’avant \"3\".", "debut = notes[0:3]\n"],
  ["Affiche le dernier élément de notes.", "print(notes[-1], end=\"\")\n"],
  ["Affecte à x et y les valeurs de point.", "x, y = point\n"],
  ["Crée un dictionnaire vide nommé index.", "index: dict = {}\n"],
  ["Crée un dictionnaire nommé index avec la clé \"ada\" valant \"15\".", "index: dict = {\"ada\": 15}\n"],
  ["Affecte à n la valeur de la clé \"ada\" de index.", "n = index[\"ada\"]\n"],
  ["Affecte \"15\" à la clé \"ada\" de index.", "index[\"ada\"] = 15\n"],
  ["Crée une boucle pour la clé nom et la valeur note de index.", "for nom, note in index.items():\n"],
  ["Crée un ensemble nommé vus avec les valeurs \"1\" et \"2\".", "vus: set = {1, 2}\n"],
  ["Affecte à phrase le texte de debut suivi de fin.", "phrase = (debut + fin)\n"],
  ["Affecte à mots les morceaux de phrase séparés par le texte \" \".", "mots = phrase.split(\" \")\n"],
  ["Affecte à phrase les éléments de mots joints par le texte \" \".", "phrase = \" \".join(mots)\n"],
  ["Affecte à cri le texte de phrase en majuscules.", "cri = phrase.upper()\n"],
  ["Affecte à propre le texte de phrase sans les espaces des extrémités.", "propre = phrase.strip()\n"],
  ["Affecte à ligne le texte \"Bonjour {nom}\" avec le champ nom valant nom.", "ligne = f\"Bonjour {nom}\"\n"],
  ["Crée un bloc si \"x\" appartient à notes.", "if x in notes:\n"],
  ["Crée un bloc si resultat est sans valeur.", "if resultat is None:\n"],
  ["Crée un filtrage sur \"jour\".", "match jour:\n"],
  ["Ajoute un motif pour la valeur 5.", "case 5:\n"],
  ["Ajoute le motif qui accepte tout.", "case _:\n"],
  ["Crée une boucle pour chaque note de notes.", "for note in notes:\n"],
  ["Crée une boucle pour l’indice i et la valeur note de notes.", "for i, note in enumerate(notes):\n"],
  ["Crée une boucle pour i de \"0\" jusqu’avant \"10\".", "for i in range(0, 10):\n"],
  ["Appelle somme avec le paramètre a valant \"1\" et le paramètre b valant \"2\".", "somme(a=1, b=2)\n"],
  ["Retourne les résultats de \"a\" et \"b\".", "return a, b\n"],
  ["Crée un bloc avec le fichier \"notes.txt\" ouvert en lecture nommé f.", "with open(\"notes.txt\", \"r\") as f:\n"],
  ["Crée un bloc avec le fichier \"notes.txt\" ouvert en écriture nommé f.", "with open(\"notes.txt\", \"w\") as f:\n"],
  ["Crée une boucle pour chaque ligne ligne de f.", "for ligne in f:\n"],
  ["Crée un bloc à essayer.", "try:\n"],
  ["Ajoute une branche en cas d’erreur de type ValueError.", "except ValueError:\n"],
  ["Lève une erreur de type ValueError avec le texte \"note invalide\".", "raise ValueError(\"note invalide\")\n"],
  ["Importe le module math.", "import math\n"],
  ["Importe sqrt du module math.", "from math import sqrt\n"],
];

for (const [phrase, attendu] of INSTANTANE) {
  test(`P5 exactitude : ${phrase}`, () => {
    const resultat = natif(phrase);
    assert.ok(resultat !== undefined, 'déclinée');
    assert.equal(resultat.status, 'rendu', resultat.message ?? '');
    assert.equal(resultat.code, attendu);
  });
}

test('P5 : l’instantané couvre les 63 intentions natives', () => {
  const genres = new Set();
  for (const [phrase] of INSTANTANE) genres.add(natif(phrase).kind);
  assert.equal(genres.size, NATIVES_PYTHON.size);
  assert.equal(INSTANTANE.length, 66, '66 formulations pour 63 intentions');
  // La 54e intention, PY_AJOUTER_TEXTE, a ete trouvee par l'exercice du lot
  // P5 : « Ajoute "cleo" a la fin de noms. » lisait cleo comme un NOM, et
  // le programme echouait a l'execution avec NameError.
});

test('P5 : aucune formulation native n’est acceptée par le catalogue partagé', () => {
  // La propriété qui garantit qu'un fichier .c n'a pas bougé.
  for (const [phrase] of INSTANTANE) {
    assert.equal(translate(phrase).status, 'rejected',
      'le catalogue partagé accepte une formulation Python : ' + phrase);
  }
});

test('P5 : chaque intention native porte au moins une information passive', () => {
  for (const kind of NATIVES_PYTHON) {
    const informations = expliquerNatifPython(kind, { start: 0, end: 1 });
    assert.ok(informations.length >= 1, 'intention sans information : ' + kind);
    for (const information of informations) {
      assert.equal(information.severity, 'information');
      assert.ok(information.message.length > 80, information.code);
      assert.ok(!/^Utilisez|^Écrivez|^Remplacez/u.test(information.message), information.code);
    }
  }
});

test('P5 : les trois informations qui CORRIGENT une règle apprise en C17', () => {
  const dire = (kind, code) => expliquerNatifPython(kind, { start: 0, end: 1 })
    .find(information => information.code === code);
  // match ne traverse pas : l'inverse exact de SWITCH_FALLTHROUGH.
  assert.match(dire('PY_MATCH', 'PY_MATCH_DOES_NOT_FALL_THROUGH').message, /inverse exact/u);
  assert.match(dire('PY_MATCH', 'PY_MATCH_DOES_NOT_FALL_THROUGH').message, /oublier/u);
  // with ferme tout seul : l'inverse de FILE_MUST_BE_CLOSED.
  assert.match(dire('PY_AVEC_FICHIER', 'PY_WITH_CLOSES_FOR_YOU').message, /ajout\s+du LANGAGE/u);
  // Un indice négatif compte depuis la fin au lieu de lire hors du tableau.
  assert.match(dire('PY_INDICE_NEGATIF', 'PY_INDEX_CAN_BE_NEGATIVE').message, /En C17/u);
});

// --------------------------------------------------------------------------
// Les refus, et ce qu'ils apprennent
// --------------------------------------------------------------------------
const REFUS = [
  ['Crée une liste nommée notes.', 'MISSING_LIST_CONTENT'],
  ['Crée une liste nommée notes avec les valeurs.', 'MISSING_EXPRESSION'],
  ['Crée un dictionnaire nommé index.', 'MISSING_DICT_CONTENT'],
  ['Crée un booléen nommé actif de valeur.', 'MISSING_BOOLEAN'],
  ['Crée un booléen nommé actif de valeur oui.', 'UNSUPPORTED_BOOLEAN'],
  ['Crée un booléen nommé actif de valeur 1.', 'UNSUPPORTED_BOOLEAN'],
  ['Affecte à q le quotient de "a" par "b".', 'MISSING_QUOTIENT_KIND'],
  ['Affecte à r le reste réel de "a" par "b".', 'UNSUPPORTED_REMAINDER'],
  ['Crée une boucle pour i de "0" à "10".', 'MISSING_EXCLUSIVE_BOUND'],
  ['Ajoute un motif par défaut.', 'UNSUPPORTED_DEFAULT_CASE'],
  ['Crée une liste vide nommée notes maintenant.', 'UNEXPECTED_TEXT'],
  ['Importe le module math tout de suite.', 'UNEXPECTED_TEXT'],
  ['Crée une liste vide nommée lambda.', 'PYTHON_KEYWORD_IDENTIFIER'],
  ['Crée un dictionnaire vide nommé None.', 'PYTHON_KEYWORD_IDENTIFIER'],
];

for (const [phrase, code] of REFUS) {
  test(`P5 refus : ${phrase}`, () => {
    const resultat = natif(phrase);
    assert.ok(resultat !== undefined, 'déclinée au lieu d’être refusée : ' + phrase);
    assert.equal(resultat.status, 'refus');
    assert.equal(resultat.code, code);
    assert.ok(resultat.message.length > 30, 'refus sans explication : ' + phrase);
  });
}

test('P5 : les refus n’offrent aucune valeur de remplacement', () => {
  for (const [phrase] of REFUS) {
    const resultat = natif(phrase);
    // Un message ne doit pas contenir du Python prêt à recopier.
    assert.ok(!/= \[\]|= \{\}|= 0\b|= None/u.test(resultat.message), phrase + ' : ' + resultat.message);
  }
});

test('P5 : une f-chaîne sans son champ est refusée, le champ n’est pas ajouté', () => {
  const resultat = natif('Affecte à ligne le texte "Bonjour" avec le champ nom valant nom.');
  assert.equal(resultat.status, 'refus');
  assert.match(resultat.message, /n’ajoute pas un champ/u);
});

test('P5 : une division dans une valeur native reste refusée', () => {
  for (const phrase of ['Ajoute "a / b" à la fin de notes.',
    'Crée une liste nommée notes avec les valeurs "a / b".',
    'Affecte "a % b" à la clé "x" de index.']) {
    const resultat = natif(phrase);
    assert.equal(resultat.status, 'refus', phrase);
    assert.equal(resultat.code, 'CONSTRUCTION_NON_PORTEE', phrase);
  }
});

test('P5 : « Affecte à … » hors de nos queues DÉCLINE, pour garder le diagnostic partagé', () => {
  assert.equal(natif('Affecte à x le résultat de "a +".'), undefined);
  assert.equal(natif('Affiche la valeur de age.'), undefined);
  assert.equal(natif('Déclare un entier nommé n.'), undefined);
});

test('P5 : une phrase sur plusieurs lignes n’est pas de ce catalogue', () => {
  assert.equal(natif('Crée une liste vide\nnommée notes.'), undefined);
});
