// Catalogue Java, **engendré depuis le moteur**.
//
//   node scripts/catalogue-java-public.mjs
//
// Produit `docs/CATALOGUE_JAVA.md`. Comme `docs/CATALOGUE.md` et
// `docs/CATALOGUE_PYTHON.md`, rien n'y est écrit de mémoire : chaque ligne
// sort de `translate` puis de `rendre(JAVA, …)`, ou du catalogue natif.
//
// À ne pas confondre avec `docs/phase3/CATALOGUE_JAVA_SPEC.md`, qui est
// produit depuis la **spécification** approuvée. Les deux doivent dire la même
// chose, et c'est précisément pour cela qu'il y en a deux : l'un décrit ce qui
// a été décidé, l'autre ce que le code fait. Un test compare les deux.
//
// Le document dit quatre choses :
//   1. les intentions du catalogue C que Java rend, et son Java exact ;
//   2. celles qu'il refuse, avec la raison et la construction qui remplace ;
//   3. les intentions NATIVES livrées, celles qu'aucun catalogue C ne porte ;
//   4. les informations pédagogiques passives.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '../src/translate.ts';
import { rendre } from '../src/langages/registre.ts';
import { JAVA } from '../src/langages/java/langage.ts';
import { RAISONS_JAVA } from '../src/langages/java/raisons.ts';
import { PORTEES_JAVA } from '../src/langages/java/rendu.ts';
import { EXEMPLES_JAVA } from '../src/langages/java/catalogue.ts';
import { CODES_JAVA, expliquerJava } from '../src/langages/java/informations.ts';
import { porteesDe, NOM_PORTEE } from '../src/langages/java/portees.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = readFileSync(join(racine, 'docs', 'CATALOGUE.md'), 'utf8');
const phrases = catalogue.split('\n').filter(ligne => ligne.startsWith('| `'))
  .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1]).filter(phrase => phrase !== undefined);

/** Une cellule de tableau : le code sur une ligne, les barres échappées. */
const cellule = (code) => '`' + code.replace(/\n$/u, '').split('\n').join('` + `').replace(/\|/gu, '\\|') + '`';

const rendus = [];
const refuses = new Map();
const vues = new Set();
for (const phrase of phrases) {
  const traduction = translate(phrase);
  if (traduction.status !== 'translated') continue;
  const genre = traduction.instruction.kind;
  const resultat = rendre(JAVA, traduction.instruction);
  if (resultat.status === 'rendu') {
    if (vues.has(genre)) continue;
    vues.add(genre);
    const informations = expliquerJava(genre, { start: 0, end: phrase.length }).map(i => i.code);
    rendus.push({ phrase, genre, code: resultat.code, informations });
  } else if (!refuses.has(genre)) {
    refuses.set(genre, { phrase, code: resultat.code, raison: resultat.raison });
  }
}

// Les DEUX refus que le registre distingue, et qu'il ne faut pas additionner :
// `INTENTION_NON_PORTEE` dit que Java n'a pas la notion, `CONSTRUCTION_NON_PORTEE`
// qu'il l'a mais que ce qu'elle CONTIENT n'y a pas de sens. La première version
// de ce script les comptait ensemble et annonçait « 37 refusées » pour 27
// intentions non portées — un total qui ne voulait rien dire.
const refusIntention = [...refuses].filter(([, r]) => r.code === 'INTENTION_NON_PORTEE');
const refusConstruction = [...refuses].filter(([, r]) => r.code === 'CONSTRUCTION_NON_PORTEE');

const natifs = [];
for (const { phrase, kind } of EXEMPLES_JAVA) {
  const resultat = JAVA.natif(phrase, { classeEnglobante: 'Eleve' });
  if (resultat === undefined || resultat.status !== 'rendu') {
    throw new Error('exemple natif non rendu, le catalogue serait faux : ' + phrase);
  }
  natifs.push({ phrase, kind, code: resultat.code,
    informations: resultat.informations.map(i => i.code),
    portees: [...porteesDe(kind)].map(p => NOM_PORTEE[p]).join(' ou ') });
}

const l = [];
l.push('# Catalogue Java — ce que Java-A écrit, et ce qu’il refuse');
l.push('');
l.push('*Fichier **engendré** : `node scripts/catalogue-java-public.mjs`. Chaque ligne sort du');
l.push('moteur, pas d’une rédaction. Un catalogue écrit à la main se périme en silence, et ce');
l.push('projet l’a déjà payé une fois.*');
l.push('');
l.push('**Java 21 LTS**, sans aucune fonctionnalité en avant-première. Java-A ne vérifie **ni**');
l.push('les types, **ni** les symboles, **ni** les bornes, **ni** la visibilité : une insertion');
l.push('acceptée n’est pas un programme correct, et ne garantit pas qu’il compile.');
l.push('');
l.push('| | |');
l.push('|---|---|');
l.push('| intentions du catalogue partagé **rendues** | **' + rendus.length + '** |');
l.push('| intentions du catalogue partagé **non portées** | **' + RAISONS_JAVA.size
  + '**, dont ' + refusIntention.length + ' atteignables par une phrase du catalogue |');
l.push('| intentions portées dont la **construction** est refusée | **'
  + refusConstruction.length + '** |');
