// Écrit un programme Java **entièrement par A**, puis le compile et
// l'exécute. Aucune ligne n'est tapée à la main : chaque ligne vient d'une
// phrase française, passée par `translate`, le rendu Java et le placement.
//
//   node exercice/java/generer.mjs
//
// C'est la preuve que les lots J1 et J2 tiennent ensemble. Elle n'est pas
// l'exercice de clôture, qui est défini dans docs/phase3/PLAN_JAVA.md §4 et
// exige plusieurs fichiers, une interface, un paquetage et une exception
// vérifiée : ce programme-ci se limite à ce que le catalogue PARTAGÉ sait
// écrire, parce que le catalogue natif n'existe pas encore.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '../../src/translate.ts';
import { rendre } from '../../src/langages/registre.ts';
import { JAVA } from '../../src/langages/java/langage.ts';
import { planifierJava } from '../../src/langages/java/placement.ts';
import { outil, versionJavac } from '../../scripts/jdk.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const racine = resolve(ici, '..', '..');

/** Les phrases, dans l'ordre où un étudiant les dicterait. Chacune est
 * insérée à la position que le placement calcule, et le curseur rendu par un
 * en-tête sert de point d'insertion suivant — exactement ce que fait l'hôte
 * VS Code. */
const PHRASES = [
  // La classe, puis la méthode principale : trois phrases avant la première
  // instruction, et c'est Java qui l'exige. Décision J1.
  'Déclare une structure nommée Moyennes.',
  'Crée la fonction principale.',
  // Les données. Un tableau dimensionné EST une allocation en Java.
  'Déclare un tableau de type int nommé notes de dimension 5.',
  'Affecte la valeur 12 à l’élément "0" de notes.',
  'Affecte la valeur 15 à l’élément "1" de notes.',
  'Affecte la valeur 8 à l’élément "2" de notes.',
  'Affecte la valeur 17 à l’élément "3" de notes.',
  'Affecte la valeur 11 à l’élément "4" de notes.',
  // L'accumulation.
  'Crée un entier nommé total de valeur 0.',
  'Crée un entier nommé i de valeur 0.',
  'Crée une boucle tant que "i < 5".',
  'Affecte à total le résultat numérique de "total + notes[i]".',
  'Affecte à i le résultat numérique de "i + 1".',
];

/** Les phrases à écrire APRÈS la boucle, donc à la profondeur de la méthode. */
const APRES_BOUCLE = [
  'Affiche le texte "total = ".',
  'Affiche la valeur de total.',
  'Affiche un retour à la ligne.',
  // Le quotient entier : même troncature qu'en C17, vérifié par exécution.
  'Crée un entier nommé moyenne de valeur 0.',
  'Affecte à moyenne le résultat numérique de "total / 5".',
  'Affiche le texte "moyenne entière = ".',
  'Affiche la valeur de moyenne.',
  'Affiche un retour à la ligne.',
  // Le reste : signe du dividende, comme en C17.
  'Crée un entier nommé reste de valeur 0.',
  'Affecte à reste le résultat numérique de "total % 5".',
  'Affiche le texte "reste = ".',
  'Affiche la valeur de reste.',
  'Affiche un retour à la ligne.',
  // Un bloc conditionnel : la condition est une COMPARAISON, parce qu'un
  // entier n'est pas une condition en Java.
  'Crée un bloc si "moyenne > 10".',
];

const DANS_SI = ['Affiche le texte "moyenne au-dessus de 10".', 'Affiche un retour à la ligne.'];

let document = '\n';
let curseur = 0;
let insérées = 0;
const journal = [];

function dicter(phrase) {
  const traduit = translate(phrase);
  if (traduit.status !== 'translated') {
    throw new Error('phrase refusée par le moteur : ' + phrase + '\n'
      + JSON.stringify(traduit).slice(0, 300));
  }
  const rendu = rendre(JAVA, traduit.instruction);
  if (rendu.status !== 'rendu') {
    throw new Error('phrase refusée par Java : ' + phrase + '\n' + rendu.raison);
  }
  const plan = planifierJava({
    document: { text: document },
    cursorOffset: curseur,
    comment: JAVA.commentaire(phrase),
    code: rendu.code,
    kind: traduit.instruction.kind,
  });
  if (plan.status !== 'planifie') {
    throw new Error('placement refusé : ' + phrase + '\n' + JSON.stringify(plan.diagnostics[0]));
  }
  const [edit] = plan.edits;
  document = document.slice(0, edit.range.start) + edit.newText + document.slice(edit.range.end);
  insérées++;
  journal.push({ phrase, kind: traduit.instruction.kind, portee: plan.portee });
  // Le curseur suivant : dans le bloc si un bloc vient d'être ouvert, sinon
  // sur une ligne blanche créée juste après ce qui vient d'être écrit.
  if (plan.cursor !== undefined) {
    curseur = plan.cursor.offset;
    return;
  }
  const finInsertion = edit.range.start + edit.newText.length;
  document = document.slice(0, finInsertion) + '\n' + document.slice(finInsertion);
  curseur = finInsertion + 1;
}

