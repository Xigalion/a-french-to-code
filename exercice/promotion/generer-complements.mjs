// Écrit les tests complémentaires avec le moteur réel.
//
//   node --experimental-strip-types exercice/promotion/generer-complements.mjs
import { writeFileSync } from 'node:fs';
import { ecrire } from '../../scripts/ecrirePhrases.mjs';
import { DONNEES, FICHIERS } from './complements.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const { bilan, refus } = ecrire(FICHIERS, {
  dossier: root + 'complements',
  journal: root + 'journal-complements',
  titre: 'Tests complémentaires — production du C brut',
});
for (const [nom, contenu] of Object.entries(DONNEES)) writeFileSync(root + 'complements/' + nom, contenu, 'utf8');
for (const b of bilan) {
  console.log(b.name.padEnd(14), '| inserees', String(b.inseres).padStart(3), '| gestes', b.gestes,
    '| infos', String(b.informations).padStart(3), '| refus', b.refus);
}
for (const r of refus) console.log('  REFUS', r.etape, r.code, '|', r.phrase, '|', r.message);
process.exit(refus.length === 0 ? 0 : 1);
