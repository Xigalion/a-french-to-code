// Catalogue Python, engendré depuis le moteur.
//
//   node scripts/catalogue-python.mjs
//
// Produit docs/CATALOGUE_PYTHON.md. Comme docs/CATALOGUE.md, rien n'y est
// écrit de mémoire : chaque ligne sort de `translate` puis de
// `rendre(PYTHON, …)`. Un catalogue rédigé à la main se périme en silence,
// et ce projet l'a déjà payé une fois.
//
// Le document dit DEUX choses, et il ne faut pas les confondre :
//   1. les intentions du catalogue C que Python rend aujourd'hui ;
//   2. celles qu'il refuse, avec la raison et la construction native.
//
// Depuis le lot P4, il dit une TROISIÈME chose : les intentions NATIVES
// livrées, celles qui n'existent dans aucun catalogue C. Les autres restent
// proposées dans docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md.
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { translate } from '../src/translate.ts';
import { rendre } from '../src/langages/registre.ts';
import { PYTHON } from '../src/langages/python/langage.ts';
import { expliquerPython } from '../src/langages/python/informations.ts';
import { RAISONS_PYTHON } from '../src/langages/python/raisons.ts';
import { EXEMPLES_NATIFS } from '../src/langages/python/instructions.ts';
import { NATIVES_PYTHON, EN_TETES_NATIFS } from '../src/langages/python/renduNatif.ts';
import { PORTEES_PYTHON } from '../src/langages/python/rendu.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogue = readFileSync(join(racine, 'docs', 'CATALOGUE.md'), 'utf8');
/** Les phrases du catalogue C, dans leur ordre de publication. */
const phrases = catalogue.split('\n').filter(ligne => ligne.startsWith('| `'))
  .map(ligne => /^\| `(.+?)` \|/u.exec(ligne)?.[1]).filter(phrase => phrase !== undefined);

const rendus = [];
const refuses = new Map();
const vues = new Set();
for (const phrase of phrases) {
  const traduction = translate(phrase);
  if (traduction.status !== 'translated') continue;
  const genre = traduction.instruction.kind;
  if (vues.has(genre)) continue;
  vues.add(genre);
  const resultat = rendre(PYTHON, traduction.instruction);
  if (resultat.status === 'rendu') {
    rendus.push({ genre, phrase, code: resultat.code.replace(/\n$/u, '').split('\n').join(' ⏎ '),
      informations: expliquerPython(traduction).map(information => information.code) });
  } else {
    refuses.set(genre, { genre, phrase, code: resultat.code, raison: resultat.raison });
  }
}

// Deux intentions sont PORTEES et pourtant absentes du tableau 1 : la phrase
// d'exemple du catalogue C contient une division. Le compter ici evite que ce
// document et le bilan du lot P3 affichent deux nombres qui se contredisent.
const porteesMaisRefusees = [...refuses.values()].filter(item => PORTEES_PYTHON.has(item.genre));

/** Le catalogue NATIF, engendré depuis les exemples publiés par le moteur. */
const natifs = [];
for (const phrase of EXEMPLES_NATIFS) {
  const resultat = PYTHON.natif(phrase);
  if (resultat === undefined || resultat.status !== 'rendu') {
    console.error('EXEMPLE NATIF NON RENDU : ' + phrase);
    process.exit(1);
  }
  natifs.push({ kind: resultat.kind, phrase,
    code: resultat.code.replace(/\n$/u, '').split('\n').join(' ⏎ '),
    informations: resultat.informations.map(information => information.code) });
}

