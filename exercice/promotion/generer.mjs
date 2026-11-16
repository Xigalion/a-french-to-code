// Écrit exercice/promotion/ca/notes.c avec le moteur réel, puis vérifie les
// refus que l'énoncé annonce.
//
//   node --experimental-strip-types exercice/promotion/generer.mjs
//
// Sortie non nulle si une phrase de l'exercice est refusée : un exercice de
// clôture dont une étape manque n'est pas un exercice réussi.
import { writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { ecrire } from '../../scripts/ecrirePhrases.mjs';
import { DONNEES, FICHIERS, REFUS_ATTENDUS } from './scenario.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const { bilan, refus } = ecrire(FICHIERS, {
  dossier: root + 'ca',
  journal: root + 'journal',
  titre: 'Exercice de clôture — production du C brut',
});

for (const [nom, contenu] of Object.entries(DONNEES)) writeFileSync(root + 'ca/' + nom, contenu, 'utf8');

const lignes = ['Refus attendus par l’enonce', '==========================='];
let surprises = 0;
for (const [etiquette, phrase] of REFUS_ATTENDUS) {
  const r = translate(phrase);
  const accepte = r.status === 'translated';
  if (accepte) surprises++;
  lignes.push((accepte ? 'ACCEPTEE (surprise) ' : 'refusee            ') + etiquette
    + ' | ' + phrase + ' -> ' + (accepte ? r.fragments[0].code.replace(/\n$/u, '') : r.diagnostics[0].code));
}
writeFileSync(root + 'journal/refus-attendus.txt', lignes.join('\n') + '\n', 'utf8');

for (const b of bilan) {
  console.log(b.name, '| inserees', b.inseres, '| gestes', b.gestes, '| infos', b.informations,
    '| avert', b.avertissements, '| refus', b.refus);
}
for (const r of refus) console.log('  REFUS', r.etape, r.code, '|', r.phrase);
console.log(lignes.join('\n'));
process.exit(refus.length === 0 ? 0 : 1);
