// Lot P3 — écrit un programme Python avec C-A seul, puis l'exécute.
//
//   node exercice/python/generer.mjs
//
// Rien n'est tapé à la main : chaque ligne du .py sort de `translate` →
// `rendre(PYTHON, …)` → `planifierPython`. Le script refuse d'écrire le
// fichier si une seule phrase est refusée ou si un seul placement est refusé.
// Un programme amputé qui tournerait quand même serait une preuve fausse —
// la sonde du lot précédent s'est fait prendre exactement là.
//
// La sortie attendue est calculée À LA MAIN dans `attendu`, et comparée à ce
// que python3 écrit réellement.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '../../src/translate.ts';
import { rendre } from '../../src/langages/registre.ts';
import { PYTHON } from '../../src/langages/python/langage.ts';
import { planifierPython } from '../../src/langages/python/placement.ts';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

/** Chaque étape : l'indentation voulue, et la phrase française. L'indentation
 * est le geste de l'étudiant — poser le curseur sur une ligne blanche à la
 * bonne colonne —, pas une décision de C-A. */
const ETAPES = [
  [0, 'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b.'],
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
  [4, 'Affiche un retour à la ligne.'],
];

/** Calcul fait à la main, avant toute exécution :
 *  somme cumulée 1+2+3+4+5 = 15, donc « total = 15 », puis 15 >= 15 → « assez ».
 */
const attendu = 'total = 15\nassez\n';

let document = '';
let instructions = 0;
for (const [indentation, phrase] of ETAPES) {
  const traduction = translate(phrase);
  if (traduction.status !== 'translated') {
    console.error('PHRASE REFUSÉE : ' + phrase + ' → ' + traduction.diagnostics[0].code);
    process.exit(1);
  }
  const rendu = rendre(PYTHON, traduction.instruction);
  if (rendu.status !== 'rendu') {
    console.error('RENDU REFUSÉ : ' + phrase + ' → ' + rendu.code + ' : ' + rendu.raison);
    process.exit(1);
  }
  // Le geste de l'étudiant : une ligne blanche à la colonne voulue, en fin de
  // document, et le curseur dessus.
  const ligne = ' '.repeat(indentation);
  const avant = document + ligne;
  const plan = planifierPython({
    document: { text: avant }, cursorOffset: avant.length,
    comment: PYTHON.commentaire(phrase), code: rendu.code, kind: traduction.instruction.kind,
  });
  if (plan.status !== 'planifie') {
    console.error('PLACEMENT REFUSÉ : ' + phrase + ' → ' + plan.diagnostics[0].code
      + ' : ' + plan.diagnostics[0].message);
    process.exit(1);
  }
  const edit = plan.edits[0];
  document = avant.slice(0, edit.range.start) + edit.newText + avant.slice(edit.range.end) + '\n';
  instructions++;
}

const sortie = join(ici, 'ca');
mkdirSync(sortie, { recursive: true });
const fichier = join(sortie, 'cumul.py');
writeFileSync(fichier, document, 'utf8');
console.log('écrit : exercice/python/ca/cumul.py — ' + instructions + ' instructions, 0 retouche');

// Exécution. Le chemin est relatif à la racine du dépôt : aucun chemin
// personnel ne doit atterrir dans un journal.
let execute;
try {
  execute = execFileSync('python3', ['exercice/python/ca/cumul.py'],
    { cwd: racine, encoding: 'utf8', timeout: 10000, maxBuffer: 1 << 20 });
} catch (erreur) {
  console.error('EXÉCUTION EN ÉCHEC : ' + (erreur.stderr ?? erreur.message));
  process.exit(1);
}

// Windows ouvre la sortie standard en mode texte : python y ecrit CRLF la ou
// le programme ecrit LF. C'est une propriete de la plateforme, pas du code
// produit, et la comparaison la neutralise en le DISANT.
const normalise = execute.split('\r\n').join('\n');
const journal = ['# Lot P3 — programme Python ecrit par C-A seul',
  '',
  'Produit par `node exercice/python/generer.mjs`. Ne pas editer a la main.',
  '',
  '- instructions : ' + instructions,
  '- retouches manuelles : 0',
  '- phrases refusees : 0',
  '- placements refuses : 0',
  '',
  '## Sortie attendue, calculee a la main',
  '',
  '```', JSON.stringify(attendu), '```',
  '',
  '## Sortie reelle de python3',
  '',
  '```', JSON.stringify(execute), '```',
  '',
  'Les fins de ligne sont normalisees avant comparaison : sur Windows, python ecrit',
  'CRLF en mode texte la ou le programme ecrit LF. Sortie normalisee : '
    + '`' + JSON.stringify(normalise) + '`.',
  '',
  normalise === attendu ? '**Conforme.**' : '**NON CONFORME.**',
  ''];
mkdirSync(join(ici, 'journal'), { recursive: true });
writeFileSync(join(ici, 'journal', 'execution.md'), journal.join('\n'), 'utf8');

if (normalise !== attendu) {
  console.error('SORTIE NON CONFORME\n  attendu : ' + JSON.stringify(attendu)
    + '\n  obtenu  : ' + JSON.stringify(execute));
  process.exit(1);
}
console.log('exécuté : sortie conforme au calcul fait à la main — ' + JSON.stringify(execute));
