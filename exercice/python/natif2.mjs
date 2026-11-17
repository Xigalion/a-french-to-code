// Lot P5 — un second programme Python natif, ecrit par la session de l'hote.
//
//   node exercice/python/natif2.mjs
//
// Il emploie les intentions que le lot P5 ajoute : dictionnaires, ensembles,
// tuples, depaquetage, tranches, indice negatif, aliasing, methodes de
// chaines, f-chaine, puissance, try/except et match/case.
//
// Comme son predecesseur, il refuse d'ecrire le fichier si une phrase, un
// rendu ou un placement est refuse : une sortie conforme obtenue sur un
// programme ampute serait une preuve fausse.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PythonTranslationSession } from '../../extension/out/extension/src/sessionPython.js';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

const ETAPES = [
  // --- un dictionnaire, et son parcours ---------------------------------
  [0, 'Crée un dictionnaire nommé notes avec la clé "ada" valant "15".'],
  [0, 'Affecte "12" à la clé "bob" de notes.'],
  [0, 'Affecte à nombre le nombre d’éléments de notes.'],
  [0, 'Crée un entier nommé total de valeur 0.'],
  [0, 'Crée une boucle pour la clé nom et la valeur note de notes.'],
  [4, 'Affecte à total le résultat numérique de "total + note".'],
  [0, 'Affecte à moyenne le quotient réel de "total" par "nombre".'],
  [0, 'Affiche le texte "moyenne = ".'],
  [0, 'Affiche moyenne en notation fixe avec 2 décimales.'],
  [0, 'Affiche un retour à la ligne.'],

  // --- une liste construite, puis jointe --------------------------------
  [0, 'Crée une liste vide nommée noms.'],
  [0, 'Crée une boucle pour la clé nom et la valeur note de notes.'],
  [4, 'Ajoute "nom" à la fin de noms.'],
  [0, 'Affecte à liste les éléments de noms joints par le texte ", ".'],
  [0, 'Affiche la chaîne liste.'],
  [0, 'Affiche un retour à la ligne.'],

  // --- une clé absente, et l'erreur attrapée ----------------------------
  [0, 'Crée un bloc à essayer.'],
  [4, 'Affecte à inconnue la valeur de la clé "zoe" de notes.'],
  [0, 'Ajoute une branche en cas d’erreur de type KeyError.'],
  [4, 'Affiche le texte "absente".'],
  [4, 'Affiche un retour à la ligne.'],

  // --- un filtrage par motif, sans traversée ----------------------------
  [0, 'Crée un filtrage sur "nombre".'],
  [4, 'Ajoute un motif pour la valeur 2.'],
  [8, 'Affiche le texte "deux notes".'],
  [8, 'Affiche un retour à la ligne.'],
  [4, 'Ajoute le motif qui accepte tout.'],
  [8, 'Affiche le texte "autre compte".'],
  [8, 'Affiche un retour à la ligne.'],

  // --- un tuple, son dépaquetage, et une puissance ----------------------
  [0, 'Crée un tuple nommé point avec les valeurs "3" et "4".'],
  [0, 'Affecte à x et y les valeurs de point.'],
  [0, 'Affecte à p le résultat de "x" élevé à la puissance "y".'],
  [0, 'Affiche la valeur de p.'],
  [0, 'Affiche un retour à la ligne.'],

  // --- un ensemble, qui perd les doublons -------------------------------
  [0, 'Crée un ensemble nommé vus avec les valeurs "1", "2" et "1".'],
  [0, 'Affecte à distincts le nombre d’éléments de vus.'],
  [0, 'Affiche la valeur de distincts.'],
  [0, 'Affiche un retour à la ligne.'],

  // --- des chaînes : majuscules, f-chaîne -------------------------------
  [0, 'Affecte à cri le texte de liste en majuscules.'],
  [0, 'Affiche la chaîne cri.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Affecte à ligne le texte "total {total}" avec le champ total valant total.'],
  [0, 'Affiche la chaîne ligne.'],
  [0, 'Affiche un retour à la ligne.'],

  // --- une tranche, un indice négatif, et l'aliasing --------------------
  [0, 'Affecte à debut la tranche de noms de "0" jusqu’avant "1".'],
  [0, 'Affecte à combien le nombre d’éléments de debut.'],
  [0, 'Affiche la valeur de combien.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Affiche le dernier élément de noms.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Crée un nom appelé copie qui désigne la même liste que noms.'],
  [0, 'Ajoute le texte "cleo" à la fin de copie.'],
  [0, 'Affecte à apres le nombre d’éléments de noms.'],
  [0, 'Affiche la valeur de apres.'],
  [0, 'Affiche un retour à la ligne.'],
];