const L = [];
const dire = texte => L.push(texte);
dire('# Catalogue Python — ce que C-A écrit aujourd’hui');
dire('');
dire('Engendré par `node scripts/catalogue-python.mjs`. **Ne pas éditer à la main.**');
dire('');
dire('> **Ce document n’est pas le catalogue pédagogique de Python.** Il dit ce que');
dire('> les intentions du catalogue **C** deviennent en Python, et ce qu’elles ne');
dire('> deviennent pas. Les intentions **natives** — `range`, `for each`,');
dire('> `enumerate`, les dictionnaires, les ensembles, les méthodes de chaînes,');
dire('> `with`, `match` — n’existent pas encore : elles sont proposées dans');
dire('> `docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md`, et c’est là qu’est le');
dire('> travail pédagogique.');
dire('>');
dire('> État : **lot P3**, branche `phase-2-architecture`. Python n’est pas dans');
dire('> la version publique, et la commande VS Code n’ouvre pas encore de `.py`.');
dire('');
dire('Le symbole ⏎ marque une fin de ligne dans le code produit.');
dire('');
dire(`## 0. Les ${NATIVES_PYTHON.size} intentions NATIVES de Python`);
dire('');
dire(`${natifs.length} formulations pour ${NATIVES_PYTHON.size} intentions : la conversion en`);
dire('compte trois — entier, réel, texte — et c’est une seule intention.');
dire('');
dire('Elles n’existent dans aucun catalogue C, et c’est le catalogue pédagogique');
dire('de Python qui commence ici. **Aucune n’est acceptée par le catalogue');
dire('partagé** : un test le vérifie, sinon elles écriraient aussi du C.');
dire('');
dire('| Phrase française | Python produit | Informations passives |');
dire('|---|---|---|');
for (const item of natifs) {
  dire(`| \`${item.phrase}\` | \`${item.code}\` | ${item.informations.join(', ') || '—'} |`);
}
dire('');
dire(`Intentions natives livrées : **${NATIVES_PYTHON.size}**, dont **${EN_TETES_NATIFS.size}** ouvrent un bloc.`);
dire('Sur les **55** proposées : il en reste **' + (55 - NATIVES_PYTHON.size) + '** à écrire,');
dire('et elles sont détaillées, formulation par formulation, dans');
dire('`docs/phase2/CATALOGUE_NATIF_PYTHON_PROPOSE.md`.');
dire('');
dire(`## 1. Les ${rendus.length} intentions rendues`);
dire('');
dire('| Phrase française | Python produit | Informations passives |');
dire('|---|---|---|');
for (const item of rendus) {
  dire(`| \`${item.phrase}\` | \`${item.code}\` | ${item.informations.join(', ') || '—'} |`);
}
dire('');
dire('**Aucun bloc ne reçoit de corps**, et aucun `pass` n’est écrit : le corps est');
dire('à l’étudiant. Le fichier est donc incomplet — et invalide — jusqu’à ce qu’il');
dire('l’écrive. C’est une différence réelle avec C17, où le bloc fermé laisse le');
dire('fichier compilable.');
dire('');
dire('### Deux intentions portées qui n’apparaissent pas ci-dessus');
dire('');
dire(`Le lot P3 porte **${PORTEES_PYTHON.size}** intentions, et le tableau n’en montre que`);
dire(`**${rendus.length}**. La différence vient de la **phrase d’exemple** du catalogue C,`);
dire('pas de l’intention :');
dire('');
for (const item of porteesMaisRefusees) {
  dire(`- \`${item.genre}\` : l’exemple est \`${item.phrase}\`, et il contient une division.`);
}
dire('');
dire('C’est la même observation qui avait corrigé la mesure de la sonde : le refus');
dire('porte sur `/`, pas sur l’intention. Elles se rendent dès que l’expression n’en');
dire('contient pas.');
dire('');
dire(`## 2. Les ${refuses.size - porteesMaisRefusees.length} intentions refusées`);
dire('');
dire('Un refus n’est pas une interdiction d’enseigner la notion : chaque raison');
dire('nomme la construction **native** qui porte la même compétence. Trois sortes :');
dire('`ATTENTE` (une décision de contrat est ouverte, et elle est nommée),');
dire('`NOTION_ABSENTE` (la notion n’existe pas en Python), `FORME_AUTRE` (elle');
dire('existe sous une autre forme, qui demande ses propres phrases).');
dire('');
dire('| Intention | Phrase française | Sorte | Raison |');
dire('|---|---|---|---|');
for (const item of [...refuses.values()].filter(item => !PORTEES_PYTHON.has(item.genre))
  .sort((a, b) => a.genre.localeCompare(b.genre))) {
  const sorte = item.raison.split(' ')[0];
  const raison = item.raison.replace(/^(ATTENTE[^—]*|NOTION_ABSENTE|FORME_AUTRE) — /u, '');
  dire(`| \`${item.genre}\` | \`${item.phrase}\` | ${sorte} | ${raison} |`);
}
dire('');
dire('## 3. Ce qui est refusé à l’intérieur d’une intention portée');
dire('');
dire('L’intention est portée, mais ce qu’elle contient ne l’est pas. Le registre');
dire('répond alors `CONSTRUCTION_NON_PORTEE`.');
dire('');
dire('| Construction | Pourquoi |');
dire('|---|---|');
const dedans = [
  ['`a / b`', 'En C17, `7 / 2` vaut **3** ; en Python, **3.5**. Décision **D3**, ouverte.'],
  ['`a % b`', 'En C17, `-7 % 2` vaut **-1** ; en Python, **1**. Décision **D13**, ouverte par le lot P3.'],
  ['`&x`, `*p`, `*(t + i)`', 'Python n’a pas de pointeur. L’aliasing d’une liste enseigne la même leçon.'],
  ['`(unsigned int) x`', 'Les entiers Python sont signés et de précision arbitraire ; écrire `int` perdrait l’information donnée.'],
  ['`o.champ`, `o->champ`', 'Décision **D6** : ni structure ni classe au premier jet.'],
  ['un nom réservé en Python', '`lambda`, `None`, `pass` sont des identifiants **C17 valides** : le moteur les accepte, et c’est au langage cible de les refuser.'],
];
for (const [construction, pourquoi] of dedans) dire(`| ${construction} | ${pourquoi} |`);
dire('');
dire('## 4. Vérification');
dire('');
dire(`- intentions du catalogue C balayées : **${vues.size}**`);
dire(`- intentions portées par le lot P3 : **${PORTEES_PYTHON.size}**, dont **${rendus.length}** avec une phrase d’exemple rendable`);
dire(`- intentions non portées : **${refuses.size - porteesMaisRefusees.length}**`);
dire(`- raisons écrites au registre : **${RAISONS_PYTHON.size}**`);
dire(`- intentions natives livrées : **${NATIVES_PYTHON.size}**`);
dire(`- total des intentions que Python sait écrire : **${PORTEES_PYTHON.size + NATIVES_PYTHON.size}**`);
dire('');
dire('La partition est vérifiée par `test/python.test.mjs` : chacune des 84');
dire('intentions est soit rendue, soit refusée avec une raison, jamais les deux,');
dire('et aucune raison ne porte un nom qui n’est pas une intention.');
dire('');

writeFileSync(join(racine, 'docs', 'CATALOGUE_PYTHON.md'), L.join('\n'), 'utf8');
console.log('intentions balayées :', vues.size);
console.log('rendues             :', rendus.length);
console.log('refusées            :', refuses.size);
console.log('natives livrées     :', NATIVES_PYTHON.size);
console.log('rapport             : docs/CATALOGUE_PYTHON.md');
if (vues.size !== rendus.length + refuses.size) {
  console.error('INCOHÉRENCE : la somme ne fait pas le compte.');
  process.exit(1);
}
