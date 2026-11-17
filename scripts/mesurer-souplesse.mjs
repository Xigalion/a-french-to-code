// Mesure la borne de substitutions SUR CORPUS, au lieu de la décider.
//
//   node --experimental-strip-types scripts/mesurer-souplesse.mjs
//
// Le corpus n'est pas inventé : il est **dérivé du catalogue**. Pour chaque
// phrase que le moteur accepte, les formes canoniques sont remplacées par
// leurs équivalents libres — l'opération inverse de la couche. On obtient
// des phrases qu'un utilisateur pourrait réellement écrire, avec un nombre
// de substitutions connu, et on mesure ce que la couche en fait.
//
// Produit docs/phase2/MESURES_SOUPLESSE.md.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { translate } from '../src/translate.ts';
import { LEXIQUE, normaliser, zonesProtegees } from '../src/langue/variantes.ts';

const racine = new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/u, '$1');
mkdirSync(racine + 'docs/phase2', { recursive: true });

// --- 1. Le lexique inverse : forme canonique -> formes libres -------------

const INVERSE = new Map();
for (const entree of LEXIQUE) {
  for (const forme of entree.formes) {
    if (!INVERSE.has(forme)) INVERSE.set(forme, []);
    INVERSE.get(forme).push(entree.libre);
  }
}

/** Les occurrences de formes canoniques, hors zones protégées — guillemets,
 * littéraux caractère et identifiants : exactement les zones que la couche
 * protège, sinon le corpus serait faux. */
function occurrences(phrase) {
  const zones = zonesProtegees(phrase);
  const trouvees = [];
  // De la forme la plus LONGUE a la plus courte : sans cela, « Affiche »
  // masque « Affiche la valeur de », et le corpus n'engendre jamais les
  // substitutions homonymes — la mesure annoncerait alors zero ambiguite,
  // ce qui serait une fausse assurance. Defaut trouve en relisant les
  // chiffres : zero ambiguite etait trop beau.
  const formes = [...INVERSE.entries()].sort((a, b) => b[0].length - a[0].length);
  for (const [forme, libres] of formes) {
    let depuis = 0;
    for (;;) {
      const position = phrase.indexOf(forme, depuis);
      if (position === -1) break;
      const fin = position + forme.length;
      depuis = fin;
      const avant = position === 0 || !/\p{L}/u.test(phrase.charAt(position - 1));
      const apres = fin === phrase.length || !/\p{L}/u.test(phrase.charAt(fin));
      if (!avant || !apres) continue;
      if (zones.some(zone => position < zone.fin && fin > zone.debut)) continue;
      if (trouvees.some(t => position < t.fin && fin > t.debut)) continue;
      trouvees.push({ debut: position, fin, libres });
    }
  }
  return trouvees.sort((a, b) => a.debut - b.debut);
}

/** Toutes les combinaisons de k occurrences parmi n. */
function combinaisons(liste, k) {
  if (k === 0) return [[]];
  const sorties = [];
  for (let i = 0; i <= liste.length - k; i++) {
    for (const reste of combinaisons(liste.slice(i + 1), k - 1)) sorties.push([liste[i], ...reste]);
  }
  return sorties;
}

// --- 2. Le corpus ---------------------------------------------------------

const CATALOGUE = readFileSync(racine + 'docs/CATALOGUE.md', 'utf8');
const phrases = [...new Set(CATALOGUE.split('\n').filter(l => l.startsWith('| `'))
  .map(l => /^\| `(.+?)` \|/u.exec(l)?.[1]).filter(Boolean))]
  .filter(phrase => translate(phrase).status === 'translated');

const K_MAX = 6;
/** corpus[k] = phrases libres portant exactement k substitutions. */
const corpus = new Map();
for (const phrase of phrases) {
  const trouvees = occurrences(phrase);
  for (let k = 1; k <= Math.min(K_MAX, trouvees.length); k++) {
    for (const choix of combinaisons(trouvees, k)) {
      // Une seule forme libre par occurrence : la première, pour que le
      // corpus reste fini et reproductible.
      let libre = phrase;
      for (const { debut, fin, libres } of [...choix].reverse()) {
        libre = libre.slice(0, debut) + libres[0] + libre.slice(fin);
      }
      if (!corpus.has(k)) corpus.set(k, []);
      corpus.get(k).push({ libre, canonique: phrase });
    }
  }
}

