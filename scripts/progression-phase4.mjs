// Les barres de la phase 4, et les contrôles qui les démentiraient.
//
//   node scripts/progression-phase4.mjs
//
// Les barres sont éditées à la main dans docs/phase4/etat-phase4.json ; les
// CONTRÔLES, en bas, lisent le disque. Une barre qui dirait « livré » pendant
// qu'un contrôle dit « absent » est un mensonge visible, et c'est voulu : la
// phase 3 avait un script qui imprimait « non fusionnée » en dur, ce qui
// restait faux une fois la fusion faite.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import * as postgres from './postgres.mjs';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const etat = JSON.parse(readFileSync(join(racine, 'docs', 'phase4', 'etat-phase4.json'), 'utf8'));

const LARGEUR = 24;
const barre = (fait, total) => {
  const pleins = total === 0 ? 0 : Math.round((fait / total) * LARGEUR);
  return '[' + '█'.repeat(pleins) + '·'.repeat(LARGEUR - pleins) + ']';
};

console.log(`Phase 4 — ${etat.langage}`);
console.log(`Branche ${etat.branche}, mise à jour le ${etat.miseAJour}`);
console.log(`\n${etat.etat}\n`);

for (const indicateur of etat.indicateurs) {
  const pourcent = indicateur.total === 0 ? 0 : Math.round((indicateur.fait / indicateur.total) * 100);
  console.log(indicateur.nom);
  console.log('  ' + barre(indicateur.fait, indicateur.total)
    + `  ${indicateur.fait}/${indicateur.total} ${indicateur.unite}  ${pourcent} %`);
  console.log('  source : ' + indicateur.source);
  console.log('  ' + indicateur.note + '\n');
}

// --- Les contrôles : ils lisent la réalité, ils ne la répètent pas. ---
const controle = (nom, lire) => {
  let resultat;
  try { resultat = lire(); } catch (erreur) { resultat = 'non vérifiable : ' + erreur.message; }
  console.log('Contrôle : ' + nom + ' : ' + resultat);
};

// Le contrôle CONFRONTE le disque à la barre d'implémentation : si les deux
// se contredisent, il le dit. C'est tout l'objet de cette section — la phase 3
// avait un script qui imprimait « non fusionnée » en dur, et qui restait faux
// une fois la fusion faite.
controle('src/langages/sql et la barre d’implémentation s’accordent', () => {
  const chemin = join(racine, 'src', 'langages', 'sql');
  const fichiers = existsSync(chemin) ? readdirSync(chemin).length : 0;
  const barreLots = etat.indicateurs.find(indicateur => /lots impl[eé]ment[eé]s/u.test(indicateur.nom));
  const livre = barreLots !== undefined && barreLots.fait === barreLots.total && barreLots.total > 0;
  if (fichiers === 0) {
    return livre ? 'CONTRADICTION : la barre dit « livré », le dossier est ABSENT'
      : 'absent, et la barre dit la même chose';
  }
  return livre ? fichiers + ' fichier(s), et la barre dit « livré » : les deux s’accordent'
    : 'CONTRADICTION : ' + fichiers + ' fichier(s) sur le disque, mais la barre dit « non livré »';
});

controle('la spécification est cohérente', () => {
  execFileSync(process.execPath, [join(racine, 'scripts', 'catalogue-sql.mjs')], { stdio: 'pipe' });
  return 'oui, catalogue-sql.mjs passe';
});

controle('un serveur SQL est disponible', () => {
  // Interroger le PATH seul dirait « absent » à tort : l'installation est
  // PORTABLE et hors du dépôt, exactement comme le JDK de la phase 3.
  const version = postgres.version();
  return version === undefined
    ? 'ABSENT — la validation technique est bloquée'
    : version + ', ' + postgres.decrire() + ', port ' + postgres.PORT;
});

controle('les trois langages livrés sont intacts', () => {
  const sortie = execFileSync(process.execPath, ['--input-type=module', '-e',
    "import {GENRES, C17} from './src/langages/registre.ts';"
    + "import {PYTHON} from './src/langages/python/langage.ts';"
    + "import {JAVA} from './src/langages/java/langage.ts';"
    + "console.log([GENRES.size, C17.portees.size, PYTHON.portees.size, JAVA.portees.size].join(' '));"],
    { cwd: racine, stdio: 'pipe' }).toString().trim();
  const [genres, c, py, ja] = sortie.split(' ').map(Number);
  return genres === 84 && c === 84 && py === 33 && ja === 57
    ? `oui : ${genres} genres, C17 ${c}, Python ${py}, Java ${ja}`
    : `ECART : ${sortie} (attendu 84 84 33 57)`;
});

controle('branche et avance sur main', () => {
  const git = (...args) => execFileSync('git', args, { cwd: racine, stdio: 'pipe' }).toString().trim();
  const branche = git('rev-parse', '--abbrev-ref', 'HEAD');
  const avance = git('rev-list', '--count', 'main..HEAD');
  return `branche ${branche}, ${avance} commit(s) en avance sur main`;
});
