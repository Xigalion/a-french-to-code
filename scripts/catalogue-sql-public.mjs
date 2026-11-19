// Catalogue SQL, **engendré depuis le moteur**, et confronté à la
// spécification approuvée.
//
//   node scripts/catalogue-sql-public.mjs              # vérifie
//   node scripts/catalogue-sql-public.mjs --markdown   # écrit docs/CATALOGUE_SQL.md
//
// Rien n'y est écrit de mémoire : chaque ligne sort de `analyserCatalogueSql`
// puis de `rendreSqlNatif`. Et chaque sortie est comparée à
// `docs/phase4/catalogue-sql.json` : la spécification approuvée et le code
// doivent dire la même chose, sinon la commande échoue.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SQL } from '../src/langages/sql/langage.ts';
import { EXEMPLES_SQL } from '../src/langages/sql/catalogue.ts';
import { RAISONS_SQL } from '../src/langages/sql/raisons.ts';
import { CODES_SQL } from '../src/langages/sql/informations.ts';
import { porteeDe, OUVRE_UNE_REQUETE } from '../src/langages/sql/portees.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const spec = JSON.parse(readFileSync(join(racine, 'docs', 'phase4', 'catalogue-sql.json'), 'utf8'));

const problemes = [];
const rendus = [];

/** La sortie **exacte** attendue : on lit les paramètres dans la phrase de
 * démonstration en la confrontant au gabarit de phrase de la spécification,
 * puis on les substitue dans le gabarit de SQL.
 *
 * Un premier jet comparait des squelettes de mots-clés, et il déclarait
 * identiques des sorties qui différaient par leurs identifiants. Un
 * comparateur approximatif ne vérifie rien : il rassure. */
