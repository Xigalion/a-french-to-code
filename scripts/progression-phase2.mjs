// Barres de progression de la phase 2, distinctes de celles de la V1.
//
//   node scripts/progression-phase2.mjs
//
// Chaque barre porte la SOURCE de sa mesure. Une barre sans source est une
// opinion dessinee, et ce projet en a assez vu : la section 2b de la V1
// reste a zero depuis trois semaines parce que personne ne l'a remplie, et
// c'est precisement ce qu'une barre honnete doit montrer.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const etat = JSON.parse(readFileSync(join(racine, 'docs', 'phase2', 'etat-phase2.json'), 'utf8'));

const LARGEUR = 24;
const barre = (f, t) => '[' + '█'.repeat(t > 0 ? Math.min(LARGEUR, Math.round((f / t) * LARGEUR)) : 0)
  + '·'.repeat(LARGEUR - (t > 0 ? Math.min(LARGEUR, Math.round((f / t) * LARGEUR)) : 0)) + ']';

console.log('A / C-A — phase 2, au ' + etat.miseAJour + '  (branche ' + etat.branche + ')');
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

// Verification : le controle ne doit jamais AFFIRMER un etat, il doit le
// lire. Jusqu'au 18 novembre il imprimait « non fusionnee » en dur, ce qui
// est devenu faux le jour de la fusion sans qu'une ligne change : une
// affirmation codee en dur ne se perime pas, elle ment.
let diff = '(non verifiable : branche main absente)';
try {
  const enAvance = execFileSync('git', ['rev-list', '--count', 'main..HEAD'], { cwd: racine, encoding: 'utf8' }).trim();
  const enRetard = execFileSync('git', ['rev-list', '--count', 'HEAD..main'], { cwd: racine, encoding: 'utf8' }).trim();
  const sommetMain = execFileSync('git', ['rev-parse', '--short', 'main'], { cwd: racine, encoding: 'utf8' }).trim();
  let etiquette = 'aucune';
  try {
    etiquette = execFileSync('git', ['describe', '--tags', '--abbrev=0', 'main'], { cwd: racine, encoding: 'utf8' }).trim();
  } catch { /* aucune etiquette accessible depuis main */ }
  const etat = enAvance === '0'
    ? 'fusionnee (rien en avance sur main)'
    : 'NON fusionnee : ' + enAvance + ' commit(s) en avance sur main';
  diff = 'main au sommet ' + sommetMain + ', derniere etiquette ' + etiquette
    + ', branche ' + etat + (enRetard === '0' ? '' : ', ' + enRetard + ' commit(s) de retard');
} catch { /* depot sans main : rien a conclure */ }
console.log('Controle : ' + diff);
