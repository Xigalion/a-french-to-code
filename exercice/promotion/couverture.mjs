// Quelles intentions l'exercice de clôture n'emploie PAS.
//
//   node --experimental-strip-types exercice/promotion/couverture.mjs
//
// La référence est `docs/CATALOGUE.md`, relu par le moteur : toute intention
// qu'une phrase du catalogue produit doit être soit employée, soit nommée
// comme non employée. « Couvert » ici veut dire « employé dans un programme
// compilé », et rien d'autre.
import { readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const depot = root + '../../';

const CATALOGUE = readFileSync(depot + 'docs/CATALOGUE.md', 'utf8');
const phrases = CATALOGUE.split('\n')
  .filter(ligne => ligne.startsWith('| `'))
  .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1])
  .filter(phrase => phrase !== undefined);

/** Une phrase par intention, prise du catalogue et non écrite de mémoire. */
const exemple = new Map();
for (const phrase of phrases) {
  const r = translate(phrase);
  if (r.status === 'translated' && !exemple.has(r.instruction.kind)) exemple.set(r.instruction.kind, phrase);
}

const lu = chemin => { try { return JSON.parse(readFileSync(chemin, 'utf8')); } catch { return []; } };
const sources = {
  'exercice de clôture': lu(root + 'journal/genres.json'),
  'compléments de clôture': lu(root + 'journal-complements/genres.json'),
  'cahier du test utilisateur': lu(depot + 'test-utilisateur/journal/genres.json'),
  'campagne 3': lu(depot + 'exercice/campagne3/journal/intentions.json'),
  'campagne 2': lu(depot + 'exercice/campagne2/journal/intentions.json'),
};

const employes = new Set();
for (const genres of Object.values(sources)) for (const genre of genres) employes.add(genre);
const cloture = new Set([...sources['exercice de clôture'], ...sources['compléments de clôture']]);

const tous = [...exemple.keys()].sort();
const manquants = tous.filter(genre => !cloture.has(genre));
const jamais = tous.filter(genre => !employes.has(genre));

const lignes = ['# Couverture de l’exercice de clôture', '',
  '| | |', '|---|---|',
  '| intentions du catalogue | **' + tous.length + '** |',
  '| employées par la clôture (exercice + compléments) | **' + (tous.length - manquants.length) + '** |',
  '| non employées par la clôture | **' + manquants.length + '** |',
  '| jamais employées par AUCUNE campagne ni cahier | **' + jamais.length + '** |', ''];

lignes.push('## Non employées par l’exercice de clôture', '',
  '| Intention | Phrase du catalogue | Couverte ailleurs ? |', '|---|---|---|');
for (const genre of manquants) {
  const ailleurs = Object.entries(sources).filter(([nom, liste]) => nom !== 'exercice de clôture'
    && nom !== 'compléments de clôture' && liste.includes(genre)).map(([nom]) => nom);
  lignes.push('| `' + genre + '` | `' + exemple.get(genre) + '` | '
    + (ailleurs.length ? ailleurs.join(', ') : '**non**') + ' |');
}
lignes.push('');
lignes.push('## Jamais employées, nulle part', '');
if (jamais.length === 0) lignes.push('*Aucune : toute intention du catalogue a été employée au moins une fois.*');
else for (const genre of jamais) lignes.push('- `' + genre + '` — `' + exemple.get(genre) + '`');
lignes.push('');

writeFileSync(root + 'journal/couverture.md', lignes.join('\n') + '\n', 'utf8');
console.log('intentions du catalogue        :', tous.length);
console.log('employées par la clôture       :', tous.length - manquants.length);
console.log('non employées par la clôture   :', manquants.length);
console.log('jamais employées nulle part    :', jamais.length);
for (const genre of jamais) console.log('   JAMAIS', genre, '|', exemple.get(genre));
for (const genre of manquants) console.log('   hors clôture', genre);