for (const phrase of PHRASES) dicter(phrase);

// Sortir de la boucle : le curseur remonte d'un cran. L'hôte fait cela par un
// geste d'éditeur, et ces gestes sont COMPTÉS, pas cachés.
let gestes = 0;
function remonterApres(marque) {
  const ligne = document.indexOf(marque);
  if (ligne === -1) throw new Error('marque introuvable : ' + marque);
  const finBloc = document.indexOf('\n', document.indexOf('}', ligne));
  document = document.slice(0, finBloc + 1) + '\n' + document.slice(finBloc + 1);
  curseur = finBloc + 1;
  gestes++;
}
remonterApres('while (i < 5)');

for (const phrase of APRES_BOUCLE) dicter(phrase);
for (const phrase of DANS_SI) dicter(phrase);

// --- écriture, compilation, exécution -------------------------------------
const sortie = join(ici, 'ca');
rmSync(sortie, { recursive: true, force: true });
mkdirSync(sortie, { recursive: true });
// Le nom du fichier est celui de la classe : `javac` l'exige, et A ne renomme
// aucun fichier — il informe. Ici c'est le script qui le nomme.
const fichier = join(sortie, 'Moyennes.java');
writeFileSync(fichier, document, 'utf8');

console.log('phrases dictées   : ' + insérées);
console.log('gestes d’éditeur  : ' + gestes);
console.log('fichier           : exercice/java/ca/Moyennes.java');
console.log('');

// `cwd` au dossier de sortie, et chemins RELATIFS : aucun chemin personnel ne
// peut atterrir dans un journal.
// `-encoding UTF-8` n'est pas un détail de confort : A écrit les phrases
// françaises en commentaire ET dans les chaînes affichées, en UTF-8. Sans
// cette option, `javac` lit la source dans l'encodage de la plate-forme —
// cp1252 sur cette machine — et « entière » devient « entiÃ¨re » DANS LE
// FICHIER COMPILÉ. Le programme compile en code 0, s'exécute en code 0, et
// affiche faux : c'est le pire genre de défaut, et il a été trouvé ici.
const compilation = execFileSync(outil('javac'),
  ['--release', '21', '-encoding', 'UTF-8', '-Xlint:all', 'Moyennes.java'],
  { cwd: sortie, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
console.log('javac : code 0' + (compilation.trim() === '' ? ', aucun avertissement' : '\n' + compilation));

// Et symétriquement à l'exécution : depuis Java 18, `file.encoding` vaut
// UTF-8, mais `System.out` suit l'encodage de la CONSOLE. Sans
// `-Dstdout.encoding`, la sortie est réencodée et la comparaison échoue sur
// un programme pourtant juste.
const execution = execFileSync(outil('java'), ['-Dstdout.encoding=UTF-8', 'Moyennes'],
  { cwd: sortie, encoding: 'utf8' });
console.log('java  : code 0');
console.log('--- sortie ---');
process.stdout.write(execution);
console.log('--------------');

// Le calcul fait à la main, et c'est lui qui juge — pas le programme.
const ATTENDU = 'total = 63\nmoyenne entière = 12\nreste = 3\nmoyenne au-dessus de 10\n';
if (execution.replace(/\r\n/gu, '\n') !== ATTENDU) {
  console.log('ÉCART avec le calcul fait à la main :');
  console.log(JSON.stringify(ATTENDU));
  process.exitCode = 1;
} else {
  console.log('sortie conforme au calcul fait à la main (12+15+8+17+11 = 63, 63/5 = 12, 63%5 = 3)');
}

writeFileSync(join(ici, 'journal', 'dictee.json'),
  JSON.stringify({ javac: versionJavac(), phrases: insérées, gestes, journal }, null, 2) + '\n', 'utf8');