l.push('| intentions **natives** de Java | **' + natifs.length + '** |');
l.push('| informations pédagogiques passives | **' + CODES_JAVA.length + '** |');
l.push('| portées de placement | **4** — ' + Object.values(NOM_PORTEE).join(', ') + ' |');
l.push('');
l.push('---');
l.push('');
l.push('## 1. Les intentions du catalogue partagé que Java rend');
l.push('');
l.push('Une phrase écrite pour C17 produit du Java, **ou un refus nommé**. Jamais une');
l.push('approximation.');
l.push('');
l.push('| Phrase française | Java produit | Information |');
l.push('|---|---|---|');
for (const r of rendus) {
  l.push('| `' + r.phrase + '` | ' + cellule(r.code) + ' | '
    + (r.informations.length === 0 ? '—' : r.informations.map(c => '`' + c + '`').join(', ')) + ' |');
}
l.push('');
l.push('## 2. Les intentions que Java refuse, et ce qui les remplace');
l.push('');
l.push('Un refus de portage n’est **pas** une interdiction d’apprendre la notion : chacun');
l.push('désigne la construction Java qui enseigne la même compétence.');
l.push('');
l.push('### 2.1 Java n’a pas la notion — `INTENTION_NON_PORTEE`');
l.push('');
l.push('| Phrase française | Pourquoi, et ce qui la remplace |');
l.push('|---|---|');
for (const [, r] of refusIntention.sort((a, b) => a[0].localeCompare(b[0]))) {
  l.push('| `' + r.phrase + '` | ' + r.raison.replace(/\n/gu, ' ') + ' |');
}
l.push('');
l.push('**' + RAISONS_JAVA.size + ' intentions** ne sont pas portées en tout ; les '
  + (RAISONS_JAVA.size - refusIntention.length) + ' qui manquent ici ne sont pas atteignables');
l.push('par une phrase du catalogue imprimée, et leurs raisons sont dans');
l.push('`src/langages/java/raisons.ts`.');
l.push('');
l.push('### 2.2 Java a la notion, mais pas ce qu’elle contient — `CONSTRUCTION_NON_PORTEE`');
l.push('');
l.push('La distinction compte : ici l’intention existe, et c’est son **contenu** qui est');
l.push('refusé. Un pointeur dans une expression, un entier employé comme condition, un mot');
l.push('réservé de Java que C17 accepte comme nom.');
l.push('');
l.push('| Phrase française | Pourquoi |');
l.push('|---|---|');
for (const [, r] of refusConstruction.sort((a, b) => a[0].localeCompare(b[0]))) {
  l.push('| `' + r.phrase + '` | ' + r.raison.replace(/\n/gu, ' ') + ' |');
}
l.push('');
l.push('## 3. Les intentions natives de Java');
l.push('');
l.push('Celles qu’aucun catalogue C ne porte : l’objet, l’interface, l’exception, la');
l.push('collection typée. La colonne **portée** dit où l’instruction est plaçable — en Java,');
l.push('rien d’exécutable ne vit à la portée fichier.');
l.push('');
l.push('| Phrase française | Java produit | Portée |');
l.push('|---|---|---|');
for (const n of natifs) {
  l.push('| `' + n.phrase + '` | ' + cellule(n.code) + ' | ' + n.portees + ' |');
}
l.push('');
l.push('## 4. Les informations pédagogiques passives');
l.push('');
l.push('Elles ne bloquent rien. Elles disent ce que le langage fait, et ce que **A ne vérifie');
l.push('pas**. Trois corrigent une règle apprise en C17 ou en Python ; deux disent une lacune');
l.push('de A, pas une propriété de Java.');
l.push('');
l.push('| Code | Ce qu’elle enseigne |');
l.push('|---|---|');
const vuesInfos = new Set();
for (const source of [...rendus, ...natifs]) {
  for (const code of source.informations) {
    if (vuesInfos.has(code)) continue;
    vuesInfos.add(code);
    const message = expliquerJava(source.genre ?? source.kind, { start: 0, end: 1 })
      .find(i => i.code === code)?.message ?? '';
    l.push('| `' + code + '` | ' + message.replace(/\n/gu, ' ') + ' |');
  }
}
const orphelines = CODES_JAVA.filter(code => !vuesInfos.has(code));
if (orphelines.length > 0) {
  l.push('');
  l.push('Informations écrites et non atteintes par les phrases ci-dessus : '
    + orphelines.map(c => '`' + c + '`').join(', ') + '.');
}
l.push('');
l.push('## 5. Ce que Java-A ne fait pas');
l.push('');
l.push('- **aucune fonctionnalité en avant-première.** Les classes implicites et le `main`');
l.push('  d’instance de Java 21 sont *preview* : le code produit cesserait de compiler. Le');
l.push('  point d’entrée est une classe **explicite** et un `main` **explicite**, commandés ;');
l.push('- **`record`, le `switch` fléché et `var` sont refusés**, parce qu’ils cachent');
l.push('  précisément ce que les domaines concernés enseignent : le constructeur, la');
l.push('  traversée des cas, et le type ;');
l.push('- **aucun `import` n’est ajouté**, et aucun `throws` n’est ajouté à une signature');
l.push('  déjà écrite. Les deux sont des **phrases** ;');
l.push('- **aucun contrôle de visibilité.** Lire un champ `private` depuis une autre classe');
l.push('  est accepté par A et refusé par `javac` ;');
l.push('- **le nom du fichier et le répertoire du paquetage ne sont pas vérifiés.** A informe');
l.push('  et ne renomme rien : un fichier accepté peut ne pas compiler pour une raison qui');
l.push('  n’est pas dans le code.');

writeFileSync(join(racine, 'docs', 'CATALOGUE_JAVA.md'), l.join('\n') + '\n', 'utf8');
console.log('écrit : docs/CATALOGUE_JAVA.md');
console.log('  rendues  : ' + rendus.length);
console.log('  non portées : ' + RAISONS_JAVA.size + ', dont ' + refusIntention.length + ' atteignables');
console.log('  constructions refusées : ' + refusConstruction.length);
console.log('  natives  : ' + natifs.length);
console.log('  informations : ' + vuesInfos.size + ' / ' + CODES_JAVA.length);
console.log('  portées  : ' + PORTEES_JAVA.size + ' intentions partagées portées');
