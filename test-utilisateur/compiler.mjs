// Compile les neuf corrigés avec GCC en C17, les exécute quand c'est pertinent,
// et écrit le journal. Le chemin du compilateur se donne en argument ou par la
// variable CA_GCC : aucun compilateur n'est supposé installé.
//
//   node test-utilisateur/compiler.mjs "C:\\...\\gcc.exe"
//
// Les sorties relevées ici sont celles que les énoncés citent. Une sortie
// prédite de mémoire n'a aucune valeur : la campagne 1 l'a payé une fois.
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { EXERCICES } from './enonces.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const gcc = process.argv[2] ?? process.env.CA_GCC;
if (gcc === undefined || !existsSync(gcc)) {
  console.error('Compilateur introuvable. Donne son chemin : node test-utilisateur/compiler.mjs <gcc.exe>');
  process.exit(2);
}

const travail = root + 'journal/build';
rmSync(travail, { recursive: true, force: true });
mkdirSync(travail, { recursive: true });

const OPTIONS = ['-std=c17', '-Wall', '-Wextra', '-pedantic'];
const lignes = ['Compilation et execution des neuf corriges', '==========================================',
  'gcc     : ' + execFileSync(gcc, ['--version'], { encoding: 'utf8' }).split('\n')[0],
  'options : ' + OPTIONS.join(' '), 'date    : ' + new Date().toISOString().slice(0, 10), ''];
let anomalies = 0;

for (const exercice of EXERCICES) {
  const source = root + 'corriges/' + exercice.name;
  const binaire = travail + '/' + exercice.name.replace(/\.c$/u, '.exe');
  const compilation = spawnSync(gcc, [...OPTIONS, source, '-o', binaire], { encoding: 'utf8' });
  const avertissements = (compilation.stderr ?? '').trim();

  lignes.push('--- ' + exercice.name + ' ---');
  lignes.push('compilation : code ' + compilation.status);
  if (avertissements !== '') lignes.push('stderr :', avertissements);
  if (compilation.status !== 0) { anomalies++; lignes.push(''); continue; }

  if (exercice.executer === false) {
    lignes.push('execution   : VOLONTAIREMENT NON EXECUTE (comportement indefini)');
    lignes.push('');
    continue;
  }
  const execution = spawnSync(binaire, [], { encoding: 'utf8', cwd: travail });
  lignes.push('execution   : code ' + execution.status);
  lignes.push('sortie      : ' + JSON.stringify(execution.stdout ?? ''));
  if ((execution.stderr ?? '') !== '') lignes.push('stderr      : ' + JSON.stringify(execution.stderr));
  if (execution.status !== 0) anomalies++;
  lignes.push('');
}

const ecrits = readdirSync(travail).filter(nom => !nom.endsWith('.exe'));
lignes.push('fichiers ecrits par les programmes : ' + (ecrits.join(', ') || 'aucun'));
lignes.push('anomalies (compilation ou execution non nulle) : ' + anomalies);

writeFileSync(root + 'journal/compilation.txt', lignes.join('\n') + '\n', 'utf8');
console.log(lignes.join('\n'));
process.exit(anomalies === 0 ? 0 : 1);
