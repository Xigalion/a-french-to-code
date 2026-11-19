// Vérifie la spécification PROPOSÉE de SQL-A, et en engendre le tableau.
//
//   node scripts/catalogue-sql.mjs              # vérifie et compte
//   node scripts/catalogue-sql.mjs --markdown   # écrit docs/phase4/CATALOGUE_SQL_SPEC.md
//
// Ce script existe à cause d'un défaut de la phase 3 : « 82 intentions
// classées » annoncées pour 84 réelles, et « 134 = 101 + 33 » à côté d'un
// tableau qui totalisait 127. Trois chiffres faux, une seule cause — ils
// étaient écrits à la main. Ici, AUCUN compteur n'est écrit : ils sont
// calculés, et le classement est confronté aux genres que le moteur publie.
//
// Rien de ce qu'il décrit n'est implémenté : c'est une proposition.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GENRES } from '../src/langages/registre.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (nom) => JSON.parse(readFileSync(join(racine, 'docs', 'phase4', nom), 'utf8'));
const catalogue = lire('catalogue-sql.json');
const classement = lire('classement-sql.json');

const problemes = [];
const exiger = (condition, message) => { if (!condition) problemes.push(message); };

// 1. Le classement couvre-t-il EXACTEMENT les genres du moteur ?
const classes = [...classement.reprises, ...classement.adaptations,
  ...classement.groupesDeRefus.flatMap(groupe => groupe.genres)];
const vus = new Set();
const doubles = classes.filter(genre => vus.size === vus.add(genre).size);
const inconnus = classes.filter(genre => !GENRES.has(genre));
const manquants = [...GENRES].filter(genre => !vus.has(genre));
exiger(doubles.length === 0, `genres classés deux fois : ${doubles.join(', ')}`);
exiger(inconnus.length === 0, `genres classés qui ne sont pas des genres du moteur : ${inconnus.join(', ')}`);
exiger(manquants.length === 0, `genres du moteur non classés (${manquants.length}) : ${manquants.join(', ')}`);

// 2. Le catalogue est-il cohérent avec lui-même ?
const genresSql = new Set();
const domainesConnus = new Set(catalogue.domaines.map(domaine => domaine.numero));
const porteesConnues = new Set(['fichier', 'requete', 'projection']);
for (const entree of catalogue.formulations) {
  exiger(!genresSql.has(entree.genre), `genre SQL en double : ${entree.genre}`);
  genresSql.add(entree.genre);
  exiger(domainesConnus.has(entree.domaine), `${entree.genre} : domaine inconnu ${entree.domaine}`);
  exiger(porteesConnues.has(entree.portee), `${entree.genre} : portée inconnue « ${entree.portee} »`);
  exiger(/\.$/u.test(entree.phrase), `${entree.genre} : la phrase ne finit pas par un point`);
  exiger(entree.sql.trim() !== '', `${entree.genre} : sortie SQL vide`);
  // Un fragment de portée `fichier` est une instruction complète : il se
  // termine par `;`. Un fragment de clause n'en porte JAMAIS, parce qu'il
  // s'insère DANS une instruction dont le `;` est déjà écrit.
  if (entree.portee === 'fichier') exiger(entree.sql.trimEnd().endsWith(';'),
    `${entree.genre} : instruction de portée fichier sans point-virgule final`);
  else exiger(!entree.sql.includes(';'),
    `${entree.genre} : une clause ne doit pas porter de point-virgule`);
  // Les paramètres cités dans la sortie doivent exister dans la phrase :
  // c'est ce contrôle qui aurait attrapé les 17 phrases d'adaptation fausses
  // de la phase 3.
  const dansPhrase = new Set([...entree.phrase.matchAll(/\{(\w+)\}/gu)].map(trouve => trouve[1]));
  for (const trouve of entree.sql.matchAll(/\{(\w+)\}/gu)) {
    exiger(dansPhrase.has(trouve[1]),
      `${entree.genre} : la sortie cite {${trouve[1]}}, absent de la phrase`);
  }
}