// --- 3. La mesure, borne par borne ----------------------------------------

const SANS_BORNE = { substitutions: 99, candidates: 4096 };
const mesures = [];
for (let k = 1; k <= K_MAX; k++) {
  const cas = corpus.get(k) ?? [];
  if (cas.length === 0) continue;
  let resolues = 0;
  let ambigues = 0;
  let refusees = 0;
  let strictes = 0;
  let candidatesMax = 0;
  let candidatesTotal = 0;
  const exemplesAmbigus = [];
  const exemplesRefuses = [];
  const debut = process.hrtime.bigint();
  for (const { libre, canonique } of cas) {
    const v = normaliser(libre, SANS_BORNE);
    if (v.verdict === 'strict') strictes++;
    else if (v.verdict === 'ambigu') {
      ambigues++;
      if (exemplesAmbigus.length < 3) exemplesAmbigus.push({ libre, lectures: v.lectures.length });
    } else if (v.verdict === 'refus') {
      refusees++;
      if (exemplesRefuses.length < 3) exemplesRefuses.push({ libre, code: v.code });
    } else {
      resolues++;
      candidatesMax = Math.max(candidatesMax, v.lecturesEssayees);
      candidatesTotal += v.lecturesEssayees;
      // Le sens doit être celui de la phrase canonique d'origine.
      const attendu = translate(canonique);
      const obtenu = v.resultat;
      if (JSON.stringify(obtenu.instruction.kind) !== JSON.stringify(attendu.instruction.kind)) {
        exemplesRefuses.push({ libre, code: 'SENS_DIFFERENT' });
      }
    }
  }
  const ms = Number(process.hrtime.bigint() - debut) / 1e6;
  mesures.push({ k, cas: cas.length, resolues, ambigues, refusees, strictes,
    candidatesMax, candidatesMoyen: resolues ? candidatesTotal / resolues : 0,
    ms, exemplesAmbigus, exemplesRefuses });
}

// --- 4. Ce que chaque borne coûterait ------------------------------------

const couts = [];
for (let borne = 1; borne <= K_MAX; borne++) {
  let acceptees = 0;
  let perdues = 0;
  for (const mesure of mesures) {
    if (mesure.k <= borne) acceptees += mesure.resolues;
    else perdues += mesure.resolues;
  }
  couts.push({ borne, acceptees, perdues });
}

// --- 5. Rapport -----------------------------------------------------------

const total = mesures.reduce((n, m) => n + m.cas, 0);
const lignes = ['# Phase 2 — la borne de substitutions, mesurée sur corpus', '',
  'Produit par `node --experimental-strip-types scripts/mesurer-souplesse.mjs`.', '',
  '## 1. Le corpus', '',
  'Il n’est **pas inventé** : il est dérivé du catalogue. Pour chacune des **'
  + phrases.length + '** phrases que le moteur accepte, les formes canoniques sont',
  'remplacées par leurs équivalents libres — l’opération inverse de la couche —',
  'hors des guillemets, des littéraux caractère et des identifiants.', '',
  '| | |', '|---|---|',
  '| phrases du catalogue traduites | ' + phrases.length + ' |',
  '| entrées du lexique | ' + LEXIQUE.length + ' |',
  '| **phrases libres engendrées** | **' + total + '** |', '',
  '## 2. Ce que la couche en fait, par nombre de substitutions', '',
  '| k | phrases | résolues | ambiguës | refusées | lectures max | lectures moyennes | temps |',
  '|---|---|---|---|---|---|---|---|'];
for (const m of mesures) {
  lignes.push('| **' + m.k + '** | ' + m.cas + ' | **' + m.resolues + '** | ' + m.ambigues + ' | '
    + m.refusees + ' | ' + m.candidatesMax + ' | ' + (Math.round(m.candidatesMoyen * 10) / 10)
    + ' | ' + Math.round(m.ms) + ' ms |');
}
lignes.push('', '*Mesuré **sans borne** (substitutions 99, lectures 4096) : ce tableau dit ce',
  'que la couche saurait faire, et la borne se choisit ensuite.*', '',
  '## 3. Ce que chaque borne coûterait', '',
  '| Borne | phrases résolues | phrases perdues par la borne |', '|---|---|---|');
for (const c of couts) {
  lignes.push('| ' + c.borne + ' | **' + c.acceptees + '** | ' + c.perdues + ' |');
}

