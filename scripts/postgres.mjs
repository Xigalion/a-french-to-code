// Localise un PostgreSQL **portable**, et ne révèle jamais de chemin absolu.
//
// Même contrat que `scripts/jdk.mjs`, pour la même raison : l'outil vit HORS
// du dépôt, et un contrôle de pré-publication refuse tout chemin personnel
// dans un fichier versionné. Les fonctions d'ici renvoient donc des chemins
// utilisables, mais `decrire()` n'imprime que du relatif.
//
//   CA_PGSQL_HOME   si définie, elle gagne
//   ../pg-portable/pgsql   le dossier frère du dépôt, par défaut
//   le PATH          en dernier recours
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Le port du serveur de test. **Non standard, et volontairement** : 5432
 * appartiendrait à une installation réelle de la machine, et s'y connecter par
 * mégarde ferait jouer des instructions destructrices sur les données de
 * quelqu'un. */
export const PORT = 55432;
export const UTILISATEUR = 'ca_test';
export const BASE = 'ca_essai';

const CANDIDATS = [
  process.env.CA_PGSQL_HOME,
  resolve(racine, '..', 'pg-portable', 'pgsql'),
].filter(chemin => chemin !== undefined);

/** Le dossier `bin` de PostgreSQL, ou `undefined` s'il n'est pas installé.
 * `undefined` n'est pas une erreur : la phase 4 doit pouvoir avancer sans
 * serveur, et un script qui s'arrête ici dirait le contraire. */
export function binaires() {
  for (const candidat of CANDIDATS) {
    const bin = join(candidat, 'bin');
    if (existsSync(join(bin, 'psql.exe')) || existsSync(join(bin, 'psql'))) return bin;
  }
  try {
    execFileSync('psql', ['--version'], { stdio: 'pipe' });
    return '';   // dans le PATH : les outils s'appellent par leur nom
  } catch { return undefined; }
}

export function outil(nom) {
  const bin = binaires();
  if (bin === undefined) return undefined;
  return bin === '' ? nom : join(bin, nom);
}

export function version() {
  const psql = outil('psql');
  if (psql === undefined) return undefined;
  return execFileSync(psql, ['--version'], { stdio: 'pipe' }).toString().trim();
}

/** Où il est, en **relatif** au dépôt, pour qu'un journal versionné puisse le
 * citer sans nommer la machine ni son utilisateur. */
export function decrire() {
  const bin = binaires();
  if (bin === undefined) return 'absent';
  if (bin === '') return 'dans le PATH';
  const chemin = relative(racine, bin).split('\\').join('/');
  return chemin.startsWith('..') ? chemin : './' + chemin;
}

if (process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].split('\\').join('/'))) {
  const v = version();
  console.log('PostgreSQL : ' + (v ?? 'ABSENT'));
  console.log('emplacement : ' + decrire());
  console.log('port de test : ' + PORT + '  (non standard, pour ne jamais toucher une base réelle)');
}
