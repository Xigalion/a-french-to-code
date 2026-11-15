// Campagne 2 — vérifications que la campagne 1 ne pouvait pas faire.
//
//   node --experimental-strip-types exercice/campagne2/verifier2.mjs
//
// Trois questions, posées au moteur et au planificateur réels :
//   1. le lot 26 refuse-t-il vraiment une instruction à la portée fichier ?
//   2. les trois blocages levés produisent-ils bien le C attendu ?
//   3. les six blocages restants sont-ils toujours là, et refusés proprement ?
import { writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';
import { planPlacement } from '../../src/planPlacement.ts';
import { PORTEE_FICHIER, BLOCAGES_LEVES, BLOCAGES_CAMPAGNE2 } from './scenario2.mjs';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const lines = [];
const say = (text) => { lines.push(text); console.log(text); };
let echecs = 0;

say('Campagne 2 — vérifications de portée et de blocages');
say('===================================================');
say('');

// --- 1. Portée fichier : le lot 26 ---------------------------------------
say('--- 1. Instructions posées à la PORTÉE FICHIER : doivent être refusées');
say('    (la campagne 1 les plaçait en silence, et produisait du C non');
say('     compilable sans un mot : c\'était la lacune de rang 1)');
say('');
for (const sentence of PORTEE_FICHIER) {
  const translation = translate(sentence);
  if (translation.status !== 'translated') {
    say(`  ÉCHEC   la phrase elle-même est refusée : ${sentence}`);
    echecs++;
    continue;
  }
  const result = planPlacement({ document: { id: 'v.c', revision: 0, text: '' }, cursorOffset: 0, translation });
  const ok = result.status === 'rejected' && result.diagnostics[0].code === 'STATEMENT_AT_FILE_SCOPE';
  if (!ok) echecs++;
  const code = result.status === 'rejected' ? result.diagnostics[0].code : 'PLACÉE';
  say(`  ${ok ? 'REFUSÉE' : 'ÉCHEC  '} ${code.padEnd(26)} ${sentence}`);
}
say('');
say('    Et la même instruction DANS un corps de fonction reste placée :');
const corps = 'int main(void) {\n';
for (const sentence of PORTEE_FICHIER) {
  const translation = translate(sentence);
  if (translation.status !== 'translated') continue;
  const result = planPlacement({ document: { id: 'v.c', revision: 0, text: corps }, cursorOffset: corps.length, translation });
  const ok = result.status === 'planned';
  if (!ok) echecs++;
  say(`  ${ok ? 'PLACÉE ' : 'ÉCHEC  '} ${sentence}`);
}

// --- 2. Blocages levés ---------------------------------------------------
say('');
say('--- 2. Blocages LEVÉS par les lots 27 à 29');
say('');
for (const [label, sentence, attendu] of BLOCAGES_LEVES) {
  const translation = translate(sentence);
  const produit = translation.status === 'translated' ? translation.fragments[0].code.trim() : null;
  const ok = produit === attendu;
  if (!ok) echecs++;
  say(`  ${ok ? 'LEVÉ   ' : 'ÉCHEC  '} ${label}`);
  say(`          phrase  : ${sentence}`);
  say(`          produit : ${produit ?? 'REFUS ' + translation.diagnostics[0].code}`);
  say(`          attendu : ${attendu}`);
}

// --- 3. Blocages restants ------------------------------------------------
say('');
say('--- 3. Blocages RESTANTS : six, contre huit à la campagne 1');
say('');
for (const [label, sentence] of BLOCAGES_CAMPAGNE2) {
  const translation = translate(sentence);
  if (translation.status === 'rejected') {
    say(`  REFUSÉ  ${translation.diagnostics[0].code.padEnd(30)} ${label}`);
  } else {
    // Un blocage peut être une acceptation non signalée : c'est le cas de
    // l'arithmétique de pointeur, et c'est dit comme tel.
    say(`  ACCEPTÉ SANS AVERTISSEMENT      ${label}`);
    say(`          ${translation.fragments[0].code.trim()}`);
  }
}

say('');
say(echecs === 0 ? 'TOUTES LES VÉRIFICATIONS PASSENT.' : `${echecs} VÉRIFICATION(S) EN ÉCHEC.`);
writeFileSync(root + 'journal/verifications.txt', lines.join('\n') + '\n', 'utf8');
process.exitCode = echecs === 0 ? 0 : 1;
