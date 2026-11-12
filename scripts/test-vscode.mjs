import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const isolated = path.join(root, '.cache', 'vscode-test');
const report = path.join(isolated, 'results.json');
const workspace = path.join(isolated, 'workspace');
const profile = path.join(isolated, 'profile');
const executable = process.env.VSCODE_EXECUTABLE ?? (process.platform === 'win32'
  ? path.join(process.env.LOCALAPPDATA ?? '', 'Programs', 'Microsoft VS Code', 'Code.exe') : undefined);
if (!executable || !existsSync(executable)) throw new Error('Définissez VSCODE_EXECUTABLE vers l’exécutable VS Code bureau installé.');
mkdirSync(workspace, { recursive: true });
mkdirSync(path.join(profile, 'User'), { recursive: true });
rmSync(report, { force: true });
writeFileSync(path.join(profile, 'User', 'settings.json'), JSON.stringify({
  'files.autoSave': 'off', 'editor.formatOnSave': false, 'editor.formatOnType': false,
  'workbench.startupEditor': 'none', 'window.restoreWindows': 'none', 'extensions.autoUpdate': false,
  'update.mode': 'none', 'telemetry.telemetryLevel': 'off',
}));
const env = { ...process.env, CA_TEST_ROOT: root, CA_TEST_REPORT: report, CA_TEST_WORKSPACE: workspace };
delete env.ELECTRON_RUN_AS_NODE;
const child = spawn(executable, [workspace,
  `--extensionDevelopmentPath=${path.join(root, 'extension')}`,
  `--extensionTestsPath=${path.join(root, 'test', 'vscode', 'suite.cjs')}`,
  `--user-data-dir=${profile}`, `--extensions-dir=${path.join(isolated, 'extensions')}`,
  '--new-window', '--disable-extensions', '--disable-workspace-trust', '--skip-welcome', '--skip-release-notes',
  '--disable-gpu', '--in-process-gpu',
], { windowsHide: true, stdio: 'inherit', env });
let spawnError;
let exitCode;
child.on('error', error => { spawnError = error; });
child.on('exit', code => { exitCode = code; });
const started = Date.now();
while (!existsSync(report) && !spawnError && (exitCode === undefined || exitCode === 0) && Date.now() - started < 240_000) {
  await new Promise(resolve => setTimeout(resolve, 500));
}
if (spawnError) throw spawnError;
if (!existsSync(report)) {
  child.kill();
  throw new Error(`L’hôte VS Code n’a pas produit de rapport (code de sortie : ${String(exitCode)}). Voir .cache/vscode-test/profile/logs.`);
}
const result = JSON.parse(readFileSync(report, 'utf8'));
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.failed === 0 ? 0 : 1;