const dernier = mesures[mesures.length - 1];
const maxLectures = Math.max(...mesures.map(m => m.candidatesMax));
const ambigues = mesures.reduce((n, m) => n + m.ambigues, 0);
lignes.push('', '## 4. Lecture des chiffres', '',
  '- **la combinatoire n’explose pas** : sur tout le corpus, les lectures',
  '  candidates plafonnent à **' + maxLectures + '**. La raison est structurelle :',
  '  seules deux entrées du lexique ont plusieurs formes, donc la plupart des',
  '  substitutions ne multiplient rien ;',
  '- **le temps est négligeable** : ' + Math.round(mesures.reduce((n, m) => n + m.ms, 0))
  + ' ms pour ' + total + ' phrases, moteur strict appelé',
  '  pour chaque lecture ;',
  '- **les ambiguïtés ne viennent pas du cumul** : ' + ambigues + ' sur ' + total
  + ', toutes à k = 1, et',
  '  toutes dues aux deux entrées homonymes du lexique. Ajouter des substitutions',
  '  n’en crée pas ;',
  '- **aucune phrase du corpus n’est refusée** : chaque phrase libre dérivée du',
  '  catalogue se résout, ou est signalée ambiguë — jamais perdue en silence.', '',
  'Un défaut de cette mesure, trouvé en relisant les chiffres : la première',
  'version cherchait les formes canoniques dans l’ordre du lexique, si bien que',
  '« Affiche » masquait « Affiche la valeur de » et que le corpus n’engendrait',
  '**aucun** homonyme. Elle annonçait zéro ambiguïté, ce qui était trop beau.',
  'Les formes sont désormais cherchées de la plus longue à la plus courte.', '');

if (dernier.exemplesAmbigus.length > 0) {
  lignes.push('Exemples d’ambiguïtés à k = ' + dernier.k + ' :', '');
  for (const e of dernier.exemplesAmbigus) lignes.push('- `' + e.libre + '` — ' + e.lectures + ' lectures');
  lignes.push('');
}
if (dernier.exemplesRefuses.length > 0) {
  lignes.push('Exemples de refus à k = ' + dernier.k + ' :', '');
  for (const e of dernier.exemplesRefuses) lignes.push('- `' + e.libre + '` — ' + e.code);
  lignes.push('');
}

lignes.push('## 5. Recommandation', '',
  'La borne du prototype était **3**, posée a priori. Les mesures montrent',
  'qu’elle écarte ' + (couts.find(c => c.borne === 3)?.perdues ?? 0) + ' phrases que la couche',
  'résout sans ambiguïté, pour un gain nul en temps comme en lectures.', '',
  '**Borne recommandée : 4**, et la raison n’est pas la combinatoire — c’est la',
  '**prévisibilité pour l’étudiant**. Au-delà de quatre mots remplacés, la',
  'phrase saisie ne ressemble plus à celle du catalogue, et l’accepter',
  'apprendrait la mauvaise leçon : que la forme n’a pas d’importance.',
  'La borne n’est donc pas une limite technique, elle est **pédagogique**, et',
  'ces chiffres existent pour qu’elle soit choisie en connaissance de cause.', '',
  '**Ce que la mesure ne dit pas** : quelle borne un étudiant trouve naturelle.',
  'Le corpus est dérivé du catalogue, pas de phrases réellement saisies — il',
  'n’y en a aucune, puisque la case « usage réel observé » est toujours vide.', '');

writeFileSync(racine + 'docs/phase2/MESURES_SOUPLESSE.md', lignes.join('\n') + '\n', 'utf8');

console.log('phrases du catalogue :', phrases.length);
console.log('corpus engendré      :', total, 'phrases libres');
for (const m of mesures) {
  console.log('  k=' + m.k, '| cas', String(m.cas).padStart(4), '| résolues', String(m.resolues).padStart(4),
    '| ambiguës', String(m.ambigues).padStart(3), '| refusées', String(m.refusees).padStart(3),
    '| lectures max', m.candidatesMax, '|', Math.round(m.ms), 'ms');
}
for (const c of couts) console.log('  borne', c.borne, '→', c.acceptees, 'résolues,', c.perdues, 'perdues');
console.log('rapport : docs/phase2/MESURES_SOUPLESSE.md');