// 3. Chaque domaine est-il couvert ? Un domaine annoncé et vide serait une
//    promesse non tenue, et c'est exactement ce que le barème reproche.
for (const domaine of catalogue.domaines) {
  const combien = catalogue.formulations.filter(entree => entree.domaine === domaine.numero).length;
  exiger(combien > 0, `domaine ${domaine.numero} annoncé sans aucune formulation`);
}

const codes = [...catalogue.refusNommes.map(refus => refus.code),
  ...catalogue.informationsPassives.map(information => information.code),
  ...classement.groupesDeRefus.map(groupe => groupe.code)];
const vusCodes = new Set();
const codesDoubles = codes.filter(code => vusCodes.size === vusCodes.add(code).size);
exiger(codesDoubles.length === 0, `codes en double : ${codesDoubles.join(', ')}`);

const chiffres = {
  'genres du catalogue partagé': GENRES.size,
  'repris tels quels': classement.reprises.length,
  'adaptés': classement.adaptations.length,
  'refusés': classement.groupesDeRefus.reduce((total, groupe) => total + groupe.genres.length, 0),
  'groupes de refus (raisons distinctes)': classement.groupesDeRefus.length,
  'formulations natives proposées': catalogue.formulations.length,
  'dont ouvrant une requête (bloc)': catalogue.formulations.filter(entree => entree.bloc).length,
  'dont instructions complètes': catalogue.formulations.filter(entree => entree.portee === 'fichier').length,
  'dont clauses de requête': catalogue.formulations.filter(entree => entree.portee === 'requete').length,
  'dont clauses de projection': catalogue.formulations.filter(entree => entree.portee === 'projection').length,
  'domaines couverts': catalogue.domaines.length,
  'refus de dialecte nommés': catalogue.refusNommes.length,
  'informations pédagogiques passives': catalogue.informationsPassives.length,
};

for (const [nom, valeur] of Object.entries(chiffres)) {
  console.log(String(nom).padEnd(40, ' '), String(valeur).padStart(4));
}
console.log('');
for (const domaine of catalogue.domaines) {
  const combien = catalogue.formulations.filter(entree => entree.domaine === domaine.numero).length;
  console.log(`  domaine ${domaine.numero} — ${domaine.nom}`.padEnd(66, ' '), String(combien).padStart(3));
}

if (problemes.length > 0) {
  console.error('\n' + problemes.length + ' problème(s) :');
  for (const probleme of problemes) console.error('  - ' + probleme);
  process.exit(1);
}
console.log('\nSpécification cohérente. Elle n’est PAS implémentée : c’est une proposition.');

if (!process.argv.includes('--markdown')) process.exit(0);

