// Écrit les corrigés des neuf exercices avec le moteur RÉEL de C-A.
//
//   node --experimental-strip-types test-utilisateur/generer.mjs
//
// La mécanique (translate → planPlacement → application de l'unique édition)
// vit dans `scripts/ecrirePhrases.mjs`, partagée avec l'exercice de clôture :
// deux copies d'un même chemin finiraient par diverger.
//
// Aucune retouche à la main : si un exercice n'est pas faisable avec le seul
// catalogue, le journal le dit au lieu de le cacher.
import { writeFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { ecrire } from '../scripts/ecrirePhrases.mjs';
import { EXERCICES, REFUS_ANNONCES } from './enonces.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const { bilan, refus } = ecrire(EXERCICES, {
  dossier: root + 'corriges',
  journal: root + 'journal',
  titre: 'Corrigés des neuf exercices — journal de production',
});

const lignes = ['Refus annonces par les enonces', '=============================='];
let surprises = 0;
for (const [etiquette, phrase] of REFUS_ANNONCES) {
  const r = translate(phrase);
  const accepte = r.status === 'translated';
  if (accepte) surprises++;
  lignes.push((accepte ? 'ACCEPTEE (l’enonce est faux) ' : 'refusee                      ') + etiquette
    + ' | ' + phrase + ' -> ' + (accepte ? r.fragments[0].code.replace(/\n$/u, '') : r.diagnostics[0].code));
}
writeFileSync(root + 'journal/refus-annonces.txt', lignes.join('\n') + '\n', 'utf8');

for (const b of bilan) {
  console.log(b.name.padEnd(8), 'inserees', String(b.inseres).padStart(3), '| gestes', b.gestes,
    '| infos', String(b.informations).padStart(3), '| avert', b.avertissements, '| refus', b.refus);
}
console.log(lignes.join('\n'));
process.exit(refus.length === 0 && surprises === 0 ? 0 : 1);
