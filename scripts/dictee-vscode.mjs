// Lance la dictée d'un exercice dans une instance RÉELLE de VS Code, puis
// compare le C obtenu à celui que le moteur écrit hors de l'éditeur.
//
//   node scripts/dictee-vscode.mjs cloture        (exercice/promotion/ca/notes.c)
//   node scripts/dictee-vscode.mjs ex1            (test-utilisateur/corriges/ex1.c)
//
// Le seul texte saisi dans l'éditeur est du français : aucune ligne de C
// n'est tapée ni collée. Si les deux C diffèrent, le script le dit et
// échoue — c'est le but de la comparaison.
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const quoi = process.argv[2] ?? 'cloture';

const { FICHIERS } = await import('../exercice/promotion/scenario.mjs');
const { EXERCICES } = await import('../test-utilisateur/enonces.mjs');
const catalogue = new Map();
for (const fichier of FICHIERS) catalogue.set('cloture', { ...fichier, reference: 'exercice/promotion/ca/' + fichier.name });
for (const exercice of EXERCICES) {
  catalogue.set(exercice.name.replace(/\.c$/u, ''),
    { ...exercice, reference: 'test-utilisateur/corriges/' + exercice.name });
}

const choisi = catalogue.get(quoi);
if (!choisi) {
  console.error('Dictée inconnue : ' + quoi + '. Disponibles : ' + [...catalogue.keys()].join(', '));
  process.exit(2);
}

const isolated = path.join(root, '.cache', 'dictee');
const workspace = path.join(isolated, 'workspace');
const profile = path.join(isolated, 'profile');
const report = path.join(isolated, 'rapport.json');
const produit = path.join(isolated, 'produit-' + choisi.name);
const executable = process.env.VSCODE_EXECUTABLE ?? (process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code', 'Code.exe') : undefined);
if (!executable || !existsSync(executable)) throw new Error('Définissez VSCODE_EXECUTABLE vers l’exécutable VS Code.');

mkdirSync(workspace, { recursive: true });
mkdirSync(path.join(profile, 'User'), { recursive: true });
rmSync(report, { force: true });
rmSync(produit, { force: true });
writeFileSync(path.join(profile, 'User', 'settings.json'), JSON.stringify({
  'files.autoSave': 'off', 'editor.formatOnSave': false, 'editor.formatOnType': false,
  'workbench.startupEditor': 'none', 'window.restoreWindows': 'none', 'extensions.autoUpdate': false,
  'update.mode': 'none', 'telemetry.telemetryLevel': 'off', 'files.eol': '\n',
}));
const consigne = path.join(isolated, 'dictee.json');
writeFileSync(consigne, JSON.stringify({ name: choisi.name, steps: choisi.steps }, null, 2));

const env = { ...process.env, CA_TEST_REPORT: report, CA_TEST_WORKSPACE: workspace,
  CA_DICTEE: consigne, CA_DICTEE_OUT: produit };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, [workspace,
  `--extensionDevelopmentPath=${path.join(root, 'extension')}`,
  `--extensionTestsPath=${path.join(root, 'test', 'vscode', 'dictee.cjs')}`,
  `--user-data-dir=${profile}`, `--extensions-dir=${path.join(isolated, 'extensions')}`,
  '--new-window', '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes',
  '--disable-gpu', '--in-process-gpu',
], { windowsHide: true, stdio: 'inherit', env });
let exitCode;
let spawnError;
child.on('error', error => { spawnError = error; });
child.on('exit', code => { exitCode = code; });
const started = Date.now();
while (!existsSync(report) && !spawnError && (exitCode === undefined || exitCode === 0) && Date.now() - started < 900_000) {
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (spawnError) throw spawnError;
if (!existsSync(report)) {
  child.kill();
  throw new Error('L’hôte VS Code n’a pas produit de rapport (code ' + String(exitCode) + ').');
}

const resultat = JSON.parse(readFileSync(report, 'utf8'));
console.log('dictée              :', quoi, '→', choisi.name);
console.log('VS Code             :', resultat.vscode);
console.log('insérées            :', resultat.inserees);
console.log('refus               :', resultat.refus);
console.log('gestes d’éditeur    :', resultat.gestes);
if (resultat.erreur) console.log('ERREUR :', resultat.erreur);

let identique;
if (existsSync(produit)) {
  const normaliser = texte => texte.replace(/\r\n/gu, '\n');
  const obtenu = normaliser(readFileSync(produit, 'utf8'));
  const attendu = normaliser(readFileSync(path.join(root, choisi.reference), 'utf8'));
  identique = obtenu === attendu;
  console.log('C produit dans VS Code identique au C du moteur :', identique ? 'OUI' : 'NON');
  if (!identique) {
    const a = obtenu.split('\n');
    const b = attendu.split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) console.log('  ligne ' + (i + 1) + '\n    VS Code : ' + JSON.stringify(a[i])
        + '\n    moteur  : ' + JSON.stringify(b[i]));
    }
  }
  writeFileSync(path.join(isolated, 'comparaison.txt'),
    'dictee ' + quoi + '\ninserees ' + resultat.inserees + '\nrefus ' + resultat.refus
    + '\ngestes ' + resultat.gestes + '\nidentique ' + identique + '\n', 'utf8');
}
console.log('rapport             :', report);
console.log('C produit           :', produit);
process.exitCode = resultat.failed === 0 && identique === true ? 0 : 1;
