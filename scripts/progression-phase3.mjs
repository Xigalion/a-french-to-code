// Barres de progression de la phase 3 — Java-A.
//
//   node scripts/progression-phase3.mjs
//
// Chaque barre porte la SOURCE de sa mesure. Une barre sans source est une
// opinion dessinee.
//
// Une seule difference avec la phase 2, et elle vient d'une erreur de la
// phase 2 : le controle de fin ne doit jamais AFFIRMER un etat du depot, il
// doit le LIRE. La version phase 2 imprimait « non fusionnee » en dur, ce qui
// est devenu faux le jour de la fusion sans qu'une ligne change.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const etat = JSON.parse(readFileSync(join(racine, 'docs', 'phase3', 'etat-phase3.json'), 'utf8'));

const LARGEUR = 24;
const plein = (f, t) => (t > 0 ? Math.min(LARGEUR, Math.round((f / t) * LARGEUR)) : 0);
const barre = (f, t) => '[' + '█'.repeat(plein(f, t)) + '·'.repeat(LARGEUR - plein(f, t)) + ']';

console.log('A / Java-A — phase 3, au ' + etat.miseAJour + '  (branche ' + etat.branche + ')');
console.log('version de reference : ' + etat.versionDeReference);
console.log('');
for (const i of etat.indicateurs) {
  const pourcent = i.total > 0 ? Math.round((i.fait / i.total) * 100) : 0;
  console.log(i.nom);
  console.log('  ' + barre(i.fait, i.total) + '  ' + i.fait + '/' + i.total + ' ' + i.unite
    + '  ' + String(pourcent).padStart(3) + ' %');
  console.log('  source : ' + i.source);
  console.log('  ' + i.note);
  console.log('');
}

// Trois controles LUS, jamais declares.
const controles = [];

// 1. Y a-t-il du code Java dans src/ ? La barre « lots implementes » dit
//    zero ; si un dossier existe, l'une des deux se trompe.
const dossierJava = join(racine, 'src', 'langages', 'java');
controles.push(existsSync(dossierJava)
  ? 'src/langages/java existe : ' + readdirSync(dossierJava).length + ' fichier(s)'
  : 'src/langages/java absent — aucune ligne de Java-A implementee');

// 2. La chaine d'outils. Une barre a zero doit pouvoir etre contredite par la
//    machine, sinon elle survit a l'installation du JDK.
let jdk = 'javac introuvable';
try {
  jdk = 'javac present : ' + execFileSync('javac', ['-version'], { encoding: 'utf8' }).trim();
} catch { /* absent : c'est le cas documente, pas une erreur du script */ }
controles.push(jdk);

// 3. L'etat du depot, lu.
try {
  const branche = execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { cwd: racine, encoding: 'utf8' }).trim();
  const enAvance = execFileSync('git', ['rev-list', '--count', 'main..HEAD'], { cwd: racine, encoding: 'utf8' }).trim();
  const sommetMain = execFileSync('git', ['rev-parse', '--short', 'main'], { cwd: racine, encoding: 'utf8' }).trim();
  controles.push('branche ' + branche + ', main au sommet ' + sommetMain
    + ', ' + enAvance + ' commit(s) en avance sur main');
} catch { controles.push('etat du depot non lisible'); }

for (const c of controles) console.log('Controle : ' + c);
