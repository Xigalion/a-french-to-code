// EXPÉRIENCE — mesure ce que la sonde Python rend, refuse, et ce qui marche.
//
//   node --experimental-strip-types experiences/python/mesurer.mjs
//
// Trois mesures, et un programme réellement exécuté :
//   1. couverture : sur les 84 intentions du catalogue, combien se rendent en
//      Python sans rien inventer, et combien sont refusées avec leur raison ;
//   2. un programme écrit en phrases françaises DU CATALOGUE, rendu en
//      Python, exécuté par python3, et comparé à un résultat calculé à la
//      main AVANT exécution ;
//   3. les phrases que C-A accepte et que Python refuse : la liste est le
//      vrai résultat de l'expérience.
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { Refus, rendre } from './rendu.mjs';

const racine = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const ici = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
mkdirSync(ici + 'sortie', { recursive: true });

// --- 1. Couverture sur tout le catalogue -----------------------------------

const CATALOGUE = readFileSync(racine + 'docs/CATALOGUE.md', 'utf8');
const phrases = CATALOGUE.split('\n').filter(l => l.startsWith('| `'))
  .map(l => /^\| `(.+?)` \|/u.exec(l)?.[1]).filter(Boolean);

const parGenre = new Map();
for (const phrase of phrases) {
  const r = translate(phrase);
  if (r.status === 'translated' && !parGenre.has(r.instruction.kind)) parGenre.set(r.instruction.kind, { phrase, r });
}

const rendues = [];
const refusees = [];
for (const [genre, { phrase, r }] of parGenre) {
  try {
    const sortie = rendre(r.instruction);
    rendues.push({ genre, phrase, c: r.fragments[0].code.replace(/\n$/u, '').replace(/\n/gu, ' ⏎ '),
      python: sortie.lignes.join(' ⏎ '), ouvre: sortie.ouvre });
  } catch (erreur) {
    if (!(erreur instanceof Refus)) throw erreur;
    refusees.push({ genre, phrase, code: erreur.code, raison: erreur.raison });
  }
}

// --- 2. Un programme, rendu puis EXÉCUTÉ -----------------------------------

/** Les phrases sont celles du catalogue de C-A, inchangées. Le niveau est
 * l'indentation Python : c'est exactement la règle de placement qui change
 * d'un langage à l'autre, et la sonde la rend visible. */