/** Calcul fait a la main, AVANT toute execution.
 *
 *   notes = {"ada": 15} puis notes["bob"] = 12  -> deux cles, dans cet ordre
 *   nombre = 2, total = 15 + 12 = 27, moyenne = 27 / 2 = 13.5 -> « 13.50 »
 *   noms = ["ada", "bob"], joints par ", " -> « ada, bob »
 *   notes["zoe"] leve KeyError, attrapee -> « absente »
 *   match 2 -> le motif 2 correspond, et match NE TRAVERSE PAS -> « deux notes »
 *   point = (3, 4), x = 3, y = 4, p = 3 ** 4 = 81
 *   vus = {1, 2, 1} -> un ensemble perd le doublon -> 2 elements
 *   cri = « ADA, BOB »
 *   ligne = f"total {total}" -> « total 27 »
 *   debut = noms[0:1] -> un element
 *   noms[-1] -> « bob »
 *   copie DESIGNE la meme liste : l'ajout la fait grandir -> 3
 */
const attendu = 'moyenne = 13.50\n'
  + 'ada, bob\n'
  + 'absente\n'
  + 'deux notes\n'
  + '81\n'
  + '2\n'
  + 'ADA, BOB\n'
  + 'total 27\n'
  + '1\n'
  + 'bob\n'
  + '3\n';

function cible(texte, offset) {
  return { document: { id: 'file:///natif2.py', revision: 1, text: texte }, cursorOffset: offset,
    singleCursor: true, indentUnit: '    ', indentSignature: 'true:4', eol: '\n', open: true };
}

let document = '';
let instructions = 0;
const genres = new Set();
for (const [indentation, phrase] of ETAPES) {
  const avant = document + ' '.repeat(indentation);
  const courante = cible(avant, avant.length);
  const session = new PythonTranslationSession(courante, phrase);
  const diagnostic = session.diagnose(courante);
  if (diagnostic) {
    console.error('REFUSÉ [' + diagnostic.stage + ' / ' + diagnostic.code + '] ' + phrase
      + '\n  ' + diagnostic.message);
    process.exit(1);
  }
  const apercu = session.prepare(courante);
  if (apercu.status !== 'preview') { console.error('APERÇU REFUSÉ : ' + phrase); process.exit(1); }
  session.reviewReady(apercu.preview.token, courante);
  for (const information of session.information) genres.add(information.code);
  const applique = session.beginApply(apercu.preview.token, courante);
  if (applique.status !== 'apply') { console.error('CONFIRMATION REFUSÉE : ' + phrase); process.exit(1); }
  if (applique.expectedAfter !== apercu.preview.after) {
    console.error('INCOHÉRENCE APERÇU / APPLICATION : ' + phrase);
    process.exit(1);
  }
  document = applique.expectedAfter + '\n';
  session.finishApply(true);
  instructions++;
}

const sortie = join(ici, 'ca');
mkdirSync(sortie, { recursive: true });
writeFileSync(join(sortie, 'collections.py'), document, 'utf8');
console.log('écrit : exercice/python/ca/collections.py — ' + instructions + ' instructions, 0 retouche');

let execute;
try {
  execute = execFileSync('python3', ['exercice/python/ca/collections.py'],
    { cwd: racine, encoding: 'utf8', timeout: 10000, maxBuffer: 1 << 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
} catch (erreur) {
  console.error('EXÉCUTION EN ÉCHEC : ' + (erreur.stderr ?? erreur.message));
  process.exit(1);
}
const normalise = execute.split('\r\n').join('\n');

const journal = ['# Lot P5 — programme Python des collections, ecrit par la session de l’hote',
  '',
  'Produit par `node exercice/python/natif2.mjs`. Ne pas editer a la main.',
  '',
  '- instructions : ' + instructions,
  '- retouches manuelles : 0',
  '- phrases refusees : 0 — rendus refuses : 0 — placements refuses : 0',
  '- chemin emprunte : `PythonTranslationSession`, celui de l’editeur',
  '- informations passives rencontrees : ' + genres.size,
  '',
  '  ' + [...genres].sort().join(', '),
  '',
  '## Sortie attendue, calculee a la main',
  '',
  '```', attendu, '```',
  '',
  '## Sortie reelle de python3',
  '',
  '```', normalise, '```',
  '',
  normalise === attendu ? '**Conforme.**' : '**NON CONFORME.**',
  ''];
mkdirSync(join(ici, 'journal'), { recursive: true });
writeFileSync(join(ici, 'journal', 'execution-collections.md'), journal.join('\n'), 'utf8');

if (normalise !== attendu) {
  console.error('SORTIE NON CONFORME\n  attendu : ' + JSON.stringify(attendu)
    + '\n  obtenu  : ' + JSON.stringify(normalise));
  process.exit(1);
}
console.log('exécuté : sortie conforme au calcul fait à la main (' + genres.size + ' informations passives)');
