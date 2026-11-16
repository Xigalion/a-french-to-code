// Compile et exécute les tests complémentaires, et compare chaque sortie au
// calcul fait à la main dans `complements.mjs`.
//
//   node exercice/promotion/compiler-complements.mjs <gcc.exe>
import { execFileSync, spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { ATTENDUS, DONNEES, ENTETES, FICHIERS } from './complements.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const gcc = process.argv[2] ?? process.env.CA_GCC;
if (gcc === undefined || !existsSync(gcc)) {
  console.error('Compilateur introuvable : node exercice/promotion/compiler-complements.mjs <gcc.exe>');
  process.exit(2);
}

const travail = root + 'journal-complements/build';
rmSync(travail, { recursive: true, force: true });
mkdirSync(travail, { recursive: true });
for (const fichier of FICHIERS) copyFileSync(root + 'complements/' + fichier.name, travail + '/' + fichier.name);
for (const nom of Object.keys(DONNEES)) copyFileSync(root + 'complements/' + nom, travail + '/' + nom);

const OPTIONS = ['-std=c17', '-Wall', '-Wextra', '-pedantic'];
const lignes = ['Tests complementaires — compilation et execution', '===============================================',
  'gcc     : ' + execFileSync(gcc, ['--version'], { encoding: 'utf8' }).split('\n')[0],
  'options : ' + OPTIONS.join(' '), 'date    : ' + new Date().toISOString().slice(0, 10), ''];
let anomalies = 0;

for (const fichier of FICHIERS) {
  if (ENTETES.includes(fichier.name)) {
    lignes.push('--- ' + fichier.name + ' ---',
      'en-tete : pas une unite de traduction, compile par le module qui l’inclut', '');
    continue;
  }
  const binaire = travail + '/' + fichier.name.replace(/\.c$/u, '.exe');
  // Chemins relatifs, lancement dans le dossier de travail : un journal
  // publie les chemins que GCC cite, et aucun ne doit etre absolu.
  const compilation = spawnSync(gcc, [...OPTIONS, '-I', '.', fichier.name, '-o', path.basename(binaire)],
    { encoding: 'utf8', cwd: travail });
  const stderr = (compilation.stderr ?? '').trim();
  lignes.push('--- ' + fichier.name + ' ---', 'compilation : code ' + compilation.status,
    'stderr      : ' + (stderr === '' ? '(vide)' : '\n' + stderr));
  if (compilation.status !== 0 || stderr !== '') { anomalies++; lignes.push(''); continue; }

  const execution = spawnSync(binaire, [], { encoding: 'utf8', cwd: travail });
  const sortie = (execution.stdout ?? '').replace(/\r\n/gu, '\n');
  const attendu = ATTENDUS[fichier.name];
  lignes.push('execution   : code ' + execution.status,
    'sortie      : ' + JSON.stringify(sortie), 'attendu     : ' + JSON.stringify(attendu));
  const conforme = sortie === attendu;
  lignes.push('verdict     : ' + (conforme ? 'CONFORME au calcul fait a la main' : 'NON CONFORME'), '');
  if (execution.status !== 0 || !conforme) anomalies++;
}

// Double inclusion : la garde d'en-tete doit la rendre inoffensive.
writeFileSync(travail + '/double.c',
  '#include "calcul.h"\n#include "calcul.h"\nint compteur = 0;\nint double_de(int a) { return a * 2; }\n'
  + 'int main(void) { return double_de(0) + compteur; }\n', 'utf8');
const garde = spawnSync(gcc, [...OPTIONS, '-I', '.', 'double.c', '-o', 'double.exe'],
  { encoding: 'utf8', cwd: travail });
lignes.push('--- garde d’en-tete sous double inclusion ---', 'compilation : code ' + garde.status,
  'stderr      : ' + JSON.stringify((garde.stderr ?? '').trim()));
if (garde.status !== 0) anomalies++;

lignes.push('', 'fichiers du dossier de travail : ' + readdirSync(travail).join(', '), 'anomalies : ' + anomalies);
writeFileSync(root + 'journal-complements/compilation.txt', lignes.join('\n') + '\n', 'utf8');
console.log(lignes.join('\n'));
process.exit(anomalies === 0 ? 0 : 1);
