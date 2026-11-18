// Contrôle les deux fichiers de spécification de Java-A, et CALCULE leurs
// compteurs au lieu de les croire.
//
//   node scripts/catalogue-java.mjs
//
// Pourquoi ce script existe : la première version des documents de phase 3
// annonçait « 134 formulations = 101 natives + 33 reprises » à côté d'un
// tableau qui en totalisait 127, et « 82 intentions classées » là où la
// partition en compte 84. Les deux erreurs ont la même cause — un compteur
// écrit à la main — et la même parade : le calculer.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const lire = (...p) => JSON.parse(readFileSync(join(racine, ...p), 'utf8'));

/** Les genres de la partition, lus dans la source et non recopiés. */
export function genresPartages() {
  const texte = readFileSync(join(racine, 'src', 'statementScope.ts'), 'utf8');
  const bloc = (nom) => {
    const i = texte.indexOf('export const ' + nom);
    if (i === -1) throw new Error('bloc introuvable : ' + nom);
    const a = texte.indexOf('[', i);
    const b = texte.indexOf('];', a);
    return [...texte.slice(a + 1, b).matchAll(/'([A-Z_0-9]+)'/gu)].map((m) => m[1]);
  };
  return [...bloc('DECLARATION_KINDS'), ...bloc('STATEMENT_KINDS'), ...bloc('CONTEXT_VERIFIED_KINDS')];
}

export function verifier() {
  const genres = genresPartages();
  const classement = lire('docs', 'phase3', 'classement-java.json');
  const catalogue = lire('docs', 'phase3', 'catalogue-java.json');
  const problemes = [];

  const classes = ['reprise', 'adaptation', 'refus'];
  const place = new Map();
  for (const classe of classes) {
    for (const genre of Object.keys(classement.classes[classe].intentions)) {
      if (place.has(genre)) problemes.push(`${genre} classé deux fois : ${place.get(genre)} et ${classe}`);
      place.set(genre, classe);
      if (!genres.includes(genre)) problemes.push(`${genre} classé mais absent de la partition`);
      if (classement.classes[classe].intentions[genre].trim() === '') {
        problemes.push(`${genre} classé sans raison écrite`);
      }
    }
    const annonce = classement.classes[classe].nombre;
    const reel = Object.keys(classement.classes[classe].intentions).length;
    if (annonce !== reel) problemes.push(`classe ${classe} : annonce ${annonce}, contient ${reel}`);
  }
  for (const genre of genres) if (!place.has(genre)) problemes.push(`${genre} n'est pas classé`);
  if (classement.total !== genres.length) {
    problemes.push(`classement.total = ${classement.total}, partition = ${genres.length}`);
  }

  // Le catalogue : une phrase unique, une origine connue, et toute intention
  // à porter doit avoir au moins une formulation — sinon elle est annoncée
  // portée et reste inaccessible, ce qui est une intention MORTE. Le lot 30
  // en avait trouvé une, et une garde générale interdit d'en réintroduire.
  const ORIGINES = new Set(['reprise', 'adaptation', 'native']);
  const phrases = new Set();
  const couvertes = new Set();
  const parOrigine = new Map();
  const parDomaine = new Map();
  for (const f of catalogue.formulations) {
    if (phrases.has(f.phrase)) problemes.push(`phrase en double : ${f.phrase}`);
    phrases.add(f.phrase);
    if (!ORIGINES.has(f.origine)) problemes.push(`origine inconnue « ${f.origine} » : ${f.phrase}`);
    if (f.sortie === undefined || f.sortie.trim() === '') problemes.push(`sans sortie Java : ${f.phrase}`);
    parOrigine.set(f.origine, (parOrigine.get(f.origine) ?? 0) + 1);
    parDomaine.set(f.domaine, (parDomaine.get(f.domaine) ?? 0) + 1);
    if (f.origine === 'native') {
      if (f.intention !== null) problemes.push(`une formulation native ne vient d'aucune intention : ${f.phrase}`);
      continue;
    }
    if (f.intention === null) { problemes.push(`origine ${f.origine} sans intention : ${f.phrase}`); continue; }
    if (place.get(f.intention) !== f.origine) {
      problemes.push(`${f.intention} est classé ${place.get(f.intention) ?? 'nulle part'} `
        + `mais la formulation se dit ${f.origine} : ${f.phrase}`);
    }
    couvertes.add(f.intention);
  }
  for (const [genre, classe] of place) {
    if (classe !== 'refus' && !couvertes.has(genre)) {
      problemes.push(`${genre} est à porter (${classe}) mais aucune formulation ne le couvre`);
    }
  }
  if (catalogue.total !== catalogue.formulations.length) {
    problemes.push(`catalogue.total = ${catalogue.total}, contient ${catalogue.formulations.length}`);
  }

  return {
    problemes,
    genres: genres.length,
    classement: Object.fromEntries(classes.map((c) => [c, Object.keys(classement.classes[c].intentions).length])),
    formulations: catalogue.formulations.length,
    parOrigine: Object.fromEntries([...parOrigine].sort()),
    parDomaine: Object.fromEntries([...parDomaine].sort()),
    portees: couvertes.size,
    aPorter: [...place.values()].filter((c) => c !== 'refus').length,
  };
}

