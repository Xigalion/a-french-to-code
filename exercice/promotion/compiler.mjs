// Compile et exécute l'exercice de clôture. Le compilateur se donne en
// argument ou par CA_GCC : aucun n'est supposé installé.
//
//   node exercice/promotion/compiler.mjs "C:\\...\\gcc.exe"
//
// Trois vérifications, pas une : compilation sans avertissement, exécution,
// et SORTIE ATTENDUE calculée à la main depuis les données. Une exécution qui
// se termine en code 0 ne prouve pas que le programme calcule juste.
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { DONNEES } from './scenario.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const gcc = process.argv[2] ?? process.env.CA_GCC;
if (gcc === undefined || !existsSync(gcc)) {
  console.error('Compilateur introuvable : node exercice/promotion/compiler.mjs <gcc.exe>');
  process.exit(2);
}

/** Calculé à la main depuis DONNEES, avant toute exécution.
 * A : 12+15+9 = 36 ; B : 18+14+16 = 48 ; C : 8+11+10 = 29.
 * cumul = 113 ; moyenne = 113/9 = 12,555… → « 12.56 » ; mention P → passable.
 * classement décroissant : 48 36 29. Meilleur : B, soit 66 en %d.
 * notes >= 10 : 12, 15, 18, 14, 16, 11, 10 → 7. Boucle à test final : k = 3.
 * sizeof(struct Etudiant) : dépendant de l'implémentation, non prédit. */
const ATTENDU = { sortie: '12.56\npassable\n48 36 29 \n66\n7\n3\n', resultat: '48 36 29 ' };

const travail = root + 'journal/build';
rmSync(travail, { recursive: true, force: true });
mkdirSync(travail, { recursive: true });
copyFileSync(root + 'ca/notes.c', travail + '/notes.c');
for (const nom of Object.keys(DONNEES)) copyFileSync(root + 'ca/' + nom, travail + '/' + nom);

const OPTIONS = ['-std=c17', '-Wall', '-Wextra', '-pedantic'];
const lignes = ['Exercice de cloture — compilation et execution', '=============================================',
  'gcc     : ' + execFileSync(gcc, ['--version'], { encoding: 'utf8' }).split('\n')[0],
  'options : ' + OPTIONS.join(' '), 'date    : ' + new Date().toISOString().slice(0, 10), ''];
let anomalies = 0;

// Lance depuis le dossier de travail, avec des chemins RELATIFS : un
// avertissement de GCC cite le chemin qu'on lui donne, et un journal publie
// ce qu'il contient. Aucun chemin absolu, donc aucun nom d'utilisateur.
const compilation = spawnSync(gcc, [...OPTIONS, 'notes.c', '-o', 'notes.exe'],
  { encoding: 'utf8', cwd: travail });
lignes.push('--- compilation ---', 'code   : ' + compilation.status);
const stderr = (compilation.stderr ?? '').trim();
lignes.push('stderr : ' + (stderr === '' ? '(vide)' : '\n' + stderr));
if (compilation.status !== 0 || stderr !== '') anomalies++;

if (compilation.status === 0) {
  const execution = spawnSync(travail + '/notes.exe', [], { encoding: 'utf8', cwd: travail });
  const sortie = (execution.stdout ?? '').replace(/\r\n/gu, '\n');
  lignes.push('', '--- execution ---', 'code   : ' + execution.status, 'sortie : ' + JSON.stringify(sortie));
  if (execution.status !== 0) anomalies++;

  // La derniere ligne est la taille de la structure : dependante de
  // l'implementation, donc verifiee comme un nombre et non comme une valeur.
  const taille = /^(\d+)\n?$/u.exec(sortie.slice(ATTENDU.sortie.length));
  lignes.push('attendu: ' + JSON.stringify(ATTENDU.sortie) + ' + sizeof');
  const conforme = sortie.startsWith(ATTENDU.sortie) && taille !== null;
  lignes.push('verdict: ' + (conforme ? 'CONFORME au calcul fait a la main' : 'NON CONFORME'));
  if (!conforme) anomalies++;
  if (taille) lignes.push('sizeof(struct Etudiant) : ' + taille[1] + ' octets (implementation-defined)');

  const ecrit = existsSync(travail + '/resultat.txt') ? readFileSync(travail + '/resultat.txt', 'utf8') : '(absent)';
  lignes.push('', '--- fichier ecrit ---', 'resultat.txt : ' + JSON.stringify(ecrit),
    'attendu      : ' + JSON.stringify(ATTENDU.resultat));
  if (ecrit !== ATTENDU.resultat) anomalies++;

  // Chemin d'erreur : le programme assure f != 0 par une assertion. Sans le
  // fichier de donnees, il doit echouer BRUYAMMENT, pas calculer n'importe quoi.
  rmSync(travail + '/notes.txt', { force: true });
  const sansDonnees = spawnSync(travail + '/notes.exe', [], { encoding: 'utf8', cwd: travail });
  lignes.push('', '--- chemin d’erreur : notes.txt absent ---',
    'code   : ' + sansDonnees.status, 'stderr : ' + JSON.stringify((sansDonnees.stderr ?? '').trim()));
  if (sansDonnees.status === 0) { lignes.push('verdict: NON CONFORME — l’assertion n’a pas arrete le programme'); anomalies++; }
  else lignes.push('verdict: conforme — l’assertion a arrete le programme');
}

lignes.push('', 'fichiers du dossier de travail : ' + readdirSync(travail).join(', '));
lignes.push('anomalies : ' + anomalies);
writeFileSync(root + 'journal/compilation.txt', lignes.join('\n') + '\n', 'utf8');
console.log(lignes.join('\n'));
process.exit(anomalies === 0 ? 0 : 1);
