// Retire les chemins personnels des fichiers suivis par git.
//
//   node scripts/anonymiser.mjs            (liste, ne modifie rien)
//   node scripts/anonymiser.mjs --ecrire   (remplace)
//
// Pourquoi : un journal de compilation publie les chemins que GCC a cités, et
// un chemin absolu Windows contient le NOM DE L'UTILISATEUR. Les journaux
// restent des preuves ; seul le nom disparaît. Les scripts de compilation
// lancent désormais GCC avec des chemins relatifs, donc ce nettoyage ne
// concerne que les journaux écrits avant cette correction.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { basename } from 'node:path';

const ecrire = process.argv.includes('--ecrire');
const utilisateur = basename(homedir());

/** Les deux écritures Windows du dossier personnel, barre oblique et
 * antislash, insensibles à la casse du lecteur. */
const MOTIFS = [
  [new RegExp('[A-Za-z]:[\\\\/]Users[\\\\/]' + utilisateur, 'gu'), '<DOSSIER-PERSONNEL>'],
  [new RegExp('/home/' + utilisateur, 'gu'), '<DOSSIER-PERSONNEL>'],
];

const suivis = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
let touches = 0;
let occurrences = 0;

for (const chemin of suivis) {
  let contenu;
  try { contenu = readFileSync(chemin, 'utf8'); } catch { continue; }
  if (contenu.includes('\0')) continue; // binaire
  let remplace = contenu;
  for (const [motif, par] of MOTIFS) remplace = remplace.replace(motif, par);
  if (remplace === contenu) continue;
  const compte = (contenu.match(MOTIFS[0][0]) ?? []).length + (contenu.match(MOTIFS[1][0]) ?? []).length;
  occurrences += compte;
  touches++;
  console.log((ecrire ? 'réécrit  ' : 'à réécrire ') + chemin + '  (' + compte + ')');
  if (ecrire) writeFileSync(chemin, remplace, 'utf8');
}

console.log('fichiers : ' + touches + ' | occurrences : ' + occurrences
  + (ecrire ? '' : ' | relance avec --ecrire pour remplacer'));