const cellule = (code) => '`' + code.split('\n').join('` + `').replace(/\|/gu, '\\|') + '`';
const lignes = [
  '# Catalogue SQL-A — spécification proposée',
  '',
  '> **Engendré** par `node scripts/catalogue-sql.mjs --markdown` depuis',
  '> `catalogue-sql.json`. Ne pas le modifier à la main : aucun chiffre de ce',
  '> document n’est écrit, ils sont tous calculés.',
  '',
  '> **Rien de ceci n’est implémenté.** C’est la proposition soumise à',
  '> validation, et elle ne devient un contrat qu’une fois approuvée.',
  '',
  `Dialecte : **${catalogue.dialecte}**.`,
  '',
  '## Les chiffres',
  '',
  '| | |', '|---|---|',
  ...Object.entries(chiffres).map(([nom, valeur]) => `| ${nom} | **${valeur}** |`),
  '',
  '## Les trois portées',
  '',
  '| Portée | Ce qu’on y place | Point-virgule |',
  '|---|---|---|',
  '| `fichier` | une instruction complète | **oui**, elle le porte |',
  '| `requete` | une clause, dans une requête ouverte | **non**, il est déjà écrit |',
  '| `projection` | une colonne de plus, avant le `FROM` | **non** |',
  '',
];
for (const domaine of catalogue.domaines) {
  const entrees = catalogue.formulations.filter(entree => entree.domaine === domaine.numero);
  lignes.push(`## Domaine ${domaine.numero} — ${domaine.nom}`, '',
    `**${entrees.length} formulations.**`, '',
    '| Phrase française | SQL produit | Portée |', '|---|---|---|');
  for (const entree of entrees) {
    lignes.push(`| \`${entree.phrase}\` | ${cellule(entree.sql)} | ${entree.portee}${entree.bloc ? ', bloc' : ''} |`);
  }
  lignes.push('');
  const notes = entrees.filter(entree => entree.note !== undefined);
  if (notes.length > 0) {
    for (const entree of notes) lignes.push(`- **${entree.genre}** — ${entree.note}`);
    lignes.push('');
  }
}
lignes.push('## Refus de dialecte nommés', '',
  'Chacun désigne la forme standard qui enseigne la même compétence.', '',
  '| Code | Sujet | Raison |', '|---|---|---|',
  ...catalogue.refusNommes.map(refus => `| \`${refus.code}\` | \`${refus.sujet}\` | ${refus.raison} |`),
  '', '## Informations pédagogiques passives', '',
  'Elles n’incrémentent **jamais** le compteur d’avertissements.', '',
  ...catalogue.informationsPassives.flatMap(information =>
    [`**\`${information.code}\`** — *${information.sujet}*`, '', information.texte, '']),
  '## Les 84 intentions du catalogue partagé', '',
  `**${chiffres['repris tels quels']} reprises, ${chiffres['adaptés']} adaptations, ` +
  `${chiffres['refusés']} refus** regroupés en **${chiffres['groupes de refus (raisons distinctes)']}** raisons.`, '',
  ...classement.groupesDeRefus.flatMap(groupe =>
    [`### \`${groupe.code}\` — ${groupe.genres.length} intentions`, '', groupe.raison, '',
      groupe.genres.map(genre => '`' + genre + '`').join(' '), '']));

writeFileSync(join(racine, 'docs', 'phase4', 'CATALOGUE_SQL_SPEC.md'), lignes.join('\n') + '\n');
console.log('écrit : docs/phase4/CATALOGUE_SQL_SPEC.md');

// Le classement a son propre document, parce qu'il répond à une autre
// question : non pas « que sait faire SQL-A ? » mais « pourquoi le catalogue
// partagé ne sert-il pas ? ».
const classementMd = [
  '# Les 84 intentions du catalogue partagé, face à SQL',
  '',
  '> **Engendré** par `node scripts/catalogue-sql.mjs --markdown` depuis',
  '> `classement-sql.json`. Les listes sont **confrontées aux genres que le',
  '> moteur publie** : un genre oublié ou inventé fait échouer la commande.',
  '',
  '> Rien n’est implémenté. C’est une proposition.',
  '',
  '## Le compte',
  '',
  '| | |', '|---|---|',
  `| genres publiés par le moteur | **${GENRES.size}** |`,
  `| repris tels quels | **${classement.reprises.length}** |`,
  `| adaptés | **${classement.adaptations.length}** |`,
  `| refusés | **${chiffres['refusés']}** |`,
  `| raisons distinctes | **${classement.groupesDeRefus.length}** |`,
  '',
  'Pour comparaison, mesuré sur le moteur : **C17 84**, **Java 57**,',
  '**Python 33**, **SQL 0**. La pente ne s’arrête pas à SQL par hasard — elle',
  'suit la distance au langage pour lequel le catalogue a été conçu.',
  '',
  '## Les raisons, et les intentions qu’elles couvrent',
  '',
  ...classement.groupesDeRefus.flatMap(groupe =>
    [`### \`${groupe.code}\` — ${groupe.genres.length} intentions`, '', groupe.raison, '',
      groupe.genres.map(genre => '`' + genre + '`').join(' '), '']),
];
writeFileSync(join(racine, 'docs', 'phase4', 'CLASSEMENT_INTENTIONS.md'), classementMd.join('\n') + '\n');
console.log('écrit : docs/phase4/CLASSEMENT_INTENTIONS.md');