const DOMAINES = {
  J1: 'Fondamentaux, point d’entrée, types',
  J2: 'Affichage et saisie',
  J3: 'Expressions et calculs',
  J4: 'Structures de contrôle',
  J5: 'Méthodes',
  J6: 'Tableaux et collections',
  J7: 'Classes, objets, constructeurs, encapsulation',
  J8: 'Héritage, interfaces, polymorphisme',
  J9: 'Exceptions, paquetages, fichiers',
};

/** La table du catalogue, ECRITE depuis les données. Une table recopiée à la
 * main se périme ; celle-ci ne peut pas différer des compteurs, puisqu'elle
 * sort du même fichier. */
export function enMarkdown() {
  const catalogue = lire('docs', 'phase3', 'catalogue-java.json');
  const r = verifier();
  const l = [];
  l.push('# Catalogue Java-A — spécification, table complète');
  l.push('');
  l.push('*Fichier **généré**. Ne pas l’éditer : `node scripts/catalogue-java.mjs --markdown`');
  l.push('le réécrit depuis `catalogue-java.json`, qui est la source.*');
  l.push('');
  l.push('| | |');
  l.push('|---|---|');
  l.push('| formulations | **' + r.formulations + '** |');
  l.push('| dont reprises du catalogue partagé | ' + r.parOrigine.reprise + ' |');
  l.push('| dont adaptations sémantiques | ' + r.parOrigine.adaptation + ' |');
  l.push('| dont propres à Java | **' + r.parOrigine.native + '** |');
  l.push('| intentions partagées à porter, couvertes | ' + r.portees + ' / ' + r.aPorter + ' |');
  l.push('');
  l.push('Origine : **reprise** = phrase et sens inchangés ; **adaptation** = la phrase ou la');
  l.push('sortie change, et une information dit pourquoi ; **native** = aucune racine dans C');
  l.push('ni Python.');
  l.push('');
  for (const [code, titre] of Object.entries(DOMAINES)) {
    const lignes = catalogue.formulations.filter((f) => f.domaine === code);
    l.push('## ' + code + ' — ' + titre + '  (' + lignes.length + ')');
    l.push('');
    l.push('| Phrase française | Java produit | Origine |');
    l.push('|---|---|---|');
    for (const f of lignes) {
      const sortie = f.sortie.split('\n').join('<br>').split('|').join('\\|');
      const origine = f.origine === 'native' ? 'native' : f.origine + ' · `' + f.intention + '`';
      l.push('| `' + f.phrase + '` | `' + sortie + '` | ' + origine + ' |');
    }
    l.push('');
  }
  return l.join('\n');
}

if (process.argv[1] !== undefined && import.meta.url.endsWith(process.argv[1].replace(/\\/gu, '/'))) {
  if (process.argv.includes('--markdown')) {
    writeFileSync(join(racine, 'docs', 'phase3', 'CATALOGUE_JAVA_SPEC.md'), enMarkdown() + '\n', 'utf8');
    console.log('écrit : docs/phase3/CATALOGUE_JAVA_SPEC.md');
    process.exit(0);
  }
  const r = verifier();
  console.log('intentions du catalogue partagé : ' + r.genres);
  console.log('  reprises    : ' + r.classement.reprise);
  console.log('  adaptations : ' + r.classement.adaptation);
  console.log('  refus       : ' + r.classement.refus);
  console.log('  somme       : '
    + (r.classement.reprise + r.classement.adaptation + r.classement.refus));
  console.log('');
  console.log('formulations Java-A spécifiées : ' + r.formulations);
  for (const [o, n] of Object.entries(r.parOrigine)) console.log(`  ${o.padEnd(11)} : ${n}`);
  console.log('  par domaine : ' + JSON.stringify(r.parDomaine));
  console.log('');
  console.log(`intentions à porter couvertes : ${r.portees} / ${r.aPorter}`);
  console.log('');
  if (r.problemes.length === 0) console.log('0 problème.');
  else { for (const p of r.problemes) console.log('PROBLÈME : ' + p); process.exitCode = 1; }
}
