// Ecrit le corps EXACT a coller dans une release GitHub.
//
// Pourquoi ce script existe : la procedure disait « coller le document a
// partir du trait horizontal ». Une instruction qui demande a un humain de
// reperer un trait horizontal se trompe un jour sur deux, et c'est arrive :
// la release 0.5.0 est partie avec le titre du gabarit en double et avec la
// ligne « Corps de la release GitHub, pret a coller » VISIBLE par les
// lecteurs. Le defaut n'etait pas la personne, c'etait l'instruction.
//
// Le document reste la source unique. Ce script en retire seulement l'en-tete
// de gabarit : tout ce qui precede le premier trait horizontal.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const version = process.argv[2] ?? '0_5_0';
const source = path.join(racine, 'docs', `NOTES_PUBLICATION_${version}.md`);
const texte = readFileSync(source, 'utf8');

const SEPARATEUR = /^---$/mu;
const coupe = texte.search(SEPARATEUR);
if (coupe === -1) throw new Error(`aucun trait horizontal dans ${source} : rien a couper`);
const corps = texte.slice(coupe).replace(SEPARATEUR, '').replace(/^\s+/u, '');

// Garde : l'en-tete de gabarit ne doit JAMAIS survivre a la coupe.
for (const interdit of ['pret a coller', 'prêt à coller', '# A ']) {
  if (corps.includes(interdit)) throw new Error(`l'en-tete de gabarit a survecu : « ${interdit} »`);
}
if (corps.trim() === '') throw new Error('corps vide apres la coupe');

const sortie = path.join(racine, 'dist', `notes-release-v${version.replace(/_/gu, '.')}.md`);
mkdirSync(path.dirname(sortie), { recursive: true });
writeFileSync(sortie, corps, 'utf8');
console.log(`corps a coller : ${sortie}`);
console.log(`${corps.split('\n').length} lignes, ${corps.length} caracteres`);
console.log(`premiere ligne : ${corps.split('\n')[0]}`);
