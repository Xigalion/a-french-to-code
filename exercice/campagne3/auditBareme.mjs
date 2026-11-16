// Audit INDÉPENDANT du barème, demandé séparément du calcul lui-même.
//
//   node --experimental-strip-types exercice/campagne3/auditBareme.mjs
//
// Il ne recalcule aucun score et ne modifie rien. Il interroge le barème
// historique — les 91 sondes, les cinq preuves, les trois coefficients — et
// cherche ce qui le rendrait trompeur : doublons, sondes qui mesurent autre
// chose que ce qu'elles annoncent, poids qui décident du résultat.
import { readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../../src/translate.ts';

const root = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
const lines = [];
const say = (t) => { lines.push(t); console.log(t); };

// Le barème est lu dans `exercice/matrice.mjs`, source unique des campagnes
// 1 à 3 : l'auditer ailleurs serait auditer une copie.
const source = readFileSync(root + '../matrice.mjs', 'utf8');
const bloc = /const COMPETENCES = \[([\s\S]*?)\n\];/u.exec(source)[1];
const SONDES = [...bloc.matchAll(/^\s*\['(\d)', '(.+?)', '([\s\S]*?)', '(\w+)'(?:, '(.+?)')?\],?$/gmu)]
  .map((m) => ({ domaine: m[1], label: m[2],
    // La phrase est un littéral JS : « \\0 » y vaut un seul antislash.
    phrase: m[3].replaceAll("\\\\", '\u0000').replaceAll("\\'", "'").replaceAll('\u0000', '\\'),
    contexte: m[4], attendu: m[5] }));

// Les poids et les DEUX expressions régulières de coefficient sont lus dans
// `exercice/matrice.mjs`, et non réécrits ici : un audit qui réimplémente le
// barème de mémoire audite autre chose que le barème. C'est exactement
// l'erreur que ce fichier a commise au premier essai — 13/20/58 sondes au
// lieu de 11/38/42 — et c'est pourquoi l'extraction est faite depuis la
// source, avec une vérification qu'elle a bien eu lieu.
const POIDS = Object.fromEntries([...(/const POIDS = \{(.+?)\};/u.exec(source)[1])
  .matchAll(/(p\d): ([\d.]+)/gu)].map((m) => [m[1], Number(m[2])]));
const motif = (nom) => new RegExp(new RegExp(`const ${nom} = /(.+?)/u;`, 'u').exec(source)[1], 'u');
const FONDAMENTALE = motif('FONDAMENTALE');
const STRUCTURANTE = motif('STRUCTURANTE');
const coef = (label) => (FONDAMENTALE.test(label) ? 3 : STRUCTURANTE.test(label) ? 2 : 1);
if (Object.keys(POIDS).length !== 5) throw new Error('poids non extraits de matrice.mjs');

say('Audit du barème — analyse critique indépendante');
say('===============================================');
say('');
say(`sondes lues dans exercice/matrice.mjs : ${SONDES.length}`);
say('');

// --- 1. Doublons ---------------------------------------------------------
say('--- 1. DOUBLONS');
say('');
const parPhrase = new Map();
const parLabel = new Map();
const parGenre = new Map();
for (const sonde of SONDES) {
  parPhrase.set(sonde.phrase, [...(parPhrase.get(sonde.phrase) ?? []), sonde.label]);
  parLabel.set(sonde.label, [...(parLabel.get(sonde.label) ?? []), sonde.phrase]);
  const r = translate(sonde.phrase);
  if (r.status === 'translated') {
    parGenre.set(r.instruction.kind, [...(parGenre.get(r.instruction.kind) ?? []), sonde.label]);
  }
}
const phrasesDoubles = [...parPhrase].filter(([, l]) => l.length > 1);
const labelsDoubles = [...parLabel].filter(([, p]) => p.length > 1);
say(`phrases identiques sur deux sondes : ${phrasesDoubles.length}`);
for (const [phrase, labels] of phrasesDoubles) say(`   « ${phrase.slice(0, 54)} » → ${labels.join(' / ')}`);
say(`libellés identiques sur deux sondes : ${labelsDoubles.length}`);
for (const [label] of labelsDoubles) say(`   ${label}`);
say('');
const genresPartages = [...parGenre].filter(([, l]) => l.length > 1).sort((a, b) => b[1].length - a[1].length);
say(`genres d’intention mesurés par PLUSIEURS sondes : ${genresPartages.length}`);
for (const [kind, labels] of genresPartages.slice(0, 10)) {
  say(`   ${String(labels.length)} × ${kind.padEnd(24)} ${labels.map((l) => l.slice(0, 22)).join(' | ')}`);
}
say('');
say('   Ce n’est pas forcément un défaut : deux sondes peuvent viser deux');
say('   aspects d’un même genre. C’en est un si les deux PREUVES sont les');
say('   mêmes, car le genre pèse alors deux fois pour une seule vérification.');

// --- 2. Poids et coefficients -------------------------------------------
say('');
say('--- 2. POIDS ET COEFFICIENTS');
say('');
const niveaux = { 3: [], 2: [], 1: [] };
for (const sonde of SONDES) niveaux[coef(sonde.label)].push(sonde.label);
const total = SONDES.reduce((n, s) => n + coef(s.label), 0);
for (const k of [3, 2, 1]) {
  const part = (niveaux[k].length * k) / total;
  say(`   coefficient ${k} : ${String(niveaux[k].length).padStart(2)} sondes, ${(part * 100).toFixed(1)} % du poids total`);
}
say(`   poids total : ${total}`);
say('');
say('   Les coefficients sont attribués par EXPRESSION RÉGULIÈRE sur le');
say('   libellé de la sonde. C’est le point le plus fragile du barème : un');
say('   libellé reformulé change le coefficient sans que personne le décide.');
say('');
const niveau3 = niveaux[3].slice().sort();
say(`   les ${niveau3.length} sondes de coefficient 3 (fondamentales) :`);
for (const label of niveau3) say(`      ${label}`);
say('');
say('   Les 30 % de la compilation décident du classement : sans P3, une');
say('   compétence plafonne à 70 %. Une sonde non compilée perd donc plus');
say('   que son coefficient ne lui rapporte.');
for (const [nom, poids] of Object.entries(POIDS)) {
  say(`      ${nom} : ${(poids * 100).toFixed(0)} %`);
}

// --- 3. Sondes bloquées : mesurent-elles ce qu'elles annoncent ? ---------
say('');
say('--- 3. SONDES BLOQUÉES — mesurent-elles l’absence de la compétence ?');
say('');
for (const sonde of SONDES) {
  const r = translate(sonde.phrase);
  if (r.status === 'translated' || sonde.attendu === 'refus-attendu') continue;
  say(`   ${sonde.label}`);
  say(`      phrase : « ${sonde.phrase.slice(0, 66)} »`);
  say(`      refus  : ${r.diagnostics[0].code}`);
}

// --- 4. Refus attendus ---------------------------------------------------
say('');
say('--- 4. REFUS ATTENDUS');
say('');
const refusAttendus = SONDES.filter((s) => s.attendu === 'refus-attendu');
say(`   ${refusAttendus.length} sonde(s) dont le résultat attendu EST un refus :`);
for (const sonde of refusAttendus) {
  const r = translate(sonde.phrase);
  say(`      ${sonde.label} → ${r.status === 'rejected' ? r.diagnostics[0].code : 'ACCEPTÉE (!)'}`);
}
say('');
say('   Une telle sonde compte dans le dénominateur et obtient P1, P2 et P5');
say('   sans jamais pouvoir obtenir P3 ni P4 — elle n’est jamais compilée,');
say('   puisqu’elle n’est jamais insérée. Elle plafonne donc à 50 %.');

// --- 5. Sensibilité ------------------------------------------------------
say('');
say('--- 5. SENSIBILITÉ DU SCORE AUX HYPOTHÈSES');
say('');
const etats = JSON.parse(readFileSync(root + 'journal/etats.json', 'utf8'));
function score(poids, coefs) {
  let num = 0;
  let den = 0;
  for (const e of etats) {
    const k = coefs ? coef(e.label) : 1;
    den += k;
    num += k * (poids.p1 * (e.p1 ? 1 : 0) + poids.p2 * (e.p2 ? 1 : 0) + poids.p3 * (e.p3 ? 1 : 0)
      + poids.p4 * (e.p4 ? 1 : 0) + poids.p5 * (e.p5 ? 1 : 0));
  }
  return (num / den) * 100;
}
const base = score(POIDS, true);
say(`   barème historique                         : ${base.toFixed(1)} %`);
say(`   sans coefficients (toutes égales)         : ${score(POIDS, false).toFixed(1)} %`);
const egal = { p1: 0.2, p2: 0.2, p3: 0.2, p4: 0.2, p5: 0.2 };
say(`   cinq preuves à poids égal                 : ${score(egal, true).toFixed(1)} %`);
const sansP5 = { p1: 0.20, p2: 0.25, p3: 0.35, p4: 0.20, p5: 0 };
say(`   sans P5 (pédagogie non comptée)           : ${score(sansP5, true).toFixed(1)} %`);
const compil = { p1: 0.10, p2: 0.10, p3: 0.50, p4: 0.30, p5: 0 };
say(`   compilation et exécution à 80 %           : ${score(compil, true).toFixed(1)} %`);
const trad = { p1: 0.40, p2: 0.40, p3: 0.10, p4: 0.10, p5: 0 };
say(`   traduction et placement à 80 %            : ${score(trad, true).toFixed(1)} %`);
say('');
say('');
say('   POURQUOI trois pondérations très différentes donnent le même chiffre :');
say('   les preuves ne sont pas indépendantes. Mesuré :');
const paires = [['p1', 'p2'], ['p2', 'p3'], ['p3', 'p4'], ['p1', 'p3']];
for (const [a, b] of paires) {
  const ensemble = etats.filter((e) => e[a] === e[b]).length;
  say(`      ${a} et ${b} coïncident sur ${ensemble} des ${etats.length} compétences`
    + ` (${((ensemble / etats.length) * 100).toFixed(0)} %)`);
}
const profils = new Map();
for (const e of etats) {
  const clef = ['p1', 'p2', 'p3', 'p4', 'p5'].map((k) => (e[k] ? '1' : '0')).join('');
  profils.set(clef, (profils.get(clef) ?? 0) + 1);
}
say('');
say('   profils de preuves observés (p1p2p3p4p5) :');
for (const [clef, n] of [...profils].sort((a, b) => b[1] - a[1])) {
  say(`      ${clef} : ${String(n).padStart(2)} compétence(s)`);
}
say(`   ${profils.size} profils distincts sur 32 possibles : le barème a donc`);
say('   beaucoup moins de degrés de liberté que ses cinq poids ne le suggèrent.');
say('');
const ecarts = [score(POIDS, false), score(egal, true), score(sansP5, true), score(compil, true), score(trad, true)];
const min = Math.min(base, ...ecarts);
const max = Math.max(base, ...ecarts);
say(`   amplitude sur ces six hypothèses : ${min.toFixed(1)} % à ${max.toFixed(1)} %, soit ${(max - min).toFixed(1)} points`);

// --- 6. Les deux defauts de mesure trouves -----------------------------
say('');
say('--- 6. DEUX DÉFAUTS DE MESURE, ET LEUR EFFET CHIFFRÉ');
say('');
say('   (a) Le barème annonce cinq preuves ; il en mesure DEUX.');
say('');
say('   P3 implique P1 et P2 par construction : une compétence n’obtient P3');
say('   que si son genre a été EXERCÉ, donc traduit et placé. Et P4 suit P3,');
say('   puisque c’est le même programme qui compile et qui s’exécute. Les');
say('   quatre premières preuves ne peuvent donc pas se séparer, et la mesure');
say('   le confirme : 100 % de coïncidence, 3 profils sur 32.');
say('');
say('   Conséquence : les 85 points répartis entre P1, P2, P3 et P4 se');
say('   comportent comme UN SEUL bloc de 85. Annoncer « la compilation pèse');
say('   30 % » suggère une précision que le barème n’a pas.');
const avecTout = etats.filter((e) => e.p1 && e.p2 && e.p3 && e.p4);
const avecP5 = etats.filter((e) => e.p5);
const poidsDe = (liste) => liste.reduce((n, e) => n + coef(e.label), 0);
const poidsTotal = poidsDe(etats);
const bloc85 = (poidsDe(avecTout) / poidsTotal) * 0.85;
const bloc15 = (poidsDe(avecP5) / poidsTotal) * 0.15;
say('');
say(`   Formule équivalente : ${(bloc85 * 100).toFixed(1)} % + ${(bloc15 * 100).toFixed(1)} % = ${((bloc85 + bloc15) * 100).toFixed(1)} %`);
say('   — à comparer au score historique ci-dessus. Les deux coïncident.');
say('');
say('   (b) Une sonde dont le refus était ATTENDU est comptée comme un échec.');
say('');
say('   `matrice.mjs` pose p1 = !refus. Pour la sonde « Assertion :');
say('   affectation refusée », dont le résultat attendu EST un refus et qui');
say('   l’obtient, p1 à p4 valent donc false : elle marque 15 % alors qu’elle');
say('   a fait exactement ce qu’on lui demandait.');
let numCorrige = 0;
let denCorrige = 0;
for (const e of etats) {
  const k = coef(e.label);
  denCorrige += k;
  const attendu = e.etat.startsWith('refus attendu');
  numCorrige += k * (attendu ? 1
    : POIDS.p1 * (e.p1 ? 1 : 0) + POIDS.p2 * (e.p2 ? 1 : 0) + POIDS.p3 * (e.p3 ? 1 : 0)
      + POIDS.p4 * (e.p4 ? 1 : 0) + POIDS.p5 * (e.p5 ? 1 : 0));
}
say('');
say(`   Score si un refus attendu obtenu comptait pour 1 : ${((numCorrige / denCorrige) * 100).toFixed(1)} %`);
say(`   soit ${(((numCorrige / denCorrige) * 100) - base).toFixed(1)} point(s) d’écart. Le défaut est conceptuel`);
say('   plus que numérique, mais il fausse le décompte des états : cette');
say('   compétence est rangée à part, ni vérifiée ni bloquée.');
say('');
say('   RECOMMANDATION : garder le barème historique tel quel, pour que les');
say('   trois campagnes restent comparables, et publier À CÔTÉ les deux');
say('   nombres qu’il mesure réellement — la part du poids qui compile et');
say('   s’exécute, et la part qui porte une information pédagogique.');

writeFileSync(root + 'journal/audit-bareme.txt', lines.join('\n') + '\n', 'utf8');
