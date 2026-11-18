// L'exercice de CLÔTURE de Java-A : il COMPILE et il EXÉCUTE.
//
//   node exercice/java/cloture.mjs
//
// L'énoncé est fixé dans docs/phase3/PLAN_JAVA.md §4 **avant**
// l'implémentation, précisément pour qu'il ne soit pas ajusté après coup au
// niveau de ce que A sait faire. Ses cinq contraintes :
//   1. PLUSIEURS FICHIERS : une classe publique, une classe seconde, une
//      interface, et un paquetage ;
//   2. il LIT un fichier, donc il traite une exception vérifiée ;
//   3. il utilise au moins une COLLECTION et au moins un TABLEAU, pour
//      éprouver la décision J10 sur un cas réel ;
//   4. il COMPILE par `javac --release 21` et s'EXÉCUTE, code de sortie 0 ;
//   5. ZÉRO retouche manuelle.
//
// La dictée elle-même est dans `dictee.mjs`, rejouée par `npm test` : ce
// fichier-ci n'ajoute que le compilateur, qui n'est pas toujours là.
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dicterTout, FICHIERS } from './dictee.mjs';
import { outil, versionJavac } from '../../scripts/jdk.mjs';

const ici = dirname(fileURLToPath(import.meta.url));
const sortie = join(ici, 'cloture');
rmSync(sortie, { recursive: true, force: true });
mkdirSync(join(sortie, 'ecole'), { recursive: true });

const { documents, phrases, gestes, informations } = dicterTout();
for (const [chemin, contenu] of documents) writeFileSync(join(sortie, chemin), contenu, 'utf8');

console.log('fichiers dictés   : ' + documents.size);
console.log('phrases dictées   : ' + phrases);
console.log('gestes d’éditeur  : ' + gestes);
console.log('informations vues : ' + informations.size);
console.log('retouches         : 0');
console.log('');

// `-encoding UTF-8` : sans elle, `javac` lit la source dans l'encodage de la
// plate-forme et les accents des commentaires ET des chaînes affichées sont
// corrompus DANS LE FICHIER COMPILÉ. Le programme compile en code 0,
// s'exécute en code 0, et affiche faux. Trouvé au lot J2.
const sources = FICHIERS.map(fichier => fichier.chemin);
const compilation = execFileSync(outil('javac'),
  ['--release', '21', '-encoding', 'UTF-8', '-Xlint:all', ...sources],
  { cwd: sortie, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
console.log('javac --release 21 -Xlint:all : code 0'
  + (compilation.trim() === '' ? ', AUCUN avertissement' : '\n' + compilation));

// `-ea` : les assertions sont inactives sans elle, et l'exercice en contient
// une. L'activer, c'est la mettre à l'épreuve plutôt que de la décorer.
const execution = execFileSync(outil('java'),
  ['-ea', '-Dstdout.encoding=UTF-8', '-cp', '.', 'ecole.Promotion'],
  { cwd: sortie, encoding: 'utf8' });
console.log('java -ea : code 0');
console.log('--- sortie ---');
process.stdout.write(execution);
console.log('--------------');

// Le calcul fait à la main, et c'est lui qui juge — pas le programme.
const ATTENDU = [
  'total tableau = 36',
  'total liste = 36',
  'relu dans la table = 36',
  'début de semaine',
  'sans nom a 12 ans',
  'étudiant a 15 ans',
  'age du premier = 12',
  '',
].join('\n');
if (execution.replace(/\r\n/gu, '\n') !== ATTENDU) {
  console.log('ÉCART avec le calcul fait à la main. Attendu :');
  process.stdout.write(ATTENDU);
  process.exitCode = 1;
} else {
  console.log('sortie conforme au calcul fait à la main (12+15+9 = 36, par le tableau ET par la liste)');
}

// Le fichier écrit puis relu doit exister : c'est la preuve que le bloc essaie
// AVEC ressource a ouvert, écrit et FERMÉ sans qu'une fermeture soit écrite.
if (!existsSync(join(sortie, 'notes.txt'))) {
  console.log('ÉCART : le fichier notes.txt n’a pas été écrit.');
  process.exitCode = 1;
}

mkdirSync(join(ici, 'journal'), { recursive: true });
writeFileSync(join(ici, 'journal', 'cloture.json'), JSON.stringify({
  javac: versionJavac(), fichiers: sources, phrases, gestes, retouches: 0,
  informations: [...informations].sort(),
}, null, 2) + '\n', 'utf8');
console.log('journal : exercice/java/journal/cloture.json');