const echapper = (texte) => texte
  .replace(/[.*+?^${}()|[\]\\]/gu, (caractere) => '\\' + caractere)
  .replace(/['’]/gu, '[\'’]');

function attenduExact(entree, demonstration) {
  const noms = [...entree.phrase.matchAll(/\{(\w+)\}/gu)].map((trouve) => trouve[1]);
  let motif = '^';
  let position = 0;
  for (const trouve of entree.phrase.matchAll(/\{(\w+)\}/gu)) {
    motif += echapper(entree.phrase.slice(position, trouve.index)) + '(.+?)';
    position = trouve.index + trouve[0].length;
  }
  motif += echapper(entree.phrase.slice(position)) + '$';
  const trouve = new RegExp(motif, 'u').exec(demonstration.trim());
  if (trouve === null) return undefined;
  let sql = entree.sql;
  for (const [index, nom] of noms.entries()) {
    sql = sql.split('{' + nom + '}').join(trouve[index + 1]);
  }
  return sql;
}

const parGenre = new Map(spec.formulations.map(entree => [entree.genre, entree]));

for (const { phrase, kind } of EXEMPLES_SQL) {
  const resultat = SQL.natif?.(phrase);
  if (resultat === undefined) { problemes.push(`${kind} : la phrase de démonstration n’est pas reconnue — « ${phrase} »`); continue; }
  if (resultat.status === 'refus') { problemes.push(`${kind} : refusée (${resultat.code}) — « ${phrase} »`); continue; }
  if (resultat.kind !== kind) { problemes.push(`${kind} : genre rendu ${resultat.kind}`); continue; }
  const attendu = parGenre.get(kind);
  if (attendu === undefined) { problemes.push(`${kind} : absent de la spécification approuvée`); continue; }
  const exact = attenduExact(attendu, phrase);
  if (exact === undefined) {
    problemes.push(`${kind} : la démonstration du moteur ne correspond pas au gabarit de phrase`
      + `\n      gabarit       : ${attendu.phrase}\n      démonstration : ${phrase}`);
    continue;
  }
  if (exact !== resultat.code) {
    problemes.push(`${kind} : le SQL diffère de la spécification`
      + `\n      spécification : ${JSON.stringify(exact)}\n      moteur        : ${JSON.stringify(resultat.code)}`);
    continue;
  }
  const porteeAttendue = attendu.portee === 'requete' ? 'requete' : attendu.portee;
  if (porteeDe(kind) !== porteeAttendue) {
    problemes.push(`${kind} : portée ${porteeDe(kind)} contre ${porteeAttendue} dans la spécification`);
    continue;
  }
  if (Boolean(attendu.bloc) !== OUVRE_UNE_REQUETE.has(kind)) {
    problemes.push(`${kind} : « bloc » ${attendu.bloc} dans la spécification, ${OUVRE_UNE_REQUETE.has(kind)} dans le moteur`);
    continue;
  }
  rendus.push({ phrase, kind, code: resultat.code, informations: resultat.informations,
    domaine: attendu.domaine });
}

const manquants = spec.formulations.filter(entree => !rendus.some(r => r.kind === entree.genre));

console.log('formulations de la spécification  : ' + String(spec.formulations.length).padStart(4));
console.log('rendues par le moteur             : ' + String(rendus.length).padStart(4));
console.log('intentions partagées refusées     : ' + String(RAISONS_SQL.size).padStart(4)
  + '  (' + new Set(RAISONS_SQL.values()).size + ' raisons distinctes)');
console.log('informations passives             : ' + String(CODES_SQL.length).padStart(4));
console.log('refus de dialecte dans la spéc.   : ' + String(spec.refusNommes.length).padStart(4));
for (const domaine of spec.domaines) {
  const combien = rendus.filter(r => r.domaine === domaine.numero).length;
  console.log(`  domaine ${domaine.numero} — ${domaine.nom}`.padEnd(66) + String(combien).padStart(3));
}

if (manquants.length > 0) {
  problemes.push('genres de la spécification non rendus : ' + manquants.map(e => e.genre).join(', '));
}
if (problemes.length > 0) {
  console.error('\n' + problemes.length + ' problème(s) :');
  for (const probleme of problemes) console.error('  - ' + probleme);
  process.exit(1);
}
console.log('\nLe moteur et la spécification approuvée disent la même chose.');

if (!process.argv.includes('--markdown')) process.exit(0);

const cellule = (code) => '`' + code.replace(/\n$/u, '').split('\n').join('` + `').replace(/\|/gu, '\\|') + '`';
const lignes = [
  '# Catalogue SQL-A', '',
  '> **Engendré depuis le moteur** par `node scripts/catalogue-sql-public.mjs --markdown`.',
  '> Chaque ligne sort de `analyserCatalogueSql` puis de `rendreSqlNatif` ; rien n’y est écrit',
  '> de mémoire, et un test compare ce document à la spécification approuvée.', '',
  'SQL-A traduit une phrase française en **une** instruction SQL, ou en **une clause** d’une',
  'requête ouverte. Dialecte de référence : **PostgreSQL 18**, avec **priorité au SQL standard**.',
  '',
  '**SQL-A n’exécute jamais rien.** Il écrit dans votre fichier, et c’est vous qui lancez le',
  'script contre la base de votre choix.', '',
  '| | |', '|---|---|',
  `| formulations | **${rendus.length}** |`,
  `| intentions du catalogue partagé portées | **0** — SQL-A est entièrement natif |`,
  `| intentions refusées, avec leur raison | **${RAISONS_SQL.size}** en **${new Set(RAISONS_SQL.values()).size}** raisons |`,
  `| informations pédagogiques passives | **${CODES_SQL.length}** |`,
  `| portées de placement | **3** : fichier, requête, projection |`,
  '',
];
for (const domaine of spec.domaines) {
  const entrees = rendus.filter(r => r.domaine === domaine.numero);
  lignes.push(`## Domaine ${domaine.numero} — ${domaine.nom}`, '',
    `**${entrees.length} formulations.**`, '',
    '| Phrase française | SQL produit |', '|---|---|');
  for (const entree of entrees) lignes.push(`| \`${entree.phrase}\` | ${cellule(entree.code)} |`);
  lignes.push('');
}
lignes.push('## Les 84 intentions du catalogue partagé, et pourquoi aucune ne passe', '');
const groupes = new Map();
for (const [genre, raison] of RAISONS_SQL) {
  if (!groupes.has(raison)) groupes.set(raison, []);
  groupes.get(raison).push(genre);
}
for (const [raison, genres] of groupes) {
  lignes.push(`### ${genres.length} intentions`, '', raison, '',
    genres.sort().map(genre => '`' + genre + '`').join(' '), '');
}
lignes.push('## Refus de dialecte', '',
  'Chacun nomme la forme **standard** qui enseigne la même compétence.', '',
  '| Sujet | Raison |', '|---|---|',
  ...spec.refusNommes.map(refus => `| \`${refus.sujet}\` | ${refus.raison} |`), '');
writeFileSync(join(racine, 'docs', 'CATALOGUE_SQL.md'), lignes.join('\n') + '\n');
console.log('écrit : docs/CATALOGUE_SQL.md');