const PROGRAMME = [
  [0, 'Crée une fonction nommée somme qui retourne un int et prend un int nommé a et un int nommé b et un int nommé c.'],
  [1, 'Retourne le résultat de "a + b + c".'],
  [0, 'Crée un entier nommé total de valeur 0.'],
  [0, 'Affecte à total le résultat de l’appel de somme avec "12" et "15" et "9".'],
  [0, 'Affiche la valeur de total.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Crée une variable de type double nommée moyenne avec le résultat de "12.0".'],
  [0, 'Affecte à moyenne le résultat numérique de "(double) total * 0.3333".'],
  [0, 'Affiche moyenne en notation fixe avec 2 décimales.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Crée un bloc si "moyenne >= 10".'],
  [1, 'Affiche le texte "admis".'],
  [0, 'Ajoute une branche sinon.'],
  [1, 'Affiche le texte "ajourne".'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Crée un entier nommé i de valeur 0.'],
  [0, 'Crée une boucle tant que "i < 4".'],
  [1, 'Affecte à i le résultat de "i + 1".'],
  [1, 'Crée un bloc si "i == 2".'],
  [2, 'Passe à l’itération suivante de la boucle la plus intérieure.'],
  [1, 'Affiche la valeur de i.'],
  [0, 'Affiche un retour à la ligne.'],
  [0, 'Vérifie que "total == 36".'],
];

/** Calculé à la main AVANT exécution.
 *  total = 12+15+9 = 36 ; moyenne = 36 * 0.3333 = 11.9988 → « 12.00 » ;
 *  11.9988 >= 10 → « admis » ; la boucle affiche 1, saute 2, puis 3 et 4. */
const ATTENDU = '36\n12.00\nadmis\n134\n';

const lignesPython = [];
const incidents = [];
for (const [niveau, phrase] of PROGRAMME) {
  const r = translate(phrase);
  if (r.status !== 'translated') { incidents.push(phrase + ' → refus C-A ' + r.diagnostics[0].code); continue; }
  try {
    const { lignes } = rendre(r.instruction);
    for (const ligne of lignes) lignesPython.push('    '.repeat(niveau) + ligne);
  } catch (erreur) {
    // Regle 4 du projet : aucun fragment partiel. Une ligne refusee ne se
    // saute pas — la sonde l'a appris en produisant un programme AMPUTE qui
    // bouclait sans fin, parce que l'increment manquait.
    incidents.push(phrase + ' → refus Python ' + erreur.code + ' : ' + erreur.raison);
    break;
  }
}
const fichier = ici + 'sortie/programme.py';
writeFileSync(fichier, lignesPython.join('\n') + '\n', 'utf8');

// Delai et tampon bornes : un programme rendu peut boucler, et la sonde
// doit le constater au lieu de remplir la memoire.
const python = incidents.length > 0
  ? { status: null, stdout: '', stderr: '(non execute : le rendu a ete refuse)' }
  : spawnSync('python3', ['-I', fichier], { encoding: 'utf8', timeout: 10_000, maxBuffer: 256 * 1024 });
const obtenu = (python.stdout ?? '').replace(/\r\n/gu, '\n');

// --- 3. Rapport ------------------------------------------------------------

const lignes = ['# Expérience — rendu Python depuis l’AST de C-A', '',
  'Produit par `node --experimental-strip-types experiences/python/mesurer.mjs`.',
  '**Sonde jetable**, isolée dans `experiences/` : ni `src/` ni les tests ne sont touchés.', '',
  '## 1. Couverture des 84 intentions', '',
  '| | Nombre | Part |', '|---|---|---|',
  '| **rendues sans rien inventer** | **' + rendues.length + '** | '
    + (Math.round((rendues.length / parGenre.size) * 1000) / 10).toFixed(1).replace('.', ',') + ' % |',
  '| **refusées, avec leur raison** | **' + refusees.length + '** | '
    + (Math.round((refusees.length / parGenre.size) * 1000) / 10).toFixed(1).replace('.', ',') + ' % |',
  '| total mesuré | ' + parGenre.size + ' | |', '',
  '## 2. Le programme rendu, puis exécuté', '',
  '`' + PROGRAMME.length + '` phrases du catalogue, **inchangées**, rendues en Python et exécutées.', '',
  '| | |', '|---|---|',
  '| incidents de rendu | ' + (incidents.length === 0 ? '**aucun**' : '**' + incidents.length + '**') + ' |',
  '| code de sortie de `python3` | **' + python.status + '** |',
  '| sortie obtenue | `' + JSON.stringify(obtenu) + '` |',
  '| sortie attendue, calculée à la main | `' + JSON.stringify(ATTENDU) + '` |',
  '| verdict | ' + (obtenu === ATTENDU ? '**CONFORME**' : '**NON CONFORME**') + ' |', ''];
if (incidents.length) { lignes.push('Incidents :', ''); for (const i of incidents) lignes.push('- ' + i); lignes.push(''); }
if ((python.stderr ?? '').trim() !== '') lignes.push('`stderr` :', '', '    ' + python.stderr.trim().split('\n').join('\n    '), '');

lignes.push('Le programme produit :', '', '```python', ...lignesPython, '```', '',
  '## 3. Ce que Python refuse, et pourquoi', '',
  'C’est le vrai résultat de l’expérience : chaque ligne est une **décision de',
  'contrat** à prendre avant d’écrire une ligne de code définitif.', '',
  '| Intention | Phrase française | Raison du refus |', '|---|---|---|');
for (const r of refusees.sort((a, b) => a.genre.localeCompare(b.genre))) {
  lignes.push('| `' + r.genre + '` | `' + r.phrase + '` | ' + r.raison + ' |');
}
lignes.push('', '## 4. Les intentions rendues, C puis Python', '',
  '| Intention | C17 | Python |', '|---|---|---|');
for (const r of rendues.sort((a, b) => a.genre.localeCompare(b.genre))) {
  lignes.push('| `' + r.genre + '` | `' + r.c + '` | `' + r.python + '` |');
}
lignes.push('');
writeFileSync(ici + 'sortie/MESURES.md', lignes.join('\n') + '\n', 'utf8');

console.log('intentions mesurées :', parGenre.size);
console.log('  rendues           :', rendues.length);
console.log('  refusées          :', refusees.length);
console.log('programme : incidents', incidents.length, '| python3 code', python.status);
console.log('  sortie   :', JSON.stringify(obtenu));
console.log('  attendue :', JSON.stringify(ATTENDU));
console.log('  verdict  :', obtenu === ATTENDU ? 'CONFORME' : 'NON CONFORME');
for (const i of incidents) console.log('  incident :', i);
if ((python.stderr ?? '').trim()) console.log('  stderr   :', python.stderr.trim().split('\n')[0]);
console.log('rapport   : experiences/python/sortie/MESURES.md');
