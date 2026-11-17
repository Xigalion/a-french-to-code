// Lot P4 — un programme Python ECRIT PAR LA SESSION DE L'HOTE, puis execute.
//
//   node exercice/python/natif.mjs
//
// Deux differences avec exercice/python/generer.mjs, et elles comptent :
//
//   1. il passe par `PythonTranslationSession`, donc par le MEME chemin que
//      l'editeur : resolution des trois catalogues, placement, plan, et le
//      texte attendu apres application. Le generateur du lot P3 appelait les
//      modules un par un, ce qui ne prouve pas le chemin de l'hote ;
//   2. il emploie les intentions NATIVES : listes, parcours, quotients,
//      conversion, saisie. Le programme du lot P3 n'avait aucune liste, faute
//      de pouvoir en creer une.
//
// Le script refuse d'ecrire le fichier si une phrase, un rendu ou un placement
// est refuse. Une sortie conforme obtenue sur un programme ampute serait une
// preuve fausse.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PythonTranslationSession } from '../../extension/out/extension/src/sessionPython.js';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

/** [indentation, phrase]. L'indentation est le geste de l'etudiant : poser le
 * curseur sur une ligne blanche a la bonne colonne. */
const ETAPES = [
  [0, 'Crée une fonction nommée moyenne qui retourne un double et prend un int nommé total et un int nommé nombre.'],
  [4, 'Crée un bloc si "nombre == 0".'],
  [8, 'Retourne le résultat numérique de "0".'],
  [4, 'Affecte à q le quotient réel de "total" par "nombre".'],
  [4, 'Retourne le résultat numérique de "q".'],

  [0, 'Crée une liste nommée notes avec les valeurs "12", "15" et "9".'],
  [0, 'Ajoute "18" à la fin de notes.'],
  [0, 'Affecte à nombre le nombre d’éléments de notes.'],
  [0, 'Crée un entier nommé total de valeur 0.'],
  [0, 'Crée une boucle pour chaque note de notes.'],
  [4, 'Affecte à total le résultat numérique de "total + note".'],

  [0, 'Affiche le texte "somme = ".'],
  [0, 'Affiche la valeur de total.'],
  [0, 'Affiche un retour à la ligne.'],

  [0, 'Affecte à entiere le quotient entier de "total" par "nombre".'],
  [0, 'Affiche le texte "moyenne entière = ".'],
  [0, 'Affiche la valeur de entiere.'],
  [0, 'Affiche un retour à la ligne.'],

  [0, 'Affecte à reste le reste entier de "total" par "nombre".'],
  [0, 'Affiche le texte "reste = ".'],
  [0, 'Affiche la valeur de reste.'],
  [0, 'Affiche un retour à la ligne.'],

  [0, 'Affecte à exacte le résultat de l’appel de moyenne avec "total" et "nombre".'],
  [0, 'Affiche le texte "moyenne exacte = ".'],
  [0, 'Affiche exacte en notation fixe avec 2 décimales.'],
  [0, 'Affiche un retour à la ligne.'],

  [0, 'Crée une boucle pour i de "0" jusqu’avant "nombre".'],
  [4, 'Affiche le texte "note "'.replace('"note "', '"note "')],
  [4, 'Affiche la valeur de i.'],
  [4, 'Affiche le texte " = ".'],
  [4, 'Affiche l’élément "i" de notes.'],
  [4, 'Affiche un retour à la ligne.'],

  [0, 'Crée un booléen nommé assez de valeur vrai.'],
  [0, 'Crée un bloc si "entiere < 12".'],
  [4, 'Crée un booléen nommé assez de valeur faux.'],
  [0, 'Crée un bloc si "assez".'],
  [4, 'Affiche le texte "au-dessus".'],
  [4, 'Affiche un retour à la ligne.'],
  [0, 'Ajoute une branche sinon.'],
  [4, 'Affiche le texte "en dessous".'],
  [4, 'Affiche un retour à la ligne.'],
];

/** Calcul fait a la main, avant toute execution.
 *   notes = [12, 15, 9, 18], nombre = 4, total = 54
 *   54 // 4 = 13, 54 % 4 = 2, 54 / 4 = 13.50
 *   13 >= 12 donc assez reste vrai -> « au-dessus »
 */
const attendu = 'somme = 54\n'
  + 'moyenne entière = 13\n'
  + 'reste = 2\n'
  + 'moyenne exacte = 13.50\n'
  + 'note 0 = 12\n'
  + 'note 1 = 15\n'
  + 'note 2 = 9\n'
  + 'note 3 = 18\n'
  + 'au-dessus\n';

function cible(texte, offset) {
  return { document: { id: 'file:///exercice.py', revision: 1, text: texte }, cursorOffset: offset,
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
  if (apercu.status !== 'preview') {
    console.error('APERÇU REFUSÉ : ' + phrase);
    process.exit(1);
  }
  session.reviewReady(apercu.preview.token, courante);
  // Les informations se lisent AVANT l'application : une fois la session
  // terminee, les canaux se vident, et c'est voulu.
  for (const information of session.information) genres.add(information.code);
  const applique = session.beginApply(apercu.preview.token, courante);
  if (applique.status !== 'apply') {
    console.error('CONFIRMATION REFUSÉE : ' + phrase);
    process.exit(1);
  }
  // L'hote applique le plan : exactement ce que montre l'apercu.
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
writeFileSync(join(sortie, 'moyennes.py'), document, 'utf8');
console.log('écrit : exercice/python/ca/moyennes.py — ' + instructions + ' instructions, 0 retouche');

let execute;
try {
  execute = execFileSync('python3', ['exercice/python/ca/moyennes.py'],
    // PYTHONIOENCODING : sur Windows, python ecrit sa sortie dans l'encodage
    // de la console, et un « è » y devient illisible. Le programme produit est
    // en UTF-8 ; l'imposer a la sortie rend la comparaison possible, et ce
    // n'est pas une retouche du code genere.
    { cwd: racine, encoding: 'utf8', timeout: 10000, maxBuffer: 1 << 20,
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
} catch (erreur) {
  console.error('EXÉCUTION EN ÉCHEC : ' + (erreur.stderr ?? erreur.message));
  process.exit(1);
}
// Windows ouvre la sortie standard en mode texte : python y ecrit CRLF la ou
// le programme ecrit LF. C'est la plateforme, pas le code produit.
const normalise = execute.split('\r\n').join('\n');

const journal = ['# Lot P4 — programme Python natif, ecrit par la session de l’hote',
  '',
  'Produit par `node exercice/python/natif.mjs`. Ne pas editer a la main.',
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
writeFileSync(join(ici, 'journal', 'execution-natif.md'), journal.join('\n'), 'utf8');

if (normalise !== attendu) {
  console.error('SORTIE NON CONFORME\n  attendu : ' + JSON.stringify(attendu)
    + '\n  obtenu  : ' + JSON.stringify(normalise));
  process.exit(1);
}
console.log('exécuté : sortie conforme au calcul fait à la main (' + genres.size + ' informations passives)');
