// Mesure la couche de variantes sur un corpus écrit à la main.
//
//   node scripts/mesurer-corpus.mjs            # résumé + rapport
//   node scripts/mesurer-corpus.mjs --tout     # chaque entrée, avec son verdict
//
// Pourquoi un second corpus : celui de docs/phase2/MESURES_SOUPLESSE.md est
// DÉRIVÉ du catalogue par substitution inverse. Il mesure la combinatoire du
// mécanisme, et il ne peut pas mesurer ce que le mécanisme ignore, puisque
// chacune de ses phrases a été fabriquée pour être reconnue. Celui-ci est
// écrit à la main, hors du catalogue et hors du lexique, et il contient
// exprès des phrases que la couche ne sait pas lire.
//
// Les cinq comptes demandés sont séparés, et la frontière entre « refusée »
// et « acceptée à tort » est posée par une attente écrite AVANT la mesure.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normaliser } from '../src/langue/variantes.ts';

const racine = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const corpus = JSON.parse(readFileSync(join(racine, 'test-utilisateur', 'corpus', 'corpus-libre.json'), 'utf8'));
const tout = process.argv.includes('--tout');

const CLASSES = {
  reconnue: 'formulations naturelles reconnues, au sens attendu',
  refusee: 'formulations compréhensibles mais refusées',
  incompleteRefusee: 'formulations incomplètes, refusées — refus correct',
  ambiguite: 'ambiguïtés correctement détectées',
  acceptee_a_tort: 'instructions incorrectement acceptées',
  sens_different: 'différences de sens introduites par erreur',
  autre: 'verdict inattendu, à instruire',
};

const compte = Object.fromEntries(Object.keys(CLASSES).map(cle => [cle, []]));
const codeDe = resultat => (resultat.fragments[0]?.code ?? '').replace(/\n$/u, '');

for (const entree of corpus.entrees) {
  const verdict = normaliser(entree.phrase);
  const accepte = ['strict', 'normalise', 'resolu'].includes(verdict.verdict);
  const code = accepte ? codeDe(verdict.resultat) : undefined;
  let classe;
  if (entree.attendu === 'accepte') {
    classe = !accepte ? 'refusee' : code === entree.code ? 'reconnue' : 'sens_different';
  } else if (entree.attendu === 'ambigu') {
    classe = accepte ? 'acceptee_a_tort' : verdict.verdict === 'ambigu' ? 'ambiguite' : 'autre';
  } else if (entree.attendu === 'refuse') {
    classe = accepte ? 'acceptee_a_tort'
      : entree.humain === 'incomplete' ? 'incompleteRefusee' : 'refusee';
  } else {
    classe = 'autre';
  }
  compte[classe].push({ ...entree, verdict: verdict.verdict, code, classe });
}

const total = corpus.entrees.length;
const lignes = [];
const dire = texte => { lignes.push(texte); console.log(texte); };

dire('# Phase 2 — mesure de la souplesse sur un corpus écrit à la main');
dire('');
dire('Généré par `node scripts/mesurer-corpus.mjs`. Ne pas éditer à la main.');
dire('');
dire('## Ce que ce corpus est, et ce qu’il n’est pas');
dire('');
for (const ligne of corpus.methode) dire('- ' + ligne);
dire('');
dire('## Les cinq comptes');
dire('');
dire('| Classe | Nombre | Part |');
dire('|---|---|---|');
for (const [cle, titre] of Object.entries(CLASSES)) {
  if (compte[cle].length === 0 && cle === 'autre') continue;
  dire(`| ${titre} | **${compte[cle].length}** | ${(compte[cle].length / total * 100).toFixed(1)} % |`);
}
dire(`| **total** | **${total}** | 100 % |`);
dire('');

const attendues = corpus.entrees.filter(entree => entree.attendu === 'accepte').length;
dire('## Lecture');
dire('');
dire(`- **${compte.reconnue.length} / ${attendues}** des phrases que l’auteur du corpus attendait acceptées le sont, **au sens exact attendu**.`);
dire(`- **${compte.sens_different.length}** différence(s) de sens : une phrase acceptée dont le C produit n’est pas celui attendu. C’est la classe la plus grave, et elle doit rester à zéro.`);
dire(`- **${compte.acceptee_a_tort.length}** instruction(s) acceptée(s) à tort : une phrase que l’attente écrite voulait refusée.`);
dire(`- **${compte.ambiguite.length}** ambiguïté(s) correctement détectée(s) sur ${corpus.entrees.filter(e => e.attendu === 'ambigu').length} attendue(s).`);
dire(`- **${compte.refusee.length}** phrase(s) claires pour un lecteur humain et refusées par C-A : c’est la mesure de l’écart, et c’est le chiffre qui dit où la souplesse s’arrête aujourd’hui.`);
dire(`- **${compte.incompleteRefusee.length}** phrase(s) incomplètes refusées : refus correct, aucune information inventée.`);
dire('');
dire('Une phrase refusée n’est pas un défaut : c’est une capacité absente, et la');
dire('dire ainsi est la seule façon de décider si elle vaut d’être ajoutée.');
dire('');

if (compte.sens_different.length || compte.acceptee_a_tort.length || compte.autre.length) {
  dire('## À instruire');
  dire('');
  for (const cle of ['sens_different', 'acceptee_a_tort', 'autre']) {
    for (const item of compte[cle]) {
      dire(`- \`${cle}\` « ${item.phrase} » → verdict ${item.verdict}`
        + (item.code === undefined ? '' : `, code \`${item.code.replace(/\n/gu, '⏎')}\``)
        + (item.code === undefined || item.attendu !== 'accepte' ? '' : `, attendu \`${String(item.code).replace(/\n/gu, '⏎')}\``));
    }
  }
  dire('');
}

dire('## Les phrases claires que C-A refuse');
dire('');
for (const item of compte.refusee) dire(`- « ${item.phrase} » — ${item.verdict}`);
dire('');

mkdirSync(join(racine, 'docs', 'phase2'), { recursive: true });
writeFileSync(join(racine, 'docs', 'phase2', 'MESURES_CORPUS.md'), lignes.join('\n') + '\n', 'utf8');
console.log('Rapport écrit : docs/phase2/MESURES_CORPUS.md');

if (tout) {
  for (const [cle, items] of Object.entries(compte)) {
    for (const item of items) console.log(`${cle}\t${item.verdict}\t${item.phrase}`);
  }
}

// Le script est un OUTIL de mesure, pas un test : il ne décide pas si un
// chiffre est bon. Il échoue sur les deux seules classes qui sont des défauts
// du mécanisme, pas des limites de périmètre.
if (compte.sens_different.length || compte.acceptee_a_tort.length) {
  console.error('ÉCHEC : ' + (compte.sens_different.length + compte.acceptee_a_tort.length)
    + ' entrée(s) acceptée(s) à tort ou de sens différent.');
  process.exitCode = 1;
}
